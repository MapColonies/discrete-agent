import { join } from 'path';
import { inject, injectable } from 'tsyringe';
import { GeoJSON } from 'geojson';
import retry from 'async-retry';
import { get as readProp } from 'lodash';
import { IngestionParams } from '@map-colonies/mc-model-types';
import { Logger } from '@map-colonies/js-logger';
import { BadRequestError, NotFoundError } from '@map-colonies/error-types';
import { SERVICES } from '../../common/constants';
import { IConfig } from '../../common/interfaces';
import { OverseerClient } from '../../serviceClients/overseerClient';
import { AgentDbClient } from '../../serviceClients/agentDbClient';
import { HistoryStatus } from '../historyStatus';
import { LimitingLock } from '../../watcher/limitingLock';
import { ShpParser } from './shpParser';
import { FilesManager } from './filesManager';
import { MetadataMapper } from './metadataMapper';
import { FileMapper } from './fileMapper';

@injectable()
export class Trigger {
  private readonly mountDir: string;
  private readonly retryOptions: retry.Options;
  private readonly shpFiles = ['Files.shp', 'Files.dbf', 'Product.shp', 'Product.dbf', 'ShapeMetadata.shp', 'ShapeMetadata.dbf'];

  public constructor(
    private readonly shpParser: ShpParser,
    private readonly fileManager: FilesManager,
    private readonly metadataMapper: MetadataMapper,
    private readonly overseerClient: OverseerClient,
    private readonly agentDbClient: AgentDbClient,
    private readonly lock: LimitingLock,
    private readonly fileMapper: FileMapper,
    @inject(SERVICES.LOGGER) private readonly logger: Logger,
    @inject(SERVICES.CONFIG) private readonly config: IConfig
  ) {
    this.mountDir = config.get<string>('mountDir');
    this.retryOptions = config.get<retry.Options>('watcher.shpRetry');
  }

  public async trigger(directory: string, isManual = false): Promise<void> {
    const fullRootDir = this.fileMapper.getRootDir(directory, isManual);
    const directoryExist = this.fileManager.directoryExists(fullRootDir);
    if (!directoryExist) {
      throw new NotFoundError(`directory: ${directory}, doesn't exist`);
    }
    const relativeRootDir = this.fileMapper.cleanRelativePath(this.mountDir, fullRootDir);
    this.logger.debug(`triggering on directory: ${directory}`);
    const status = await this.agentDbClient.getDiscreteStatus(relativeRootDir);
    if (status === undefined) {
      await this.agentDbClient.createDiscreteStatus(relativeRootDir);
    } else if (status.status === HistoryStatus.TRIGGERED || status.status === HistoryStatus.FAILED) {
      if (!isManual) {
        this.logger.debug(`skipping directory ${fullRootDir} its status is ${status.status}`);
        return;
      } else {
        await this.agentDbClient.updateDiscreteStatus(relativeRootDir, HistoryStatus.IN_PROGRESS);
      }
    }
    //check if all shp files exists
    const shpFilesPaths = await this.fileMapper.findFilesRelativePaths(this.shpFiles, fullRootDir);
    if (shpFilesPaths.length === this.shpFiles.length) {
      //map shp file paths
      let filesShp!: string, filesDbf!: string, productShp!: string, productDbf!: string, metadataShp!: string, metadataDbf!: string;
      for (const path of shpFilesPaths) {
        if (path.endsWith(this.shpFiles[0])) {
          filesShp = join(fullRootDir, path);
        } else if (path.endsWith(this.shpFiles[1])) {
          filesDbf = join(fullRootDir, path);
        } else if (path.endsWith(this.shpFiles[2])) {
          productShp = join(fullRootDir, path);
        } else if (path.endsWith(this.shpFiles[3])) {
          productDbf = join(fullRootDir, path);
        } else if (path.endsWith(this.shpFiles[4])) {
          metadataShp = join(fullRootDir, path);
        } else if (path.endsWith(this.shpFiles[5])) {
          metadataDbf = join(fullRootDir, path);
        }
      }
      //read file list
      const filesGeoJson = await this.tryParseShp(filesShp, filesDbf, isManual, fullRootDir);
      if (!filesGeoJson) {
        return;
      }
      const fileNames = this.metadataMapper.parseFilesShpJson(filesGeoJson);
      const files = await this.fileMapper.findFilesRelativePaths(fileNames, fullRootDir);
      if (files.length != fileNames.length) {
        if (isManual) {
          await this.agentDbClient.updateDiscreteStatus(relativeRootDir, HistoryStatus.FAILED);
          throw new BadRequestError('some of the required files are missing');
        }
        return;
      }
      const tfwFileName = readProp(filesGeoJson, "features[0].properties['File Name']") as string;
      const tfwFilePath = await this.fileMapper.getFileFullPath(tfwFileName, 'tfw', fullRootDir, isManual);
      if (tfwFilePath === undefined) {
        if (isManual) {
          await this.agentDbClient.updateDiscreteStatus(relativeRootDir, HistoryStatus.FAILED);
          throw new BadRequestError(`${tfwFileName} tfw is missing`);
        }
        return;
      }
      // parse all data files and convert to model
      const productGeoJson = await this.tryParseShp(productShp, productDbf, isManual, directory);
      const metaDataGeoJson = await this.tryParseShp(metadataShp, metadataDbf, isManual, directory);
      if (!productGeoJson || !metaDataGeoJson) {
        return;
      }
      const tfwFile = await this.fileManager.readAllLines(tfwFilePath);
      const ingestionData: IngestionParams = {
        fileNames: files,
        metadata: await this.metadataMapper.map(productGeoJson, metaDataGeoJson, filesGeoJson, tfwFile),
        originDirectory: relativeRootDir,
      };
      try {
        await this.overseerClient.ingestDiscreteLayer(ingestionData);
        await this.agentDbClient.updateDiscreteStatus(
          relativeRootDir,
          HistoryStatus.TRIGGERED,
          ingestionData.metadata.productId,
          ingestionData.metadata.productVersion
        );
      } catch (err) {
        await this.agentDbClient.updateDiscreteStatus(
          relativeRootDir,
          HistoryStatus.FAILED,
          ingestionData.metadata.productId,
          ingestionData.metadata.productVersion
        );
        if (isManual) {
          throw err;
        }
      }
    } else if (isManual) {
      await this.agentDbClient.updateDiscreteStatus(relativeRootDir, HistoryStatus.FAILED);
      throw new BadRequestError('some of the required shape files are missing');
    }
  }

  private async tryParseShp(shp: string, dbf: string, isManual: boolean, directory: string): Promise<GeoJSON | undefined> {
    const res = await retry(async (bail) => {
      try {
        return await this.shpParser.parse(shp, dbf);
      } catch (err) {
        if (isManual) {
          //throw error to user on manual trigger
          bail(err as Error);
        } else if (this.lock.isQueueEmpty(directory)) {
          //trigger retry only when it was triggered by watcher and it is the last file that was copied to watch dir
          throw err;
        } else {
          //ignore error if new files ware added to target dir after this trigger
          return undefined;
        }
      }
    }, this.retryOptions);
    return res;
  }
}

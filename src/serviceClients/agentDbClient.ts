import { Logger } from '@map-colonies/js-logger';
import { HttpClient, IHttpRetryConfig } from '@map-colonies/mc-utils';
import { HttpError } from '@map-colonies/error-types';
import { IConfig } from 'config';
import { inject, injectable } from 'tsyringe';
import httpStatus from 'http-status-codes';
import { SERVICES } from '../common/constants';
import { IWatchStatus } from '../watchStatus/interfaces';
import { HistoryStatus } from '../layerCreator/historyStatus';
import { ILayerHistory } from '../layerCreator/interfaces';

@injectable()
export class AgentDbClient extends HttpClient {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  public constructor(@inject(SERVICES.LOGGER) protected readonly logger: Logger, @inject(SERVICES.CONFIG) private readonly config: IConfig) {
    const retryConfig = config.get<IHttpRetryConfig>('httpRetry');
    const baseUrl = config.get<string>('agentDB.url');
    super(logger, baseUrl, 'AgentDbService', retryConfig);
  }

  public async getDiscreteStatus(directory: string): Promise<ILayerHistory | undefined> {
    this.logger.debug(`getting history record for  ${directory}`);
    try {
      const encodedDirectory = encodeURIComponent(directory);
      return await this.get(`layers/${encodedDirectory}`);
    } catch (err) {
      const error = err as HttpError;
      if (error.status == httpStatus.NOT_FOUND) {
        return undefined;
      } else {
        this.logger.error(`failed to retrieve history record for ${directory}, error=${error.message}`);
        throw err;
      }
    }
  }

  public async createDiscreteStatus(directory: string): Promise<ILayerHistory> {
    this.logger.info(`creating history record for ${directory}`);
    try {
      const encodedDirectory = encodeURIComponent(directory);
      return await this.post(`layers/${encodedDirectory}`);
    } catch (err) {
      const error = err as Error;
      this.logger.error(`failed to create history record for ${directory}, error=${error.message}`);
      throw err;
    }
  }

  public async updateDiscreteStatus(directory: string, status?: HistoryStatus, id?: string, version?: string): Promise<ILayerHistory> {
    this.logger.info(`Update agent-DB history for ${directory}`);
    try {
      const encodedDirectory = encodeURIComponent(directory);
      const body = {
        status: status,
        id: id,
        version: version,
      };
      return await this.put(`layers/${encodedDirectory}`, body);
    } catch (err) {
      const error = err as Error;
      this.logger.error(`failed to update agent-DB for ${directory}, error=${error.message}`);
      throw err;
    }
  }

  public async getWatchStatus(): Promise<IWatchStatus> {
    try {
      return await this.get('/status');
    } catch (err) {
      const error = err as Error;
      this.logger.error(`failed to retrieve watch status from db, error=${error.message}`);
      throw err;
    }
  }

  public async setWatchStatus(status: IWatchStatus): Promise<IWatchStatus> {
    try {
      this.logger.info(`changing watch status into: ${status.isWatching.toString()}`);
      return await this.put('/status', status);
    } catch (err) {
      const error = err as Error;
      this.logger.error(`failed to retrieve watch status from db, error=${error.message}`);
      throw err;
    }
  }
}

import { Repository, EntityRepository } from 'typeorm';
import { container } from 'tsyringe';
import { Logger } from '@map-colonies/js-logger';
import { InternalServerError } from '@map-colonies/error-types';
import { SERVICES } from '../../common/constants';
import { LayerHistory } from '../entity/layerHistory';

@EntityRepository(LayerHistory)
export class LayerHistoryRepository extends Repository<LayerHistory> {
  private readonly appLogger: Logger; //don't override internal repository logger.

  public constructor() {
    super();
    this.appLogger = container.resolve(SERVICES.LOGGER); //direct injection don't work here due to being initialized by typeOrm
  }

  public async get(directory: string): Promise<LayerHistory | undefined> {
    try {
      return await this.findOne({ directory: directory });
    } catch (err) {
      if (err !== undefined) {
        this.appLogger.error(`get history for "${directory}". error: ${JSON.stringify(err)}`);
        throw new InternalServerError(err as Error, `get history for "${directory}". error: ${JSON.stringify(err)}`);
      }
      return undefined;
    }
  }

  public async upsert(layer: LayerHistory): Promise<LayerHistory> {
    this.appLogger.info(`upserting history for "${layer.directory}".`);
    try {
      return await this.save(layer);
    } catch (err) {
      this.appLogger.error(`failed to upsert history: ${JSON.stringify(layer)}. error: ${JSON.stringify(err)}`);
      throw new InternalServerError(err as Error, `failed to upsert history: ${JSON.stringify(layer)}. error: ${JSON.stringify(err)}`);
    }
  }

  public async exists(directory: string): Promise<boolean> {
    const res = await this.get(directory);
    return res != undefined;
  }
}

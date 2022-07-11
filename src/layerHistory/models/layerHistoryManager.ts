import { inject, injectable } from 'tsyringe';
import { Logger } from '@map-colonies/js-logger';
import { NotFoundError, ConflictError } from '@map-colonies/error-types';
import { SERVICES } from '../../common/constants';
import { ILayerHistoryResponse } from '../interfaces';
import { LayerHistory, ProgressStatus } from '../../DAL/entity/layerHistory';
import { LayerHistoryRepository } from '../../DAL/repositories/layerHistoryRepository';
import { ConnectionManager } from '../../DAL/connectionManager';

@injectable()
export class LayerHistoryManager {
  private repository?: LayerHistoryRepository;

  public constructor(@inject(SERVICES.LOGGER) private readonly logger: Logger, private readonly connectionManager: ConnectionManager) {}

  public async get(directory: string): Promise<ILayerHistoryResponse | undefined> {
    const repository = await this.getRepository();
    const entity = await repository.get(directory);
    if (entity !== undefined) {
      return this.entityToModel(entity);
    } else {
      throw new NotFoundError(`${directory}: Record not found`);
    }
  }

  public async create(directory: string): Promise<ILayerHistoryResponse> {
    const repository = await this.getRepository();
    const exists = await repository.exists(directory);
    if (exists) {
      throw new ConflictError(`${directory}: Record already exists`);
    }
    const layer = new LayerHistory({ directory });
    const entity = await repository.upsert(layer);
    return this.entityToModel(entity);
  }

  public async updateStatus(directory: string, status?: ProgressStatus, id?: string, version?: string): Promise<ILayerHistoryResponse> {
    const repository = await this.getRepository();
    const exists = await repository.exists(directory);
    if (exists) {
      const layer = new LayerHistory({ directory });
      if (status != undefined) {
        layer.status = status;
      }
      if (id != undefined) {
        layer.layerId = id;
      }
      if (version != undefined) {
        layer.version = version;
      }
      const entity = await repository.upsert(layer);
      return this.entityToModel(entity);
    } else {
      throw new NotFoundError(`${directory}: Record not found`);
    }
  }

  private async getRepository(): Promise<LayerHistoryRepository> {
    if (!this.repository) {
      if (!this.connectionManager.isConnected()) {
        await this.connectionManager.init();
      }
      this.repository = this.connectionManager.getLayerHistoryRepository();
    }
    return this.repository;
  }

  private entityToModel(entity: LayerHistory): ILayerHistoryResponse {
    const model: ILayerHistoryResponse = {
      directory: entity.directory,
      id: entity.layerId,
      version: entity.version,
      status: entity.status,
    };
    return model;
  }
}

import { Logger } from '@map-colonies/js-logger';
import { RequestHandler } from 'express';
import httpStatus from 'http-status-codes';
import { injectable, inject } from 'tsyringe';
import { SERVICES } from '../../common/constants';

import { ILayerHistoryResponse, IUpdateLayerHistoryStatusRequestBody } from '../interfaces';
import { LayerHistoryManager } from '../models/layerHistoryManager';

interface ILayerHistoryParams {
  directory: string;
}

type UpdateLayerHistoryHandler = RequestHandler<ILayerHistoryParams, ILayerHistoryResponse, IUpdateLayerHistoryStatusRequestBody>;
type LayerHistoryHandler = RequestHandler<ILayerHistoryParams, ILayerHistoryResponse>;

@injectable()
export class LayerHistoryController {
  public constructor(
    @inject(SERVICES.LOGGER) private readonly logger: Logger,
    @inject(LayerHistoryManager) private readonly manager: LayerHistoryManager
  ) {}

  public getLayerHistory: LayerHistoryHandler = async (req, res, next) => {
    try {
      const layer = await this.manager.get(req.params.directory);
      return res.status(httpStatus.OK).json(layer);
    } catch (err) {
      next(err);
    }
  };

  public createLayerHistory: LayerHistoryHandler = async (req, res, next) => {
    try {
      const layer = await this.manager.create(req.params.directory);
      return res.status(httpStatus.CREATED).json(layer);
    } catch (err) {
      next(err);
    }
  };

  public updateLayerHistoryStatus: UpdateLayerHistoryHandler = async (req, res, next) => {
    try {
      const layer = await this.manager.updateStatus(req.params.directory, req.body.status, req.body.id, req.body.version);
      return res.status(httpStatus.OK).json(layer);
    } catch (err) {
      next(err);
    }
  };
}

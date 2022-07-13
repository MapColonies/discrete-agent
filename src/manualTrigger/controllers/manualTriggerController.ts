import { Logger } from '@map-colonies/js-logger';
import { RequestHandler } from 'express';
import httpStatus from 'http-status-codes';
import { injectable, inject } from 'tsyringe';
import { SERVICES } from '../../common/constants';

import { ManualTriggerManager } from '../models/manualTriggerManager';

interface IManualTriggerParams {
  sourceDirectory: string;
}

type CreateLayerHandler = RequestHandler<undefined, undefined, IManualTriggerParams>;

@injectable()
export class ManualTriggerController {
  public constructor(@inject(SERVICES.LOGGER) private readonly logger: Logger, private readonly manager: ManualTriggerManager) {}

  public createLayer: CreateLayerHandler = async (req, res, next) => {
    try {
      await this.manager.createLayer(req.body.sourceDirectory);
      return res.sendStatus(httpStatus.OK);
    } catch (err) {
      next(err);
    }
  };
}

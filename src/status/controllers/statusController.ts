import { Logger } from '@map-colonies/js-logger';
import { RequestHandler } from 'express';
import httpStatus from 'http-status-codes';
import { injectable, inject } from 'tsyringe';
import { SERVICES } from '../../common/constants';
import { IStatus } from '../interfaces';
import { StatusManager } from '../models/statusManager';

type UpdateStatusHandler = RequestHandler<undefined, IStatus, IStatus>;
type GetStatusHandler = RequestHandler<undefined, IStatus>;

@injectable()
export class StatusController {
  public constructor(@inject(SERVICES.LOGGER) private readonly logger: Logger, @inject(StatusManager) private readonly manager: StatusManager) {}

  public getStatus: GetStatusHandler = async (req, res, next) => {
    try {
      const status = await this.manager.getStatus();
      return res.status(httpStatus.OK).json(status);
    } catch (err) {
      return next(err);
    }
  };

  public updateStatus: UpdateStatusHandler = async (req, res, next) => {
    try {
      const status = await this.manager.updateStatus(req.body);
      return res.status(httpStatus.OK).json(status);
    } catch (err) {
      return next(err);
    }
  };
}

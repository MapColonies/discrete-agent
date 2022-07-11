import jsLogger from '@map-colonies/js-logger';
import { trace } from '@opentelemetry/api';
import httpStatusCodes from 'http-status-codes';
import { container } from 'tsyringe';
import { getApp } from '../../../src/app';
import { SERVICES } from '../../../src/common/constants';
import { IStatus } from '../../../src/status/interfaces';
import { SettingsRepository } from '../../../src/DAL/repositories/settingsRepository';
import { registerRepository, initTypeOrmMocks, findOneMock, saveMock } from '../../mocks/DBMock';
import { SettingsKeys } from '../../../src/common/constants';
import { StatusRequestSender } from './helpers/requestSender';

const watchingSetting = { key: SettingsKeys.IS_WATCHING, value: 'true' };

describe('Status', function () {
  let requestSender: StatusRequestSender;
  beforeEach(() => {
    const app = getApp({
      override: [
        { token: SERVICES.LOGGER, provider: { useValue: jsLogger({ enabled: false }) } },
        { token: SERVICES.TRACER, provider: { useValue: trace.getTracer('testTracer') } },
      ],
      useChild: false,
    });
    requestSender = new StatusRequestSender(app);
    initTypeOrmMocks();
    registerRepository(SettingsRepository, new SettingsRepository());
  });
  afterEach(function () {
    container.clearInstances();
    jest.resetAllMocks();
  });

  describe('Happy Path', function () {
    it('should return 200 status code and the status', async function () {
      findOneMock.mockResolvedValue(watchingSetting);

      const response = await requestSender.getStatus();

      expect(findOneMock).toHaveBeenCalledTimes(1);
      expect(findOneMock).toHaveBeenCalledWith({ key: SettingsKeys.IS_WATCHING });
      expect(response.status).toBe(httpStatusCodes.OK);

      const status = response.body as IStatus;
      expect(status.isWatching).toBe(true);
    });

    it('should return 200 status code and update the status', async function () {
      saveMock.mockResolvedValue(watchingSetting);
      const statusReq: IStatus = {
        isWatching: true,
      };
      const response = await requestSender.updateStatus(statusReq);

      expect(saveMock).toHaveBeenCalledTimes(1);
      expect(saveMock).toHaveBeenCalledWith(watchingSetting);
      expect(response.status).toBe(httpStatusCodes.OK);

      const status = response.body as IStatus;
      expect(status.isWatching).toBe(true);
    });
  });

  describe('Bad Path', function () {
    // All requests with status code of 400
    it('update should return status code 400 on invalid request', async function () {
      const response = await requestSender.updateStatus({ invalid: 'data' } as unknown as IStatus);

      expect(saveMock).toHaveBeenCalledTimes(0);
      expect(response.status).toBe(httpStatusCodes.BAD_REQUEST);
    });
  });

  describe('Sad Path', function () {
    // All requests with status code 4XX-5XX
    it('get should return status code 500 on db error', async function () {
      findOneMock.mockRejectedValue(new Error('test Db error'));

      const response = await requestSender.getStatus();

      expect(findOneMock).toHaveBeenCalledTimes(1);
      expect(response.status).toBe(httpStatusCodes.INTERNAL_SERVER_ERROR);
    });

    it('update should return status code 500 on db error', async function () {
      saveMock.mockRejectedValue(new Error('test Db error'));
      const statusReq: IStatus = {
        isWatching: true,
      };

      const response = await requestSender.updateStatus(statusReq);

      expect(saveMock).toHaveBeenCalledTimes(1);
      expect(response.status).toBe(httpStatusCodes.INTERNAL_SERVER_ERROR);
    });
  });
});

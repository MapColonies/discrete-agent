import jsLogger from '@map-colonies/js-logger';
import { trace } from '@opentelemetry/api';
import httpStatusCodes from 'http-status-codes';
import { container } from 'tsyringe';
import { getApp } from '../../../src/app';
import { SERVICES } from '../../../src/common/constants';
import { LayerHistoryRepository } from '../../../src/DAL/repositories/layerHistoryRepository';
import { registerRepository, initTypeOrmMocks, findOneMock, saveMock } from '../../mocks/DBMock';
import { ILayerHistoryResponse } from '../../../src/layerHistory/interfaces';
import { LayerHistory, ProgressStatus } from '../../../src/DAL/entity/layerHistory';
import { LayerHistoryRequestSender } from './helpers/requestSender';

//test data
const historyIdentifier = '1/1';
const inProgressHistoryResponse: ILayerHistoryResponse = {
  directory: '1/1',
  id: '7c737f81-705e-4455-83e5-83107abcf2e9',
  version: 'testVersion',
  status: ProgressStatus.IN_PROGRESS,
};
const triggeredHistoryResponse: ILayerHistoryResponse = {
  directory: '1/1',
  id: '7c737f81-705e-4455-83e5-83107abcf2e9',
  version: 'testVersion',
  status: ProgressStatus.TRIGGERED,
};
const newInProgressHistoryRecord = new LayerHistory({
  directory: '1/1',
});
const inProgressHistoryRecord = new LayerHistory({
  directory: '1/1',
  layerId: '7c737f81-705e-4455-83e5-83107abcf2e9',
  version: 'testVersion',
  status: ProgressStatus.IN_PROGRESS,
});
const triggeredHistoryRecord = new LayerHistory({
  directory: '1/1',
  layerId: '7c737f81-705e-4455-83e5-83107abcf2e9',
  version: 'testVersion',
  status: ProgressStatus.TRIGGERED,
});
const findRequest = {
  directory: '1/1',
};

describe('LayerHistory', function () {
  let requestSender: LayerHistoryRequestSender;
  beforeEach(() => {
    const app = getApp({
      override: [
        { token: SERVICES.LOGGER, provider: { useValue: jsLogger({ enabled: false }) } },
        { token: SERVICES.TRACER, provider: { useValue: trace.getTracer('testTracer') } },
      ],
      useChild: false,
    });
    requestSender = new LayerHistoryRequestSender(app);
    initTypeOrmMocks();
    registerRepository(LayerHistoryRepository, new LayerHistoryRepository());
  });
  afterEach(function () {
    container.clearInstances();
    jest.resetAllMocks();
  });

  describe('Happy Path', function () {
    it('get should return 200 status code and the history', async function () {
      findOneMock.mockResolvedValue(inProgressHistoryRecord);

      const response = await requestSender.getHistory(historyIdentifier);

      expect(response.status).toBe(httpStatusCodes.OK);
      expect(response.body).toEqual(inProgressHistoryResponse);
      expect(findOneMock).toHaveBeenCalledTimes(1);
      expect(findOneMock).toHaveBeenCalledWith(findRequest);
    });

    it('update should return 200 status code and update the history', async function () {
      saveMock.mockResolvedValue(triggeredHistoryRecord);
      findOneMock.mockResolvedValue(inProgressHistoryRecord);

      const response = await requestSender.updateHistoryStatus(historyIdentifier, {
        id: '7c737f81-705e-4455-83e5-83107abcf2e9',
        version: 'testVersion',
        status: ProgressStatus.TRIGGERED,
      });

      expect(response.status).toBe(httpStatusCodes.OK);
      expect(response.body).toEqual(triggeredHistoryResponse);
      expect(saveMock).toHaveBeenCalledTimes(1);
      expect(saveMock).toHaveBeenCalledWith(triggeredHistoryRecord);
      expect(findOneMock).toHaveBeenCalledTimes(1);
      expect(findOneMock).toHaveBeenCalledWith(findRequest);
    });

    it('create should return 201 status code and create history', async function () {
      saveMock.mockResolvedValue(inProgressHistoryRecord);
      findOneMock.mockResolvedValue(undefined);

      const response = await requestSender.createHistory(historyIdentifier);

      expect(response.status).toBe(httpStatusCodes.CREATED);
      expect(response.body).toEqual(inProgressHistoryResponse);
      expect(saveMock).toHaveBeenCalledTimes(1);
      expect(saveMock).toHaveBeenCalledWith(newInProgressHistoryRecord);
      expect(findOneMock).toHaveBeenCalledTimes(1);
      expect(findOneMock).toHaveBeenCalledWith(findRequest);
    });
  });

  describe('Bad Path', function () {
    // All requests with status code of 400
    it('update should return 400 status code when given invalid data', async function () {
      const response = await requestSender.updateHistoryStatus(historyIdentifier, {
        status: 'invalid state',
      });

      expect(response.status).toBe(httpStatusCodes.BAD_REQUEST);
      expect(saveMock).toHaveBeenCalledTimes(0);
      expect(findOneMock).toHaveBeenCalledTimes(0);
    });
  });

  describe('Sad Path', function () {
    // All requests with status code 4XX-5XX
    it('get should return 404 status code when given none existing id', async function () {
      findOneMock.mockResolvedValue(undefined);
      const response = await requestSender.getHistory(historyIdentifier);

      expect(response.status).toBe(httpStatusCodes.NOT_FOUND);
      expect(saveMock).toHaveBeenCalledTimes(0);
      expect(findOneMock).toHaveBeenCalledTimes(1);
      expect(findOneMock).toHaveBeenCalledWith(findRequest);
    });

    it('update should return 404 status code when given none existing id', async function () {
      findOneMock.mockResolvedValue(undefined);
      const response = await requestSender.updateHistoryStatus(historyIdentifier, {
        status: ProgressStatus.TRIGGERED,
      });

      expect(response.status).toBe(httpStatusCodes.NOT_FOUND);
      expect(saveMock).toHaveBeenCalledTimes(0);
      expect(findOneMock).toHaveBeenCalledTimes(1);
      expect(findOneMock).toHaveBeenCalledWith(findRequest);
    });

    it('create should return 409 status code when given existing id', async function () {
      findOneMock.mockResolvedValue(inProgressHistoryRecord);
      const response = await requestSender.createHistory(historyIdentifier);

      expect(response.status).toBe(httpStatusCodes.CONFLICT);
      expect(saveMock).toHaveBeenCalledTimes(0);
      expect(findOneMock).toHaveBeenCalledTimes(1);
      expect(findOneMock).toHaveBeenCalledWith(findRequest);
    });

    it('get should return 500 status on db error', async function () {
      findOneMock.mockRejectedValue(new Error('test db error'));

      const response = await requestSender.getHistory(historyIdentifier);

      expect(response.status).toBe(httpStatusCodes.INTERNAL_SERVER_ERROR);
      expect(saveMock).toHaveBeenCalledTimes(0);
      expect(findOneMock).toHaveBeenCalledTimes(1);
      expect(findOneMock).toHaveBeenCalledWith(findRequest);
    });

    it('update should return 500 status on find db error', async function () {
      findOneMock.mockRejectedValue({ name: 'DUMMY_DB_ERROR', message: 'DUMMY DB ERROR' });

      const response = await requestSender.updateHistoryStatus(historyIdentifier, {
        status: ProgressStatus.TRIGGERED,
      });

      expect(response.status).toBe(httpStatusCodes.INTERNAL_SERVER_ERROR);
      expect(saveMock).toHaveBeenCalledTimes(0);
      expect(findOneMock).toHaveBeenCalledTimes(1);
      expect(findOneMock).toHaveBeenCalledWith(findRequest);
    });

    it('update should return 500 status on save db error', async function () {
      findOneMock.mockResolvedValue(inProgressHistoryRecord);
      saveMock.mockRejectedValue(new Error('test db error'));

      const response = await requestSender.updateHistoryStatus(historyIdentifier, {
        status: ProgressStatus.TRIGGERED,
      });

      expect(response.status).toBe(httpStatusCodes.INTERNAL_SERVER_ERROR);
      expect(saveMock).toHaveBeenCalledTimes(1);
      expect(findOneMock).toHaveBeenCalledTimes(1);
      expect(findOneMock).toHaveBeenCalledWith(findRequest);
    });

    it('create should return 500 status on find db error', async function () {
      findOneMock.mockRejectedValue(new Error('test db error'));

      const response = await requestSender.createHistory(historyIdentifier);

      expect(response.status).toBe(httpStatusCodes.INTERNAL_SERVER_ERROR);
      expect(saveMock).toHaveBeenCalledTimes(0);
      expect(findOneMock).toHaveBeenCalledTimes(1);
      expect(findOneMock).toHaveBeenCalledWith(findRequest);
    });

    it('create should return 500 status on save db error', async function () {
      findOneMock.mockResolvedValue(undefined);
      saveMock.mockRejectedValue(new Error('test db error'));

      const response = await requestSender.createHistory(historyIdentifier);

      expect(response.status).toBe(httpStatusCodes.INTERNAL_SERVER_ERROR);
      expect(saveMock).toHaveBeenCalledTimes(1);
      expect(findOneMock).toHaveBeenCalledTimes(1);
      expect(findOneMock).toHaveBeenCalledWith(findRequest);
    });
  });
});

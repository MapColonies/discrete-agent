import jsLogger from '@map-colonies/js-logger';
import { NotFoundError, ConflictError } from '@map-colonies/error-types';
import { ConnectionManager } from '../../../../src/DAL/connectionManager';
import { LayerHistory, ProgressStatus } from '../../../../src/DAL/entity/layerHistory';
import { ILayerHistoryResponse } from '../../../../src/layerHistory/interfaces';
import { LayerHistoryManager } from '../../../../src/layerHistory/models/layerHistoryManager';

let layerHistoryManager: LayerHistoryManager;

//db mock
const isConnectedMock = jest.fn();
const initMock = jest.fn();
const getLayerHistoryRepository = jest.fn();
const connectionManagerMock = {
  isConnected: isConnectedMock,
  init: initMock,
  getLayerHistoryRepository: getLayerHistoryRepository,
} as unknown as ConnectionManager;
const getMock = jest.fn();
const upsertMock = jest.fn();
const existsMock = jest.fn();
const repositoryMock = {
  get: getMock,
  upsert: upsertMock,
  exists: existsMock,
};

//test data
const historyIdentifier = '1/1';
const newInProgressHistoryResponse: ILayerHistoryResponse = {
  directory: historyIdentifier,
  status: ProgressStatus.IN_PROGRESS,
};

const triggeredHistoryResponse: ILayerHistoryResponse = {
  directory: historyIdentifier,
  id: 'testId',
  version: 'testVersion',
  status: ProgressStatus.TRIGGERED,
};

const newInProgressHistoryRecord = new LayerHistory({ directory: historyIdentifier, status: ProgressStatus.IN_PROGRESS });
const triggeredHistoryRecord = new LayerHistory({
  directory: historyIdentifier,
  layerId: 'testId',
  version: 'testVersion',
  status: ProgressStatus.TRIGGERED,
});

const setTriggeredHistoryRecord = new LayerHistory({
  directory: historyIdentifier,
  status: ProgressStatus.TRIGGERED,
});

describe('LayerHistoryManager', () => {
  beforeEach(function () {
    jest.resetAllMocks();
    getLayerHistoryRepository.mockReturnValue(repositoryMock);
    layerHistoryManager = new LayerHistoryManager(jsLogger({ enabled: false }), connectionManagerMock);
  });

  describe('getLayerHistory', () => {
    it('returns layer history when exists', async function () {
      getMock.mockResolvedValue(triggeredHistoryRecord);
      // action
      const resource = await layerHistoryManager.get(historyIdentifier);

      // expectation
      expect(resource).toEqual(triggeredHistoryResponse);
      expect(getMock).toHaveBeenCalledTimes(1);
      expect(getMock).toHaveBeenCalledWith(historyIdentifier);
    });

    it('throws error when not exists', async function () {
      getMock.mockResolvedValue(undefined);
      // action
      const action = async () => {
        await layerHistoryManager.get(historyIdentifier);
      };

      // expectation
      await expect(action).rejects.toThrow(NotFoundError);
      expect(getMock).toHaveBeenCalledTimes(1);
      expect(getMock).toHaveBeenCalledWith(historyIdentifier);
    });
  });

  describe('updateHistoryStatus', () => {
    it('progress status is updated and returned', async function () {
      existsMock.mockResolvedValue(true);
      upsertMock.mockResolvedValue(triggeredHistoryRecord);
      // action
      const resource = await layerHistoryManager.updateStatus(historyIdentifier, ProgressStatus.TRIGGERED);

      // expectation
      expect(resource).toEqual(triggeredHistoryResponse);
      expect(upsertMock).toHaveBeenCalledWith(setTriggeredHistoryRecord);
      expect(upsertMock).toHaveBeenCalledTimes(1);
      expect(existsMock).toHaveBeenCalledTimes(1);
    });

    it('error is thrown when updating none existing history', async function () {
      existsMock.mockResolvedValue(false);
      // action
      const action = async () => {
        await layerHistoryManager.updateStatus(historyIdentifier, ProgressStatus.TRIGGERED);
      };
      // expectation
      await expect(action).rejects.toThrow(NotFoundError);
      expect(upsertMock).toHaveBeenCalledTimes(0);
      expect(existsMock).toHaveBeenCalledTimes(1);
    });
  });

  describe('CreateHistory', () => {
    it('history is created and returned', async function () {
      existsMock.mockResolvedValue(false);
      upsertMock.mockResolvedValue(newInProgressHistoryRecord);
      // action
      const resource = await layerHistoryManager.create(historyIdentifier);

      // expectation
      expect(resource).toEqual(newInProgressHistoryResponse);
      expect(upsertMock).toHaveBeenCalledWith({ directory: historyIdentifier });
      expect(upsertMock).toHaveBeenCalledTimes(1);
      expect(existsMock).toHaveBeenCalledTimes(1);
    });

    it('error is thrown when trying to create existing history', async function () {
      existsMock.mockResolvedValue(true);
      // action
      const action = async () => {
        await layerHistoryManager.create(historyIdentifier);
      };
      // expectation
      await expect(action).rejects.toThrow(ConflictError);
      expect(upsertMock).toHaveBeenCalledTimes(0);
      expect(existsMock).toHaveBeenCalledTimes(1);
    });
  });
});

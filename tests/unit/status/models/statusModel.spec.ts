import jsLogger from '@map-colonies/js-logger';
import { SettingsKeys } from '../../../../src/common/constants';
import { ConnectionManager } from '../../../../src/DAL/connectionManager';
import { StatusManager } from '../../../../src/status/models/statusManager';

let statusManager: StatusManager;
//db mock
const isConnectedMock = jest.fn();
const initMock = jest.fn();
const getSettingsRepositoryMock = jest.fn();
const connectionManagerMock = {
  isConnected: isConnectedMock,
  init: initMock,
  getSettingsRepository: getSettingsRepositoryMock,
} as unknown as ConnectionManager;
const getSettingMock = jest.fn();
const upsertSettingMock = jest.fn();
const repositoryMock = {
  get: getSettingMock,
  upsert: upsertSettingMock,
};

//test data
const watchingStetting = {
  key: SettingsKeys.IS_WATCHING,
  value: 'true',
};
const notWatchingSetting = {
  key: SettingsKeys.IS_WATCHING,
  value: 'false',
};
const watchingState = {
  isWatching: true,
};
const notWatchingState = {
  isWatching: false,
};

describe('StatusManager', () => {
  beforeEach(function () {
    jest.resetAllMocks();
    getSettingsRepositoryMock.mockReturnValue(repositoryMock);
    statusManager = new StatusManager(jsLogger({ enabled: false }), connectionManagerMock);
  });

  describe('getStatus', () => {
    it('returns true when watching', async function () {
      getSettingMock.mockResolvedValue(watchingStetting);
      // action
      const resource = await statusManager.getStatus();

      // expectation
      expect(resource.isWatching).toBe(true);
    });

    it('returns false when not watching', async function () {
      getSettingMock.mockResolvedValue(notWatchingSetting);
      // action
      const resource = await statusManager.getStatus();

      // expectation
      expect(resource.isWatching).toBe(false);
    });

    it('returns false when not configured', async function () {
      // action
      const resource = await statusManager.getStatus();

      // expectation
      expect(resource.isWatching).toBe(false);
    });
  });

  describe('updateStatus', () => {
    it('watching status is updated and returned when set to true', async function () {
      upsertSettingMock.mockResolvedValue(watchingStetting);
      // action
      const resource = await statusManager.updateStatus(watchingState);

      // expectation
      expect(resource.isWatching).toBe(true);
      expect(upsertSettingMock).toHaveBeenCalledWith(watchingStetting);
      expect(upsertSettingMock).toHaveBeenCalledTimes(1);
    });

    it('watching status is updated and returned when set to false', async function () {
      upsertSettingMock.mockResolvedValue(notWatchingSetting);
      // action
      const resource = await statusManager.updateStatus(notWatchingState);

      // expectation
      expect(resource.isWatching).toBe(false);
      expect(upsertSettingMock).toHaveBeenCalledWith(notWatchingSetting);
      expect(upsertSettingMock).toHaveBeenCalledTimes(1);
    });
  });
});

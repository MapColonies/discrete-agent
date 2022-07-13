import fs from 'fs';
import httpStatusCodes from 'http-status-codes';
import { container } from 'tsyringe';
import { getWatchStatusMock, setWatchStatusMock } from '../../mocks/clients/agentDbClient';
import { Watcher } from '../../../src/watcher/watcher';
import { directoryExistsMock } from '../../mocks/filesManager';
import { getApp } from '../../../src/app';
import { getContainerConfig, resetContainer } from '../testContainerConfig';
import { WatchStatusRequestSender } from './helpers/requestSender';

interface StatusResponse {
  isWatching: boolean;
}
let mkdirSyncSpy: jest.SpyInstance;
describe('watchStatus', function () {
  const internalStartWatchMock = jest.fn();
  let watcherStatus: { watching: boolean };
  let watcher: Watcher;
  let requestSender: WatchStatusRequestSender;

  beforeAll(function () {
    mkdirSyncSpy = jest.spyOn(fs, 'mkdirSync');
    mkdirSyncSpy.mockImplementation(() => undefined);
    container.clearInstances();
  });

  beforeEach(function () {
    const app = getApp({
      override: [...getContainerConfig()],
      useChild: true,
    });
    watcher = container.resolve(Watcher);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any,@typescript-eslint/no-unsafe-member-access
    (watcher as any).internalStartWatch = internalStartWatchMock;
    watcherStatus = watcher as unknown as { watching: boolean };
    requestSender = new WatchStatusRequestSender(app);
    internalStartWatchMock.mockImplementation(() => {
      watcherStatus.watching = true;
    });
    directoryExistsMock.mockReturnValue(true);
  });

  afterEach(function () {
    resetContainer();
    mkdirSyncSpy.mockClear();
    directoryExistsMock.mockReset();
    getWatchStatusMock.mockReset();
    setWatchStatusMock.mockReset();
    internalStartWatchMock.mockReset();
  });

  describe('Happy Path', function () {
    it('status should return watching true when watching', async function () {
      watcherStatus.watching = true;

      const response = await requestSender.getStatus();
      expect(response).toSatisfyApiSpec();
      const body = response.body as StatusResponse;

      expect(response.status).toBe(httpStatusCodes.OK);
      expect(body.isWatching).toBe(true);
    });

    it('status should return watching false when not watching', async function () {
      watcherStatus.watching = false;

      const response = await requestSender.getStatus();
      expect(response).toSatisfyApiSpec();
      const body = response.body as StatusResponse;

      expect(response.status).toBe(httpStatusCodes.OK);
      expect(body.isWatching).toBe(false);
    });

    it('start should start watcher when not watching', async function () {
      watcherStatus.watching = false;
      setWatchStatusMock.mockResolvedValue({ isWatching: true });
      getWatchStatusMock.mockImplementation(() => {
        return {
          isWatching: watcherStatus.watching,
        };
      });

      const response = await requestSender.startWatching();
      expect(response).toSatisfyApiSpec();
      const body = response.body as StatusResponse;

      expect(response.status).toBe(httpStatusCodes.OK);
      expect(body.isWatching).toBe(true);
      expect(internalStartWatchMock).toHaveBeenCalledTimes(1);
      expect(watcherStatus.watching).toBe(true);
      expect(setWatchStatusMock).toHaveBeenCalledWith({ isWatching: true });
    });

    it('start should not start watcher when already watching', async function () {
      watcherStatus.watching = true;

      const response = await requestSender.startWatching();
      expect(response).toSatisfyApiSpec();
      const body = response.body as StatusResponse;

      expect(response.status).toBe(httpStatusCodes.OK);
      expect(body.isWatching).toBe(true);
      expect(internalStartWatchMock).toHaveBeenCalledTimes(0);
      expect(setWatchStatusMock).toHaveBeenCalledTimes(1);
    });

    it('stop should stop watcher when watching', async function () {
      watcherStatus.watching = true;
      getWatchStatusMock.mockResolvedValue({ isWatching: true });
      setWatchStatusMock.mockResolvedValue({ isWatching: false });

      const response = await requestSender.stopWatching();
      expect(response).toSatisfyApiSpec();
      const body = response.body as StatusResponse;

      expect(response.status).toBe(httpStatusCodes.OK);
      expect(body.isWatching).toBe(false);
      expect(watcherStatus.watching).toBe(false);
      expect(setWatchStatusMock).toHaveBeenCalledWith({ isWatching: false });
    });
  });
  describe('Bad Path', function () {
    // All requests with status code of 400
  });
  describe('Sad Path', function () {
    // All requests with status code 4XX-5XX
  });
});

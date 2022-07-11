import { normalize, join as joinPath } from 'path';
import fs from 'fs';
import { container } from 'tsyringe';
import axiosMock from 'jest-mock-axios';
import httpStatusCodes from 'http-status-codes';
import { getApp } from '../../../src/app';
import { init as initFs } from '../../mocks/fs/opendir';
import { fullFs, withoutProductDbf, withoutTfw, withoutTiff } from '../../mockData/fs';
import { tfw } from '../../mockData/tfw';
import { directoryExistsMock, fileExistsMock, readAllLinesMock } from '../../mocks/filesManager';
import { initShapeFileMock } from '../../mocks/shapeFile';
import { getContainerConfig, resetContainer } from '../testContainerConfig';
import { ManualTriggerRequestSender } from './helpers/requestSender';

jest.mock('axios', () => axiosMock);

let mkdirSyncSpy: jest.SpyInstance;
describe('manualTrigger', function () {
  const layerRootDir = normalize('/layerSources/testDir');
  const expectedTfw = joinPath(layerRootDir, 'a', 'pyramid0_1', 'layer', 'X1881_Y1730.tfw');
  let requestSender: ManualTriggerRequestSender;

  beforeAll(function () {
    mkdirSyncSpy = jest.spyOn(fs, 'mkdirSync');
    mkdirSyncSpy.mockImplementation(() => undefined);
    container.clearInstances();
  });

  beforeEach(function () {
    initShapeFileMock();
    const app = getApp({
      override: [...getContainerConfig()],
      useChild: true,
    });
    requestSender = new ManualTriggerRequestSender(app);
    directoryExistsMock.mockReturnValue(true);
  });

  afterEach(function () {
    resetContainer();
    axiosMock.reset();
    mkdirSyncSpy.mockClear();
    directoryExistsMock.mockReset();
    fileExistsMock.mockReset();
    readAllLinesMock.mockReset();
  });

  describe('Happy Path', function () {
    it('should return 200 status code when triggered on layer root dir', async function () {
      initFs(fullFs);
      axiosMock.post.mockResolvedValue({});
      readAllLinesMock.mockResolvedValue(tfw);
      const validRequest = {
        sourceDirectory: 'testDir',
      };

      const response = await requestSender.createLayer(validRequest);
      expect(response).toSatisfyApiSpec();

      expect(response.status).toBe(httpStatusCodes.OK);
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      const calledTfw = readAllLinesMock.mock.calls[0][0] as string;
      expect(calledTfw.endsWith(expectedTfw)).toBe(true);
    });
  });

  describe('Bad Path', function () {
    // All requests with status code of 400
    it('should return 400 status code', async function () {
      const invalidRequest = {
        directory: 'testDir',
      };

      const response = await requestSender.createLayer(invalidRequest);
      expect(response).toSatisfyApiSpec();

      expect(response.status).toBe(httpStatusCodes.BAD_REQUEST);
    });

    it('should return 400 when tiff files are missing', async () => {
      initFs(withoutTiff);
      axiosMock.post.mockResolvedValue({});
      const validRequest = {
        sourceDirectory: 'testDir',
      };

      const response = await requestSender.createLayer(validRequest);
      expect(response).toSatisfyApiSpec();

      expect(response.status).toBe(httpStatusCodes.BAD_REQUEST);
    });

    it('should return 400 when shp files are missing', async () => {
      initFs(withoutProductDbf);
      axiosMock.post.mockResolvedValue({});
      const validRequest = {
        sourceDirectory: 'testDir',
      };

      const response = await requestSender.createLayer(validRequest);
      expect(response).toSatisfyApiSpec();

      expect(response.status).toBe(httpStatusCodes.BAD_REQUEST);
    });

    it('should return 400 when first tfw file are missing', async () => {
      initFs(withoutTfw);
      axiosMock.post.mockResolvedValue({});
      fileExistsMock.mockResolvedValue(false);
      const validRequest = {
        sourceDirectory: 'testDir',
      };

      const response = await requestSender.createLayer(validRequest);
      expect(response).toSatisfyApiSpec();

      expect(response.status).toBe(httpStatusCodes.BAD_REQUEST);
    });

    it('should return 400 status code when triggered on layer Shapes dir', async function () {
      initFs(fullFs);
      axiosMock.post.mockResolvedValue({});
      readAllLinesMock.mockResolvedValue(tfw);
      const validRequest = {
        sourceDirectory: 'testDir/Shapes',
      };

      const response = await requestSender.createLayer(validRequest);
      expect(response).toSatisfyApiSpec();

      expect(response.status).toBe(httpStatusCodes.BAD_REQUEST);
    });

    it('should return 400 status code when triggered on layer tiff dir', async function () {
      initFs(fullFs);
      axiosMock.post.mockResolvedValue({});
      readAllLinesMock.mockResolvedValue(tfw);
      const validRequest = {
        sourceDirectory: 'testDir/tiff',
      };

      const response = await requestSender.createLayer(validRequest);
      expect(response).toSatisfyApiSpec();

      expect(response.status).toBe(httpStatusCodes.BAD_REQUEST);
    });
  });

  describe('Sad Path', function () {
    it('should return 404 status code when triggered on invalid dir path', async function () {
      initFs(fullFs);
      directoryExistsMock.mockReturnValue(false);
      axiosMock.post.mockResolvedValue({});
      readAllLinesMock.mockResolvedValue(tfw);
      const validRequest = {
        sourceDirectory: 'testDir',
      };

      const response = await requestSender.createLayer(validRequest);
      expect(response).toSatisfyApiSpec();
      expect(response.status).toBe(httpStatusCodes.NOT_FOUND);
    });
  });
});

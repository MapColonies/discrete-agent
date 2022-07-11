import { normalize } from 'path';
import jsLogger from '@map-colonies/js-logger';
import { FileMapper } from '../../../../src/layerCreator/models/fileMapper';
import { configMock, registerDefaultConfig } from '../../../mocks/config';
import { dirWalkerMock, findFileMock } from '../../../mocks/dirWalker';

describe('FileMapper', () => {
  const watchDirMock = '/layerSources/watch';
  beforeEach(() => {
    registerDefaultConfig();
  });

  describe('getFilePath', () => {
    it('returns file name and extension when not mapped', () => {
      const fileMapper = new FileMapper(configMock, jsLogger({ enabled: false }), watchDirMock, dirWalkerMock);

      // action
      const cleanPath = fileMapper.getFilePath('test', 'a');

      // expectation
      expect(cleanPath).toBe('test.a');
    });

    it('returns file path when mapped', () => {
      const fileMapper = new FileMapper(configMock, jsLogger({ enabled: false }), watchDirMock, dirWalkerMock);
      const mappings = (fileMapper as unknown as { fileMappings: Record<string, unknown> }).fileMappings;
      mappings['test'] = {
        fileExtension: 'ext',
      };

      // action
      const cleanPath = fileMapper.getFilePath('test', 'test');

      // expectation
      expect(cleanPath).toBe('test.ext');
    });
  });

  describe('getRootDir', () => {
    it('returns discrete root path on manual trigger', () => {
      const fileMapper = new FileMapper(configMock, jsLogger({ enabled: false }), watchDirMock, dirWalkerMock);

      const root = fileMapper.getRootDir('a/b/c', true);

      expect(root.endsWith(normalize('/layerSources/a/b/c'))).toBe(true);
    });

    it('returns discrete root path on auto trigger', () => {
      const fileMapper = new FileMapper(configMock, jsLogger({ enabled: false }), watchDirMock, dirWalkerMock);

      const root = fileMapper.getRootDir('/layerSources/watch/a/b/c', false);

      expect(root.endsWith(normalize('/layerSources/watch/a'))).toBe(true);
    });
  });

  describe('getFileFullPath', () => {
    it('searches the correct file', async () => {
      const fileMapper = new FileMapper(configMock, jsLogger({ enabled: false }), watchDirMock, dirWalkerMock);

      await fileMapper.getFileFullPath('file', 'Tiff', '/layerSources/watch/a/b/c');

      expect(findFileMock).toHaveBeenCalledTimes(1);

      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      const root = findFileMock.mock.calls[0][0] as string;
      expect(root.endsWith(normalize('/layerSources/watch/a'))).toBe(true);

      const expectedMatcher = process.platform === 'win32' ? /.*\\file\.tif/ : /.*\/file\.tif/;
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      expect(findFileMock.mock.calls[0][1]).toEqual(expectedMatcher);
    });
  });
});

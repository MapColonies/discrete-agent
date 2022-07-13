import { readFileSync } from 'fs';
import { resolve } from 'path';
import { trace } from '@opentelemetry/api';
import jsLogger from '@map-colonies/js-logger';
import { container } from 'tsyringe';
import { SERVICES } from '../../src/common/constants';
import { FilesManager } from '../../src/layerCreator/models/filesManager';
import { AgentDbClient } from '../../src/serviceClients/agentDbClient';
import {
  directoryExistsMock,
  fileExistsMock,
  filesManagerMock,
  readAllLinesMock,
  readAsStringMock,
  readAsStringSyncMock,
  readS3ObjectAsStringMock,
} from '../mocks/filesManager';
import { agentDbClientMock, init as initDb } from '../mocks/clients/agentDbClient';
import { configMock, registerDefaultConfig, getMock, hasMock } from '../mocks/config';
import { InjectionObject } from '../../src/common/dependencyRegistration';
import { opendirMock } from '../mocks/fs/opendir';

function getContainerConfig(): InjectionObject<unknown>[] {
  initDb();
  registerDefaultConfig();
  loadClassifierData();

  return [
    { token: SERVICES.LOGGER, provider: { useValue: jsLogger({ enabled: false }) } },
    { token: SERVICES.WATCHER_CONFIG, provider: { useValue: '/layerSources/testDir/watch' } },
    { token: SERVICES.CONFIG, provider: { useValue: configMock } },
    { token: FilesManager, provider: { useValue: filesManagerMock } },
    { token: AgentDbClient, provider: { useValue: agentDbClientMock } },
    { token: SERVICES.TRACER, provider: { useValue: trace.getTracer('testTracer') } },
  ];
}
const resetContainer = (clearInstances = true): void => {
  if (clearInstances) {
    container.clearInstances();
  }

  getMock.mockReset();
  hasMock.mockReset();
  opendirMock.mockReset();
  readAllLinesMock.mockReset();
  fileExistsMock.mockReset();
  directoryExistsMock.mockReset();
  readAsStringMock.mockReset();
  readAsStringSyncMock.mockReset();
  readS3ObjectAsStringMock.mockReset();
};

function loadClassifierData(): void {
  const classificationConfigPath = resolve(__dirname, '../mockData/classification.json');
  const classificationConfig = readFileSync(classificationConfigPath, { encoding: 'utf8' });
  readAsStringMock.mockResolvedValue(classificationConfig);
  readS3ObjectAsStringMock.mockResolvedValue(classificationConfig);
}

export { getContainerConfig, resetContainer };

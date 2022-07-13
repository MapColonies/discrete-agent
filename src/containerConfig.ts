import { join } from 'path';
import config from 'config';
import { logMethod } from '@map-colonies/telemetry';
import { trace } from '@opentelemetry/api';
import { DependencyContainer } from 'tsyringe/dist/typings/types';
import jsLogger, { LoggerOptions } from '@map-colonies/js-logger';
import { SERVICES, SERVICE_NAME } from './common/constants';
import { tracing } from './common/tracing';
import { manualTriggerRouterFactory, MANUAL_TRIGGER_ROUTER_SYMBOL } from './manualTrigger/routes/manualTriggerRouter';
import { InjectionObject, registerDependencies } from './common/dependencyRegistration';
import { watchStatusRouterFactory, WATCH_STATUS_ROUTER_SYMBOL } from './watchStatus/routes/watchStatusRouter';

export interface RegisterOptions {
  override?: InjectionObject<unknown>[];
  useChild?: boolean;
}

export const registerExternalValues = (options?: RegisterOptions): DependencyContainer => {
  const loggerConfig = config.get<LoggerOptions>('telemetry.logger');
  // @ts-expect-error the signature is wrong
  const logger = jsLogger({ ...loggerConfig, prettyPrint: loggerConfig.prettyPrint, hooks: { logMethod } });

  tracing.start();
  const tracer = trace.getTracer(SERVICE_NAME);
  const mountDir = config.get<string>('mountDir');
  const watchDir = config.get<string>('watcher.watchDirectory');
  const relativeWatchDirPath = join(mountDir, watchDir);

  const dependencies: InjectionObject<unknown>[] = [
    { token: SERVICES.CONFIG, provider: { useValue: config } },
    { token: SERVICES.LOGGER, provider: { useValue: logger } },
    { token: SERVICES.TRACER, provider: { useValue: tracer } },
    { token: SERVICES.WATCHER_CONFIG, provider: { useValue: relativeWatchDirPath } },
    { token: MANUAL_TRIGGER_ROUTER_SYMBOL, provider: { useFactory: manualTriggerRouterFactory } },
    { token: WATCH_STATUS_ROUTER_SYMBOL, provider: { useFactory: watchStatusRouterFactory } },
    {
      token: 'onSignal',
      provider: {
        useValue: {
          useValue: async (): Promise<void> => {
            await Promise.all([tracing.stop()]);
          },
        },
      },
    },
  ];

  return registerDependencies(dependencies, options?.override, options?.useChild);
};

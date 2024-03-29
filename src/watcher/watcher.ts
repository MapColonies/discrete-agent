import { dirname, join as joinPath } from 'path';
import { container, inject, singleton } from 'tsyringe';
import { toInteger } from 'lodash';
import { Logger } from '@map-colonies/js-logger';
import { Probe } from '../common/utilities/probe';
import { IConfig } from '../common/interfaces';
import { SERVICES } from '../common/constants';
import { Trigger } from '../layerCreator/models/trigger';
import { AgentDbClient } from '../serviceClients/agentDbClient';
import { DirWalker, IDirWalkerOptions } from '../common/utilities/dirWalker';
import { AsyncLockDoneCallback, LimitingLock } from './limitingLock';

interface WatchOptions {
  minTriggerDepth: number;
  maxWatchDepth: number;
  interval: number;
}
@singleton()
export class Watcher {
  private watching: boolean;
  private watchTarget!: string;
  private watcherInterval!: number;
  private minTriggerDepth!: number;
  private maxWatchDepth!: number;
  private walkerOptions!: IDirWalkerOptions;

  public constructor(
    @inject(SERVICES.CONFIG) config: IConfig,
    @inject(SERVICES.LOGGER) private readonly logger: Logger,
    private readonly dbClient: AgentDbClient,
    private readonly trigger: Trigger,
    private readonly lock: LimitingLock,
    private readonly dirWalker: DirWalker
  ) {
    this.watching = false;
    this.loadWatchOptions(config);
    this.dbClient
      .getWatchStatus()
      .then((data) => {
        this.watching = data.isWatching;
        // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
        if (this.watching) {
          this.internalStartWatch();
        }
      })
      .catch(() => {
        const probe = container.resolve<Probe>(Probe);
        probe.liveFlag = false;
      });
  }

  public async stopWatching(): Promise<void> {
    if (this.watching) {
      this.logger.info('stopping file watcher');
      this.watching = false;
    }
    await this.dbClient.setWatchStatus({
      isWatching: this.watching,
    });
  }

  public async startWatching(): Promise<void> {
    if (!this.watching) {
      this.internalStartWatch();
    }
    await this.dbClient.setWatchStatus({
      isWatching: this.watching,
    });
  }

  public isWatching(): boolean {
    return this.watching;
  }

  private loadWatchOptions(config: IConfig): void {
    const mountDir = config.get<string>('mountDir');
    const watchDir = config.get<string>('watchDirectory');
    this.watchTarget = joinPath(mountDir, watchDir);
    const options = config.get<WatchOptions>('watcher.watchOptions');
    this.minTriggerDepth = toInteger(options.minTriggerDepth);
    this.maxWatchDepth = toInteger(options.maxWatchDepth);
    this.watcherInterval = toInteger(options.interval);
    this.walkerOptions = {
      minDepth: this.minTriggerDepth,
      maxDepth: this.maxWatchDepth,
    };
  }

  private internalStartWatch(): void {
    this.logger.info('starting file watcher');
    this.watching = true;
    setTimeout(this.startIteration.bind(this), this.watcherInterval);
  }

  private triggerFile(path: string): void {
    const dir = dirname(path);
    const action = async (done: AsyncLockDoneCallback<void>): Promise<void> => {
      try {
        this.logger.debug(`starting trigger flow for ${dir}`);
        await this.trigger.trigger(dir);
        return done();
      } catch (err) {
        const error = err as Error;
        this.logger.error(`failed to trigger layer for ${path}. error: ${error.message}`);
        return done(error);
      }
    };
    this.logger.debug(`watch triggered for ${path}`);
    void this.lock.acquire(dir, action);
  }

  private startIteration(): void {
    void this.walkDir(this.watchTarget).catch((err) => {
      const error = err as Error;
      this.logger.error(error.message);
    });
  }

  private async walkDir(path: string): Promise<void> {
    const gen = this.dirWalker.walk(path, this.walkerOptions);
    for await (const itemPath of gen) {
      this.triggerFile(itemPath);
    }
    if (this.isWatching()) {
      setTimeout(this.startIteration.bind(this), this.watcherInterval);
    }
  }
}

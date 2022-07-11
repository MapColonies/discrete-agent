import { Logger } from '@map-colonies/js-logger';
import { inject, injectable } from 'tsyringe';
import { SERVICES } from '../../common/constants';
import { Watcher } from '../../watcher/watcher';
import { IWatchStatus } from '../interfaces';

@injectable()
export class WatchStatusManager {
  public constructor(@inject(SERVICES.LOGGER) private readonly logger: Logger, private readonly fileWatcher: Watcher) {}

  public getStatus(): IWatchStatus {
    return { isWatching: this.fileWatcher.isWatching() };
  }

  public async startWatching(): Promise<IWatchStatus> {
    await this.fileWatcher.startWatching();
    return this.getStatus();
  }

  public async stopWatching(): Promise<IWatchStatus> {
    await this.fileWatcher.stopWatching();
    return this.getStatus();
  }
}

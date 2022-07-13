import { join as joinPath } from 'path';
import { Logger } from '@map-colonies/js-logger';
import { inject, injectable } from 'tsyringe';
import { SERVICES } from '../../common/constants';
import { IConfig } from '../../common/interfaces';
import { Trigger } from '../../layerCreator/models/trigger';

@injectable()
export class ManualTriggerManager {
  public constructor(
    @inject(SERVICES.LOGGER) private readonly logger: Logger,
    @inject(SERVICES.CONFIG) private readonly config: IConfig,
    private readonly trigger: Trigger
  ) {}

  public async createLayer(sourceDirectory: string): Promise<void> {
    this.logger.info(`layer creation manual trigger from '${sourceDirectory}'`);
    const mountDir = this.config.get<string>('mountDir');
    const targetDir = joinPath(mountDir, sourceDirectory);

    await this.trigger.trigger(targetDir, true);
  }
}

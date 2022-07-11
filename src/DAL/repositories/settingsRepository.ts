import { Repository, EntityRepository } from 'typeorm';
import { container } from 'tsyringe';
import { Logger } from '@map-colonies/js-logger';
import { InternalServerError } from '@map-colonies/error-types';
import { Setting } from '../entity/setting';
import { SERVICES } from '../../common/constants';

@EntityRepository(Setting)
export class SettingsRepository extends Repository<Setting> {
  private readonly appLogger: Logger; //don't override internal repository logger.

  public constructor() {
    super();
    this.appLogger = container.resolve(SERVICES.LOGGER); //direct injection don't work here due to being initialized by typeOrm
  }

  public async get(key: string): Promise<Setting | undefined> {
    try {
      return await this.findOne({ key: key });
    } catch (err) {
      if (err !== undefined) {
        this.appLogger.error(`get settings "${key}". error: ${JSON.stringify(err)}`);
        throw new InternalServerError(err as Error, `get settings "${key}". error: ${JSON.stringify(err)}`);
      }
      return undefined;
    }
  }

  public async upsert(setting: Setting): Promise<Setting | undefined> {
    this.appLogger.info(`updated setting "${setting.key}" to "${setting.value}"`);
    try {
      return await this.save(setting);
    } catch (err) {
      this.appLogger.error(`upsert settings: ${JSON.stringify(setting)}. error: ${JSON.stringify(err)}`);
      throw new InternalServerError(err as Error, `upsert settings: ${JSON.stringify(setting)}. error: ${JSON.stringify(err)}`);
    }
  }

  public async getAll(): Promise<Setting[] | undefined> {
    try {
      return await this.find();
    } catch (err) {
      this.appLogger.error(`get all settings. error: ${JSON.stringify(err)}`);
      throw new InternalServerError(err as Error, `get all settings. error: ${JSON.stringify(err)}`);
    }
  }
}

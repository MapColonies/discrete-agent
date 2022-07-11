import { readFileSync } from 'fs';
import { createConnection, Connection, ObjectType, ConnectionOptions } from 'typeorm';
import { inject, singleton } from 'tsyringe';
import { Logger } from '@map-colonies/js-logger';
import { InternalServerError } from '@map-colonies/error-types';
import { SERVICES } from '../common/constants';
import { IConfig, IDbConfig } from '../common/interfaces';
import { SettingsRepository } from './repositories/settingsRepository';
import { LayerHistoryRepository } from './repositories/layerHistoryRepository';

@singleton()
export class ConnectionManager {
  private connection?: Connection;
  private connectionStatusPromise?: Promise<Connection>;

  public constructor(@inject(SERVICES.LOGGER) private readonly logger: Logger, @inject(SERVICES.CONFIG) private readonly config: IConfig) {}

  public async init(): Promise<void> {
    const connectionConfig = this.config.get<IDbConfig>('typeOrm');
    this.logger.info(`connection to database ${connectionConfig.database as string} on ${connectionConfig.host as string}`);

    try {
      if (this.connectionStatusPromise === undefined) {
        this.connectionStatusPromise = createConnection(this.createConnectionOptions(connectionConfig));
      }
      this.connection = await this.connectionStatusPromise;
    } catch (err) {
      const errString = JSON.stringify(err, Object.getOwnPropertyNames(err));
      this.logger.error(`failed to connect to database: ${errString}`);
      throw new InternalServerError(err as Error, `failed to connect to database: ${errString}`);
    }
  }

  public isConnected(): boolean {
    return this.connection !== undefined;
  }

  public getSettingsRepository(): SettingsRepository {
    return this.getRepository(SettingsRepository);
  }

  public getLayerHistoryRepository(): LayerHistoryRepository {
    return this.getRepository(LayerHistoryRepository);
  }

  private createConnectionOptions(dbConfig: IDbConfig): ConnectionOptions {
    const { enableSslAuth, sslPaths, ...connectionOptions } = dbConfig;
    if (enableSslAuth) {
      connectionOptions.password = undefined;
      connectionOptions.ssl = { key: readFileSync(sslPaths.key), cert: readFileSync(sslPaths.cert), ca: readFileSync(sslPaths.ca) };
    }
    return connectionOptions;
  }

  private getRepository<T>(repository: ObjectType<T>): T {
    if (!this.isConnected()) {
      const msg = 'failed to send request to database: no open connection';
      this.logger.error(msg);
      throw new InternalServerError(msg);
    } else {
      const connection = this.connection as Connection;
      return connection.getCustomRepository(repository);
    }
  }
}

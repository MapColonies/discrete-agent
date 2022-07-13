import { Logger } from '@map-colonies/js-logger';
import { HttpClient, IHttpRetryConfig } from '@map-colonies/mc-utils';
import { IConfig } from 'config';
import { inject, injectable } from 'tsyringe';
import { LayerMetadata, IngestionParams } from '@map-colonies/mc-model-types';
import { SERVICES } from '../common/constants';

@injectable()
export class OverseerClient extends HttpClient {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  public constructor(@inject(SERVICES.LOGGER) protected readonly logger: Logger, @inject(SERVICES.CONFIG) private readonly config: IConfig) {
    const retryConfig = config.get<IHttpRetryConfig>('httpRetry');
    const baseUrl = config.get<string>('overseer.url');
    super(logger, baseUrl, 'OverseerService', retryConfig);
  }

  public async ingestDiscreteLayer(ingestionData: IngestionParams): Promise<LayerMetadata> {
    this.logger.info(
      `Trigger overseer for id: ${ingestionData.metadata.productId as string} version: ${ingestionData.metadata.productVersion as string}`
    );
    try {
      return await this.post('/layers', ingestionData);
    } catch (err) {
      const error = err as Error;
      this.logger.error(
        `failed to trigger overseer for for id=${ingestionData.metadata.productId as string} version=${
          ingestionData.metadata.productVersion as string
        }, error=${error.message}`
      );
      throw err;
    }
  }
}

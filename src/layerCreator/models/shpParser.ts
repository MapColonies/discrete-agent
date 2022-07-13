import { read as readShp } from 'shapefile';
import { GeoJSON } from 'geojson';
import { BadRequestError } from '@map-colonies/error-types';
import { Logger } from '@map-colonies/js-logger';
import { inject, injectable } from 'tsyringe';
import { SERVICES } from '../../common/constants';

@injectable()
export class ShpParser {
  public constructor(@inject(SERVICES.LOGGER) private readonly logger: Logger) {}

  public async parse(shp: string, dbf: string, encoding = 'utf-8'): Promise<GeoJSON> {
    const geoJson = await this.toGeoJson(shp, dbf, encoding);

    return geoJson;
  }

  private async toGeoJson(shp: string, dbf: string, encoding = 'utf-8'): Promise<GeoJSON> {
    try {
      return await readShp(shp, dbf, { encoding: encoding });
    } catch (err) {
      const error = err as Error;
      this.logger.error(`failed to parse shapeFile: ${error.message}`);
      throw new BadRequestError(error, `Invalid shp file: ${shp}`);
    }
  }
}

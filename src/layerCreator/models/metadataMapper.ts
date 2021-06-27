import { IPropSHPMapping, LayerMetadata, ShapeFileType, TsTypes } from '@map-colonies/mc-model-types';
import { injectable } from 'tsyringe';
import { FeatureCollection, GeoJSON } from 'geojson';
import { get as readProp, toNumber } from 'lodash';
import { toBoolean } from '../../common/utilities/typeConvertors';
import { FileMapper } from './fileMapper';

@injectable()
export class MetadataMapper {
  private readonly mappings: IPropSHPMapping[];

  public constructor(private readonly fileMapper: FileMapper) {
    this.mappings = LayerMetadata.getShpMappings();
  }

  public map(productGeoJson: GeoJSON, metadataGeoJson: GeoJSON, filesGeoJson: GeoJSON): LayerMetadata {
    const metadata: LayerMetadata = {};
    this.autoMapModels(metadata, productGeoJson, metadataGeoJson, filesGeoJson);
    this.parseIdentifiers(metadata);
    return metadata;
  }

  public parseFilesShpJson(filesJson: GeoJSON): string[] {
    const features = (filesJson as FeatureCollection).features;
    const files = features.map((feature) => {
      // eslint-disable-next-line @typescript-eslint/naming-convention
      const file = feature.properties as { 'File Name': string; Format: string };
      return this.fileMapper.getFilePath(file['File Name'], file.Format);
    });
    return files;
  }

  private autoMapModels(baseMetadata: LayerMetadata, productGeoJson: GeoJSON, metadataGeoJson: GeoJSON, filesGeoJson: GeoJSON): void {
    const metadata = baseMetadata as Record<string, unknown>;
    const sources = {} as { [key: string]: GeoJSON };
    sources[ShapeFileType.FILES] = filesGeoJson;
    sources[ShapeFileType.PRODUCT] = productGeoJson;
    sources[ShapeFileType.SHAPE_METADATA] = metadataGeoJson;
    this.mappings.forEach((map) => {
      const type = map.mappingType.value;
      const value = readProp(sources[map.shpFile], map.valuePath) as unknown;
      metadata[map.prop] = this.castValue(value, type);
    });
  }

  private parseIdentifiers(metadata: LayerMetadata): void {
    const source = metadata.source as string;
    const parts = source.split('-');
    metadata.version = parts.pop();
    metadata.id = parts.join('-');
  }

  private castValue(value: unknown, type: string): unknown {
    if (value === undefined) {
      return undefined;
    }
    switch (type) {
      case TsTypes.BOOLEAN.value:
        return toBoolean(value);
      case TsTypes.DATE.value:
        return new Date(value as string);
      case TsTypes.NUMBER.value:
        return toNumber(value);
      default:
        return value;
    }
  }
}

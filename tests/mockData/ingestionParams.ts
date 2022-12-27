import { Transparency } from '@map-colonies/mc-model-types';
/* eslint-disable @typescript-eslint/naming-convention */
/* eslint-disable @typescript-eslint/no-magic-numbers */

export const ingestionParams = {
  originDirectory: 'test',
  fileNames: [
    'X1825_Y1649.Tiff',
    'X1825_Y1650.Tiff',
    'X1825_Y1651.Tiff',
    'X1826_Y1649.Tiff',
    'X1826_Y1650.Tiff',
    'X1826_Y1651.Tiff',
    'X1827_Y1649.Tiff',
    'X1827_Y1650.Tiff',
    'X1827_Y1651.Tiff',
    'X1828_Y1649.Tiff',
    'X1828_Y1650.Tiff',
    'X1828_Y1651.Tiff',
  ],
  metadata: {
    maxResolutionDeg: 0.0000018519,
    maxResolutionMeter: 0.2,
    minHorizontalAccuracyCE90: 1,
    classification: '4',
    creationDate: undefined,
    sensors: ['OTHER'],
    rms: undefined,
    scale: undefined,
    description: 'description',
    footprint: {
      type: 'Polygon',
      coordinates: [
        [
          [34.8851821360075, 32.0425133190024],
          [34.8444933529952, 32.0425133190024],
          [34.8444933529952, 32.078681125999],
          [34.8851821360075, 32.078681125999],
          [34.8851821360075, 32.0425133190024],
        ],
      ],
    },
    productVersion: '1.0',
    producerName: undefined,
    productId: 'LAYER',
    productName: 'product',
    productType: 'Orthophoto',
    productSubType: undefined,
    sourceDateEnd: '2019-04-06T00:00:00.000Z',
    sourceDateStart: '2019-04-06T00:00:00.000Z',
    region: ['c1', 'c2'],
    ingestionDate: undefined,
    srsId: undefined,
    srsName: undefined,
    type: 'RECORD_RASTER',
    transparency: Transparency.TRANSPARENT,
    layerPolygonParts: {
      type: 'FeatureCollection',
      features: [
        {
          type: 'Feature',
          properties: {
            Dsc: 'description',
            Source: 'LAYER-1.0',
            SourceName: 'product',
            UpdateDate: '06/04/2019',
            Resolution: '0.2',
            Ep90: '1',
            Rms: null,
            SensorType: 'OTHER',
            Scale: null,
            Countries: 'c1,c2',
            Cities: 'p1,p2,p3',
          },
          geometry: {
            type: 'Polygon',
            coordinates: [
              [
                [34.8851821360093, 32.0425133190045],
                [34.8444933529867, 32.0425133190045],
                [34.8444933529867, 32.0786811260038],
                [34.8851821360093, 32.0786811260038],
                [34.8851821360093, 32.0425133190045],
              ],
            ],
          },
        },
      ],
      bbox: [34.8444933529867, 32.0425133190045, 34.8851821360093, 32.0786811260038],
    },
    includedInBests: undefined,
    productBoundingBox: undefined,
  },
};

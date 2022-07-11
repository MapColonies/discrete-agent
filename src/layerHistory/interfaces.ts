import { ProgressStatus } from '../DAL/entity/layerHistory';

export interface ILayerHistoryResponse {
  directory: string;
  id?: string;
  version?: string;
  status?: ProgressStatus;
}

export interface IUpdateLayerHistoryStatusRequestBody {
  id?: string;
  version?: string;
  status?: ProgressStatus;
}

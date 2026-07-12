import { z } from 'zod';
import { CreateAssetSchema, UpdateAssetSchema, AssetIdParamSchema } from './asset.schema';

export type CreateAssetDTO = z.infer<typeof CreateAssetSchema>['body'];
export type UpdateAssetDTO = z.infer<typeof UpdateAssetSchema>['body'];
export type AssetIdParamDTO = z.infer<typeof AssetIdParamSchema>['params'];

export interface AssetResponseDTO {
  id: string;
  assetTag: string;
  name: string;
  categoryId: string;
  serialNumber?: string | null;
  manufacturer?: string | null;
  model?: string | null;
  acquisitionDate?: Date | null;
  acquisitionCost?: number | null;
  currentValue?: number | null;
  location?: string | null;
  condition: string;
  status: string;
  isBookable: boolean;
  createdBy?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

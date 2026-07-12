import { z } from 'zod';
import { AllocateAssetSchema, ReturnAssetSchema, TransferRequestSchema, TransferActionSchema, AllocationIdParamSchema } from './allocation.schema';

export type AllocateAssetDTO = z.infer<typeof AllocateAssetSchema>['body'];
export type ReturnAssetDTO = z.infer<typeof ReturnAssetSchema>['body'];
export type ReturnAssetParams = z.infer<typeof ReturnAssetSchema>['params'];
export type TransferRequestDTO = z.infer<typeof TransferRequestSchema>['body'];
export type TransferActionParams = z.infer<typeof TransferActionSchema>['params'];
export type AllocationIdParamDTO = z.infer<typeof AllocationIdParamSchema>['params'];

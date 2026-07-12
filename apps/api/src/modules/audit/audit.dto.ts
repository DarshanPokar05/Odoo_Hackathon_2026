import { AuditStatus, VerificationStatus } from '@prisma/client';

export interface CreateAuditDto {
  title: string;
  departmentId: string;
  location?: string;
  startDate: string;
  endDate: string;
}

export interface AssignAuditorDto {
  auditorIds: string[];
}

export interface VerifyAssetItemDto {
  assetId: string;
  verificationStatus: VerificationStatus;
  remarks?: string;
}

export interface VerifyAssetsDto {
  items: VerifyAssetItemDto[];
}

export interface CloseAuditDto {
  remarks?: string;
}

export interface AuditCycleResponse {
  id: string;
  title: string;
  departmentId: string;
  location: string | null;
  startDate: Date;
  endDate: Date;
  status: AuditStatus;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

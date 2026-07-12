export enum AuditStatus {
  DRAFT = 'DRAFT',
  ACTIVE = 'ACTIVE',
  CLOSED = 'CLOSED',
}

export enum VerificationStatus {
  PENDING = 'PENDING',
  VERIFIED = 'VERIFIED',
  MISSING = 'MISSING',
  DAMAGED = 'DAMAGED',
}

export enum DiscrepancySeverity {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
}

export interface AuditCycle {
  id: string;
  title: string;
  departmentId: string;
  location: string | null;
  startDate: string;
  endDate: string;
  status: AuditStatus;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  department?: { id: string; name: string };
  _count?: { items: number; assignments: number };
}

export interface AuditItem {
  id: string;
  auditCycleId: string;
  assetId: string;
  verificationStatus: VerificationStatus;
  remarks: string | null;
  verifiedBy: string | null;
  verifiedAt: string | null;
  asset?: { name: string; assetTag: string; serialNumber: string | null };
  verifier?: { firstName: string; lastName: string };
}

export interface CreateAuditRequest {
  title: string;
  departmentId: string;
  location?: string;
  startDate: string;
  endDate: string;
}

export interface AssignAuditorRequest {
  auditorIds: string[];
}

export interface VerifyAssetItemRequest {
  assetId: string;
  verificationStatus: VerificationStatus;
  remarks?: string;
}

export interface VerifyAssetsRequest {
  items: VerifyAssetItemRequest[];
}

export interface CloseAuditRequest {
  remarks?: string;
}

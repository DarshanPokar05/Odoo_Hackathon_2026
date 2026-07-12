import { Asset } from '../asset/types';
import { User } from '../user/types';

export type AllocationStatus = 'ACTIVE' | 'RETURNED' | 'OVERDUE' | 'TRANSFERRED';
export type TransferStatus = 'PENDING' | 'APPROVED' | 'REJECTED';
export type Condition = 'NEW' | 'GOOD' | 'FAIR' | 'POOR' | 'BROKEN';

export interface Allocation {
  id: string;
  assetId: string;
  allocatedTo: string;
  allocatedBy: string;
  allocationDate: string;
  expectedReturnDate: string | null;
  actualReturnDate: string | null;
  status: AllocationStatus;
  conditionBefore: Condition;
  conditionAfter: Condition | null;
  remarks: string | null;
  createdAt: string;
  asset?: Asset;
  userAllocatedTo?: Pick<User, 'id' | 'firstName' | 'lastName' | 'email'>;
}

export interface AllocateAssetDTO {
  assetId: string;
  allocatedTo: string;
  expectedReturnDate?: string;
  remarks?: string;
}

export interface ReturnAssetDTO {
  conditionAfter: Condition;
  remarks?: string;
}

export interface TransferRequestDTO {
  assetId: string;
  requestedTo: string;
  reason?: string;
}

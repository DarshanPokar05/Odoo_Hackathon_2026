export enum MaintenancePriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL'
}

export enum MaintenanceStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  ASSIGNED = 'ASSIGNED',
  IN_PROGRESS = 'IN_PROGRESS',
  RESOLVED = 'RESOLVED',
  REJECTED = 'REJECTED',
  CLOSED = 'CLOSED'
}

export interface MaintenanceHistory {
  id: string;
  maintenanceRequestId: string;
  status: MaintenanceStatus;
  remarks?: string;
  updatedBy?: string;
  createdAt: string;
  userUpdatedBy?: {
    id: string;
    firstName: string;
    lastName: string;
  };
}

export interface MaintenanceRequest {
  id: string;
  assetId: string;
  reportedBy: string;
  priority: MaintenancePriority;
  description: string;
  photoUrl?: string;
  status: MaintenanceStatus;
  approvedBy?: string;
  assignedTo?: string;
  resolvedAt?: string;
  remarks?: string;
  createdAt: string;
  updatedAt: string;
  asset: {
    id: string;
    name: string;
    assetTag: string;
    status: string;
  };
  userReportedBy: {
    id: string;
    firstName: string;
    lastName: string;
  };
  userAssignedTo?: {
    id: string;
    firstName: string;
    lastName: string;
  };
  history?: MaintenanceHistory[];
}

export interface RaiseMaintenanceDTO {
  assetId: string;
  priority?: MaintenancePriority;
  description: string;
  photoUrl?: string;
}

export interface ApproveMaintenanceDTO {
  remarks?: string;
}

export interface RejectMaintenanceDTO {
  remarks: string;
}

export interface AssignTechnicianDTO {
  technicianId: string;
}

export interface ResolveMaintenanceDTO {
  remarks: string;
}

export interface CloseMaintenanceDTO {
  remarks?: string;
}

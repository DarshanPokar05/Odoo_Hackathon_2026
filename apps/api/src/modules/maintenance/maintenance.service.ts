import { MaintenanceRepository } from './maintenance.repository';
import { AssetRepository } from '../asset/asset.repository';
import { CustomError } from '../../shared/errors/customErrors';
import {
  RaiseMaintenanceDTO,
  ApproveMaintenanceDTO,
  RejectMaintenanceDTO,
  AssignTechnicianDTO,
  ResolveMaintenanceDTO,
  CloseMaintenanceDTO
} from './maintenance.dto';
import { MaintenanceStatus, AssetStatus } from '@prisma/client';

export class MaintenanceService {
  private maintenanceRepository: MaintenanceRepository;

  constructor() {
    this.maintenanceRepository = new MaintenanceRepository();
  }

  async raiseRequest(data: RaiseMaintenanceDTO, userId: string) {
    const asset = await AssetRepository.findById(data.assetId);
    if (!asset) {
      throw new CustomError('Asset not found', 404, 'NOT_FOUND');
    }

    return this.maintenanceRepository.createMaintenanceRequest({
      assetId: data.assetId,
      reportedBy: userId,
      priority: data.priority,
      description: data.description,
      photoUrl: data.photoUrl,
      status: MaintenanceStatus.PENDING,
    }, userId);
  }

  async getMaintenanceDetails(id: string) {
    const request = await this.maintenanceRepository.getMaintenanceRequestById(id);
    if (!request) {
      throw new CustomError('Maintenance request not found', 404, 'NOT_FOUND');
    }
    return request;
  }

  async getPendingRequests() {
    return this.maintenanceRepository.listMaintenanceRequests({ status: MaintenanceStatus.PENDING });
  }

  async listAllRequests() {
    return this.maintenanceRepository.listMaintenanceRequests();
  }

  async approveRequest(id: string, data: ApproveMaintenanceDTO, userId: string) {
    const request = await this.getMaintenanceDetails(id);
    if (request.status !== MaintenanceStatus.PENDING) {
      throw new CustomError('Only PENDING requests can be approved', 400, 'INVALID_STATUS');
    }

    return this.maintenanceRepository.updateMaintenanceStatus(
      id,
      MaintenanceStatus.APPROVED,
      AssetStatus.UNDER_MAINTENANCE,
      userId,
      data.remarks,
      { approvedBy: userId } as Record<string, unknown>
    );
  }

  async rejectRequest(id: string, data: RejectMaintenanceDTO, userId: string) {
    const request = await this.getMaintenanceDetails(id);
    if (request.status !== MaintenanceStatus.PENDING) {
      throw new CustomError('Only PENDING requests can be rejected', 400, 'INVALID_STATUS');
    }

    return this.maintenanceRepository.updateMaintenanceStatus(
      id,
      MaintenanceStatus.REJECTED,
      null,
      userId,
      data.remarks,
      { approvedBy: userId } as Record<string, unknown>
    );
  }

  async assignTechnician(id: string, data: AssignTechnicianDTO, userId: string) {
    const request = await this.getMaintenanceDetails(id);
    if (request.status !== MaintenanceStatus.APPROVED) {
      throw new CustomError('Only APPROVED requests can be assigned', 400, 'INVALID_STATUS');
    }

    return this.maintenanceRepository.updateMaintenanceStatus(
      id,
      MaintenanceStatus.ASSIGNED,
      null,
      userId,
      'Technician assigned',
      { assignedTo: data.technicianId } as Record<string, unknown>
    );
  }

  async resolveRequest(id: string, data: ResolveMaintenanceDTO, userId: string) {
    const request = await this.getMaintenanceDetails(id);
    if (request.status !== MaintenanceStatus.ASSIGNED && request.status !== MaintenanceStatus.IN_PROGRESS) {
      throw new CustomError('Only ASSIGNED or IN_PROGRESS requests can be resolved', 400, 'INVALID_STATUS');
    }

    return this.maintenanceRepository.updateMaintenanceStatus(
      id,
      MaintenanceStatus.RESOLVED,
      AssetStatus.AVAILABLE,
      userId,
      data.remarks,
      { resolvedAt: new Date() }
    );
  }

  async closeRequest(id: string, data: CloseMaintenanceDTO, userId: string) {
    const request = await this.getMaintenanceDetails(id);
    if (request.status !== MaintenanceStatus.RESOLVED) {
      throw new CustomError('Only RESOLVED requests can be closed', 400, 'INVALID_STATUS');
    }

    return this.maintenanceRepository.updateMaintenanceStatus(
      id,
      MaintenanceStatus.CLOSED,
      null,
      userId,
      data.remarks
    );
  }
}

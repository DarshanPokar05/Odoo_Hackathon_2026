import { Request, Response, NextFunction } from 'express';
import { MaintenanceService } from './maintenance.service';
import { sendSuccess } from '../../shared/responses/apiResponse';
import {
  raiseMaintenanceSchema,
  approveMaintenanceSchema,
  rejectMaintenanceSchema,
  assignTechnicianSchema,
  resolveMaintenanceSchema,
  closeMaintenanceSchema
} from './maintenance.schema';

export class MaintenanceController {
  private maintenanceService: MaintenanceService;

  constructor() {
    this.maintenanceService = new MaintenanceService();
  }

  raiseRequest = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const validatedData = raiseMaintenanceSchema.parse(req.body);
      const request = await this.maintenanceService.raiseRequest(validatedData, req.user!.id);
      return sendSuccess(res, request, 'Maintenance request raised successfully', 201);
    } catch (error) {
      next(error);
    }
  };

  getMaintenanceDetails = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const request = await this.maintenanceService.getMaintenanceDetails(req.params.id);
      return sendSuccess(res, request, 'Maintenance request details retrieved');
    } catch (error) {
      next(error);
    }
  };

  getPendingRequests = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const requests = await this.maintenanceService.getPendingRequests();
      return sendSuccess(res, requests, 'Pending maintenance requests retrieved');
    } catch (error) {
      next(error);
    }
  };

  listAllRequests = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const requests = await this.maintenanceService.listAllRequests();
      return sendSuccess(res, requests, 'All maintenance requests retrieved');
    } catch (error) {
      next(error);
    }
  };

  approveRequest = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const validatedData = approveMaintenanceSchema.parse(req.body);
      const request = await this.maintenanceService.approveRequest(req.params.id, validatedData, req.user!.id);
      return sendSuccess(res, request, 'Maintenance request approved');
    } catch (error) {
      next(error);
    }
  };

  rejectRequest = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const validatedData = rejectMaintenanceSchema.parse(req.body);
      const request = await this.maintenanceService.rejectRequest(req.params.id, validatedData, req.user!.id);
      return sendSuccess(res, request, 'Maintenance request rejected');
    } catch (error) {
      next(error);
    }
  };

  assignTechnician = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const validatedData = assignTechnicianSchema.parse(req.body);
      const request = await this.maintenanceService.assignTechnician(req.params.id, validatedData, req.user!.id);
      return sendSuccess(res, request, 'Technician assigned successfully');
    } catch (error) {
      next(error);
    }
  };

  resolveRequest = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const validatedData = resolveMaintenanceSchema.parse(req.body);
      const request = await this.maintenanceService.resolveRequest(req.params.id, validatedData, req.user!.id);
      return sendSuccess(res, request, 'Maintenance request resolved');
    } catch (error) {
      next(error);
    }
  };

  closeRequest = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const validatedData = closeMaintenanceSchema.parse(req.body);
      const request = await this.maintenanceService.closeRequest(req.params.id, validatedData, req.user!.id);
      return sendSuccess(res, request, 'Maintenance request closed');
    } catch (error) {
      next(error);
    }
  };
}

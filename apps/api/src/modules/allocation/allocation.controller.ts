import { Request, Response, NextFunction } from 'express';
import { AllocationService } from './allocation.service';
import { sendSuccess } from '../../shared/responses/apiResponse';

export class AllocationController {
  static async allocateAsset(req: Request, res: Response, next: NextFunction) {
    try {
      const allocation = await AllocationService.allocateAsset(req.body, req.user!.id);
      return sendSuccess(res, allocation, 'Asset allocated successfully', 201);
    } catch (error) {
      next(error);
    }
  }

  static async returnAsset(req: Request, res: Response, next: NextFunction) {
    try {
      const allocation = await AllocationService.returnAsset(req.params.id, req.body, req.user!.id);
      return sendSuccess(res, allocation, 'Asset returned successfully', 200);
    } catch (error) {
      next(error);
    }
  }

  static async getActiveAllocations(req: Request, res: Response, next: NextFunction) {
    try {
      const allocations = await AllocationService.getActiveAllocations();
      return sendSuccess(res, allocations, 'Active allocations fetched successfully', 200);
    } catch (error) {
      next(error);
    }
  }

  static async getAllocationDetails(req: Request, res: Response, next: NextFunction) {
    try {
      const allocation = await AllocationService.getAllocationDetails(req.params.id);
      return sendSuccess(res, allocation, 'Allocation details fetched successfully', 200);
    } catch (error) {
      next(error);
    }
  }

  static async getOverdueAllocations(req: Request, res: Response, next: NextFunction) {
    try {
      const allocations = await AllocationService.getOverdueAllocations();
      return sendSuccess(res, allocations, 'Overdue allocations fetched successfully', 200);
    } catch (error) {
      next(error);
    }
  }

  static async requestTransfer(req: Request, res: Response, next: NextFunction) {
    try {
      const transfer = await AllocationService.requestTransfer(req.body, req.user!.id);
      return sendSuccess(res, transfer, 'Transfer requested successfully', 201);
    } catch (error) {
      next(error);
    }
  }

  static async approveTransfer(req: Request, res: Response, next: NextFunction) {
    try {
      const transfer = await AllocationService.approveTransfer(req.params.id, req.user!.id);
      return sendSuccess(res, transfer, 'Transfer approved successfully', 200);
    } catch (error) {
      next(error);
    }
  }

  static async rejectTransfer(req: Request, res: Response, next: NextFunction) {
    try {
      const transfer = await AllocationService.rejectTransfer(req.params.id);
      return sendSuccess(res, transfer, 'Transfer rejected successfully', 200);
    } catch (error) {
      next(error);
    }
  }
}

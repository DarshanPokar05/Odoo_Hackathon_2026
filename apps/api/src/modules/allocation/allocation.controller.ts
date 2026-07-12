import { Request, Response, NextFunction } from 'express';
import { AllocationService } from './allocation.service';
import { successResponse } from '../../shared/utils/response';

export class AllocationController {
  static async allocateAsset(req: Request, res: Response, next: NextFunction) {
    try {
      const allocation = await AllocationService.allocateAsset(req.body, req.user!.id);
      return successResponse(res, 201, 'Asset allocated successfully', allocation);
    } catch (error) {
      next(error);
    }
  }

  static async returnAsset(req: Request, res: Response, next: NextFunction) {
    try {
      const allocation = await AllocationService.returnAsset(req.params.id, req.body, req.user!.id);
      return successResponse(res, 200, 'Asset returned successfully', allocation);
    } catch (error) {
      next(error);
    }
  }

  static async getActiveAllocations(req: Request, res: Response, next: NextFunction) {
    try {
      const allocations = await AllocationService.getActiveAllocations();
      return successResponse(res, 200, 'Active allocations fetched successfully', allocations);
    } catch (error) {
      next(error);
    }
  }

  static async getAllocationDetails(req: Request, res: Response, next: NextFunction) {
    try {
      const allocation = await AllocationService.getAllocationDetails(req.params.id);
      return successResponse(res, 200, 'Allocation details fetched successfully', allocation);
    } catch (error) {
      next(error);
    }
  }

  static async getOverdueAllocations(req: Request, res: Response, next: NextFunction) {
    try {
      const allocations = await AllocationService.getOverdueAllocations();
      return successResponse(res, 200, 'Overdue allocations fetched successfully', allocations);
    } catch (error) {
      next(error);
    }
  }

  static async requestTransfer(req: Request, res: Response, next: NextFunction) {
    try {
      const transfer = await AllocationService.requestTransfer(req.body, req.user!.id);
      return successResponse(res, 201, 'Transfer requested successfully', transfer);
    } catch (error) {
      next(error);
    }
  }

  static async approveTransfer(req: Request, res: Response, next: NextFunction) {
    try {
      const transfer = await AllocationService.approveTransfer(req.params.id, req.user!.id);
      return successResponse(res, 200, 'Transfer approved successfully', transfer);
    } catch (error) {
      next(error);
    }
  }

  static async rejectTransfer(req: Request, res: Response, next: NextFunction) {
    try {
      const transfer = await AllocationService.rejectTransfer(req.params.id);
      return successResponse(res, 200, 'Transfer rejected successfully', transfer);
    } catch (error) {
      next(error);
    }
  }
}

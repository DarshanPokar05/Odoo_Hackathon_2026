import { Request, Response, NextFunction } from 'express';
import { PermissionService } from '../services/permission.service';
import { sendSuccess } from '../../../shared/responses/apiResponse';

export class PermissionController {
  static async create(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await PermissionService.create(req.body, req.user!.id);
      return sendSuccess(res, result, 'Permission created successfully', 201);
    } catch (error) {
      next(error);
    }
  }

  static async update(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await PermissionService.update(req.params.id, req.body, req.user!.id);
      return sendSuccess(res, result, 'Permission updated successfully', 200);
    } catch (error) {
      next(error);
    }
  }

  static async delete(req: Request, res: Response, next: NextFunction) {
    try {
      await PermissionService.delete(req.params.id, req.user!.id);
      return sendSuccess(res, null, 'Permission deleted successfully', 200);
    } catch (error) {
      next(error);
    }
  }

  static async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await PermissionService.getById(req.params.id);
      return sendSuccess(res, result, 'Permission fetched successfully', 200);
    } catch (error) {
      next(error);
    }
  }

  static async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await PermissionService.getAll();
      return sendSuccess(res, result, 'Permissions fetched successfully', 200);
    } catch (error) {
      next(error);
    }
  }
}

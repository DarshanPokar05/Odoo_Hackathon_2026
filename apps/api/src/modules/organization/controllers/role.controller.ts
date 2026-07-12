import { Request, Response, NextFunction } from 'express';
import { RoleService } from '../services/role.service';
import { sendSuccess } from '../../../shared/responses/apiResponse';

export class RoleController {
  static async create(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await RoleService.create(req.body, req.user!.id);
      return sendSuccess(res, result, 'Role created successfully', 201);
    } catch (error) {
      next(error);
    }
  }

  static async update(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await RoleService.update(req.params.id, req.body, req.user!.id);
      return sendSuccess(res, result, 'Role updated successfully', 200);
    } catch (error) {
      next(error);
    }
  }

  static async delete(req: Request, res: Response, next: NextFunction) {
    try {
      await RoleService.delete(req.params.id, req.user!.id);
      return sendSuccess(res, null, 'Role deleted successfully', 200);
    } catch (error) {
      next(error);
    }
  }

  static async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await RoleService.getById(req.params.id);
      return sendSuccess(res, result, 'Role fetched successfully', 200);
    } catch (error) {
      next(error);
    }
  }

  static async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await RoleService.getAll();
      return sendSuccess(res, result, 'Roles fetched successfully', 200);
    } catch (error) {
      next(error);
    }
  }
}

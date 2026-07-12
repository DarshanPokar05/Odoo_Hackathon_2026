import { Request, Response, NextFunction } from 'express';
import { DepartmentService } from '../services/department.service';
import { sendSuccess } from '../../../shared/responses/apiResponse';

export class DepartmentController {
  static async create(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await DepartmentService.create(req.body, req.user!.id);
      return sendSuccess(res, result, 'Department created successfully', 201);
    } catch (error) {
      next(error);
    }
  }

  static async update(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await DepartmentService.update(req.params.id, req.body, req.user!.id);
      return sendSuccess(res, result, 'Department updated successfully', 200);
    } catch (error) {
      next(error);
    }
  }

  static async delete(req: Request, res: Response, next: NextFunction) {
    try {
      await DepartmentService.deactivate(req.params.id, req.user!.id);
      return sendSuccess(res, null, 'Department deactivated successfully', 200);
    } catch (error) {
      next(error);
    }
  }

  static async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await DepartmentService.getById(req.params.id);
      return sendSuccess(res, result, 'Department fetched successfully', 200);
    } catch (error) {
      next(error);
    }
  }

  static async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await DepartmentService.getAll();
      return sendSuccess(res, result, 'Departments fetched successfully', 200);
    } catch (error) {
      next(error);
    }
  }
}

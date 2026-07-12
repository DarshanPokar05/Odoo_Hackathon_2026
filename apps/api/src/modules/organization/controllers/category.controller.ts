import { Request, Response, NextFunction } from 'express';
import { CategoryService } from '../services/category.service';
import { sendSuccess } from '../../../shared/responses/apiResponse';

export class CategoryController {
  static async create(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await CategoryService.create(req.body, req.user!.id);
      return sendSuccess(res, result, 'Category created successfully', 201);
    } catch (error) {
      next(error);
    }
  }

  static async update(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await CategoryService.update(req.params.id, req.body, req.user!.id);
      return sendSuccess(res, result, 'Category updated successfully', 200);
    } catch (error) {
      next(error);
    }
  }

  static async delete(req: Request, res: Response, next: NextFunction) {
    try {
      await CategoryService.deactivate(req.params.id, req.user!.id);
      return sendSuccess(res, null, 'Category deactivated successfully', 200);
    } catch (error) {
      next(error);
    }
  }

  static async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await CategoryService.getById(req.params.id);
      return sendSuccess(res, result, 'Category fetched successfully', 200);
    } catch (error) {
      next(error);
    }
  }

  static async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await CategoryService.getAll();
      return sendSuccess(res, result, 'Categories fetched successfully', 200);
    } catch (error) {
      next(error);
    }
  }
}

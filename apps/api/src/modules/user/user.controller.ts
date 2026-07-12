import { Request, Response, NextFunction } from 'express';
import { UserService } from './user.service';
import { sendSuccess } from '../../shared/responses/apiResponse';

export class UserController {
  static async create(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await UserService.create(req.body, req.user!.id);
      return sendSuccess(res, result, 'User created successfully', 201);
    } catch (error) {
      next(error);
    }
  }

  static async update(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await UserService.update(req.params.id, req.body, req.user!.id);
      return sendSuccess(res, result, 'User updated successfully', 200);
    } catch (error) {
      next(error);
    }
  }

  static async assignRole(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await UserService.assignRole(req.params.id, req.body, req.user!.id);
      return sendSuccess(res, result, 'Role assigned successfully', 200);
    } catch (error) {
      next(error);
    }
  }

  static async activate(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await UserService.activate(req.params.id, req.user!.id);
      return sendSuccess(res, result, 'User activated successfully', 200);
    } catch (error) {
      next(error);
    }
  }

  static async deactivate(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await UserService.deactivate(req.params.id, req.user!.id);
      return sendSuccess(res, result, 'User deactivated successfully', 200);
    } catch (error) {
      next(error);
    }
  }

  static async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await UserService.getById(req.params.id);
      return sendSuccess(res, result, 'User fetched successfully', 200);
    } catch (error) {
      next(error);
    }
  }

  static async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await UserService.getAll(req.query);
      return sendSuccess(res, result, 'Users fetched successfully', 200);
    } catch (error) {
      next(error);
    }
  }

  // Profile endpoints
  static async getProfile(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await UserService.getById(req.user!.id);
      return sendSuccess(res, result, 'Profile fetched successfully', 200);
    } catch (error) {
      next(error);
    }
  }

  static async updateProfile(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await UserService.updateProfile(req.user!.id, req.body);
      return sendSuccess(res, result, 'Profile updated successfully', 200);
    } catch (error) {
      next(error);
    }
  }

  static async changePassword(req: Request, res: Response, next: NextFunction) {
    try {
      await UserService.changePassword(req.user!.id, req.body);
      return sendSuccess(res, null, 'Password changed successfully', 200);
    } catch (error) {
      next(error);
    }
  }
}

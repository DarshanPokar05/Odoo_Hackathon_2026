import { Request, Response, NextFunction } from 'express';
import { ActivityService } from './activity.service';
import { ActivityExportService } from './activity-export.service';
import { ActivityLogQuerySchema, ActivityLogExportSchema } from './activity.schema';

export class ActivityController {
  static async getLogs(req: Request, res: Response, next: NextFunction) {
    try {
      const filters = ActivityLogQuerySchema.parse({ query: req.query }).query;
      const data = await ActivityService.getLogs(filters);
      res.status(200).json({ success: true, ...data });
    } catch (error) {
      next(error);
    }
  }

  static async getLogById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const log = await ActivityService.getLogById(id);
      res.status(200).json({ success: true, data: log });
    } catch (error) {
      next(error);
    }
  }

  static async getUserLogs(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const filters = ActivityLogQuerySchema.parse({ query: req.query }).query;
      
      // Users can only view their own logs unless they are ADMIN/SYSTEM_ADMIN
      const user = (req as any).user;
      if (user.role !== 'ADMIN' && user.role !== 'SYSTEM_ADMIN' && user.id !== id) {
        return res.status(403).json({ success: false, message: 'Forbidden: You can only view your own activity' });
      }

      const data = await ActivityService.getUserLogs(id, filters);
      res.status(200).json({ success: true, ...data });
    } catch (error) {
      next(error);
    }
  }

  static async getAssetLogs(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const filters = ActivityLogQuerySchema.parse({ query: req.query }).query;
      const data = await ActivityService.getAssetLogs(id, filters);
      res.status(200).json({ success: true, ...data });
    } catch (error) {
      next(error);
    }
  }

  static async exportLogs(req: Request, res: Response, next: NextFunction) {
    try {
      const filters = ActivityLogExportSchema.parse({ query: req.query }).query;

      if (filters.format === 'csv') {
        await ActivityExportService.exportCSV(filters, res);
      } else if (filters.format === 'excel') {
        await ActivityExportService.exportExcel(filters, res);
      } else if (filters.format === 'pdf') {
        await ActivityExportService.exportPDF(filters, res);
      }
    } catch (error) {
      next(error);
    }
  }
}

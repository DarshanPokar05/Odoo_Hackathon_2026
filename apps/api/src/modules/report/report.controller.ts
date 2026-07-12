import { Request, Response, NextFunction } from 'express';
import { AnalyticsService } from './services/analytics.service';
import { ExportService } from './services/export.service';
import { ExportQuerySchema, ReportQuerySchema } from './report.schema';
import prisma from '../../infrastructure/database/prisma';

export class ReportController {
  static async getAssets(req: Request, res: Response, next: NextFunction) {
    try {
      const filters = ReportQuerySchema.parse({ query: req.query }).query;
      const data = await AnalyticsService.getAssetUtilization(filters);

      // Create activity log
      await prisma.activityLog.create({
        data: {
          userId: (req as any).user?.id,
          action: 'REPORT_GENERATED',
          entityType: 'REPORT',
          newValues: JSON.stringify({ type: 'ASSET_UTILIZATION', filters }),
        },
      });

      res.status(200).json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }

  static async getAllocations(req: Request, res: Response, next: NextFunction) {
    try {
      const filters = ReportQuerySchema.parse({ query: req.query }).query;
      const data = await AnalyticsService.getAllocations(filters);
      res.status(200).json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }

  static async getMaintenance(req: Request, res: Response, next: NextFunction) {
    try {
      const filters = ReportQuerySchema.parse({ query: req.query }).query;
      const data = await AnalyticsService.getMaintenance(filters);
      res.status(200).json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }

  static async getBookings(req: Request, res: Response, next: NextFunction) {
    try {
      const filters = ReportQuerySchema.parse({ query: req.query }).query;
      const data = await AnalyticsService.getBookings(filters);
      res.status(200).json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }

  static async getAudits(req: Request, res: Response, next: NextFunction) {
    try {
      const filters = ReportQuerySchema.parse({ query: req.query }).query;
      const data = await AnalyticsService.getAuditsMock(filters);
      res.status(200).json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }

  static async exportAssetsCSV(req: Request, res: Response, next: NextFunction) {
    try {
      const filters = ReportQuerySchema.parse({ query: req.query }).query;

      await prisma.activityLog.create({
        data: {
          userId: (req as any).user?.id,
          action: 'REPORT_EXPORTED',
          entityType: 'REPORT',
          newValues: JSON.stringify({ format: 'csv', type: 'ASSET' }),
        },
      });

      await ExportService.exportAssetsCSV(filters, res);
    } catch (error) {
      next(error);
    }
  }

  static async exportAssetsExcel(req: Request, res: Response, next: NextFunction) {
    try {
      const filters = ReportQuerySchema.parse({ query: req.query }).query;

      await prisma.activityLog.create({
        data: {
          userId: (req as any).user?.id,
          action: 'REPORT_EXPORTED',
          entityType: 'REPORT',
          newValues: JSON.stringify({ format: 'excel', type: 'ASSET' }),
        },
      });

      await ExportService.exportAssetsExcel(filters, res);
    } catch (error) {
      next(error);
    }
  }

  static async exportAssetsPDF(req: Request, res: Response, next: NextFunction) {
    try {
      const filters = ReportQuerySchema.parse({ query: req.query }).query;

      await prisma.activityLog.create({
        data: {
          userId: (req as any).user?.id,
          action: 'REPORT_EXPORTED',
          entityType: 'REPORT',
          newValues: JSON.stringify({ format: 'pdf', type: 'ASSET' }),
        },
      });

      await ExportService.exportAssetsPDF(filters, res);
    } catch (error) {
      next(error);
    }
  }
}

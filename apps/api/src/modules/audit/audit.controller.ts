import { Request, Response, NextFunction } from 'express';
import { AuditService } from './audit.service';
import { AuditStatus } from '@prisma/client';

export class AuditController {
  static async createAudit(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;
      if (!userId) return res.status(401).json({ success: false, message: 'Unauthorized' });

      const audit = await AuditService.createAudit(req.body, userId);
      res.status(201).json({ success: true, message: 'Audit created successfully', data: audit });
    } catch (error) {
      next(error);
    }
  }

  static async getAudits(req: Request, res: Response, next: NextFunction) {
    try {
      const departmentId = req.query.departmentId as string;
      const status = req.query.status as AuditStatus;
      
      const audits = await AuditService.getAudits({ departmentId, status });
      res.status(200).json({ success: true, message: 'Audits retrieved', data: audits });
    } catch (error) {
      next(error);
    }
  }

  static async getAuditDetails(req: Request, res: Response, next: NextFunction) {
    try {
      const audit = await AuditService.getAuditDetails(req.params.id);
      res.status(200).json({ success: true, message: 'Audit details retrieved', data: audit });
    } catch (error) {
      next(error);
    }
  }

  static async assignAuditors(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;
      if (!userId) return res.status(401).json({ success: false, message: 'Unauthorized' });

      const assignments = await AuditService.assignAuditors(req.params.id, req.body, userId);
      res.status(200).json({ success: true, message: 'Auditors assigned', data: assignments });
    } catch (error) {
      next(error);
    }
  }

  static async verifyAssets(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;
      if (!userId) return res.status(401).json({ success: false, message: 'Unauthorized' });

      const items = await AuditService.verifyAssets(req.params.id, req.body, userId);
      res.status(200).json({ success: true, message: 'Assets verified', data: items });
    } catch (error) {
      next(error);
    }
  }

  static async closeAudit(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;
      if (!userId) return res.status(401).json({ success: false, message: 'Unauthorized' });

      const audit = await AuditService.closeAudit(req.params.id, req.body, userId);
      res.status(200).json({ success: true, message: 'Audit closed', data: audit });
    } catch (error) {
      next(error);
    }
  }

  static async getReport(req: Request, res: Response, next: NextFunction) {
    try {
      const report = await AuditService.getReport(req.params.id);
      res.status(200).json({ success: true, message: 'Audit report retrieved', data: report });
    } catch (error) {
      next(error);
    }
  }
}

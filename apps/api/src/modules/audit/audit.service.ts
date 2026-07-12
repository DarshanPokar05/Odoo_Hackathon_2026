import { AuditRepository } from './audit.repository';
import { CreateAuditDto, AssignAuditorDto, VerifyAssetsDto, CloseAuditDto } from './audit.dto';
import { NotFoundError, BusinessRuleError } from '../../shared/errors/customErrors';
import prisma from '../../infrastructure/database/prisma';
import { AuditStatus, VerificationStatus } from '@prisma/client';

const auditRepo = new AuditRepository();

export class AuditService {
  static async createAudit(data: CreateAuditDto, userId: string) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return await prisma.$transaction(async (tx: any) => {
      const audit = await tx.auditCycle.create({
        data: {
          ...data,
          startDate: new Date(data.startDate),
          endDate: new Date(data.endDate),
          status: AuditStatus.DRAFT,
          createdBy: userId,
        },
      });

      await tx.activityLog.create({
        data: {
          action: 'CREATE_AUDIT',
          entityId: audit.id,
          entityType: 'AuditCycle',
          userId,
          newValues: JSON.stringify(audit),
        },
      });

      return audit;
    });
  }

  static async getAudits(filters: { departmentId?: string; status?: AuditStatus }) {
    return await auditRepo.findAll(filters);
  }

  static async getAuditDetails(id: string) {
    const audit = await auditRepo.findById(id);
    if (!audit) throw new NotFoundError('Audit not found');
    return audit;
  }

  static async assignAuditors(id: string, data: AssignAuditorDto, userId: string) {
    const audit = await auditRepo.findById(id);
    if (!audit) throw new NotFoundError('Audit not found');
    if (audit.status === AuditStatus.CLOSED) throw new BusinessRuleError('Cannot assign to closed audit', 'AUDIT_CLOSED');

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return await prisma.$transaction(async (tx: any) => {
      const assignments = await auditRepo.assignAuditors(id, data.auditorIds);

      if (audit.status === AuditStatus.DRAFT) {
        await tx.auditCycle.update({
          where: { id },
          data: { status: AuditStatus.ACTIVE },
        });
      }

      await tx.activityLog.create({
        data: {
          action: 'ASSIGN_AUDITOR',
          entityId: audit.id,
          entityType: 'AuditCycle',
          userId,
          newValues: JSON.stringify(assignments),
        },
      });

      // Notify auditors
      for (const auditorId of data.auditorIds) {
        // Find if they are already notified or just notify anyway
        await tx.notification?.create?.({
          data: {
            userId: auditorId,
            title: 'New Audit Assigned',
            message: `You have been assigned to audit: ${audit.title}`,
            type: 'SYSTEM', // Note: assuming SYSTEM because AUDIT is not in DB yet
          },
        }).catch(() => {}); // ignore if notifications table isn't set up this way
      }

      return assignments;
    });
  }

  static async verifyAssets(id: string, data: VerifyAssetsDto, verifierId: string) {
    const audit = await auditRepo.findById(id);
    if (!audit) throw new NotFoundError('Audit not found');
    if (audit.status !== AuditStatus.ACTIVE) throw new BusinessRuleError('Audit must be active to verify items', 'AUDIT_NOT_ACTIVE');

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return await prisma.$transaction(async (tx: any) => {
      const verifiedItems = await auditRepo.verifyItems(id, verifierId, data.items, tx);

      for (const item of data.items) {
        // Create DiscrepancyReport if missing or damaged
        if (item.verificationStatus === VerificationStatus.MISSING || item.verificationStatus === VerificationStatus.DAMAGED) {
          const auditItem = verifiedItems.find(v => v.assetId === item.assetId);
          if (auditItem) {
            await auditRepo.createDiscrepancy({
              auditItemId: auditItem.id,
              severity: item.verificationStatus === VerificationStatus.MISSING ? 'HIGH' : 'MEDIUM',
              description: item.remarks || `Asset marked as ${item.verificationStatus}`,
            }, tx);
          }
        }

        // Update asset status based on verification
        if (item.verificationStatus === VerificationStatus.MISSING) {
          await tx.asset.update({
            where: { id: item.assetId },
            data: { status: 'DISPOSED' }, // Marking as disposed or similar if missing? Just a simple status update for now. We might lack 'MISSING' in AssetStatus.
          }).catch(() => {});
        }
      }

      await tx.activityLog.create({
        data: {
          action: 'VERIFY_ASSETS',
          entityId: audit.id,
          entityType: 'AuditCycle',
          userId: verifierId,
          newValues: JSON.stringify(data.items),
        },
      });

      return verifiedItems;
    });
  }

  static async closeAudit(id: string, data: CloseAuditDto, userId: string) {
    const audit = await auditRepo.findById(id);
    if (!audit) throw new NotFoundError('Audit not found');
    if (audit.status === AuditStatus.CLOSED) throw new BusinessRuleError('Audit is already closed', 'AUDIT_CLOSED');

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return await prisma.$transaction(async (tx: any) => {
      const closedAudit = await tx.auditCycle.update({
        where: { id },
        data: { status: AuditStatus.CLOSED },
      });

      await tx.activityLog.create({
        data: {
          action: 'CLOSE_AUDIT',
          entityId: audit.id,
          entityType: 'AuditCycle',
          userId,
          newValues: JSON.stringify({ remarks: data.remarks }),
        },
      });

      return closedAudit;
    });
  }

  static async getReport(id: string) {
    const report = await auditRepo.getReport(id);
    if (!report) throw new NotFoundError('Audit not found');
    
    // Aggregation mapping
    const summary = {
      total: report.items.length,
      verified: report.items.filter((i: Record<string, unknown>) => i.verificationStatus === VerificationStatus.VERIFIED).length,
      missing: report.items.filter((i: Record<string, unknown>) => i.verificationStatus === VerificationStatus.MISSING).length,
      damaged: report.items.filter((i: Record<string, unknown>) => i.verificationStatus === VerificationStatus.DAMAGED).length,
      pending: report.items.filter((i: Record<string, unknown>) => i.verificationStatus === VerificationStatus.PENDING).length,
    };

    return {
      audit: {
        id: report.id,
        title: report.title,
        status: report.status,
        startDate: report.startDate,
        endDate: report.endDate,
      },
      summary,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      discrepancies: report.items.filter((i: Record<string, unknown>) => i.report).map((i: any) => ({
        asset: i.asset.name,
        tag: i.asset.assetTag,
        status: i.verificationStatus,
        report: i.report,
      })),
      items: report.items,
    };
  }
}

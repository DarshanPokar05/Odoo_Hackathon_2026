import prisma from '../../infrastructure/database/prisma';
import { Prisma, AuditCycle, AuditAssignment, AuditItem, DiscrepancyReport, AuditStatus, VerificationStatus } from '@prisma/client';

export class AuditRepository {
  async create(data: Prisma.AuditCycleUncheckedCreateInput): Promise<AuditCycle> {
    return prisma.auditCycle.create({
      data,
    });
  }

  async findById(id: string): Promise<AuditCycle | null> {
    return prisma.auditCycle.findUnique({
      where: { id },
      include: {
        assignments: {
          include: {
            auditor: {
              select: { id: true, firstName: true, lastName: true, email: true },
            },
          },
        },
        items: {
          include: {
            asset: true,
            report: true,
            verifier: {
              select: { id: true, firstName: true, lastName: true, email: true },
            },
          },
        },
        department: true,
      },
    });
  }

  async findAll(filters?: { departmentId?: string; status?: AuditStatus }): Promise<AuditCycle[]> {
    return prisma.auditCycle.findMany({
      where: filters,
      orderBy: { createdAt: 'desc' },
      include: {
        department: true,
        _count: {
          select: { items: true, assignments: true },
        },
      },
    });
  }

  async updateStatus(id: string, status: AuditStatus): Promise<AuditCycle> {
    return prisma.auditCycle.update({
      where: { id },
      data: { status },
    });
  }

  async assignAuditors(auditCycleId: string, auditorIds: string[]): Promise<AuditAssignment[]> {
    const assignments = auditorIds.map((auditorId) => ({
      auditCycleId,
      auditorId,
    }));

    // Use createMany to insert ignoring duplicates (if supported, otherwise we just insert)
    await prisma.auditAssignment.createMany({
      data: assignments,
      skipDuplicates: true,
    });

    return prisma.auditAssignment.findMany({
      where: { auditCycleId },
      include: { auditor: true },
    });
  }

  async verifyItems(
    auditCycleId: string,
    verifierId: string,
    items: { assetId: string; verificationStatus: VerificationStatus; remarks?: string }[],
    transaction?: Prisma.TransactionClient
  ): Promise<AuditItem[]> {
    const db = transaction || prisma;
    const verifiedItems: AuditItem[] = [];

    for (const item of items) {
      const updated = await db.auditItem.upsert({
        where: {
          auditCycleId_assetId: {
            auditCycleId,
            assetId: item.assetId,
          },
        },
        create: {
          auditCycleId,
          assetId: item.assetId,
          verificationStatus: item.verificationStatus,
          remarks: item.remarks,
          verifiedBy: verifierId,
          verifiedAt: new Date(),
        },
        update: {
          verificationStatus: item.verificationStatus,
          remarks: item.remarks,
          verifiedBy: verifierId,
          verifiedAt: new Date(),
        },
      });
      verifiedItems.push(updated);
    }
    return verifiedItems;
  }

  async createDiscrepancy(data: Prisma.DiscrepancyReportUncheckedCreateInput, transaction?: Prisma.TransactionClient): Promise<DiscrepancyReport> {
    const db = transaction || prisma;
    return db.discrepancyReport.upsert({
      where: { auditItemId: data.auditItemId },
      create: data,
      update: data,
    });
  }

  async getReport(auditCycleId: string) {
    return prisma.auditCycle.findUnique({
      where: { id: auditCycleId },
      include: {
        items: {
          include: {
            asset: true,
            report: true,
            verifier: {
              select: { id: true, firstName: true, lastName: true },
            },
          },
        },
      },
    });
  }
}

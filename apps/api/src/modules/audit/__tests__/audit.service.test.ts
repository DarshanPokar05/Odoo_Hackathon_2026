import { AuditService } from '../audit.service';
import { AuditRepository } from '../audit.repository';
import prisma from '../../../infrastructure/database/prisma';
import { AuditStatus, VerificationStatus } from '@prisma/client';

jest.mock('../audit.repository');
jest.mock('../../../infrastructure/database/prisma', () => ({
  $transaction: jest.fn((callback) => callback({
    auditCycle: { create: jest.fn().mockResolvedValue({ id: 'audit-1' }), update: jest.fn().mockResolvedValue({ id: 'audit-1', status: 'CLOSED' }) },
    activityLog: { create: jest.fn().mockResolvedValue({}) },
    asset: { update: jest.fn().mockResolvedValue({}) }
  })),
}));

describe('AuditService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createAudit', () => {
    it('should create an audit cycle and log activity', async () => {
      const data = {
        title: 'Q1 Audit',
        departmentId: 'dept-1',
        startDate: '2026-01-01T00:00:00Z',
        endDate: '2026-01-31T00:00:00Z'
      };

      const result = await AuditService.createAudit(data, 'user-1');

      expect(prisma.$transaction).toHaveBeenCalled();
      expect(result).toHaveProperty('id');
    });
  });

  describe('assignAuditors', () => {
    it('should assign auditors and change draft to active', async () => {
      jest.spyOn(AuditRepository.prototype, 'findById').mockResolvedValue({ id: 'audit-1', status: AuditStatus.DRAFT } as unknown as AuditCycle);
      jest.spyOn(AuditRepository.prototype, 'assignAuditors').mockResolvedValue([{ id: 'assignment-1' } as unknown as AuditAssignment]);

      const result = await AuditService.assignAuditors('audit-1', { auditorIds: ['auditor-1'] }, 'user-1');

      expect(AuditRepository.prototype.findById).toHaveBeenCalledWith('audit-1');
      expect(prisma.$transaction).toHaveBeenCalled();
      expect(result).toBeDefined();
    });

    it('should throw if audit is closed', async () => {
      jest.spyOn(AuditRepository.prototype, 'findById').mockResolvedValue({ id: 'audit-1', status: AuditStatus.CLOSED } as unknown as AuditCycle);

      await expect(AuditService.assignAuditors('audit-1', { auditorIds: ['auditor-1'] }, 'user-1'))
        .rejects.toThrow('Cannot assign to closed audit');
    });
  });

  describe('verifyAssets', () => {
    it('should verify assets and log discrepancies if missing', async () => {
      jest.spyOn(AuditRepository.prototype, 'findById').mockResolvedValue({ id: 'audit-1', status: AuditStatus.ACTIVE } as unknown as AuditCycle);
      jest.spyOn(AuditRepository.prototype, 'verifyItems').mockResolvedValue([{ id: 'audit-item-1', assetId: 'asset-1' } as unknown as AuditItem]);
      jest.spyOn(AuditRepository.prototype, 'createDiscrepancy').mockResolvedValue({} as unknown as DiscrepancyReport);

      const items = [{ assetId: 'asset-1', verificationStatus: VerificationStatus.MISSING }];
      await AuditService.verifyAssets('audit-1', { items }, 'user-1');

      expect(AuditRepository.prototype.verifyItems).toHaveBeenCalled();
      expect(AuditRepository.prototype.createDiscrepancy).toHaveBeenCalled();
    });
  });

  describe('closeAudit', () => {
    it('should close an active audit', async () => {
      jest.spyOn(AuditRepository.prototype, 'findById').mockResolvedValue({ id: 'audit-1', status: AuditStatus.ACTIVE } as unknown as AuditCycle);

      await AuditService.closeAudit('audit-1', { remarks: 'Done' }, 'user-1');

      expect(prisma.$transaction).toHaveBeenCalled();
    });
  });
});

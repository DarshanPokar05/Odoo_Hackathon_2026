import { AllocationService } from '../allocation.service';
import { AllocationRepository } from '../allocation.repository';
import prisma from '../../../infrastructure/database/prisma';
import { NotFoundError, BusinessRuleError } from '../../../shared/errors/customErrors';

jest.mock('../allocation.repository');
jest.mock('../../../infrastructure/database/prisma', () => ({
  asset: {
    findUnique: jest.fn(),
    update: jest.fn(),
  },
  user: {
    findUnique: jest.fn(),
  },
  transferRequest: {
    create: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
  },
  $transaction: jest.fn(),
}));

describe('AllocationService', () => {
  const mockActionBy = 'user-1';

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('allocateAsset', () => {
    it('should throw NotFoundError if asset is not found', async () => {
      (prisma.asset.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(
        AllocationService.allocateAsset({ assetId: 'a1', allocatedTo: 'u1' }, mockActionBy)
      ).rejects.toThrow(NotFoundError);
    });

    it('should throw BusinessRuleError if asset is not AVAILABLE', async () => {
      (prisma.asset.findUnique as jest.Mock).mockResolvedValue({ id: 'a1', status: 'ALLOCATED' });

      await expect(
        AllocationService.allocateAsset({ assetId: 'a1', allocatedTo: 'u1' }, mockActionBy)
      ).rejects.toThrow(BusinessRuleError);
    });

    it('should throw NotFoundError if user is not found', async () => {
      (prisma.asset.findUnique as jest.Mock).mockResolvedValue({ id: 'a1', status: 'AVAILABLE' });
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(
        AllocationService.allocateAsset({ assetId: 'a1', allocatedTo: 'u1' }, mockActionBy)
      ).rejects.toThrow(NotFoundError);
    });

    it('should throw BusinessRuleError if user is not ACTIVE', async () => {
      (prisma.asset.findUnique as jest.Mock).mockResolvedValue({ id: 'a1', status: 'AVAILABLE' });
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({ id: 'u1', status: 'INACTIVE' });

      await expect(
        AllocationService.allocateAsset({ assetId: 'a1', allocatedTo: 'u1' }, mockActionBy)
      ).rejects.toThrow(BusinessRuleError);
    });

    it('should call executeAllocationTransaction on valid input', async () => {
      (prisma.asset.findUnique as jest.Mock).mockResolvedValue({ id: 'a1', status: 'AVAILABLE', condition: 'GOOD' });
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({ id: 'u1', status: 'ACTIVE' });
      (AllocationRepository.findActiveAllocation as jest.Mock).mockResolvedValue(null);

      await AllocationService.allocateAsset({ assetId: 'a1', allocatedTo: 'u1', remarks: 'Test' }, mockActionBy);

      expect(AllocationRepository.executeAllocationTransaction).toHaveBeenCalledWith(
        expect.objectContaining({
          assetId: 'a1',
          allocatedTo: 'u1',
          allocatedBy: mockActionBy,
          conditionBefore: 'GOOD',
        }),
        'a1',
        mockActionBy
      );
    });
  });

  describe('returnAsset', () => {
    it('should throw NotFoundError if allocation does not exist', async () => {
      (AllocationRepository.findById as jest.Mock).mockResolvedValue(null);

      await expect(
        AllocationService.returnAsset('alloc1', { conditionAfter: 'GOOD' }, mockActionBy)
      ).rejects.toThrow(NotFoundError);
    });

    it('should call executeReturnTransaction on valid return', async () => {
      (AllocationRepository.findById as jest.Mock).mockResolvedValue({
        id: 'alloc1',
        assetId: 'a1',
        status: 'ACTIVE',
      });

      await AllocationService.returnAsset('alloc1', { conditionAfter: 'FAIR' }, mockActionBy);

      expect(AllocationRepository.executeReturnTransaction).toHaveBeenCalledWith(
        'alloc1',
        'a1',
        { conditionAfter: 'FAIR' },
        mockActionBy
      );
    });
  });
});

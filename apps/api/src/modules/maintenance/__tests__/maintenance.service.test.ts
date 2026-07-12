import { MaintenanceService } from '../maintenance.service';
import { MaintenanceRepository } from '../maintenance.repository';
import { AssetRepository } from '../../asset/asset.repository';
import { MaintenanceStatus, MaintenancePriority, AssetStatus } from '@prisma/client';
import { CustomError } from '../../../shared/errors/customErrors';

jest.mock('../maintenance.repository');
jest.mock('../../asset/asset.repository');

describe('MaintenanceService', () => {
  let maintenanceService: MaintenanceService;
  let maintenanceRepositoryMock: jest.Mocked<MaintenanceRepository>;
  let assetRepositoryMock: jest.Mocked<AssetRepository>;

  beforeEach(() => {
    maintenanceRepositoryMock = new MaintenanceRepository() as jest.Mocked<MaintenanceRepository>;
    assetRepositoryMock = new AssetRepository() as jest.Mocked<AssetRepository>;

    maintenanceService = new MaintenanceService();
    (maintenanceService as unknown as { maintenanceRepository: MaintenanceRepository }).maintenanceRepository = maintenanceRepositoryMock;
    (maintenanceService as unknown as { assetRepository: AssetRepository }).assetRepository = assetRepositoryMock;
  });

  describe('raiseRequest', () => {
    it('should raise a maintenance request if asset exists', async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const mockAsset = { id: 'asset-1' } as any;
      (AssetRepository.findById as jest.Mock).mockResolvedValue(mockAsset);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      maintenanceRepositoryMock.createMaintenanceRequest.mockResolvedValue({ id: 'request-1' } as any);

      const result = await maintenanceService.raiseRequest({
        assetId: 'asset-1',
        description: 'Test description',
        priority: MaintenancePriority.LOW,
      }, 'user-1');

      expect(result.id).toBe('request-1');
      expect(maintenanceRepositoryMock.createMaintenanceRequest).toHaveBeenCalled();
    });

    it('should throw an error if asset does not exist', async () => {
      (AssetRepository.findById as jest.Mock).mockResolvedValue(null);

      await expect(
        maintenanceService.raiseRequest({
          assetId: 'asset-1',
          description: 'Test',
          priority: MaintenancePriority.LOW,
        }, 'user-1')
      ).rejects.toThrow(CustomError);
    });
  });

  describe('approveRequest', () => {
    it('should approve a PENDING request and update asset to UNDER_MAINTENANCE', async () => {
      maintenanceRepositoryMock.getMaintenanceRequestById.mockResolvedValue({
        id: 'request-1',
        status: MaintenanceStatus.PENDING,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      maintenanceRepositoryMock.updateMaintenanceStatus.mockResolvedValue({ id: 'request-1' } as any);

      await maintenanceService.approveRequest('request-1', { remarks: 'Approved' }, 'user-1');

      expect(maintenanceRepositoryMock.updateMaintenanceStatus).toHaveBeenCalledWith(
        'request-1',
        MaintenanceStatus.APPROVED,
        AssetStatus.UNDER_MAINTENANCE,
        'user-1',
        'Approved',
        { approvedBy: 'user-1' }
      );
    });

    it('should throw if request is not PENDING', async () => {
      maintenanceRepositoryMock.getMaintenanceRequestById.mockResolvedValue({
        id: 'request-1',
        status: MaintenanceStatus.APPROVED,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any);

      await expect(
        maintenanceService.approveRequest('request-1', {}, 'user-1')
      ).rejects.toThrow(CustomError);
    });
  });

  describe('resolveRequest', () => {
    it('should resolve an IN_PROGRESS request and update asset to AVAILABLE', async () => {
      maintenanceRepositoryMock.getMaintenanceRequestById.mockResolvedValue({
        id: 'request-1',
        status: MaintenanceStatus.IN_PROGRESS,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      maintenanceRepositoryMock.updateMaintenanceStatus.mockResolvedValue({ id: 'request-1' } as any);

      await maintenanceService.resolveRequest('request-1', { remarks: 'Fixed' }, 'user-1');

      expect(maintenanceRepositoryMock.updateMaintenanceStatus).toHaveBeenCalledWith(
        'request-1',
        MaintenanceStatus.RESOLVED,
        AssetStatus.AVAILABLE,
        'user-1',
        'Fixed',
        expect.any(Object)
      );
    });
  });
});

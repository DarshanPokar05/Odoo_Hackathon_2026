import { AssetService } from '../asset.service';
import { AssetRepository } from '../asset.repository';
import { NotFoundError } from '../../../shared/errors/customErrors';
import { CreateAssetDTO } from '../asset.dto';

jest.mock('../asset.repository');
jest.mock('../../../infrastructure/database/prisma', () => ({
  __esModule: true,
  default: {
    $transaction: jest.fn(async (cb) => cb()),
  },
}));

describe('AssetService', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('registerAsset', () => {
    it('should successfully register a new asset', async () => {
      const mockData = {
        name: 'MacBook Pro',
        categoryId: 'cat-id',
        condition: 'NEW',
        isBookable: true,
      };
      
      const mockAsset = {
        id: 'asset-id',
        ...mockData,
        assetTag: 'AST-2026-0001',
        status: 'AVAILABLE',
        createdBy: 'user-id',
      };

      (AssetRepository.count as jest.Mock).mockResolvedValue(0);
      (AssetRepository.create as jest.Mock).mockResolvedValue(mockAsset);
      (AssetRepository.createActivityLog as jest.Mock).mockResolvedValue({});
      (AssetRepository.createHistory as jest.Mock).mockResolvedValue({});

      const result = await AssetService.registerAsset(mockData as unknown as CreateAssetDTO, 'user-id');

      expect(AssetRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'MacBook Pro',
          assetTag: 'AST-2026-0001',
          status: 'AVAILABLE',
          createdBy: 'user-id',
        }),
        undefined
      );
      expect(result).toEqual(mockAsset);
    });
  });

  describe('getAssetDetails', () => {
    it('should throw NotFoundError if asset does not exist', async () => {
      (AssetRepository.findById as jest.Mock).mockResolvedValue(null);

      await expect(AssetService.getAssetDetails('invalid-id')).rejects.toThrow(NotFoundError);
    });
  });
});

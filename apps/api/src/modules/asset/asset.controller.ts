import { Request, Response, NextFunction } from 'express';
import { AssetService } from './asset.service';
import { CreateAssetDTO, UpdateAssetDTO } from './asset.dto';

export class AssetController {
  static async registerAsset(req: Request, res: Response, next: NextFunction) {
    try {
      const data: CreateAssetDTO = req.body;
      const userId = req.user?.id; // Assuming user is populated by authMiddleware

      if (!userId) {
        return res.status(401).json({ success: false, message: 'Unauthorized' });
      }

      const asset = await AssetService.registerAsset(data, userId);
      res.status(201).json({
        success: true,
        message: 'Asset registered successfully',
        data: asset,
      });
    } catch (error) {
      next(error);
    }
  }

  static async getAssets(req: Request, res: Response, next: NextFunction) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const search = req.query.search as string;

      const skip = (page - 1) * limit;

      const result = await AssetService.getAssets(skip, limit, search);

      res.status(200).json({
        success: true,
        message: 'Assets retrieved successfully',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  static async getAssetDetails(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const asset = await AssetService.getAssetDetails(id);

      res.status(200).json({
        success: true,
        message: 'Asset details retrieved successfully',
        data: asset,
      });
    } catch (error) {
      next(error);
    }
  }

  static async updateAsset(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const data: UpdateAssetDTO = req.body;
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({ success: false, message: 'Unauthorized' });
      }

      const asset = await AssetService.updateAsset(id, data, userId);

      res.status(200).json({
        success: true,
        message: 'Asset updated successfully',
        data: asset,
      });
    } catch (error) {
      next(error);
    }
  }

  static async deleteAsset(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({ success: false, message: 'Unauthorized' });
      }

      await AssetService.deleteAsset(id, userId);

      res.status(200).json({
        success: true,
        message: 'Asset deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  static async getAssetTimeline(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const timeline = await AssetService.getAssetTimeline(id);

      res.status(200).json({
        success: true,
        message: 'Asset timeline retrieved successfully',
        data: timeline,
      });
    } catch (error) {
      next(error);
    }
  }
}

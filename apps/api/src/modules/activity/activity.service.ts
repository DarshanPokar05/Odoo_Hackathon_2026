import { ActivityRepository } from './activity.repository';
import { ActivityLogQueryFilters } from './activity.dto';
import { NotFoundError } from '../../shared/errors/customErrors';

export class ActivityService {
  static async getLogs(filters: ActivityLogQueryFilters) {
    return ActivityRepository.findManyWithCursor(filters);
  }

  static async getLogById(id: string) {
    const log = await ActivityRepository.findById(id);
    if (!log) {
      throw new NotFoundError(`Activity Log with ID ${id} not found`);
    }
    return log;
  }

  static async getUserLogs(userId: string, filters: ActivityLogQueryFilters) {
    return ActivityRepository.findManyWithCursor({ ...filters, userId });
  }

  static async getAssetLogs(assetId: string, filters: ActivityLogQueryFilters) {
    return ActivityRepository.findManyWithCursor({ ...filters, entityType: 'ASSET', entityId: assetId });
  }
}

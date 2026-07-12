import { eventDispatcher } from '../../shared/events/eventDispatcher';
import { AppEvents } from '../../shared/events/eventConstants';
import { NotificationService } from './notification.service';
import { NotificationType } from '@prisma/client';

const notificationService = new NotificationService();

export class NotificationConsumer {
  static init() {
    // Asset Events
    eventDispatcher.on(AppEvents.ASSET_ASSIGNED, async (payload: { userId: string; assetName: string; assetTag: string }) => {
      await notificationService.createNotification({
        userId: payload.userId,
        title: 'New Asset Assigned',
        message: `You have been assigned a new asset: ${payload.assetName} (${payload.assetTag}).`,
        type: NotificationType.INFO,
        event: AppEvents.ASSET_ASSIGNED,
        metadata: { assetTag: payload.assetTag },
      });
    });

    eventDispatcher.on(AppEvents.ASSET_RETURNED, async (payload: { userId: string; assetName: string; assetTag: string }) => {
      await notificationService.createNotification({
        userId: payload.userId,
        title: 'Asset Return Acknowledged',
        message: `Your return of asset ${payload.assetName} (${payload.assetTag}) has been acknowledged.`,
        type: NotificationType.INFO,
        event: AppEvents.ASSET_RETURNED,
        metadata: { assetTag: payload.assetTag },
      });
    });

    // Audit Events
    eventDispatcher.on(AppEvents.AUDIT_ASSIGNED, async (payload: { userId: string; auditTitle: string; auditId: string }) => {
      await notificationService.createNotification({
        userId: payload.userId,
        title: 'New Audit Assignment',
        message: `You have been assigned to perform an audit: ${payload.auditTitle}.`,
        type: NotificationType.WARNING,
        event: AppEvents.AUDIT_ASSIGNED,
        metadata: { auditId: payload.auditId },
      });
    });

    // Booking Events
    eventDispatcher.on(AppEvents.BOOKING_CREATED, async (payload: { userId: string; assetName: string; bookingId: string }) => {
      await notificationService.createNotification({
        userId: payload.userId,
        title: 'Booking Confirmed',
        message: `Your booking for ${payload.assetName} has been created.`,
        type: NotificationType.INFO,
        event: AppEvents.BOOKING_CREATED,
        metadata: { bookingId: payload.bookingId },
      });
    });

    // System Events
    eventDispatcher.on(AppEvents.OVERDUE_RETURN, async (payload: { userId: string; assetName: string }) => {
      await notificationService.createNotification({
        userId: payload.userId,
        title: 'Overdue Asset Return',
        message: `Your assigned asset ${payload.assetName} is overdue for return. Please return it immediately.`,
        type: NotificationType.CRITICAL,
        event: AppEvents.OVERDUE_RETURN,
      });
    });
    
    // Additional events can be added easily here
  }
}

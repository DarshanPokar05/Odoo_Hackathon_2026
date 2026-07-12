import { NotificationService } from '../notification.service';
import { NotificationRepository } from '../notification.repository';
import { NotificationType } from '@prisma/client';

jest.mock('../notification.repository');

describe('NotificationService', () => {
  let notificationService: NotificationService;
  let mockRepository: jest.Mocked<NotificationRepository>;

  const mockUserId = 'user-123';
  const mockNotification = {
    id: 'notif-1',
    userId: mockUserId,
    title: 'Test Notification',
    message: 'This is a test notification',
    type: NotificationType.INFO,
    event: 'TEST_EVENT',
    isRead: false,
    readAt: null,
    metadata: null,
    isDeleted: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(() => {
    mockRepository = new NotificationRepository() as jest.Mocked<NotificationRepository>;
    (NotificationRepository as jest.Mock).mockImplementation(() => mockRepository);
    notificationService = new NotificationService();
    // Inject mock repository via any cast to bypass private modifier
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (notificationService as any).repository = mockRepository;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createNotification', () => {
    it('should create a notification', async () => {
      mockRepository.create.mockResolvedValue(mockNotification);
      const dto = {
        userId: mockUserId,
        title: 'Test Notification',
        message: 'This is a test notification',
        type: NotificationType.INFO,
        event: 'TEST_EVENT',
      };

      const result = await notificationService.createNotification(dto);

      expect(mockRepository.create).toHaveBeenCalledWith(dto);
      expect(result).toEqual(mockNotification);
    });
  });

  describe('getNotifications', () => {
    it('should return paginated notifications and unread count', async () => {
      mockRepository.findMany.mockResolvedValue({ notifications: [mockNotification], total: 1 });
      mockRepository.getUnreadCount.mockResolvedValue(1);

      const result = await notificationService.getNotifications(mockUserId, { page: 1, limit: 10 });

      expect(mockRepository.findMany).toHaveBeenCalledWith(mockUserId, { page: 1, limit: 10 });
      expect(result.notifications).toHaveLength(1);
      expect(result.meta.total).toBe(1);
      expect(result.meta.unreadCount).toBe(1);
    });
  });

  describe('getNotificationById', () => {
    it('should return a notification if found', async () => {
      mockRepository.findById.mockResolvedValue(mockNotification);

      const result = await notificationService.getNotificationById('notif-1', mockUserId);

      expect(result).toEqual(mockNotification);
    });

    it('should throw NotFoundError if notification does not exist', async () => {
      mockRepository.findById.mockResolvedValue(null);

      await expect(notificationService.getNotificationById('invalid-id', mockUserId))
        .rejects
        .toThrow('Notification not found');
    });
  });

  describe('markAsRead', () => {
    it('should mark a notification as read', async () => {
      mockRepository.findById.mockResolvedValue(mockNotification);
      mockRepository.markAsRead.mockResolvedValue({ ...mockNotification, isRead: true, readAt: new Date() });

      const result = await notificationService.markAsRead('notif-1', mockUserId);

      expect(mockRepository.markAsRead).toHaveBeenCalledWith('notif-1', mockUserId);
      expect(result.isRead).toBe(true);
    });

    it('should not call repository if notification is already read', async () => {
      mockRepository.findById.mockResolvedValue({ ...mockNotification, isRead: true });

      const result = await notificationService.markAsRead('notif-1', mockUserId);

      expect(mockRepository.markAsRead).not.toHaveBeenCalled();
      expect(result.isRead).toBe(true);
    });
  });

  describe('markAllAsRead', () => {
    it('should mark all notifications as read for a user', async () => {
      mockRepository.markAllAsRead.mockResolvedValue({ count: 5 });

      const result = await notificationService.markAllAsRead(mockUserId);

      expect(mockRepository.markAllAsRead).toHaveBeenCalledWith(mockUserId);
      expect(result.success).toBe(true);
    });
  });

  describe('deleteNotification', () => {
    it('should soft delete a notification', async () => {
      mockRepository.findById.mockResolvedValue(mockNotification);
      mockRepository.softDelete.mockResolvedValue({ ...mockNotification, isDeleted: true });

      const result = await notificationService.deleteNotification('notif-1', mockUserId);

      expect(mockRepository.softDelete).toHaveBeenCalledWith('notif-1', mockUserId);
      expect(result.success).toBe(true);
    });
  });
});

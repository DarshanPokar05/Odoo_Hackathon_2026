import { BookingService } from '../booking.service';
import { BookingRepository } from '../booking.repository';

import { ConflictError, BusinessRuleError, AuthorizationError } from '../../../shared/errors/customErrors';

jest.mock('../booking.repository');
jest.mock('../../../infrastructure/database/prisma', () => ({
  $transaction: jest.fn((callback) => callback({
    activityLog: {
      create: jest.fn(),
    },
  })),
  activityLog: {
    create: jest.fn(),
  },
}));

describe('BookingService', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createBooking', () => {
    const futureStart = new Date(Date.now() + 3600 * 1000).toISOString();
    const futureEnd = new Date(Date.now() + 7200 * 1000).toISOString();

    it('should throw BusinessRuleError if startTime >= endTime', async () => {
      await expect(
        BookingService.createBooking(
          {
            resourceId: 'res-1',
            startTime: futureEnd,
            endTime: futureStart,
            purpose: 'Test Meeting',
          },
          'user-1'
        )
      ).rejects.toThrow(BusinessRuleError);
    });

    it('should throw BusinessRuleError if resource is not ACTIVE', async () => {
      (BookingRepository.findResourceById as jest.Mock).mockResolvedValueOnce({
        id: 'res-1',
        status: 'INACTIVE',
      });

      await expect(
        BookingService.createBooking(
          {
            resourceId: 'res-1',
            startTime: futureStart,
            endTime: futureEnd,
            purpose: 'Test Meeting',
          },
          'user-1'
        )
      ).rejects.toThrow('Resource is not active and cannot be booked');
    });

    it('should throw ConflictError if overlapping booking exists', async () => {
      (BookingRepository.findResourceById as jest.Mock).mockResolvedValueOnce({
        id: 'res-1',
        status: 'ACTIVE',
        name: 'Conference Room A',
      });
      (BookingRepository.findOverlappingBookings as jest.Mock).mockResolvedValueOnce([
        { id: 'existing-booking' },
      ]);

      await expect(
        BookingService.createBooking(
          {
            resourceId: 'res-1',
            startTime: futureStart,
            endTime: futureEnd,
            purpose: 'Test Meeting',
          },
          'user-1'
        )
      ).rejects.toThrow(ConflictError);
    });

    it('should create booking successfully when slot is available', async () => {
      (BookingRepository.findResourceById as jest.Mock).mockResolvedValueOnce({
        id: 'res-1',
        status: 'ACTIVE',
        name: 'Conference Room A',
      });
      (BookingRepository.findOverlappingBookings as jest.Mock).mockResolvedValueOnce([]);
      (BookingRepository.createBooking as jest.Mock).mockResolvedValueOnce({
        id: 'new-booking-1',
        resourceId: 'res-1',
        startTime: futureStart,
        endTime: futureEnd,
        purpose: 'Test Meeting',
        status: 'UPCOMING',
      });

      const result = await BookingService.createBooking(
        {
          resourceId: 'res-1',
          startTime: futureStart,
          endTime: futureEnd,
          purpose: 'Test Meeting',
        },
        'user-1'
      );

      expect(BookingRepository.createBooking).toHaveBeenCalledWith(
        expect.objectContaining({
          resourceId: 'res-1',
          bookedBy: 'user-1',
          status: 'UPCOMING',
        }),
        expect.anything()
      );
      expect(result.id).toBe('new-booking-1');
    });
  });

  describe('cancelBooking', () => {
    it('should throw AuthorizationError if user is not owner or ADMIN', async () => {
      (BookingRepository.findBookingById as jest.Mock).mockResolvedValueOnce({
        id: 'booking-1',
        bookedBy: 'other-user',
        status: 'UPCOMING',
      });

      await expect(
        BookingService.cancelBooking('booking-1', 'user-1', 'EMPLOYEE')
      ).rejects.toThrow(AuthorizationError);
    });

    it('should cancel booking and log activity when authorized', async () => {
      (BookingRepository.findBookingById as jest.Mock).mockResolvedValueOnce({
        id: 'booking-1',
        bookedBy: 'user-1',
        status: 'UPCOMING',
      });
      (BookingRepository.updateBooking as jest.Mock).mockResolvedValueOnce({
        id: 'booking-1',
        status: 'CANCELLED',
      });

      const result = await BookingService.cancelBooking('booking-1', 'user-1', 'EMPLOYEE');

      expect(BookingRepository.updateBooking).toHaveBeenCalledWith(
        'booking-1',
        { status: 'CANCELLED' },
        expect.anything()
      );
      expect(result.status).toBe('CANCELLED');
    });
  });
});

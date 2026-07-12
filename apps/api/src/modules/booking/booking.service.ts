import { BookingRepository } from './booking.repository';
import {
  CreateResourceDTO,
  UpdateResourceDTO,
  CreateBookingDTO,
  UpdateBookingDTO,
  BookingQueryFilters,
  ResourceQueryFilters,
  AvailableResourceFilters,
} from './booking.dto';
import {
  ConflictError,
  NotFoundError,
  BusinessRuleError,
  AuthorizationError,
} from '../../shared/errors/customErrors';
import prisma from '../../infrastructure/database/prisma';

export class BookingService {
  // ==========================================
  // Resource Service Methods
  // ==========================================

  static async createResource(data: CreateResourceDTO, userId: string) {
    const resource = await BookingRepository.createResource(data);

    await prisma.activityLog.create({
      data: {
        userId,
        action: 'RESOURCE_CREATED',
        entityId: resource.id,
        entityType: 'RESOURCE',
        newValues: JSON.stringify(resource),
      },
    });

    console.log(`[Notification Mock] New Resource Registered: ${resource.name}`);

    return resource;
  }

  static async updateResource(id: string, data: UpdateResourceDTO, userId: string) {
    const existing = await BookingRepository.findResourceById(id);
    if (!existing) {
      throw new NotFoundError('Resource not found');
    }

    const updated = await BookingRepository.updateResource(id, data);

    await prisma.activityLog.create({
      data: {
        userId,
        action: 'RESOURCE_UPDATED',
        entityId: updated.id,
        entityType: 'RESOURCE',
        oldValues: JSON.stringify(existing),
        newValues: JSON.stringify(updated),
      },
    });

    return updated;
  }

  static async deleteResource(id: string, userId: string) {
    const existing = await BookingRepository.findResourceById(id);
    if (!existing) {
      throw new NotFoundError('Resource not found');
    }

    const deleted = await BookingRepository.softDeleteResource(id);

    await prisma.activityLog.create({
      data: {
        userId,
        action: 'RESOURCE_DELETED',
        entityId: id,
        entityType: 'RESOURCE',
      },
    });

    return deleted;
  }

  static async getResourceById(id: string) {
    const resource = await BookingRepository.findResourceById(id);
    if (!resource) {
      throw new NotFoundError('Resource not found');
    }
    return resource;
  }

  static async getAllResources(filters: ResourceQueryFilters) {
    return BookingRepository.findAllResources(filters);
  }

  static async getAvailableResources(filters: AvailableResourceFilters) {
    const start = new Date(filters.startTime);
    const end = new Date(filters.endTime);
    if (start.getTime() >= end.getTime()) {
      throw new BusinessRuleError('startTime must be before endTime');
    }

    return BookingRepository.findAvailableResources(filters);
  }

  // ==========================================
  // Booking Service Methods
  // ==========================================

  static async createBooking(data: CreateBookingDTO, userId: string) {
    const start = new Date(data.startTime);
    const end = new Date(data.endTime);

    if (start.getTime() >= end.getTime()) {
      throw new BusinessRuleError('startTime must be before endTime');
    }

    const now = new Date();
    if (start.getTime() < now.getTime()) {
      throw new BusinessRuleError('Cannot create bookings in the past');
    }

    const resource = await BookingRepository.findResourceById(data.resourceId);
    if (!resource) {
      throw new NotFoundError('Resource not found');
    }

    if (resource.status !== 'ACTIVE') {
      throw new BusinessRuleError('Resource is not active and cannot be booked');
    }

    return prisma.$transaction(async (tx) => {
      // Overlap validation
      const overlaps = await BookingRepository.findOverlappingBookings(
        data.resourceId,
        start,
        end,
        undefined,
        tx
      );

      if (overlaps.length > 0) {
        throw new ConflictError('Resource is already booked for the requested time slot');
      }

      const booking = await BookingRepository.createBooking(
        {
          ...data,
          bookedBy: userId,
          status: 'UPCOMING',
        },
        tx
      );

      await tx.activityLog.create({
        data: {
          userId,
          action: 'BOOKING_CREATED',
          entityId: booking.id,
          entityType: 'BOOKING',
          newValues: JSON.stringify({
            resourceId: booking.resourceId,
            startTime: booking.startTime,
            endTime: booking.endTime,
            purpose: booking.purpose,
          }),
        },
      });

      console.log(
        `[Notification Mock] Booking Created for Resource ${resource.name} by User ${userId} from ${data.startTime} to ${data.endTime}`
      );

      return booking;
    });
  }

  static async updateBooking(
    id: string,
    data: UpdateBookingDTO,
    userId: string,
    userRole: string
  ) {
    const existingBooking = await BookingRepository.findBookingById(id);
    if (!existingBooking) {
      throw new NotFoundError('Booking not found');
    }

    if (existingBooking.bookedBy !== userId && userRole !== 'ADMIN') {
      throw new AuthorizationError('You are not authorized to update this booking');
    }

    if (existingBooking.status === 'COMPLETED' || existingBooking.status === 'CANCELLED') {
      throw new BusinessRuleError(`Cannot update a booking that is already ${existingBooking.status}`);
    }

    const newStart = data.startTime ? new Date(data.startTime) : existingBooking.startTime;
    const newEnd = data.endTime ? new Date(data.endTime) : existingBooking.endTime;

    if (newStart.getTime() >= newEnd.getTime()) {
      throw new BusinessRuleError('startTime must be before endTime');
    }

    return prisma.$transaction(async (tx) => {
      // If time interval changed, perform conflict detection excluding current booking
      const timeChanged =
        newStart.getTime() !== existingBooking.startTime.getTime() ||
        newEnd.getTime() !== existingBooking.endTime.getTime();

      if (timeChanged) {
        const now = new Date();
        if (newStart.getTime() < now.getTime()) {
          throw new BusinessRuleError('Cannot reschedule bookings to the past');
        }
        const overlaps = await BookingRepository.findOverlappingBookings(
          existingBooking.resourceId,
          newStart,
          newEnd,
          id,
          tx
        );

        if (overlaps.length > 0) {
          throw new ConflictError('Resource is already booked for the requested time slot');
        }
      }

      const updated = await BookingRepository.updateBooking(id, data, tx);

      await tx.activityLog.create({
        data: {
          userId,
          action: timeChanged ? 'BOOKING_RESCHEDULED' : 'BOOKING_UPDATED',
          entityId: updated.id,
          entityType: 'BOOKING',
          oldValues: JSON.stringify({
            startTime: existingBooking.startTime,
            endTime: existingBooking.endTime,
            purpose: existingBooking.purpose,
          }),
          newValues: JSON.stringify({
            startTime: updated.startTime,
            endTime: updated.endTime,
            purpose: updated.purpose,
          }),
        },
      });

      console.log(
        `[Notification Mock] Booking ${id} Rescheduled/Updated by User ${userId}`
      );

      return updated;
    });
  }

  static async cancelBooking(id: string, userId: string, userRole: string) {
    const existingBooking = await BookingRepository.findBookingById(id);
    if (!existingBooking) {
      throw new NotFoundError('Booking not found');
    }

    if (existingBooking.bookedBy !== userId && userRole !== 'ADMIN') {
      throw new AuthorizationError('You are not authorized to cancel this booking');
    }

    if (existingBooking.status === 'COMPLETED' || existingBooking.status === 'CANCELLED') {
      throw new BusinessRuleError(`Booking is already ${existingBooking.status}`);
    }

    const cancelled = await BookingRepository.updateBooking(
      id,
      { status: 'CANCELLED' },
      prisma
    );

    await prisma.activityLog.create({
      data: {
        userId,
        action: 'BOOKING_CANCELLED',
        entityId: cancelled.id,
        entityType: 'BOOKING',
        oldValues: JSON.stringify({ status: existingBooking.status }),
        newValues: JSON.stringify({ status: 'CANCELLED' }),
      },
    });

    console.log(`[Notification Mock] Booking ${id} Cancelled by User ${userId}`);

    return cancelled;
  }

  static async getBookingById(id: string) {
    const booking = await BookingRepository.findBookingById(id);
    if (!booking) {
      throw new NotFoundError('Booking not found');
    }
    return booking;
  }

  static async getAllBookings(filters: BookingQueryFilters) {
    return BookingRepository.findAllBookings(filters);
  }

  static async getCalendar(resourceId: string, start?: string, end?: string) {
    const resource = await BookingRepository.findResourceById(resourceId);
    if (!resource) {
      throw new NotFoundError('Resource not found');
    }

    return BookingRepository.findCalendarByResourceId(resourceId, start, end);
  }
}

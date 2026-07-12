import prisma from '../../infrastructure/database/prisma';
import {
  CreateResourceDTO,
  UpdateResourceDTO,
  CreateBookingDTO,
  UpdateBookingDTO,
  BookingQueryFilters,
  ResourceQueryFilters,
  AvailableResourceFilters,
} from './booking.dto';
import { Prisma, BookingStatus } from '@prisma/client';

export class BookingRepository {
  // ==========================================
  // Resource Repository Methods
  // ==========================================

  static async createResource(data: CreateResourceDTO) {
    return prisma.resource.create({
      data: {
        name: data.name,
        assetId: data.assetId || null,
        resourceType: data.resourceType,
        capacity: data.capacity ?? 1,
        location: data.location,
        status: data.status || 'ACTIVE',
      },
    });
  }

  static async updateResource(id: string, data: UpdateResourceDTO) {
    return prisma.resource.update({
      where: { id },
      data,
    });
  }

  static async softDeleteResource(id: string) {
    return prisma.resource.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        status: 'INACTIVE',
      },
    });
  }

  static async findResourceById(id: string) {
    return prisma.resource.findFirst({
      where: {
        id,
        deletedAt: null,
      },
    });
  }

  static async findAllResources(filters: ResourceQueryFilters) {
    const whereClause: Prisma.ResourceWhereInput = { deletedAt: null };

    if (filters.resourceType) whereClause.resourceType = filters.resourceType;
    if (filters.location) {
      whereClause.location = { contains: filters.location, mode: 'insensitive' };
    }
    if (filters.status) whereClause.status = filters.status;

    const page = Math.max(1, Number((filters as any /* eslint-disable-line @typescript-eslint/no-explicit-any */).page ?? 1) || 1);
    const limit = Math.max(1, Math.min(100, Number((filters as any /* eslint-disable-line @typescript-eslint/no-explicit-any */).limit ?? 20) || 20));
    const skip = (page - 1) * limit;

    const allowedSortBy = ['name', 'resourceType', 'capacity', 'createdAt'] as const;
    const sortBy = allowedSortBy.includes((filters as any /* eslint-disable-line @typescript-eslint/no-explicit-any */).sortBy) ? (filters as any /* eslint-disable-line @typescript-eslint/no-explicit-any */).sortBy : 'name';
    const sortOrder = (filters as any /* eslint-disable-line @typescript-eslint/no-explicit-any */).sortOrder === 'desc' ? 'desc' : 'asc';
    const [items, total] = await Promise.all([
      prisma.resource.findMany({
        where: whereClause,
        orderBy: { [sortBy]: sortOrder },
        skip,
        take: limit,
      }),
      prisma.resource.count({ where: whereClause }),
    ]);

    return {
      items,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  static async findAvailableResources(filters: AvailableResourceFilters) {
    const start = new Date(filters.startTime);
    const end = new Date(filters.endTime);

    const whereClause: Prisma.ResourceWhereInput = {
      deletedAt: null,
      status: 'ACTIVE',
      bookings: {
        none: {
          status: { not: 'CANCELLED' },
          startTime: { lt: end },
          endTime: { gt: start },
        },
      },
    };

    if (filters.resourceType) {
      whereClause.resourceType = filters.resourceType;
    }
    if (filters.minCapacity) {
      whereClause.capacity = { gte: filters.minCapacity };
    }
    if (filters.location) {
      whereClause.location = { contains: filters.location, mode: 'insensitive' };
    }

    return prisma.resource.findMany({
      where: whereClause,
      orderBy: { name: 'asc' },
    });
  }

  // ==========================================
  // Booking Repository Methods
  // ==========================================

  static async findOverlappingBookings(
    resourceId: string,
    startTime: Date,
    endTime: Date,
    excludeBookingId?: string,
    tx: Prisma.TransactionClient = prisma
  ) {
    const whereClause: Prisma.BookingWhereInput = {
      resourceId,
      status: { not: 'CANCELLED' },
      startTime: { lt: endTime },
      endTime: { gt: startTime },
    };

    if (excludeBookingId) {
      whereClause.id = { not: excludeBookingId };
    }

    return tx.booking.findMany({
      where: whereClause,
    });
  }

  static async createBooking(
    data: CreateBookingDTO & { bookedBy: string; status?: BookingStatus },
    tx: Prisma.TransactionClient = prisma
  ) {
    return tx.booking.create({
      data: {
        resourceId: data.resourceId,
        bookedBy: data.bookedBy,
        startTime: new Date(data.startTime),
        endTime: new Date(data.endTime),
        purpose: data.purpose,
        status: data.status || 'UPCOMING',
        remarks: data.remarks || null,
      },
      include: {
        resource: true,
        booker: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });
  }

  static async updateBooking(
    id: string,
    data: UpdateBookingDTO & { status?: BookingStatus },
    tx: Prisma.TransactionClient = prisma
  ) {
    const updateData: Prisma.BookingUpdateInput = {};

    if (data.startTime) updateData.startTime = new Date(data.startTime);
    if (data.endTime) updateData.endTime = new Date(data.endTime);
    if (data.purpose !== undefined) updateData.purpose = data.purpose;
    if (data.remarks !== undefined) updateData.remarks = data.remarks;
    if (data.status) updateData.status = data.status;

    return tx.booking.update({
      where: { id },
      data: updateData,
      include: {
        resource: true,
        booker: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });
  }

  static async findBookingById(id: string) {
    return prisma.booking.findUnique({
      where: { id },
      include: {
        resource: true,
        booker: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });
  }

  static async findAllBookings(filters: BookingQueryFilters) {
    const whereClause: Prisma.BookingWhereInput = {};

    if (filters.resourceId) whereClause.resourceId = filters.resourceId;
    if (filters.bookedBy) whereClause.bookedBy = filters.bookedBy;
    if (filters.status) whereClause.status = filters.status;

    if (filters.startTime || filters.endTime) {
      whereClause.AND = [];
      if (filters.startTime) {
        (whereClause.AND as Prisma.BookingWhereInput[]).push({
          endTime: { gt: new Date(filters.startTime) },
        });
      }
      if (filters.endTime) {
        (whereClause.AND as Prisma.BookingWhereInput[]).push({
          startTime: { lt: new Date(filters.endTime) },
        });
      }
    }

    const page = filters.page ?? 1;
    const limit = filters.limit ?? 20;
    const skip = (page - 1) * limit;

    const sortBy = filters.sortBy || 'startTime';
    const sortOrder = filters.sortOrder || 'asc';

    const [items, total] = await Promise.all([
      prisma.booking.findMany({
        where: whereClause,
        include: {
          resource: true,
          booker: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
        orderBy: { [sortBy]: sortOrder },
        skip,
        take: limit,
      }),
      prisma.booking.count({ where: whereClause }),
    ]);

    return {
      items,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  static async findCalendarByResourceId(resourceId: string, start?: string, end?: string) {
    const whereClause: Prisma.BookingWhereInput = {
      resourceId,
      status: { not: 'CANCELLED' },
    };

    if (start || end) {
      whereClause.AND = [];
      if (start) {
        (whereClause.AND as Prisma.BookingWhereInput[]).push({
          endTime: { gt: new Date(start) },
        });
      }
      if (end) {
        (whereClause.AND as Prisma.BookingWhereInput[]).push({
          startTime: { lt: new Date(end) },
        });
      }
    }

    return prisma.booking.findMany({
      where: whereClause,
      include: {
        booker: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
      orderBy: { startTime: 'asc' },
    });
  }
}

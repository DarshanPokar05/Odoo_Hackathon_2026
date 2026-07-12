export interface CreateResourceDTO {
  name: string;
  assetId?: string;
  resourceType: string;
  capacity?: number;
  location: string;
  status?: 'ACTIVE' | 'INACTIVE';
}

export interface UpdateResourceDTO {
  name?: string;
  assetId?: string;
  resourceType?: string;
  capacity?: number;
  location?: string;
  status?: 'ACTIVE' | 'INACTIVE';
}

export interface CreateBookingDTO {
  resourceId: string;
  startTime: string; // ISO 8601
  endTime: string;   // ISO 8601
  purpose: string;
  remarks?: string;
}

export interface UpdateBookingDTO {
  startTime?: string; // ISO 8601
  endTime?: string;   // ISO 8601
  purpose?: string;
  remarks?: string;
}

export interface BookingQueryFilters {
  page?: number;
  limit?: number;
  resourceId?: string;
  bookedBy?: string;
  status?: 'UPCOMING' | 'ONGOING' | 'COMPLETED' | 'CANCELLED';
  startTime?: string;
  endTime?: string;
  sortBy?: 'startTime' | 'endTime' | 'createdAt';
  sortOrder?: 'asc' | 'desc';
}

export interface ResourceQueryFilters {
  page?: number;
  limit?: number;
  resourceType?: string;
  location?: string;
  status?: 'ACTIVE' | 'INACTIVE';
  sortBy?: 'name' | 'resourceType' | 'capacity' | 'createdAt';
  sortOrder?: 'asc' | 'desc';
}

export interface AvailableResourceFilters {
  startTime: string; // ISO 8601
  endTime: string;   // ISO 8601
  resourceType?: string;
  minCapacity?: number;
  location?: string;
}

export interface CalendarQueryFilters {
  start?: string; // ISO 8601
  end?: string;   // ISO 8601
}

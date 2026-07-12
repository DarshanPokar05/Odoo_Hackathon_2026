import { Router } from 'express';
import { BookingController } from './booking.controller';
import { validate } from '../../middlewares/validationMiddleware';
import { authenticate, authorize } from '../../middlewares/authMiddleware';
import {
  CreateResourceSchema,
  UpdateResourceSchema,
  CreateBookingSchema,
  UpdateBookingSchema,
  AvailableResourceSchema,
  CalendarQuerySchema,
} from './booking.schema';

// ==========================================
// Resource Routes (/api/v1/resources)
// ==========================================
export const resourceRoutes = Router();

resourceRoutes.use(authenticate);

resourceRoutes.get('/available', validate(AvailableResourceSchema), BookingController.getAvailableResources);
resourceRoutes.get('/:id/calendar', validate(CalendarQuerySchema), BookingController.getCalendar);
resourceRoutes.post('/', authorize('ADMIN'), validate(CreateResourceSchema), BookingController.createResource);
resourceRoutes.get('/', BookingController.getAllResources);
resourceRoutes.get('/:id', BookingController.getResourceById);
resourceRoutes.patch('/:id', authorize('ADMIN'), validate(UpdateResourceSchema), BookingController.updateResource);
resourceRoutes.delete('/:id', authorize('ADMIN'), BookingController.deleteResource);

// ==========================================
// Booking Routes (/api/v1/bookings)
// ==========================================
const bookingRoutes = Router();

bookingRoutes.use(authenticate);

bookingRoutes.post('/', validate(CreateBookingSchema), BookingController.createBooking);
bookingRoutes.get('/', BookingController.getAllBookings);
bookingRoutes.get('/:id', BookingController.getBookingById);
bookingRoutes.patch('/:id/cancel', BookingController.cancelBooking);
bookingRoutes.patch('/:id', validate(UpdateBookingSchema), BookingController.updateBooking);

export default bookingRoutes;

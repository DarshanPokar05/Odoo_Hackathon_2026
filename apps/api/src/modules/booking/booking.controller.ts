import { Request, Response, NextFunction } from 'express';
import { BookingService } from './booking.service';
import { sendSuccess } from '../../shared/responses/apiResponse';

export class BookingController {
  // ==========================================
  // Resource Controllers
  // ==========================================

  static async createResource(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await BookingService.createResource(req.body, req.user!.id);
      return sendSuccess(res, result, 'Resource created successfully', 201);
    } catch (error) {
      next(error);
    }
  }

  static async updateResource(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await BookingService.updateResource(
        req.params.id,
        req.body,
        req.user!.id
      );
      return sendSuccess(res, result, 'Resource updated successfully', 200);
    } catch (error) {
      next(error);
    }
  }

  static async deleteResource(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await BookingService.deleteResource(req.params.id, req.user!.id);
      return sendSuccess(res, result, 'Resource deleted successfully', 200);
    } catch (error) {
      next(error);
    }
  }

  static async getResourceById(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await BookingService.getResourceById(req.params.id);
      return sendSuccess(res, result, 'Resource fetched successfully', 200);
    } catch (error) {
      next(error);
    }
  }

  static async getAllResources(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await BookingService.getAllResources(req.query as any // eslint-disable-line @typescript-eslint/no-explicit-any
      );
      return sendSuccess(res, result, 'Resources fetched successfully', 200);
    } catch (error) {
      next(error);
    }
  }

  static async getAvailableResources(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await BookingService.getAvailableResources(req.query as any // eslint-disable-line @typescript-eslint/no-explicit-any
      );
      return sendSuccess(res, result, 'Available resources fetched successfully', 200);
    } catch (error) {
      next(error);
    }
  }

  static async getCalendar(req: Request, res: Response, next: NextFunction) {
    try {
      const { start, end } = req.query as { start?: string; end?: string };
      const result = await BookingService.getCalendar(req.params.id, start, end);
      return sendSuccess(res, result, 'Resource calendar fetched successfully', 200);
    } catch (error) {
      next(error);
    }
  }

  // ==========================================
  // Booking Controllers
  // ==========================================

  static async createBooking(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await BookingService.createBooking(req.body, req.user!.id);
      return sendSuccess(res, result, 'Booking created successfully', 201);
    } catch (error) {
      next(error);
    }
  }

  static async getAllBookings(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await BookingService.getAllBookings(req.query as any // eslint-disable-line @typescript-eslint/no-explicit-any
      );
      return sendSuccess(res, result, 'Bookings fetched successfully', 200);
    } catch (error) {
      next(error);
    }
  }

  static async getBookingById(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await BookingService.getBookingById(req.params.id);
      return sendSuccess(res, result, 'Booking fetched successfully', 200);
    } catch (error) {
      next(error);
    }
  }

  static async updateBooking(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await BookingService.updateBooking(
        req.params.id,
        req.body,
        req.user!.id,
        req.user!.role
      );
      return sendSuccess(res, result, 'Booking updated successfully', 200);
    } catch (error) {
      next(error);
    }
  }

  static async cancelBooking(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await BookingService.cancelBooking(
        req.params.id,
        req.user!.id,
        req.user!.role
      );
      return sendSuccess(res, result, 'Booking cancelled successfully', 200);
    } catch (error) {
      next(error);
    }
  }
}

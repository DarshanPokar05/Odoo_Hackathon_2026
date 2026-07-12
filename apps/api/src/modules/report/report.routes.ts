import { Router } from 'express';
import { ReportController } from './report.controller';
import { authenticate, authorize } from '../../middlewares/authMiddleware';

const router = Router();

// Middleware to ensure only authorized roles can access reports
router.use(authenticate);
router.use(authorize('SYSTEM_ADMIN', 'ASSET_MANAGER', 'DEPARTMENT_HEAD'));

// Analytics Endpoints
router.get('/assets', ReportController.getAssets);
router.get('/allocations', ReportController.getAllocations);
router.get('/maintenance', ReportController.getMaintenance);
router.get('/bookings', ReportController.getBookings);
router.get('/audits', ReportController.getAudits);

// Export Endpoints
router.get('/export/csv', ReportController.exportAssetsCSV);
router.get('/export/excel', ReportController.exportAssetsExcel);
router.get('/export/pdf', ReportController.exportAssetsPDF);

export default router;

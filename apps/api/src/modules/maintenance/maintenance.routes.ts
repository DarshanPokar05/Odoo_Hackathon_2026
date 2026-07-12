import { Router } from 'express';
import { MaintenanceController } from './maintenance.controller';
import { authenticate, authorize } from '../../middlewares/authMiddleware';

const router = Router();
const maintenanceController = new MaintenanceController();

// Use authentication middleware for all routes
router.use(authenticate);

// Maintenance Requests
router.post('/', maintenanceController.raiseRequest);
router.get('/', authorize('ADMIN', 'ASSET_MANAGER', 'DEPARTMENT_HEAD'), maintenanceController.listAllRequests);
router.get('/pending', authorize('ADMIN', 'ASSET_MANAGER', 'DEPARTMENT_HEAD'), maintenanceController.getPendingRequests);
router.get('/:id', maintenanceController.getMaintenanceDetails);

// Actions
router.patch('/:id/approve', authorize('ADMIN', 'ASSET_MANAGER', 'DEPARTMENT_HEAD'), maintenanceController.approveRequest);
router.patch('/:id/reject', authorize('ADMIN', 'ASSET_MANAGER', 'DEPARTMENT_HEAD'), maintenanceController.rejectRequest);
router.patch('/:id/assign', authorize('ADMIN', 'ASSET_MANAGER', 'DEPARTMENT_HEAD'), maintenanceController.assignTechnician);
router.patch('/:id/resolve', authorize('SYSTEM_ADMIN', 'ASSET_MANAGER', 'DEPARTMENT_HEAD', 'MAINTENANCE_TECHNICIAN'), maintenanceController.resolveRequest);
router.patch('/:id/close', authorize('ADMIN', 'ASSET_MANAGER', 'DEPARTMENT_HEAD'), maintenanceController.closeRequest);

export default router;

import express from 'express';
import cors from 'cors';
import authRoutes from './modules/auth/auth.routes';
import organizationRoutes from './modules/organization/organization.routes';
import userRoutes from './modules/user/user.routes';
import assetRoutes from './modules/asset/asset.routes';
import bookingRoutes, { resourceRoutes } from './modules/booking/booking.routes';
import allocationRoutes from './modules/allocation/allocation.routes';
import maintenanceRoutes from './modules/maintenance/maintenance.routes';
import auditRoutes from './modules/audit/audit.routes';
import reportRoutes from './modules/report/report.routes';
import activityRoutes from './modules/activity/activity.routes';
import { errorMiddleware } from './middlewares/errorMiddleware';

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/organization', organizationRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/assets', assetRoutes);
app.use('/api/v1/resources', resourceRoutes);
app.use('/api/v1/bookings', bookingRoutes);
app.use('/api/v1/allocations', allocationRoutes);
app.use('/api/v1/maintenance', maintenanceRoutes);
app.use('/api/v1/audits', auditRoutes);
app.use('/api/v1/reports', reportRoutes);
app.use('/api/v1/activity-logs', activityRoutes);

app.use(errorMiddleware);

export default app;

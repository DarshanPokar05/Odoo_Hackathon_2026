const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const env = require('./config/env');
const { checkHealth } = require('./config/db');
const errorHandler = require('./middleware/errorHandler');

// Domain modules
const authRoutes = require('./modules/auth/routes');
const departmentRoutes = require('./modules/departments/routes');
const categoryRoutes = require('./modules/categories/routes');
const employeeRoutes = require('./modules/employees/routes');
const assetRoutes = require('./modules/assets/routes');
const allocationRoutes = require('./modules/allocations/routes');
const transferRoutes = require('./modules/transfers/routes');
const bookingRoutes = require('./modules/bookings/routes');
const maintenanceRoutes = require('./modules/maintenance/routes');
const auditRoutes = require('./modules/audits/routes');
const notificationRoutes = require('./modules/notifications/routes');
const dashboardRoutes = require('./modules/dashboard/routes');
const reportRoutes = require('./modules/reports/routes');
const activityLogRoutes = require('./modules/activityLogs/routes');

const app = express();

// Security HTTP headers
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
}));

// CORS configured for frontend origin only, credentials true
app.use(
  cors({
    origin: env.FRONTEND_ORIGIN,
    credentials: true,
  })
);

app.use(express.json({ limit: '10mb' }));
app.use(cookieParser());

// Rate limiters for Auth routes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // max 100 requests per window
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many requests to authentication endpoints. Please try again later.',
    },
  },
});

// Health check endpoint returning DB connectivity status
app.get('/health', async (req, res) => {
  const dbHealth = await checkHealth();
  const statusCode = dbHealth.status === 'ok' ? 200 : 503;
  res.status(statusCode).json({
    success: dbHealth.status === 'ok',
    status: dbHealth.status,
    db: dbHealth.db,
    time: dbHealth.time || new Date().toISOString(),
    error: dbHealth.error,
  });
});

// API Routes
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/departments', departmentRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/employees', employeeRoutes);
app.use('/api/assets', assetRoutes);
app.use('/api/allocations', allocationRoutes);
app.use('/api/transfers', transferRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/maintenance', maintenanceRoutes);
app.use('/api/audits', auditRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/activityLogs', activityLogRoutes);
app.use('/api/activity-logs', activityLogRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: `Cannot ${req.method} ${req.path}`,
    },
  });
});

// Centralized error handler
app.use(errorHandler);

module.exports = app;

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import path from 'path';
import authRoutes from './routes/auth.routes.js';
import agreementRoutes from './routes/agreement.routes.js';
import customerRoutes from './routes/customer.routes.js';
import vehicleRoutes from './routes/vehicle.routes.js';
import invoiceRoutes from './routes/invoice.routes.js';
import disputeRoutes from './routes/dispute.routes.js';
import customerPortalRoutes from './routes/customer-portal.routes.js';
import staffAuthRoutes from './routes/staff-auth.routes.js';
import adminUserRoutes from './routes/admin-user.routes.js';
import adminDashboardRoutes from './routes/admin-dashboard.routes.js';
import adminSettingsRoutes from './routes/admin-settings.routes.js';
import { driverRouter, taskManagementRouter } from './routes/driver-task.routes.js';
import ratePlanRoutes from './routes/rate-plan.routes.js';
import depositRoutes from './routes/deposit.routes.js';
import tollFineRoutes from './routes/toll-fine.routes.js';
import maintenanceRoutes from './routes/maintenance.routes.js';
import systemAuditLogRoutes from './routes/system-audit-log.routes.js';
import kpiRoutes from './routes/kpi.routes.js';
import companyRoutes from './routes/company.routes.js';
import featureRequestRoutes from './routes/feature-request.routes.js';
import driverProfileRoutes from './routes/driver-profile.routes.js';
import branchRoutes from './routes/branch.routes.js';
import corporateAccountRoutes from './routes/corporate-account.routes.js';
import reservationRoutes from './routes/reservation.routes.js';
import workOrderRoutes from './routes/work-order.routes.js';
import cashDrawerRoutes from './routes/cash-drawer.routes.js';
import paymentRoutes from './routes/payment.routes.js';
import reportsRoutes from './routes/reports.routes.js';
import expenseRoutes from './routes/expense.routes.js';
import alertsRoutes from './routes/alerts.routes.js';
import staffRoutes from './routes/staff.routes.js';
import ledgerRoutes from './routes/ledger.routes.js';
import companyProfileRoutes from './routes/company-profile.routes.js';
import softDeleteRoutes from './routes/soft-delete.routes.js';
import refundRoutes from './routes/refund.routes.js';
import incidentRoutes from './routes/incident.routes.js';
import vehicleDocumentRoutes from './routes/vehicle-document.routes.js';
import vehicleCategoryRoutes from './routes/vehicle-category.routes.js';
import { requestLogger } from './middleware/logger.middleware.js';
import { apiRateLimiter } from './middleware/rate-limit.middleware.js';
import { errorHandler, notFoundHandler } from './middleware/error-handler.middleware.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(requestLogger);
app.use(apiRateLimiter);
app.use('/uploads', express.static(path.resolve(process.cwd(), 'uploads')));

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
  });
});

// API routes
app.use('/v1/auth', authRoutes);
app.use('/v1/customer', customerPortalRoutes);
app.use('/v1/agreements', agreementRoutes);
app.use('/v1/customers', customerRoutes);
app.use('/v1/vehicles', vehicleRoutes);
app.use('/v1/invoices', invoiceRoutes);
app.use('/v1/disputes', disputeRoutes);
app.use('/v1/auth/staff', staffAuthRoutes);
app.use('/v1/admin/users', adminUserRoutes);
app.use('/v1/admin', adminDashboardRoutes);
app.use('/v1/admin', adminSettingsRoutes);
app.use('/v1/driver', driverRouter);
app.use('/v1/tasks', taskManagementRouter);
app.use('/v1/rate-plans', ratePlanRoutes);
app.use('/v1/deposits', depositRoutes);
app.use('/v1/toll-fines', tollFineRoutes);
app.use('/v1/maintenance', maintenanceRoutes);
app.use('/v1/audit-log', systemAuditLogRoutes);
app.use('/v1/kpis', kpiRoutes);
app.use('/v1/companies', companyRoutes);
app.use('/v1/feature-requests', featureRequestRoutes);
app.use('/v1/drivers', driverProfileRoutes);
app.use('/v1/branches', branchRoutes);
app.use('/v1/corporate-accounts', corporateAccountRoutes);
app.use('/v1/reservations', reservationRoutes);
app.use('/v1/work-orders', workOrderRoutes);
app.use('/v1/cash-drawer', cashDrawerRoutes);
app.use('/v1/payments', paymentRoutes);
app.use('/v1/reports', reportsRoutes);
app.use('/v1/expenses', expenseRoutes);
app.use('/v1/alerts', alertsRoutes);
app.use('/v1/staff', staffRoutes);
app.use('/v1/ledger', ledgerRoutes);
app.use('/v1/company-profile', companyProfileRoutes);
app.use('/v1/delete', softDeleteRoutes);
app.use('/v1/refunds', refundRoutes);
app.use('/v1/incidents', incidentRoutes);
app.use('/v1/vehicles/:vehicleId/documents', vehicleDocumentRoutes);
app.use('/v1/vehicle-categories', vehicleCategoryRoutes);

// 404 handler
app.use(notFoundHandler);

// Centralized error handler
app.use(errorHandler);

// Start server
app.listen(PORT, () => {
  console.log(`🚀 API server running on port ${PORT}`);
  console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/health`);
});

export default app;

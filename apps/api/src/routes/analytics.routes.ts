import { Router, type Request, type Response } from 'express';
import { requireAuth } from '../middleware/authMiddleware.js';
import { requirePermission } from '../middleware/rbacMiddleware.js';
import { validateBody } from '../middleware/validateBody.js';
import {
  ExportReportSchema,
  CreateScheduledReportSchema,
  type ReportType,
  type ReportFormat,
} from '@gymos/shared';
import { analyticsService } from '../services/analyticsService.js';
import { ScheduledReport } from '../models/index.js';

const router = Router();

// 1. Retention Cohorts
router.get(
  '/retention-cohorts',
  requireAuth,
  requirePermission('reports:read'),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const tenantId = (req as any).user.tenantId;
      const { months } = req.query;
      const data = await analyticsService.getRetentionCohorts(tenantId, months ? Number(months) : 6);
      res.json({ success: true, data });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  },
);

// 2. Revenue Breakdowns (Plan, Branch, Trainer)
router.get(
  '/revenue-breakdown',
  requireAuth,
  requirePermission('reports:read'),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const tenantId = (req as any).user.tenantId;
      const { startDate, endDate, branchId } = req.query;
      const data = await analyticsService.getRevenueBreakdown(tenantId, {
        startDate: startDate as string,
        endDate: endDate as string,
        branchId: branchId as string,
      });
      res.json({ success: true, data });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  },
);

// 3. Lead Funnel
router.get(
  '/lead-funnel',
  requireAuth,
  requirePermission('reports:read'),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const tenantId = (req as any).user.tenantId;
      const { startDate, endDate, branchId } = req.query;
      const data = await analyticsService.getLeadFunnel(tenantId, {
        startDate: startDate as string,
        endDate: endDate as string,
        branchId: branchId as string,
      });
      res.json({ success: true, data });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  },
);

// 4. Peak Hours Heatmap
router.get(
  '/peak-hours',
  requireAuth,
  requirePermission('reports:read'),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const tenantId = (req as any).user.tenantId;
      const { startDate, endDate, branchId } = req.query;
      const data = await analyticsService.getPeakHoursHeatmap(tenantId, {
        startDate: startDate as string,
        endDate: endDate as string,
        branchId: branchId as string,
      });
      res.json({ success: true, data });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  },
);

// 5. Renewal Forecast
router.get(
  '/renewal-forecast',
  requireAuth,
  requirePermission('reports:read'),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const tenantId = (req as any).user.tenantId;
      const { branchId } = req.query;
      const data = await analyticsService.getRenewalForecast(tenantId, {
        branchId: branchId as string,
      });
      res.json({ success: true, data });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  },
);

// 6. Trainer Performance Dashboard
router.get(
  '/trainer-performance',
  requireAuth,
  requirePermission('reports:read'),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const tenantId = (req as any).user.tenantId;
      const data = await analyticsService.getTrainerPerformanceDashboard(tenantId);
      res.json({ success: true, data });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  },
);

// 7. SOW Section 23 Reports Data Preview
router.get(
  '/reports/:reportType',
  requireAuth,
  requirePermission('reports:read'),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const tenantId = (req as any).user.tenantId;
      const reportType = String(req.params.reportType).toUpperCase() as ReportType;
      const { startDate, endDate, branchId } = req.query;
      const data = await analyticsService.generateReportData(reportType, tenantId, {
        startDate: startDate as string,
        endDate: endDate as string,
        branchId: branchId as string,
      });
      res.json({ success: true, data });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  },
);

// 8. Export Report to PDF, Excel, CSV
router.post(
  '/reports/export',
  requireAuth,
  requirePermission('reports:read'),
  validateBody(ExportReportSchema),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const tenantId = (req as any).user.tenantId;
      const { reportType, format, startDate, endDate, branchId } = req.body;
      const exportFile = await analyticsService.exportReport(
        reportType as ReportType,
        format as ReportFormat,
        tenantId,
        { startDate, endDate, branchId },
      );

      res.setHeader('Content-Type', exportFile.contentType);
      res.setHeader('Content-Disposition', `attachment; filename="${exportFile.fileName}"`);
      res.send(exportFile.content);
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  },
);

// 9. Scheduled Email Reports
router.get(
  '/scheduled-reports',
  requireAuth,
  requirePermission('reports:read'),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const tenantId = (req as any).user.tenantId;
      const reports = await ScheduledReport.find({ tenantId, isActive: true });
      res.json({ success: true, data: reports });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  },
);

router.post(
  '/scheduled-reports',
  requireAuth,
  requirePermission('reports:edit'),
  validateBody(CreateScheduledReportSchema),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const tenantId = (req as any).user.tenantId;
      const created = await analyticsService.scheduleReport({
        ...req.body,
        tenantId,
      });
      res.status(201).json({ success: true, data: created });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  },
);

router.post(
  '/scheduled-reports/:id/dispatch',
  requireAuth,
  requirePermission('reports:edit'),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const tenantId = (req as any).user.tenantId;
      const reportId = String(req.params.id);
      const result = await analyticsService.dispatchScheduledReport(reportId, tenantId);
      res.json({ success: true, message: 'Scheduled report dispatched successfully to recipients.', data: result });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  },
);

export default router;

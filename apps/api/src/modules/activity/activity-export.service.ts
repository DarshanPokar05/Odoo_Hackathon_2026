import { Response } from 'express';
import { ActivityLogQueryFilters } from './activity.dto';
import { ActivityRepository } from './activity.repository';
import ExcelJS from 'exceljs';
import PDFDocument from 'pdfkit';
import { AsyncParser } from 'json2csv';

export class ActivityExportService {
  static async exportCSV(filters: ActivityLogQueryFilters, res: Response) {
    const logs = await ActivityRepository.findForExport(filters);
    
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="activity_logs.csv"');

    const parser = new AsyncParser({
      fields: ['id', 'user.email', 'role', 'module', 'action', 'entityType', 'entityId', 'ipAddress', 'createdAt'],
    });

    parser.processor
      .on('data', (chunk) => res.write(chunk))
      .on('end', () => res.end())
      .on('error', (err) => res.status(500).end(err.message));
      
    logs.forEach((log) => parser.input.push(log));
    parser.input.push(null);
  }

  static async exportExcel(filters: ActivityLogQueryFilters, res: Response) {
    const logs = await ActivityRepository.findForExport(filters);

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename="activity_logs.xlsx"');

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Activity Logs');

    worksheet.columns = [
      { header: 'ID', key: 'id', width: 36 },
      { header: 'User Email', key: 'email', width: 30 },
      { header: 'Role', key: 'role', width: 20 },
      { header: 'Module', key: 'module', width: 20 },
      { header: 'Action', key: 'action', width: 25 },
      { header: 'Entity Type', key: 'entityType', width: 20 },
      { header: 'Entity ID', key: 'entityId', width: 36 },
      { header: 'IP Address', key: 'ipAddress', width: 20 },
      { header: 'Created At', key: 'createdAt', width: 25 },
    ];

    logs.forEach((log) => {
      worksheet.addRow({
        id: log.id,
        email: log.user?.email || 'System/Unknown',
        role: log.role || 'N/A',
        module: log.module || 'N/A',
        action: log.action,
        entityType: log.entityType,
        entityId: log.entityId || 'N/A',
        ipAddress: log.ipAddress || 'N/A',
        createdAt: log.createdAt.toISOString(),
      });
    });

    await workbook.xlsx.write(res);
    res.end();
  }

  static async exportPDF(filters: ActivityLogQueryFilters, res: Response) {
    const logs = await ActivityRepository.findForExport(filters);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="activity_logs.pdf"');

    const doc = new PDFDocument({ margin: 30, size: 'A4', layout: 'landscape' });
    doc.pipe(res);

    doc.fontSize(18).text('Activity Log Export', { align: 'center' });
    doc.moveDown();

    logs.forEach((log) => {
      doc.fontSize(10).text(`Time: ${log.createdAt.toISOString()} | User: ${log.user?.email || 'N/A'} | Role: ${log.role || 'N/A'}`);
      doc.fontSize(10).text(`Action: ${log.module}::${log.action} | Entity: ${log.entityType} (${log.entityId || 'N/A'})`);
      doc.moveDown(0.5);
    });

    doc.end();
  }
}

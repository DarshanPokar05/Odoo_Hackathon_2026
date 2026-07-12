import { Response } from 'express';
import { ReportQueryFilters } from '../report.dto';
import { ReportRepository } from '../report.repository';
import ExcelJS from 'exceljs';
import PDFDocument from 'pdfkit';
import { AsyncParser } from 'json2csv';

export class ExportService {
  static async exportAssetsCSV(filters: ReportQueryFilters, res: Response) {
    const assets = await ReportRepository.getRawAssetsForExport(filters);
    
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="assets_export.csv"');

    const parser = new AsyncParser({
      fields: ['assetTag', 'name', 'category.name', 'status', 'condition', 'location', 'acquisitionCost'],
    });

    parser.processor
      .on('data', (chunk) => res.write(chunk))
      .on('end', () => res.end())
      .on('error', (err) => res.status(500).end(err.message));
      
    assets.forEach((asset: any) => parser.input.push(asset));
    parser.input.push(null);
  }

  static async exportAssetsExcel(filters: ReportQueryFilters, res: Response) {
    const assets = await ReportRepository.getRawAssetsForExport(filters);

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename="assets_export.xlsx"');

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Assets');

    worksheet.columns = [
      { header: 'Asset Tag', key: 'assetTag', width: 20 },
      { header: 'Name', key: 'name', width: 30 },
      { header: 'Category', key: 'category', width: 20 },
      { header: 'Status', key: 'status', width: 15 },
      { header: 'Condition', key: 'condition', width: 15 },
      { header: 'Location', key: 'location', width: 25 },
      { header: 'Cost', key: 'cost', width: 15 },
    ];

    assets.forEach((asset: any) => {
      worksheet.addRow({
        assetTag: asset.assetTag,
        name: asset.name,
        category: asset.category?.name || 'N/A',
        status: asset.status,
        condition: asset.condition,
        location: asset.location || 'N/A',
        cost: asset.acquisitionCost ? asset.acquisitionCost.toString() : '0',
      });
    });

    await workbook.xlsx.write(res);
    res.end();
  }

  static async exportAssetsPDF(filters: ReportQueryFilters, res: Response) {
    const assets = await ReportRepository.getRawAssetsForExport(filters);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="assets_export.pdf"');

    const doc = new PDFDocument({ margin: 30 });
    doc.pipe(res);

    doc.fontSize(20).text('Asset Export Report', { align: 'center' });
    doc.moveDown();

    assets.forEach((asset: any) => {
      doc.fontSize(12).text(`Tag: ${asset.assetTag} | Name: ${asset.name}`);
      doc.fontSize(10).text(`Category: ${asset.category?.name || 'N/A'} | Status: ${asset.status}`);
      doc.moveDown();
    });

    doc.end();
  }
}

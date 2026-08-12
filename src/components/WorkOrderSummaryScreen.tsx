import React from 'react';
import { ProfitabilityAnalysis, WorkAnalysis, Supplier, QuoteComparisonRow } from '../types';
import { FileText } from 'lucide-react';
import { ExportDropdown } from './ExportDropdown';

interface WorkOrderSummaryScreenProps {
  pas: ProfitabilityAnalysis[];
  workAnalyses: WorkAnalysis[];
  suppliers: Supplier[];
}

export default function WorkOrderSummaryScreen({ pas, workAnalyses, suppliers }: WorkOrderSummaryScreenProps) {
  
  // Only show approved PAs that have a work order
  const approvedWOs = pas.filter(pa => pa.approvalStatus === 'Approved' && pa.workOrderNumber);

  const getSupplierName = (id: string) => suppliers.find(s => s.id === id)?.name || id;

  const handleExport = async (format: 'excel' | 'pdf' | 'word', id: string) => {
    const targetWo = approvedWOs.find(wo => wo.workOrderNumber === id);
    if (!targetWo) return;

    const wa = workAnalyses.find(w => w.mrRef === targetWo.mrRef);
    const selectedQuote = targetWo.quoteComparison.find(q => q.supplierId === targetWo.selectedSupplierId);
    
    const exportData = [{
      WO_Number: targetWo.workOrderNumber,
      PA_Number: targetWo.paNumber,
      WA_Reference: wa ? wa.id : 'N/A',
      Transporter: getSupplierName(targetWo.selectedSupplierId),
      Truck_Type: selectedQuote?.truckType || wa?.truckTypeRecommended || 'N/A',
      Sites: wa ? wa.totalSites : 0,
      Distance: wa?.totalDistance || 0,
      Route: wa?.route || 'N/A',
      Scope: wa?.sites && wa.sites.length > 0 ? Array.from(new Set(wa.sites.map(s => s.projectScope))).join(', ') : 'N/A',
      Remark: targetWo.comment || 'N/A',
      Approved_Rate: selectedQuote ? selectedQuote.quotedPrice : 0,
      Issued_Date: targetWo.issuedDate,
      Status: 'Issued'
    }];

    if (format === 'excel') {
      const xlsx = await import('xlsx');
      const ws = xlsx.utils.json_to_sheet(exportData);
      const wb = xlsx.utils.book_new();
      xlsx.utils.book_append_sheet(wb, ws, "Work Orders");
      xlsx.writeFile(wb, `Work_Order_${id}.xlsx`);
    } else if (format === 'pdf') {
      const { jsPDF } = await import('jspdf');
      const autoTable = (await import('jspdf-autotable')).default;
      const doc = new jsPDF('landscape');
      doc.text(`Work Order Report - ${id}`, 14, 15);
      autoTable(doc, {
        startY: 20,
        head: [['WO Number', 'PA Ref', 'WA Ref', 'Transporter', 'Truck Type', 'Rate', 'Date', 'Distance', 'Route', 'Scope', 'Remark']],
        body: exportData.map(w => [w.WO_Number, w.PA_Number, w.WA_Reference, w.Transporter, w.Truck_Type, w.Approved_Rate, w.Issued_Date, w.Distance, w.Route, w.Scope, w.Remark]),
      });
      doc.save(`Work_Order_${id}.pdf`);
    } else if (format === 'word') {
      const docx = await import('docx');
      const doc = new docx.Document({
        sections: [{
          properties: {},
          children: [
            new docx.Paragraph({ text: `Work Order Report - ${id}`, heading: docx.HeadingLevel.HEADING_1 }),
            new docx.Table({
              rows: [
                new docx.TableRow({
                  children: ['WO Number', 'PA Ref', 'WA Ref', 'Transporter', 'Truck Type', 'Rate', 'Date', 'Distance', 'Route', 'Scope', 'Remark'].map(t => new docx.TableCell({ children: [new docx.Paragraph(t)] }))
                }),
                ...exportData.map(w => new docx.TableRow({
                  children: [w.WO_Number, w.PA_Number, w.WA_Reference, w.Transporter, w.Truck_Type, w.Approved_Rate, w.Issued_Date, w.Distance, w.Route, w.Scope, w.Remark].map(t => new docx.TableCell({ children: [new docx.Paragraph(String(t))] }))
                }))
              ]
            })
          ]
        }]
      });
      docx.Packer.toBlob(doc).then(blob => {
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `Work_Order_${id}.docx`;
        link.click();
      });
    }
  };

  return (
    <div className="space-y-6 select-none pb-20">
      <div className="space-y-5 bg-white p-6 rounded-xl border border-[#D3D1C7] shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-[#2C2C2A]">Work Order Summary</h2>
            <p className="text-sm text-[#5F5E5A]">Centralized view of all issued Work Orders.</p>
          </div>
          <div className="flex gap-2">
            
          </div>
        </div>

        <div className="bg-white rounded-xl border border-[#D3D1C7] shadow-sm overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-[#D3D1C7] text-xs font-sans font-bold text-[#5F5E5A] uppercase tracking-wider">
                <th className="px-5 py-4">WO Number</th>
                <th className="px-5 py-4">PA Ref</th>
                <th className="px-5 py-4">WA Ref</th>
                <th className="px-5 py-4">Transporter</th>
                <th className="px-5 py-4">Truck Type</th>
                <th className="px-5 py-4">Sites</th>
                <th className="px-5 py-4">Distance</th>
                <th className="px-5 py-4">Route</th>
                <th className="px-5 py-4">Scope</th>
                <th className="px-5 py-4">Approved Rate</th>
                <th className="px-5 py-4">Issued Date</th>
                <th className="px-5 py-4">Remark</th>
                <th className="px-5 py-4">Status</th>
                <th className="px-5 py-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#D3D1C7]/40 text-sm font-sans text-[#2C2C2A]">
              {approvedWOs.length === 0 ? (
                <tr>
                  <td colSpan={14} className="px-6 py-16 text-center text-[#5F5E5A]">
                    No issued work orders available.
                  </td>
                </tr>
              ) : (
                approvedWOs.map((wo) => {
                  const wa = workAnalyses.find(w => w.mrRef === wo.mrRef);
                  const selectedQuote = wo.quoteComparison.find(q => q.supplierId === wo.selectedSupplierId);
                  
                  return (
                    <tr key={wo.workOrderNumber} className="hover:bg-gray-50 transition-colors">
                      <td className="px-5 py-4 font-mono font-semibold text-[#1D9E75]">{wo.workOrderNumber}</td>
                      <td className="px-5 py-4 font-mono text-xs">{wo.paNumber}</td>
                      <td className="px-5 py-4 font-mono text-xs">{wa ? wa.id : '-'}</td>
                      <td className="px-5 py-4 font-semibold">{getSupplierName(wo.selectedSupplierId)}</td>
                      <td className="px-5 py-4">{selectedQuote?.truckType || wa?.truckTypeRecommended || '-'}</td>
                      <td className="px-5 py-4">
                        {wa ? (
                          <details className="cursor-pointer group">
                            <summary className="font-semibold text-[#1D9E75] hover:underline list-none">
                              {wa.totalSites} Sites ▾
                            </summary>
                            <ul className="mt-2 text-xs text-[#5F5E5A] space-y-1 pl-2 border-l-2 border-[#1D9E75]/30">
                              {wa.sites?.map((s, idx) => (
                                <li key={idx}>- {s.siteName || s.siteId}</li>
                              ))}
                            </ul>
                          </details>
                        ) : '-'}
                      </td>
                      <td className="px-5 py-4">{wa?.totalDistance || 0} km</td>
                      <td className="px-5 py-4">{wa?.route || '-'}</td>
                      <td className="px-5 py-4 text-xs">
                        {wa?.sites && wa.sites.length > 0 
                          ? Array.from(new Set(wa.sites.map(s => s.projectScope))).join(', ')
                          : '-'}
                      </td>
                      <td className="px-5 py-4 font-semibold text-emerald-600">{selectedQuote ? selectedQuote.quotedPrice.toLocaleString() : 0} ETB</td>
                      <td className="px-5 py-4">{wo.issuedDate}</td>
                      <td className="px-5 py-4 text-xs max-w-[150px] truncate" title={wo.comment || ''}>{wo.comment || '-'}</td>
                      <td className="px-5 py-4">
                      <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full text-[10px] font-semibold">
                        Issued
                      </span>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <ExportDropdown onExport={(format) => handleExport(format, wo.workOrderNumber!)} />
                    </td>
                  </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

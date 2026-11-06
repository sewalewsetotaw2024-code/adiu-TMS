import React, { useState } from 'react';
import { ProfitabilityAnalysis, WorkAnalysis, Supplier, ProjectSite } from '../types';
import { ExportDropdown } from './ExportDropdown';
import { ArrowLeft, FileSpreadsheet, FileText } from 'lucide-react';
import { generateAdiuWorkOrderExcel } from '../utils/workOrderExcel';

interface WorkOrderSummaryScreenProps {
  pas: ProfitabilityAnalysis[];
  workAnalyses: WorkAnalysis[];
  suppliers: Supplier[];
  sites: ProjectSite[];
  onSavePa: (pa: ProfitabilityAnalysis) => void;
}

function numberToWords(amount: number): string {
  const ones = ['', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine'];
  const teens = ['ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen'];
  const tens = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];
  const scales = ['', 'thousand', 'million', 'billion', 'trillion'];

  const underThousand = (value: number): string => {
    const parts: string[] = [];
    if (value >= 100) {
      parts.push(`${ones[Math.floor(value / 100)]} hundred`);
      value %= 100;
    }
    if (value >= 20) {
      parts.push(tens[Math.floor(value / 10)] + (value % 10 ? `-${ones[value % 10]}` : ''));
    } else if (value >= 10) {
      parts.push(teens[value - 10]);
    } else if (value > 0) {
      parts.join(' ');
    }
    return parts.join(' ');
  };

  if (!Number.isFinite(amount) || amount <= 0) return 'zero';
  let remainder = Math.floor(amount);
  const parts: string[] = [];
  let scaleIndex = 0;
  while (remainder > 0) {
    const group = remainder % 1000;
    if (group > 0) {
      const scale = scales[scaleIndex];
      parts.unshift([underThousand(group), scale].filter(Boolean).join(' '));
    }
    remainder = Math.floor(remainder / 1000);
    scaleIndex += 1;
  }
  return parts.join(' ');
}

function formatHeaderDate(dateStr?: string): string {
  if (!dateStr) {
    const now = new Date();
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    return `${mm}/${dd}/${now.getFullYear()}`;
  }
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(dateStr)) return dateStr;
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    const [year, month, day] = parts;
    return `${month.padStart(2, '0')}/${day.slice(0, 2).padStart(2, '0')}/${year}`;
  }
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return dateStr;
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${mm}/${dd}/${date.getFullYear()}`;
}

function formatTableDate(dateStr?: string): string {
  if (!dateStr) return '24-Jul';
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    const monthNum = parseInt(parts[1], 10) - 1;
    const day = parts[2].slice(0, 2);
    if (monthNum >= 0 && monthNum < 12) {
      return `${parseInt(day, 10)}-${months[monthNum]}`;
    }
  }
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return dateStr;
  const day = date.getDate();
  const month = months[date.getMonth()];
  return `${day}-${month}`;
}

export default function WorkOrderSummaryScreen({ pas, workAnalyses, suppliers, sites, onSavePa }: WorkOrderSummaryScreenProps) {
  const [selectedPaNumbers, setSelectedPaNumbers] = useState<string[]>([]);
  const [viewingPaNumber, setViewingPaNumber] = useState<string | null>(null);
  const [showAuditDetails, setShowAuditDetails] = useState<boolean>(false);
  const workOrders = pas.filter(pa => pa.workOrderNumber);
  const generatedWOs = workOrders.filter(pa => !pa.issuedDate);

  const getSelectedQuote = (pa: ProfitabilityAnalysis) =>
    pa.quoteComparison.find(quote => quote.supplierId === pa.selectedSupplierId);

  const canIssue = (pa: ProfitabilityAnalysis) => {
    const selectedQuote = getSelectedQuote(pa);
    return Boolean(selectedQuote && (selectedQuote.variance >= 0 || pa.approvalStatus === 'Approved'));
  };

  const issuablePaNumbers = generatedWOs.filter(canIssue).map(pa => pa.paNumber);
  const allIssuableSelected = issuablePaNumbers.length > 0 &&
    issuablePaNumbers.every(paNumber => selectedPaNumbers.includes(paNumber));

  const getSupplierName = (id: string) => suppliers.find(s => s.id === id)?.name || id;

  const handleExport = async (format: 'excel' | 'pdf' | 'word', id: string) => {
    const targetWo = workOrders.find(wo => wo.workOrderNumber === id);
    if (!targetWo) return;

    const wa = workAnalyses.find(w => w.id === targetWo.workAnalysisId) ||
      workAnalyses.find(w => w.mrRef === targetWo.mrRef);
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
      Status: targetWo.issuedDate ? 'Issued' : 'Generated'
    }];

    if (format === 'excel') {
      const xlsx = await import('xlsx');
      const ws = xlsx.utils.json_to_sheet(exportData);
      const wb = xlsx.utils.book_new();
      xlsx.utils.book_append_sheet(wb, ws, "Work Orders");
      xlsx.writeFile(wb, `Work_Order_${id}.xlsx`);
    } else if (format === 'pdf') {
      window.print();
    }
  };

  const handleTogglePaSelection = (paNumber: string) => {
    setSelectedPaNumbers(previous => previous.includes(paNumber)
      ? previous.filter(number => number !== paNumber)
      : [...previous, paNumber]);
  };

  const handleToggleAllIssuable = () => {
    setSelectedPaNumbers(previous => allIssuableSelected
      ? previous.filter(number => !issuablePaNumbers.includes(number))
      : Array.from(new Set([...previous, ...issuablePaNumbers])));
  };

  const handleIssueSelected = () => {
    const issueDate = new Date().toISOString().split('T')[0];
    const selectedOrders = generatedWOs.filter(pa =>
      selectedPaNumbers.includes(pa.paNumber) && canIssue(pa)
    );
    if (selectedOrders.length === 0) return;

    selectedOrders.forEach(pa => onSavePa({ ...pa, issuedDate: issueDate }));
    setSelectedPaNumbers([]);
  };

  const handleDownloadTemplate = async (pa: ProfitabilityAnalysis, wa?: WorkAnalysis, supplier?: Supplier) => {
    try {
      const selectedQuote = getSelectedQuote(pa);
      const activeSupplier = supplier || {
        id: pa.selectedSupplierId,
        name: selectedQuote?.supplierName || 'Transporter',
        tin: '',
        phone: '',
        contactPerson: '',
        address: '',
        licenseNo: '',
        rating: 100,
        status: 'Active',
        region: '',
        city: '',
        capitalCity: ''
      } as Supplier;

      await generateAdiuWorkOrderExcel({ pa, supplier: activeSupplier, workAnalysis: wa });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      alert(`Unable to generate the work order document: ${message}`);
    }
  };

  const viewingWorkOrder = workOrders.find(pa => pa.paNumber === viewingPaNumber);
  if (viewingWorkOrder) {
    const wa = workAnalyses.find(workAnalysis => workAnalysis.id === viewingWorkOrder.workAnalysisId)
      || workAnalyses.find(workAnalysis => workAnalysis.mrRef === viewingWorkOrder.mrRef);
    const selectedQuote = getSelectedQuote(viewingWorkOrder);
    const transporter = suppliers.find(supplier => supplier.id === viewingWorkOrder.selectedSupplierId);
    const canIssueViewingOrder = !viewingWorkOrder.issuedDate && canIssue(viewingWorkOrder);
    const rawSites = wa?.sites && wa.sites.length > 0 ? wa.sites : [];
    const assignmentSites = rawSites.length > 0 ? rawSites : [
      {
        id: 's-1',
        siteId: 'ET-ADD-1024',
        siteName: 'Bole Medhanialem High',
        longitude: 38.7845,
        latitude: 9.0012,
        town: 'Addis Ababa',
        projectScope: 'LTE Expansion & MW Upgrade',
        distance: 12,
        recommendedTruck: '3-ton'
      }
    ];

    const truckTypeDisplay = selectedQuote?.truckType || wa?.truckTypeRecommended || assignmentSites[0]?.recommendedTruck || '5 Ton(Isuzu)';
    const priceDisplay = (selectedQuote?.quotedPrice || 0).toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
    const headerDateDisplay = formatHeaderDate(viewingWorkOrder.issuedDate || viewingWorkOrder.date);
    const tableDateDisplay = formatTableDate(viewingWorkOrder.issuedDate || viewingWorkOrder.date);

    return (
      <div className="space-y-6 select-none pb-20">
        {/* Top Header & Actions Bar */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => setViewingPaNumber(null)}
              className="inline-flex items-center gap-2 text-sm font-semibold text-[#1D9E75] hover:text-emerald-800 transition-colors cursor-pointer"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Work Orders
            </button>
            <div className="h-5 w-px bg-slate-300 hidden sm:block" />
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-[#5F5E5A]">Select Work Order:</span>
              <select
                value={viewingWorkOrder.paNumber}
                onChange={(e) => setViewingPaNumber(e.target.value)}
                className="h-8 px-2.5 py-0.5 border border-[#D3D1C7] rounded-lg text-xs font-mono font-bold text-[#2C2C2A] bg-white focus:outline-none focus:border-[#1D9E75] cursor-pointer"
              >
                {workOrders.map(wo => {
                  const supName = getSupplierName(wo.selectedSupplierId);
                  return (
                    <option key={wo.paNumber} value={wo.paNumber}>
                      {wo.workOrderNumber} — {supName} ({wo.issuedDate ? 'Issued' : 'Generated'})
                    </option>
                  );
                })}
              </select>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <ExportDropdown onExport={format => handleExport(format, viewingWorkOrder.workOrderNumber)} />
            <button
              type="button"
              onClick={() => handleDownloadTemplate(viewingWorkOrder, wa, transporter)}
              className="inline-flex items-center gap-2 rounded-lg bg-[#1D9E75] px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-emerald-700 cursor-pointer shadow-sm"
              title="Download official ADIU WORK ORDER.xlsx"
            >
              <FileSpreadsheet className="h-4 w-4" />
              Download Work Order
            </button>
            {canIssueViewingOrder && (
              <button
                type="button"
                onClick={() => {
                  onSavePa({ ...viewingWorkOrder, issuedDate: new Date().toISOString().split('T')[0] });
                  setSelectedPaNumbers(previous => previous.filter(number => number !== viewingWorkOrder.paNumber));
                }}
                className="rounded-lg bg-[#1D9E75] px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-emerald-700 cursor-pointer shadow-sm"
              >
                Issue Work Order
              </button>
            )}
          </div>
        </div>

        {/* WORK ORDER SPREADSHEET CARD */}
        <div className="bg-white p-6 rounded-xl border border-[#D3D1C7] shadow-sm space-y-4 overflow-x-auto font-sans">
          
          {/* Header with Date on the right */}
          <div className="flex items-center justify-between pb-1">
            <div className="font-bold text-xs uppercase tracking-wider text-black">
              TRANSPORTER DETAILS
            </div>
            <div className="text-xs font-bold text-black font-sans">
              Date: {headerDateDisplay}
            </div>
          </div>

          {/* Section 1: TRANSPORTER DETAILS (4x4 Table) */}
          <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-black text-xs font-sans bg-white min-w-[750px]">
              <tbody>
                <tr>
                  <td className="border border-black px-3 py-1.5 font-bold text-black w-[20%]">Transporter / Supplier:</td>
                  <td className="border border-black px-3 py-1.5 font-bold text-black w-[30%]">{transporter?.name || selectedQuote?.supplierName || '—'}</td>
                  <td className="border border-black px-3 py-1.5 font-bold text-[#C00000] w-[20%] bg-[#F9FAFB]">TIN No.:</td>
                  <td className="border border-black px-3 py-1.5 text-black w-[30%] font-mono">{transporter?.tin || '—'}</td>
                </tr>
                <tr>
                  <td className="border border-black px-3 py-1.5 font-bold text-black">Contact Person:</td>
                  <td className="border border-black px-3 py-1.5 text-black">{transporter?.contactPerson || '—'}</td>
                  <td className="border border-black px-3 py-1.5 font-bold text-[#C00000] bg-[#F9FAFB]">Mobile:</td>
                  <td className="border border-black px-3 py-1.5 text-black font-mono">{transporter?.phone || '—'}</td>
                </tr>
                <tr>
                  <td className="border border-black px-3 py-1.5 font-bold text-black">Address:</td>
                  <td className="border border-black px-3 py-1.5 text-black">{transporter?.address || (transporter?.city ? `${transporter.city}, ${transporter.region || ''}` : '—')}</td>
                  <td className="border border-black px-3 py-1.5 font-bold text-[#C00000] bg-[#F9FAFB]">Agreement / Contract No.:</td>
                  <td className="border border-black px-3 py-1.5 text-black font-mono">{transporter?.licenseNo ? `AGR-${transporter.licenseNo}` : '—'}</td>
                </tr>
                <tr>
                  <td className="border border-black px-3 py-1.5 font-bold text-black">Payment Terms:</td>
                  <td className="border border-black px-3 py-1.5 font-semibold text-[#C00000]">Upon completed delivery &amp; verified documents</td>
                  <td className="border border-black px-3 py-1.5 font-bold text-[#C00000] bg-[#F9FAFB]">Payment Method:</td>
                  <td className="border border-black px-3 py-1.5 text-black">Bank transfer</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Section 2: TRANSPORTATION ASSIGNMENT */}
          <div className="pt-2">
            <div className="pb-1 font-bold text-xs uppercase tracking-wider text-black">
              TRANSPORTATION ASSIGNMENT
            </div>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-black text-xs font-sans bg-white min-w-[950px]">
                <thead>
                  <tr className="border border-black">
                    <th className="border border-black bg-[#6BA84F] px-2 py-2 text-center font-bold text-black w-[40px]">No</th>
                    <th className="border border-black bg-[#6BA84F] px-2 py-2 text-center font-bold text-[#C00000]">Site ID</th>
                    <th className="border border-black bg-[#6BA84F] px-3 py-2 text-center font-bold text-[#C00000]">Site Name</th>
                    <th className="border border-black bg-[#6BA84F] px-2 py-2 text-center font-bold text-[#C00000]">Longitude</th>
                    <th className="border border-black bg-[#6BA84F] px-2 py-2 text-center font-bold text-[#C00000]">Latitude</th>
                    <th className="border border-black bg-[#6BA84F] px-2 py-2 text-center font-bold text-[#C00000]">Town</th>
                    <th className="border border-black bg-[#6BA84F] px-2 py-2 text-center font-bold text-black">Region</th>
                    <th className="border border-black bg-[#6BA84F] px-2 py-2 text-center font-bold text-black">Scope</th>
                    <th className="border border-black bg-[#6BA84F] px-2 py-2 text-center font-bold text-black">Distance</th>
                    <th className="border border-black bg-[#6BA84F] px-3 py-2 text-center font-bold text-black">Truck Type</th>
                    <th className="border border-black bg-[#6BA84F] px-2 py-2 text-center font-bold text-black">Expected<br/>Outbound Date</th>
                    <th className="border border-black bg-[#FCE4D6] px-3 py-2 text-center font-bold text-black">Transportation Price</th>
                  </tr>
                </thead>
                <tbody>
                  {assignmentSites.map((site, index) => {
                    const projectSite = sites.find(s => s.siteId === site.siteId);
                    const siteRegion = site.region || projectSite?.region || projectSite?.geofenceZone || wa?.route || 'SWR';
                    
                    return (
                      <tr key={site.id || site.siteId || index} className="border border-black">
                        <td className="border border-black px-2 py-2 text-center text-black font-medium">{index + 1}</td>
                        <td className="border border-black px-2 py-2 text-center font-mono font-bold text-[#C00000]">{site.siteId}</td>
                        <td className="border border-black px-3 py-2 text-left font-semibold text-black">{site.siteName}</td>
                        <td className="border border-black px-2 py-2 text-center font-mono text-black">{site.longitude != null ? site.longitude : '—'}</td>
                        <td className="border border-black px-2 py-2 text-center font-mono text-black">{site.latitude != null ? site.latitude : '—'}</td>
                        <td className="border border-black px-2 py-2 text-center font-semibold text-[#C00000]">{site.town || wa?.warehouseName || '—'}</td>
                        <td className="border border-black px-2 py-2 text-center text-black font-medium">{siteRegion}</td>
                        <td className="border border-black px-2 py-2 text-center text-black">{site.projectScope || 'WL'}</td>
                        <td className="border border-black px-2 py-2 text-center text-black font-mono">{site.distance != null ? site.distance : '—'}</td>
                        
                        {/* Vertically merged Truck Type cell across all rows */}
                        {index === 0 && (
                          <td
                            rowSpan={assignmentSites.length}
                            className="border border-black px-3 py-2 text-center align-middle font-bold text-black bg-white"
                          >
                            {truckTypeDisplay}
                          </td>
                        )}
                        
                        <td className="border border-black px-2 py-2 text-center text-black font-medium">{tableDateDisplay}</td>
                        
                        {/* Vertically merged Transportation Price cell across all rows with #D9E1F2 background */}
                        {index === 0 && (
                          <td
                            rowSpan={assignmentSites.length}
                            className="border border-black px-4 py-2 text-center align-middle font-bold font-mono text-sm text-black bg-[#D9E1F2]"
                          >
                            {priceDisplay}
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* System Information & Quotation Review (Collapsible) */}
        <div className="bg-white rounded-xl border border-[#D3D1C7] shadow-sm overflow-hidden">
          <button
            type="button"
            onClick={() => setShowAuditDetails(!showAuditDetails)}
            className="w-full px-5 py-3.5 flex items-center justify-between text-left text-xs font-bold uppercase tracking-wider text-[#5F5E5A] hover:bg-gray-50 transition-colors"
          >
            <span>System Quotation &amp; Operational Details</span>
            <span className="text-xs font-normal text-emerald-700 flex items-center gap-1">
              {showAuditDetails ? 'Hide details' : 'Show details'}
            </span>
          </button>
          
          {showAuditDetails && (
            <div className="p-5 border-t border-[#D3D1C7] space-y-6">
              {/* Quotation Comparison & Requirements */}
              <div className="grid gap-6 xl:grid-cols-2">
                <div>
                  <h4 className="mb-3 text-xs font-bold uppercase text-[#5F5E5A]">Quotation Comparison</h4>
                  {viewingWorkOrder.quoteComparison.length ? (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead>
                          <tr className="border-b border-[#D3D1C7] font-bold text-[#5F5E5A]">
                            <th className="py-2">Transporter</th>
                            <th className="py-2">Truck Type</th>
                            <th className="py-2">Quoted Cost</th>
                            <th className="py-2">Budget</th>
                            <th className="py-2">Variance</th>
                            <th className="py-2">Selection</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#D3D1C7]/60">
                          {viewingWorkOrder.quoteComparison.map(quote => (
                            <tr key={quote.supplierId} className={quote.supplierId === viewingWorkOrder.selectedSupplierId ? 'bg-emerald-50/50 font-semibold' : ''}>
                              <td className="py-2">{quote.supplierName}</td>
                              <td className="py-2">{quote.truckType}</td>
                              <td className="py-2 font-mono text-emerald-700">{quote.quotedPrice.toLocaleString()} ETB</td>
                              <td className="py-2 font-mono">{quote.budget.toLocaleString()} ETB</td>
                              <td className="py-2 font-mono">{quote.variance.toLocaleString()} ETB ({quote.variancePercent}%)</td>
                              <td className="py-2">
                                {quote.supplierId === viewingWorkOrder.selectedSupplierId ? (
                                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                                    Winning
                                  </span>
                                ) : '—'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p className="text-xs text-[#5F5E5A]">No quotation comparison is available.</p>
                  )}
                </div>

                <div className="space-y-3">
                  <h4 className="text-xs font-bold uppercase text-[#5F5E5A]">Requirements &amp; Instructions</h4>
                  <div className="text-xs space-y-2">
                    <p><span className="font-semibold text-slate-700">Special Requirements:</span> {wa?.specialRequirements.length ? wa.specialRequirements.join(', ') : 'None'}</p>
                    <p><span className="font-semibold text-slate-700">Key Risks:</span> {wa?.keyRisks || 'None recorded'}</p>
                    <p><span className="font-semibold text-slate-700">Special Instructions:</span> {viewingWorkOrder.specialInstructions || 'None recorded'}</p>
                    <p><span className="font-semibold text-slate-700">Approval Status:</span> {viewingWorkOrder.approvalStatus || 'Approved'}</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 select-none pb-20">
      <div className="space-y-5 bg-white p-6 rounded-xl border border-[#D3D1C7] shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-[#2C2C2A]">Work Order Summary</h2>
            <p className="text-sm text-[#5F5E5A]">Review generated work orders and issue selected orders.</p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-[#5F5E5A]">
              {generatedWOs.length} generated · {workOrders.length - generatedWOs.length} issued
            </span>
            <button
              type="button"
              onClick={handleIssueSelected}
              disabled={!selectedPaNumbers.some(paNumber => issuablePaNumbers.includes(paNumber))}
              className="px-4 py-2 bg-[#1D9E75] text-white rounded-lg text-xs font-semibold hover:bg-emerald-700 disabled:bg-slate-300 disabled:cursor-not-allowed transition-colors"
            >
              Issue Selected Work Orders
            </button>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-[#D3D1C7] shadow-sm overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-[#D3D1C7] text-xs font-sans font-bold text-[#5F5E5A] uppercase tracking-wider">
                <th className="px-5 py-4">
                  <input
                    type="checkbox"
                    aria-label="Select all eligible generated work orders"
                    checked={allIssuableSelected}
                    disabled={issuablePaNumbers.length === 0}
                    onChange={handleToggleAllIssuable}
                  />
                </th>
                <th className="px-5 py-4">WO Number</th>
                <th className="px-5 py-4">Work Analysis ID</th>
                <th className="px-5 py-4">Truck Type</th>
                <th className="px-5 py-4">Transporter</th>
                <th className="px-5 py-4">Transportation Cost</th>
                <th className="px-5 py-4">Issued Date</th>
                <th className="px-5 py-4">Status</th>
                <th className="px-5 py-4 text-right">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#D3D1C7]/40 text-sm font-sans text-[#2C2C2A]">
              {workOrders.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-6 py-16 text-center text-[#5F5E5A]">
                    No generated work orders available.
                  </td>
                </tr>
              ) : (
                workOrders.map((wo) => {
                  const wa = workAnalyses.find(w => w.id === wo.workAnalysisId) ||
                    workAnalyses.find(w => w.mrRef === wo.mrRef);
                  const selectedQuote = wo.quoteComparison.find(q => q.supplierId === wo.selectedSupplierId);
                  const canIssueOrder = !wo.issuedDate && canIssue(wo);

                  return (
                    <tr key={wo.workOrderNumber} className="hover:bg-gray-50 transition-colors">
                      <td className="px-5 py-4">
                        <input
                          type="checkbox"
                          aria-label={`Select work order ${wo.workOrderNumber}`}
                          checked={selectedPaNumbers.includes(wo.paNumber)}
                          disabled={!canIssueOrder}
                          onChange={() => handleTogglePaSelection(wo.paNumber)}
                        />
                      </td>
                      <td className="px-5 py-4 font-mono font-semibold text-[#1D9E75]">{wo.workOrderNumber}</td>
                      <td className="px-5 py-4 font-mono text-xs">{wa ? wa.id : '-'}</td>
                      <td className="px-5 py-4">{selectedQuote?.truckType || wa?.truckTypeRecommended || '-'}</td>
                      <td className="px-5 py-4 font-semibold">{getSupplierName(wo.selectedSupplierId)}</td>
                      <td className="px-5 py-4 font-semibold text-emerald-600">{selectedQuote ? `${selectedQuote.quotedPrice.toLocaleString()} ETB` : '—'}</td>
                      <td className="px-5 py-4">{wo.issuedDate || '-'}</td>
                      <td className="px-5 py-4">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                          wo.issuedDate
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : canIssueOrder
                              ? 'bg-amber-50 text-amber-700 border-amber-200'
                              : 'bg-rose-50 text-rose-700 border-rose-200'
                        }`}>
                          {wo.issuedDate ? 'Issued' : canIssueOrder ? 'Generated' : 'Approval Required'}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-right">
                        <button
                          type="button"
                          onClick={() => setViewingPaNumber(wo.paNumber)}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-[#D3D1C7] px-3 py-1.5 text-xs font-semibold text-[#1D9E75] hover:bg-emerald-50"
                        >
                          <FileText className="h-3.5 w-3.5" />
                          View Details
                        </button>
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
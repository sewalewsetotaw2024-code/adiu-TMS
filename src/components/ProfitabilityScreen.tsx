import React, { useState, useEffect, useMemo } from 'react';
import { ProfitabilityAnalysis, MR, QuoteComparisonRow, Supplier, PriceBookEntry, WorkAnalysis, SupplierQuotation, ProjectSite, SiteRegion } from '../types';
import { 
  ExternalLink, 
  CheckCircle2, 
  XCircle, 
  Info, 
  ShieldCheck, 
  FileCheck, 
  ArrowRight, 
  AlertTriangle,
  Calculator,
  Clock,
  ClipboardCheck,
  Search,
  Plus,
  X,
  Award,
  DollarSign
} from 'lucide-react';
import { ExportDropdown } from './ExportDropdown';

interface ProfitabilityScreenProps {
  pas: ProfitabilityAnalysis[];
  mrs: MR[];
  suppliers: Supplier[];
  onSavePa: (pa: ProfitabilityAnalysis) => void;
  onRemovePa?: (paNumber: string) => void;
  setSelectedMrRef?: (mrRef: string | null) => void;
  priceBook: PriceBookEntry[];
  workAnalyses: WorkAnalysis[];
  quotations: SupplierQuotation[];
  sites: ProjectSite[];
  siteRegions: SiteRegion[];
  setScreen?: (screen: string) => void;
}

export default function ProfitabilityScreen({
  pas,
  mrs,
  suppliers,
  onSavePa,
  setSelectedMrRef,
  priceBook,
  workAnalyses,
  quotations,
  sites,
  siteRegions,
  setScreen
}: ProfitabilityScreenProps) {
  
  const [activePa, setActivePa] = useState<ProfitabilityAnalysis | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'form'>('list');

  // Search & Filter state for the dashboard
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  // Helper to extract or dynamically compute the route for a Work Analysis
  const getWorkAnalysisRoute = (wa: WorkAnalysis, mr?: MR): string => {
    if (wa.route && wa.route.trim()) {
      return wa.route;
    }
    const origin = wa.warehouseName || mr?.warehouseName || 'Kality Warehouse';
    const towns = Array.from(new Set((wa.sites || []).map(s => s.town).filter(Boolean)));
    if (towns.length > 0) {
      return `${origin} → ${towns.join(' → ')}`;
    }
    return `${origin} → Direct Delivery`;
  };

  // Find the Work Analysis and Quotations for the current active PA
  const currentWa = activePa 
    ? workAnalyses.find(w => w.id === activePa.workAnalysisId) ||
      workAnalyses.find(w => w.mrRef === activePa.mrRef)
    : null;
  const currentMr = currentWa ? mrs.find(m => m.mrNumber === currentWa.mrRef) : undefined;
  const currentWaRoute = currentWa ? getWorkAnalysisRoute(currentWa, currentMr) : 'Direct Delivery';
  const currentQuotes = currentWa ? quotations.filter(q => q.workAnalysisId === currentWa.id) : [];
  const longestDistanceSite = currentWa?.sites.reduce((longest, site) =>
    site.distance > longest.distance ? site : longest
  );
  const longestDistanceProjectSite = longestDistanceSite
    ? sites.find(site => site.siteId === longestDistanceSite.siteId)
    : undefined;
  const longestSiteRegionCode = longestDistanceProjectSite
    ? longestDistanceProjectSite.region ||
      longestDistanceProjectSite.geofenceZone ||
      (longestDistanceProjectSite as ProjectSite & { regionCluster?: string }).regionCluster
    : undefined;
  const longestSiteRegion = longestSiteRegionCode
    ? siteRegions.find(region => region.code === longestSiteRegionCode)
    : undefined;
  const regionalCompensationFactor = longestSiteRegion?.regionalCompensationFactor;

  // KPI Calculations across all PAs
  const totalPas = pas.length;
  const approvedPas = pas.filter(pa => pa.approvalStatus === 'Approved').length;
  const pendingPas = pas.filter(pa => pa.approvalStatus !== 'Approved').length;
  const generatedWorkOrdersCount = pas.filter(pa => pa.workOrderNumber).length;

  // Filtered PAs based on search & approval status
  const filteredPas = useMemo(() => {
    return pas.filter(pa => {
      if (filterStatus !== 'all') {
        if (filterStatus === 'Approved' && pa.approvalStatus !== 'Approved') return false;
        if (filterStatus === 'Pending' && pa.approvalStatus === 'Approved') return false;
      }
      if (searchQuery.trim() !== '') {
        const q = searchQuery.toLowerCase();
        const matchPa = pa.paNumber.toLowerCase().includes(q);
        const matchWo = (pa.workOrderNumber || '').toLowerCase().includes(q);
        const wa = workAnalyses.find(w => w.id === pa.workAnalysisId) ||
          workAnalyses.find(w => w.mrRef === pa.mrRef);
        const matchWa = wa ? wa.id.toLowerCase().includes(q) : false;
        const matchRoute = wa ? getWorkAnalysisRoute(wa).toLowerCase().includes(q) : false;
        const matchSup = (pa.quoteComparison || []).some(row => row.supplierName.toLowerCase().includes(q));
        return matchPa || matchWo || matchWa || matchRoute || matchSup;
      }
      return true;
    });
  }, [pas, filterStatus, searchQuery, workAnalyses]);

  // Group quotations by supplier to calculate the total aggregate bid
  const supplierAggregates = currentQuotes.reduce((acc, q) => {
    if (!acc[q.supplierId]) {
      acc[q.supplierId] = {
        supplierId: q.supplierId,
        supplierName: q.supplierName,
        totalQuoted: 0,
        totalBudget: 0,
        totalQuantity: 0,
        items: [] as SupplierQuotation[]
      };
    }
    
    // Find the budget in Price Book (default/auto match)
    const pbEntry = priceBook.find(p => p.code === q.priceBookCode && (p.vendorId === q.supplierId || p.supplierId === q.supplierId));
    const itemBudgetRate = pbEntry ? pbEntry.unitPrice : q.unitPrice;
    
    acc[q.supplierId].totalQuoted += q.totalPrice;
    acc[q.supplierId].totalBudget += (itemBudgetRate * q.quantity * (regionalCompensationFactor ?? 1));
    acc[q.supplierId].totalQuantity += q.quantity;
    acc[q.supplierId].items.push(q);
    return acc;
  }, {} as Record<string, { supplierId: string; supplierName: string; totalQuoted: number; totalBudget: number; totalQuantity: number; items: SupplierQuotation[] }>);

  // Build the comparison rows honoring manually selected Vendor / Price Book Item
  const calculatedQuotes: QuoteComparisonRow[] = Object.values(supplierAggregates).map(agg => {
    const existingRow = activePa?.quoteComparison.find(q => q.supplierId === agg.supplierId);

    const vendorId = existingRow?.vendorId || agg.supplierId;
    const priceBookEntryId = existingRow?.priceBookEntryId || '';

    let budget = agg.totalBudget;

    if (priceBookEntryId) {
      const selectedEntry = priceBook.find(p => p.id === priceBookEntryId);
      if (selectedEntry) {
        budget = selectedEntry.unitPrice * agg.totalQuantity * (regionalCompensationFactor ?? 1);
      }
    }

    const variance = budget - agg.totalQuoted;
    const variancePercent = budget > 0 ? Math.round((variance / budget) * 1000) / 10 : 0;
    
    return {
      supplierId: agg.supplierId,
      supplierName: agg.supplierName,
      truckType: currentWa?.truckTypeRecommended || '3-ton',
      routeZone: currentWaRoute,
      quotedPrice: agg.totalQuoted,
      budget,
      variance,
      variancePercent,
      status: 'Pending',
      vendorId,
      priceBookEntryId
    };
  });

  // Sort by lowest price to determine least supplier
  const sortedCalculatedQuotes = [...calculatedQuotes].sort((a, b) => a.quotedPrice - b.quotedPrice);
  const leastSupplier = sortedCalculatedQuotes.length > 0 ? sortedCalculatedQuotes[0] : null;
  const selectedWinner = leastSupplier;
  const displayedQuotes = selectedWinner
    ? calculatedQuotes.filter(row => row.supplierId === selectedWinner.supplierId)
    : [];

  // Sync active PA's selected supplier and comparisons with the quotations
  useEffect(() => {
    if (activePa && leastSupplier) {
      const selectedSupplierId = leastSupplier.supplierId;
      const needsUpdate =
        activePa.selectedSupplierId !== selectedSupplierId ||
        activePa.supplierId !== selectedSupplierId ||
        JSON.stringify(activePa.quoteComparison) !== JSON.stringify(calculatedQuotes);

      if (needsUpdate) {
        setActivePa(prev => {
          if (!prev) return null;
          return {
            ...prev,
            selectedSupplierId,
            supplierId: selectedSupplierId,
            quoteComparison: calculatedQuotes
          };
        });
      }
    }
  }, [leastSupplier?.supplierId, currentQuotes.length, activePa?.mrRef, activePa?.selectedSupplierId, regionalCompensationFactor]);

  const handleInitNewPa = () => {
    const newPa: ProfitabilityAnalysis = {
      paNumber: '',
      mrRef: '',
      supplierId: '',
      date: new Date().toISOString().split('T')[0],
      quoteComparison: [],
      selectedSupplierId: '',
      workOrderNumber: '',
      issuedDate: '',
      specialInstructions: 'Ensure driver completes QEHS inspection prior to departure.',
      comment: '',
      approvalStatus: 'Pending'
    };
    setActivePa(newPa);
    setViewMode('form');
  };

  const handleCreateNewPa = () => {
    handleInitNewPa();
  };

  const handleOpenPa = (pa: ProfitabilityAnalysis) => {
    setActivePa(JSON.parse(JSON.stringify(pa)));
    setViewMode('form');
  };

  const handleSelectWorkAnalysis = (workAnalysisId: string) => {
    const workAnalysis = workAnalyses.find(wa => wa.id === workAnalysisId);
    if (!activePa || !workAnalysis) return;
    const workAnalysisQuotes = quotations.filter(quote => quote.workAnalysisId === workAnalysis.id);
    const winningSupplierId = Object.entries(workAnalysisQuotes.reduce<Record<string, number>>((totals, quote) => {
      totals[quote.supplierId] = (totals[quote.supplierId] || 0) + quote.totalPrice;
      return totals;
    }, {})).sort(([, totalA], [, totalB]) => totalA - totalB)[0]?.[0] || '';
    setActivePa({
      ...activePa,
      workAnalysisId: workAnalysis.id,
      mrRef: workAnalysis.mrRef,
      supplierId: winningSupplierId,
      selectedSupplierId: winningSupplierId,
      quoteComparison: [],
      approvalStatus: 'Pending',
      approverName: undefined,
      approvalReference: undefined,
      approvedTier: undefined,
      approvalDocumentedDate: undefined
    });
    if (setSelectedMrRef) setSelectedMrRef(workAnalysis.mrRef);
  };

  const getNextPaNumber = () => {
    const paSequence = pas.reduce((highest, pa) => {
      const sequence = Number(pa.paNumber.match(/(\d+)$/)?.[1] || 0);
      return Math.max(highest, sequence);
    }, 0) + 1;
    return `PA-2026-${String(paSequence).padStart(4, '0')}`;
  };

  const handleSubmitVarianceForApproval = () => {
    if (!activePa || !selectedWinner || selectedWinner.variance >= 0) return;

    const updated: ProfitabilityAnalysis = {
      ...activePa,
      paNumber: activePa.paNumber || getNextPaNumber(),
      supplierId: selectedWinner.supplierId,
      selectedSupplierId: selectedWinner.supplierId,
      quoteComparison: calculatedQuotes,
      approvalStatus: 'Pending',
      approverName: undefined,
      approvalReference: undefined,
      approvedTier: undefined,
      approvalDocumentedDate: undefined
    };

    onSavePa(updated);
    setActivePa(updated);
    setViewMode('list');
    alert(`Profitability Analysis ${updated.paNumber} was submitted for variance approval.`);
    setScreen?.('approvals');
  };

  const handleIssueWorkOrderAction = () => {
    if (!activePa) return;
    if (!selectedWinner) {
      alert("Select a Work Analysis with supplier quotations before issuing a work order.");
      return;
    }
    if (selectedWinner.variance < 0 && activePa.approvalStatus !== 'Approved') {
      alert('The over-budget variance must be approved before generating a work order.');
      return;
    }

    const paNumber = activePa.paNumber || getNextPaNumber();
    const paSequence = Number(paNumber.match(/(\d+)$/)?.[1] || 0);
    const workOrderNumber = activePa.workOrderNumber || `WO-2026-880${paSequence}`;
    const updated: ProfitabilityAnalysis = {
      ...activePa,
      paNumber,
      workOrderNumber,
      supplierId: selectedWinner.supplierId,
      selectedSupplierId: selectedWinner.supplierId,
      quoteComparison: calculatedQuotes,
      approvalStatus: selectedWinner.variance < 0 ? activePa.approvalStatus : 'Approved'
    };

    onSavePa(updated);
    setActivePa(updated);
    setViewMode('list');
    alert(`Work Order ${updated.workOrderNumber} has been generated for ${selectedWinner.supplierName} under PA ${updated.paNumber}. Issue it from the Work Order page.`);
  };

  const handleCancelAnalysis = () => {
    setViewMode('list');
    setActivePa(null);
  };

  const getVarianceColor = (vPct: number) => {
    if (vPct >= 0) return 'bg-emerald-50 text-emerald-800 font-bold border-emerald-200';
    const negVal = Math.abs(vPct);
    if (negVal <= 10) return 'bg-[#1D9E75]/10 text-[#1D9E75] font-bold border-[#1D9E75]/20';
    if (negVal <= 20) return 'bg-orange-50 text-orange-800 font-bold border-orange-200';
    return 'bg-red-50 text-red-800 font-bold border-red-200';
  };
  const requiresVarianceApproval = Boolean(selectedWinner && selectedWinner.variance < 0);
  const varianceApproved = activePa?.approvalStatus === 'Approved';
  const canGenerateWorkOrder = Boolean(selectedWinner && (!requiresVarianceApproval || varianceApproved));

  const handleVendorSelect = (supplierId: string, vendorId: string) => {
    if (!activePa) return;
    const currentRow = calculatedQuotes.find(q => q.supplierId === supplierId);
    if (!currentRow) return;

    const agg = supplierAggregates[supplierId];
    const budget = agg ? agg.totalBudget : currentRow.budget;
    const variance = budget - (agg ? agg.totalQuoted : currentRow.quotedPrice);
    const variancePercent = budget > 0 ? Math.round((variance / budget) * 1000) / 10 : 0;

    const updatedRow: QuoteComparisonRow = {
      ...currentRow,
      vendorId,
      priceBookEntryId: '',
      budget,
      variance,
      variancePercent
    };

    setActivePa(prev => {
      if (!prev) return prev;
      const otherRows = prev.quoteComparison.filter(q => q.supplierId !== supplierId);
      return { ...prev, quoteComparison: [...otherRows, updatedRow] };
    });
  };

  const handlePriceBookItemSelect = (supplierId: string, priceBookEntryId: string) => {
    if (!activePa) return;
    const currentRow = calculatedQuotes.find(q => q.supplierId === supplierId);
    const agg = supplierAggregates[supplierId];
    if (!currentRow || !agg) return;

    const selectedEntry = priceBook.find(p => p.id === priceBookEntryId);
    const budget = selectedEntry
      ? selectedEntry.unitPrice * agg.totalQuantity * (regionalCompensationFactor ?? 1)
      : agg.totalBudget;
    const variance = budget - agg.totalQuoted;
    const variancePercent = budget > 0 ? Math.round((variance / budget) * 1000) / 10 : 0;

    const updatedRow: QuoteComparisonRow = {
      ...currentRow,
      priceBookEntryId,
      budget,
      variance,
      variancePercent
    };

    setActivePa(prev => {
      if (!prev) return prev;
      const otherRows = prev.quoteComparison.filter(q => q.supplierId !== supplierId);
      return { ...prev, quoteComparison: [...otherRows, updatedRow] };
    });
  };

  const handleExport = async (format: 'excel' | 'pdf' | 'word') => {
    const targetData = filteredPas;
    if (targetData.length === 0) return;
    const getExportRow = (pa: ProfitabilityAnalysis) => {
      const wa = workAnalyses.find(workAnalysis => workAnalysis.id === pa.workAnalysisId)
        || workAnalyses.find(workAnalysis => workAnalysis.mrRef === pa.mrRef);
      const winner = pa.quoteComparison.find(row => row.supplierId === pa.selectedSupplierId);
      return {
        PA_Number: pa.paNumber,
        Work_Analysis: wa?.id || '—',
        Winning_Supplier: winner?.supplierName || '—',
        Work_Order: pa.workOrderNumber || '—',
        Status: pa.approvalStatus
      };
    };

    if (format === 'excel') {
      const xlsx = await import('xlsx');
      const ws = xlsx.utils.json_to_sheet(targetData.map(getExportRow));
      const wb = xlsx.utils.book_new();
      xlsx.utils.book_append_sheet(wb, ws, "Profitability Analysis");
      xlsx.writeFile(wb, 'Profitability_Analyses.xlsx');
    } else if (format === 'pdf') {
      const { jsPDF } = await import('jspdf');
      const autoTable = (await import('jspdf-autotable')).default;
      const doc = new jsPDF();
      doc.text('Profitability Analysis Report', 14, 15);
      autoTable(doc, {
        startY: 20,
        head: [['PA Number', 'Work Analysis', 'Winning Supplier', 'Work Order', 'Status']],
        body: targetData.map(pa => {
          const row = getExportRow(pa);
          return [row.PA_Number, row.Work_Analysis, row.Winning_Supplier, row.Work_Order, row.Status];
        }),
      });
      doc.save('Profitability_Analyses.pdf');
    } else if (format === 'word') {
      const docx = await import('docx');
      const doc = new docx.Document({
        sections: [{
          properties: {},
          children: [
            new docx.Paragraph({ text: 'Profitability Analysis Report', heading: docx.HeadingLevel.HEADING_1 }),
            new docx.Table({
              rows: [
                new docx.TableRow({
                  children: ['PA Number', 'Work Analysis', 'Winning Supplier', 'Work Order', 'Status'].map(t => new docx.TableCell({ children: [new docx.Paragraph(t)] }))
                }),
                ...targetData.map(pa => new docx.TableRow({
                  children: Object.values(getExportRow(pa)).map(t => new docx.TableCell({ children: [new docx.Paragraph(String(t))] }))
                }))
              ]
            })
          ]
        }]
      });
      docx.Packer.toBlob(doc).then(blob => {
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = 'Profitability_Analyses.docx';
        link.click();
      });
    }
  };

  return (
    <div className="space-y-6 select-none pb-20" id="profitability-screen-container">
      
      {/* 1. TOP GREEN HERO BANNER */}
      <div className="relative overflow-hidden bg-gradient-to-r from-[#006847] via-[#047857] to-[#10b981] text-white p-6 md:p-8 rounded-2xl shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-5">
        <div className="space-y-1.5 relative z-10 max-w-2xl">
          <h1 className="text-2xl md:text-3xl font-extrabold font-sans tracking-tight text-white">
            Profitability & Margin Analysis
          </h1>
          <p className="text-xs md:text-sm text-emerald-100/90 font-medium leading-relaxed">
            {viewMode === 'list'
              ? 'Review analyses and create a profitability analysis for a winning supplier quotation.'
              : 'Select a Work Analysis and winning supplier, then complete the analysis details.'}
          </p>
        </div>

        <div className="relative z-10 shrink-0 flex items-center gap-3">
          {viewMode === 'list' && <ExportDropdown onExport={handleExport} />}
          <button
            type="button"
            onClick={viewMode === 'list' ? handleCreateNewPa : handleCancelAnalysis}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-white text-emerald-800 hover:bg-emerald-50 rounded-xl text-xs md:text-sm font-bold shadow-md transition-all transform active:scale-95 cursor-pointer"
          >
            {viewMode === 'list' ? <Plus className="w-4 h-4 text-emerald-800" /> : <ArrowRight className="w-4 h-4 rotate-180 text-emerald-800" />}
            <span>{viewMode === 'list' ? 'New Analysis' : 'Back to Analyses'}</span>
          </button>
        </div>

        {/* Decorative background visual flourishes */}
        <div className="absolute -right-8 -bottom-10 w-52 h-52 rounded-full bg-white/10 pointer-events-none" />
        <div className="absolute right-36 -top-12 w-32 h-32 rounded-full bg-emerald-400/20 pointer-events-none blur-sm" />
      </div>

      {viewMode === 'list' ? (
      <>
      {/* 2. FOUR KPI SUMMARY CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Metric 1: Total Analyses */}
        <div className="bg-white p-4 rounded-xl border border-[#D3D1C7] shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-[#5F5E5A] uppercase tracking-wider block">
              TOTAL ANALYSES
            </span>
            <span className="text-2xl font-black text-slate-800 font-sans">
              {totalPas}
            </span>
          </div>
          <div className="w-11 h-11 rounded-xl bg-emerald-50 text-[#1D9E75] flex items-center justify-center shrink-0 border border-emerald-100">
            <Calculator className="w-5 h-5" />
          </div>
        </div>

        {/* Metric 2: Approved PAs */}
        <div className="bg-white p-4 rounded-xl border border-[#D3D1C7] shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-[#5F5E5A] uppercase tracking-wider block">
              APPROVED PAS
            </span>
            <span className="text-2xl font-black text-slate-800 font-sans">
              {approvedPas}
            </span>
          </div>
          <div className="w-11 h-11 rounded-xl bg-emerald-50 text-[#1D9E75] flex items-center justify-center shrink-0 border border-emerald-100">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        {/* Metric 3: Pending Review */}
        <div className="bg-white p-4 rounded-xl border border-[#D3D1C7] shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-[#5F5E5A] uppercase tracking-wider block">
              PENDING REVIEW
            </span>
            <span className="text-2xl font-black text-slate-800 font-sans">
              {pendingPas}
            </span>
          </div>
          <div className="w-11 h-11 rounded-xl bg-emerald-50 text-[#1D9E75] flex items-center justify-center shrink-0 border border-emerald-100">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        {/* Metric 4: Generated Work Orders */}
        <div className="bg-white p-4 rounded-xl border border-[#D3D1C7] shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-[#5F5E5A] uppercase tracking-wider block">
              GENERATED WORK ORDERS
            </span>
            <span className="text-2xl font-black text-slate-800 font-sans">
              {generatedWorkOrdersCount}
            </span>
          </div>
          <div className="w-11 h-11 rounded-xl bg-emerald-50 text-[#1D9E75] flex items-center justify-center shrink-0 border border-emerald-100">
            <ClipboardCheck className="w-5 h-5" />
          </div>
        </div>

      </div>

      {/* 3. SEARCH & FILTER BAR */}
      <div className="bg-white p-3 rounded-xl border border-[#D3D1C7] shadow-sm flex flex-col md:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by PA number, WA reference, route, or Work Order..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-8 py-2 border border-slate-200 rounded-lg text-xs font-sans text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-[#1D9E75] transition-colors"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 rounded cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto shrink-0">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap">
            APPROVAL STATUS
          </span>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="w-full md:w-auto py-2 px-3 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 bg-white focus:outline-none focus:border-[#1D9E75] cursor-pointer"
          >
            <option value="all">All Statuses</option>
            <option value="Approved">Approved</option>
            <option value="Pending">Pending Review</option>
          </select>
        </div>
      </div>

      {/* 4. RECENT PROFITABILITY ANALYSES TABLE */}
      <div className="bg-white p-5 rounded-xl border border-[#D3D1C7] shadow-sm">
        <div className="flex items-center justify-between gap-3 mb-3">
          <div>
            <h3 className="text-sm font-bold text-[#2C2C2A] tracking-tight">Recent Profitability Analyses</h3>
            <p className="text-xs text-[#5F5E5A]">Select any analysis record to inspect quote comparisons and dispatch approvals.</p>
          </div>
        </div>

        <div className="overflow-x-auto border border-[#D3D1C7]/60 rounded-lg">
          <table className="w-full text-left border-collapse text-xs font-sans">
            <thead>
              <tr className="bg-[#F1EFE8]/45 border-b border-[#D3D1C7]/80 text-[10px] font-semibold text-[#5F5E5A] uppercase tracking-wider">
                <th className="p-3">PA NUMBER</th>
                <th className="p-3">WORK ANALYSIS</th>
                <th className="p-3">WINNING SUPPLIER</th>
                <th className="p-3">WORK ORDER</th>
                <th className="p-3">STATUS</th>
                <th className="p-3 text-right">ACTION</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#D3D1C7]/40 text-[#2C2C2A]">
              {filteredPas.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-[#5F5E5A] italic">
                    No profitability analyses found matching your search.
                  </td>
                </tr>
              ) : (
                filteredPas.map(pa => {
                  const wa = workAnalyses.find(w => w.id === pa.workAnalysisId) ||
                    workAnalyses.find(w => w.mrRef === pa.mrRef);

                  return (
                    <tr 
                      key={pa.paNumber} 
                      className="hover:bg-[#F1EFE8]/20 transition-colors cursor-pointer"
                      onClick={() => handleOpenPa(pa)}
                    >
                      <td className="p-3 font-mono font-bold text-slate-800">
                        {pa.paNumber}
                      </td>
                      <td className="p-3 font-mono text-slate-600">
                        {wa ? wa.id : 'General'}
                      </td>
                      <td className="p-3 font-medium text-slate-700">
                        {pa.quoteComparison.find(row => row.supplierId === pa.selectedSupplierId)?.supplierName || '—'}
                      </td>
                      <td className="p-3 font-mono font-semibold text-slate-600">
                        {pa.workOrderNumber || '—'}
                      </td>
                      <td className="p-3 whitespace-nowrap">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                          pa.approvalStatus === 'Approved' 
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                            : 'bg-amber-50 text-amber-700 border-amber-200'
                        }`}>
                          ● {pa.approvalStatus}
                        </span>
                      </td>
                      <td className="p-3 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-2">
                          <button 
                            type="button"
                            onClick={() => handleOpenPa(pa)} 
                            className="px-2.5 py-1 text-xs font-semibold text-[#1D9E75] hover:bg-emerald-50 rounded transition-colors cursor-pointer"
                          >
                            Open
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
      </>
      ) : activePa ? (
      <>

      <div className="bg-white p-5 rounded-xl border border-[#D3D1C7] shadow-sm space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex flex-col gap-1">
            <label className="text-[11px] text-[#5F5E5A] font-bold uppercase tracking-tight">Work Analysis</label>
            <select
              id="pa-work-analysis"
              value={currentWa?.id || ''}
              onChange={e => handleSelectWorkAnalysis(e.target.value)}
              className="h-10 px-3 border border-[#D3D1C7] rounded-lg text-sm bg-white focus:outline-none focus:border-[#1D9E75]"
            >
              <option value="">Select a Work Analysis with quotations</option>
              {workAnalyses.filter(wa => quotations.some(q => q.workAnalysisId === wa.id)).map(wa => (
                <option key={wa.id} value={wa.id}>
                  {wa.id} — {getWorkAnalysisRoute(wa, mrs.find(m => m.mrNumber === wa.mrRef))}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[11px] text-[#5F5E5A] font-bold uppercase tracking-tight">Winning Supplier (from quotation)</label>
            <input
              value={selectedWinner ? `${selectedWinner.supplierName} — ${selectedWinner.quotedPrice.toLocaleString()} ETB` : 'Select a Work Analysis first'}
              readOnly
              className="h-10 px-3 border border-[#D3D1C7] rounded-lg text-sm bg-slate-50 text-slate-700"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border-t border-[#D3D1C7]/70 pt-4">
          {activePa.paNumber && (
            <div className="flex flex-col gap-1">
              <label className="text-[11px] text-[#5F5E5A] font-bold uppercase tracking-tight">PA Number</label>
              <input value={activePa.paNumber} disabled className="h-9 px-3 border border-[#D3D1C7] rounded-lg bg-slate-50 font-mono" />
            </div>
          )}
        </div>
      </div>

      {/* Winning supplier quote details */}
      {currentQuotes.length === 0 ? (
        /* NO QUOTATIONS WARNING AND REDIRECT */
        <div className="bg-white p-10 rounded-xl border border-amber-200 shadow-sm flex flex-col items-center justify-center text-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div className="max-w-md space-y-2">
            <h3 className="text-sm font-bold text-[#2C2C2A] uppercase tracking-wider">
              {currentWa ? 'No Competitive Bids Submitted' : 'Select a Work Analysis'}
            </h3>
            <p className="text-xs text-[#5F5E5A]">
              {currentWa
                ? 'Profitability review cannot proceed until supplier quotations are registered for this Work Analysis.'
                : 'Choose a Work Analysis with submitted supplier quotations above to load its bids and select the winning supplier.'}
            </p>
          </div>
          {currentWa && setScreen && (
            <button
              type="button"
              onClick={() => setScreen('supplier-quotation')}
              className="px-5 py-2.5 bg-[#1D9E75] hover:bg-[#1D9E75]/90 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
            >
              <span>Go to Supplier Quotations</span>
              <ExternalLink className="w-4 h-4" />
            </button>
          )}
        </div>
      ) : (
        /* FULL-WIDTH FORM CONTAINER WITH LATEST QUOTES */
        <div className="space-y-6 bg-white p-6 rounded-xl border border-[#D3D1C7] shadow-sm">
          
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-[#D3D1C7] pb-2">
              <h2 className="text-xs font-bold text-[#2C2C2A] uppercase tracking-wider">
                Winning Supplier Budget Analysis
              </h2>
              <div className="flex items-center gap-3">
                <span className="text-[10px] text-[#5F5E5A] italic flex items-center gap-1">
                  <Info className="w-3.5 h-3.5 text-[#1D9E75]" />
                  {regionalCompensationFactor !== undefined
                    ? `Price Book × ${regionalCompensationFactor} (${longestSiteRegion?.code}), based on longest-distance site ${longestDistanceSite?.siteName}.`
                    : 'No region factor found for the longest-distance site; using unadjusted Price Book.'}
                </span>
              </div>
            </div>

            <div className="overflow-x-auto border border-[#D3D1C7]/60 rounded-lg">
              <table className="w-full text-left border-collapse" id="quote-comparison-table">
                <thead>
                  <tr className="bg-[#F1EFE8]/45 border-b border-[#D3D1C7]/80 text-[10px] font-sans font-semibold text-[#5F5E5A] uppercase tracking-wider">
                    <th className="p-3">Supplier Name</th>
                    <th className="p-3">Vendor</th>
                    <th className="p-3">Price Book Item</th>
                    <th className="p-3 text-right">Quoted Price (ETB)</th>
                    <th className="p-3 text-right">Budget (ETB)</th>
                    <th className="p-3 text-right">Variance (ETB)</th>
                    <th className="p-3 text-right">Variance %</th>
                    <th className="p-3 text-center">Audit Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#D3D1C7]/40 text-xs font-sans text-[#2C2C2A]">
                  {displayedQuotes.map((row) => {
                    const isSelected = row.supplierId === activePa.selectedSupplierId;
                    
                    return (
                      <tr 
                        key={row.supplierId} 
                        className={`hover:bg-[#F1EFE8]/10 transition-all ${
                          isSelected ? 'bg-emerald-50/50 font-semibold' : ''
                        }`}
                      >
                        <td className="p-3 flex items-center gap-2">
                          <span className={isSelected ? "text-emerald-900 font-bold" : "text-slate-600"}>
                            {row.supplierName}
                          </span>
                          {isSelected && (
                            <span className="ml-1 bg-emerald-100 text-emerald-800 text-[9px] px-1.5 py-0.5 rounded font-bold">
                              Winner
                            </span>
                          )}
                        </td>
                        <td className="p-3">
                          <select
                            value={row.vendorId || ''}
                            onChange={(e) => handleVendorSelect(row.supplierId, e.target.value)}
                            className="h-8 px-2 rounded-lg border border-[#D3D1C7] text-[11px] font-sans text-[#2C2C2A] bg-white focus:outline-none focus:border-[#1D9E75] min-w-[140px]"
                          >
                            <option value="" disabled>-- Select Vendor --</option>
                            {suppliers.map(s => (
                              <option key={s.id} value={s.id}>{s.name}</option>
                            ))}
                          </select>
                        </td>
                        <td className="p-3">
                          <select
                            value={row.priceBookEntryId || ''}
                            onChange={(e) => handlePriceBookItemSelect(row.supplierId, e.target.value)}
                            disabled={!row.vendorId}
                            className="h-8 px-2 rounded-lg border border-[#D3D1C7] text-[11px] font-sans text-[#2C2C2A] bg-white focus:outline-none focus:border-[#1D9E75] min-w-[200px] disabled:bg-[#F1EFE8]/50 disabled:cursor-not-allowed"
                          >
                            <option value="" disabled>-- Select Price Book Item --</option>
                            {priceBook
                              .filter(p => p.vendorId === row.vendorId || (p as any).supplierId === row.vendorId)
                              .map(p => (
                                <option key={p.id} value={p.id}>
                                  {p.code} — {p.itemDescription} ({p.unitPrice.toLocaleString()} ETB/{p.unit})
                                </option>
                              ))}
                          </select>
                        </td>
                        <td className="p-3 text-right font-mono font-bold text-slate-800">
                          {row.quotedPrice.toLocaleString()} ETB
                        </td>
                        <td className="p-3 text-right font-mono text-slate-500">
                          {row.budget.toLocaleString()} ETB
                          {row.priceBookEntryId && (
                            <div className="text-[9px] text-[#1D9E75] font-sans font-semibold normal-case">
                              Price Book × {regionalCompensationFactor ?? '1.0'} regional factor
                            </div>
                          )}
                        </td>
                        <td className={`p-3 text-right font-mono font-bold ${row.variance >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                          {row.variance > 0 ? `+${row.variance.toLocaleString()}` : row.variance.toLocaleString()} ETB
                        </td>
                        <td className="p-3 text-right">
                          <span className={`px-2 py-0.5 rounded border text-[11px] font-mono font-bold ${getVarianceColor(row.variancePercent)}`}>
                            {row.variancePercent}%
                          </span>
                        </td>
                        <td className="p-3 text-center">
                          {row.variancePercent >= 0 ? (
                            <span className="text-emerald-600 font-bold text-[11px] flex items-center justify-center gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5" /> Direct Passage
                            </span>
                          ) : Math.abs(row.variancePercent) <= 10 ? (
                            <span className="text-amber-600 font-bold text-[11px] flex items-center justify-center gap-1">
                              <AlertTriangle className="w-3.5 h-3.5" /> TL Review (≤10%)
                            </span>
                          ) : Math.abs(row.variancePercent) <= 20 ? (
                            <span className="text-orange-600 font-bold text-[11px] flex items-center justify-center gap-1">
                              <AlertTriangle className="w-3.5 h-3.5" /> ST&PIM Review (10-20%)
                            </span>
                          ) : (
                            <span className="text-red-600 font-bold text-[11px] flex items-center justify-center gap-1">
                              <XCircle className="w-3.5 h-3.5" /> SCD Review (&gt;20%)
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

      <div className="bg-white p-5 rounded-xl border border-[#D3D1C7] shadow-sm">
        <div className="flex flex-col gap-1">
          <label className="text-[11px] text-[#5F5E5A] font-bold uppercase tracking-tight">Analysis Comment</label>
          <textarea
            value={activePa.comment}
            onChange={e => setActivePa({ ...activePa, comment: e.target.value })}
            rows={2}
            className="px-3 py-2 border border-[#D3D1C7] rounded-lg resize-y"
          />
        </div>
      </div>

      {/* Sticky footer with Winner Bid and Work Order action */}
      {currentQuotes.length > 0 && (
        <div className="fixed bottom-0 left-[240px] right-0 h-16 bg-white border-t border-[#D3D1C7] px-6 flex items-center justify-between shadow-md z-40">
          <span className="text-xs text-[#5F5E5A]">
            Winning Supplier: <span className="font-bold text-[#2C2C2A]">{selectedWinner ? selectedWinner.supplierName : 'None'}</span> | Quoted Price: <span className="text-emerald-700 font-mono font-bold">{selectedWinner ? selectedWinner.quotedPrice.toLocaleString() : 0} ETB</span>
            {requiresVarianceApproval && (
              <span className={`ml-3 font-semibold ${varianceApproved ? 'text-emerald-700' : 'text-amber-700'}`}>
                {varianceApproved
                  ? 'Variance approved'
                  : activePa?.approvalStatus === 'Pending' && activePa.paNumber
                    ? 'Variance approval pending'
                    : activePa?.approvalStatus === 'Rejected'
                      ? 'Variance rejected — resubmission required'
                      : 'Approval required before work order'}
              </span>
            )}
          </span>

          <div className="flex items-center gap-3">
            {requiresVarianceApproval && !varianceApproved && (!activePa?.paNumber || activePa.approvalStatus === 'Rejected') && (
              <button
                type="button"
                onClick={handleSubmitVarianceForApproval}
                className="px-4 py-2 border border-amber-300 bg-amber-50 text-amber-800 hover:bg-amber-100 rounded-lg text-xs font-sans font-semibold cursor-pointer transition-colors"
              >
                Submit for Approval
              </button>
            )}
            <button
              type="button"
              onClick={handleIssueWorkOrderAction}
              disabled={!canGenerateWorkOrder}
              className={`flex items-center gap-1.5 px-5 py-2 text-white rounded-lg text-xs font-sans font-semibold cursor-pointer transition-all shadow-sm ${
                !canGenerateWorkOrder
                  ? 'bg-slate-400 cursor-not-allowed'
                  : activePa.approvalStatus === 'Approved'
                  ? 'bg-[#1D9E75] hover:bg-[#1D9E75]/95' 
                  : 'bg-emerald-600 hover:bg-emerald-700'
              }`}
            >
              <FileCheck className="w-4 h-4" /> Generate Work Order
            </button>
          </div>
        </div>
      )}
      </>
      ) : null}
    </div>
  );
}

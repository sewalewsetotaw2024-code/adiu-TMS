import React, { useState, useEffect, useMemo } from 'react';
import { Supplier, PriceBookEntry, WorkAnalysis, SupplierQuotation, MR } from '../types';
import { 
  Plus, 
  Trash2, 
  Award, 
  FileText, 
  CheckCircle2, 
  ChevronRight, 
  Eye, 
  Edit2, 
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  Truck,
  MapPin,
  Building,
  Phone,
  Mail,
  DollarSign,
  ShieldCheck,
  Check,
  Route,
  Search,
  Layers,
  Users,
  X
} from 'lucide-react';
import { ExportDropdown } from './ExportDropdown';

interface SupplierQuotationScreenProps {
  suppliers: Supplier[];
  priceBook: PriceBookEntry[];
  workAnalyses: WorkAnalysis[];
  mrs: MR[];
  quotations: SupplierQuotation[];
  onAddQuotation: (q: SupplierQuotation) => void;
  onDeleteQuotation: (id: string) => void;
  setScreen: (screen: string) => void;
  setSelectedMrRef?: (mrRef: string | null) => void;
}

const formatSupplierCapital = (capital: string | undefined) => {
  const amount = Number(capital);
  return capital?.trim() && Number.isFinite(amount)
    ? `${amount.toLocaleString()} Birr`
    : 'Not provided';
};

export default function SupplierQuotationScreen({
  suppliers,
  priceBook,
  workAnalyses,
  mrs,
  quotations,
  onAddQuotation,
  onDeleteQuotation,
  setScreen,
  setSelectedMrRef
}: SupplierQuotationScreenProps) {
  const [viewMode, setViewMode] = useState<'list' | 'detail' | 'form'>('list');
  const [activeQuotationId, setActiveQuotationId] = useState<string | null>(null);
  
  // Default to collapsed as requested
  const [expandedWaIds, setExpandedWaIds] = useState<Set<string>>(new Set());

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [filterSupplierId, setFilterSupplierId] = useState('all');

  // Add/Edit Form State: ONLY 3 inputs (Work Analysis, Supplier, Transportation Cost)
  const [selectedWaId, setSelectedWaId] = useState<string>('');
  const [supplierId, setSupplierId] = useState<string>('');
  const [transportationCost, setTransportationCost] = useState<string>('');

  const activeWa = workAnalyses.find(w => w.id === selectedWaId);

  // Helper to extract or dynamically compute the route for a Work Analysis
  // Example: "Kality Warehouse → Bahir Dar → Gondar"
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

  // Check if selected supplier already has a quotation for the selected WA
  const existingQuoteForSupplier = (selectedWaId && supplierId) 
    ? quotations.find(q => q.workAnalysisId === selectedWaId && q.supplierId === supplierId)
    : null;

  // Sync transportation cost when supplier is selected in form
  useEffect(() => {
    if (supplierId && selectedWaId) {
      const existing = quotations.find(q => q.workAnalysisId === selectedWaId && q.supplierId === supplierId);
      if (existing) {
        setTransportationCost(existing.totalPrice.toString());
      } else {
        setTransportationCost('');
      }
    } else {
      setTransportationCost('');
    }
  }, [supplierId, selectedWaId]);

  // Form submission: Saves with ONLY the 3 inputs provided
  const handleSaveQuotationSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedWaId) {
      alert('Please select a Work Analysis.');
      return;
    }
    if (!supplierId) {
      alert('Please select a Supplier.');
      return;
    }

    const costNum = parseFloat(transportationCost.replace(/,/g, ''));
    if (isNaN(costNum) || costNum <= 0) {
      alert('Please enter a valid positive transportation cost.');
      return;
    }

    const matchedSupplier = suppliers.find(s => s.id === supplierId);
    if (!matchedSupplier) return;
    const currentWa = workAnalyses.find(w => w.id === selectedWaId);

    // Auto-match price book code / description if available for background PA alignment
    const truck = (currentWa?.truckTypeRecommended || '3-ton').toLowerCase();
    const pbEntry = priceBook.find(p => 
      (p.supplierId === supplierId || (p as any).vendorId === supplierId) && 
      p.status === 'Active' &&
      (p.code.toLowerCase().includes(truck.replace('-ton', 't')) || p.itemDescription.toLowerCase().includes(truck))
    );

    const defaultCode = pbEntry?.code || `TRN-${(currentWa?.truckTypeRecommended || 'TRUCK').toUpperCase().replace(/[^A-Z0-9]/g, '')}`;
    const defaultDesc = pbEntry?.itemDescription || `${currentWa?.truckTypeRecommended || 'Transport'} Truck Service`;

    // Remove previous quote for this supplier and WA if updating
    const existing = quotations.find(q => q.workAnalysisId === selectedWaId && q.supplierId === supplierId);
    if (existing) {
      onDeleteQuotation(existing.id);
    }

    onAddQuotation({
      id: existing ? existing.id : `q-gen-${Date.now()}`,
      supplierId,
      supplierName: matchedSupplier.name,
      priceBookCode: defaultCode,
      itemDescription: defaultDesc,
      quantity: 1,
      unitPrice: costNum,
      totalPrice: costNum,
      workAnalysisId: selectedWaId,
      mrRef: currentWa?.mrRef || ''
    });

    // Reset and return to list
    setSelectedWaId('');
    setSupplierId('');
    setTransportationCost('');
    setViewMode('list');
  };

  const handleQuickNavigateToPa = (mrRef: string) => {
    if (setSelectedMrRef) {
      setSelectedMrRef(mrRef);
    }
    setScreen('profitability');
  };

  const toggleWaExpanded = (waId: string) => {
    setExpandedWaIds(prev => {
      const next = new Set(prev);
      if (next.has(waId)) {
        next.delete(waId);
      } else {
        next.add(waId);
      }
      return next;
    });
  };

  // KPI Calculations across all active quotations
  const totalQuotationsCount = quotations.length;
  const participatingSuppliersCount = new Set(quotations.map(q => q.supplierId)).size;
  const coveredWaCount = workAnalyses.filter(wa => quotations.some(q => q.workAnalysisId === wa.id)).length;
  const totalBidValue = quotations.reduce((sum, q) => sum + (q.totalPrice || 0), 0);

  // Grouped and filtered quotations
  const groupedQuotations = useMemo(() => {
    return workAnalyses.map(wa => {
      const waQuotes = quotations.filter(q => q.workAnalysisId === wa.id);
      const mr = mrs.find(m => m.mrNumber === wa.mrRef);
      const waRoute = getWorkAnalysisRoute(wa, mr);

      const filteredQuotes = waQuotes.filter(q => {
        if (filterSupplierId !== 'all' && q.supplierId !== filterSupplierId) {
          return false;
        }
        if (searchQuery.trim() !== '') {
          const qText = searchQuery.toLowerCase();
          const matchSup = q.supplierName.toLowerCase().includes(qText);
          const matchWa = q.workAnalysisId.toLowerCase().includes(qText);
          const matchDesc = (q.itemDescription || '').toLowerCase().includes(qText);
          const matchTruck = (wa.truckTypeRecommended || '').toLowerCase().includes(qText);
          const matchClient = (mr?.vendorClient || '').toLowerCase().includes(qText);
          const matchRoute = waRoute.toLowerCase().includes(qText);
          return matchSup || matchWa || matchDesc || matchTruck || matchClient || matchRoute;
        }
        return true;
      });

      return {
        workAnalysis: wa,
        allQuotations: waQuotes,
        quotations: filteredQuotes,
        route: waRoute
      };
    }).filter(group => group.quotations.length > 0);
  }, [workAnalyses, quotations, mrs, filterSupplierId, searchQuery]);

  const handleExport = async (format: 'excel' | 'pdf' | 'word') => {
    const exportRows = groupedQuotations.flatMap(({
      workAnalysis,
      quotations: workQuotations,
      allQuotations,
      route
    }) => {
      const sortedQuotes = [...workQuotations].sort((a, b) => a.totalPrice - b.totalPrice);
      const lowestQuote = sortedQuotes[0];
      return sortedQuotes.map((quotation, index) => {
        const supplier = suppliers.find(item => item.id === quotation.supplierId);
        return {
          Work_Analysis_ID: workAnalysis.id,
          Route: route,
          Work_Analysis_Status: workAnalysis.status,
          Recommended_Truck: `${workAnalysis.truckTypeRecommended} truck`,
          Sites: workAnalysis.totalSites,
          Distance_km: workAnalysis.totalDistance,
          Quotation_Count: allQuotations.length,
          Rank: index === 0 ? '#1 Lowest' : `#${index + 1}`,
          Supplier: quotation.supplierName,
          Capital: formatSupplierCapital(supplier?.capitalCity),
          Phone: supplier?.phone || '—',
          Email: supplier?.email || '—',
          Truck_and_Route: `${workAnalysis.truckTypeRecommended} · ${route} · ${workAnalysis.totalSites} ${workAnalysis.totalSites === 1 ? 'site' : 'sites'} (${workAnalysis.totalDistance} km)`,
          Transportation_Cost_ETB: quotation.totalPrice,
          Recommended_Lowest: quotation.id === lowestQuote?.id ? 'Yes' : 'No'
        };
      });
    });
    if (exportRows.length === 0) return;

    const headers = [
      'Work Analysis ID',
      'Route',
      'Work Analysis Status',
      'Recommended Truck',
      'Sites',
      'Distance (km)',
      'Quotation Count',
      'Rank',
      'Supplier',
      'Capital',
      'Phone',
      'Email',
      'Truck & Route',
      'Transportation Cost (ETB)',
      'Recommended Lowest'
    ];
    const rows = exportRows.map(row => Object.values(row).map(String));

    if (format === 'excel') {
      const xlsx = await import('xlsx');
      const worksheet = xlsx.utils.json_to_sheet(exportRows);
      const workbook = xlsx.utils.book_new();
      xlsx.utils.book_append_sheet(workbook, worksheet, 'Supplier Quotations');
      xlsx.writeFile(workbook, 'Supplier_Quotations.xlsx');
    } else if (format === 'pdf') {
      const { jsPDF } = await import('jspdf');
      const autoTable = (await import('jspdf-autotable')).default;
      const doc = new jsPDF('landscape');
      doc.text('Supplier Quotation Report', 14, 15);
      autoTable(doc, {
        startY: 20,
        head: [headers],
        body: rows,
        styles: { fontSize: 6 },
        horizontalPageBreak: true,
        horizontalPageBreakRepeat: [0, 2]
      });
      doc.save('Supplier_Quotations.pdf');
    } else {
      const docx = await import('docx');
      const wordDocument = new docx.Document({
        sections: [{
          properties: {},
          children: [
            new docx.Paragraph({
              text: 'Supplier Quotation Report',
              heading: docx.HeadingLevel.HEADING_1
            }),
            new docx.Table({
              rows: [
                new docx.TableRow({
                  children: headers.map(header => new docx.TableCell({
                    children: [new docx.Paragraph(header)]
                  }))
                }),
                ...rows.map(row => new docx.TableRow({
                  children: row.map(value => new docx.TableCell({
                    children: [new docx.Paragraph(value)]
                  }))
                }))
              ]
            })
          ]
        }]
      });
      const blob = await docx.Packer.toBlob(wordDocument);
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'Supplier_Quotations.docx';
      link.click();
      window.setTimeout(() => URL.revokeObjectURL(url), 0);
    }
  };

  // =========================================================================
  // VIEW MODE 1: ADD / CREATE / EDIT FORM (ONLY 3 FIELDS)
  // =========================================================================
  if (viewMode === 'form') {
    return (
      <div className="space-y-6 select-none pb-20 max-w-2xl mx-auto">
        <div className="bg-white p-5 rounded-xl border border-[#D3D1C7] shadow-sm flex items-center justify-between">
          <h1 className="text-xl font-bold font-sans text-[#2C2C2A] flex items-center gap-2">
            <button 
              type="button"
              onClick={() => setViewMode('list')} 
              className="p-1 hover:bg-slate-100 rounded text-slate-500 transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-5 h-5"/>
            </button>
            <span>{existingQuoteForSupplier ? 'Edit Supplier Quotation' : 'Add Supplier Quotation'}</span>
          </h1>
          {activeWa && (
            <span className="text-xs bg-[#1D9E75]/10 text-[#1D9E75] font-semibold px-2.5 py-1 rounded-full font-mono">
              {activeWa.truckTypeRecommended} truck | {activeWa.totalSites} sites
            </span>
          )}
        </div>

        <div className="bg-white p-6 rounded-xl border border-[#D3D1C7] shadow-sm">
          <form onSubmit={handleSaveQuotationSubmit} className="space-y-5 text-sm font-sans">
            
            {/* Field 1: Select Work Analysis */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-[#5F5E5A] font-bold uppercase tracking-tight">
                Select Work Analysis
              </label>
              <select
                value={selectedWaId}
                onChange={(e) => {
                  setSelectedWaId(e.target.value);
                  setSupplierId('');
                  setTransportationCost('');
                }}
                className="h-11 px-3 border border-[#D3D1C7] rounded-lg bg-white font-medium text-slate-800 focus:outline-none focus:border-[#1D9E75] cursor-pointer"
                required
              >
                <option value="">-- Choose Work Analysis --</option>
                {workAnalyses.map(wa => {
                  const r = getWorkAnalysisRoute(wa, mrs.find(m => m.mrNumber === wa.mrRef));
                  return (
                    <option key={wa.id} value={wa.id}>
                      {wa.id} — {r} ({wa.truckTypeRecommended}, {wa.totalDistance} km)
                    </option>
                  );
                })}
              </select>

              {/* Route preview when WA is chosen */}
              {activeWa && (
                <div className="mt-1 p-2.5 bg-emerald-50/80 border border-emerald-200/80 rounded-lg flex items-center gap-2 text-xs text-slate-800">
                  <Route className="w-4 h-4 text-[#1D9E75] shrink-0" />
                  <div className="truncate">
                    <span className="text-[10px] uppercase font-bold text-emerald-800 block leading-tight">Assigned Transport Route</span>
                    <span className="font-bold text-slate-900">
                      {getWorkAnalysisRoute(activeWa, mrs.find(m => m.mrNumber === activeWa.mrRef))}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Field 2: Select Supplier */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-[#5F5E5A] font-bold uppercase tracking-tight">
                Select Supplier
              </label>
              <select
                value={supplierId}
                onChange={(e) => setSupplierId(e.target.value)}
                className="h-11 px-3 border border-[#D3D1C7] rounded-lg bg-white font-medium text-slate-800 focus:outline-none focus:border-[#1D9E75] cursor-pointer"
                required
              >
                <option value="">-- Choose Supplier Name --</option>
                {suppliers.map(sup => {
                  const hasQuote = selectedWaId && quotations.find(q => q.workAnalysisId === selectedWaId && q.supplierId === sup.id);
                  return (
                    <option key={sup.id} value={sup.id}>
                      {sup.name} {hasQuote ? `(Current Bid: ${hasQuote.totalPrice.toLocaleString()} ETB)` : ''}
                    </option>
                  );
                })}
              </select>
            </div>

            {/* Field 3: Input Transportation Cost */}
            <div className="flex flex-col gap-1.5 pt-2 border-t border-[#D3D1C7]/50">
              <label className="text-xs text-[#5F5E5A] font-bold uppercase tracking-tight flex items-center justify-between">
                <span>Transportation Cost (ETB)</span>
                {existingQuoteForSupplier && (
                  <span className="text-[11px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                    Editing existing quote: {existingQuoteForSupplier.totalPrice.toLocaleString()} ETB
                  </span>
                )}
              </label>
              
              <div className="relative">
                <input
                  id="transportation-cost-field"
                  type="number"
                  min={1}
                  step="any"
                  value={transportationCost}
                  onChange={(e) => setTransportationCost(e.target.value)}
                  placeholder="Enter transportation cost (e.g. 25000)"
                  className="w-full h-12 pl-4 pr-16 border-2 border-[#D3D1C7] focus:border-[#1D9E75] rounded-lg bg-white font-mono font-bold text-lg text-slate-800 focus:outline-none transition-all placeholder:text-slate-300"
                  autoFocus
                  required
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold font-mono text-slate-400">
                  ETB
                </span>
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex items-center gap-3 pt-4">
              <button
                type="button"
                onClick={() => setViewMode('list')}
                className="flex-1 py-3 bg-white border border-[#D3D1C7] hover:bg-slate-50 text-slate-700 font-semibold rounded-lg transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 py-3 bg-[#1D9E75] hover:bg-[#1D9E75]/90 text-white font-bold rounded-lg flex items-center justify-center gap-2 transition-all shadow-sm cursor-pointer"
              >
                <Plus className="w-5 h-5" />
                <span>{existingQuoteForSupplier ? 'Update Transportation Cost' : 'Save Transportation Cost'}</span>
              </button>
            </div>

          </form>
        </div>
      </div>
    );
  }

  // =========================================================================
  // VIEW MODE 2: DETAIL VIEW (WITH SPECIFIED FIELDS & LOWEST SUMMARY)
  // =========================================================================
  if (viewMode === 'detail' && activeQuotationId) {
    const q = quotations.find(qt => qt.id === activeQuotationId);
    if (!q) {
      setViewMode('list');
      return null;
    }
    
    const wa = workAnalyses.find(w => w.id === q.workAnalysisId);
    const sup = suppliers.find(s => s.id === q.supplierId);
    const mr = wa ? mrs.find(m => m.mrNumber === wa.mrRef) : undefined;
    const detailWaRoute = wa ? getWorkAnalysisRoute(wa, mr) : 'N/A';

    // Fetch competing quotations for this Work Analysis to find the lowest
    const relatedQuotations = quotations.filter(qt => qt.workAnalysisId === q.workAnalysisId);
    const sortedCompetingQuotes = [...relatedQuotations].sort((a, b) => a.totalPrice - b.totalPrice);
    const lowestQuote = sortedCompetingQuotes.length > 0 ? sortedCompetingQuotes[0] : q;
    const isLowest = lowestQuote.id === q.id;

    return (
      <div className="space-y-6 select-none pb-20 max-w-4xl mx-auto">
        
        {/* Top Header */}
        <div className="bg-white p-5 rounded-xl border border-[#D3D1C7] shadow-sm flex items-center justify-between">
          <h1 className="text-xl font-bold font-sans text-[#2C2C2A] flex items-center gap-2">
            <button 
              type="button"
              onClick={() => setViewMode('list')} 
              className="p-1 hover:bg-slate-100 rounded text-slate-500 transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-5 h-5"/>
            </button>
            <span>Quotation Details</span>
            <span className="text-xs font-mono font-medium text-slate-400 ml-1">({q.id})</span>
          </h1>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setSelectedWaId(q.workAnalysisId);
                setSupplierId(q.supplierId);
                setTransportationCost(q.totalPrice.toString());
                setViewMode('form');
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 text-slate-700 rounded text-sm font-semibold hover:bg-slate-200 transition-colors cursor-pointer"
            >
              <Edit2 className="w-4 h-4"/> Edit Cost
            </button>
            <button
              type="button"
              onClick={() => {
                onDeleteQuotation(q.id);
                setViewMode('list');
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 text-red-600 rounded text-sm font-semibold hover:bg-red-100 transition-colors cursor-pointer"
            >
              <Trash2 className="w-4 h-4"/> Delete
            </button>
          </div>
        </div>

        {/* 1. WORK ANALYSIS DETAILS (Route Banner, Total Sites, Total Distance, Recommended Truck Type) */}
        <div className="bg-white p-6 rounded-xl border border-[#D3D1C7] shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-[#D3D1C7]/60 pb-3">
            <h2 className="text-xs font-bold text-[#2C2C2A] uppercase tracking-wider flex items-center gap-2">
              <FileText className="w-4 h-4 text-[#1D9E75]" /> Work Analysis Details
            </h2>
            <span className="font-mono text-xs font-bold text-slate-600">{wa ? wa.id : q.workAnalysisId}</span>
          </div>

          {wa ? (
            <div className="space-y-4 pt-1">
              
              {/* Route Summary Banner from Work Analysis */}
              <div className="p-4 bg-emerald-50/80 rounded-xl border border-emerald-200/90 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <span className="text-[10px] text-emerald-800 font-bold uppercase tracking-wider flex items-center gap-1.5">
                    <Route className="w-4 h-4 text-[#1D9E75]" /> Transport Route from Work Analysis
                  </span>
                  <p className="font-black text-lg md:text-xl text-slate-900 flex items-center gap-2">
                    {detailWaRoute}
                  </p>
                  <span className="text-[11px] text-slate-500 block">
                    Departure from origin terminal through all destination site drop-offs
                  </span>
                </div>
                <div className="text-left sm:text-right shrink-0 bg-white/80 px-3 py-2 rounded-lg border border-emerald-100">
                  <span className="text-[10px] text-slate-500 uppercase font-bold block">Origin Warehouse</span>
                  <span className="text-xs font-bold text-slate-800 font-mono">
                    {wa.warehouseName || mr?.warehouseName || 'Kality Warehouse'}
                  </span>
                </div>
              </div>

              {/* 3 Metric Cards: Sites, Distance, Truck Type */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                
                {/* Total number of sites */}
                <div className="p-4 bg-[#F8F6F3] rounded-xl border border-[#D3D1C7]/60 space-y-1">
                  <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" /> Total Number of Sites
                  </span>
                  <p className="font-bold text-xl text-slate-900">{wa.totalSites} Sites</p>
                  <span className="text-[11px] text-slate-400">Delivery destinations</span>
                </div>

                {/* Total distance */}
                <div className="p-4 bg-[#F8F6F3] rounded-xl border border-[#D3D1C7]/60 space-y-1">
                  <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider flex items-center gap-1">
                    <Route className="w-3.5 h-3.5 text-slate-400" /> Total Distance
                  </span>
                  <p className="font-bold text-xl font-mono text-slate-900">{wa.totalDistance} km</p>
                  <span className="text-[11px] text-slate-400">Total route distance</span>
                </div>

                {/* Recommended Truck Type */}
                <div className="p-4 bg-[#F8F6F3] rounded-xl border border-[#D3D1C7]/60 space-y-1">
                  <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider flex items-center gap-1">
                    <Truck className="w-3.5 h-3.5 text-[#1D9E75]" /> Recommended Truck Type
                  </span>
                  <p className="font-bold text-xl text-emerald-800">{wa.truckTypeRecommended}</p>
                  <span className="text-[11px] text-slate-400">Required capacity</span>
                </div>

              </div>

            </div>
          ) : (
            <p className="text-xs text-slate-400 italic">Work Analysis data not found for reference: {q.workAnalysisId}</p>
          )}
        </div>

        {/* 2. CONTACTS DETAILS (Supplier Name, Capital, Physical Address, Phone, Email) */}
        <div className="bg-white p-6 rounded-xl border border-[#D3D1C7] shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-[#D3D1C7]/60 pb-3">
            <h2 className="text-xs font-bold text-[#2C2C2A] uppercase tracking-wider flex items-center gap-2">
              <Building className="w-4 h-4 text-[#1D9E75]" /> Supplier Information
            </h2>
            <span className="text-xs font-medium text-slate-500">{q.supplierName}</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1 text-sm font-sans">
            
            {/* Supplier Name */}
            <div className="p-3.5 bg-slate-50/70 rounded-lg border border-[#D3D1C7]/50 space-y-1">
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Supplier Name</span>
              <p className="font-bold text-base text-slate-800">{sup ? sup.name : q.supplierName}</p>
            </div>

            {/* Capital */}
            <div className="p-3.5 bg-slate-50/70 rounded-lg border border-[#D3D1C7]/50 space-y-1">
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Capital</span>
              <p className="font-semibold text-slate-800">{formatSupplierCapital(sup?.capitalCity)}</p>
            </div>

            {/* Physical Address */}
            <div className="p-3.5 bg-slate-50/70 rounded-lg border border-[#D3D1C7]/50 space-y-1 md:col-span-2">
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-slate-400" /> Physical Address
              </span>
              <p className="font-medium text-slate-800">{sup?.address || 'N/A'}</p>
            </div>

            {/* Phone */}
            <div className="p-3.5 bg-slate-50/70 rounded-lg border border-[#D3D1C7]/50 space-y-1">
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider flex items-center gap-1">
                <Phone className="w-3.5 h-3.5 text-slate-400" /> Phone Contact
              </span>
              <p className="font-mono font-medium text-slate-800">{sup?.phone || 'N/A'}</p>
            </div>

            {/* Email Contact */}
            <div className="p-3.5 bg-slate-50/70 rounded-lg border border-[#D3D1C7]/50 space-y-1">
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider flex items-center gap-1">
                <Mail className="w-3.5 h-3.5 text-slate-400" /> Email Contact
              </span>
              <p className="font-medium text-slate-800">{sup?.email || 'N/A'}</p>
            </div>

          </div>
        </div>

        {/* 3. TRANSPORTATION COST (Displayed at the last) */}
        <div className="bg-white p-6 rounded-xl border border-[#D3D1C7] shadow-sm space-y-3">
          <div className="flex items-center justify-between border-b border-[#D3D1C7]/60 pb-3">
            <h2 className="text-xs font-bold text-[#2C2C2A] uppercase tracking-wider flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-[#1D9E75]" /> Transportation Cost
            </h2>
            <span className="text-xs font-medium text-slate-400">Supplier Quote</span>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 bg-[#FBFBFA] rounded-xl border border-[#D3D1C7]/70">
            <div>
              <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider block">
                Total Quoted Transportation Cost
              </span>
            </div>
            <div className="text-right">
              <span className="font-mono font-black text-3xl text-emerald-800 block">
                {q.totalPrice.toLocaleString()} <span className="text-base font-normal text-slate-500">ETB</span>
              </span>
            </div>
          </div>
        </div>

        {/* 4. SUMMARY SECTION (Lowest from the list displayed) */}
        <div className="bg-gradient-to-br from-[#1D9E75]/5 to-emerald-50/50 p-6 rounded-xl border border-[#1D9E75]/30 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-start gap-3">
              <div className="bg-[#1D9E75] p-2.5 rounded-xl text-white shadow-xs">
                <Award className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-[#2C2C2A] uppercase tracking-wider">
                  Work Analysis Bidding Summary (Lowest in List)
                </h3>
                <p className="text-xs text-[#5F5E5A]">
                  Comparison across all competing supplier offers for {q.workAnalysisId}
                </p>
              </div>
            </div>

            {isLowest && (
              <button
                type="button"
                onClick={() => handleQuickNavigateToPa(q.mrRef)}
                className="px-4 py-2 bg-[#1D9E75] hover:bg-[#1D9E75]/90 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors shadow-sm cursor-pointer"
              >
                <span>Proceed to PA</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
            
            {/* Lowest Supplier Name */}
            <div className="bg-white p-4 rounded-xl border border-[#D3D1C7]/60 space-y-1">
              <span className="text-[10px] text-[#5F5E5A] font-bold uppercase tracking-wider">Lowest Quoted Supplier</span>
              <p className="text-base font-black text-emerald-800 truncate" title={lowestQuote.supplierName}>
                {lowestQuote.supplierName}
              </p>
              <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-1 mt-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Best Supplier Offer
              </span>
            </div>

            {/* Lowest Quoted Cost */}
            <div className="bg-white p-4 rounded-xl border border-[#D3D1C7]/60 space-y-1">
              <span className="text-[10px] text-[#5F5E5A] font-bold uppercase tracking-wider">Lowest Transportation Cost</span>
              <p className="text-lg font-mono font-black text-slate-800">
                {lowestQuote.totalPrice.toLocaleString()} ETB
              </p>
              <span className="text-[10px] text-slate-400 font-medium block mt-1">
                Benchmark winning rate
              </span>
            </div>

            {/* Evaluation of Current Quote vs Lowest */}
            <div className="bg-white p-4 rounded-xl border border-[#D3D1C7]/60 space-y-1">
              <span className="text-[10px] text-[#5F5E5A] font-bold uppercase tracking-wider">Current Bid Status</span>
              {isLowest ? (
                <div className="mt-1">
                  <span className="px-2 py-1 rounded bg-emerald-100 text-emerald-800 font-bold text-xs inline-block">
                    ✓ Recommended Winner
                  </span>
                  <p className="text-[10px] text-emerald-600 mt-1">Ready for Profitability Analysis</p>
                </div>
              ) : (
                <div className="mt-1">
                  <span className="px-2 py-1 rounded bg-slate-100 text-slate-800 font-bold text-xs inline-block">
                    Competing Offer
                  </span>
                  <p className="text-[10px] text-slate-500 mt-1">
                    +{(q.totalPrice - lowestQuote.totalPrice).toLocaleString()} ETB above {lowestQuote.supplierName.split(' ')[0]}
                  </p>
                </div>
              )}
            </div>

          </div>

          {/* List of all competing bids for this WA */}
          {sortedCompetingQuotes.length > 1 && (
            <div className="pt-3 border-t border-[#1D9E75]/20 space-y-2">
              <span className="text-[11px] text-slate-600 font-bold uppercase">All Competing Bids for {q.workAnalysisId}:</span>
              <div className="space-y-1.5">
                {sortedCompetingQuotes.map((comp, idx) => (
                  <div key={comp.id} className="flex items-center justify-between text-xs bg-white/70 px-3 py-2 rounded-lg border border-[#D3D1C7]/40">
                    <div className="flex items-center gap-2">
                      <span className="w-4 h-4 rounded-full bg-slate-200 text-[#2C2C2A] text-[9px] font-bold flex items-center justify-center">
                        {idx + 1}
                      </span>
                      <span className="font-medium text-slate-800">{comp.supplierName}</span>
                      {comp.id === q.id && (
                        <span className="text-[9px] bg-slate-200 text-slate-700 px-1.5 py-0.2 rounded font-semibold">
                          This Quote
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 font-mono">
                      <span className="font-bold">{comp.totalPrice.toLocaleString()} ETB</span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        idx === 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-700'
                      }`}>
                        {idx === 0 ? 'Lowest' : `#${idx + 1}`}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>

      </div>
    );
  }

  // =========================================================================
  // VIEW MODE 3: DEFAULT LIST VIEW
  // =========================================================================
  return (
    <div className="space-y-6 select-none pb-20">
      
      {/* 1. TOP GREEN HERO BANNER */}
      <div className="relative overflow-hidden bg-gradient-to-r from-[#006847] via-[#047857] to-[#10b981] text-white p-6 md:p-8 rounded-2xl shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-5">
        <div className="space-y-1.5 relative z-10 max-w-2xl">
          <h1 className="text-2xl md:text-3xl font-extrabold font-sans tracking-tight text-white">
            Supplier Quotations
          </h1>
          <p className="text-xs md:text-sm text-emerald-100/90 font-medium leading-relaxed">
            Commercial bids, supplier rate comparisons, and transport requisition sourcing
          </p>
        </div>

        <div className="relative z-10 shrink-0 flex items-center gap-3">
          <ExportDropdown onExport={handleExport} />
          <button
            type="button"
            onClick={() => {
              setSelectedWaId(workAnalyses[0]?.id || '');
              setSupplierId('');
              setTransportationCost('');
              setViewMode('form');
            }}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-white text-emerald-800 hover:bg-emerald-50 rounded-xl text-xs md:text-sm font-bold shadow-md transition-all transform active:scale-95 cursor-pointer"
          >
            <Plus className="w-4 h-4 text-emerald-800" />
            <span>Add Quotation</span>
          </button>
        </div>

        {/* Decorative background visual flourishes */}
        <div className="absolute -right-8 -bottom-10 w-52 h-52 rounded-full bg-white/10 pointer-events-none" />
        <div className="absolute right-36 -top-12 w-32 h-32 rounded-full bg-emerald-400/20 pointer-events-none blur-sm" />
      </div>

      {/* 2. FOUR KPI SUMMARY CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Metric 1: Total Quotations */}
        <div className="bg-white p-4 rounded-xl border border-[#D3D1C7] shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-[#5F5E5A] uppercase tracking-wider block">
              TOTAL QUOTATIONS
            </span>
            <span className="text-2xl font-black text-slate-800 font-sans">
              {totalQuotationsCount}
            </span>
          </div>
          <div className="w-11 h-11 rounded-xl bg-emerald-50 text-[#1D9E75] flex items-center justify-center shrink-0 border border-emerald-100">
            <Layers className="w-5 h-5" />
          </div>
        </div>

        {/* Metric 2: Participating Suppliers */}
        <div className="bg-white p-4 rounded-xl border border-[#D3D1C7] shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-[#5F5E5A] uppercase tracking-wider block">
              PARTICIPATING SUPPLIERS
            </span>
            <span className="text-2xl font-black text-slate-800 font-sans">
              {participatingSuppliersCount}
            </span>
          </div>
          <div className="w-11 h-11 rounded-xl bg-emerald-50 text-[#1D9E75] flex items-center justify-center shrink-0 border border-emerald-100">
            <Users className="w-5 h-5" />
          </div>
        </div>

        {/* Metric 3: Work Analyses Covered */}
        <div className="bg-white p-4 rounded-xl border border-[#D3D1C7] shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-[#5F5E5A] uppercase tracking-wider block">
              WORK ANALYSES COVERED
            </span>
            <span className="text-2xl font-black text-slate-800 font-sans">
              {coveredWaCount} / {workAnalyses.length}
            </span>
          </div>
          <div className="w-11 h-11 rounded-xl bg-emerald-50 text-[#1D9E75] flex items-center justify-center shrink-0 border border-emerald-100">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        {/* Metric 4: Total Bid Value */}
        <div className="bg-white p-4 rounded-xl border border-[#D3D1C7] shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-[#5F5E5A] uppercase tracking-wider block">
              TOTAL BID VALUE
            </span>
            <span className="text-2xl font-black text-slate-800 font-mono">
              {totalBidValue.toLocaleString()} <span className="text-xs font-bold text-slate-500 font-sans">ETB</span>
            </span>
          </div>
          <div className="w-11 h-11 rounded-xl bg-emerald-50 text-[#1D9E75] flex items-center justify-center shrink-0 border border-emerald-100">
            <DollarSign className="w-5 h-5" />
          </div>
        </div>

      </div>

      {/* 3. SEARCH & FILTER BAR */}
      <div className="bg-white p-3 rounded-xl border border-[#D3D1C7] shadow-sm flex flex-col md:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by supplier, WA reference, route, item description..."
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
            SUPPLIER
          </span>
          <select
            value={filterSupplierId}
            onChange={(e) => setFilterSupplierId(e.target.value)}
            className="w-full md:w-auto py-2 px-3 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 bg-white focus:outline-none focus:border-[#1D9E75] cursor-pointer"
          >
            <option value="all">All Transporters / Suppliers</option>
            {suppliers.map(s => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* 4. WORK ANALYSIS CARDS (DEFAULT COLLAPSED, CLICKABLE VIEW DETAIL & EXPAND) */}
      <div className="space-y-5">
        {groupedQuotations.length === 0 ? (
          <div className="bg-white p-12 rounded-xl border border-dashed border-[#D3D1C7] text-center space-y-3">
            <p className="text-sm font-semibold text-slate-600">No quotation records found matching your filters.</p>
            <button
              type="button"
              onClick={() => { setSearchQuery(''); setFilterSupplierId('all'); }}
              className="text-xs text-[#1D9E75] font-bold hover:underline"
            >
              Reset all filters
            </button>
          </div>
        ) : (
          groupedQuotations.map(({ workAnalysis, quotations: workQuotations, allQuotations, route: waRoute }) => {
            const mr = mrs.find(m => m.mrNumber === workAnalysis.mrRef);
            
            // Sort quotes by total transportation cost ascending to find recommended lowest
            const sortedQuotes = [...workQuotations].sort((a, b) => a.totalPrice - b.totalPrice);
            const lowestQuote = sortedQuotes.length > 0 ? sortedQuotes[0] : null;
            const isExpanded = expandedWaIds.has(workAnalysis.id);

            return (
              <div key={workAnalysis.id} className="bg-white rounded-xl border border-[#D3D1C7] shadow-sm overflow-hidden">
                
                {/* Card Header Banner with Rich Work Analysis Summary & Quick Actions */}
                <div className="p-4 sm:p-5 bg-[#FBFBFA] border-b border-[#D3D1C7]/70">
                  <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-3">
                    
                    {/* Left: Work Analysis Reference, Route & Operational Details */}
                    <div className="space-y-1.5 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            if (lowestQuote) {
                              setActiveQuotationId(lowestQuote.id);
                              setViewMode('detail');
                            } else if (allQuotations[0]) {
                              setActiveQuotationId(allQuotations[0].id);
                              setViewMode('detail');
                            }
                          }}
                          className="font-mono font-bold text-slate-800 text-xs px-2.5 py-1 bg-slate-200/80 hover:bg-slate-300 rounded cursor-pointer transition-colors shrink-0"
                          title="Click to view detail"
                        >
                          {workAnalysis.id}
                        </button>

                        {/* Prominent Route Badge */}
                        <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-900 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200 shadow-2xs shrink-0">
                          <Route className="w-3.5 h-3.5 text-[#1D9E75] shrink-0" />
                          <span>{waRoute}</span>
                        </div>

                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded shrink-0 ${
                          workAnalysis.status === 'Validated' 
                            ? 'bg-emerald-100 text-emerald-800' 
                            : 'bg-amber-100 text-amber-800'
                        }`}>
                          ● {workAnalysis.status}
                        </span>
                      </div>

                      {/* Operational Details from Work Analysis */}
                      <div className="flex flex-wrap items-center gap-2.5 text-xs text-slate-600">
                        <span className="flex items-center gap-1 font-semibold text-slate-800">
                          <Truck className="w-3.5 h-3.5 text-slate-400" />
                          {workAnalysis.truckTypeRecommended} truck
                        </span>
                        <span className="text-slate-300">•</span>
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-slate-400" />
                          {workAnalysis.totalSites} {workAnalysis.totalSites === 1 ? 'Site' : 'Sites'} ({workAnalysis.totalDistance || 0} km)
                        </span>
                        <span className="text-slate-300">•</span>
                        <span className="text-slate-500 font-medium font-mono">
                          {allQuotations.length} {allQuotations.length === 1 ? 'Quotation' : 'Quotations'}
                        </span>
                      </div>
                    </div>

                    {/* Right: Lowest Bid Badge, View Detail & Expand/Collapse Controls in Single Row */}
                    <div className="flex items-center gap-2 shrink-0 whitespace-nowrap overflow-x-auto py-0.5">
                      {lowestQuote && (
                        <div 
                          onClick={() => {
                            setActiveQuotationId(lowestQuote.id);
                            setViewMode('detail');
                          }}
                          className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-lg cursor-pointer hover:bg-emerald-100/70 transition-colors shadow-xs shrink-0"
                          title="Click to view lowest quotation details"
                        >
                          <Award className="w-4 h-4 text-emerald-600 shrink-0" />
                          <div className="text-left">
                            <span className="text-[10px] uppercase font-bold text-emerald-800 block leading-tight">
                              LOWEST: {lowestQuote.supplierName}
                            </span>
                            <span className="font-mono font-bold text-xs text-emerald-900">
                              {lowestQuote.totalPrice.toLocaleString()} ETB
                            </span>
                          </div>
                        </div>
                      )}

                      {/* Quick Proceed to PA */}
                      {lowestQuote && (
                        <button
                          type="button"
                          onClick={() => handleQuickNavigateToPa(workAnalysis.mrRef)}
                          className="px-2.5 py-1.5 bg-[#1D9E75] hover:bg-[#1D9E75]/90 text-white rounded-lg text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer shadow-xs shrink-0"
                          title="Proceed to Profitability Analysis"
                        >
                          <span>PA</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      )}

                      {/* Add bid for this specific WA */}
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedWaId(workAnalysis.id);
                          setSupplierId('');
                          setTransportationCost('');
                          setViewMode('form');
                        }}
                        className="px-2.5 py-1.5 bg-white border border-[#D3D1C7] hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer shrink-0"
                        title="Add a new bid for this Work Analysis"
                      >
                        <Plus className="w-3.5 h-3.5 text-[#1D9E75]" />
                        <span>Add Bid</span>
                      </button>

                      {/* Explicit Clickable View Detail button */}
                      <button
                        type="button"
                        onClick={() => {
                          if (lowestQuote) {
                            setActiveQuotationId(lowestQuote.id);
                            setViewMode('detail');
                          } else if (allQuotations[0]) {
                            setActiveQuotationId(allQuotations[0].id);
                            setViewMode('detail');
                          }
                        }}
                        className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer border border-slate-200/80 shrink-0"
                        title="View full quotation and supplier details"
                      >
                        <Eye className="w-3.5 h-3.5 text-slate-600" />
                        <span>View Detail</span>
                      </button>

                      {/* Expand / Collapse toggle button */}
                      <button
                        type="button"
                        onClick={() => toggleWaExpanded(workAnalysis.id)}
                        className="px-2.5 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-lg text-xs font-medium flex items-center gap-1 transition-colors cursor-pointer shrink-0"
                        title={isExpanded ? 'Collapse bid table' : 'Expand bid table'}
                      >
                        <span>{isExpanded ? 'Collapse' : 'Expand'}</span>
                        {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                      </button>
                    </div>

                  </div>
                </div>

                {/* Cleaned & Enhanced Quotations Table (Shown when Expanded) */}
                {isExpanded && (
                  <div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse text-xs font-sans">
                        <thead>
                          <tr className="bg-[#F1EFE8]/40 border-b border-[#D3D1C7]/80 text-[10px] font-semibold text-[#5F5E5A] uppercase tracking-wider">
                            <th className="py-3 px-4 w-24">RANK</th>
                            <th className="py-3 px-4">SUPPLIER</th>
                            <th className="py-3 px-4">TRUCK & ROUTE</th>
                            <th className="py-3 px-4 text-right">TRANSPORTATION COST</th>
                            <th className="py-3 px-4 text-right">ACTIONS</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#D3D1C7]/40 text-[#2C2C2A]">
                          {sortedQuotes.map((q, idx) => {
                            const isWinner = idx === 0;
                            const sup = suppliers.find(s => s.id === q.supplierId);

                            return (
                              <tr
                                key={q.id}
                                className={`hover:bg-[#F1EFE8]/15 transition-colors cursor-pointer ${
                                  isWinner ? 'bg-emerald-50/30' : ''
                                }`}
                                onClick={() => { setActiveQuotationId(q.id); setViewMode('detail'); }}
                              >
                                
                                {/* 1. Rank (NO PERCENTAGE) */}
                                <td className="py-3.5 px-4 whitespace-nowrap">
                                  {isWinner ? (
                                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                                      <Check className="w-3 h-3" /> #1 Lowest
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-700">
                                      #{idx + 1}
                                    </span>
                                  )}
                                </td>

                                {/* 2. Supplier Details */}
                                <td className="py-3.5 px-4">
                                  <div className="space-y-0.5">
                                    <span className="font-bold text-slate-800 text-xs block">
                                      {q.supplierName}
                                    </span>
                                    {sup && (
                                      <div className="flex flex-wrap items-center gap-2 text-[10px] text-slate-500">
                                        <span>Capital: {formatSupplierCapital(sup.capitalCity)}</span>
                                        {sup.phone && (
                                          <>
                                            <span>•</span>
                                            <span>{sup.phone}</span>
                                          </>
                                        )}
                                        {sup.email && (
                                          <>
                                            <span>•</span>
                                            <span className="text-slate-400 hover:text-slate-600">{sup.email}</span>
                                          </>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                </td>

                                {/* 3. Truck & Route */}
                                <td className="py-3.5 px-4">
                                  <div className="space-y-1 max-w-sm">
                                    <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800" title={waRoute}>
                                      <Route className="w-3.5 h-3.5 text-[#1D9E75] shrink-0" />
                                      <span className="truncate">{waRoute}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-[10px] text-slate-500">
                                      <span className="font-semibold text-emerald-800 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200/60 font-sans">
                                        {workAnalysis.truckTypeRecommended}
                                      </span>
                                      <span>•</span>
                                      <span>{workAnalysis.totalSites} {workAnalysis.totalSites === 1 ? 'site' : 'sites'} ({workAnalysis.totalDistance} km)</span>
                                    </div>
                                  </div>
                                </td>

                                {/* 4. Transportation Cost */}
                                <td className="py-3.5 px-4 text-right whitespace-nowrap">
                                  <div className="space-y-0.5">
                                    <span className={`font-mono font-bold text-sm ${isWinner ? 'text-emerald-800 font-black' : 'text-slate-900'}`}>
                                      {q.totalPrice.toLocaleString()} <span className="text-[10px] font-normal text-slate-500">ETB</span>
                                    </span>
                                    {isWinner && (
                                      <span className="text-[9px] block text-emerald-600 font-semibold">Recommended Lowest</span>
                                    )}
                                  </div>
                                </td>

                                {/* 5. Action Buttons */}
                                <td className="py-3.5 px-4 text-right whitespace-nowrap">
                                  <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setSelectedWaId(q.workAnalysisId);
                                        setSupplierId(q.supplierId);
                                        setTransportationCost(q.totalPrice.toString());
                                        setViewMode('form');
                                      }}
                                      className="p-1.5 text-slate-400 hover:text-[#1D9E75] hover:bg-slate-100 rounded transition-colors cursor-pointer"
                                      title="Edit Transportation Cost"
                                    >
                                      <Edit2 className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => { setActiveQuotationId(q.id); setViewMode('detail'); }}
                                      className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded transition-colors cursor-pointer"
                                      title="View Full Details"
                                    >
                                      <Eye className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => onDeleteQuotation(q.id)}
                                      className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors cursor-pointer"
                                      title="Delete Quotation"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                </td>

                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>

                    {/* Compliance Footer Note for this WA */}
                    <div className="p-3 bg-slate-50 border-t border-[#D3D1C7]/60 flex flex-col sm:flex-row sm:items-center justify-between text-[11px] text-slate-500 gap-2">
                      <span className="flex items-center gap-1.5">
                        <ShieldCheck className="w-3.5 h-3.5 text-[#1D9E75]" />
                        <span>
                          <strong>Adiu Dispatch Rule:</strong> 3 competing supplier quotations required before Profitability Analysis sign-off.
                        </span>
                      </span>
                      {workQuotations.length >= 3 ? (
                        <span className="text-emerald-700 font-bold flex items-center gap-1">
                          <Check className="w-3.5 h-3.5" /> Bidding Threshold Met ({workQuotations.length} Bids)
                        </span>
                      ) : (
                        <span className="text-amber-700 font-semibold">
                          {3 - workQuotations.length} more bid needed for competition compliance
                        </span>
                      )}
                    </div>
                  </div>
                )}

              </div>
            );
          })
        )}
      </div>

    </div>
  );
}

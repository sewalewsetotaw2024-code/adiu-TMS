import React, { useState, useEffect } from 'react';
import { Supplier, PriceBookEntry, WorkAnalysis, SupplierQuotation, MR } from '../types';
import { Plus, Trash2, Award, FileText, CheckCircle2, ChevronRight, AlertCircle, Eye, Edit2, ArrowLeft } from 'lucide-react';

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
  const [expandedWaIds, setExpandedWaIds] = useState<Set<string>>(new Set());

  // Form State
  const [selectedWaId, setSelectedWaId] = useState<string>('');
  const [supplierId, setSupplierId] = useState<string>('');
  const [selectedPbEntryId, setSelectedPbEntryId] = useState<string>('');
  const [customCode, setCustomCode] = useState<string>('');
  const [customItem, setCustomItem] = useState<string>('');
  const [quantity, setQuantity] = useState<number>(1);
  const [unitPrice, setUnitPrice] = useState<number>(0);
  const [isCustomItem, setIsCustomItem] = useState<boolean>(false);

  useEffect(() => {
    if (selectedPbEntryId) {
      const entry = priceBook.find(p => p.id === selectedPbEntryId);
      if (entry) {
        setCustomCode(entry.code);
        setCustomItem(entry.itemDescription);
        setUnitPrice(entry.unitPrice);
        setIsCustomItem(false);
      }
    } else {
      setCustomCode('');
      setCustomItem('');
      setUnitPrice(0);
    }
  }, [selectedPbEntryId, priceBook]);

  const handleAddQuotationSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedWaId) {
      alert('Please select a Work Analysis.');
      return;
    }
    if (!supplierId) {
      alert('Please select a Supplier.');
      return;
    }

    const matchedSupplier = suppliers.find(s => s.id === supplierId);
    if (!matchedSupplier) return;
    const activeWa = workAnalyses.find(w => w.id === selectedWaId);

    const code = isCustomItem ? customCode : (priceBook.find(p => p.id === selectedPbEntryId)?.code || 'CUSTOM');
    const item = isCustomItem ? customItem : (priceBook.find(p => p.id === selectedPbEntryId)?.itemDescription || 'Custom Service Item');

    if (!code || !item || unitPrice <= 0 || quantity <= 0) {
      alert('Please enter valid item information, unit price, and quantity.');
      return;
    }

    onAddQuotation({
      id: `q-gen-${Date.now()}`,
      supplierId,
      supplierName: matchedSupplier.name,
      priceBookCode: code,
      itemDescription: item,
      quantity,
      unitPrice,
      totalPrice: quantity * unitPrice,
      workAnalysisId: selectedWaId,
      mrRef: activeWa?.mrRef || ''
    });

    // Reset and return to list
    setSelectedWaId('');
    setSelectedPbEntryId('');
    setSupplierId('');
    setCustomCode('');
    setCustomItem('');
    setQuantity(1);
    setUnitPrice(0);
    setIsCustomItem(false);
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

  const groupedQuotations = workAnalyses.map(wa => ({
    workAnalysis: wa,
    quotations: quotations.filter(q => q.workAnalysisId === wa.id)
  })).filter(group => group.quotations.length > 0);

  const unassignedQuotationGroups = quotations
    .filter(q => !workAnalyses.some(wa => wa.id === q.workAnalysisId))
    .map(q => ({
      workAnalysis: {
        id: q.workAnalysisId,
        mrRef: q.mrRef,
        date: '',
        preparedBy: '',
        sites: [],
        truckTypeRecommended: '3-ton' as const,
        totalSites: 0,
        totalDistance: 0,
        estimatedTrips: 0,
        specialRequirements: [],
        keyRisks: '',
        scopeNegotiationNotes: '',
        validatedBy: '',
        validationDate: '',
        status: 'Pending' as const
      },
      quotations: [q]
    }));

  if (viewMode === 'form') {
    return (
      <div className="space-y-6 select-none pb-20 max-w-3xl mx-auto">
        <div className="bg-white p-5 rounded-xl border border-[#D3D1C7] shadow-sm flex items-center justify-between">
          <h1 className="text-xl font-bold font-sans text-[#2C2C2A] flex items-center gap-2">
            <button onClick={() => setViewMode('list')} className="p-1 hover:bg-slate-100 rounded text-slate-500 transition-colors"><ArrowLeft className="w-5 h-5"/></button>
            Add Supplier Quotation
          </h1>
        </div>

        <div className="bg-white p-6 rounded-xl border border-[#D3D1C7] shadow-sm">
          <form onSubmit={handleAddQuotationSubmit} className="space-y-6 text-sm font-sans">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-[#5F5E5A] font-bold uppercase tracking-tight">Select Work Analysis</label>
              <select
                value={selectedWaId}
                onChange={(e) => setSelectedWaId(e.target.value)}
                className="h-10 px-3 border border-[#D3D1C7] rounded-lg bg-white font-medium text-slate-700 focus:outline-none focus:border-[#1D9E75]"
                required
              >
                <option value="">-- Choose Work Analysis --</option>
                {workAnalyses.map(wa => (
                  <option key={wa.id} value={wa.id}>{wa.id} (MR: {wa.mrRef}) - {wa.truckTypeRecommended}</option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-[#5F5E5A] font-bold uppercase tracking-tight">Select Supplier</label>
              <select
                value={supplierId}
                onChange={(e) => {
                  setSupplierId(e.target.value);
                  setSelectedPbEntryId('');
                }}
                className="h-10 px-3 border border-[#D3D1C7] rounded-lg bg-white font-medium text-slate-700 focus:outline-none focus:border-[#1D9E75]"
                required
              >
                <option value="">-- Choose Supplier --</option>
                {suppliers.map(sup => (
                  <option key={sup.id} value={sup.id}>{sup.name}</option>
                ))}
              </select>
            </div>

            {supplierId && (
              <>
                <div className="flex items-center gap-6 bg-slate-50 p-3 rounded-lg border border-[#D3D1C7]/30">
                  <span className="text-xs text-slate-500 font-semibold uppercase">Item Type:</span>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" checked={!isCustomItem} onChange={() => setIsCustomItem(false)} className="text-[#1D9E75] w-4 h-4 focus:ring-[#1D9E75]" />
                    <span>Contract Price Book</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" checked={isCustomItem} onChange={() => setIsCustomItem(true)} className="text-[#1D9E75] w-4 h-4 focus:ring-[#1D9E75]" />
                    <span>Custom Rate</span>
                  </label>
                </div>

                {!isCustomItem ? (
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs text-[#5F5E5A] font-bold uppercase tracking-tight">Contract Item</label>
                    <select
                      value={selectedPbEntryId}
                      onChange={(e) => setSelectedPbEntryId(e.target.value)}
                      className="h-10 px-3 border border-[#D3D1C7] rounded-lg bg-white text-slate-700 focus:outline-none focus:border-[#1D9E75]"
                      required
                    >
                      <option value="">-- Select Price Book Item --</option>
                      {priceBook
                        .filter(p => p.vendorId === supplierId)
                        .map(entry => (
                          <option key={entry.id} value={entry.id}>
                            {entry.code} - {entry.itemDescription} ({entry.unitPrice.toLocaleString()} ETB / {entry.unit})
                          </option>
                        ))}
                    </select>
                    <span className="text-xs text-slate-400 italic">Filtered by selected carrier's agreed Contract Price Book</span>
                  </div>
                ) : (
                  <div className="space-y-4 p-4 bg-orange-50/40 rounded-lg border border-orange-200">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs text-[#5F5E5A] font-semibold uppercase tracking-tight">Custom Item Code</label>
                      <input
                        type="text"
                        value={customCode}
                        onChange={(e) => setCustomCode(e.target.value)}
                        placeholder="e.g. CUSTOM-01"
                        className="h-10 px-3 border border-[#D3D1C7] rounded-lg bg-white"
                        required
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs text-[#5F5E5A] font-semibold uppercase tracking-tight">Custom Item Name / Route</label>
                      <input
                        type="text"
                        value={customItem}
                        onChange={(e) => setCustomItem(e.target.value)}
                        placeholder="e.g. 3-Ton Truck Flat Rate Custom Service"
                        className="h-10 px-3 border border-[#D3D1C7] rounded-lg bg-white"
                        required
                      />
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs text-[#5F5E5A] font-bold uppercase tracking-tight">Quantity</label>
                    <input
                      type="number"
                      min={1}
                      value={quantity}
                      onChange={(e) => setQuantity(Math.max(1, Number(e.target.value)))}
                      className="h-10 px-3 border border-[#D3D1C7] rounded-lg bg-white font-mono text-center"
                      required
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs text-[#5F5E5A] font-bold uppercase tracking-tight">Unit Price (ETB)</label>
                    <input
                      type="number"
                      min={0}
                      value={unitPrice}
                      onChange={(e) => setUnitPrice(Number(e.target.value))}
                      className="h-10 px-3 border border-[#D3D1C7] rounded-lg bg-white font-mono text-right"
                      disabled={!isCustomItem && !!selectedPbEntryId}
                      required
                    />
                  </div>
                </div>

                <div className="p-4 bg-slate-50 rounded-lg border border-[#D3D1C7]/40 flex justify-between items-center font-mono">
                  <span className="text-xs text-slate-500 font-bold uppercase">Item Total Preview:</span>
                  <strong className="text-[#2C2C2A] text-lg">{(quantity * unitPrice).toLocaleString()} ETB</strong>
                </div>

                <button
                  type="submit"
                  className="w-full py-3 bg-[#1D9E75] hover:bg-[#1D9E75]/90 text-white font-bold rounded-lg flex items-center justify-center gap-2 transition-all shadow-sm cursor-pointer"
                >
                  <Plus className="w-5 h-5" /> Submit Bid Item
                </button>
              </>
            )}
          </form>
        </div>
      </div>
    );
  }

  if (viewMode === 'detail' && activeQuotationId) {
    const q = quotations.find(qt => qt.id === activeQuotationId);
    if (!q) {
      setViewMode('list');
      return null;
    }
    
    const wa = workAnalyses.find(w => w.id === q.workAnalysisId);
    const mr = wa ? mrs.find(m => m.mrNumber === wa.mrRef) : null;

    // Recalculate ranks for the context WA
    const relatedQuotations = quotations.filter(qt => qt.workAnalysisId === q.workAnalysisId);
    const supplierSums = relatedQuotations.reduce((acc, rq) => {
      if (!acc[rq.supplierId]) acc[rq.supplierId] = { id: rq.supplierId, name: rq.supplierName, total: 0 };
      acc[rq.supplierId].total += rq.totalPrice;
      return acc;
    }, {} as Record<string, { id: string; name: string; total: number }>);
    const rankings = Object.values(supplierSums).sort((a, b) => a.total - b.total);
    const isLowest = rankings.length > 0 && rankings[0].id === q.supplierId;

    return (
      <div className="space-y-6 select-none pb-20">
        <div className="bg-white p-5 rounded-xl border border-[#D3D1C7] shadow-sm flex items-center justify-between">
          <h1 className="text-xl font-bold font-sans text-[#2C2C2A] flex items-center gap-2">
            <button onClick={() => setViewMode('list')} className="p-1 hover:bg-slate-100 rounded text-slate-500 transition-colors"><ArrowLeft className="w-5 h-5"/></button>
            Quotation Details: {q.id}
          </h1>
          <button
            onClick={() => {
              onDeleteQuotation(q.id);
              setViewMode('list');
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 text-red-600 rounded text-sm font-semibold hover:bg-red-100 transition-colors"
          >
            <Trash2 className="w-4 h-4"/> Delete Quotation
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white p-6 rounded-xl border border-[#D3D1C7] shadow-sm space-y-6">
              <div>
                <p className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-1">Supplier</p>
                <h2 className="text-2xl font-bold text-slate-800">{q.supplierName}</h2>
                {isLowest && (
                  <span className="inline-flex items-center gap-1 mt-2 bg-emerald-50 text-emerald-700 px-2 py-1 rounded text-xs font-bold border border-emerald-200">
                    <Award className="w-3.5 h-3.5"/> Lowest Bidder for this WA
                  </span>
                )}
              </div>
              
              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-100">
                <div>
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Item Code</p>
                  <p className="font-mono text-sm mt-1">{q.priceBookCode}</p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Description</p>
                  <p className="font-medium text-sm mt-1">{q.itemDescription}</p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 pt-4 border-t border-slate-100">
                <div>
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Quantity</p>
                  <p className="font-mono text-lg mt-1">{q.quantity}</p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Unit Price</p>
                  <p className="font-mono text-lg mt-1 text-slate-700">{q.unitPrice.toLocaleString()} ETB</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Total Price</p>
                  <p className="font-mono font-bold text-2xl mt-1 text-emerald-700">{q.totalPrice.toLocaleString()} ETB</p>
                </div>
              </div>
            </div>

            {isLowest && (
              <div className="bg-gradient-to-br from-[#1D9E75]/5 to-emerald-50/50 p-6 rounded-xl border border-[#1D9E75]/25 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-start gap-4">
                    <div className="bg-[#1D9E75] p-3 rounded-xl text-white">
                      <CheckCircle2 className="w-6 h-6" />
                    </div>
                    <div className="space-y-1">
                      <h3 className="text-sm font-bold text-[#2C2C2A] uppercase tracking-wider">Proceed to Profitability Analysis</h3>
                      <p className="text-xs text-[#5F5E5A]">This quotation belongs to the lowest bidder. Ready for PA.</p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleQuickNavigateToPa(q.mrRef)}
                    className="px-4 py-2 bg-[#1D9E75] hover:bg-[#1D9E75]/90 text-white rounded-lg text-sm font-bold flex items-center gap-1.5 transition-colors shadow-sm"
                  >
                    <span>Create PA</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="bg-[#2C2C2A] text-white p-5 rounded-xl space-y-4 shadow-sm h-fit">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#1D9E75] border-b border-white/10 pb-2 flex items-center gap-1.5">
              <FileText className="w-4 h-4"/> Work Analysis Context
            </h3>
            {wa ? (
              <div className="space-y-3 text-xs font-sans">
                <div className="flex justify-between">
                  <span className="text-white/60">WA Reference:</span>
                  <span className="font-bold font-mono">{wa.id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/60">MR Ref:</span>
                  <span className="font-semibold text-emerald-400">{wa.mrRef}</span>
                </div>
                {mr && (
                  <div className="flex justify-between">
                    <span className="text-white/60">Client:</span>
                    <span className="font-bold text-white">{mr.vendorClient}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-white/60">Required Truck:</span>
                  <span className="font-mono bg-white/10 px-1.5 py-0.5 rounded text-[10px]">{wa.truckTypeRecommended}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/60">Project Sites:</span>
                  <span className="font-bold">{wa.totalSites} Sites</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/60">Total Distance:</span>
                  <span className="font-bold">{wa.totalDistance} km</span>
                </div>
              </div>
            ) : (
              <p className="text-xs text-white/50 italic">Work analysis data not found.</p>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Default List View
  return (
    <div className="space-y-6 select-none pb-20">
      <div className="bg-white p-5 rounded-xl border border-[#D3D1C7] shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-0.5">
          <h1 className="text-xl font-bold font-sans text-[#2C2C2A] tracking-tight">Supplier Quotations</h1>
          <p className="text-xs text-[#5F5E5A] font-medium flex items-center gap-1">
            <span className="inline-block w-2 h-2 rounded-full bg-[#1D9E75]" />
            Grouped by Work Analysis
          </p>
        </div>

        <div>
          <button
            onClick={() => setViewMode('form')}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#1D9E75] text-white rounded-lg text-sm font-semibold hover:bg-[#1D9E75]/90 transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" /> Add quotation
          </button>
        </div>
      </div>

      <div className="space-y-4">
        {groupedQuotations.map(({ workAnalysis, quotations: workQuotations }) => {
          const mr = mrs.find(m => m.mrNumber === workAnalysis.mrRef);
          const lowestQuote = [...workQuotations].sort((a, b) => a.totalPrice - b.totalPrice)[0];
          const isExpanded = expandedWaIds.has(workAnalysis.id);

          return (
            <div key={workAnalysis.id} className="bg-white rounded-xl border border-[#D3D1C7] shadow-sm overflow-hidden">
              <button
                type="button"
                onClick={() => toggleWaExpanded(workAnalysis.id)}
                className="w-full text-left px-6 py-5 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#F8F6F3] hover:bg-[#EFE9E0] transition-colors"
              >
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="inline-flex items-center gap-2 text-slate-600 font-semibold uppercase tracking-[0.2em] text-[10px]">
                      <FileText className="w-4 h-4" /> {workAnalysis.id}
                    </span>
                    <span className="text-slate-500 text-xs">MR: {workAnalysis.mrRef}</span>
                    {mr && <span className="text-xs text-[#1D9E75] font-semibold">{mr.vendorClient}</span>}
                  </div>
                  <div className="flex flex-wrap items-center gap-3 text-sm text-slate-700">
                    <span>{workQuotations.length} quotation{workQuotations.length > 1 ? 's' : ''}</span>
                    <span>{workAnalysis.truckTypeRecommended} truck</span>
                    <span>{workAnalysis.totalDistance || 0} km</span>
                    <span className="font-semibold">Unit Price: {lowestQuote.unitPrice.toLocaleString()} ETB</span>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
                  <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                    <Award className="w-3 h-3" /> Winner: {lowestQuote.supplierName}
                  </span>
                  <span className="px-2 py-1 rounded-full bg-white border border-slate-200">{isExpanded ? 'Collapse' : 'Expand'}</span>
                </div>
              </button>

              {isExpanded && (
                <div className="border-t border-[#D3D1C7]/70">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs font-sans">
                      <thead>
                        <tr className="bg-[#F1EFE8]/45 border-b border-[#D3D1C7]/80 text-[10px] font-semibold text-[#5F5E5A] uppercase tracking-wider">
                          <th className="p-4">Quotation ID</th>
                          <th className="p-4">Supplier</th>
                          <th className="p-4">Item</th>
                          <th className="p-4 text-center">Qty</th>
                          <th className="p-4 text-right">Unit Price</th>
                          <th className="p-4 text-right">Total Price</th>
                          <th className="p-4 text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#D3D1C7]/40 text-[#2C2C2A]">
                        {workQuotations.map(q => {
                          const isWinner = q.id === lowestQuote.id;
                          return (
                            <tr
                              key={q.id}
                              className={`hover:bg-[#F1EFE8]/10 transition-colors cursor-pointer ${isWinner ? 'bg-emerald-50/40' : ''}`}
                              onClick={() => { setActiveQuotationId(q.id); setViewMode('detail'); }}
                            >
                              <td className="p-4 font-mono font-medium text-emerald-700">{q.id}</td>
                              <td className="p-4 font-bold text-slate-800">{q.supplierName}</td>
                              <td className="p-4 text-slate-600 max-w-[240px] truncate" title={q.itemDescription}>{q.itemDescription}</td>
                              <td className="p-4 text-center font-mono">{q.quantity}</td>
                              <td className="p-4 text-right font-mono text-slate-600">{q.unitPrice.toLocaleString()} ETB</td>
                              <td className="p-4 text-right font-mono font-bold text-slate-900">{q.totalPrice.toLocaleString()} ETB</td>
                              <td className="p-4 text-right">
                                <div className="flex items-center justify-end gap-3">
                                  <button
                                    onClick={(e) => { e.stopPropagation(); setActiveQuotationId(q.id); setViewMode('detail'); }}
                                    className="text-[#1D9E75] hover:text-[#168561] font-semibold text-xs flex items-center gap-1 transition-colors"
                                  >
                                    <Eye className="w-3.5 h-3.5" /> View
                                  </button>
                                  <button
                                    onClick={(e) => { e.stopPropagation(); onDeleteQuotation(q.id); }}
                                    className="text-red-500 hover:text-red-700 font-semibold text-xs flex items-center gap-1 transition-colors"
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
                </div>
              )}
            </div>
          );
        })}

        {unassignedQuotationGroups.length > 0 && (
          <div className="bg-white rounded-xl border border-[#D3D1C7] shadow-sm overflow-hidden">
            <div className="px-6 py-5 bg-[#F8F6F3] text-slate-700 font-semibold">Unmatched Work Analysis Quotations</div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs font-sans">
                <thead>
                  <tr className="bg-[#F1EFE8]/45 border-b border-[#D3D1C7]/80 text-[10px] font-semibold text-[#5F5E5A] uppercase tracking-wider">
                    <th className="p-4">Quotation ID</th>
                    <th className="p-4">WA Ref</th>
                    <th className="p-4">Supplier</th>
                    <th className="p-4">Item</th>
                    <th className="p-4 text-center">Qty</th>
                    <th className="p-4 text-right">Unit Price</th>
                    <th className="p-4 text-right">Total Price</th>
                    <th className="p-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#D3D1C7]/40 text-[#2C2C2A]">
                  {unassignedQuotationGroups.map(({ workAnalysis, quotations: groupQuotations }) => (
                    <tr key={workAnalysis.id} className="hover:bg-[#F1EFE8]/10 transition-colors">
                      <td className="p-4 font-mono font-medium text-emerald-700">{groupQuotations[0].id}</td>
                      <td className="p-4 font-mono text-slate-500">{workAnalysis.id}</td>
                      <td className="p-4 font-bold text-slate-800">{groupQuotations[0].supplierName}</td>
                      <td className="p-4 text-slate-600 max-w-[240px] truncate" title={groupQuotations[0].itemDescription}>{groupQuotations[0].itemDescription}</td>
                      <td className="p-4 text-center font-mono">{groupQuotations[0].quantity}</td>
                      <td className="p-4 text-right font-mono text-slate-600">{groupQuotations[0].unitPrice.toLocaleString()} ETB</td>
                      <td className="p-4 text-right font-mono font-bold text-slate-900">{groupQuotations[0].totalPrice.toLocaleString()} ETB</td>
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-3">
                          <button
                            onClick={(e) => { e.stopPropagation(); setActiveQuotationId(groupQuotations[0].id); setViewMode('detail'); }}
                            className="text-[#1D9E75] hover:text-[#168561] font-semibold text-xs flex items-center gap-1 transition-colors"
                          >
                            <Eye className="w-3.5 h-3.5" /> View
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); onDeleteQuotation(groupQuotations[0].id); }}
                            className="text-red-500 hover:text-red-700 font-semibold text-xs flex items-center gap-1 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { Supplier, PriceBookEntry, WorkAnalysis, SupplierQuotation, MR } from '../types';
import { 
  Plus, 
  Trash2, 
  Award, 
  FileText, 
  ArrowRight, 
  CheckCircle2, 
  TrendingDown, 
  TrendingUp, 
  ChevronRight, 
  AlertCircle,
  HelpCircle
} from 'lucide-react';

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
  
  // Select active Work Analysis to view/manage quotations for
  const [selectedWaId, setSelectedWaId] = useState<string>('');

  // Local Form state for adding new quotation
  const [supplierId, setSupplierId] = useState<string>('');
  const [selectedPbEntryId, setSelectedPbEntryId] = useState<string>('');
  const [customCode, setCustomCode] = useState<string>('');
  const [customItem, setCustomItem] = useState<string>('');
  const [quantity, setQuantity] = useState<number>(1);
  const [unitPrice, setUnitPrice] = useState<number>(0);
  const [isCustomItem, setIsCustomItem] = useState<boolean>(false);

  // Set default Work Analysis on mount
  useEffect(() => {
    if (workAnalyses.length > 0 && !selectedWaId) {
      setSelectedWaId(workAnalyses[0].id);
    }
  }, [workAnalyses, selectedWaId]);

  const activeWa = workAnalyses.find(w => w.id === selectedWaId);
  const activeMr = activeWa ? mrs.find(m => m.mrNumber === activeWa.mrRef) : null;

  // Sync pricing when price book item changes
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

  // Filter quotations belonging to the active Work Analysis
  const activeQuotations = quotations.filter(q => q.workAnalysisId === selectedWaId);

  // Group quotations by supplier to calculate the total bid per supplier for this Work Analysis
  const supplierSums = activeQuotations.reduce((acc, q) => {
    if (!acc[q.supplierId]) {
      acc[q.supplierId] = {
        supplierId: q.supplierId,
        supplierName: q.supplierName,
        total: 0,
        itemsCount: 0
      };
    }
    acc[q.supplierId].total += q.totalPrice;
    acc[q.supplierId].itemsCount += 1;
    return acc;
  }, {} as Record<string, { supplierId: string; supplierName: string; total: number; itemsCount: number }>);

  const supplierBidsList = Object.values(supplierSums).sort((a, b) => a.total - b.total);
  const lowestBid = supplierBidsList.length > 0 ? supplierBidsList[0] : null;

  const handleAddQuotationSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedWaId) {
      alert("Please select or create a Work Analysis first.");
      return;
    }
    if (!supplierId) {
      alert("Please select a Supplier.");
      return;
    }

    const matchedSupplier = suppliers.find(s => s.id === supplierId);
    if (!matchedSupplier) return;

    const code = isCustomItem ? customCode : (priceBook.find(p => p.id === selectedPbEntryId)?.code || 'CUSTOM');
    const item = isCustomItem ? customItem : (priceBook.find(p => p.id === selectedPbEntryId)?.itemDescription || 'Custom Service Item');

    if (!code || !item || unitPrice <= 0 || quantity <= 0) {
      alert("Please enter valid item information, unit price, and quantity.");
      return;
    }

    const newQuotation: SupplierQuotation = {
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
    };

    onAddQuotation(newQuotation);

    // Reset local inputs
    setSelectedPbEntryId('');
    setCustomCode('');
    setCustomItem('');
    setQuantity(1);
    setUnitPrice(0);
    setIsCustomItem(false);
  };

  const handleQuickNavigateToPa = () => {
    if (setSelectedMrRef && activeWa) {
      setSelectedMrRef(activeWa.mrRef);
    }
    setScreen('profitability');
  };

  return (
    <div className="space-y-6 select-none pb-20" id="supplier-quotation-screen-container">
      
      {/* SECTION 1: HEADER & SELECTOR */}
      <div className="bg-white p-5 rounded-xl border border-[#D3D1C7] shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-0.5">
          <h1 className="text-xl font-bold font-sans text-[#2C2C2A] tracking-tight">Supplier Quotations</h1>
          <p className="text-xs text-[#5F5E5A] font-medium flex items-center gap-1">
            <span className="inline-block w-2 h-2 rounded-full bg-[#1D9E75]"></span>
            Multi-Carrier Bidding Comparison Engine
          </p>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs font-semibold text-[#5F5E5A]">Work Analysis Ref:</span>
          <select 
            id="wa-selector-for-quotes"
            value={selectedWaId} 
            onChange={(e) => {
              setSelectedWaId(e.target.value);
              setSupplierId('');
              setSelectedPbEntryId('');
            }}
            className="h-9 px-3 rounded-lg border border-[#D3D1C7] text-xs font-sans text-[#2C2C2A] bg-[#F1EFE8]/30 focus:outline-none focus:border-[#1D9E75]"
          >
            {workAnalyses.map(wa => (
              <option key={wa.id} value={wa.id}>{wa.id} (MR: {wa.mrRef}) - {wa.truckTypeRecommended}</option>
            ))}
          </select>
        </div>
      </div>

      {activeWa && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* LEFT COLUMNS: ACTIVE QUOTATIONS & LOWEST SUPPLIER */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* CURRENT QUOTATIONS TABLE */}
            <div className="bg-white p-5 rounded-xl border border-[#D3D1C7] shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-[#D3D1C7]/60 pb-3">
                <div>
                  <h2 className="text-xs font-bold text-[#2C2C2A] uppercase tracking-wider flex items-center gap-1.5">
                    <FileText className="w-4 h-4 text-[#1D9E75]" /> Bids Submitted for {activeWa.id}
                  </h2>
                  <p className="text-[11px] text-[#5F5E5A]">Each analysis allows 3 or more competing quotations for review</p>
                </div>
                <span className="px-2.5 py-1 bg-[#1D9E75]/10 text-[#1D9E75] rounded text-[10px] font-bold font-mono">
                  {activeQuotations.length} total quotation items
                </span>
              </div>

              <div className="overflow-x-auto border border-[#D3D1C7]/60 rounded-lg">
                <table className="w-full text-left border-collapse text-xs font-sans">
                  <thead>
                    <tr className="bg-[#F1EFE8]/45 border-b border-[#D3D1C7]/80 text-[10px] font-semibold text-[#5F5E5A] uppercase tracking-wider">
                      <th className="p-3">Supplier Name</th>
                      <th className="p-3">Item Description</th>
                      <th className="p-3 font-mono">Code</th>
                      <th className="p-3 text-center">Qty</th>
                      <th className="p-3 text-right">Unit Price (ETB)</th>
                      <th className="p-3 text-right">Total Price (ETB)</th>
                      <th className="p-3 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#D3D1C7]/40 text-[#2C2C2A]">
                    {activeQuotations.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="p-8 text-center text-slate-400 italic">
                          No quotations entered for this Work Analysis yet. Use the form on the right to input bids!
                        </td>
                      </tr>
                    ) : (
                      activeQuotations.map(q => (
                        <tr key={q.id} className="hover:bg-[#F1EFE8]/10 transition-colors">
                          <td className="p-3 font-semibold text-slate-800">{q.supplierName}</td>
                          <td className="p-3 font-medium text-slate-600 max-w-[220px] truncate" title={q.itemDescription}>
                            {q.itemDescription}
                          </td>
                          <td className="p-3 font-mono text-slate-500 text-[11px]">{q.priceBookCode}</td>
                          <td className="p-3 text-center font-mono">{q.quantity}</td>
                          <td className="p-3 text-right font-mono text-slate-600">{q.unitPrice.toLocaleString()} ETB</td>
                          <td className="p-3 text-right font-mono font-bold text-slate-900">{q.totalPrice.toLocaleString()} ETB</td>
                          <td className="p-3 text-center">
                            <button
                              onClick={() => onDeleteQuotation(q.id)}
                              className="p-1 text-slate-400 hover:text-red-600 rounded transition-colors"
                              title="Delete Quotation"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* LOWEST CARRIER SUMMARY CARD (BOTTOM COMPARISON) */}
            <div className="bg-gradient-to-br from-[#1D9E75]/5 to-emerald-50/50 p-6 rounded-xl border border-[#1D9E75]/25 shadow-sm space-y-4">
              <div className="flex items-start gap-4">
                <div className="bg-[#1D9E75] p-3 rounded-xl text-white">
                  <Award className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-sm font-bold text-[#2C2C2A] uppercase tracking-wider">Lowest Supplier Recommendation</h3>
                  <p className="text-xs text-[#5F5E5A]">Automated comparison of the total aggregate bid amounts for {activeWa.id}</p>
                </div>
              </div>

              {lowestBid ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                  <div className="bg-white p-4 rounded-xl border border-[#D3D1C7]/60 space-y-1">
                    <span className="text-[10px] text-[#5F5E5A] font-bold uppercase tracking-wider">Lowest Bidder</span>
                    <span className="text-base font-black text-emerald-800 block truncate" title={lowestBid.supplierName}>
                      {lowestBid.supplierName}
                    </span>
                    <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-1 mt-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Selected Carrier Option
                    </span>
                  </div>

                  <div className="bg-white p-4 rounded-xl border border-[#D3D1C7]/60 space-y-1">
                    <span className="text-[10px] text-[#5F5E5A] font-bold uppercase tracking-wider">Total Combined Price</span>
                    <span className="text-lg font-mono font-black text-slate-800 block">
                      {lowestBid.total.toLocaleString()} ETB
                    </span>
                    <span className="text-[10px] text-slate-400 font-semibold block mt-1">
                      ex-VAT compiled price book rates
                    </span>
                  </div>

                  <div className="bg-white p-4 rounded-xl border border-[#D3D1C7]/60 space-y-1 flex flex-col justify-between">
                    <span className="text-[10px] text-[#5F5E5A] font-bold uppercase tracking-wider">Fiscal Compliance</span>
                    <button
                      onClick={handleQuickNavigateToPa}
                      className="px-3.5 py-1.5 bg-[#1D9E75] hover:bg-[#1D9E75]/90 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer w-full mt-1 shadow-sm"
                    >
                      <span>Proceed to PA</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="p-4 bg-white/60 text-slate-500 rounded-lg text-xs italic text-center border border-dashed border-[#D3D1C7]">
                  No bids available to compare. Please add at least one quotation from a supplier.
                </div>
              )}

              {/* Bids Rank comparison */}
              {supplierBidsList.length > 1 && (
                <div className="space-y-2 pt-2 border-t border-[#1D9E75]/20">
                  <span className="text-[10px] text-slate-500 font-bold uppercase">Bids Comparison Rankings:</span>
                  <div className="space-y-1.5">
                    {supplierBidsList.map((bid, i) => {
                      const percentageDiff = i === 0 ? 0 : Math.round(((bid.total - lowestBid!.total) / lowestBid!.total) * 100);
                      return (
                        <div key={bid.supplierId} className="flex items-center justify-between text-xs font-sans">
                          <div className="flex items-center gap-2">
                            <span className="w-4 h-4 rounded-full bg-slate-200 text-[#2C2C2A] text-[9px] font-bold flex items-center justify-center">
                              {i + 1}
                            </span>
                            <span className="font-medium text-slate-700">{bid.supplierName}</span>
                            <span className="text-[10px] text-slate-400">({bid.itemsCount} items)</span>
                          </div>
                          <div className="flex items-center gap-3 font-mono">
                            <span className="font-bold">{bid.total.toLocaleString()} ETB</span>
                            <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                              i === 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-red-50 text-red-700'
                            }`}>
                              {i === 0 ? 'Lowest' : `+${percentageDiff}% Variance`}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="p-3 bg-white/40 rounded-lg border border-[#1D9E75]/20 text-[10px] text-[#5F5E5A] flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-emerald-700 shrink-0" />
                <span>
                  <strong>Adiu Compliance Constraint:</strong> Profitability Analysis (PA) in the next screen is strictly locked to integrate **ONLY** the lowest supplier bid highlighted above, eliminating unauthorized single-vendor selection.
                </span>
              </div>

            </div>

          </div>

          {/* RIGHT COLUMN: ADD QUOTATION FORM */}
          <div className="space-y-6">
            
            {/* ADD QUOTATION FORM */}
            <div className="bg-white p-5 rounded-xl border border-[#D3D1C7] shadow-sm space-y-4">
              <h2 className="text-xs font-bold text-[#2C2C2A] uppercase tracking-wider border-b border-[#D3D1C7]/60 pb-2 flex items-center gap-1.5">
                <Plus className="w-4 h-4 text-[#1D9E75]" /> Input Supplier Bid
              </h2>

              <form onSubmit={handleAddQuotationSubmit} className="space-y-4 text-xs font-sans">
                
                {/* 1. Supplier Select */}
                <div className="flex flex-col gap-1">
                  <label className="text-[11px] text-[#5F5E5A] font-bold uppercase tracking-tight">Select Supplier</label>
                  <select
                    value={supplierId}
                    onChange={(e) => {
                      setSupplierId(e.target.value);
                      setSelectedPbEntryId('');
                    }}
                    className="h-9 px-2.5 border border-[#D3D1C7] rounded-lg bg-white font-medium text-slate-700 focus:outline-none focus:border-[#1D9E75]"
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
                    {/* Item Mode */}
                    <div className="flex items-center gap-4 bg-slate-50 p-2 rounded-lg border border-[#D3D1C7]/30">
                      <span className="text-[10px] text-slate-500 font-semibold uppercase">Item Type:</span>
                      <label className="flex items-center gap-1.5 cursor-pointer">
                        <input
                          type="radio"
                          checked={!isCustomItem}
                          onChange={() => setIsCustomItem(false)}
                          className="text-[#1D9E75] focus:ring-[#1D9E75]"
                        />
                        <span>Contract Price Book</span>
                      </label>
                      <label className="flex items-center gap-1.5 cursor-pointer">
                        <input
                          type="radio"
                          checked={isCustomItem}
                          onChange={() => setIsCustomItem(true)}
                          className="text-[#1D9E75] focus:ring-[#1D9E75]"
                        />
                        <span>Custom Rate</span>
                      </label>
                    </div>

                    {!isCustomItem ? (
                      /* 2A. Price Book Entry Select */
                      <div className="flex flex-col gap-1">
                        <label className="text-[11px] text-[#5F5E5A] font-bold uppercase tracking-tight">Contract Item</label>
                        <select
                          value={selectedPbEntryId}
                          onChange={(e) => setSelectedPbEntryId(e.target.value)}
                          className="h-9 px-2.5 border border-[#D3D1C7] rounded-lg bg-white text-slate-700 focus:outline-none focus:border-[#1D9E75]"
                        >
                          <option value="">-- Select Price Book Item --</option>
                          {priceBook
                            .filter(p => p.supplierId === supplierId)
                            .map(entry => (
                              <option key={entry.id} value={entry.id}>
                                {entry.code} - {entry.itemDescription} ({entry.unitPrice.toLocaleString()} ETB / {entry.unit})
                              </option>
                            ))
                          }
                        </select>
                        <span className="text-[10px] text-slate-400 italic">
                          Filtered by selected carrier's agreed Contract Price Book
                        </span>
                      </div>
                    ) : (
                      /* 2B. Custom inputs */
                      <div className="space-y-3 p-3 bg-orange-50/40 rounded-lg border border-orange-200">
                        <div className="flex flex-col gap-1">
                          <label className="text-[11px] text-[#5F5E5A] font-semibold uppercase tracking-tight">Custom Item Code</label>
                          <input
                            type="text"
                            value={customCode}
                            onChange={(e) => setCustomCode(e.target.value)}
                            placeholder="e.g. CUSTOM-01"
                            className="h-9 px-3 border border-[#D3D1C7] rounded-lg bg-white"
                            required
                          />
                        </div>
                        <div className="flex flex-col gap-1">
                          <label className="text-[11px] text-[#5F5E5A] font-semibold uppercase tracking-tight">Custom Item Name / Route</label>
                          <input
                            type="text"
                            value={customItem}
                            onChange={(e) => setCustomItem(e.target.value)}
                            placeholder="e.g. 3-Ton Truck Flat Rate Custom Service"
                            className="h-9 px-3 border border-[#D3D1C7] rounded-lg bg-white"
                            required
                          />
                        </div>
                      </div>
                    )}

                    {/* 3. Quantity & Unit Price */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="flex flex-col gap-1">
                        <label className="text-[11px] text-[#5F5E5A] font-bold uppercase tracking-tight">Quantity</label>
                        <input
                          type="number"
                          min={1}
                          value={quantity}
                          onChange={(e) => setQuantity(Math.max(1, Number(e.target.value)))}
                          className="h-9 px-3 border border-[#D3D1C7] rounded-lg bg-white font-mono text-center"
                          required
                        />
                      </div>

                      <div className="flex flex-col gap-1">
                        <label className="text-[11px] text-[#5F5E5A] font-bold uppercase tracking-tight">Unit Price (ETB)</label>
                        <input
                          type="number"
                          min={0}
                          value={unitPrice}
                          onChange={(e) => setUnitPrice(Number(e.target.value))}
                          className="h-9 px-3 border border-[#D3D1C7] rounded-lg bg-white font-mono text-right"
                          disabled={!isCustomItem && !!selectedPbEntryId} // Lock for Price Book selection
                          required
                        />
                      </div>
                    </div>

                    {/* Total bid item preview */}
                    <div className="p-3 bg-slate-50 rounded-lg border border-[#D3D1C7]/40 flex justify-between items-center font-mono">
                      <span className="text-[10px] text-slate-500 font-bold uppercase">Item Total Preview:</span>
                      <strong className="text-[#2C2C2A] text-sm">{(quantity * unitPrice).toLocaleString()} ETB</strong>
                    </div>

                    <button
                      type="submit"
                      className="w-full py-2.5 bg-[#1D9E75] hover:bg-[#1D9E75]/90 text-white font-bold rounded-lg flex items-center justify-center gap-1.5 transition-all shadow-sm cursor-pointer"
                    >
                      <Plus className="w-4 h-4" /> Add Bid Item
                    </button>
                  </>
                )}
              </form>
            </div>

            {/* ASSOCIATED WORK ANALYSIS DETAILS */}
            <div className="bg-[#2C2C2A] text-white p-5 rounded-xl space-y-4 shadow-sm">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#1D9E75] border-b border-white/10 pb-2">
                Work Analysis Context
              </h3>
              
              <div className="space-y-3 text-xs font-sans">
                <div className="flex justify-between">
                  <span className="text-white/60">WA Reference:</span>
                  <span className="font-bold font-mono">{activeWa.id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/60">Transport Request MR:</span>
                  <span className="font-semibold text-emerald-400">{activeWa.mrRef}</span>
                </div>
                {activeMr && (
                  <div className="flex justify-between">
                    <span className="text-white/60">Client Project:</span>
                    <span className="font-bold text-white">{activeMr.vendorClient}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-white/60">Recommended Vehicle:</span>
                  <span className="font-mono bg-white/10 px-1.5 py-0.5 rounded text-[10px]">
                    {activeWa.truckTypeRecommended}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/60">Total Project Sites:</span>
                  <span className="font-bold">{activeWa.totalSites} Sites</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/60">Estimated Trips:</span>
                  <span className="font-bold font-mono">{activeWa.estimatedTrips} Trips</span>
                </div>
              </div>
            </div>

          </div>

        </div>
      )}

    </div>
  );
}

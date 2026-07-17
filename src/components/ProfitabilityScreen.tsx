import React, { useState, useEffect } from 'react';
import { ProfitabilityAnalysis, MR, QuoteComparisonRow, Supplier, PriceBookEntry, WorkAnalysis, SupplierQuotation } from '../types';
import { INITIAL_PAS, INITIAL_SUPPLIERS } from '../data';
import { ArrowRight, ShieldCheck, FileCheck, CheckCircle2, AlertTriangle, XCircle, Info, ExternalLink } from 'lucide-react';

interface ProfitabilityScreenProps {
  pas: ProfitabilityAnalysis[];
  mrs: MR[];
  suppliers: Supplier[];
  onSavePa: (pa: ProfitabilityAnalysis) => void;
  selectedMrRef: string | null;
  setSelectedMrRef?: (mrRef: string | null) => void;
  priceBook: PriceBookEntry[];
  workAnalyses: WorkAnalysis[];
  quotations: SupplierQuotation[];
  setScreen?: (screen: string) => void;
}

export default function ProfitabilityScreen({
  pas,
  mrs,
  suppliers,
  onSavePa,
  selectedMrRef,
  setSelectedMrRef,
  priceBook,
  workAnalyses,
  quotations,
  setScreen
}: ProfitabilityScreenProps) {
  
  const [activePa, setActivePa] = useState<ProfitabilityAnalysis | null>(null);
  const [selectedPaNum, setSelectedPaNum] = useState<string>('');

  // Sync state with selected MR or select list
  useEffect(() => {
    if (selectedPaNum) {
      const existing = pas.find(p => p.paNumber === selectedPaNum);
      if (existing) {
        setActivePa(JSON.parse(JSON.stringify(existing)));
        return;
      }
    }

    if (selectedMrRef) {
      const existing = pas.find(p => p.mrRef === selectedMrRef);
      if (existing) {
        setActivePa(JSON.parse(JSON.stringify(existing)));
        setSelectedPaNum(existing.paNumber);
        return;
      }
    }

    if (pas.length > 0) {
      setActivePa(JSON.parse(JSON.stringify(pas[0])));
      setSelectedPaNum(pas[0].paNumber);
    } else {
      handleInitNewPa(selectedMrRef || mrs[0]?.mrNumber || '');
    }
  }, [selectedPaNum, selectedMrRef, pas]);

  // Find the Work Analysis and Quotations for the current active PA's MR Ref
  const currentWa = activePa ? workAnalyses.find(w => w.mrRef === activePa.mrRef) : null;
  const currentQuotes = currentWa ? quotations.filter(q => q.workAnalysisId === currentWa.id) : [];

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
    
    // Find the budget in Price Book (default/auto match, used until a Price Book Item is manually selected)
    const pbEntry = priceBook.find(p => p.code === q.priceBookCode && p.supplierId === q.supplierId);
    const itemBudgetRate = pbEntry ? pbEntry.unitPrice : q.unitPrice; // Use contract rate or quote rate as fallback
    
    acc[q.supplierId].totalQuoted += q.totalPrice;
    acc[q.supplierId].totalBudget += (itemBudgetRate * q.quantity);
    acc[q.supplierId].totalQuantity += q.quantity;
    acc[q.supplierId].items.push(q);
    return acc;
  }, {} as Record<string, { supplierId: string; supplierName: string; totalQuoted: number; totalBudget: number; totalQuantity: number; items: SupplierQuotation[] }>);

  // Build the comparison rows, honoring any manually selected Vendor / Price Book Item
  // that the user has picked for a given row (stored on the active PA's quoteComparison).
  const calculatedQuotes: QuoteComparisonRow[] = Object.values(supplierAggregates).map(agg => {
    const existingRow = activePa?.quoteComparison.find(q => q.supplierId === agg.supplierId);

    const vendorId = existingRow?.vendorId || agg.supplierId;
    const priceBookEntryId = existingRow?.priceBookEntryId || '';

    let budget = agg.totalBudget; // fallback: auto-derived budget from matching quotation price book codes

    if (priceBookEntryId) {
      const selectedEntry = priceBook.find(p => p.id === priceBookEntryId);
      if (selectedEntry) {
        budget = selectedEntry.unitPrice * agg.totalQuantity;
      }
    }

    const variance = agg.totalQuoted - budget;
    const variancePercent = budget > 0 ? Math.round((variance / budget) * 1000) / 10 : 0;
    
    return {
      supplierId: agg.supplierId,
      supplierName: agg.supplierName,
      truckType: currentWa?.truckTypeRecommended || '3-ton',
      routeZone: currentWa?.sites[0]?.town || 'Addis Ababa',
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

  // Sync active PA's selected supplier and comparisons with the quotations
  useEffect(() => {
    if (activePa && leastSupplier) {
      const needsUpdate = 
        activePa.selectedSupplierId !== leastSupplier.supplierId ||
        JSON.stringify(activePa.quoteComparison) !== JSON.stringify(calculatedQuotes);

      if (needsUpdate) {
        setActivePa(prev => {
          if (!prev) return null;
          return {
            ...prev,
            selectedSupplierId: leastSupplier.supplierId,
            supplierId: leastSupplier.supplierId,
            quoteComparison: calculatedQuotes
          };
        });
      }
    }
  }, [leastSupplier?.supplierId, currentQuotes.length, activePa?.mrRef]);

  const handleInitNewPa = (mrRefNum: string) => {
    const nextNum = 210 + pas.length;

    const newPa: ProfitabilityAnalysis = {
      paNumber: `PA-2026-0${nextNum}`,
      mrRef: mrRefNum,
      supplierId: 'sup-01',
      date: new Date().toISOString().split('T')[0],
      quoteComparison: [],
      selectedSupplierId: 'sup-01',
      workOrderNumber: `WO-2026-880${nextNum}`,
      issuedDate: '',
      specialInstructions: 'Ensure loading photo audit is completed.',
      comment: '',
      approvalStatus: 'Pending'
    };

    setActivePa(newPa);
  };

  // Determine active approval tier based on negative variance % rules of selected quote
  const getActiveApprovalTier = () => {
    if (!activePa) return 'DIRECT';
    
    const selectedQuote = activePa.quoteComparison.find(q => q.supplierId === activePa.selectedSupplierId) 
                         || activePa.quoteComparison[0];
    
    if (!selectedQuote) return 'DIRECT';
    const vPct = selectedQuote.variancePercent;

    if (vPct >= 0) return 'DIRECT'; // Auto-proceed direct passage
    const negVal = Math.abs(vPct);
    if (negVal <= 10) return 'TL';     // Transport Lead (TL)
    if (negVal <= 20) return 'ST';     // ST&PIM Manager (ST)
    return 'SCD';                    // Supply Chain Director (SCD)
  };

  const activeTier = getActiveApprovalTier();

  const handleIssueWorkOrderAction = () => {
    if (!activePa) return;
    if (!leastSupplier) {
      alert("Cannot issue work order without competitive quotations.");
      return;
    }

    const workOrderDate = activePa.issuedDate || new Date().toISOString().split('T')[0];
    const updated: ProfitabilityAnalysis = {
      ...activePa,
      approvalStatus: 'Approved' as const,
      issuedDate: workOrderDate
    };

    onSavePa(updated);
    setActivePa(updated);
    alert(`Work Order ${updated.workOrderNumber} has been successfully issued to ${leastSupplier.supplierName} (Lowest Bidder) for PA ${updated.paNumber}!`);
  };

  const handleSaveDraft = () => {
    if (!activePa) return;
    onSavePa(activePa);
    alert(`Profitability Analysis ${activePa.paNumber} saved as draft!`);
  };

  const getVarianceColor = (vPct: number) => {
    if (vPct >= 0) return 'bg-emerald-50 text-emerald-800 font-bold border-emerald-200';
    const negVal = Math.abs(vPct);
    if (negVal <= 10) return 'bg-[#1D9E75]/10 text-[#1D9E75] font-bold border-[#1D9E75]/20';
    if (negVal <= 20) return 'bg-orange-50 text-orange-800 font-bold border-orange-200';
    return 'bg-red-50 text-red-800 font-bold border-red-200';
  };

  // Persist the row's Vendor selection onto the active PA's quoteComparison. Changing
  // vendor resets the Price Book Item choice, since items belong to a specific vendor.
  const handleVendorSelect = (supplierId: string, vendorId: string) => {
    if (!activePa) return;
    const currentRow = calculatedQuotes.find(q => q.supplierId === supplierId);
    if (!currentRow) return;

    const agg = supplierAggregates[supplierId];
    const budget = agg ? agg.totalBudget : currentRow.budget;
    const variance = (agg ? agg.totalQuoted : currentRow.quotedPrice) - budget;
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

  // Once a Price Book Item is selected, pull its unit price into the Budget field
  // (unit price x total quoted quantity for that supplier's line items).
  const handlePriceBookItemSelect = (supplierId: string, priceBookEntryId: string) => {
    if (!activePa) return;
    const currentRow = calculatedQuotes.find(q => q.supplierId === supplierId);
    const agg = supplierAggregates[supplierId];
    if (!currentRow || !agg) return;

    const selectedEntry = priceBook.find(p => p.id === priceBookEntryId);
    const budget = selectedEntry ? selectedEntry.unitPrice * agg.totalQuantity : agg.totalBudget;
    const variance = agg.totalQuoted - budget;
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

  if (!activePa) return null;

  return (
    <div className="space-y-6 select-none pb-20" id="profitability-screen-container">
      {/* Selector controls */}
      <div className="flex flex-wrap items-center justify-between bg-white p-4 rounded-xl border border-[#D3D1C7] gap-3">
        <div className="flex items-center gap-3">
          <span className="text-xs font-semibold text-[#5F5E5A]">Select PA Record:</span>
          <select 
            id="pa-selector"
            value={selectedPaNum} 
            onChange={(e) => setSelectedPaNum(e.target.value)}
            className="h-9 px-3 rounded-lg border border-[#D3D1C7] text-xs font-sans text-[#2C2C2A] bg-[#F1EFE8]/30 focus:outline-none focus:border-[#1D9E75]"
          >
            {pas.map(p => (
              <option key={p.paNumber} value={p.paNumber}>{p.paNumber} (MR: {p.mrRef})</option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs font-semibold text-[#5F5E5A]">Work Analysis:</span>
          <select 
            id="pa-mr-linker"
            value={activePa.mrRef}
            onChange={(e) => {
              if (e.target.value) {
                if (setSelectedMrRef) setSelectedMrRef(e.target.value);
                handleInitNewPa(e.target.value);
              }
            }}
            className="h-9 px-3 rounded-lg border border-[#D3D1C7] text-xs font-sans text-[#2C2C2A] bg-[#F1EFE8]/30 focus:outline-none focus:border-[#1D9E75]"
          >
            <option value="" disabled>-- Select Work Analysis Item --</option>
            {workAnalyses.map(wa => (
              <option key={wa.id} value={wa.mrRef}>
                {wa.id} (MR: {wa.mrRef}) - {wa.truckTypeRecommended} ({wa.totalSites} sites)
              </option>
            ))}
          </select>
        </div>
      </div>

      {currentQuotes.length === 0 ? (
        /* NO QUOTATIONS WARNING AND REDIRECT */
        <div className="bg-white p-10 rounded-xl border border-amber-200 shadow-sm flex flex-col items-center justify-center text-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div className="max-w-md space-y-2">
            <h3 className="text-sm font-bold text-[#2C2C2A] uppercase tracking-wider">No Competitive Bids Submitted</h3>
            <p className="text-xs text-[#5F5E5A]">
              Under Adiu procurement guidelines, profitability reviews cannot proceed until competitive supplier quotations are registered for this Work Analysis.
            </p>
          </div>
          {setScreen && (
            <button
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
          
          {/* Section A — Header */}
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-[#D3D1C7] pb-2">
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded bg-[#1D9E75]/10 text-[#1D9E75] flex items-center justify-center font-bold text-xs">A</div>
                <h2 className="text-xs font-bold text-[#2C2C2A] uppercase tracking-wider">Section A — PA General Header</h2>
              </div>
              <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded text-[10px] font-bold">
                Linked with Lowest Bidder
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs font-sans">
              <div className="flex flex-col gap-1">
                <label className="text-[11px] text-[#5F5E5A] font-medium uppercase tracking-tight">PA analysis number (auto)</label>
                <input type="text" value={activePa.paNumber} disabled className="h-9 px-3 border border-[#D3D1C7] rounded-lg bg-[#F1EFE8]/50 text-[#5F5E5A] font-mono font-bold" />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[11px] text-[#5F5E5A] font-medium uppercase tracking-tight">MR reference</label>
                <input type="text" value={activePa.mrRef} disabled className="h-9 px-3 border border-[#D3D1C7] rounded-lg bg-[#F1EFE8]/50 text-[#5F5E5A] font-semibold" />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[11px] text-[#5F5E5A] font-medium uppercase tracking-tight">Standard Date</label>
                <input type="date" value={activePa.date} onChange={(e) => setActivePa({ ...activePa, date: e.target.value })} className="h-9 px-2 border border-[#D3D1C7] rounded-lg" />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[11px] text-emerald-800 font-bold uppercase tracking-tight flex items-center gap-1">
                  Selected lowest supplier (locked)
                </label>
                <input 
                  type="text" 
                  value={leastSupplier ? leastSupplier.supplierName : 'No Supplier'} 
                  disabled 
                  className="h-9 px-3 border border-emerald-200 rounded-lg bg-emerald-50/50 text-emerald-800 font-bold" 
                />
              </div>
            </div>
          </div>

          {/* Section B — Quote comparison table */}
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-[#D3D1C7] pb-2">
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded bg-[#1D9E75]/10 text-[#1D9E75] flex items-center justify-center font-bold text-xs">B</div>
                <h2 className="text-xs font-bold text-[#2C2C2A] uppercase tracking-wider">Section B — Quote Budget Comparison</h2>
              </div>
              <span className="text-[10px] text-[#5F5E5A] italic flex items-center gap-1">
                <Info className="w-3.5 h-3.5 text-[#1D9E75]" /> Compiled from submitted competing quotations
              </span>
            </div>

            <div className="overflow-x-auto border border-[#D3D1C7]/60 rounded-lg">
              <table className="w-full text-left border-collapse" id="quote-comparison-table">
                <thead>
                  <tr className="bg-[#F1EFE8]/45 border-b border-[#D3D1C7]/80 text-[10px] font-sans font-semibold text-[#5F5E5A] uppercase tracking-wider">
                    <th className="p-3">Supplier Name</th>
                    <th className="p-3">Truck Type</th>
                    <th className="p-3">Route / Zone</th>
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
                  {calculatedQuotes.map((row) => {
                    const isSelected = row.supplierId === activePa.selectedSupplierId;
                    
                    return (
                      <tr 
                        key={row.supplierId} 
                        className={`hover:bg-[#F1EFE8]/10 transition-all ${
                          isSelected ? 'bg-emerald-50/50 font-semibold' : ''
                        }`}
                      >
                        <td className="p-3 flex items-center gap-2">
                          <input 
                            type="radio" 
                            checked={isSelected}
                            disabled
                            className="text-emerald-600 focus:ring-emerald-500 cursor-not-allowed opacity-90"
                          />
                          <span className={isSelected ? "text-emerald-900 font-bold" : "text-slate-600"}>
                            {row.supplierName}
                          </span>
                          {isSelected && (
                            <span className="ml-1 bg-emerald-100 text-emerald-800 text-[9px] px-1.5 py-0.5 rounded font-bold">
                              Winner
                            </span>
                          )}
                        </td>
                        <td className="p-3 font-mono text-slate-500">{row.truckType}</td>
                        <td className="p-3 text-slate-600">{row.routeZone}</td>
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
                              .filter(p => p.supplierId === row.vendorId)
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
                              from Price Book
                            </div>
                          )}
                        </td>
                        <td className={`p-3 text-right font-mono font-bold ${row.variance > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
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

      {/* Sticky footer */}
      {currentQuotes.length > 0 && (
        <div className="fixed bottom-0 left-[240px] right-0 h-16 bg-white border-t border-[#D3D1C7] px-6 flex items-center justify-between shadow-md z-40">
          <span className="text-xs text-[#5F5E5A]">
            Active Winner Bid: <span className="font-bold text-[#2C2C2A]">{leastSupplier ? leastSupplier.supplierName : 'None'}</span> | Price: <span className="text-emerald-700 font-mono font-bold">{leastSupplier ? leastSupplier.quotedPrice.toLocaleString() : 0} ETB</span>
          </span>

          <div className="flex items-center gap-3">
            <button
              onClick={handleSaveDraft}
              className="px-4 py-2 border border-[#D3D1C7] bg-white text-[#2C2C2A] hover:bg-[#F1EFE8] rounded-lg text-xs font-sans font-semibold cursor-pointer"
            >
              Save PA draft
            </button>
            
            <button
              onClick={handleIssueWorkOrderAction}
              className={`flex items-center gap-1.5 px-5 py-2 text-white rounded-lg text-xs font-sans font-semibold cursor-pointer transition-all shadow-sm ${
                activePa.approvalStatus === 'Approved' 
                  ? 'bg-[#1D9E75] hover:bg-[#1D9E75]/95' 
                  : 'bg-emerald-600 hover:bg-emerald-700'
              }`}
            >
              <FileCheck className="w-4 h-4" /> Issue Winner Work Order
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

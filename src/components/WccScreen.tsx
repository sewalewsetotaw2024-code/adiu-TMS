import React, { useState, useEffect, useMemo } from 'react';
import { WccClosure, MR } from '../types';
import { Plus, X, Edit2, Eye, Trash2 } from 'lucide-react';
import { 
  FileCheck, 
  Upload, 
  HelpCircle, 
  CheckCircle2, 
  AlertTriangle, 
  ArrowRight, 
  ChevronRight, 
  Save, 
  Check, 
  Briefcase 
} from 'lucide-react';

interface WccScreenProps {
  wccClosures: WccClosure[];
  mrs: MR[];
  onSaveWcc: (closure: WccClosure) => void;
  onRemoveWcc?: (mrRef: string) => void;
}

export default function WccScreen({ wccClosures, mrs, onSaveWcc, onRemoveWcc }: WccScreenProps) {
  const [selectedMrRef, setSelectedMrRef] = useState<string | null>(null);
  const [activeWcc, setActiveWcc] = useState<WccClosure | null>(null);

  // Sync state when selected MR changes
  useEffect(() => {
    if (selectedMrRef) {
      const record = wccClosures.find(w => w.mrRef === selectedMrRef);
      if (record) {
        setActiveWcc(JSON.parse(JSON.stringify(record)));
      } else {
        // Init a new blank one if not found
        setActiveWcc({
          mrRef: selectedMrRef,
          poNumber: '',
          poAmount: 0,
          supplierInvoiceAmount: 0,
          poVariance: 0,
          poVariancePercent: 0,
          wccStatus: 'Draft',
          basecampStatus: 'Active',
          docMrSigned: false,
          docDeliveryPhoto: false,
          docWorkOrderCopy: false,
          docGrn: false,
          docSupplierInvoice: false
        });
      }
    } else {
      setActiveWcc(null);
    }
  }, [selectedMrRef, wccClosures]);

  const kpis = useMemo(() => {
    let total = wccClosures.length;
    let drafts = 0;
    let pendingApproval = 0;
    let approved = 0;
    
    wccClosures.forEach(w => {
      if (w.wccStatus === 'Not applied') drafts++;
      if (w.wccStatus === 'Applied') pendingApproval++;
      if (w.wccStatus === 'Approved') approved++;
    });

    return { total, drafts, pendingApproval, approved };
  }, [wccClosures]);

  const startNewWcc = () => {
    // Find first MR that doesn't have a WCC yet
    const usedMrs = wccClosures.map(w => w.mrRef);
    const availableMr = mrs.find(m => !usedMrs.includes(m.mrNumber));
    if (availableMr) {
      setSelectedMrRef(availableMr.mrNumber);
    } else {
      alert("All MRs already have a WCC.");
    }
  };

  const closePanel = () => {
    setSelectedMrRef(null);
  };


  const handleFieldChange = (field: keyof WccClosure, value: any) => {
    if (!activeWcc) return;
    const updated = { ...activeWcc, [field]: value };
    
    // Auto-calculate PO variance if PO parameters changed
    if (field === 'poAmount' || field === 'supplierInvoiceAmount') {
      const poAmt = field === 'poAmount' ? Number(value) : activeWcc.poAmount;
      const invAmt = field === 'supplierInvoiceAmount' ? Number(value) : activeWcc.supplierInvoiceAmount;
      const variance = invAmt - poAmt;
      const variancePercent = poAmt > 0 ? Math.round((variance / poAmt) * 1000) / 10 : 0;
      
      updated.poVariance = variance;
      updated.poVariancePercent = variancePercent;
    }

    setActiveWcc(updated);
  };

  const handleToggleDocCheck = (docField: 'docMrSigned' | 'docDeliveryPhoto' | 'docWorkOrderCopy' | 'docGrn' | 'docSupplierInvoice') => {
    if (!activeWcc) return;
    const isChecked = !!activeWcc[docField];
    handleFieldChange(docField, !isChecked);
  };

  const handleSimulateDocUpload = (docField: 'docMrSigned' | 'docDeliveryPhoto' | 'docWorkOrderCopy' | 'docGrn' | 'docSupplierInvoice') => {
    if (!activeWcc) return;
    handleFieldChange(docField, true);
    alert(`Document scanned file uploaded successfully.`);
  };

  const handleSaveDraft = () => {
    if (!activeWcc) return;
    onSaveWcc(activeWcc);
    alert(`WCC & Closure draft for MR ${activeWcc.mrRef} successfully saved.`);
  };

  const handleSubmitWcc = () => {
    if (!activeWcc) return;
    
    // Check if checklist is complete
    const isDocComplete = activeWcc.docMrSigned && 
                          activeWcc.docDeliveryPhoto && 
                          activeWcc.docWorkOrderCopy && 
                          activeWcc.docGrn && 
                          activeWcc.docSupplierInvoice;

    if (!isDocComplete) {
      alert('Cannot submit WCC Application: All document checklist credentials must be checked & verified.');
      return;
    }

    if (activeWcc.poVariancePercent > 0) {
      alert('PO Reconciliation warning: Invoice exceeds PO value. Ensure you have provided standard justifications prior to WCC submission.');
    }

    const updated = {
      ...activeWcc,
      wccStatus: 'Applied' as const
    };
    setActiveWcc(updated);
    onSaveWcc(updated);
    alert(`Work Completion Certificate (WCC) filed successfully for MR ${activeWcc.mrRef}.`);
  };

  const handleApproveWcc = () => {
    if (!activeWcc) return;
    const updated = {
      ...activeWcc,
      wccStatus: 'Approved' as const
    };
    setActiveWcc(updated);
    onSaveWcc(updated);
    alert(`WCC approved successfully. Closed out finance registers for MR ${activeWcc.mrRef}.`);
  };



  if (activeWcc) {
    // Determine doc checklist completeness status
    const isDocComplete = activeWcc.docMrSigned && 
                          activeWcc.docDeliveryPhoto && 
                          activeWcc.docWorkOrderCopy && 
                          activeWcc.docGrn && 
                          activeWcc.docSupplierInvoice;

    return (
      <div className="space-y-6 select-none pb-20 max-w-[1600px] mx-auto" id="wcc-closure-detail-container">

      <div className="flex flex-col md:flex-row items-center justify-between bg-white p-4 rounded-xl border border-[#D3D1C7] shadow-sm gap-4">
        <div className="flex items-center gap-4 w-full md:w-auto">
          <button 
            onClick={closePanel}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 hover:bg-gray-200 rounded-lg text-sm font-semibold transition-colors"
          >
            &larr; Back to List
          </button>
          <div className="h-8 w-px bg-gray-300 mx-2 hidden md:block"></div>
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <span className="font-mono font-bold text-lg text-[#2C2C2A]">{activeWcc.mrRef}</span>
              <span className={`px-2 py-0.5 rounded border text-[10px] font-bold ${
                activeWcc.wccStatus === 'Approved' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 
                activeWcc.wccStatus === 'Applied' ? 'bg-sky-50 text-sky-700 border-sky-200' : 'bg-amber-50 text-amber-700 border-amber-200'
              }`}>{activeWcc.wccStatus}</span>
            </div>
            <p className="text-xs text-gray-500">WCC Application & PO Reconciliation</p>
          </div>
        </div>
      </div>
      {/* Two column layout: Documents checklist + Finance reconciles */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        
        {/* Left Side (2/3) - Section A Documents Checklist */}
        <div className="lg:col-span-2 bg-white p-5 rounded-xl border border-[#D3D1C7] shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-[#D3D1C7] pb-2">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded bg-[#1D9E75]/10 text-[#1D9E75] flex items-center justify-center font-bold text-xs">A</div>
              <h3 className="text-xs font-bold text-[#2C2C2A] uppercase tracking-wider">
                Section A — Document Checklist
              </h3>
            </div>
            
            <span className={`px-2.5 py-0.5 rounded text-[10px] font-bold border ${
              isDocComplete 
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                : 'bg-amber-50 text-amber-700 border-amber-200'
            }`}>
              {isDocComplete ? '✓ Complete' : '⚠️ Incomplete'}
            </span>
          </div>

          <p className="text-[11px] text-[#5F5E5A] leading-relaxed">
            Verify all standard materials documentation is archived in the DMS. All checks are mandatory prior to Work Completion Certificate (WCC) release.
          </p>

          <div className="space-y-2 text-xs font-sans">
            {[
              { field: 'docMrSigned', label: 'Original MR Signed by site receiver' },
              { field: 'docDeliveryPhoto', label: 'Delivery completed photo proof' },
              { field: 'docWorkOrderCopy', label: 'Approved Work Order copy' },
              { field: 'docGrn', label: 'Goods Receiving Note (GRN)' },
              { field: 'docSupplierInvoice', label: 'Supplier fiscal invoice' }
            ].map(doc => {
              const isChecked = !!(activeWcc as any)[doc.field];
              return (
                <div key={doc.field} className="flex items-center justify-between p-3 bg-[#F1EFE8]/15 rounded-lg border border-[#D3D1C7]/30">
                  <div className="flex items-center gap-2">
                    <input 
                      type="checkbox" 
                      checked={isChecked}
                      onChange={() => handleToggleDocCheck(doc.field as any)}
                      className="rounded text-[#1D9E75] focus:ring-[#1D9E75] w-4 h-4 cursor-pointer"
                    />
                    <span className="text-xs font-medium text-[#2C2C2A]">{doc.label}</span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {isChecked ? (
                      <span className="text-[10px] text-emerald-600 font-bold bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
                        File attached
                      </span>
                    ) : (
                      <span className="text-[10px] text-[#5F5E5A] italic">
                        Missing
                      </span>
                    )}

                    <button
                      onClick={() => handleSimulateDocUpload(doc.field as any)}
                      className="p-1.5 hover:bg-[#F1EFE8] border border-[#D3D1C7] rounded text-[#2C2C2A] transition-colors bg-white cursor-pointer"
                      title="Upload PDF scan"
                    >
                      <Upload className="w-3.5 h-3.5 text-[#1D9E75]" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Side (1/3) - Section B Basecamp & Section C PO Reconciliation */}
        <div className="space-y-6">
          
          {/* Section B — Basecamp status */}
          <div className="bg-white p-5 rounded-xl border border-[#D3D1C7] shadow-sm space-y-3">
            <div className="flex items-center gap-2 border-b border-[#D3D1C7] pb-2">
              <div className="w-5 h-5 rounded bg-[#1D9E75]/10 text-[#1D9E75] flex items-center justify-center font-bold text-xs">B</div>
              <h3 className="text-xs font-bold text-[#2C2C2A] uppercase tracking-wider">
                Section B — Basecamp Status
              </h3>
            </div>

            <div className="space-y-3 font-sans text-xs">
              <div className="flex flex-col gap-1">
                <label className="text-[10px] text-[#5F5E5A] font-bold uppercase tracking-tight">Basecamp Site Status</label>
                <select
                  value={activeWcc.basecampStatus}
                  onChange={(e) => handleFieldChange('basecampStatus', e.target.value as any)}
                  className="h-9 px-2 border border-[#D3D1C7] rounded-lg bg-white font-semibold text-[#1D9E75]"
                >
                  <option value="Active">Active / Operations Live</option>
                  <option value="Closed on Basecamp">Closed on Basecamp (Decommissioned)</option>
                </select>
              </div>

              {activeWcc.basecampStatus === 'Closed on Basecamp' ? (
                <div className="flex items-center gap-1.5 px-3 py-2 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg text-xs font-bold font-sans">
                  <CheckCircle2 className="w-4 h-4" /> Decommissioned on Basecamp
                </div>
              ) : (
                <div className="p-3 bg-amber-50 text-amber-800 border border-amber-200 rounded-lg text-[10px] leading-relaxed flex items-start gap-1.5 font-sans">
                  <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0" />
                  <div>
                    <span className="font-bold">Warning:</span> Site is still active on Basecamp. Complete site decommissioning prior to final WCC issuance.
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Section C — PO reconciliation */}
          <div className="bg-white p-5 rounded-xl border border-[#D3D1C7] shadow-sm space-y-3">
            <div className="flex items-center gap-2 border-b border-[#D3D1C7] pb-2">
              <div className="w-5 h-5 rounded bg-[#1D9E75]/10 text-[#1D9E75] flex items-center justify-center font-bold text-xs">C</div>
              <h3 className="text-xs font-bold text-[#2C2C2A] uppercase tracking-wider">
                Section C — PO Reconciliation
              </h3>
            </div>

            <div className="space-y-3 font-sans text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] text-[#5F5E5A] font-medium uppercase tracking-tight">PO Number</label>
                  <input 
                    type="text" 
                    value={activeWcc.poNumber} 
                    onChange={(e) => handleFieldChange('poNumber', e.target.value)}
                    className="h-9 px-3 border border-[#D3D1C7] rounded-lg font-mono font-bold" 
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[10px] text-[#5F5E5A] font-medium uppercase tracking-tight">PO Amount (ETB)</label>
                  <input 
                    type="number" 
                    value={activeWcc.poAmount} 
                    onChange={(e) => handleFieldChange('poAmount', Number(e.target.value))}
                    className="h-9 px-3 border border-[#D3D1C7] rounded-lg font-mono" 
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] text-[#5F5E5A] font-medium uppercase tracking-tight">Invoice Amount (ETB)</label>
                  <input 
                    type="number" 
                    value={activeWcc.supplierInvoiceAmount} 
                    onChange={(e) => handleFieldChange('supplierInvoiceAmount', Number(e.target.value))}
                    className="h-9 px-3 border border-[#D3D1C7] rounded-lg font-mono" 
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[10px] text-[#5F5E5A] font-medium uppercase tracking-tight">Variance Ratio %</label>
                  <input 
                    type="text" 
                    value={`${activeWcc.poVariancePercent}%`} 
                    disabled 
                    className="h-9 px-3 border border-[#D3D1C7] bg-[#F1EFE8]/50 rounded-lg font-mono font-bold text-center" 
                  />
                </div>
              </div>

              {activeWcc.poVariancePercent > 0 ? (
                <div className="p-3 bg-red-50 text-red-800 border border-red-200 rounded-lg text-[10px] leading-relaxed flex items-start gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0" />
                  <div>
                    <span className="font-bold">Over-budget:</span> Invoice amount exceeds PO value. Requires standard commercial justification before proceeding to WCC issuance.
                  </div>
                </div>
              ) : (
                <div className="p-2.5 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-lg text-[11px] font-medium flex items-center justify-center gap-1">
                  <CheckCircle2 className="w-4 h-4" /> Reconciliation clear to proceed
                </div>
              )}
            </div>
          </div>

        </div>

      </div>

      {/* Sticky footer */}
      <div className="fixed bottom-0 left-[240px] right-0 h-16 bg-white border-t border-[#D3D1C7] px-6 flex items-center justify-between shadow-md z-40">
        <span className="text-xs text-[#5F5E5A]">
          Checklist Progress: <span className="font-bold text-[#2C2C2A]">{
            [activeWcc.docMrSigned, activeWcc.docDeliveryPhoto, activeWcc.docWorkOrderCopy, activeWcc.docGrn, activeWcc.docSupplierInvoice].filter(Boolean).length
          }/5 verified</span>
        </span>

        <div className="flex items-center gap-3">
          <button
            onClick={handleSaveDraft}
            className="px-4 py-2 border border-[#D3D1C7] bg-white text-[#2C2C2A] hover:bg-[#F1EFE8] rounded-lg text-xs font-sans font-semibold cursor-pointer"
          >
            Save Closure Draft
          </button>
          
          {activeWcc.wccStatus === 'Applied' && (
            <button
              onClick={handleApproveWcc}
              className="px-4 py-2 border border-emerald-600 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-lg text-xs font-sans font-bold cursor-pointer"
            >
              Approve WCC Application
            </button>
          )}

          <button
            onClick={handleSubmitWcc}
            className="flex items-center gap-1 px-5 py-2 bg-[#1D9E75] hover:bg-[#1D9E75]/95 text-white rounded-lg text-xs font-sans font-semibold cursor-pointer transition-all shadow-sm font-sans uppercase"
          >
            <Check className="w-4 h-4" /> Submit WCC Application
          </button>
        </div>
      </div>


      </div>
    );
  }

  return (
    <div className="space-y-6 select-none pb-10 max-w-[1600px] mx-auto" id="wcc-closure-container">
      <div className="space-y-5 bg-white p-6 rounded-xl border border-[#D3D1C7] shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-[#2C2C2A]">Work Completion & Closure (WCC)</h2>
            <p className="text-sm text-[#5F5E5A]">Manage job closeouts, document checks, and finance reconciliations.</p>
          </div>
          <button
            onClick={startNewWcc}
            className="flex items-center gap-1.5 px-4 py-2 bg-[#1D9E75] hover:bg-[#168561] text-white rounded-lg text-xs font-sans font-semibold cursor-pointer transition-colors"
          >
            <Plus className="w-4 h-4" /> Create New WCC Draft
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="rounded-xl border border-[#D3D1C7] bg-[#F1EFE8]/40 p-4">
            <p className="text-[10px] uppercase tracking-wider text-[#5F5E5A] font-semibold">Total Applications</p>
            <p className="mt-2 text-2xl font-bold text-[#2C2C2A]">{kpis.total}</p>
          </div>
          <div className="rounded-xl border border-[#D3D1C7] bg-[#F1EFE8]/40 p-4">
            <p className="text-[10px] uppercase tracking-wider text-[#5F5E5A] font-semibold">Drafts / Incomplete</p>
            <p className="mt-2 text-2xl font-bold text-gray-600">{kpis.drafts}</p>
          </div>
          <div className="rounded-xl border border-[#D3D1C7] bg-[#F1EFE8]/40 p-4">
            <p className="text-[10px] uppercase tracking-wider text-[#5F5E5A] font-semibold">Pending Approval</p>
            <p className="mt-2 text-2xl font-bold text-sky-600">{kpis.pendingApproval}</p>
          </div>
          <div className="rounded-xl border border-[#D3D1C7] bg-[#F1EFE8]/40 p-4">
            <p className="text-[10px] uppercase tracking-wider text-[#5F5E5A] font-semibold">Approved / Closed</p>
            <p className="mt-2 text-2xl font-bold text-[#1D9E75]">{kpis.approved}</p>
          </div>
        </div>

        {/* List View */}
        <div className="bg-white rounded-xl border border-[#D3D1C7] shadow-sm overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-[#D3D1C7] text-xs font-sans font-bold text-[#5F5E5A] uppercase tracking-wider">
                <th className="px-6 py-4">MR Reference</th>
                <th className="px-6 py-4">PO Number</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Checklist</th>
                <th className="px-6 py-4">Variance</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#D3D1C7]/40 text-sm font-sans text-[#2C2C2A]">
              {wccClosures.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-16 text-center text-[#5F5E5A]">
                    <Briefcase className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                    <p className="font-medium text-gray-700">No WCC records found</p>
                  </td>
                </tr>
              ) : (
                wccClosures.map(wcc => (
                  <tr key={wcc.mrRef} className="hover:bg-gray-50 transition-colors cursor-pointer" onClick={() => setSelectedMrRef(wcc.mrRef)}>
                    <td className="px-6 py-4 font-mono font-bold text-[#1D9E75]">{wcc.mrRef}</td>
                    <td className="px-6 py-4 font-mono text-gray-600">{wcc.poNumber || '—'}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        wcc.wccStatus === 'Approved' ? 'bg-emerald-100 text-emerald-800' :
                        wcc.wccStatus === 'Applied' ? 'bg-sky-100 text-sky-800' :
                        'bg-amber-100 text-amber-900'
                      }`}>
                        {wcc.wccStatus}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      { [wcc.docMrSigned, wcc.docDeliveryPhoto, wcc.docWorkOrderCopy, wcc.docGrn, wcc.docSupplierInvoice].filter(Boolean).length } / 5
                    </td>
                    <td className="px-6 py-4">
                      {wcc.poVariancePercent > 0 ? (
                        <span className="text-red-600 font-bold">+{wcc.poVariancePercent}%</span>
                      ) : (
                        <span className="text-gray-500">None</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-3">
                        <button onClick={(e) => { e.stopPropagation(); setSelectedMrRef(wcc.mrRef); }} className="text-[#1D9E75] hover:text-[#168561] font-semibold text-xs flex items-center gap-1 transition-colors"><Eye className="w-3.5 h-3.5"/> View</button>
                        <button onClick={(e) => { e.stopPropagation(); setSelectedMrRef(wcc.mrRef); }} className="text-amber-600 hover:text-amber-700 font-semibold text-xs flex items-center gap-1 transition-colors"><Edit2 className="w-3.5 h-3.5"/> Edit</button>
                        <button onClick={(e) => { e.stopPropagation(); if (onRemoveWcc) onRemoveWcc(wcc.mrRef); }} className="text-red-500 hover:text-red-700 font-semibold text-xs flex items-center gap-1 transition-colors"><Trash2 className="w-3.5 h-3.5"/> Delete</button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

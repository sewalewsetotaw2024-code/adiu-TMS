import React, { useState, useEffect } from 'react';
import { WccClosure, MR } from '../types';
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
}

export default function WccScreen({ wccClosures, mrs, onSaveWcc }: WccScreenProps) {
  const [selectedMrRef, setSelectedMrRef] = useState(wccClosures[0]?.mrRef || '');
  const [activeWcc, setActiveWcc] = useState<WccClosure | null>(null);

  // Sync state when selected MR changes
  useEffect(() => {
    const record = wccClosures.find(w => w.mrRef === selectedMrRef);
    if (record) {
      setActiveWcc(JSON.parse(JSON.stringify(record)));
    } else if (wccClosures.length > 0) {
      setActiveWcc(JSON.parse(JSON.stringify(wccClosures[0])));
      setSelectedMrRef(wccClosures[0].mrRef);
    }
  }, [selectedMrRef, wccClosures]);

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

  if (!activeWcc) return null;

  // Determine doc checklist completeness status
  const isDocComplete = activeWcc.docMrSigned && 
                        activeWcc.docDeliveryPhoto && 
                        activeWcc.docWorkOrderCopy && 
                        activeWcc.docGrn && 
                        activeWcc.docSupplierInvoice;

  return (
    <div className="space-y-6 select-none pb-20" id="wcc-closure-container">
      
      {/* Selector row */}
      <div className="flex flex-wrap items-center justify-between bg-white p-4 rounded-xl border border-[#D3D1C7] gap-3">
        <div className="flex items-center gap-3">
          <span className="text-xs font-semibold text-[#5F5E5A]">Select Closure Request:</span>
          <select 
            id="wcc-selector"
            value={selectedMrRef} 
            onChange={(e) => setSelectedMrRef(e.target.value)}
            className="h-9 px-3 rounded-lg border border-[#D3D1C7] text-xs font-sans text-[#2C2C2A] bg-[#F1EFE8]/30 focus:outline-none focus:border-[#1D9E75]"
          >
            {wccClosures.map(w => (
              <option key={w.mrRef} value={w.mrRef}>{w.mrRef} (PO: {w.poNumber})</option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-[#5F5E5A]">WCC Application Status:</span>
          <span className={`px-3 py-1 rounded-full font-bold text-xs uppercase tracking-tight border ${
            activeWcc.wccStatus === 'Approved' 
              ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
              : activeWcc.wccStatus === 'Applied'
              ? 'bg-sky-50 text-sky-700 border-sky-200'
              : 'bg-amber-50 text-amber-700 border-amber-200'
          }`}>
            {activeWcc.wccStatus}
          </span>
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

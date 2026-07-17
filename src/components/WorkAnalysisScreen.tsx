import React, { useState, useEffect } from 'react';
import { WorkAnalysis, WorkAnalysisSite, MR } from '../types';
import { TL_STAFF, TIM_STAFF, TRUCK_TYPES } from '../data';
import { Save, Check, ShieldAlert, FileText, Plus, Trash2, ArrowRight } from 'lucide-react';

interface WorkAnalysisScreenProps {
  workAnalyses: WorkAnalysis[];
  mrs: MR[];
  onSaveWorkAnalysis: (wa: WorkAnalysis) => void;
  selectedMrRef: string | null;
}

export default function WorkAnalysisScreen({ 
  workAnalyses, 
  mrs, 
  onSaveWorkAnalysis,
  selectedMrRef 
}: WorkAnalysisScreenProps) {
  
  const [activeWa, setActiveWa] = useState<WorkAnalysis | null>(null);
  const [selectedWaId, setSelectedWaId] = useState<string>('');

  // When selected WA changes or is initialized
  useEffect(() => {
    if (selectedWaId) {
      const wa = workAnalyses.find(w => w.id === selectedWaId);
      if (wa) {
        setActiveWa(JSON.parse(JSON.stringify(wa)));
        return;
      }
    }

    // Fallback: search if we have a WA for the current selectedMrRef
    if (selectedMrRef) {
      const wa = workAnalyses.find(w => w.mrRef === selectedMrRef);
      if (wa) {
        setActiveWa(JSON.parse(JSON.stringify(wa)));
        setSelectedWaId(wa.id);
        return;
      }
    }

    // Default to first WA, or initialize a new draft for the selected MR
    if (workAnalyses.length > 0 && !selectedMrRef) {
      setActiveWa(JSON.parse(JSON.stringify(workAnalyses[0])));
      setSelectedWaId(workAnalyses[0].id);
    } else {
      handleInitNewWa(selectedMrRef || (mrs[0]?.mrNumber || ''));
    }
  }, [selectedWaId, selectedMrRef, workAnalyses]);

  const handleInitNewWa = (mrRefNum: string) => {
    const matchedMr = mrs.find(m => m.mrNumber === mrRefNum);
    const initialSites: WorkAnalysisSite[] = matchedMr 
      ? matchedMr.lineItems.map((li, idx) => ({
          id: `was-${idx}-${Date.now()}`,
          siteId: li.siteId,
          siteName: li.siteName,
          latitude: li.latitude,
          longitude: li.longitude,
          mwLinks: li.mwLinks,
          town: li.town,
          projectScope: li.projectScope,
          zoneManager: li.zoneManager,
          implementationPriority: li.implementationPriority,
          distance: li.distance,
          recommendedTruck: '3-ton'
        }))
      : [];

    const totalDist = initialSites.reduce((sum, site) => sum + site.distance, 0);

    const nextNum = 91 + workAnalyses.length;
    const newWa: WorkAnalysis = {
      id: `WA-2026-00${nextNum}`,
      mrRef: mrRefNum,
      date: new Date().toISOString().split('T')[0],
      preparedBy: matchedMr?.assignedTl || TL_STAFF[0],
      sites: initialSites,
      truckTypeRecommended: '3-ton',
      totalSites: initialSites.length,
      totalDistance: totalDist,
      estimatedTrips: 1,
      specialRequirements: ['Last-mile labour'],
      keyRisks: '',
      scopeNegotiationNotes: '',
      validatedBy: TIM_STAFF[0],
      validationDate: '',
      status: 'Pending'
    };

    setActiveWa(newWa);
  };

  // Realtime sum and calculation when sites distance/recommended trucks change
  const handleSiteFieldChange = (index: number, field: keyof WorkAnalysisSite, value: any) => {
    if (!activeWa) return;
    const updatedSites = [...activeWa.sites];
    updatedSites[index] = {
      ...updatedSites[index],
      [field]: value
    };

    // Calculate sum
    const totalDist = updatedSites.reduce((sum, site) => sum + Number(site.distance || 0), 0);

    setActiveWa({
      ...activeWa,
      sites: updatedSites,
      totalSites: updatedSites.length,
      totalDistance: totalDist
    });
  };

  const handleAddSiteRow = () => {
    if (!activeWa) return;
    const newSite: WorkAnalysisSite = {
      id: `was-add-${Date.now()}`,
      siteId: '',
      siteName: '',
      latitude: 0,
      longitude: 0,
      mwLinks: 'None',
      town: '',
      projectScope: '',
      zoneManager: '',
      implementationPriority: 'Medium',
      distance: 0,
      recommendedTruck: '3-ton'
    };
    const updated = [...activeWa.sites, newSite];
    setActiveWa({
      ...activeWa,
      sites: updated,
      totalSites: updated.length
    });
  };

  const handleRemoveSiteRow = (index: number) => {
    if (!activeWa) return;
    const updated = activeWa.sites.filter((_, i) => i !== index);
    const totalDist = updated.reduce((sum, site) => sum + Number(site.distance || 0), 0);
    setActiveWa({
      ...activeWa,
      sites: updated,
      totalSites: updated.length,
      totalDistance: totalDist
    });
  };

  const handleSpecialReqToggle = (req: string) => {
    if (!activeWa) return;
    const current = activeWa.specialRequirements || [];
    const updated = current.includes(req) 
      ? current.filter(r => r !== req) 
      : [...current, req];
    
    setActiveWa({
      ...activeWa,
      specialRequirements: updated
    });
  };

  const handleSave = () => {
    if (!activeWa) return;
    onSaveWorkAnalysis(activeWa);
    alert(`Work analysis ${activeWa.id} successfully saved as draft!`);
  };

  const handleSubmitValidation = () => {
    if (!activeWa) return;
    const updated = {
      ...activeWa,
      status: 'Validated' as const,
      validationDate: new Date().toISOString().split('T')[0]
    };
    onSaveWorkAnalysis(updated);
    setActiveWa(updated);
    alert(`Work analysis ${updated.id} validated successfully. It has cleared the planning stage.`);
  };

  if (!activeWa) return null;

  const specialReqsList = ['Security escort', 'Night delivery', 'Last-mile labour', 'Refrigeration'];

  return (
    <div className="space-y-6 select-none pb-20" id="work-analysis-container">
      {/* Selection row */}
      <div className="flex flex-wrap items-center justify-between bg-white p-4 rounded-xl border border-[#D3D1C7] gap-3">
        <div className="flex items-center gap-3">
          <span className="text-xs font-semibold text-[#5F5E5A]">Select analysis record:</span>
          <select 
            id="wa-selector"
            value={selectedWaId}
            onChange={(e) => {
              setSelectedWaId(e.target.value);
            }}
            className="h-9 px-3 rounded-lg border border-[#D3D1C7] text-xs font-sans text-[#2C2C2A] bg-[#F1EFE8]/30 focus:outline-none focus:border-[#1D9E75]"
          >
            {workAnalyses.map(w => (
              <option key={w.id} value={w.id}>{w.id} (MR: {w.mrRef})</option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs font-semibold text-[#5F5E5A]">Create for MR:</span>
          <select 
            id="wa-mr-linker"
            onChange={(e) => {
              if (e.target.value) handleInitNewWa(e.target.value);
            }}
            defaultValue=""
            className="h-9 px-3 rounded-lg border border-[#D3D1C7] text-xs font-sans text-[#2C2C2A] bg-[#F1EFE8]/30 focus:outline-none focus:border-[#1D9E75]"
          >
            <option value="" disabled>-- Select MR request --</option>
            {mrs.map(m => (
              <option key={m.mrNumber} value={m.mrNumber}>{m.mrNumber}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Analysis Form Container */}
      <div className="space-y-6 bg-white p-6 rounded-xl border border-[#D3D1C7] shadow-sm">
        
        {/* Section A — Header */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 border-b border-[#D3D1C7] pb-2">
            <div className="w-5 h-5 rounded bg-[#1D9E75]/10 text-[#1D9E75] flex items-center justify-center font-bold text-xs">A</div>
            <h2 className="text-xs font-bold text-[#2C2C2A] uppercase tracking-wider">Section A — General Header</h2>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs font-sans">
            <div className="flex flex-col gap-1">
              <label className="text-[11px] text-[#5F5E5A] font-medium uppercase tracking-tight">Work analysis number</label>
              <input type="text" value={activeWa.id} disabled className="h-9 px-3 border border-[#D3D1C7] rounded-lg bg-[#F1EFE8]/50 text-[#5F5E5A] font-mono font-semibold" />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[11px] text-[#5F5E5A] font-medium uppercase tracking-tight">MR reference</label>
              <input type="text" value={activeWa.mrRef} disabled className="h-9 px-3 border border-[#D3D1C7] rounded-lg bg-[#F1EFE8]/50 text-[#5F5E5A] font-semibold" />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[11px] text-[#5F5E5A] font-medium uppercase tracking-tight">Date prepared</label>
              <input 
                type="date" 
                value={activeWa.date} 
                onChange={(e) => setActiveWa({ ...activeWa, date: e.target.value })}
                className="h-9 px-2 border border-[#D3D1C7] rounded-lg focus:outline-none focus:border-[#1D9E75]" 
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[11px] text-[#5F5E5A] font-medium uppercase tracking-tight">Prepared by (TL)</label>
              <select 
                value={activeWa.preparedBy} 
                onChange={(e) => setActiveWa({ ...activeWa, preparedBy: e.target.value })}
                className="h-9 px-2 border border-[#D3D1C7] rounded-lg focus:outline-none focus:border-[#1D9E75]"
              >
                {TL_STAFF.map(tl => (
                  <option key={tl} value={tl}>{tl}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Section B — Site summary table */}
        <div className="space-y-3">
          <div className="flex items-center justify-between border-b border-[#D3D1C7] pb-2">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded bg-[#1D9E75]/10 text-[#1D9E75] flex items-center justify-center font-bold text-xs">B</div>
              <h2 className="text-xs font-bold text-[#2C2C2A] uppercase tracking-wider">Section B — Site Summary</h2>
            </div>
            <button
              onClick={handleAddSiteRow}
              className="px-2.5 py-1 text-[10px] border border-dashed border-[#1D9E75] text-[#1D9E75] hover:bg-[#1D9E75]/5 rounded-md font-sans font-medium"
            >
              + Add Site Summary Row
            </button>
          </div>

          <div className="overflow-x-auto border border-[#D3D1C7]/60 rounded-lg">
            <table className="w-full text-left border-collapse" id="site-summary-table">
              <thead>
                <tr className="bg-[#F1EFE8]/45 border-b border-[#D3D1C7]/80 text-[10px] font-sans font-semibold text-[#5F5E5A] uppercase tracking-wider">
                  <th className="p-2 text-center">No</th>
                  <th className="p-2">Site ID</th>
                  <th className="p-2">Site Name</th>
                  <th className="p-2">Town</th>
                  <th className="p-2 text-right">Lat</th>
                  <th className="p-2 text-right">Long</th>
                  <th className="p-2">MW Links</th>
                  <th className="p-2 text-right">Distance (km)</th>
                  <th className="p-2">Recommended Truck</th>
                  <th className="p-2 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#D3D1C7]/40 text-xs font-sans text-[#2C2C2A]">
                {activeWa.sites.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="p-6 text-center text-[#5F5E5A] italic">
                      No sites added to analysis summary yet.
                    </td>
                  </tr>
                ) : (
                  activeWa.sites.map((site, index) => (
                    <tr key={site.id} className="hover:bg-[#F1EFE8]/20 transition-colors">
                      <td className="p-2 text-center font-mono text-[#5F5E5A]">{index + 1}</td>
                      <td className="p-2">
                        <input 
                          type="text" 
                          value={site.siteId} 
                          onChange={(e) => handleSiteFieldChange(index, 'siteId', e.target.value)}
                          className="w-24 h-8 px-1 border border-[#D3D1C7] rounded text-xs focus:outline-none"
                          placeholder="e.g. ET-ADD-01"
                        />
                      </td>
                      <td className="p-2">
                        <input 
                          type="text" 
                          value={site.siteName} 
                          onChange={(e) => handleSiteFieldChange(index, 'siteName', e.target.value)}
                          className="w-36 h-8 px-1 border border-[#D3D1C7] rounded text-xs focus:outline-none"
                          placeholder="Site name"
                        />
                      </td>
                      <td className="p-2">
                        <input 
                          type="text" 
                          value={site.town} 
                          onChange={(e) => handleSiteFieldChange(index, 'town', e.target.value)}
                          className="w-24 h-8 px-1 border border-[#D3D1C7] rounded text-xs focus:outline-none"
                          placeholder="Town"
                        />
                      </td>
                      <td className="p-2 text-right font-mono">
                        <input 
                          type="number" 
                          step="0.0001"
                          value={site.latitude} 
                          onChange={(e) => handleSiteFieldChange(index, 'latitude', Number(e.target.value))}
                          className="w-16 h-8 text-right border border-[#D3D1C7] rounded text-xs focus:outline-none"
                        />
                      </td>
                      <td className="p-2 text-right font-mono">
                        <input 
                          type="number" 
                          step="0.0001"
                          value={site.longitude} 
                          onChange={(e) => handleSiteFieldChange(index, 'longitude', Number(e.target.value))}
                          className="w-16 h-8 text-right border border-[#D3D1C7] rounded text-xs focus:outline-none"
                        />
                      </td>
                      <td className="p-2">
                        <input 
                          type="text" 
                          value={site.mwLinks} 
                          onChange={(e) => handleSiteFieldChange(index, 'mwLinks', e.target.value)}
                          className="w-28 h-8 px-1 border border-[#D3D1C7] rounded text-xs focus:outline-none"
                          placeholder="MW Link Details"
                        />
                      </td>
                      <td className="p-2 text-right font-mono">
                        <input 
                          type="number" 
                          value={site.distance} 
                          onChange={(e) => handleSiteFieldChange(index, 'distance', Number(e.target.value))}
                          className="w-16 h-8 text-right border border-[#D3D1C7] rounded text-xs focus:outline-none"
                        />
                      </td>
                      <td className="p-2">
                        <select
                          value={site.recommendedTruck}
                          onChange={(e) => handleSiteFieldChange(index, 'recommendedTruck', e.target.value)}
                          className="h-8 px-1 border border-[#D3D1C7] rounded text-xs focus:outline-none"
                        >
                          {TRUCK_TYPES.map(t => (
                            <option key={t} value={t}>{t}</option>
                          ))}
                        </select>
                      </td>
                      <td className="p-2 text-center">
                        <button
                          onClick={() => handleRemoveSiteRow(index)}
                          className="p-1 hover:bg-red-50 rounded text-red-600 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Section C — Truck & cost analysis */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 border-b border-[#D3D1C7] pb-2">
            <div className="w-5 h-5 rounded bg-[#1D9E75]/10 text-[#1D9E75] flex items-center justify-center font-bold text-xs">C</div>
            <h2 className="text-xs font-bold text-[#2C2C2A] uppercase tracking-wider">Section C — Truck & Cost Analysis</h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 text-xs font-sans">
            
            {/* Numeric controls */}
            <div className="space-y-3 bg-[#F1EFE8]/25 p-4 rounded-xl border border-[#D3D1C7]/60">
              <div className="flex flex-col gap-1">
                <label className="text-[11px] text-[#5F5E5A] font-medium uppercase tracking-tight">Truck type recommended</label>
                <select 
                  value={activeWa.truckTypeRecommended}
                  onChange={(e) => setActiveWa({ ...activeWa, truckTypeRecommended: e.target.value as any })}
                  className="h-9 px-2 border border-[#D3D1C7] rounded-lg focus:outline-none bg-white"
                >
                  {TRUCK_TYPES.map(t => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] text-[#5F5E5A] font-medium uppercase tracking-tight">Total sites</label>
                  <input type="text" value={activeWa.totalSites} disabled className="h-9 px-2 border border-[#D3D1C7]/80 rounded-lg text-center bg-[#F1EFE8]/40 text-[#2C2C2A] font-bold" />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] text-[#5F5E5A] font-medium uppercase tracking-tight">Tot dist (km)</label>
                  <input type="text" value={activeWa.totalDistance} disabled className="h-9 px-2 border border-[#D3D1C7]/80 rounded-lg text-center bg-[#F1EFE8]/40 text-[#2C2C2A] font-bold" />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] text-[#5F5E5A] font-medium uppercase tracking-tight">Est. trips</label>
                  <input 
                    type="number" 
                    value={activeWa.estimatedTrips} 
                    onChange={(e) => setActiveWa({ ...activeWa, estimatedTrips: Number(e.target.value) })}
                    className="h-9 px-2 border border-[#D3D1C7] rounded-lg text-center bg-white" 
                  />
                </div>
              </div>

              {/* Special Requirements Checklist */}
              <div className="space-y-1.5 pt-2">
                <label className="text-[11px] text-[#5F5E5A] font-medium uppercase tracking-tight block">Special requirements</label>
                <div className="space-y-1">
                  {specialReqsList.map(req => {
                    const isChecked = activeWa.specialRequirements?.includes(req);
                    return (
                      <label key={req} className="flex items-center gap-2 cursor-pointer select-none py-1">
                        <input 
                          type="checkbox" 
                          checked={isChecked}
                          onChange={() => handleSpecialReqToggle(req)}
                          className="rounded border-[#D3D1C7] text-[#1D9E75] focus:ring-[#1D9E75] w-3.5 h-3.5"
                        />
                        <span className="text-[11px] text-[#2C2C2A]">{req}</span>
                      </label>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Key Risks */}
            <div className="flex flex-col gap-1 bg-[#F1EFE8]/25 p-4 rounded-xl border border-[#D3D1C7]/60">
              <label className="text-[11px] text-[#5F5E5A] font-medium uppercase tracking-tight">Key risks & constraints</label>
              <textarea 
                rows={5}
                placeholder="Identify safety issues, road accessibility issues, municipal bans, or security bottlenecks..."
                value={activeWa.keyRisks}
                onChange={(e) => setActiveWa({ ...activeWa, keyRisks: e.target.value })}
                className="flex-1 p-3 border border-[#D3D1C7] rounded-lg bg-white focus:outline-none focus:border-[#1D9E75]"
              />
            </div>

            {/* Scope Negotiation Notes */}
            <div className="flex flex-col gap-1 bg-[#F1EFE8]/25 p-4 rounded-xl border border-[#D3D1C7]/60">
              <label className="text-[11px] text-[#5F5E5A] font-medium uppercase tracking-tight">Scope negotiation notes</label>
              <textarea 
                rows={5}
                placeholder="Detail concessions, offloading agreements, or specialized vendor discussions..."
                value={activeWa.scopeNegotiationNotes}
                onChange={(e) => setActiveWa({ ...activeWa, scopeNegotiationNotes: e.target.value })}
                className="flex-1 p-3 border border-[#D3D1C7] rounded-lg bg-white focus:outline-none focus:border-[#1D9E75]"
              />
            </div>
          </div>
        </div>

        {/* Section D — Validation */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 border-b border-[#D3D1C7] pb-2">
            <div className="w-5 h-5 rounded bg-[#1D9E75]/10 text-[#1D9E75] flex items-center justify-center font-bold text-xs">D</div>
            <h2 className="text-xs font-bold text-[#2C2C2A] uppercase tracking-wider">Section D — Validation Security Clearance</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-sans items-center bg-[#F1EFE8]/15 p-4 rounded-xl border border-[#D3D1C7]">
            {/* Status indicators */}
            <div className="flex flex-col gap-1">
              <label className="text-[11px] text-[#5F5E5A] font-medium uppercase tracking-tight">Validation status</label>
              <div className="flex items-center gap-2 mt-1">
                <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${
                  activeWa.status === 'Validated' 
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                    : activeWa.status === 'Negotiation required'
                    ? 'bg-red-50 text-red-700 border-red-200'
                    : 'bg-amber-50 text-amber-700 border-amber-200'
                }`}>
                  ● {activeWa.status}
                </span>
                
                {/* Trigger validation status */}
                <select
                  value={activeWa.status}
                  onChange={(e) => setActiveWa({ ...activeWa, status: e.target.value as any })}
                  className="h-8 px-2 border border-[#D3D1C7] rounded text-xs bg-white focus:outline-none"
                >
                  <option value="Pending">Pending</option>
                  <option value="Validated">Validated</option>
                  <option value="Negotiation required">Negotiation required</option>
                </select>
              </div>
            </div>

            {/* Validated by e-signature placeholder */}
            <div className="flex flex-col gap-1">
              <label className="text-[11px] text-[#5F5E5A] font-medium uppercase tracking-tight">Validated by (ST&PIM M)</label>
              <div className="relative">
                <input 
                  type="text" 
                  value={activeWa.validatedBy}
                  onChange={(e) => setActiveWa({ ...activeWa, validatedBy: e.target.value })}
                  className="w-full h-9 pl-3 pr-24 border border-[#D3D1C7] rounded-lg focus:outline-none focus:border-[#1D9E75] font-sans font-semibold text-xs italic"
                  placeholder="Manager name"
                />
                <span className="absolute right-2 top-1.5 px-2 py-0.5 bg-[#1D9E75]/10 text-[#1D9E75] border border-[#1D9E75]/30 rounded text-[9px] font-bold tracking-wider uppercase font-mono">
                  E-Signature
                </span>
              </div>
            </div>

            {/* Validation Date */}
            <div className="flex flex-col gap-1">
              <label className="text-[11px] text-[#5F5E5A] font-medium uppercase tracking-tight">Validation date</label>
              <input 
                type="date" 
                value={activeWa.validationDate || ''} 
                onChange={(e) => setActiveWa({ ...activeWa, validationDate: e.target.value })}
                className="h-9 px-2 border border-[#D3D1C7] rounded-lg focus:outline-none focus:border-[#1D9E75]"
              />
            </div>
          </div>
        </div>

      </div>

      {/* Sticky footer with Save draft and Submit / Proceed buttons */}
      <div className="fixed bottom-0 left-[240px] right-0 h-16 bg-white border-t border-[#D3D1C7] px-6 flex items-center justify-between shadow-md z-40">
        <span className="text-xs text-[#5F5E5A] italic">
          Sites: <span className="font-bold text-[#2C2C2A]">{activeWa.totalSites}</span> | Total Distance: <span className="font-bold text-[#2C2C2A]">{activeWa.totalDistance} km</span>
        </span>

        <div className="flex items-center gap-3">
          <button
            id="wa-save-draft-btn"
            onClick={handleSave}
            className="flex items-center gap-1 px-4 py-2 border border-[#D3D1C7] bg-white hover:bg-[#F1EFE8] text-[#2C2C2A] rounded-lg text-xs font-sans font-semibold cursor-pointer transition-colors"
          >
            Save analysis draft
          </button>
          
          <button
            id="wa-validate-btn"
            onClick={handleSubmitValidation}
            className="flex items-center gap-1 px-5 py-2 bg-[#1D9E75] hover:bg-[#1D9E75]/95 text-white rounded-lg text-xs font-sans font-semibold cursor-pointer transition-all shadow-sm"
          >
            <Check className="w-3.5 h-3.5" /> Submit validation
          </button>
        </div>
      </div>
    </div>
  );
}

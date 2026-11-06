import React, { useState, useEffect } from 'react';
import { WorkAnalysis, WorkAnalysisSite, MR, StoreCluster, ProjectSite } from '../types';
import { TL_STAFF, TIM_STAFF, TRUCK_TYPES } from '../data';
import { Save, Check, ShieldAlert, FileText, Plus, Trash2, ArrowRight, Eye, Edit2, Route } from 'lucide-react';
import { ExportDropdown } from './ExportDropdown';

interface WorkAnalysisScreenProps {
  workAnalyses: WorkAnalysis[];
  mrs: MR[];
  sites: ProjectSite[];
  clusters: StoreCluster[];
  onSaveWorkAnalysis: (wa: WorkAnalysis) => void;
  onRemoveWorkAnalysis?: (waId: string) => void;
  selectedMrRef: string | null;
}

export default function WorkAnalysisScreen({ 
  workAnalyses, 
  mrs, 
  sites,
  clusters,
  onSaveWorkAnalysis,
  onRemoveWorkAnalysis,
  selectedMrRef 
}: WorkAnalysisScreenProps) {
  
  const [activeWa, setActiveWa] = useState<WorkAnalysis | null>(null);
  const [selectedWaId, setSelectedWaId] = useState<string>('');
  const [viewMode, setViewMode] = useState<'list' | 'detail'>('list');
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [selectedClusterIds, setSelectedClusterIds] = useState<string[]>([]);
  const [activeClusterId, setActiveClusterId] = useState<string | null>(null);

  const cloneWorkAnalysis = (wa: WorkAnalysis): WorkAnalysis => JSON.parse(JSON.stringify({
    ...wa,
    sites: wa.sites.map(site => ({ ...site, included: site.included ?? true }))
  }));

  useEffect(() => {
    // Add any initialization logic if necessary, though selectedMrRef is now unused at the top level
  }, [selectedMrRef]);

  const previewClusterId = activeClusterId && selectedClusterIds.includes(activeClusterId)
    ? activeClusterId
    : selectedClusterIds[0] || null;

  const previewCluster = clusters.find(cluster => cluster.id === previewClusterId) || null;
  const previewClusterSites = previewCluster
    ? sites.filter(site => previewCluster.assignedSites.includes(site.siteId))
    : [];

  const handleToggleCluster = (clusterId: string) => {
    setSelectedClusterIds([clusterId]);
    setActiveClusterId(clusterId);
  };

  const handleStartNewWa = () => {
    setIsCreatingNew(true);
    setViewMode('detail');
    setSelectedClusterIds([]);
    setActiveClusterId(null);
    const newWa: WorkAnalysis = {
      id: `DRAFT_NEW`,
      mrRef: 'Multiple (See Sites)',
      clusterRef: '',
      warehouseName: '',
      route: '',
      date: new Date().toISOString().split('T')[0],
      preparedBy: TL_STAFF[0],
      sites: [],
      truckTypeRecommended: '3-ton',
      totalSites: 0,
      totalDistance: 0,
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

  const handleViewDetail = (waId: string) => {
    const wa = workAnalyses.find(w => w.id === waId);
    setIsCreatingNew(false);
    setSelectedWaId(waId);
    setActiveWa(wa ? cloneWorkAnalysis(wa) : null);
    setViewMode('detail');
  };

  useEffect(() => {
    if (selectedWaId && selectedWaId !== 'DRAFT_NEW') {
      const wa = workAnalyses.find(w => w.id === selectedWaId);
      if (wa) {
        setActiveWa(cloneWorkAnalysis(wa));
        return;
      }
    }

    if (viewMode === 'detail' && selectedMrRef) {
      const wa = workAnalyses.find(w => w.mrRef === selectedMrRef);
      if (wa) {
        setActiveWa(cloneWorkAnalysis(wa));
        setSelectedWaId(wa.id);
        return;
      }
    }

    if (viewMode === 'list') {
      setActiveWa(null);
    }
  }, [selectedWaId, selectedMrRef, workAnalyses, viewMode]);

  const computeSummaryFields = (sites: WorkAnalysisSite[], warehouseName: string = '') => {
    const includedSites = sites.filter(site => site.included !== false);
    const totalSites = includedSites.length;
    const totalDistance = includedSites.reduce((max, site) => Math.max(max, Number(site.distance || 0)), 0);
    const townRoute = Array.from(new Set(includedSites.map(site => site.town).filter(Boolean))).join(' â†’ ');
    const route = warehouseName ? [warehouseName, townRoute].filter(Boolean).join(' â†’ ') : townRoute;
    return { totalSites, totalDistance, route };
  };

  const handleClusterSelect = (clusterId: string) => {
    const cluster = clusters.find(c => c.id === clusterId);
    if (!cluster || !activeWa) return;

    const clusterSitesMap = new Map<string, WorkAnalysisSite>();
    sites
      .filter(site => cluster.assignedSites.includes(site.siteId))
      .forEach(site => {
        if (!clusterSitesMap.has(site.siteId)) {
          clusterSitesMap.set(site.siteId, {
            id: `was-${site.siteId}-${Date.now()}`,
            siteId: site.siteId,
            siteName: site.siteName,
            latitude: site.latitude,
            longitude: site.longitude,
            mwLinks: 'None',
            town: site.town,
            projectScope: site.projectScope,
            zoneManager: site.zoneManager,
            implementationPriority: site.implementationPriority,
            distance: site.distance,
            recommendedTruck: '3-ton',
            included: true
          });
        }
      });

    const clusterSites = Array.from(clusterSitesMap.values());
    const summary = computeSummaryFields(clusterSites, cluster.warehouseName || cluster.name);

    setActiveWa({
      ...activeWa,
      clusterRef: cluster.code,
      sites: clusterSites,
      totalSites: summary.totalSites,
      totalDistance: summary.totalDistance,
      route: summary.route,
      warehouseName: cluster.warehouseName || cluster.name
    });
  };

  const handleSiteFieldChange = (index: number, field: keyof WorkAnalysisSite, value: any) => {
    if (!activeWa) return;
    const updatedSites = [...activeWa.sites];
    updatedSites[index] = {
      ...updatedSites[index],
      [field]: value
    };

    const summary = computeSummaryFields(updatedSites, activeWa.warehouseName || '');

    setActiveWa({
      ...activeWa,
      sites: updatedSites,
      totalSites: summary.totalSites,
      totalDistance: summary.totalDistance,
      route: summary.route
    });
  };

  const handleToggleSiteIncluded = (index: number) => {
    if (!activeWa) return;
    const updatedSites = [...activeWa.sites];
    updatedSites[index] = {
      ...updatedSites[index],
      included: !(updatedSites[index].included ?? true)
    };

    const summary = computeSummaryFields(updatedSites);

    setActiveWa({
      ...activeWa,
      sites: updatedSites,
      totalSites: summary.totalSites,
      totalDistance: summary.totalDistance,
      route: summary.route
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
      recommendedTruck: '3-ton',
      included: true
    };
    const updated = [...activeWa.sites, newSite];
    const summary = computeSummaryFields(updated, activeWa.warehouseName || '');
    setActiveWa({
      ...activeWa,
      sites: updated,
      totalSites: summary.totalSites,
      totalDistance: summary.totalDistance,
      route: summary.route
    });
  };

  const handleRemoveSiteRow = (index: number) => {
    if (!activeWa) return;
    const updated = activeWa.sites.filter((_, i) => i !== index);
    const summary = computeSummaryFields(updated, activeWa.warehouseName || '');
    setActiveWa({
      ...activeWa,
      sites: updated,
      totalSites: summary.totalSites,
      totalDistance: summary.totalDistance,
      route: summary.route
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

  const handleSave = (action: 'draft' | 'close' | 'new') => {
    if (!activeWa) return;
    
    let waToSave = activeWa;
    if (waToSave.id === 'DRAFT_NEW') {
      const nextNum = 91 + workAnalyses.length;
      waToSave = { ...waToSave, id: `WA-2026-00${nextNum}` };
    }
    
    onSaveWorkAnalysis(waToSave);
    alert(`Work analysis ${waToSave.id} successfully saved!`);
    
    if (action === 'close') {
      setViewMode('list');
      setActiveWa(null);
    } else if (action === 'new') {
      handleStartNewWa();
    } else {
      setActiveWa(waToSave);
      setSelectedWaId(waToSave.id);
      setIsCreatingNew(false);
    }
  };

  const handleSubmitValidation = (approverName: string, statusText: 'Validated' | 'Negotiation required' | 'Pending', notes: string) => {
    if (!activeWa) return;
    
    if (approverName === activeWa.preparedBy) {
      alert("Error: You cannot validate your own Work Analysis. It must be approved by your direct supervisor.");
      return;
    }

    let waToSave = activeWa;
    if (waToSave.id === 'DRAFT_NEW') {
      const nextNum = 91 + workAnalyses.length;
      waToSave = { ...waToSave, id: `WA-2026-00${nextNum}` };
    }

    const trail = waToSave.approvalTrail || [];
    trail.push({
      approverName,
      status: statusText,
      date: new Date().toISOString().split('T')[0],
      notes
    });

    const updated = {
      ...waToSave,
      status: statusText,
      validatedBy: approverName,
      validationDate: new Date().toISOString().split('T')[0],
      approvalTrail: trail
    };
    onSaveWorkAnalysis(updated);
    alert(`Work analysis ${updated.id} ${statusText.toLowerCase()}!`);
    setViewMode('list');
    setActiveWa(null);
  };  const handleExport = async (format: 'excel' | 'pdf' | 'word', id: string) => {
    const targetWa = workAnalyses.find(w => w.id === id);
    if (!targetWa) return;
    const targetData = [targetWa];

    if (format === 'excel') {
      const xlsx = await import('xlsx');
      const ws = xlsx.utils.json_to_sheet(targetData.map(w => ({
        ID: w.id, Prepared_By: w.preparedBy, Date: w.date, Sites: w.totalSites, Distance: w.totalDistance, Status: w.status, Truck_Type: w.truckTypeRecommended
      })));
      const wb = xlsx.utils.book_new();
      xlsx.utils.book_append_sheet(wb, ws, "Work Analysis");
      xlsx.writeFile(wb, `Work_Analysis_${id}.xlsx`);
    } else if (format === 'pdf') {
      const { jsPDF } = await import('jspdf');
      const autoTable = (await import('jspdf-autotable')).default;
      const doc = new jsPDF();
      doc.text(`Work Analysis Report - ${id}`, 14, 15);
      autoTable(doc, {
        startY: 20,
        head: [['ID', 'Prepared By', 'Date', 'Sites', 'Status', 'Truck Type']],
        body: targetData.map(w => [w.id, w.preparedBy, w.date, w.totalSites, w.status, w.truckTypeRecommended]),
      });
      doc.save(`Work_Analysis_${id}.pdf`);
    } else if (format === 'word') {
      const docx = await import('docx');
      const doc = new docx.Document({
        sections: [{
          properties: {},
          children: [
            new docx.Paragraph({ text: `Work Analysis Report - ${id}`, heading: docx.HeadingLevel.HEADING_1 }),
            new docx.Table({
              rows: [
                new docx.TableRow({
                  children: ['ID', 'Prepared By', 'Date', 'Sites', 'Status', 'Truck Type'].map(t => new docx.TableCell({ children: [new docx.Paragraph(t)] }))
                }),
                ...targetData.map(w => new docx.TableRow({
                  children: [w.id, w.preparedBy, w.date, w.totalSites, w.status, w.truckTypeRecommended].map(t => new docx.TableCell({ children: [new docx.Paragraph(String(t))] }))
                }))
              ]
            })
          ]
        }]
      });
      docx.Packer.toBlob(doc).then(blob => {
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `Work_Analysis_${id}.docx`;
        link.click();
      });
    }
  };

  const specialReqsList = ['Security escort', 'Night delivery', 'Last-mile labour', 'Refrigeration'];

  const totalWorkAnalysisCount = workAnalyses.length;
  const validatedCount = workAnalyses.filter(w => w.status === 'Validated').length;
  const pendingCount = totalWorkAnalysisCount - validatedCount;

  if (viewMode === 'list') {
    return (
      <div className="space-y-6 select-none pb-20" id="work-analysis-list-container">
      <div className="space-y-5 bg-white p-6 rounded-xl border border-[#D3D1C7] shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-[#2C2C2A]">Work Analysis</h2>
            <p className="text-sm text-[#5F5E5A]">Create, review, and manage planning summaries for transport requests.</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleStartNewWa}
              className="flex items-center gap-1.5 px-4 py-2 bg-[#1D9E75] hover:bg-[#1D9E75]/90 text-white rounded-lg text-xs font-sans font-semibold cursor-pointer transition-colors"
            >
              <Plus className="w-4 h-4" /> New Work Analysis
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="rounded-xl border border-[#D3D1C7] bg-[#F1EFE8]/40 p-4">
            <p className="text-[10px] uppercase tracking-wider text-[#5F5E5A] font-semibold">Total Analyses</p>
            <p className="mt-2 text-2xl font-bold text-[#2C2C2A]">{totalWorkAnalysisCount}</p>
          </div>
          <div className="rounded-xl border border-[#D3D1C7] bg-[#F1EFE8]/40 p-4">
            <p className="text-[10px] uppercase tracking-wider text-[#5F5E5A] font-semibold">Validated</p>
            <p className="mt-2 text-2xl font-bold text-[#1D9E75]">{validatedCount}</p>
          </div>
          <div className="rounded-xl border border-[#D3D1C7] bg-[#F1EFE8]/40 p-4">
            <p className="text-[10px] uppercase tracking-wider text-[#5F5E5A] font-semibold">Pending</p>
            <p className="mt-2 text-2xl font-bold text-[#D97706]">{pendingCount}</p>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-[#D3D1C7] shadow-sm overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-[#D3D1C7] text-xs font-sans font-bold text-[#5F5E5A] uppercase tracking-wider">
                <th className="px-5 py-4">WA ID</th>`r`n                <th className="px-5 py-4">Route</th>
                
                <th className="px-5 py-4">Prepared By</th>
                <th className="px-5 py-4">Date</th>
                <th className="px-5 py-4">Sites</th>
                <th className="px-5 py-4">Distance</th>
                <th className="px-5 py-4">Truck Type</th>
                <th className="px-5 py-4">Status</th>
                <th className="px-5 py-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#D3D1C7]/40 text-sm font-sans text-[#2C2C2A]">
              {workAnalyses.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-6 py-16 text-center text-[#5F5E5A]">
                    No work analysis records available. Create a work analysis to get started.
                  </td>
                </tr>
              ) : (
                workAnalyses.map((wa) => (
                  <tr key={wa.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-4 font-mono text-[#1D9E75]">{wa.id}</td>
                    <td className="px-5 py-4 font-semibold text-xs text-slate-800">
                      <div className="flex items-center gap-1.5" title={wa.route}>
                        <Route className="w-3.5 h-3.5 text-[#1D9E75] shrink-0" />
                        <span className="truncate max-w-[200px]">
                          {wa.route || (wa.warehouseName ? `${wa.warehouseName} → ${wa.sites?.map(s => s.town).filter(Boolean).join(' → ')}` : wa.sites?.map(s => s.town).filter(Boolean).join(' → ') || 'Direct')}
                        </span>
                      </div>
                    </td>
                    
                    <td className="px-5 py-4">{wa.preparedBy}</td>
                    <td className="px-5 py-4">{wa.date}</td>
                    <td className="px-5 py-4">
                      <details className="cursor-pointer group">
                        <summary className="font-semibold text-[#1D9E75] hover:underline list-none">
                          {wa.totalSites} Sites â–¾
                        </summary>
                        <ul className="mt-2 text-xs text-[#5F5E5A] space-y-1 pl-2 border-l-2 border-[#1D9E75]/30">
                          {wa.sites?.map((s, idx) => (
                            <li key={idx}>- {s.siteName || s.siteId}</li>
                          ))}
                        </ul>
                      </details>
                    </td>
                    <td className="px-5 py-4">{wa.totalDistance} km</td>
                    <td className="px-5 py-4 font-semibold">{wa.truckTypeRecommended}</td>
                    <td className="px-5 py-4">
                      <span className={`px-2 py-1 rounded-full text-[10px] font-semibold ${
                        wa.status === 'Validated' ? 'bg-emerald-100 text-emerald-800' :
                        wa.status === 'Pending' ? 'bg-amber-100 text-amber-800' :
                        'bg-red-100 text-red-700'
                      }`}>
                        {wa.status}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <div className="flex items-center justify-end gap-3">
                        <ExportDropdown onExport={(format) => handleExport(format, wa.id)} />
                        <button onClick={(e) => { e.stopPropagation(); setViewMode('detail'); setActiveWa(wa); }} className="text-[#1D9E75] hover:text-[#168561] font-semibold text-xs flex items-center gap-1 transition-colors"><Eye className="w-3.5 h-3.5"/> View</button>
                        <button onClick={(e) => { e.stopPropagation(); setViewMode('form'); setActiveWa({...wa}); }} className="text-amber-600 hover:text-amber-700 font-semibold text-xs flex items-center gap-1 transition-colors"><Edit2 className="w-3.5 h-3.5"/> Edit</button>
                        <button onClick={(e) => { e.stopPropagation(); if (onRemoveWorkAnalysis) onRemoveWorkAnalysis(wa.id); }} className="text-red-500 hover:text-red-700 font-semibold text-xs flex items-center gap-1 transition-colors"><Trash2 className="w-3.5 h-3.5"/> Delete</button>
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



  if (viewMode === 'detail' && !activeWa) {
    return (
      <div className="space-y-6 select-none pb-20" id="work-analysis-loading-container">
        <div className="bg-white p-6 rounded-xl border border-[#D3D1C7] shadow-sm">
          <h2 className="text-xl font-bold text-[#2C2C2A]">Loading work analysisâ€¦</h2>
          <p className="mt-2 text-sm text-[#5F5E5A]">The selected record is being prepared for editing.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 select-none pb-20" id="work-analysis-container">


      {/* Main Analysis Form Container */}
      <div className="space-y-6 bg-white p-6 rounded-xl border border-[#D3D1C7] shadow-sm">
        
        {isCreatingNew && (
          <div className="p-4 border border-[#D3D1C7] rounded-xl bg-[#F1EFE8]/20 space-y-3 mb-6">
            <h3 className="text-sm font-bold text-[#2C2C2A]">Setup Analysis Record</h3>
            <div className="flex flex-col gap-1 max-w-md">
                <label className="text-[11px] text-[#5F5E5A] font-medium uppercase tracking-tight">Target Cluster</label>
                <select
                  value={clusters.find(c => c.code === activeWa?.clusterRef)?.id || ''}
                  onChange={(e) => handleClusterSelect(e.target.value)}
                  className="h-9 w-full px-3 border border-[#D3D1C7] rounded-lg text-xs bg-white focus:outline-none"
                >
                  <option value="" disabled>Select target cluster to import sites...</option>
                  {clusters.map(cluster => (
                    <option key={cluster.id} value={cluster.id}>{cluster.name} ({cluster.warehouseName})</option>
                  ))}
                </select>
            </div>
          </div>
        )}

        {/* Section A â€” Header */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 border-b border-[#D3D1C7] pb-2">
            <div className="w-5 h-5 rounded bg-[#1D9E75]/10 text-[#1D9E75] flex items-center justify-center font-bold text-xs">A</div>
            <h2 className="text-xs font-bold text-[#2C2C2A] uppercase tracking-wider">Section A â€” General Header</h2>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs font-sans">
            <div className="flex flex-col gap-1">
              <label className="text-[11px] text-[#5F5E5A] font-medium uppercase tracking-tight">Work analysis number</label>
              <input type="text" value={activeWa.id === 'DRAFT_NEW' ? 'Generated on save' : activeWa.id} disabled className="h-9 px-3 border border-[#D3D1C7] rounded-lg bg-[#F1EFE8]/50 text-[#5F5E5A] font-mono font-semibold" />
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

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-sans mt-4">
            <div className="flex flex-col gap-1">
              <label className="text-[11px] text-[#5F5E5A] font-medium uppercase tracking-tight">Cluster</label>
              <input 
                type="text" 
                value={clusters.find(cluster => cluster.code === activeWa.clusterRef)?.name || activeWa.clusterRef || ''} 
                disabled 
                className="h-9 px-3 border border-[#D3D1C7] rounded-lg bg-[#F1EFE8]/50 text-[#5F5E5A] font-semibold" 
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[11px] text-[#5F5E5A] font-medium uppercase tracking-tight">Warehouse name</label>
              <input 
                type="text" 
                value={activeWa.warehouseName || clusters.find(cluster => cluster.code === activeWa.clusterRef)?.warehouseName || ''} 
                disabled 
                className="h-9 px-3 border border-[#D3D1C7] rounded-lg bg-[#F1EFE8]/50 text-[#5F5E5A] font-semibold" 
              />
            </div>
          </div>

          <div className="mt-4 p-4 rounded-xl border border-[#D3D1C7]/60 bg-[#F1EFE8]/25 text-xs font-sans">
            <span className="block text-[11px] text-[#5F5E5A] uppercase tracking-tight font-medium">Route</span>
            <p className="mt-2 text-sm text-[#2C2C2A] font-semibold leading-6">{activeWa.route || 'No route towns selected yet.'}</p>
          </div>
        </div>

        {/* Section B â€” Site summary table */}
        <div className="space-y-3">
          <div className="flex items-center justify-between border-b border-[#D3D1C7] pb-2">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded bg-[#1D9E75]/10 text-[#1D9E75] flex items-center justify-center font-bold text-xs">B</div>
              <h2 className="text-xs font-bold text-[#2C2C2A] uppercase tracking-wider">Section B â€” Site Summary</h2>
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
                  <th className="p-2">Include</th>
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
                    <td colSpan={11} className="p-6 text-center text-[#5F5E5A] italic">
                      No sites added to analysis summary yet.
                    </td>
                  </tr>
                ) : (
                  activeWa.sites.map((site, index) => (
                    <tr key={site.id} className="hover:bg-[#F1EFE8]/20 transition-colors">
                      <td className="p-2 text-center font-mono text-[#5F5E5A]">{index + 1}</td>
                      <td className="p-2 text-center">
                        <input
                          type="checkbox"
                          checked={site.included !== false}
                          onChange={() => handleToggleSiteIncluded(index)}
                          className="rounded border-[#D3D1C7] text-[#1D9E75] focus:ring-[#1D9E75] w-4 h-4"
                        />
                      </td>
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

        {/* Section C â€” Truck & cost analysis */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 border-b border-[#D3D1C7] pb-2">
            <div className="w-5 h-5 rounded bg-[#1D9E75]/10 text-[#1D9E75] flex items-center justify-center font-bold text-xs">C</div>
            <h2 className="text-xs font-bold text-[#2C2C2A] uppercase tracking-wider">Section C â€” Truck & Cost Analysis</h2>
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

        {/* Section D â€” Validation */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 border-b border-[#D3D1C7] pb-2">
            <div className="w-5 h-5 rounded bg-[#1D9E75]/10 text-[#1D9E75] flex items-center justify-center font-bold text-xs">D</div>
            <h2 className="text-xs font-bold text-[#2C2C2A] uppercase tracking-wider">Section D â€” Validation & Approval Trail</h2>
          </div>

          <div className="space-y-4">
            {activeWa.approvalTrail && activeWa.approvalTrail.length > 0 && (
              <div className="bg-[#F1EFE8]/40 p-4 rounded-xl border border-[#D3D1C7] text-xs font-sans">
                <h3 className="font-bold text-[#2C2C2A] mb-3">Approval History</h3>
                <div className="space-y-2">
                  {activeWa.approvalTrail.map((trail, idx) => (
                    <div key={idx} className="flex gap-4 p-2 bg-white rounded border border-[#D3D1C7]/50">
                      <span className="font-semibold">{trail.date}</span>
                      <span className="text-[#1D9E75] font-bold">{trail.approverName}</span>
                      <span>set status to <span className="font-semibold">{trail.status}</span></span>
                      {trail.notes && <span className="italic text-[#5F5E5A]">- "{trail.notes}"</span>}
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs font-sans items-center bg-[#F1EFE8]/15 p-4 rounded-xl border border-[#D3D1C7]">
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
                    â— {activeWa.status}
                  </span>
                </div>
              </div>

              {/* Validated by e-signature placeholder */}
              <div className="flex flex-col gap-1">
                <label className="text-[11px] text-[#5F5E5A] font-medium uppercase tracking-tight">Approver Name (Supervisor)</label>
                <input 
                  type="text" 
                  id="wa-approver-name"
                  className="w-full h-9 pl-3 pr-3 border border-[#D3D1C7] rounded-lg focus:outline-none focus:border-[#1D9E75] font-sans font-semibold text-xs"
                  placeholder="Manager name"
                />
              </div>

              <div className="flex flex-col gap-1 col-span-2">
                <label className="text-[11px] text-[#5F5E5A] font-medium uppercase tracking-tight">Approval Notes</label>
                <input 
                  type="text" 
                  id="wa-approver-notes"
                  className="w-full h-9 px-3 border border-[#D3D1C7] rounded-lg focus:outline-none focus:border-[#1D9E75] font-sans text-xs"
                  placeholder="Optional notes"
                />
              </div>
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
            id="wa-save-close-btn"
            onClick={() => handleSave('close')}
            className="flex items-center gap-1 px-4 py-2 border border-[#D3D1C7] bg-white hover:bg-[#F1EFE8] text-[#2C2C2A] rounded-lg text-xs font-sans font-semibold cursor-pointer transition-colors"
          >
            Save and Close
          </button>
          
          <button
            id="wa-save-new-btn"
            onClick={() => handleSave('new')}
            className="flex items-center gap-1 px-4 py-2 border border-[#D3D1C7] bg-white hover:bg-[#F1EFE8] text-[#2C2C2A] rounded-lg text-xs font-sans font-semibold cursor-pointer transition-colors"
          >
            Save and New
          </button>
          
          <button
            id="wa-validate-btn"
            onClick={() => {
              const approverInput = document.getElementById('wa-approver-name') as HTMLInputElement;
              const notesInput = document.getElementById('wa-approver-notes') as HTMLInputElement;
              handleSubmitValidation(approverInput?.value || 'Current User', 'Validated', notesInput?.value || '');
            }}
            className="flex items-center gap-1 px-5 py-2 bg-[#1D9E75] hover:bg-[#1D9E75]/95 text-white rounded-lg text-xs font-sans font-semibold cursor-pointer transition-all shadow-sm"
          >
            <Check className="w-3.5 h-3.5" /> Submit validation
          </button>
        </div>
      </div>
    </div>
  );
}

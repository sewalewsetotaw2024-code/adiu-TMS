import React, { useState, useEffect, useMemo } from 'react';
import { MR, MRLineItem, ProjectSite } from '../types';
import { TIM_STAFF, TL_STAFF, TRUCK_TYPES, INITIAL_SITES, INITIAL_CATEGORIES } from '../data';
import { Plus, Trash2, ArrowRight, Save, CheckCircle, FilePlus, FileText, CheckCircle2, Clock, Truck, MapPin, FileSpreadsheet } from 'lucide-react';
import RequisitionSpreadsheet from './RequisitionSpreadsheet';

interface MrScreenProps {
  mrs: MR[];
  onSaveMr: (mr: MR) => void;
  selectedMrRef: string | null;
  setSelectedMrRef: (mrRef: string | null) => void;
}

const STEPPER_STAGES = [
  'Received', 'Handed over', 'Analysed', 'Approved', 'Dispatched', 'Delivered', 'Closed'
];

export default function MrScreen({ mrs, onSaveMr, selectedMrRef, setSelectedMrRef }: MrScreenProps) {
  const [activeMr, setActiveMr] = useState<MR | null>(null);
  const [editingItemIndex, setEditingItemIndex] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<'spreadsheet' | 'routing'>('spreadsheet');

  // KPI Calculations
  const kpis = useMemo(() => {
    let total = mrs.length;
    let drafts = 0;
    let pendingApproval = 0;
    let inProgress = 0;
    
    mrs.forEach(mr => {
      if (!mr.vendorClient) drafts++;
      if (['Received', 'Handed over', 'Analysed'].includes(mr.status)) pendingApproval++;
      if (['Approved', 'Dispatched', 'Delivered'].includes(mr.status)) inProgress++;
    });

    return { total, drafts, pendingApproval, inProgress };
  }, [mrs]);

  // Sync state with selected MR
  useEffect(() => {
    if (selectedMrRef) {
      const existing = mrs.find(m => m.mrNumber === selectedMrRef);
      if (existing) {
        // Deep copy
        setActiveMr(JSON.parse(JSON.stringify(existing)));
      }
    } else {
      setActiveMr(null);
    }
  }, [selectedMrRef, mrs]);

  const handleInitNewMr = () => {
    const nextNum = 412 + mrs.length;
    const newMr: MR = {
      mrNumber: `MR-2026-0${nextNum}`,
      poNumber: '',
      vendorClient: '',
      requestDate: new Date().toISOString().split('T')[0],
      handoverDate: '',
      assignedTim: TIM_STAFF[0],
      assignedTl: TL_STAFF[0],
      notes: '',
      status: 'Received',
      lineItems: []
    };
    onSaveMr(newMr);
    setSelectedMrRef(newMr.mrNumber);
  };

  const handleFieldChange = (field: keyof MR, value: any) => {
    if (!activeMr) return;
    setActiveMr({
      ...activeMr,
      [field]: value
    });
  };

  const handleAddLineItem = () => {
    if (!activeMr) return;
    const newItem: MRLineItem = {
      id: `li-${Date.now()}`,
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
      truck: '3-ton',
      itemCategory: INITIAL_CATEGORIES[0]?.code || 'RF-ANT'
    };
    setActiveMr({
      ...activeMr,
      lineItems: [...activeMr.lineItems, newItem]
    });
    setEditingItemIndex(activeMr.lineItems.length); // edit the newly added item
  };

  const handleRemoveLineItem = (index: number) => {
    if (!activeMr) return;
    const updated = activeMr.lineItems.filter((_, i) => i !== index);
    setActiveMr({
      ...activeMr,
      lineItems: updated
    });
    if (editingItemIndex === index) {
      setEditingItemIndex(null);
    } else if (editingItemIndex !== null && editingItemIndex > index) {
      setEditingItemIndex(editingItemIndex - 1);
    }
  };

  const handleLineItemFieldChange = (index: number, field: keyof MRLineItem, value: any) => {
    if (!activeMr) return;
    const updatedItems = [...activeMr.lineItems];
    
    // If selecting a site, auto-populate details
    if (field === 'siteId') {
      const selectedSite = INITIAL_SITES.find(s => s.siteId === value);
      if (selectedSite) {
        updatedItems[index] = {
          ...updatedItems[index],
          siteId: selectedSite.siteId,
          siteName: selectedSite.siteName,
          latitude: selectedSite.latitude,
          longitude: selectedSite.longitude,
          town: selectedSite.town,
          projectScope: selectedSite.projectScope,
          zoneManager: selectedSite.zoneManager,
          implementationPriority: selectedSite.implementationPriority,
          distance: selectedSite.distance
        };
        setActiveMr({ ...activeMr, lineItems: updatedItems });
        return;
      }
    }

    updatedItems[index] = {
      ...updatedItems[index],
      [field]: value
    };
    setActiveMr({
      ...activeMr,
      lineItems: updatedItems
    });
  };

  const handleSaveDraft = () => {
    if (!activeMr) return;
    onSaveMr(activeMr);
    alert(`Draft saved: ${activeMr.mrNumber}`);
  };

  const handleSubmitMr = () => {
    if (!activeMr) return;
    if (!activeMr.poNumber) {
      alert('PO number is required to submit.');
      return;
    }
    if (activeMr.lineItems.length === 0) {
      alert('Please add at least one transport line item.');
      return;
    }
    // Update status to next logic stage if needed
    const updated = { ...activeMr };
    if (updated.status === 'Received') {
      updated.status = 'Handed over' as const;
    }
    onSaveMr(updated);
    alert(`Material Request ${updated.mrNumber} successfully submitted and marked as ${updated.status}.`);
  };

  if (!activeMr) {
    return (
      <div className="space-y-6 select-none pb-20 max-w-[1600px] mx-auto" id="mr-screen-container">
        {/* Dashboard Header */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white p-5 rounded-xl border border-[#D3D1C7] shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-[#5F5E5A]">Total Requests</span>
              <div className="p-2 bg-blue-50 text-blue-600 rounded-lg"><FileText className="w-5 h-5" /></div>
            </div>
            <span className="text-3xl font-bold text-[#2C2C2A]">{kpis.total}</span>
          </div>
          <div className="bg-white p-5 rounded-xl border border-[#D3D1C7] shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-[#5F5E5A]">Drafts / Incomplete</span>
              <div className="p-2 bg-gray-100 text-gray-600 rounded-lg"><FilePlus className="w-5 h-5" /></div>
            </div>
            <span className="text-3xl font-bold text-[#2C2C2A]">{kpis.drafts}</span>
          </div>
          <div className="bg-white p-5 rounded-xl border border-[#D3D1C7] shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-[#5F5E5A]">Pending Approval</span>
              <div className="p-2 bg-orange-50 text-orange-600 rounded-lg"><Clock className="w-5 h-5" /></div>
            </div>
            <span className="text-3xl font-bold text-[#2C2C2A]">{kpis.pendingApproval}</span>
          </div>
          <div className="bg-white p-5 rounded-xl border border-[#D3D1C7] shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-[#5F5E5A]">In Progress / Dispatched</span>
              <div className="p-2 bg-[#1D9E75]/10 text-[#1D9E75] rounded-lg"><Truck className="w-5 h-5" /></div>
            </div>
            <span className="text-3xl font-bold text-[#2C2C2A]">{kpis.inProgress}</span>
          </div>
        </div>

        {/* Top Toolbar */}
        <div className="flex items-center justify-between bg-white p-4 rounded-xl border border-[#D3D1C7] shadow-sm mb-6">
          <h2 className="text-lg font-bold text-[#2C2C2A]">Material Requisitions</h2>
          <button 
            id="init-new-mr-btn"
            onClick={handleInitNewMr}
            className="flex items-center justify-center gap-2 px-5 py-2.5 bg-[#2C2C2A] text-white rounded-lg text-sm font-semibold hover:bg-black transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" /> Create New MR
          </button>
        </div>

        {/* MR Data Table */}
        <div className="bg-white rounded-xl border border-[#D3D1C7] shadow-sm overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-[#D3D1C7] text-xs font-sans font-bold text-[#5F5E5A] uppercase tracking-wider">
                <th className="px-6 py-4">MR Number</th>
                <th className="px-6 py-4">Vendor / Client</th>
                <th className="px-6 py-4">Request Date</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-center">Destinations</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#D3D1C7]/40 text-sm font-sans text-[#2C2C2A]">
              {mrs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-16 text-center text-[#5F5E5A]">
                    <FileSpreadsheet className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                    <p className="font-medium text-gray-700">No Material Requisitions found</p>
                    <p className="text-sm text-gray-500 mt-1">Click "Create New MR" to get started.</p>
                  </td>
                </tr>
              ) : (
                mrs.map(m => (
                  <tr key={m.mrNumber} className="hover:bg-gray-50 transition-colors cursor-pointer" onClick={() => setSelectedMrRef(m.mrNumber)}>
                    <td className="px-6 py-4 font-mono font-bold text-[#1D9E75]">{m.mrNumber}</td>
                    <td className="px-6 py-4 font-semibold">{m.vendorClient || <span className="text-gray-400 italic">Draft</span>}</td>
                    <td className="px-6 py-4 font-mono text-gray-600">{m.requestDate}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        m.status === 'Closed' ? 'bg-gray-100 text-gray-600' :
                        m.status === 'Delivered' ? 'bg-emerald-100 text-emerald-800' :
                        m.status === 'Dispatched' ? 'bg-blue-100 text-blue-800' :
                        'bg-orange-100 text-orange-800'
                      }`}>
                        {m.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="inline-flex items-center justify-center bg-gray-100 px-2.5 py-1 rounded-full text-xs font-semibold text-gray-700 border border-gray-200">
                        {m.lineItems.length} Sites
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button className="text-[#1D9E75] hover:text-[#168561] font-semibold text-sm">
                        View
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 select-none pb-20 max-w-[1600px] mx-auto" id="mr-screen-container">
      
      {/* 2. MR Toolbar & Selector (now just a Back button & Context) */}
      <div className="flex flex-col md:flex-row items-center justify-between bg-white p-4 rounded-xl border border-[#D3D1C7] shadow-sm gap-4">
        <div className="flex items-center gap-4 w-full md:w-auto">
          <button 
            onClick={() => setSelectedMrRef(null)}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 hover:bg-gray-200 rounded-lg text-sm font-semibold transition-colors"
          >
            &larr; Back to List
          </button>
          <div className="h-8 w-px bg-gray-300 mx-2 hidden md:block"></div>
          <div>
            <h2 className="text-lg font-bold text-[#2C2C2A]">{activeMr.mrNumber}</h2>
            <p className="text-xs text-gray-500">{activeMr.vendorClient || 'Draft Requisition'}</p>
          </div>
        </div>
      </div>

      {/* 3. Form Status Stepper */}
      <div className="bg-white p-6 rounded-xl border border-[#D3D1C7] shadow-sm">
        <div className="flex items-center justify-between max-w-5xl mx-auto">
          {STEPPER_STAGES.map((stage, idx) => {
            const currentStageIndex = STEPPER_STAGES.indexOf(activeMr.status);
            const isCompleted = idx < currentStageIndex;
            const isActive = idx === currentStageIndex;

            return (
              <React.Fragment key={stage}>
                <div className="flex flex-col items-center flex-1 relative group">
                  <div 
                    className={`w-8 h-8 rounded-full flex items-center justify-center border-2 text-xs font-sans font-bold transition-all z-10 ${
                      isCompleted 
                        ? 'bg-[#1D9E75] text-white border-[#1D9E75]' 
                        : isActive 
                        ? 'bg-white text-[#2C2C2A] border-[#2C2C2A] shadow-[0_0_0_4px_rgba(44,44,42,0.1)]' 
                        : 'bg-gray-50 text-[#5F5E5A] border-[#D3D1C7]'
                    }`}
                  >
                    {isCompleted ? <CheckCircle2 className="w-4 h-4" /> : idx + 1}
                  </div>
                  <span className={`text-[11px] font-sans mt-2 tracking-wide uppercase transition-colors ${
                    isActive ? 'text-[#2C2C2A] font-bold' : isCompleted ? 'text-[#1D9E75] font-semibold' : 'text-[#5F5E5A] font-medium'
                  }`}>
                    {stage}
                  </span>
                </div>
                {idx < STEPPER_STAGES.length - 1 && (
                  <div className={`h-1 flex-1 -mt-6 transition-colors ${
                    idx < currentStageIndex ? 'bg-[#1D9E75]' : 'bg-[#D3D1C7]'
                  }`} />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* 4. Tab Switcher */}
      <div className="flex border-b border-[#D3D1C7] gap-8 mt-2 px-2" id="mr-view-tabs">
        <button
          onClick={() => setActiveTab('spreadsheet')}
          className={`pb-4 text-sm font-bold uppercase tracking-wider transition-all relative cursor-pointer ${
            activeTab === 'spreadsheet' 
              ? 'text-[#1D9E75] border-b-[3px] border-[#1D9E75]' 
              : 'text-[#5F5E5A] hover:text-[#2C2C2A]'
          }`}
        >
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="w-4 h-4" />
            Material Request (MR)
          </div>
        </button>
        <button
          onClick={() => setActiveTab('routing')}
          className={`pb-4 text-sm font-bold uppercase tracking-wider transition-all relative cursor-pointer ${
            activeTab === 'routing' 
              ? 'text-[#1D9E75] border-b-[3px] border-[#1D9E75]' 
              : 'text-[#5F5E5A] hover:text-[#2C2C2A]'
          }`}
        >
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4" />
            Transport Logistics Routing ({activeMr.lineItems.length})
          </div>
        </button>
      </div>

      {activeTab === 'spreadsheet' ? (
        <RequisitionSpreadsheet mr={activeMr} onUpdateMr={setActiveMr} />
      ) : (
        /* Two-panel Layout */
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 items-start mt-4">
        
        {/* Left Panel - Form */}
        <div className="bg-white rounded-xl border border-[#D3D1C7] shadow-sm overflow-hidden flex flex-col">
          <div className="p-4 border-b border-[#D3D1C7] bg-gray-50/50">
            <h3 className="text-sm font-bold text-[#2C2C2A] uppercase tracking-wider flex items-center gap-2">
              <FileText className="w-4 h-4 text-[#1D9E75]" />
              Request Metadata
            </h3>
          </div>

          <div className="p-5 space-y-4 text-sm font-sans">
            {/* MR Number */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] text-[#5F5E5A] font-bold uppercase tracking-wide">MR number (read-only)</label>
              <input 
                type="text" 
                value={activeMr.mrNumber} 
                disabled 
                className="h-10 px-3 rounded-lg border border-[#D3D1C7] bg-[#F1EFE8]/50 text-[#5F5E5A] font-semibold"
              />
            </div>

            {/* PO Number */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] text-[#5F5E5A] font-bold uppercase tracking-wide">PO number</label>
              <input 
                type="text" 
                id="form-po-number"
                placeholder="e.g. PO-99124018"
                value={activeMr.poNumber} 
                onChange={(e) => handleFieldChange('poNumber', e.target.value)}
                className="h-10 px-3 rounded-lg border border-[#D3D1C7] focus:border-[#1D9E75] focus:ring-2 focus:ring-[#1D9E75]/20 focus:outline-none transition-all"
              />
            </div>

            {/* Vendor / Client Name */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] text-[#5F5E5A] font-bold uppercase tracking-wide">Vendor / client name</label>
              <input 
                type="text" 
                id="form-vendor-client"
                placeholder="e.g. Safaricom Ethiopia"
                value={activeMr.vendorClient} 
                onChange={(e) => handleFieldChange('vendorClient', e.target.value)}
                className="h-10 px-3 rounded-lg border border-[#D3D1C7] focus:border-[#1D9E75] focus:ring-2 focus:ring-[#1D9E75]/20 focus:outline-none transition-all"
              />
            </div>

            {/* Dates */}
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] text-[#5F5E5A] font-bold uppercase tracking-wide">Request date</label>
                <input 
                  type="date" 
                  value={activeMr.requestDate} 
                  onChange={(e) => handleFieldChange('requestDate', e.target.value)}
                  className="h-10 px-3 rounded-lg border border-[#D3D1C7] focus:border-[#1D9E75] focus:ring-2 focus:ring-[#1D9E75]/20 focus:outline-none transition-all text-sm"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] text-[#5F5E5A] font-bold uppercase tracking-wide">Handover date</label>
                <input 
                  type="date" 
                  value={activeMr.handoverDate} 
                  onChange={(e) => handleFieldChange('handoverDate', e.target.value)}
                  className="h-10 px-3 rounded-lg border border-[#D3D1C7] focus:border-[#1D9E75] focus:ring-2 focus:ring-[#1D9E75]/20 focus:outline-none transition-all text-sm"
                />
              </div>
            </div>

            {/* Assigned TIM and TL */}
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] text-[#5F5E5A] font-bold uppercase tracking-wide">Assigned TIM</label>
                <select 
                  value={activeMr.assignedTim} 
                  onChange={(e) => handleFieldChange('assignedTim', e.target.value)}
                  className="h-10 px-3 rounded-lg border border-[#D3D1C7] bg-white focus:border-[#1D9E75] focus:ring-2 focus:ring-[#1D9E75]/20 focus:outline-none transition-all text-sm"
                >
                  {TIM_STAFF.map(tim => (
                    <option key={tim} value={tim}>{tim}</option>
                  ))}
                </select>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] text-[#5F5E5A] font-bold uppercase tracking-wide">Assigned TL</label>
                <select 
                  value={activeMr.assignedTl} 
                  onChange={(e) => handleFieldChange('assignedTl', e.target.value)}
                  className="h-10 px-3 rounded-lg border border-[#D3D1C7] bg-white focus:border-[#1D9E75] focus:ring-2 focus:ring-[#1D9E75]/20 focus:outline-none transition-all text-sm"
                >
                  {TL_STAFF.map(tl => (
                    <option key={tl} value={tl}>{tl}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Notes */}
            <div className="flex flex-col gap-1.5 pt-2">
              <label className="text-[11px] text-[#5F5E5A] font-bold uppercase tracking-wide">Notes / remarks</label>
              <textarea 
                rows={3}
                placeholder="Enter additional dispatch remarks or site safety parameters..."
                value={activeMr.notes} 
                onChange={(e) => handleFieldChange('notes', e.target.value)}
                className="p-3 rounded-lg border border-[#D3D1C7] focus:border-[#1D9E75] focus:ring-2 focus:ring-[#1D9E75]/20 focus:outline-none transition-all text-sm resize-none"
              />
            </div>
          </div>
        </div>

        {/* Right Panel - MR line items table */}
        <div className="bg-white rounded-xl border border-[#D3D1C7] shadow-sm xl:col-span-2 overflow-hidden flex flex-col h-full">
          <div className="p-4 border-b border-[#D3D1C7] bg-gray-50/50 flex items-center justify-between">
            <h3 className="text-sm font-bold text-[#2C2C2A] uppercase tracking-wider flex items-center gap-2">
              <Truck className="w-4 h-4 text-[#1D9E75]" />
              Routing Destinations
            </h3>
            <span className="text-xs font-semibold px-2.5 py-1 bg-white border border-[#D3D1C7] rounded-full text-[#5F5E5A]">
              {activeMr.lineItems.length} Sites
            </span>
          </div>

          <div className="flex-1 overflow-x-auto min-h-[400px]">
            <table className="w-full text-left border-collapse" id="mr-line-items-table">
              <thead>
                <tr className="bg-white border-b border-[#D3D1C7] text-xs font-sans font-bold text-[#5F5E5A] uppercase tracking-wider">
                  <th className="px-4 py-3 text-center">#</th>
                  <th className="px-4 py-3">Site ID</th>
                  <th className="px-4 py-3">Site Details</th>
                  <th className="px-4 py-3">Logistics</th>
                  <th className="px-4 py-3 text-right">Distance</th>
                  <th className="px-4 py-3 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#D3D1C7]/40 text-sm font-sans text-[#2C2C2A]">
                {activeMr.lineItems.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-16 text-center text-[#5F5E5A]">
                      <MapPin className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                      <p className="font-medium text-gray-700">No destinations added yet</p>
                      <p className="text-sm text-gray-500 mt-1">Add sites to begin planning logistics routing.</p>
                    </td>
                  </tr>
                ) : (
                  activeMr.lineItems.map((item, index) => {
                    const isEditing = editingItemIndex === index;

                    return (
                      <tr 
                        key={item.id} 
                        className={`hover:bg-[#F1EFE8]/40 transition-colors ${
                          isEditing ? 'bg-[#1D9E75]/5 hover:bg-[#1D9E75]/10' : ''
                        }`}
                      >
                        <td className="px-4 py-3 text-center font-mono font-medium text-gray-400">{index + 1}</td>
                        <td className="px-4 py-3 font-semibold min-w-[120px]">
                          {isEditing ? (
                            <select
                              value={item.siteId}
                              onChange={(e) => handleLineItemFieldChange(index, 'siteId', e.target.value)}
                              className="h-9 w-full px-2 border border-[#D3D1C7] rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#1D9E75]/30 focus:border-[#1D9E75] bg-white"
                            >
                              <option value="">-- Choose Site --</option>
                              {INITIAL_SITES.map(s => (
                                <option key={s.siteId} value={s.siteId}>{s.siteId}</option>
                              ))}
                            </select>
                          ) : (
                            <span className="font-mono text-[#1D9E75] font-bold">{item.siteId || '---'}</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex flex-col">
                            <span className="font-semibold text-gray-800 truncate max-w-[200px]" title={item.siteName}>{item.siteName || 'No Name'}</span>
                            <span className="text-xs text-gray-500 mt-0.5">{item.town || 'No Town'}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex flex-col gap-1.5">
                            {isEditing ? (
                              <select
                                value={item.truck}
                                onChange={(e) => handleLineItemFieldChange(index, 'truck', e.target.value)}
                                className="h-8 px-2 border border-[#D3D1C7] rounded text-xs focus:outline-none bg-white"
                              >
                                {TRUCK_TYPES.map(t => (
                                  <option key={t} value={t}>{t}</option>
                                ))}
                              </select>
                            ) : (
                              <span className="inline-flex items-center w-fit bg-gray-100 px-2 py-0.5 rounded border border-gray-200 text-xs font-semibold text-gray-700">
                                {item.truck}
                              </span>
                            )}
                            
                            {isEditing ? (
                              <select
                                value={item.itemCategory}
                                onChange={(e) => handleLineItemFieldChange(index, 'itemCategory', e.target.value)}
                                className="h-8 px-2 border border-[#D3D1C7] rounded text-xs focus:outline-none bg-white mt-1"
                              >
                                {INITIAL_CATEGORIES.map(cat => (
                                  <option key={cat.code} value={cat.code}>{cat.name}</option>
                                ))}
                              </select>
                            ) : (
                              <span className="text-xs text-gray-500">{item.itemCategory}</span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right font-mono">
                          {isEditing ? (
                            <div className="flex justify-end">
                              <input 
                                type="number"
                                value={item.distance}
                                onChange={(e) => handleLineItemFieldChange(index, 'distance', Number(e.target.value))}
                                className="w-20 h-9 text-right border border-[#D3D1C7] rounded-md px-2 focus:outline-none focus:ring-2 focus:ring-[#1D9E75]/30 font-mono text-sm"
                              />
                            </div>
                          ) : (
                            <span className="font-medium text-gray-700">{item.distance} km</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => setEditingItemIndex(isEditing ? null : index)}
                              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                                isEditing 
                                  ? 'bg-[#1D9E75] text-white hover:bg-[#168561]' 
                                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                              }`}
                            >
                              {isEditing ? 'Save' : 'Edit'}
                            </button>
                            <button
                              onClick={() => handleRemoveLineItem(index)}
                              className="p-1.5 rounded-md text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                              title="Delete Item"
                            >
                              <Trash2 className="w-4 h-4" />
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

          <div className="p-4 border-t border-[#D3D1C7] bg-gray-50/50 flex justify-start">
            <button
              id="add-line-item-btn"
              onClick={handleAddLineItem}
              className="flex items-center gap-2 px-4 py-2 border border-dashed border-[#1D9E75] bg-white hover:bg-[#1D9E75]/5 text-[#1D9E75] rounded-lg text-sm font-bold cursor-pointer transition-all shadow-sm"
            >
              <Plus className="w-4 h-4" /> Add Destination Site
            </button>
          </div>
        </div>

      </div>
      )}

      {/* Sticky footer with Save draft and Submit / Proceed buttons */}
      <div className="fixed bottom-0 left-[240px] right-0 h-16 bg-white border-t border-[#D3D1C7] px-8 flex items-center justify-between shadow-[0_-4px_10px_rgba(0,0,0,0.05)] z-40 transition-all">
        <div className="flex items-center gap-3">
          <span className="text-sm font-semibold text-[#5F5E5A]">Current Status:</span>
          <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-gray-100 text-gray-800 border border-gray-200">
            {activeMr.status}
          </span>
        </div>

        <div className="flex items-center gap-4">
          <button
            id="mr-save-draft-btn"
            onClick={handleSaveDraft}
            className="flex items-center gap-2 px-6 py-2.5 border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 rounded-lg text-sm font-bold cursor-pointer transition-colors shadow-sm"
          >
            <Save className="w-4 h-4 text-gray-500" /> Save Draft
          </button>
          <button
            id="mr-submit-btn"
            onClick={handleSubmitMr}
            className="flex items-center gap-2 px-8 py-2.5 bg-[#1D9E75] hover:bg-[#168561] text-white rounded-lg text-sm font-bold cursor-pointer transition-all shadow-sm"
          >
            Submit Request <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

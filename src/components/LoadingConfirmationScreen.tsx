import React, { useState, useMemo } from 'react';
import { 
  CheckCircle2, XCircle, AlertTriangle, Save, 
  ArrowLeft, PackageCheck, User, Truck, MapPin, 
  FileText, Check, AlertCircle, Barcode, Hash, Plus, Search, Camera
} from 'lucide-react';
import { TransportRequestItem, LoadingConfirmationData, ItemDetail, WorkAnalysis, MR, ProjectSite } from '../types';

interface LoadingConfirmationScreenProps {
  itemTracking: TransportRequestItem[];
  loadingConfirmations: LoadingConfirmationData[];
  workAnalyses: WorkAnalysis[];
  mrs: MR[];
  sites: ProjectSite[];
  onSaveLoadingConfirmation: (updatedConfirmation: LoadingConfirmationData) => void;
  setScreen: (screen: string) => void;
}

export default function LoadingConfirmationScreen({ 
  itemTracking, 
  loadingConfirmations, 
  workAnalyses,
  mrs,
  sites,
  onSaveLoadingConfirmation, 
  setScreen 
}: LoadingConfirmationScreenProps) {
  const [viewMode, setViewMode] = useState<'list' | 'form'>('list');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Cascading Selection State
  const [selectedWaId, setSelectedWaId] = useState<string>('');
  const [selectedSiteId, setSelectedSiteId] = useState<string>('');
  const [selectedMrId, setSelectedMrId] = useState<string>('');
  
  // Computed cascaded options
  const selectedWa = useMemo(() => workAnalyses.find(wa => wa.id === selectedWaId), [workAnalyses, selectedWaId]);
  
  const siteOptions = useMemo(() => {
    return selectedWa ? selectedWa.sites : [];
  }, [selectedWa]);
  
  const mrOptions = useMemo(() => {
    if (!selectedSiteId) return [];
    return mrs.filter(mr => mr.lineItems.some(item => item.siteId === selectedSiteId));
  }, [mrs, selectedSiteId]);

  const trip = useMemo(() => itemTracking.find(t => t.mrRef === selectedMrId), [itemTracking, selectedMrId]);
  const existingConfirmation = useMemo(() => loadingConfirmations.find(c => c.tripId === trip?.tripId), [loadingConfirmations, trip]);

  // Local state for the interactive checklist
  const [itemsState, setItemsState] = useState<ItemDetail[]>([]);
  const [notes, setNotes] = useState('');
  const [evidencePhotoUrls, setEvidencePhotoUrls] = useState<string[]>([]);

  // Initialize local state when trip changes
  React.useEffect(() => {
    if (trip) {
      setItemsState(JSON.parse(JSON.stringify(trip.items)));
      setNotes(existingConfirmation?.notes || '');
      setEvidencePhotoUrls(existingConfirmation?.loadingEvidencePhotoUrls || []);
    } else {
      setItemsState([]);
      setNotes('');
      setEvidencePhotoUrls([]);
    }
  }, [trip, existingConfirmation]);

  // Reset dependent selections when parent changes
  React.useEffect(() => {
    setSelectedSiteId('');
    setSelectedMrId('');
  }, [selectedWaId]);

  React.useEffect(() => {
    setSelectedMrId('');
  }, [selectedSiteId]);

  const updateItem = (id: string, updates: Partial<ItemDetail>) => {
    setItemsState(prev => prev.map(item => item.id === id ? { ...item, ...updates } : item));
  };

  const handleSaveDraft = () => {
    if (!trip) return;
    const newConf: LoadingConfirmationData = {
      tripId: trip.tripId,
      operatorName: 'Solomon Tekle',
      operatorId: 'OP-001',
      status: 'Draft',
      notes,
      loadingEvidencePhotoUrls: evidencePhotoUrls
    };
    onSaveLoadingConfirmation(newConf);
    alert('Draft saved successfully.');
    setViewMode('list');
  };

  const handleSubmitForApproval = () => {
    if (!trip) return;
    const hasDiscrepancy = itemsState.some(item => item.loadedQuantity !== item.expectedQuantity);
    if (hasDiscrepancy) {
      const confirm = window.confirm('There are quantity discrepancies. Are you sure you want to submit for approval?');
      if (!confirm) return;
    }

    const newConf: LoadingConfirmationData = {
      tripId: trip.tripId,
      operatorName: 'Solomon Tekle',
      operatorId: 'OP-001',
      status: 'Pending Approval',
      notes,
      loadingEvidencePhotoUrls: evidencePhotoUrls
    };
    onSaveLoadingConfirmation(newConf);
    alert('Submitted for approval successfully.');
    setViewMode('list');
  };

  const handleConfirmLoading = () => {
    if (!trip) return;
    const hasDiscrepancy = itemsState.some(item => item.loadedQuantity !== item.expectedQuantity);
    if (hasDiscrepancy) {
      const confirm = window.confirm('There are quantity discrepancies. Are you sure you want to confirm loading?');
      if (!confirm) return;
    }

    const newConf: LoadingConfirmationData = {
      tripId: trip.tripId,
      operatorName: 'Solomon Tekle',
      operatorId: 'OP-001',
      status: 'Confirmed',
      confirmationTime: new Date().toISOString(),
      notes,
      loadingEvidencePhotoUrls: evidencePhotoUrls
    };
    onSaveLoadingConfirmation(newConf);
    alert('Loading confirmed and locked.');
    setViewMode('list');
  };

  // Progress calculations
  const progress = useMemo(() => {
    if (itemsState.length === 0) return 0;
    const totalExpected = itemsState.reduce((sum, item) => sum + item.expectedQuantity, 0);
    const totalLoaded = itemsState.reduce((sum, item) => sum + item.loadedQuantity, 0);
    return Math.min(100, Math.round((totalLoaded / totalExpected) * 100));
  }, [itemsState]);

  // KPIs
  const totalConfirmations = loadingConfirmations.length;
  const draftConfirmations = loadingConfirmations.filter(c => c.status === 'Draft').length;
  const pendingApprovalConfirmations = loadingConfirmations.filter(c => c.status === 'Pending Approval').length;

  // Filtered List
  const filteredConfirmations = loadingConfirmations.filter(conf => {
    const t = itemTracking.find(item => item.tripId === conf.tripId);
    if (!searchQuery) return true;
    return conf.tripId.toLowerCase().includes(searchQuery.toLowerCase()) || 
           (t && t.mrRef.toLowerCase().includes(searchQuery.toLowerCase()));
  });

  if (viewMode === 'list') {
    return (
      <div className="space-y-6 select-none pb-20" id="loading-confirmation-list-container">
        <div className="space-y-5 bg-white p-6 rounded-xl border border-[#D3D1C7] shadow-sm">
          
          {/* Header */}
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-[#2C2C2A]">Loading Confirmations</h2>
              <p className="text-sm text-[#5F5E5A]">Scan, verify, and confirm outbound shipments</p>
            </div>
            <button 
              onClick={() => {
                setSelectedWaId('');
                setSelectedSiteId('');
                setSelectedMrId('');
                setViewMode('form');
              }}
              className="flex items-center gap-1.5 px-4 py-2 bg-[#1D9E75] hover:bg-[#1D9E75]/90 text-white rounded-lg text-xs font-sans font-semibold cursor-pointer transition-colors"
            >
              <Plus className="w-4 h-4" /> New Confirmation
            </button>
          </div>

          {/* KPIs */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="rounded-xl border border-[#D3D1C7] bg-[#F1EFE8]/40 p-4">
              <p className="text-[10px] uppercase tracking-wider text-[#5F5E5A] font-semibold">Total Records</p>
              <p className="mt-2 text-2xl font-bold text-[#2C2C2A]">{totalConfirmations}</p>
            </div>
            <div className="rounded-xl border border-[#D3D1C7] bg-[#F1EFE8]/40 p-4">
              <p className="text-[10px] uppercase tracking-wider text-[#5F5E5A] font-semibold">Drafts</p>
              <p className="mt-2 text-2xl font-bold text-[#D97706]">{draftConfirmations}</p>
            </div>
            <div className="rounded-xl border border-[#D3D1C7] bg-[#F1EFE8]/40 p-4">
              <p className="text-[10px] uppercase tracking-wider text-[#5F5E5A] font-semibold">Pending Approval</p>
              <p className="mt-2 text-2xl font-bold text-[#1D9E75]">{pendingApprovalConfirmations}</p>
            </div>
          </div>

          {/* Search */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative w-64">
              <Search className="w-3.5 h-3.5 text-[#5F5E5A] absolute left-3 top-1/2 -translate-y-1/2" />
              <input 
                type="text" 
                placeholder="Search by Trip ID or MR Ref..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-9 pl-9 pr-3 rounded-lg border border-[#D3D1C7] bg-[#F1EFE8]/30 font-sans text-xs text-[#2C2C2A] focus:outline-none focus:border-[#1D9E75]"
              />
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto border border-[#D3D1C7]/60 rounded-lg">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#F1EFE8]/45 border-b border-[#D3D1C7]/80 text-[10px] font-sans font-semibold text-[#5F5E5A] uppercase tracking-wider">
                  <th className="p-3">Trip ID</th>
                  <th className="p-3">MR Ref</th>
                  <th className="p-3">Operator</th>
                  <th className="p-3">Date</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#D3D1C7]/40 text-xs font-sans text-[#2C2C2A]">
                {filteredConfirmations.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-[#5F5E5A] italic">
                      No loading confirmations found.
                    </td>
                  </tr>
                ) : (
                  filteredConfirmations.map((conf) => {
                    const t = itemTracking.find(item => item.tripId === conf.tripId);
                    return (
                      <tr key={conf.tripId} className="hover:bg-[#F1EFE8]/25 transition-colors">
                        <td className="p-3 font-mono text-[#1D9E75] font-bold">{conf.tripId}</td>
                        <td className="p-3 font-medium">{t?.mrRef || 'N/A'}</td>
                        <td className="p-3">{conf.operatorName}</td>
                        <td className="p-3">{conf.confirmationTime ? new Date(conf.confirmationTime).toLocaleDateString() : 'N/A'}</td>
                        <td className="p-3">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                            conf.status === 'Confirmed' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                            conf.status === 'Draft' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                            conf.status === 'Pending Approval' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                            'bg-slate-100 text-slate-700 border-slate-200'
                          }`}>
                            {conf.status}
                          </span>
                        </td>
                        <td className="p-3 text-center">
                          <button
                            onClick={() => {
                              // If editing, try to deduce WA/Site/MR from the trip
                              if (t) {
                                setSelectedMrId(t.mrRef);
                                // The rest of the cascading logic for WA/Site would normally go here, 
                                // but setting MR directly at least allows the trip to be found.
                              }
                              setViewMode('form');
                            }}
                            className="px-2.5 py-1 text-[10px] border border-[#D3D1C7] rounded hover:bg-[#F1EFE8] transition-colors"
                          >
                            Edit
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-24">
      <div className="flex items-center gap-4 mb-6">
        <button 
          onClick={() => setViewMode('list')}
          className="p-2 hover:bg-gray-200 rounded-full text-gray-500 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-[#2C2C2A] tracking-tight">Loading Confirmation</h1>
          <p className="text-sm text-gray-500 mt-1">Select MR to confirm outbound shipments</p>
        </div>
      </div>

      {/* Cascading Selectors */}
      <div className="bg-white p-6 rounded-xl border border-[#E5E2D9] shadow-sm space-y-4">
        
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">1. Select Work Analysis</label>
          <select 
            value={selectedWaId} 
            onChange={e => setSelectedWaId(e.target.value)}
            className="w-full sm:w-2/3 px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-[#1D9E75] font-medium"
          >
            <option value="">-- Select Work Analysis --</option>
            {workAnalyses.map(wa => (
              <option key={wa.id} value={wa.id}>{wa.id} ({wa.date})</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">2. Select Site</label>
          <select 
            value={selectedSiteId} 
            onChange={e => setSelectedSiteId(e.target.value)}
            disabled={!selectedWaId}
            className="w-full sm:w-2/3 px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-[#1D9E75] font-medium disabled:opacity-50"
          >
            <option value="">-- Select Site --</option>
            {siteOptions.map(site => (
              <option key={site.siteId} value={site.siteId}>{site.siteId} - {site.siteName}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">3. Select Material Requisition (MR)</label>
          <select 
            value={selectedMrId} 
            onChange={e => setSelectedMrId(e.target.value)}
            disabled={!selectedSiteId}
            className="w-full sm:w-2/3 px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-[#1D9E75] font-medium disabled:opacity-50"
          >
            <option value="">-- Select MR --</option>
            {mrOptions.map(mr => (
              <option key={mr.mrNumber} value={mr.mrNumber}>{mr.mrNumber}</option>
            ))}
          </select>
        </div>
      </div>

      {trip && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          {/* Shipment Meta Header */}
          <div className="bg-white rounded-xl border border-[#E5E2D9] shadow-sm overflow-hidden">
            <div className="p-5 bg-[#F1EFE8]/50 border-b border-[#E5E2D9] flex justify-between items-center">
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <PackageCheck className="w-5 h-5 text-[#1D9E75]" />
                Trip {trip.tripId} Details
              </h2>
              <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${existingConfirmation?.status === 'Confirmed' ? 'bg-green-100 text-green-700' : existingConfirmation?.status === 'Pending Approval' ? 'bg-blue-100 text-blue-700' : 'bg-yellow-100 text-yellow-700'}`}>
                {existingConfirmation?.status || 'Not Started'}
              </span>
            </div>
            <div className="p-5 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 text-sm">
              <div className="flex gap-3 items-start">
                <FileText className="w-5 h-5 text-gray-400 shrink-0" />
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wider mb-0.5">MR Ref</p>
                  <p className="font-semibold text-gray-900">{trip.mrRef}</p>
                </div>
              </div>
              <div className="flex gap-3 items-start">
                <MapPin className="w-5 h-5 text-gray-400 shrink-0" />
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wider mb-0.5">Destination</p>
                  <p className="font-semibold text-gray-900">{trip.destination}</p>
                </div>
              </div>
              <div className="flex gap-3 items-start">
                <Truck className="w-5 h-5 text-gray-400 shrink-0" />
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wider mb-0.5">Vehicle & Driver</p>
                  <p className="font-semibold text-gray-900">{trip.vehicle}</p>
                  <p className="text-gray-500 text-xs mt-0.5">{trip.driver}</p>
                </div>
              </div>
              <div className="flex gap-3 items-start">
                <User className="w-5 h-5 text-gray-400 shrink-0" />
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wider mb-0.5">Warehouse Operator</p>
                  <p className="font-semibold text-gray-900">Solomon Tekle</p>
                </div>
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="bg-white p-6 rounded-xl border border-[#E5E2D9] shadow-sm">
            <div className="flex justify-between items-end mb-2">
              <span className="text-sm font-semibold text-gray-700">Loading Progress</span>
              <span className="text-2xl font-bold text-[#1D9E75]">{progress}%</span>
            </div>
            <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
              <div 
                className="h-full bg-[#1D9E75] transition-all duration-500 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {/* Checklist */}
          <div className="bg-white rounded-xl border border-[#E5E2D9] shadow-sm overflow-hidden">
            <div className="p-5 border-b border-[#E5E2D9] bg-gray-50 flex justify-between items-center">
              <h3 className="font-bold text-gray-800">Verification Checklist</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-white border-b border-gray-200 text-xs uppercase tracking-wider text-gray-500">
                    <th className="px-5 py-3 font-semibold">Item & Code</th>
                    <th className="px-5 py-3 font-semibold text-center w-24">Expected</th>
                    <th className="px-5 py-3 font-semibold text-center w-32">Loaded Qty</th>
                    <th className="px-5 py-3 font-semibold text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {itemsState.map(item => {
                    const isDiscrepancy = item.loadedQuantity !== item.expectedQuantity;
                    const isPerfect = item.loadedQuantity === item.expectedQuantity;

                    return (
                      <tr key={item.id} className={`transition-colors ${isDiscrepancy ? 'bg-red-50/30' : 'hover:bg-gray-50'}`}>
                        <td className="px-5 py-4">
                          <p className="font-semibold text-sm text-gray-900">{item.itemName}</p>
                          <p className="text-xs text-gray-500 font-mono mt-0.5">{item.itemCode}</p>
                        </td>
                        <td className="px-5 py-4 text-center">
                          <span className="text-sm font-semibold text-gray-600">{item.expectedQuantity}</span>
                        </td>
                        <td className="px-5 py-4 text-center">
                          <input 
                            type="number" 
                            min="0"
                            value={item.loadedQuantity}
                            onChange={(e) => updateItem(item.id, { loadedQuantity: parseInt(e.target.value) || 0 })}
                            className={`w-20 px-2 py-1.5 text-center text-sm font-bold border rounded-md focus:outline-none focus:ring-2 ${isDiscrepancy ? 'border-red-300 text-red-600 focus:ring-red-200' : 'border-gray-300 text-gray-900 focus:ring-[#1D9E75]/30'}`}
                          />
                        </td>
                        <td className="px-5 py-4 text-center">
                          {isPerfect ? (
                            <div className="flex justify-center">
                              <CheckCircle2 className="w-6 h-6 text-green-500" />
                            </div>
                          ) : isDiscrepancy ? (
                            <div className="flex justify-center flex-col items-center gap-1">
                              <AlertCircle className="w-5 h-5 text-red-500" />
                              <span className="text-[10px] font-bold text-red-600 uppercase">Mismatch</span>
                            </div>
                          ) : (
                            <span className="text-xs text-gray-400 font-medium italic">Pending</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            
            {/* Loading Evidence */}
            <div className="p-5 border-t border-gray-200 bg-gray-50/50 space-y-4">
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Camera className="w-4 h-4 text-[#1D9E75]" />
                  <p className="text-sm font-semibold text-gray-700">Loading Evidence Photos</p>
                </div>
                <p className="text-xs text-gray-500 mb-3">Upload one or more photos showing the loaded goods before dispatch.</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {evidencePhotoUrls.map((url, index) => (
                    <div key={`${url}-${index}`} className="relative rounded-xl overflow-hidden border border-gray-200 bg-white h-28">
                      <img src={url} alt={`Loading Evidence ${index + 1}`} className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => setEvidencePhotoUrls(prev => prev.filter((_, idx) => idx !== index))}
                        className="absolute top-2 right-2 h-7 w-7 rounded-full bg-white/90 text-red-600 flex items-center justify-center shadow-sm"
                      >
                        <XCircle className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
                <label className="inline-flex items-center gap-2 px-4 py-2 mt-3 bg-white border border-gray-300 rounded-lg text-sm font-bold text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer">
                  Add Photos
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={(e) => {
                      const files = e.target.files;
                      if (files && files.length > 0) {
                        const urls = Array.from(files).map(file => URL.createObjectURL(file as Blob));
                        setEvidencePhotoUrls(prev => [...prev, ...urls]);
                      }
                    }}
                  />
                </label>
              </div>

              {/* Loading Notes */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Loading Notes & Remarks</label>
                <textarea 
                  rows={3}
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder="Enter any issues with packaging, delays, or additional observations..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1D9E75]/30 focus:border-[#1D9E75]"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Floating Action Bar */}
      {trip && (
        <div className="fixed bottom-0 left-[240px] right-0 bg-white border-t border-gray-200 p-4 shadow-[0_-4px_10px_rgba(0,0,0,0.05)] z-20 flex justify-between items-center px-8 animate-in slide-in-from-bottom-full duration-300">
          <div className="flex gap-3">
            <button className="flex items-center gap-2 px-4 py-2 border border-orange-200 bg-orange-50 text-orange-700 rounded-lg text-sm font-semibold hover:bg-orange-100 transition-colors shadow-sm">
              <AlertTriangle className="w-4 h-4" />
              Report Damaged
            </button>
            <button className="flex items-center gap-2 px-4 py-2 border border-red-200 bg-red-50 text-red-700 rounded-lg text-sm font-semibold hover:bg-red-100 transition-colors shadow-sm">
              <XCircle className="w-4 h-4" />
              Report Missing
            </button>
          </div>
          
          <div className="flex gap-3">
            <button 
              onClick={handleSaveDraft}
              className="flex items-center gap-2 px-6 py-2 border border-gray-300 bg-white text-gray-700 rounded-lg text-sm font-bold hover:bg-gray-50 transition-colors shadow-sm"
            >
              <Save className="w-4 h-4 text-gray-500" />
              Save as Draft
            </button>
            <button 
              onClick={handleSubmitForApproval}
              disabled={existingConfirmation?.status === 'Confirmed' || existingConfirmation?.status === 'Pending Approval'}
              className="flex items-center gap-2 px-6 py-2 border border-blue-300 bg-blue-50 text-blue-700 rounded-lg text-sm font-bold hover:bg-blue-100 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Check className="w-4 h-4" />
              Submit for Approval
            </button>
            <button 
              onClick={handleConfirmLoading}
              disabled={existingConfirmation?.status === 'Confirmed'}
              className="flex items-center gap-2 px-8 py-2 bg-[#1D9E75] text-white rounded-lg text-sm font-bold hover:bg-[#168561] transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Check className="w-5 h-5" />
              {existingConfirmation?.status === 'Confirmed' ? 'Loading Confirmed' : 'Confirm Loading'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

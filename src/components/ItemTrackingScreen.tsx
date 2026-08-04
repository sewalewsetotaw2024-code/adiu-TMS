import React, { useState, useMemo } from 'react';
import { 
  Search, Filter, Download, RefreshCw, 
  Package, Truck, CheckCircle2, AlertCircle, XCircle, AlertTriangle, 
  ChevronRight, Box, Barcode, Hash, MapPin, Calendar, ExternalLink, Plus, ArrowLeft, Save, Check, Camera
} from 'lucide-react';
import { TransportRequestItem, ItemDetail, ItemTrackingStatus, WorkAnalysis, MR, ProjectSite } from '../types';

interface ItemTrackingScreenProps {
  itemTracking: TransportRequestItem[];
  workAnalyses: WorkAnalysis[];
  mrs: MR[];
  sites: ProjectSite[];
  onSaveItemTracking: (updatedTracking: TransportRequestItem) => void;
  setScreen: (screen: string) => void;
}

export default function ItemTrackingScreen({ 
  itemTracking, 
  workAnalyses,
  mrs,
  sites,
  onSaveItemTracking, 
  setScreen 
}: ItemTrackingScreenProps) {
  const [viewMode, setViewMode] = useState<'list' | 'form'>('list');
  const [searchTerm, setSearchTerm] = useState('');
  
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

  const selectedSite = useMemo(() => {
    if (selectedSiteId) return sites.find(site => site.siteId === selectedSiteId);
    if (trip) return sites.find(site => site.siteName === trip.destination);
    return undefined;
  }, [sites, selectedSiteId, trip]);
  
  // Local state for the interactive checklist
  const [itemsState, setItemsState] = useState<ItemDetail[]>([]);
  const [photoUrls, setPhotoUrls] = useState<string[]>([]);
  const [lastMileDeliveryRequested, setLastMileDeliveryRequested] = useState<boolean>(false);
  const [lastMileSiteId, setLastMileSiteId] = useState<string>('');
  const [lastMileTransportAmount, setLastMileTransportAmount] = useState<number>(0);
  const [lastMileRequestStatus, setLastMileRequestStatus] = useState<'Not requested' | 'Requested' | 'Approved' | 'Rejected'>('Not requested');
  const [lastMileApprovalDocumentUrl, setLastMileApprovalDocumentUrl] = useState<string>('');

  const [paymentRequested, setPaymentRequested] = useState<boolean>(false);
  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [paymentRequestStatus, setPaymentRequestStatus] = useState<'Not requested' | 'Requested' | 'Approved' | 'Rejected'>('Not requested');
  const [paymentRequestNotes, setPaymentRequestNotes] = useState<string>('');
  const [paymentProofDocumentUrl, setPaymentProofDocumentUrl] = useState<string>('');

  // Initialize local state when trip changes
  React.useEffect(() => {
    if (trip) {
      setItemsState(JSON.parse(JSON.stringify(trip.items)));
      setPhotoUrls(trip.proofOfDeliveryPhotoUrls || (trip.proofOfDeliveryPhotoUrl ? [trip.proofOfDeliveryPhotoUrl] : []));
      setLastMileDeliveryRequested(Boolean(trip.lastMileDeliveryRequested));
      setLastMileSiteId(trip.lastMileSiteId || '');
      setLastMileTransportAmount(trip.lastMileTransportAmount || 0);
      setLastMileRequestStatus(trip.lastMileRequestStatus || 'Not requested');
      setLastMileApprovalDocumentUrl(trip.lastMileApprovalDocumentUrl || '');
      setPaymentRequested(Boolean(trip.paymentRequested));
      setPaymentAmount(trip.paymentAmount || 0);
      setPaymentRequestStatus(trip.paymentRequestStatus || 'Not requested');
      setPaymentRequestNotes(trip.paymentRequestNotes || '');
      setPaymentProofDocumentUrl(trip.paymentProofDocumentUrl || '');
    } else {
      setItemsState([]);
      setPhotoUrls([]);
      setLastMileDeliveryRequested(false);
      setLastMileSiteId('');
      setLastMileTransportAmount(0);
      setLastMileRequestStatus('Not requested');
      setLastMileApprovalDocumentUrl('');
      setPaymentRequested(false);
      setPaymentAmount(0);
      setPaymentRequestStatus('Not requested');
      setPaymentRequestNotes('');
      setPaymentProofDocumentUrl('');
    }
  }, [trip]);

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

  const handleSubmitLastMileRequest = () => {
    if (!trip) return;
    if (!lastMileSiteId.trim()) {
      alert('Please enter the Site ID for last-mile delivery.');
      return;
    }
    if (!lastMileTransportAmount || lastMileTransportAmount <= 0) {
      alert('Please enter a valid transport amount for the driver.');
      return;
    }

    const updatedTrip: TransportRequestItem = {
      ...trip,
      lastMileDeliveryRequested: true,
      lastMileSiteId,
      lastMileTransportAmount,
      lastMileRequestStatus: 'Requested',
      lastMileApprovalDocumentUrl: lastMileApprovalDocumentUrl || ''
    };
    onSaveItemTracking(updatedTrip);
    setLastMileRequestStatus('Requested');
    alert('Last-mile delivery request submitted. Waiting for transport lead approval.');
  };

  const handleApproveLastMile = () => {
    if (!trip) return;
    if (!lastMileApprovalDocumentUrl) {
      alert('Please attach the transport lead approval document before approving.');
      return;
    }

    const updatedTrip: TransportRequestItem = {
      ...trip,
      lastMileDeliveryRequested: true,
      lastMileSiteId,
      lastMileTransportAmount,
      lastMileRequestStatus: 'Approved',
      lastMileApprovalDocumentUrl
    };
    onSaveItemTracking(updatedTrip);
    setLastMileRequestStatus('Approved');
    alert('Last-mile delivery request approved by the transport lead.');
  };

  const handleSubmitPaymentRequest = () => {
    if (!trip) return;
    if (!paymentAmount || paymentAmount <= 0) {
      alert('Please enter a valid payment amount for the transporter.');
      return;
    }

    const updatedTrip: TransportRequestItem = {
      ...trip,
      paymentRequested: true,
      paymentAmount,
      paymentRequestStatus: 'Requested',
      paymentRequestNotes: paymentRequestNotes.trim(),
      paymentProofDocumentUrl: paymentProofDocumentUrl || ''
    };
    onSaveItemTracking(updatedTrip);
    setPaymentRequestStatus('Requested');
    alert('Transporter payment request submitted successfully.');
  };

  const handleApprovePaymentRequest = () => {
    if (!trip) return;
    if (!paymentProofDocumentUrl) {
      alert('Please attach payment proof before approving the request.');
      return;
    }

    const updatedTrip: TransportRequestItem = {
      ...trip,
      paymentRequested: true,
      paymentAmount,
      paymentRequestStatus: 'Approved',
      paymentRequestNotes: paymentRequestNotes.trim(),
      paymentProofDocumentUrl
    };
    onSaveItemTracking(updatedTrip);
    setPaymentRequestStatus('Approved');
    alert('Transporter payment request approved.');
  };

  const handleSaveProofOfDelivery = () => {
    if (!trip) return;
    if (photoUrls.length === 0) {
      alert('At least one proof of delivery image is required to submit.');
      return;
    }
    const updatedTrip: TransportRequestItem = {
      ...trip,
      items: itemsState,
      proofOfDeliveryPhotoUrl: photoUrls[0],
      proofOfDeliveryPhotoUrls: photoUrls,
      deliveryStatus: itemsState.every(i => i.deliveredQuantity >= i.loadedQuantity && i.loadedQuantity > 0) ? 'Delivered' : 'Partial',
      lastMileDeliveryRequested,
      lastMileSiteId: lastMileSiteId.trim() ? lastMileSiteId : trip.lastMileSiteId,
      lastMileTransportAmount: lastMileTransportAmount || trip.lastMileTransportAmount,
      lastMileRequestStatus,
      lastMileApprovalDocumentUrl,
      paymentRequested,
      paymentAmount: paymentAmount || trip.paymentAmount,
      paymentRequestStatus,
      paymentRequestNotes,
      paymentProofDocumentUrl
    };
    onSaveItemTracking(updatedTrip);
    alert('Proof of Delivery saved successfully.');
    setViewMode('list');
  };

  // Derived KPIs
  const kpis = useMemo(() => {
    let activeDeliveries = 0;
    let inTransit = 0;
    let delivered = 0;
    let partial = 0;
    let returned = 0;
    let missingDamaged = 0;
    let pendingPod = 0;
    let openRecon = 0;

    itemTracking.forEach(t => {
      if (['Loading', 'In Transit', 'Partial'].includes(t.deliveryStatus)) {
        activeDeliveries++;
      }
      if (t.reconciliationStatus === 'Open Case') {
        openRecon++;
      }
      
      t.items.forEach(item => {
        inTransit += item.loadedQuantity - item.deliveredQuantity - item.damagedQuantity - item.missingQuantity - item.returnedQuantity;
        delivered += item.deliveredQuantity;
        returned += item.returnedQuantity;
        missingDamaged += (item.missingQuantity + item.damagedQuantity);
      });
      
      if (t.deliveryStatus === 'Partial') partial++;
      if (t.deliveryStatus === 'Delivered' && t.reconciliationStatus !== 'Resolved') pendingPod++;
    });

    return { activeDeliveries, inTransit, delivered, partial, returned, missingDamaged, pendingPod, openRecon };
  }, [itemTracking]);

  const filteredTrips = itemTracking.filter(t => 
    t.tripId.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.mrRef.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.customer.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'Pending': return <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded-md text-xs font-medium">Pending</span>;
      case 'Loading': return <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-md text-xs font-medium">Loading</span>;
      case 'In Transit': return <span className="px-2 py-1 bg-[#1D9E75]/10 text-[#1D9E75] rounded-md text-xs font-medium">In Transit</span>;
      case 'Delivered': return <span className="px-2 py-1 bg-green-100 text-green-700 rounded-md text-xs font-medium">Delivered</span>;
      case 'Partial': return <span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded-md text-xs font-medium">Partial</span>;
      case 'Exceptions': return <span className="px-2 py-1 bg-red-100 text-red-700 rounded-md text-xs font-medium">Exceptions</span>;
      default: return <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded-md text-xs font-medium">{status}</span>;
    }
  };

  const getReconBadge = (status: string) => {
    switch(status) {
      case 'Clear': return <span className="px-2 py-1 bg-green-50 text-green-600 rounded-md text-[10px] uppercase font-bold tracking-wider">Clear</span>;
      case 'Open Case': return <span className="px-2 py-1 bg-red-50 text-red-600 rounded-md text-[10px] uppercase font-bold tracking-wider">Open Case</span>;
      case 'Resolved': return <span className="px-2 py-1 bg-gray-50 text-gray-600 rounded-md text-[10px] uppercase font-bold tracking-wider">Resolved</span>;
      default: return null;
    }
  };

  if (viewMode === 'list') {
    return (
      <div className="space-y-6 select-none pb-20">
        <div className="space-y-5 bg-white p-6 rounded-xl border border-[#D3D1C7] shadow-sm">
          
          {/* Header */}
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <h1 className="text-xl font-bold text-[#2C2C2A]">Proof of Delivery (POD)</h1>
              <p className="text-sm text-[#5F5E5A]">Monitor dispatch, transit status, and confirm delivery details.</p>
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
              <Plus className="w-4 h-4" /> New POD
            </button>
          </div>

          {/* KPIs */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="rounded-xl border border-[#D3D1C7] bg-[#F1EFE8]/40 p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] uppercase tracking-wider text-[#5F5E5A] font-semibold">Active Deliveries</span>
                <Truck className="w-4 h-4 text-blue-600" />
              </div>
              <p className="mt-2 text-2xl font-bold text-[#2C2C2A]">{kpis.activeDeliveries}</p>
            </div>
            <div className="rounded-xl border border-[#D3D1C7] bg-[#F1EFE8]/40 p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] uppercase tracking-wider text-[#5F5E5A] font-semibold">In Transit</span>
                <Package className="w-4 h-4 text-[#1D9E75]" />
              </div>
              <p className="mt-2 text-2xl font-bold text-[#2C2C2A]">{kpis.inTransit}</p>
            </div>
            <div className="rounded-xl border border-[#D3D1C7] bg-[#F1EFE8]/40 p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] uppercase tracking-wider text-[#5F5E5A] font-semibold">Delivered</span>
                <CheckCircle2 className="w-4 h-4 text-green-600" />
              </div>
              <p className="mt-2 text-2xl font-bold text-[#2C2C2A]">{kpis.delivered}</p>
            </div>
            <div className="rounded-xl border border-[#D3D1C7] bg-[#F1EFE8]/40 p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] uppercase tracking-wider text-[#5F5E5A] font-semibold">Missing/Damaged</span>
                <AlertTriangle className="w-4 h-4 text-red-600" />
              </div>
              <p className="mt-2 text-2xl font-bold text-[#2C2C2A]">{kpis.missingDamaged}</p>
            </div>
          </div>

          {/* Search */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative w-full sm:w-96">
              <Search className="w-3.5 h-3.5 text-[#5F5E5A] absolute left-3 top-1/2 -translate-y-1/2" />
              <input 
                type="text" 
                placeholder="Search by Trip ID, MR, or Customer..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full h-9 pl-9 pr-3 rounded-lg border border-[#D3D1C7] bg-[#F1EFE8]/30 font-sans text-xs text-[#2C2C2A] focus:outline-none focus:border-[#1D9E75]"
              />
            </div>
          </div>

          {/* Data Table */}
          <div className="overflow-x-auto border border-[#D3D1C7]/60 rounded-lg">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#F1EFE8]/45 border-b border-[#D3D1C7]/80 text-[10px] font-sans font-semibold text-[#5F5E5A] uppercase tracking-wider">
                  <th className="p-3">Trip ID / MR</th>
                  <th className="p-3">Customer & Route</th>
                  <th className="p-3 text-center">Quantities (L/T/D)</th>
                  <th className="p-3 text-center">Exceptions</th>
                  <th className="p-3 text-center">Status</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#D3D1C7]/40 text-xs font-sans text-[#2C2C2A]">
                {filteredTrips.map(t => (
                  <tr key={t.tripId} className="hover:bg-[#F1EFE8]/25 transition-colors">
                    <td className="p-3">
                      <div className="flex flex-col">
                        <span className="font-semibold text-gray-900">{t.tripId}</span>
                        <span className="text-[10px] text-gray-500 mt-0.5">{t.mrRef}</span>
                      </div>
                    </td>
                    <td className="p-3">
                      <div className="flex flex-col">
                        <span className="font-medium text-gray-800">{t.customer}</span>
                        <div className="flex items-center gap-1 text-[10px] text-gray-500 mt-1">
                          <MapPin className="w-3 h-3" />
                          <span className="truncate max-w-[150px]">{t.originWarehouse} &rarr; {t.destination}</span>
                        </div>
                      </div>
                    </td>
                    <td className="p-3">
                      <div className="flex justify-center items-center gap-2 text-[10px] font-mono">
                        <div className="flex flex-col items-center" title="Loaded"><span className="text-gray-400">L</span><span className="font-medium">{t.loadedQuantity}</span></div>
                        <div className="flex flex-col items-center" title="In Transit"><span className="text-gray-400">T</span><span className="font-medium text-blue-600">{t.inTransitQuantity}</span></div>
                        <div className="flex flex-col items-center" title="Delivered"><span className="text-gray-400">D</span><span className="font-medium text-[#1D9E75]">{t.deliveredQuantity}</span></div>
                      </div>
                    </td>
                    <td className="p-3 text-center">
                      <div className="flex justify-center items-center gap-1 text-[10px]">
                        {(t.damagedQuantity > 0 || t.missingQuantity > 0) ? (
                          <div className="flex gap-1">
                            {t.missingQuantity > 0 && <span className="flex items-center gap-0.5 text-red-600 bg-red-50 px-1 py-0.5 rounded font-medium"><XCircle className="w-2.5 h-2.5"/> {t.missingQuantity}</span>}
                            {t.damagedQuantity > 0 && <span className="flex items-center gap-0.5 text-orange-600 bg-orange-50 px-1 py-0.5 rounded font-medium"><AlertTriangle className="w-2.5 h-2.5"/> {t.damagedQuantity}</span>}
                          </div>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </div>
                    </td>
                    <td className="p-3">
                      <div className="flex flex-col items-center gap-1.5">
                        {getStatusBadge(t.deliveryStatus)}
                        {getReconBadge(t.reconciliationStatus)}
                      </div>
                    </td>
                    <td className="p-3 text-right">
                      <button 
                        onClick={() => {
                          setSelectedMrId(t.mrRef);
                          setViewMode('form');
                        }}
                        className="px-2.5 py-1 text-[10px] border border-[#D3D1C7] rounded hover:bg-[#F1EFE8] transition-colors"
                      >
                        Edit POD
                      </button>
                    </td>
                  </tr>
                ))}
                {filteredTrips.length === 0 && (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-[#5F5E5A] italic">
                      No tracking records found.
                    </td>
                  </tr>
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
          <h1 className="text-2xl font-bold text-[#2C2C2A] tracking-tight">Proof of Delivery</h1>
          <p className="text-sm text-gray-500 mt-1">Select MR to confirm delivered items</p>
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
            disabled={!selectedSiteId && !selectedMrId /* keep enabled if we launched directly to edit */}
            className="w-full sm:w-2/3 px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-[#1D9E75] font-medium disabled:opacity-50"
          >
            <option value="">-- Select MR --</option>
            {/* If we navigated directly from edit, show the MR even if site isn't selected */}
            {(mrOptions.length > 0 ? mrOptions : (mrs.filter(mr => mr.mrNumber === selectedMrId))).map(mr => (
              <option key={mr.mrNumber} value={mr.mrNumber}>{mr.mrNumber}</option>
            ))}
          </select>
        </div>
      </div>

      {trip && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          
          {/* Shipment Meta Header */}
          <div className="bg-white rounded-xl border border-[#E5E2D9] shadow-sm overflow-hidden">
            <div className="p-5 bg-[#F1EFE8]/50 border-b border-[#E5E2D9] flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-[#1D9E75]" />
                  Proof of Delivery for Trip {trip.tripId}
                </h2>
                <p className="text-sm text-gray-600 mt-1">{trip.customer} · {trip.vehicle} · Driver: {trip.driver}</p>
              </div>
              <div className="flex flex-col gap-3 sm:items-end">
                {getStatusBadge(trip.deliveryStatus)}
                {selectedSite ? (
                  <div className="rounded-2xl border border-[#D3D1C7] bg-white px-4 py-3 text-sm text-gray-700 shadow-sm min-w-[220px]">
                    <p className="font-semibold text-gray-900">Receiver Contact</p>
                    <p className="mt-1">{selectedSite.receiverName || 'Not available'}</p>
                    <p className="text-gray-500">{selectedSite.receiverPhone || 'No phone provided'}</p>
                  </div>
                ) : (
                  <div className="rounded-2xl border border-[#D3D1C7] bg-[#F9FAF6] px-4 py-3 text-sm text-gray-500 shadow-sm min-w-[220px]">
                    <p className="font-semibold text-gray-900">Receiver Contact</p>
                    <p className="mt-1">Select a site to display receiver details.</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Checklist */}
          <div className="bg-white rounded-xl border border-[#E5E2D9] shadow-sm overflow-hidden">
            <div className="p-5 border-b border-[#E5E2D9] bg-gray-50 flex justify-between items-center">
              <h3 className="font-bold text-gray-800">Items Verification</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-white border-b border-gray-200 text-[10px] uppercase tracking-wider text-gray-500 font-semibold">
                    <th className="px-5 py-3">Item & Code</th>
                    <th className="px-5 py-3 text-center w-24">Expected</th>
                    <th className="px-5 py-3 text-center w-24">Loaded Qty</th>
                    <th className="px-5 py-3 text-center w-24">Delivered</th>
                    <th className="px-5 py-3 text-center w-24">Damaged</th>
                    <th className="px-5 py-3 text-center w-24">Missing</th>
                    <th className="px-5 py-3 text-center w-24">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {itemsState.map(item => {
                    const isFullyDelivered = item.deliveredQuantity === item.loadedQuantity && item.loadedQuantity > 0;
                    const hasIssues = item.damagedQuantity > 0 || item.missingQuantity > 0;

                    return (
                      <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-5 py-4">
                          <p className="font-semibold text-sm text-gray-900">{item.itemName}</p>
                          <p className="text-xs text-gray-500 font-mono mt-0.5">{item.itemCode}</p>
                        </td>
                        <td className="px-5 py-4 text-center">
                          <span className="text-sm font-semibold text-gray-600">{item.expectedQuantity}</span>
                        </td>
                        <td className="px-5 py-4 text-center">
                          <span className="text-sm font-semibold text-gray-600">{item.loadedQuantity}</span>
                        </td>
                        <td className="px-5 py-4 text-center">
                          <input 
                            type="number" 
                            min="0"
                            value={item.deliveredQuantity}
                            onChange={(e) => updateItem(item.id, { deliveredQuantity: parseInt(e.target.value) || 0 })}
                            className={`w-16 px-2 py-1.5 text-center text-sm font-bold border rounded-md focus:outline-none focus:ring-2 ${isFullyDelivered ? 'border-green-300 text-green-700 bg-green-50' : 'border-gray-300 text-gray-900 focus:ring-[#1D9E75]/30'}`}
                          />
                        </td>
                        <td className="px-5 py-4 text-center">
                          <input 
                            type="number" 
                            min="0"
                            value={item.damagedQuantity}
                            onChange={(e) => updateItem(item.id, { damagedQuantity: parseInt(e.target.value) || 0 })}
                            className="w-16 px-2 py-1.5 text-center text-sm font-bold border rounded-md border-gray-300 text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#1D9E75]/30"
                          />
                        </td>
                        <td className="px-5 py-4 text-center">
                          <input 
                            type="number" 
                            min="0"
                            value={item.missingQuantity}
                            onChange={(e) => updateItem(item.id, { missingQuantity: parseInt(e.target.value) || 0 })}
                            className="w-16 px-2 py-1.5 text-center text-sm font-bold border rounded-md border-gray-300 text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#1D9E75]/30"
                          />
                        </td>
                        <td className="px-5 py-4 text-center">
                          {isFullyDelivered && !hasIssues ? (
                            <div className="flex justify-center">
                              <CheckCircle2 className="w-5 h-5 text-green-500" />
                            </div>
                          ) : hasIssues ? (
                            <div className="flex justify-center flex-col items-center gap-1">
                              <AlertTriangle className="w-4 h-4 text-orange-500" />
                              <span className="text-[10px] font-bold text-orange-600 uppercase">Issue</span>
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
          </div>

          {/* Proof of Delivery Photo Upload */}
          <div className="bg-white rounded-xl border border-[#E5E2D9] shadow-sm overflow-hidden p-6">
            <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
              <Camera className="w-5 h-5 text-gray-400" /> Proof of Delivery Evidence <span className="text-red-500">*</span>
            </h3>
            <div className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-lg p-8 bg-gray-50 transition-colors hover:bg-gray-100">
              {photoUrls.length > 0 ? (
                <div className="w-full space-y-4">
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {photoUrls.map((url, index) => (
                      <div key={`${url}-${index}`} className="relative rounded-xl overflow-hidden border border-gray-200 bg-white h-32">
                        <img src={url} alt={`POD Evidence ${index + 1}`} className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => setPhotoUrls(prev => prev.filter((_, idx) => idx !== index))}
                          className="absolute top-2 right-2 h-7 w-7 rounded-full bg-white/90 text-red-600 flex items-center justify-center shadow-sm"
                        >
                          <XCircle className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                  <label className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-bold text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer">
                    Add More Images
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      className="hidden"
                      onChange={(e) => {
                        const files = e.target.files;
                        if (files && files.length > 0) {
                          const urls = Array.from(files).map(file => URL.createObjectURL(file as Blob));
                          setPhotoUrls(prev => [...prev, ...urls]);
                        }
                      }}
                    />
                  </label>
                </div>
              ) : (
                <>
                  <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-sm mb-4">
                    <Camera className="w-8 h-8 text-[#1D9E75]" />
                  </div>
                  <p className="text-sm font-medium text-gray-700 mb-1">Upload Delivery Photos</p>
                  <p className="text-xs text-gray-500 mb-4 text-center max-w-xs">Attach photos of the signed waybill or delivered items on-site. You can add more images.</p>
                  <label className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg text-sm font-bold hover:bg-gray-50 transition-colors shadow-sm cursor-pointer">
                    Browse Files
                    <input 
                      type="file" 
                      accept="image/*"
                      multiple
                      className="hidden" 
                      onChange={(e) => {
                        const files = e.target.files;
                        if (files && files.length > 0) {
                          const urls = Array.from(files).map(file => URL.createObjectURL(file as Blob));
                          setPhotoUrls(urls);
                        }
                      }} 
                    />
                  </label>
                </>
              )}
            </div>
          </div>

          {/* Last Mile Delivery Request */}
          <div className="bg-white rounded-xl border border-[#E5E2D9] shadow-sm overflow-hidden p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-bold text-gray-800">Last Mile Delivery Request</h3>
                <p className="text-sm text-gray-500">Capture driver transport amount and approval details for last-mile service.</p>
              </div>
              <label className="inline-flex items-center gap-2 text-sm font-semibold text-[#2C2C2A]">
                <input
                  type="checkbox"
                  checked={lastMileDeliveryRequested}
                  onChange={(e) => setLastMileDeliveryRequested(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 text-[#1D9E75] focus:ring-[#1D9E75]"
                />
                Last mile delivery required
              </label>
            </div>

            {lastMileDeliveryRequested ? (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-semibold text-gray-700">Site ID</label>
                    <input
                      type="text"
                      value={lastMileSiteId}
                      onChange={(e) => setLastMileSiteId(e.target.value)}
                      placeholder="Enter last-mile site ID"
                      className="h-11 px-4 border border-gray-300 rounded-lg bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#1D9E75]"
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-semibold text-gray-700">Transport Amount (ETB)</label>
                    <input
                      type="number"
                      value={lastMileTransportAmount || ''}
                      onChange={(e) => setLastMileTransportAmount(Number(e.target.value) || 0)}
                      placeholder="Amount paid to driver"
                      className="h-11 px-4 border border-gray-300 rounded-lg bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#1D9E75]"
                    />
                  </div>
                </div>
                <button
                  onClick={handleSubmitLastMileRequest}
                  className="inline-flex items-center gap-2 px-5 py-2 bg-[#1D9E75] text-white rounded-lg text-sm font-bold hover:bg-[#168561] transition-colors"
                >
                  Submit Last Mile Request
                </button>
              </div>
            ) : (
              <div className="text-sm text-gray-500">Enable the checkbox to submit a last-mile delivery request for this trip.</div>
            )}

            {(lastMileRequestStatus !== 'Not requested') && (
              <div className="mt-6 rounded-2xl border border-[#D3D1C7] bg-[#F9FAF6] p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-sm text-gray-600 font-semibold">Last-mile request status</p>
                    <p className="text-xs text-gray-500">Site ID: {lastMileSiteId || 'n/a'}</p>
                    <p className="text-xs text-gray-500">Amount: {lastMileTransportAmount ? `ETB ${lastMileTransportAmount}` : 'n/a'}</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                    lastMileRequestStatus === 'Approved' ? 'bg-emerald-100 text-emerald-800' :
                    lastMileRequestStatus === 'Requested' ? 'bg-amber-100 text-amber-800' :
                    'bg-gray-100 text-gray-700'
                  }`}>
                    {lastMileRequestStatus}
                  </span>
                </div>

                {lastMileRequestStatus === 'Requested' && (
                  <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex flex-col gap-2">
                      <label className="text-sm font-semibold text-gray-700">Transport Lead Approval Document</label>
                      <div className="flex items-center gap-3">
                        <label className="px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm font-semibold text-gray-700 hover:bg-gray-50 cursor-pointer">
                          Upload Document
                          <input
                            type="file"
                            accept="application/pdf,image/*"
                            className="hidden"
                            onChange={(e) => {
                              if (e.target.files && e.target.files.length > 0) {
                                setLastMileApprovalDocumentUrl(URL.createObjectURL(e.target.files[0]));
                              }
                            }}
                          />
                        </label>
                        {lastMileApprovalDocumentUrl && (
                          <span className="text-sm text-gray-600 break-all max-w-xs">Attached</span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-end justify-end">
                      <button
                        onClick={handleApproveLastMile}
                        disabled={!lastMileApprovalDocumentUrl}
                        className="inline-flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-bold transition-colors disabled:cursor-not-allowed disabled:bg-gray-200 disabled:text-gray-500 bg-[#1D9E75] text-white hover:bg-[#168561]"
                      >
                        Approve Request
                      </button>
                    </div>
                  </div>
                )}

                {lastMileRequestStatus === 'Approved' && lastMileApprovalDocumentUrl && (
                  <div className="mt-4 text-sm text-gray-600">
                    Approval document attached. Transport lead approval is complete.
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Transporter Payment Request */}
          <div className="bg-white rounded-xl border border-[#E5E2D9] shadow-sm overflow-hidden p-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-4">
              <div>
                <h3 className="font-bold text-gray-800">Transporter Payment Request</h3>
                <p className="text-sm text-gray-500">Request transporter payment after the trip is closed and delivered.</p>
              </div>
              <label className="inline-flex items-center gap-2 text-sm font-semibold text-[#2C2C2A]">
                <input
                  type="checkbox"
                  checked={paymentRequested}
                  onChange={(e) => setPaymentRequested(e.target.checked)}
                  disabled={trip.deliveryStatus !== 'Delivered'}
                  className="h-4 w-4 rounded border-gray-300 text-[#1D9E75] focus:ring-[#1D9E75]"
                />
                Request payment
              </label>
            </div>

            {trip.deliveryStatus !== 'Delivered' && (
              <div className="mb-4 rounded-xl border border-dashed border-gray-200 bg-[#FEF9EF] p-4 text-sm text-[#5F5E5A]">
                Payment requests can be created once the trip has been marked as <span className="font-semibold">Delivered</span>.
              </div>
            )}

            {paymentRequested ? (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-semibold text-gray-700">Transporter Payment Amount (ETB)</label>
                    <input
                      type="number"
                      min="0"
                      value={paymentAmount || ''}
                      onChange={(e) => setPaymentAmount(Number(e.target.value) || 0)}
                      placeholder="Enter transporter payment amount"
                      className="h-11 px-4 border border-gray-300 rounded-lg bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#1D9E75]"
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-semibold text-gray-700">Payment Notes</label>
                    <textarea
                      value={paymentRequestNotes}
                      onChange={(e) => setPaymentRequestNotes(e.target.value)}
                      placeholder="Enter payment request details"
                      className="min-h-[110px] px-4 py-3 border border-gray-300 rounded-lg bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#1D9E75]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-2">
                    <span className="text-sm font-semibold text-gray-700">Payment Proof Document</span>
                    <div className="flex items-center gap-3">
                      <label className="px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm font-semibold text-gray-700 hover:bg-gray-50 cursor-pointer">
                        Upload Document
                        <input
                          type="file"
                          accept="application/pdf,image/*"
                          className="hidden"
                          onChange={(e) => {
                            if (e.target.files && e.target.files.length > 0) {
                              setPaymentProofDocumentUrl(URL.createObjectURL(e.target.files[0]));
                            }
                          }}
                        />
                      </label>
                      {paymentProofDocumentUrl && (
                        <span className="text-sm text-gray-600 break-all max-w-xs">Attached</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-end justify-end">
                    <button
                      onClick={handleSubmitPaymentRequest}
                      disabled={trip.deliveryStatus !== 'Delivered'}
                      className="inline-flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-bold transition-colors disabled:cursor-not-allowed disabled:bg-gray-200 disabled:text-gray-500 bg-[#1D9E75] text-white hover:bg-[#168561]"
                    >
                      Submit Payment Request
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-sm text-gray-500">Enable the payment request checkbox after delivery is complete to raise transporter payment.</div>
            )}

            {(paymentRequestStatus !== 'Not requested') && (
              <div className="mt-6 rounded-2xl border border-[#D3D1C7] bg-[#F9FAF6] p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-sm text-gray-600 font-semibold">Payment request status</p>
                    <p className="text-xs text-gray-500">Amount: {paymentAmount ? `ETB ${paymentAmount}` : 'N/A'}</p>
                    {paymentRequestNotes && <p className="text-xs text-gray-500">Notes: {paymentRequestNotes}</p>}
                  </div>
                  <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                    paymentRequestStatus === 'Approved' ? 'bg-emerald-100 text-emerald-800' :
                    paymentRequestStatus === 'Requested' ? 'bg-amber-100 text-amber-800' :
                    'bg-gray-100 text-gray-700'
                  }`}>
                    {paymentRequestStatus}
                  </span>
                </div>

                {paymentRequestStatus === 'Requested' && (
                  <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center justify-end">
                      <button
                        onClick={handleApprovePaymentRequest}
                        disabled={!paymentProofDocumentUrl}
                        className="inline-flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-bold transition-colors disabled:cursor-not-allowed disabled:bg-gray-200 disabled:text-gray-500 bg-[#1D9E75] text-white hover:bg-[#168561]"
                      >
                        Approve Payment
                      </button>
                    </div>
                  </div>
                )}

                {paymentRequestStatus === 'Approved' && paymentProofDocumentUrl && (
                  <div className="mt-4 text-sm text-gray-600">Payment proof attached and transporter payment approved.</div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Floating Action Bar */}
      {trip && (
        <div className="fixed bottom-0 left-[240px] right-0 bg-white border-t border-gray-200 p-4 shadow-[0_-4px_10px_rgba(0,0,0,0.05)] z-20 flex justify-end items-center px-8 animate-in slide-in-from-bottom-full duration-300">
          <button 
            onClick={handleSaveProofOfDelivery}
            className="flex items-center gap-2 px-8 py-2 bg-[#1D9E75] text-white rounded-lg text-sm font-bold hover:bg-[#168561] transition-colors shadow-sm"
          >
            <Check className="w-5 h-5" /> Save Proof of Delivery
          </button>
        </div>
      )}
    </div>
  );
}

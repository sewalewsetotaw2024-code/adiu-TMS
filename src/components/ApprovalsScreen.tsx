import React, { useMemo, useState } from 'react';
import { Search, ShieldCheck, CheckCircle2, XCircle, Clock, FileText, ArrowRight } from 'lucide-react';
import {
  ProfitabilityAnalysis,
  TransportRequestItem,
  LoadingConfirmationData,
  WccClosure,
  Vehicle
} from '../types';

interface ApprovalsScreenProps {
  pas: ProfitabilityAnalysis[];
  itemTracking: TransportRequestItem[];
  loadingConfirmations: LoadingConfirmationData[];
  wccClosures: WccClosure[];
  vehicles: Vehicle[];
  onSavePa: (updatedPa: ProfitabilityAnalysis) => void;
  onSaveItemTracking: (updatedTracking: TransportRequestItem) => void;
  onSaveLoadingConfirmation: (updatedConfirmation: LoadingConfirmationData) => void;
  onSaveWcc: (updatedWcc: WccClosure) => void;
  onSaveVehicle: (vehicle: Vehicle) => void;
  setScreen: (screen: string) => void;
}

type ApprovalSourceKey = 'pa' | 'lastMile' | 'payment' | 'loading' | 'wcc' | 'vehicle';

type ApprovalRequest = {
  id: string;
  sourceKey: ApprovalSourceKey;
  requestType: string;
  entityRef: string;
  title: string;
  description: string;
  status: string;
  requestedDate: string;
  assignee: string;
  screen: string;
  value: string;
  rawRecordId: string;
};

const formatDate = (dateString: string) => {
  if (!dateString) return 'Unknown';
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return dateString;
  return date.toLocaleDateString();
};

export default function ApprovalsScreen({
  pas,
  itemTracking,
  loadingConfirmations,
  wccClosures,
  vehicles,
  onSavePa,
  onSaveItemTracking,
  onSaveLoadingConfirmation,
  onSaveWcc,
  onSaveVehicle,
  setScreen
}: ApprovalsScreenProps) {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'pa' | 'lastMile' | 'payment' | 'loading' | 'wcc' | 'vehicle'>('all');

  const approvalRequests = useMemo<ApprovalRequest[]>(() => {
    const list: ApprovalRequest[] = [];

    pas.filter(pa => pa.approvalStatus === 'Pending').forEach(pa => {
      const selectedQuote = pa.quoteComparison.find(row => row.supplierId === pa.selectedSupplierId)
        || pa.quoteComparison[0];
      const variance = selectedQuote?.variancePercent ?? 0;
      list.push({
        id: `pa-${pa.paNumber}`,
        sourceKey: 'pa',
        requestType: 'Profitability Approval',
        entityRef: pa.paNumber,
        title: `PA approval for ${pa.paNumber}`,
        description: `MR ${pa.mrRef} needs financial sign-off (${variance >= 0 ? '+' : ''}${variance}% variance).`, 
        status: 'Pending Approval',
        requestedDate: pa.date,
        assignee: 'Transport Lead',
        screen: 'profitability',
        value: `MR ${pa.mrRef}`,
        rawRecordId: pa.paNumber
      });
    });

    itemTracking.filter(trip => trip.lastMileRequestStatus === 'Requested').forEach(trip => {
      list.push({
        id: `lm-${trip.tripId}`,
        sourceKey: 'lastMile',
        requestType: 'Last-Mile Approval',
        entityRef: trip.tripId,
        title: `Last-mile transport request for ${trip.tripId}`,
        description: `Trip for MR ${trip.mrRef} is requesting last-mile approval.`, 
        status: 'Requested',
        requestedDate: trip.dispatchDate,
        assignee: 'Transport Lead',
        screen: 'item-tracking',
        value: `${trip.lastMileTransportAmount ? `ETB ${trip.lastMileTransportAmount}` : 'No amount set'}`,
        rawRecordId: trip.tripId
      });
    });

    itemTracking.filter(trip => trip.paymentRequestStatus === 'Requested').forEach(trip => {
      list.push({
        id: `pay-${trip.tripId}`,
        sourceKey: 'payment',
        requestType: 'Payment Approval',
        entityRef: trip.tripId,
        title: `Transporter payment for ${trip.tripId}`,
        description: `Payment approval requested for MR ${trip.mrRef}.`, 
        status: 'Requested',
        requestedDate: trip.dispatchDate,
        assignee: 'Finance',
        screen: 'item-tracking',
        value: `${trip.paymentAmount ? `ETB ${trip.paymentAmount}` : 'No amount set'}`,
        rawRecordId: trip.tripId
      });
    });

    loadingConfirmations.filter(conf => conf.status === 'Pending Approval').forEach(conf => {
      list.push({
        id: `lc-${conf.tripId}`,
        sourceKey: 'loading',
        requestType: 'Loading Confirmation',
        entityRef: conf.tripId,
        title: `Loading confirmation for ${conf.tripId}`,
        description: `Awaiting approval for trip ${conf.tripId}.`, 
        status: 'Pending Approval',
        requestedDate: conf.confirmationTime ?? '',
        assignee: 'Loading Inspector',
        screen: 'loading-confirmation',
        value: conf.operatorName,
        rawRecordId: conf.tripId
      });
    });

    wccClosures.filter(wcc => wcc.wccStatus === 'Applied').forEach(wcc => {
      list.push({
        id: `wcc-${wcc.mrRef}`,
        sourceKey: 'wcc',
        requestType: 'WCC Application',
        entityRef: wcc.mrRef,
        title: `WCC approval for ${wcc.mrRef}`,
        description: `Work completion certificate for PO ${wcc.poNumber}.`, 
        status: 'Applied',
        requestedDate: '',
        assignee: 'QA Manager',
        screen: 'wcc',
        value: `${wcc.poVariancePercent}% variance`, 
        rawRecordId: wcc.mrRef
      });
    });

    vehicles.filter(vehicle => vehicle.approvalStatus === 'Pending Approval').forEach(vehicle => {
      list.push({
        id: `veh-${vehicle.plateNumber}`,
        sourceKey: 'vehicle',
        requestType: 'Vehicle Approval',
        entityRef: vehicle.plateNumber,
        title: `Vehicle approval for ${vehicle.plateNumber}`,
        description: `Driver ${vehicle.driverName} requires vehicle compliance approval.`, 
        status: 'Pending Approval',
        requestedDate: '',
        assignee: 'QEHS',
        screen: 'vehicles',
        value: vehicle.model,
        rawRecordId: vehicle.plateNumber
      });
    });

    return list.sort((a, b) => {
      if (!a.requestedDate && !b.requestedDate) return 0;
      if (!a.requestedDate) return 1;
      if (!b.requestedDate) return -1;
      return new Date(b.requestedDate).getTime() - new Date(a.requestedDate).getTime();
    });
  }, [pas, itemTracking, loadingConfirmations, wccClosures, vehicles]);

  const filteredRequests = useMemo(() => {
    return approvalRequests.filter(request => {
      const matchesFilter = activeFilter === 'all' || request.sourceKey === activeFilter;
      const matchesSearch = searchQuery.trim().length === 0 || [
        request.title,
        request.description,
        request.entityRef,
        request.requestType,
        request.value
      ].some(field => field.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchesFilter && matchesSearch;
    });
  }, [approvalRequests, activeFilter, searchQuery]);

  const handleApproveRequest = (request: ApprovalRequest) => {
    switch (request.sourceKey) {
      case 'pa': {
        const pa = pas.find(item => item.paNumber === request.rawRecordId);
        if (!pa) return;
        onSavePa({
          ...pa,
          approvalStatus: 'Approved',
          approverName: 'Solomon Tekle',
          approvalReference: `APP-${Date.now()}`,
          approvalDocumentedDate: new Date().toISOString()
        });
        break;
      }
      case 'lastMile': {
        const trip = itemTracking.find(item => item.tripId === request.rawRecordId);
        if (!trip) return;
        onSaveItemTracking({
          ...trip,
          lastMileRequestStatus: 'Approved'
        });
        break;
      }
      case 'payment': {
        const trip = itemTracking.find(item => item.tripId === request.rawRecordId);
        if (!trip) return;
        onSaveItemTracking({
          ...trip,
          paymentRequestStatus: 'Approved'
        });
        break;
      }
      case 'loading': {
        const conf = loadingConfirmations.find(item => item.tripId === request.rawRecordId);
        if (!conf) return;
        onSaveLoadingConfirmation({
          ...conf,
          status: 'Confirmed'
        });
        break;
      }
      case 'wcc': {
        const wcc = wccClosures.find(item => item.mrRef === request.rawRecordId);
        if (!wcc) return;
        onSaveWcc({
          ...wcc,
          wccStatus: 'Approved'
        });
        break;
      }
      case 'vehicle': {
        const vehicle = vehicles.find(item => item.plateNumber === request.rawRecordId);
        if (!vehicle) return;
        onSaveVehicle({
          ...vehicle,
          approvalStatus: 'Approved'
        });
        break;
      }
    }
  };

  const handleRejectRequest = (request: ApprovalRequest) => {
    switch (request.sourceKey) {
      case 'pa': {
        const pa = pas.find(item => item.paNumber === request.rawRecordId);
        if (!pa) return;
        onSavePa({
          ...pa,
          approvalStatus: 'Rejected',
          approverName: 'Solomon Tekle',
          approvalReference: `REJ-${Date.now()}`,
          approvalDocumentedDate: new Date().toISOString()
        });
        break;
      }
      case 'lastMile': {
        const trip = itemTracking.find(item => item.tripId === request.rawRecordId);
        if (!trip) return;
        onSaveItemTracking({
          ...trip,
          lastMileRequestStatus: 'Rejected'
        });
        break;
      }
      case 'payment': {
        const trip = itemTracking.find(item => item.tripId === request.rawRecordId);
        if (!trip) return;
        onSaveItemTracking({
          ...trip,
          paymentRequestStatus: 'Rejected'
        });
        break;
      }
      case 'loading': {
        const conf = loadingConfirmations.find(item => item.tripId === request.rawRecordId);
        if (!conf) return;
        onSaveLoadingConfirmation({
          ...conf,
          status: 'Draft',
          notes: `${conf.notes || ''}\nRejected from Approvals dashboard.`
        });
        break;
      }
      case 'wcc': {
        const wcc = wccClosures.find(item => item.mrRef === request.rawRecordId);
        if (!wcc) return;
        onSaveWcc({
          ...wcc,
          wccStatus: 'Rejected'
        });
        break;
      }
      case 'vehicle': {
        const vehicle = vehicles.find(item => item.plateNumber === request.rawRecordId);
        if (!vehicle) return;
        onSaveVehicle({
          ...vehicle,
          approvalStatus: 'Rejected'
        });
        break;
      }
    }
  };

  const summaryCounts = useMemo(() => {
    return {
      total: approvalRequests.length,
      pa: approvalRequests.filter(item => item.sourceKey === 'pa').length,
      lastMile: approvalRequests.filter(item => item.sourceKey === 'lastMile').length,
      payment: approvalRequests.filter(item => item.sourceKey === 'payment').length,
      loading: approvalRequests.filter(item => item.sourceKey === 'loading').length,
      wcc: approvalRequests.filter(item => item.sourceKey === 'wcc').length,
      vehicle: approvalRequests.filter(item => item.sourceKey === 'vehicle').length
    };
  }, [approvalRequests]);

  return (
    <div className="space-y-6 select-none pb-20" id="approvals-screen-container">
      <div className="bg-white p-6 rounded-xl border border-[#D3D1C7] shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-2xl bg-[#1D9E75]/10 text-[#1D9E75] flex items-center justify-center">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-[#2C2C2A]">Approvals</h1>
                <p className="text-sm text-[#5F5E5A]">Manage approval requests across profitability, transport, loading, WCC, and vehicle compliance.</p>
              </div>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => setSearchQuery('')}
              className="px-4 py-2 border border-[#D3D1C7] rounded-lg text-xs text-[#2C2C2A] hover:bg-[#F1EFE8] transition"
            >
              Reset filters
            </button>
            <div className="relative min-w-[220px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#5F5E5A] w-3.5 h-3.5" />
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search approvals..."
                className="w-full h-10 pl-10 pr-3 rounded-lg border border-[#D3D1C7] bg-[#F1EFE8]/50 text-sm text-[#2C2C2A] focus:outline-none focus:border-[#1D9E75]"
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-6">
          {[
            { label: 'Total approvals', value: summaryCounts.total },
            { label: 'Profitability', value: summaryCounts.pa },
            { label: 'Last-mile', value: summaryCounts.lastMile },
            { label: 'Loading', value: summaryCounts.loading }
          ].map(item => (
            <div key={item.label} className="rounded-2xl border border-[#D3D1C7] bg-[#F1EFE8]/50 p-4">
              <p className="text-[10px] uppercase tracking-wider text-[#5F5E5A] font-semibold">{item.label}</p>
              <p className="mt-3 text-2xl font-bold text-[#2C2C2A]">{item.value}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white p-4 rounded-xl border border-[#D3D1C7] shadow-sm">
        <div className="flex flex-wrap items-center gap-2 mb-4 text-xs font-semibold uppercase tracking-wider text-[#5F5E5A]">
          {[
            { id: 'all', label: 'All' },
            { id: 'pa', label: 'Profitability' },
            { id: 'lastMile', label: 'Last-mile' },
            { id: 'payment', label: 'Payment' },
            { id: 'loading', label: 'Loading' },
            { id: 'wcc', label: 'WCC' },
            { id: 'vehicle', label: 'Vehicle' }
          ].map(filter => (
            <button
              key={filter.id}
              onClick={() => setActiveFilter(filter.id as typeof activeFilter)}
              className={`px-3 py-2 rounded-full text-xs transition ${activeFilter === filter.id ? 'bg-[#1D9E75] text-white' : 'bg-[#F1EFE8] text-[#5F5E5A] hover:bg-[#E6E5E2]'}`}
            >
              {filter.label}
            </button>
          ))}
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#F1EFE8] border-b border-[#D3D1C7] text-[10px] uppercase tracking-wider text-[#5F5E5A]">
                <th className="px-4 py-3">Request</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Target</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Requested</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#D3D1C7]/60 text-sm text-[#2C2C2A]">
              {filteredRequests.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-6 text-center text-[#5F5E5A] italic">No pending approvals match your filter.</td>
                </tr>
              ) : filteredRequests.map(request => (
                <tr key={request.id} className="hover:bg-[#F1EFE8]/60 transition-colors">
                  <td className="px-4 py-4 align-top">
                    <div className="flex items-start gap-3">
                      <div className="w-9 h-9 rounded-2xl bg-[#1D9E75]/10 text-[#1D9E75] flex items-center justify-center">
                        <FileText className="w-4 h-4" />
                      </div>
                      <div className="space-y-1">
                        <button
                          onClick={() => setScreen(request.screen)}
                          className="text-sm font-semibold text-[#1D1C19] hover:text-[#1D9E75] transition"
                        >
                          {request.title}
                        </button>
                        <p className="text-[12px] text-[#5F5E5A] max-w-[420px]">{request.description}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4 align-top text-[#5F5E5A]">{request.requestType}</td>
                  <td className="px-4 py-4 align-top">
                    <div className="text-sm font-semibold text-[#2C2C2A]">{request.entityRef}</div>
                    <div className="text-[12px] text-[#5F5E5A]">{request.value}</div>
                  </td>
                  <td className="px-4 py-4 align-top">
                    <span className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-[11px] font-semibold ${
                      request.status === 'Approved' ? 'bg-emerald-50 text-emerald-700' :
                      request.status === 'Rejected' ? 'bg-red-50 text-red-700' :
                      request.status === 'Pending Approval' ? 'bg-sky-50 text-sky-700' :
                      request.status === 'Requested' ? 'bg-amber-50 text-amber-700' :
                      'bg-slate-50 text-slate-700'
                    }`}>
                      {request.status}
                    </span>
                  </td>
                  <td className="px-4 py-4 align-top text-[#5F5E5A]">{formatDate(request.requestedDate)}</td>
                  <td className="px-4 py-4 align-top text-right">
                    <div className="flex flex-wrap justify-end gap-2">
                      <button
                        onClick={() => handleRejectRequest(request)}
                        className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-[#E5E4E0] text-[#7B7A76] hover:border-red-300 hover:text-red-700 transition"
                      >
                        <XCircle className="w-4 h-4" />
                        Reject
                      </button>
                      <button
                        onClick={() => handleApproveRequest(request)}
                        className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-[#1D9E75] text-white hover:bg-[#197a61] transition"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        Approve
                      </button>
                    </div>
                    <button
                      onClick={() => setScreen(request.screen)}
                      className="mt-2 inline-flex items-center gap-1 text-[11px] text-[#1D9E75] font-semibold hover:text-[#166f59]"
                    >
                      Open module <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

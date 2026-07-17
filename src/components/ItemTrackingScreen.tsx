import React, { useState, useMemo } from 'react';
import { 
  Search, Filter, Download, RefreshCw, 
  Package, Truck, CheckCircle2, AlertCircle, XCircle, AlertTriangle, 
  ChevronRight, Box, Barcode, Hash, MapPin, Calendar, ExternalLink
} from 'lucide-react';
import { TransportRequestItem, ItemDetail, ItemTrackingStatus } from '../types';

interface ItemTrackingScreenProps {
  itemTracking: TransportRequestItem[];
  onSaveItemTracking: (updatedTracking: TransportRequestItem) => void;
  setScreen: (screen: string) => void;
}

export default function ItemTrackingScreen({ itemTracking, onSaveItemTracking, setScreen }: ItemTrackingScreenProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTrip, setSelectedTrip] = useState<TransportRequestItem | null>(null);

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

    itemTracking.forEach(trip => {
      if (['Loading', 'In Transit', 'Partial'].includes(trip.deliveryStatus)) {
        activeDeliveries++;
      }
      if (trip.reconciliationStatus === 'Open Case') {
        openRecon++;
      }
      
      trip.items.forEach(item => {
        inTransit += item.loadedQuantity - item.deliveredQuantity - item.damagedQuantity - item.missingQuantity - item.returnedQuantity;
        delivered += item.deliveredQuantity;
        returned += item.returnedQuantity;
        missingDamaged += (item.missingQuantity + item.damagedQuantity);
      });
      
      if (trip.deliveryStatus === 'Partial') partial++;
      if (trip.deliveryStatus === 'Delivered' && trip.reconciliationStatus !== 'Resolved') pendingPod++;
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

  const getItemStatusIcon = (status: ItemTrackingStatus) => {
    switch(status) {
      case 'Pending': return <Box className="w-4 h-4 text-gray-400" />;
      case 'Loaded': return <Package className="w-4 h-4 text-blue-500" />;
      case 'In Transit': return <Truck className="w-4 h-4 text-[#1D9E75]" />;
      case 'Delivered': return <CheckCircle2 className="w-4 h-4 text-green-500" />;
      case 'Partial': return <AlertCircle className="w-4 h-4 text-yellow-500" />;
      case 'Returned': return <RefreshCw className="w-4 h-4 text-orange-500" />;
      case 'Missing': return <XCircle className="w-4 h-4 text-red-500" />;
      case 'Damaged': return <AlertTriangle className="w-4 h-4 text-red-500" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#2C2C2A] tracking-tight">Item Tracking & POD</h1>
          <p className="text-sm text-gray-500 mt-1">Monitor line-item level dispatch, transit status, and delivery proof.</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-4 py-2 bg-white border border-[#E5E2D9] rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors shadow-sm">
            <Download className="w-4 h-4 text-gray-500" />
            Export Data
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-[#1D9E75] text-white rounded-lg text-sm font-medium hover:bg-[#168561] transition-colors shadow-sm">
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-[#E5E2D9] shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-500">Active Deliveries</span>
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg"><Truck className="w-5 h-5" /></div>
          </div>
          <span className="text-3xl font-bold text-[#2C2C2A]">{kpis.activeDeliveries}</span>
        </div>
        <div className="bg-white p-5 rounded-xl border border-[#E5E2D9] shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-500">Items In Transit</span>
            <div className="p-2 bg-[#1D9E75]/10 text-[#1D9E75] rounded-lg"><Package className="w-5 h-5" /></div>
          </div>
          <span className="text-3xl font-bold text-[#2C2C2A]">{kpis.inTransit}</span>
        </div>
        <div className="bg-white p-5 rounded-xl border border-[#E5E2D9] shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-500">Successfully Delivered</span>
            <div className="p-2 bg-green-50 text-green-600 rounded-lg"><CheckCircle2 className="w-5 h-5" /></div>
          </div>
          <span className="text-3xl font-bold text-[#2C2C2A]">{kpis.delivered}</span>
        </div>
        <div className="bg-white p-5 rounded-xl border border-[#E5E2D9] shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-500">Missing/Damaged Items</span>
            <div className="p-2 bg-red-50 text-red-600 rounded-lg"><AlertTriangle className="w-5 h-5" /></div>
          </div>
          <span className="text-3xl font-bold text-[#2C2C2A]">{kpis.missingDamaged}</span>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="bg-white rounded-xl border border-[#E5E2D9] shadow-sm overflow-hidden flex flex-col">
        {/* Filters */}
        <div className="p-4 border-b border-[#E5E2D9] flex flex-col sm:flex-row gap-4 items-center justify-between bg-gray-50/50">
          <div className="relative w-full sm:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input 
              type="text" 
              placeholder="Search by Trip ID, MR, or Customer..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1D9E75]/20 focus:border-[#1D9E75] bg-white"
            />
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
            <button className="flex items-center gap-2 px-3 py-2 border border-gray-200 rounded-lg text-sm font-medium bg-white text-gray-600 hover:bg-gray-50 whitespace-nowrap">
              <Filter className="w-4 h-4" /> Status
            </button>
            <button className="flex items-center gap-2 px-3 py-2 border border-gray-200 rounded-lg text-sm font-medium bg-white text-gray-600 hover:bg-gray-50 whitespace-nowrap">
              <Calendar className="w-4 h-4" /> Date Range
            </button>
          </div>
        </div>

        {/* Data Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200 text-xs uppercase tracking-wider text-gray-500">
                <th className="px-6 py-4 font-semibold">Trip ID / MR</th>
                <th className="px-6 py-4 font-semibold">Customer & Route</th>
                <th className="px-6 py-4 font-semibold text-center">Quantities (L/T/D)</th>
                <th className="px-6 py-4 font-semibold text-center">Exceptions</th>
                <th className="px-6 py-4 font-semibold text-center">Status</th>
                <th className="px-6 py-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm">
              {filteredTrips.map(trip => (
                <tr key={trip.tripId} className="hover:bg-gray-50/80 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="font-semibold text-gray-900">{trip.tripId}</span>
                      <span className="text-xs text-gray-500 mt-0.5">{trip.mrRef}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="font-medium text-gray-800">{trip.customer}</span>
                      <div className="flex items-center gap-1.5 text-xs text-gray-500 mt-1">
                        <MapPin className="w-3 h-3" />
                        <span className="truncate max-w-[200px]">{trip.originWarehouse} &rarr; {trip.destination}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex justify-center items-center gap-3 text-xs font-mono">
                      <div className="flex flex-col items-center" title="Loaded"><span className="text-gray-400">L</span><span className="font-medium">{trip.loadedQuantity}</span></div>
                      <div className="flex flex-col items-center" title="In Transit"><span className="text-gray-400">T</span><span className="font-medium text-blue-600">{trip.inTransitQuantity}</span></div>
                      <div className="flex flex-col items-center" title="Delivered"><span className="text-gray-400">D</span><span className="font-medium text-[#1D9E75]">{trip.deliveredQuantity}</span></div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex justify-center items-center gap-2">
                      {(trip.damagedQuantity > 0 || trip.missingQuantity > 0) ? (
                        <div className="flex gap-2">
                          {trip.missingQuantity > 0 && <span className="flex items-center gap-1 text-xs text-red-600 bg-red-50 px-2 py-0.5 rounded font-medium"><XCircle className="w-3 h-3"/> {trip.missingQuantity} Miss</span>}
                          {trip.damagedQuantity > 0 && <span className="flex items-center gap-1 text-xs text-orange-600 bg-orange-50 px-2 py-0.5 rounded font-medium"><AlertTriangle className="w-3 h-3"/> {trip.damagedQuantity} Dmg</span>}
                        </div>
                      ) : (
                        <span className="text-gray-400 text-xs">-</span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col items-center gap-1.5">
                      {getStatusBadge(trip.deliveryStatus)}
                      {getReconBadge(trip.reconciliationStatus)}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button 
                        onClick={() => setScreen('loading-confirmation')}
                        className="p-1.5 text-gray-400 hover:text-[#1D9E75] hover:bg-[#1D9E75]/10 rounded transition-colors"
                        title="Go to Loading Confirmation"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => setSelectedTrip(trip)}
                        className="flex items-center gap-1 px-3 py-1.5 bg-gray-100 text-gray-700 hover:bg-gray-200 rounded-md text-xs font-semibold transition-colors"
                      >
                        View <ChevronRight className="w-3 h-3" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredTrips.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                    No tracking records found matching your criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Side Panel for Item Details */}
      {selectedTrip && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black/20 z-40 backdrop-blur-sm transition-opacity"
            onClick={() => setSelectedTrip(null)}
          />
          {/* Panel */}
          <div className="fixed top-0 right-0 h-screen w-full max-w-2xl bg-white shadow-2xl z-50 flex flex-col transform transition-transform duration-300 ease-in-out border-l border-gray-200">
            {/* Header */}
            <div className="p-6 border-b border-gray-100 bg-[#F1EFE8]/30">
              <div className="flex justify-between items-start">
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <h2 className="text-xl font-bold text-gray-900">{selectedTrip.tripId}</h2>
                    {getStatusBadge(selectedTrip.deliveryStatus)}
                  </div>
                  <p className="text-sm text-gray-500 font-medium">{selectedTrip.mrRef} • {selectedTrip.customer}</p>
                </div>
                <button 
                  onClick={() => setSelectedTrip(null)}
                  className="p-2 hover:bg-gray-100 rounded-full text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <XCircle className="w-6 h-6" />
                </button>
              </div>
            </div>

            {/* Content (Scrollable) */}
            <div className="flex-1 overflow-y-auto p-6">
              {/* Meta Info Grid */}
              <div className="grid grid-cols-2 gap-y-4 gap-x-6 mb-8 text-sm">
                <div>
                  <p className="text-gray-500 text-xs uppercase tracking-wider mb-1">Origin</p>
                  <p className="font-medium text-gray-900">{selectedTrip.originWarehouse}</p>
                </div>
                <div>
                  <p className="text-gray-500 text-xs uppercase tracking-wider mb-1">Destination</p>
                  <p className="font-medium text-gray-900">{selectedTrip.destination}</p>
                </div>
                <div>
                  <p className="text-gray-500 text-xs uppercase tracking-wider mb-1">Vehicle</p>
                  <p className="font-medium text-gray-900">{selectedTrip.vehicle}</p>
                </div>
                <div>
                  <p className="text-gray-500 text-xs uppercase tracking-wider mb-1">Driver</p>
                  <p className="font-medium text-gray-900">{selectedTrip.driver}</p>
                </div>
                <div>
                  <p className="text-gray-500 text-xs uppercase tracking-wider mb-1">Dispatch Date</p>
                  <p className="font-medium text-gray-900">{selectedTrip.dispatchDate}</p>
                </div>
                <div>
                  <p className="text-gray-500 text-xs uppercase tracking-wider mb-1">Reconciliation Status</p>
                  <div className="mt-1">{getReconBadge(selectedTrip.reconciliationStatus)}</div>
                </div>
              </div>

              <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4 border-b border-gray-100 pb-2">Line Items</h3>
              
              <div className="space-y-4">
                {selectedTrip.items.map(item => (
                  <div key={item.id} className="border border-gray-200 rounded-lg p-4 bg-gray-50/50 hover:bg-white hover:shadow-sm transition-all group">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex items-start gap-3">
                        <div className="p-2 bg-white rounded-md border border-gray-100 shadow-sm mt-0.5">
                          {getItemStatusIcon(item.status)}
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-900 text-sm leading-snug">{item.itemName}</h4>
                          <p className="text-xs text-gray-500 font-mono mt-0.5">{item.itemCode} • {item.itemGroup}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {item.barcodeScanned && <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-green-600 bg-green-50 px-2 py-1 rounded border border-green-100" title="Barcode Scanned"><Barcode className="w-3 h-3"/> B/C</span>}
                        {item.serialVerified && <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-2 py-1 rounded border border-blue-100" title="Serial Verified"><Hash className="w-3 h-3"/> S/N</span>}
                      </div>
                    </div>

                    <div className="grid grid-cols-5 gap-2 mt-3 pt-3 border-t border-gray-200/60">
                      <div className="flex flex-col">
                        <span className="text-[10px] text-gray-400 uppercase tracking-wider">Expected</span>
                        <span className="font-semibold text-gray-700">{item.expectedQuantity} <span className="text-xs font-normal text-gray-400">{item.uom}</span></span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[10px] text-gray-400 uppercase tracking-wider">Loaded</span>
                        <span className="font-semibold text-gray-900">{item.loadedQuantity}</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[10px] text-gray-400 uppercase tracking-wider">Delivered</span>
                        <span className={`font-semibold ${item.deliveredQuantity > 0 ? 'text-[#1D9E75]' : 'text-gray-900'}`}>{item.deliveredQuantity}</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[10px] text-gray-400 uppercase tracking-wider">Missing</span>
                        <span className={`font-semibold ${item.missingQuantity > 0 ? 'text-red-600' : 'text-gray-400'}`}>{item.missingQuantity}</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[10px] text-gray-400 uppercase tracking-wider">Damaged</span>
                        <span className={`font-semibold ${item.damagedQuantity > 0 ? 'text-orange-600' : 'text-gray-400'}`}>{item.damagedQuantity}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-gray-200 bg-gray-50 flex justify-end">
              <button 
                onClick={() => setScreen('loading-confirmation')}
                className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-100 transition-colors mr-2"
              >
                Go to Warehouse Load
              </button>
              <button 
                onClick={() => setSelectedTrip(null)}
                className="px-4 py-2 bg-[#2C2C2A] text-white rounded-lg text-sm font-medium hover:bg-black transition-colors shadow-md"
              >
                Close Panel
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

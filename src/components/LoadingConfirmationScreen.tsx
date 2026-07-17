import React, { useState, useMemo } from 'react';
import { 
  CheckCircle2, XCircle, AlertTriangle, Save, 
  ArrowLeft, PackageCheck, User, Truck, MapPin, 
  FileText, Check, AlertCircle, Barcode, Hash
} from 'lucide-react';
import { TransportRequestItem, LoadingConfirmationData, ItemDetail } from '../types';

interface LoadingConfirmationScreenProps {
  itemTracking: TransportRequestItem[];
  loadingConfirmations: LoadingConfirmationData[];
  onSaveLoadingConfirmation: (updatedConfirmation: LoadingConfirmationData) => void;
  setScreen: (screen: string) => void;
}

export default function LoadingConfirmationScreen({ itemTracking, loadingConfirmations, onSaveLoadingConfirmation, setScreen }: LoadingConfirmationScreenProps) {
  const [selectedTripId, setSelectedTripId] = useState<string>('');
  
  const trip = useMemo(() => itemTracking.find(t => t.tripId === selectedTripId), [itemTracking, selectedTripId]);
  
  const existingConfirmation = useMemo(() => loadingConfirmations.find(c => c.tripId === selectedTripId), [loadingConfirmations, selectedTripId]);

  // Local state for the interactive checklist
  const [itemsState, setItemsState] = useState<ItemDetail[]>([]);
  const [notes, setNotes] = useState('');

  // Initialize local state when trip changes
  React.useEffect(() => {
    if (trip) {
      setItemsState(JSON.parse(JSON.stringify(trip.items)));
      setNotes(existingConfirmation?.notes || '');
    } else {
      setItemsState([]);
      setNotes('');
    }
  }, [trip, existingConfirmation]);

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
      notes
    };
    onSaveLoadingConfirmation(newConf);
    alert('Draft saved successfully.');
  };

  const handleConfirmLoading = () => {
    if (!trip) return;
    // Check if any discrepancies exist
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
      notes
    };
    onSaveLoadingConfirmation(newConf);
    alert('Loading confirmed and locked.');
  };

  // Progress calculations
  const progress = useMemo(() => {
    if (itemsState.length === 0) return 0;
    const totalExpected = itemsState.reduce((sum, item) => sum + item.expectedQuantity, 0);
    const totalLoaded = itemsState.reduce((sum, item) => sum + item.loadedQuantity, 0);
    return Math.min(100, Math.round((totalLoaded / totalExpected) * 100));
  }, [itemsState]);

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-24">
      <div className="flex items-center gap-4 mb-6">
        <button 
          onClick={() => setScreen('item-tracking')}
          className="p-2 hover:bg-gray-200 rounded-full text-gray-500 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-[#2C2C2A] tracking-tight">Warehouse Loading</h1>
          <p className="text-sm text-gray-500 mt-1">Scan, verify, and confirm outbound shipments</p>
        </div>
      </div>

      {/* Trip Selector */}
      <div className="bg-white p-6 rounded-xl border border-[#E5E2D9] shadow-sm">
        <label className="block text-sm font-semibold text-gray-700 mb-2">Select Transport Request (Trip)</label>
        <select 
          value={selectedTripId} 
          onChange={e => setSelectedTripId(e.target.value)}
          className="w-full sm:w-96 px-4 py-2.5 border border-gray-300 rounded-lg bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-[#1D9E75] focus:border-transparent font-medium"
        >
          <option value="">-- Select a Trip to Load --</option>
          {itemTracking.map(t => (
            <option key={t.tripId} value={t.tripId}>{t.tripId} ({t.mrRef}) - {t.destination}</option>
          ))}
        </select>
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
              <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${existingConfirmation?.status === 'Confirmed' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
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
                    <th className="px-5 py-3 font-semibold text-center">Verify Tools</th>
                    <th className="px-5 py-3 font-semibold text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {itemsState.map(item => {
                    const isDiscrepancy = item.loadedQuantity !== item.expectedQuantity;
                    const isPerfect = item.loadedQuantity === item.expectedQuantity && item.barcodeScanned && item.serialVerified;

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
                        <td className="px-5 py-4">
                          <div className="flex justify-center gap-3">
                            <button 
                              onClick={() => updateItem(item.id, { barcodeScanned: !item.barcodeScanned })}
                              className={`flex flex-col items-center justify-center p-2 rounded-lg border transition-colors ${item.barcodeScanned ? 'bg-green-50 border-green-200 text-green-700' : 'bg-white border-gray-200 text-gray-400 hover:bg-gray-50'}`}
                              title="Toggle Barcode Scan"
                            >
                              <Barcode className="w-5 h-5 mb-1" />
                              <span className="text-[9px] font-bold uppercase">Scan</span>
                            </button>
                            <button 
                              onClick={() => updateItem(item.id, { serialVerified: !item.serialVerified })}
                              className={`flex flex-col items-center justify-center p-2 rounded-lg border transition-colors ${item.serialVerified ? 'bg-blue-50 border-blue-200 text-blue-700' : 'bg-white border-gray-200 text-gray-400 hover:bg-gray-50'}`}
                              title="Toggle Serial Verification"
                            >
                              <Hash className="w-5 h-5 mb-1" />
                              <span className="text-[9px] font-bold uppercase">Serial</span>
                            </button>
                          </div>
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
            
            {/* Loading Notes */}
            <div className="p-5 border-t border-gray-200 bg-gray-50/50">
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
              Save Draft
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

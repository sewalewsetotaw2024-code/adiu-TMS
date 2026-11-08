import React, { useState } from 'react';
import { Vehicle, Supplier, Driver } from '../types';
import { 
  Plus, Search, ArrowLeft, Upload, Check, ShieldCheck, ShieldAlert, 
  Ban, Info, Calendar, User, Clock, FileText, CheckCircle2, 
  XCircle, AlertTriangle, AlertCircle, X, Phone, Truck, Lock, Unlock, FolderKanban, Trash2
} from 'lucide-react';

interface VehicleScreenProps {
  vehicles: Vehicle[];
  suppliers: Supplier[];
  drivers: Driver[];
  onSaveVehicle: (vehicle: Vehicle) => void;
  onRemoveVehicle?: (plateNumber: string) => void;
  onNavigateToCompliance?: () => void;
}

export default function VehicleScreen({ 
  vehicles, 
  suppliers, 
  drivers, 
  onSaveVehicle,
  onRemoveVehicle,
  onNavigateToCompliance 
}: VehicleScreenProps) {
  const [viewMode, setViewMode] = useState<'list' | 'form'>('list');
  const [activeVehicle, setActiveVehicle] = useState<Vehicle | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'available' | 'assigned'>('all');

  // Counts
  const assignedCount = vehicles.filter(v => v.isAssigned).length;
  const availableCount = vehicles.filter(v => !v.isAssigned).length;

  // Filtering vehicles
  const filteredVehicles = vehicles.filter(v => {
    const matchesSearch = 
      v.plateNumber.toLowerCase().includes(searchQuery.toLowerCase()) || 
      v.driverName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.model.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (v.assignedProjectName && v.assignedProjectName.toLowerCase().includes(searchQuery.toLowerCase()));
    
    let matchesStatus = true;
    if (statusFilter === 'available') matchesStatus = !v.isAssigned;
    else if (statusFilter === 'assigned') matchesStatus = !!v.isAssigned;

    return matchesSearch && matchesStatus;
  });

  const handleInitNewVehicle = () => {
    const newVehicle: Vehicle = {
      plateNumber: '',
      supplierId: suppliers[0]?.id || 'sup-01',
      tonCapacity: 10,
      ageCategory: '0-5 yrs',
      model: '',
      lastQehsCheck: '',
      status: 'Draft',
      isAssigned: false,
      assignedProjectId: '',
      assignedProjectName: '',
      driverName: '',
      driverId: '',
      driverPhone: '',
      assignedRoute: '',
      carType: 'Owned',
      lastServiceDate: '',
      nextServiceDate: '',
      lastServiceKm: 0,
      nextServiceKm: 0,
      additionalPhotos: [],
      qehsInsurance: false,
      qehsRoadWorthy: false,
      qehsDriverLicence: false,
      qehsLoadSecurity: false,
      qehsFireExtinguisher: false,
      qehsFirstAid: false,
      qehsGpsTracker: false,
      qehsVehiclePhotoUrl: '',
      qehsDriverIdPhotoUrl: '',
      rejectionReason: ''
    };
    setActiveVehicle(newVehicle);
    setViewMode('form');
  };

  const handleViewVehicle = (v: Vehicle) => {
    setActiveVehicle({ ...v });
    setViewMode('form');
  };

  const handleFieldChange = (field: keyof Vehicle, value: any) => {
    if (!activeVehicle) return;
    setActiveVehicle({ ...activeVehicle, [field]: value });
  };

  const handleSave = () => {
    if (!activeVehicle) return;
    if (!activeVehicle.plateNumber.trim()) {
      alert('Plate number is required.');
      return;
    }
    if (!activeVehicle.model.trim()) {
      alert('Vehicle model and build are required.');
      return;
    }

    onSaveVehicle(activeVehicle);
    setViewMode('list');
    setActiveVehicle(null);
    alert(`Vehicle ${activeVehicle.plateNumber} saved successfully to master fleet registry.`);
  };

  // Photo upload simulation
  const handleSimulatePhotoUpload = (field: 'qehsVehiclePhotoUrl' | 'qehsDriverIdPhotoUrl' | 'qehsInsuranceDocUrl' | 'qehsRoadWorthyDocUrl') => {
    const urls = {
      qehsVehiclePhotoUrl: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&q=80&w=400',
      qehsDriverIdPhotoUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=400',
      qehsInsuranceDocUrl: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&q=80&w=400',
      qehsRoadWorthyDocUrl: 'https://images.unsplash.com/photo-1450133064473-71024230f91b?auto=format&fit=crop&q=80&w=400'
    };
    handleFieldChange(field as keyof Vehicle, urls[field]);
  };

  return (
    <div className="space-y-6 select-none" id="vehicle-screen-container">
      {viewMode === 'list' ? (
        <div className="bg-white p-6 rounded-xl border border-[#D3D1C7] shadow-sm space-y-4">
          
          {/* Top Info Banner */}
          <div className="p-3.5 bg-[#F1EFE8]/50 border border-[#D3D1C7]/70 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-[#1D9E75]/15 text-[#1D9E75] flex items-center justify-center shrink-0">
                <Truck className="w-4 h-4" />
              </div>
              <div>
                <h4 className="font-bold text-[#2C2C2A] uppercase tracking-wide">Fleet Asset Management Pool</h4>
                <p className="text-[11px] text-[#5F5E5A]">
                  Manage vehicle technical specifications, capacity, and maintenance. When onboarding a new project, pair an available vehicle and driver in <strong>Vehicle & Compliance</strong> to initiate QEHS clearance.
                </p>
              </div>
            </div>
            {onNavigateToCompliance && (
              <button
                onClick={onNavigateToCompliance}
                className="flex items-center gap-1 px-3 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 rounded-lg text-xs font-bold shrink-0 transition-colors cursor-pointer"
              >
                <FolderKanban className="w-3.5 h-3.5" /> Allocate to Projects
              </button>
            )}
          </div>

          {/* Controls: Search, Tabs & Action */}
          <div className="flex flex-wrap items-center justify-between gap-4 pt-1">
            <div className="flex flex-wrap items-center gap-3">
              {/* Search */}
              <div className="relative w-64">
                <Search className="w-3.5 h-3.5 text-[#5F5E5A] absolute left-3 top-1/2 -translate-y-1/2" />
                <input 
                  type="text" 
                  placeholder="Search plate, model, driver, project..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full h-9 pl-9 pr-3 rounded-lg border border-[#D3D1C7] bg-[#F1EFE8]/30 font-sans text-xs text-[#2C2C2A] focus:outline-none focus:border-[#1D9E75]"
                />
              </div>

              {/* Status Tabs */}
              <div className="flex items-center bg-[#F1EFE8]/60 p-1 rounded-lg border border-[#D3D1C7]/70 gap-1 text-xs font-sans">
                <button
                  onClick={() => setStatusFilter('all')}
                  className={`px-3 py-1 rounded-md text-xs font-medium transition-all cursor-pointer ${
                    statusFilter === 'all' ? 'bg-white shadow-xs text-[#2C2C2A] font-bold' : 'text-[#5F5E5A] hover:text-[#2C2C2A]'
                  }`}
                >
                  All Vehicles ({vehicles.length})
                </button>
                <button
                  onClick={() => setStatusFilter('available')}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium transition-all cursor-pointer ${
                    statusFilter === 'available' ? 'bg-white shadow-xs text-emerald-700 font-bold' : 'text-[#5F5E5A] hover:text-[#2C2C2A]'
                  }`}
                >
                  <Unlock className="w-3 h-3 text-emerald-600" />
                  <span>Available Pool ({availableCount})</span>
                </button>
                <button
                  onClick={() => setStatusFilter('assigned')}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium transition-all cursor-pointer ${
                    statusFilter === 'assigned' ? 'bg-white shadow-xs text-blue-700 font-bold' : 'text-[#5F5E5A] hover:text-[#2C2C2A]'
                  }`}
                >
                  <Lock className="w-3 h-3 text-blue-600" />
                  <span>Assigned to Projects ({assignedCount})</span>
                </button>
              </div>
            </div>

            <button 
              id="add-vehicle-btn"
              onClick={handleInitNewVehicle}
              className="flex items-center gap-1.5 px-4 py-2 bg-[#1D9E75] hover:bg-[#1D9E75]/90 text-white rounded-lg text-xs font-sans font-semibold cursor-pointer transition-colors shadow-xs"
            >
              <Plus className="w-4 h-4" /> Add Vehicle
            </button>
          </div>

          {/* Table */}
          <div className="overflow-x-auto border border-[#D3D1C7]/60 rounded-lg">
            <table className="w-full text-left border-collapse" id="vehicles-table">
              <thead>
                <tr className="bg-[#F1EFE8]/45 border-b border-[#D3D1C7]/80 text-[10px] font-sans font-semibold text-[#5F5E5A] uppercase tracking-wider">
                  <th className="p-3">Plate & Type</th>
                  <th className="p-3">Model & Partner</th>
                  <th className="p-3 text-center">Payload</th>
                  <th className="p-3">Linked Driver</th>
                  <th className="p-3">Project Assignment Availability</th>
                  <th className="p-3">Service Interval</th>
                  <th className="p-3 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#D3D1C7]/40 text-xs font-sans text-[#2C2C2A]">
                {filteredVehicles.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-[#5F5E5A] italic">
                      No vehicles found matching current filter.
                    </td>
                  </tr>
                ) : (
                  filteredVehicles.map((v) => {
                    const linkedSup = suppliers.find(s => s.id === v.supplierId);
                    return (
                      <tr key={v.plateNumber} className="hover:bg-[#F1EFE8]/25 transition-colors">
                        <td className="p-3">
                          <div className="flex flex-col">
                            <span className="font-mono font-bold text-[#1D9E75]">{v.plateNumber}</span>
                            <span className="text-[10px] text-slate-500 font-bold uppercase">{v.carType || 'Owned'}</span>
                          </div>
                        </td>
                        <td className="p-3">
                          <div className="flex flex-col">
                            <span className="font-medium text-[#2C2C2A]">{v.model || 'Model unspecified'}</span>
                            <span className="text-[10px] text-slate-500 truncate max-w-[140px]">{linkedSup?.name || '---'}</span>
                          </div>
                        </td>
                        <td className="p-3 text-center font-semibold font-mono">{v.tonCapacity}T</td>
                        <td className="p-3">
                          <div className="flex flex-col">
                            <span className="font-medium text-[#2C2C2A]">{v.driverName || 'No Driver Linked'}</span>
                            <span className="text-[10px] text-slate-500 font-mono">{v.driverPhone || '---'}</span>
                          </div>
                        </td>
                        <td className="p-3">
                          {v.isAssigned ? (
                            <div className="flex flex-col gap-0.5 items-start">
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                                <Lock className="w-3 h-3" /> Assigned
                              </span>
                              <span className="text-[10px] text-slate-700 font-semibold max-w-[190px] truncate" title={v.assignedProjectName}>
                                {v.assignedProjectName}
                              </span>
                            </div>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <Unlock className="w-3 h-3 text-emerald-600" /> Available for Project
                            </span>
                          )}
                        </td>
                        <td className="p-3 text-[11px] text-slate-500">
                          {v.nextServiceDate ? (
                            <div className="flex flex-col">
                              <span>Due: {v.nextServiceDate}</span>
                              <span className="text-[10px] font-mono text-slate-400">At: {v.nextServiceKm} KM</span>
                            </div>
                          ) : (
                            <span className="text-slate-400 italic">No scheduled maintenance</span>
                          )}
                        </td>
                        <td className="p-3 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              onClick={() => handleViewVehicle(v)}
                              className="px-2.5 py-1 text-[11px] border border-[#D3D1C7] text-slate-700 rounded hover:bg-[#F1EFE8] transition-colors cursor-pointer"
                            >
                              Edit Specs
                            </button>
                            {onRemoveVehicle && (
                              <button
                                onClick={() => onRemoveVehicle(v.plateNumber)}
                                className="p-1 text-slate-400 hover:text-red-600 transition-colors"
                                title="Delete Vehicle"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Form mode */
        <div className="space-y-6 pb-20" id="vehicle-form-container">
          
          {/* Header Bar */}
          <div className="flex flex-wrap items-center justify-between bg-white p-4 rounded-xl border border-[#D3D1C7] shadow-sm gap-3">
            <button 
              onClick={() => {
                setViewMode('list');
                setActiveVehicle(null);
              }}
              className="flex items-center gap-1.5 text-xs text-[#5F5E5A] hover:text-[#2C2C2A] font-sans font-medium transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" /> Back to fleet list
            </button>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-600">Project Status:</span>
              {activeVehicle?.isAssigned ? (
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-800 border border-blue-200">
                  <Lock className="w-3.5 h-3.5" /> Assigned: {activeVehicle.assignedProjectName}
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                  <Unlock className="w-3.5 h-3.5 text-emerald-600" /> Available in Fleet Pool
                </span>
              )}
            </div>
          </div>

          {/* Project Lock Banner */}
          {activeVehicle?.isAssigned && (
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl flex items-start gap-3 text-blue-900 text-xs">
              <Lock className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
              <div>
                <h4 className="font-bold uppercase tracking-tight">Active Project Assignment</h4>
                <p className="text-blue-700 mt-0.5">
                  This vehicle is currently allocated and certified for project <strong>"{activeVehicle.assignedProjectName}"</strong>. It is locked from allocation to any other project until released in the <strong>Vehicle & Compliance</strong> module.
                </p>
              </div>
            </div>
          )}

          <div className="bg-white p-6 rounded-xl border border-[#D3D1C7] shadow-sm space-y-6">
            
            {/* Fleet Section */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 border-b border-[#D3D1C7] pb-2">
                <Truck className="w-4 h-4 text-[#1D9E75]" />
                <h3 className="text-xs font-bold text-[#2C2C2A] uppercase tracking-wider">
                  Vehicle Master Specifications
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-xs font-sans">
                <div className="flex flex-col gap-1">
                  <label className="text-[11px] text-[#5F5E5A] font-medium uppercase tracking-tight">Plate number *</label>
                  <input 
                    type="text" 
                    value={activeVehicle?.plateNumber || ''} 
                    onChange={(e) => handleFieldChange('plateNumber', e.target.value)}
                    className="h-9 px-3 border border-[#D3D1C7] rounded-lg focus:outline-none focus:border-[#1D9E75] font-mono font-bold"
                    placeholder="e.g. ET-3-A98412"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[11px] text-[#5F5E5A] font-medium uppercase tracking-tight">Ownership Type</label>
                  <select 
                    value={activeVehicle?.carType || 'Owned'} 
                    onChange={(e) => handleFieldChange('carType', e.target.value)}
                    className="h-9 px-2 border border-[#D3D1C7] rounded-lg focus:outline-none bg-white font-semibold"
                  >
                    <option value="Owned">Owned</option>
                    <option value="Rented">Rented</option>
                  </select>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[11px] text-[#5F5E5A] font-medium uppercase tracking-tight">Logistics Partner (Supplier) *</label>
                  <select 
                    value={activeVehicle?.supplierId || ''} 
                    onChange={(e) => handleFieldChange('supplierId', e.target.value)}
                    className="h-9 px-2 border border-[#D3D1C7] rounded-lg focus:outline-none bg-white font-semibold"
                  >
                    {suppliers.map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[11px] text-[#5F5E5A] font-medium uppercase tracking-tight">Vehicle model & build *</label>
                  <input 
                    type="text" 
                    value={activeVehicle?.model || ''} 
                    onChange={(e) => handleFieldChange('model', e.target.value)}
                    className="h-9 px-3 border border-[#D3D1C7] rounded-lg focus:outline-none"
                    placeholder="e.g. Sino Truck Hohan 2022"
                  />
                </div>

                <div className="flex grid grid-cols-2 gap-2">
                  <div className="flex flex-col gap-1">
                    <label className="text-[11px] text-[#5F5E5A] font-medium uppercase tracking-tight">Payload (Tons)</label>
                    <input 
                      type="number" 
                      value={activeVehicle?.tonCapacity || 0} 
                      onChange={(e) => handleFieldChange('tonCapacity', Number(e.target.value))}
                      className="h-9 px-2 border border-[#D3D1C7] rounded-lg focus:outline-none text-center font-bold"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[11px] text-[#5F5E5A] font-medium uppercase tracking-tight">Age category</label>
                    <select 
                      value={activeVehicle?.ageCategory || '0-5 yrs'} 
                      onChange={(e) => handleFieldChange('ageCategory', e.target.value)}
                      className="h-9 px-1 border border-[#D3D1C7] rounded-lg focus:outline-none bg-white"
                    >
                      <option value="0-5 yrs">0–5 yrs</option>
                      <option value="6-10 yrs">6–10 yrs</option>
                      <option value="10+ yrs">10+ yrs</option>
                    </select>
                  </div>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[11px] text-[#5F5E5A] font-medium uppercase tracking-tight">Assigned Route / Operating Zone</label>
                  <input 
                    type="text" 
                    value={activeVehicle?.assignedRoute || ''} 
                    onChange={(e) => handleFieldChange('assignedRoute', e.target.value)}
                    className="h-9 px-3 border border-[#D3D1C7] rounded-lg focus:outline-none"
                    placeholder="e.g. Addis to Bahir Dar"
                  />
                </div>
              </div>
            </div>

            {/* Driver Association (Optional base driver link) */}
            <div className="space-y-4 pt-2 border-t border-[#D3D1C7]/60">
              <div className="flex items-center gap-2 border-b border-[#D3D1C7] pb-2">
                <User className="w-4 h-4 text-[#1D9E75]" />
                <h3 className="text-xs font-bold text-[#2C2C2A] uppercase tracking-wider">
                  Associated Primary Driver (Fleet Record)
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-xs font-sans">
                <div className="flex flex-col gap-1 sm:col-span-3 bg-[#F1EFE8]/25 p-3 rounded-lg border border-[#D3D1C7]/60">
                  <label className="text-[11px] text-[#2C2C2A] font-bold uppercase tracking-tight flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-[#1D9E75]" /> Link Primary Driver from Registered Personnel
                  </label>
                  <select 
                    value={activeVehicle?.driverId || ''} 
                    onChange={(e) => {
                      const dId = e.target.value;
                      const selectedDriver = drivers.find(d => d.id === dId);
                      if (selectedDriver && activeVehicle) {
                        setActiveVehicle({
                          ...activeVehicle,
                          driverId: selectedDriver.id,
                          driverName: selectedDriver.name,
                          driverPhone: selectedDriver.phone
                        });
                      } else if (activeVehicle) {
                        setActiveVehicle({
                          ...activeVehicle,
                          driverId: '',
                          driverName: '',
                          driverPhone: ''
                        });
                      }
                    }}
                    className="h-9 px-2 border border-[#D3D1C7] rounded bg-white text-xs font-sans mt-1 cursor-pointer focus:outline-none focus:border-[#1D9E75]"
                  >
                    <option value="">-- No Primary Driver Linked --</option>
                    {drivers.map(d => (
                      <option key={d.id} value={d.id}>
                        {d.name} ({d.id}) - {d.phone} {d.isAssigned ? `[Assigned: ${d.assignedProjectName}]` : '[Available]'}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[11px] text-[#5F5E5A] font-medium uppercase tracking-tight">Driver full name</label>
                  <input 
                    type="text" 
                    value={activeVehicle?.driverName || ''} 
                    onChange={(e) => handleFieldChange('driverName', e.target.value)}
                    className="h-9 px-3 border border-[#D3D1C7] rounded-lg focus:outline-none font-semibold"
                    placeholder="Driver full name"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[11px] text-[#5F5E5A] font-medium uppercase tracking-tight">Driver ID / License</label>
                  <input 
                    type="text" 
                    value={activeVehicle?.driverId || ''} 
                    onChange={(e) => handleFieldChange('driverId', e.target.value)}
                    className="h-9 px-3 border border-[#D3D1C7] rounded-lg focus:outline-none font-mono"
                    placeholder="e.g. DL-8914562"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[11px] text-[#5F5E5A] font-medium uppercase tracking-tight">Driver phone number</label>
                  <input 
                    type="text" 
                    value={activeVehicle?.driverPhone || ''} 
                    onChange={(e) => handleFieldChange('driverPhone', e.target.value)}
                    className="h-9 px-3 border border-[#D3D1C7] rounded-lg focus:outline-none"
                    placeholder="e.g. +251911998877"
                  />
                </div>
              </div>
            </div>

            {/* Maintenance */}
            <div className="space-y-3 pt-2 border-t border-[#D3D1C7]/60">
              <div className="flex items-center gap-2 border-b border-[#D3D1C7] pb-2">
                <Calendar className="w-4 h-4 text-[#1D9E75]" />
                <h3 className="text-xs font-bold text-[#2C2C2A] uppercase tracking-wider">
                  Service & Maintenance Log
                </h3>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] text-[#5F5E5A] font-medium uppercase tracking-tight">Last Service Date</label>
                  <input 
                    type="date" 
                    value={activeVehicle?.lastServiceDate || ''} 
                    onChange={(e) => handleFieldChange('lastServiceDate', e.target.value)}
                    className="h-9 px-3 border border-[#D3D1C7] rounded-lg focus:outline-none"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] text-[#5F5E5A] font-medium uppercase tracking-tight">Next Service Date</label>
                  <input 
                    type="date" 
                    value={activeVehicle?.nextServiceDate || ''} 
                    onChange={(e) => handleFieldChange('nextServiceDate', e.target.value)}
                    className="h-9 px-3 border border-[#D3D1C7] rounded-lg focus:outline-none"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] text-[#5F5E5A] font-medium uppercase tracking-tight">Last Service KM</label>
                  <input 
                    type="number" 
                    value={activeVehicle?.lastServiceKm || 0} 
                    onChange={(e) => handleFieldChange('lastServiceKm', Number(e.target.value))}
                    className="h-9 px-3 border border-[#D3D1C7] rounded-lg focus:outline-none font-mono"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] text-[#5F5E5A] font-medium uppercase tracking-tight">Next Service KM</label>
                  <input 
                    type="number" 
                    value={activeVehicle?.nextServiceKm || 0} 
                    onChange={(e) => handleFieldChange('nextServiceKm', Number(e.target.value))}
                    className="h-9 px-3 border border-[#D3D1C7] rounded-lg focus:outline-none font-mono"
                  />
                </div>
              </div>
            </div>

            {/* Document Evidence */}
            <div className="space-y-3 pt-2 border-t border-[#D3D1C7]/60">
              <h4 className="text-xs font-bold text-[#2C2C2A] uppercase tracking-wider flex items-center gap-1.5">
                <Upload className="w-3.5 h-3.5 text-[#1D9E75]" /> Supporting Fleet Photos & Documents
              </h4>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-2.5 border border-dashed border-[#D3D1C7] rounded-lg bg-[#F1EFE8]/15 text-center flex flex-col items-center justify-center min-h-[90px]">
                  <span className="text-[10px] font-semibold text-slate-700 block mb-1">Vehicle Exterior Photo</span>
                  {activeVehicle?.qehsVehiclePhotoUrl ? (
                    <div className="relative group w-full h-16">
                      <img src={activeVehicle.qehsVehiclePhotoUrl} referrerPolicy="no-referrer" className="w-full h-full object-cover rounded" />
                      <button onClick={() => handleFieldChange('qehsVehiclePhotoUrl', '')} className="absolute inset-0 bg-red-600/70 text-white text-[10px] font-bold rounded flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        Remove
                      </button>
                    </div>
                  ) : (
                    <button onClick={() => handleSimulatePhotoUpload('qehsVehiclePhotoUrl')} className="text-[10px] text-[#1D9E75] hover:underline flex flex-col items-center gap-1">
                      <Upload className="w-4 h-4 text-[#1D9E75]" />
                      <span>Upload Photo</span>
                    </button>
                  )}
                </div>

                <div className="p-2.5 border border-dashed border-[#D3D1C7] rounded-lg bg-[#F1EFE8]/15 text-center flex flex-col items-center justify-center min-h-[90px]">
                  <span className="text-[10px] font-semibold text-slate-700 block mb-1">Insurance Document</span>
                  {activeVehicle?.qehsInsuranceDocUrl ? (
                    <div className="relative group w-full h-16">
                      <img src={activeVehicle.qehsInsuranceDocUrl} referrerPolicy="no-referrer" className="w-full h-full object-cover rounded" />
                      <button onClick={() => handleFieldChange('qehsInsuranceDocUrl', '')} className="absolute inset-0 bg-red-600/70 text-white text-[10px] font-bold rounded flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        Remove
                      </button>
                    </div>
                  ) : (
                    <button onClick={() => handleSimulatePhotoUpload('qehsInsuranceDocUrl')} className="text-[10px] text-[#1D9E75] hover:underline flex flex-col items-center gap-1">
                      <Upload className="w-4 h-4 text-[#1D9E75]" />
                      <span>Upload Policy</span>
                    </button>
                  )}
                </div>

                <div className="p-2.5 border border-dashed border-[#D3D1C7] rounded-lg bg-[#F1EFE8]/15 text-center flex flex-col items-center justify-center min-h-[90px]">
                  <span className="text-[10px] font-semibold text-slate-700 block mb-1">Road-Worthy Cert</span>
                  {activeVehicle?.qehsRoadWorthyDocUrl ? (
                    <div className="relative group w-full h-16">
                      <img src={activeVehicle.qehsRoadWorthyDocUrl} referrerPolicy="no-referrer" className="w-full h-full object-cover rounded" />
                      <button onClick={() => handleFieldChange('qehsRoadWorthyDocUrl', '')} className="absolute inset-0 bg-red-600/70 text-white text-[10px] font-bold rounded flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        Remove
                      </button>
                    </div>
                  ) : (
                    <button onClick={() => handleSimulatePhotoUpload('qehsRoadWorthyDocUrl')} className="text-[10px] text-[#1D9E75] hover:underline flex flex-col items-center gap-1">
                      <Upload className="w-4 h-4 text-[#1D9E75]" />
                      <span>Upload Cert</span>
                    </button>
                  )}
                </div>
              </div>
            </div>

          </div>

          {/* Sticky Actions Bar */}
          <div className="fixed bottom-0 left-[240px] right-0 h-16 bg-white border-t border-[#D3D1C7] px-8 flex items-center justify-between shadow-lg z-40">
            <div className="flex items-center gap-2 text-xs text-[#5F5E5A]">
              <Info className="w-4 h-4 text-[#1D9E75]" />
              <span>
                {activeVehicle?.isAssigned 
                  ? `Locked to project "${activeVehicle.assignedProjectName}".` 
                  : 'Vehicle is currently available in the fleet pool.'}
              </span>
            </div>
            
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => {
                  setViewMode('list');
                  setActiveVehicle(null);
                }}
                className="px-4 py-2 border border-[#D3D1C7] bg-white text-[#2C2C2A] hover:bg-[#F1EFE8] rounded-lg text-xs font-sans font-semibold cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleSave}
                className="flex items-center gap-1 px-5 py-2 bg-[#1D9E75] hover:bg-[#1D9E75]/95 text-white rounded-lg text-xs font-sans font-semibold cursor-pointer transition-all shadow-sm"
              >
                <Check className="w-4 h-4" /> Save Vehicle Record
              </button>
            </div>
          </div>

        </div>
      )}
    </div>
  );
}

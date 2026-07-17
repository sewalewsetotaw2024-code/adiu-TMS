import React, { useState } from 'react';
import { Vehicle, Supplier, Driver } from '../types';
import { Plus, Search, ArrowLeft, Upload, Check, ShieldCheck, ShieldAlert, Ban, Info, Image, Calendar, Trash2, User } from 'lucide-react';

interface VehicleScreenProps {
  vehicles: Vehicle[];
  suppliers: Supplier[];
  drivers: Driver[];
  onSaveVehicle: (vehicle: Vehicle) => void;
}

export default function VehicleScreen({ vehicles, suppliers, drivers, onSaveVehicle }: VehicleScreenProps) {
  const [viewMode, setViewMode] = useState<'list' | 'form'>('list');
  const [activeVehicle, setActiveVehicle] = useState<Vehicle | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Filtering vehicles
  const filteredVehicles = vehicles.filter(v => {
    const matchesSearch = v.plateNumber.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          v.driverName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          v.model.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter ? v.status === statusFilter : true;
    return matchesSearch && matchesStatus;
  });

  const handleInitNewVehicle = () => {
    const newVehicle: Vehicle = {
      plateNumber: '',
      supplierId: suppliers[0]?.id || 'sup-01',
      tonCapacity: 10,
      ageCategory: '0-5 yrs',
      model: '',
      lastQehsCheck: new Date().toISOString().split('T')[0],
      status: 'Non-compliant',
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
      rejectionReason: 'Complete full QEHS checklist validation prior to deployment.'
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
    const updated = { ...activeVehicle, [field]: value };
    
    // Auto calculate compliance status
    // Approved if first 4-5 safety items are positive, and GPS is fitted
    const criticalChecks = [
      updated.qehsInsurance, 
      updated.qehsRoadWorthy, 
      updated.qehsDriverLicence, 
      updated.qehsLoadSecurity, 
      updated.qehsFireExtinguisher
    ];
    const isCompliant = criticalChecks.every(check => check === true);
    
    if (isCompliant) {
      updated.status = 'Compliant';
      updated.rejectionReason = '';
    } else {
      updated.status = 'Non-compliant';
      const missing = [];
      if (!updated.qehsInsurance) missing.push('valid insurance');
      if (!updated.qehsRoadWorthy) missing.push('road-worthy certificate');
      if (!updated.qehsDriverLicence) missing.push('driver licence validation');
      if (!updated.qehsLoadSecurity) missing.push('load security equipment');
      if (!updated.qehsFireExtinguisher) missing.push('fire extinguisher');
      updated.rejectionReason = `Pending safety gear: ${missing.join(', ')}.`;
    }

    setActiveVehicle(updated);
  };

  const handleSave = () => {
    if (!activeVehicle) return;
    if (!activeVehicle.plateNumber) {
      alert('Plate number is required.');
      return;
    }
    onSaveVehicle(activeVehicle);
    setViewMode('list');
    setActiveVehicle(null);
    alert(`Vehicle ${activeVehicle.plateNumber} compliance log registered successfully.`);
  };

  // Upload simulation
  const handleSimulatePhotoUpload = (field: 'qehsVehiclePhotoUrl' | 'qehsDriverIdPhotoUrl') => {
    const urls = {
      qehsVehiclePhotoUrl: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&q=80&w=400',
      qehsDriverIdPhotoUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=400'
    };
    handleFieldChange(field, urls[field]);
  };

  const getStatusStyle = (status: string) => {
    if (status === 'Compliant') return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    if (status === 'Non-compliant') return 'bg-red-50 text-red-700 border-red-200';
    return 'bg-slate-900 text-white border-slate-900'; // Blacklisted
  };

  return (
    <div className="space-y-6 select-none" id="vehicle-screen-container">
      {viewMode === 'list' ? (
        <div className="bg-white p-6 rounded-xl border border-[#D3D1C7] shadow-sm space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              {/* Search */}
              <div className="relative w-64">
                <Search className="w-3.5 h-3.5 text-[#5F5E5A] absolute left-3 top-1/2 -translate-y-1/2" />
                <input 
                  type="text" 
                  placeholder="Search plate, driver, or truck model..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full h-9 pl-9 pr-3 rounded-lg border border-[#D3D1C7] bg-[#F1EFE8]/30 font-sans text-xs text-[#2C2C2A] focus:outline-none focus:border-[#1D9E75]"
                />
              </div>

              {/* Status Filter */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="h-9 px-2 rounded-lg border border-[#D3D1C7] text-xs font-sans text-[#2C2C2A] bg-white focus:outline-none"
              >
                <option value="">All Compliance Statuses</option>
                <option value="Compliant">Compliant</option>
                <option value="Non-compliant">Non-compliant</option>
                <option value="Blacklisted">Blacklisted</option>
              </select>
            </div>

            <button 
              id="add-vehicle-btn"
              onClick={handleInitNewVehicle}
              className="flex items-center gap-1.5 px-4 py-2 bg-[#1D9E75] hover:bg-[#1D9E75]/90 text-white rounded-lg text-xs font-sans font-semibold cursor-pointer transition-colors"
            >
              <Plus className="w-4 h-4" /> Add Vehicle & Audit
            </button>
          </div>

          <div className="overflow-x-auto border border-[#D3D1C7]/60 rounded-lg">
            <table className="w-full text-left border-collapse" id="vehicles-table">
              <thead>
                <tr className="bg-[#F1EFE8]/45 border-b border-[#D3D1C7]/80 text-[10px] font-sans font-semibold text-[#5F5E5A] uppercase tracking-wider">
                  <th className="p-3">Plate Number</th>
                  <th className="p-3">Logistics Partner</th>
                  <th className="p-3 text-center">Capacity (Tons)</th>
                  <th className="p-3 text-center">Age Category</th>
                  <th className="p-3">Driver Name</th>
                  <th className="p-3">Last QEHS Check</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#D3D1C7]/40 text-xs font-sans text-[#2C2C2A]">
                {filteredVehicles.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-[#5F5E5A] italic">
                      No records yet — add the first one
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
                            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">{v.carType || 'Owned'}</span>
                          </div>
                        </td>
                        <td className="p-3 truncate max-w-[140px]">{linkedSup?.name || '---'}</td>
                        <td className="p-3 text-center font-semibold font-mono">{v.tonCapacity}T</td>
                        <td className="p-3 text-center">{v.ageCategory}</td>
                        <td className="p-3 font-medium">{v.driverName || '---'}</td>
                        <td className="p-3 text-slate-500 font-mono text-[11px]">{v.lastQehsCheck}</td>
                        <td className="p-3">
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold border ${getStatusStyle(v.status)}`}>
                            {v.status}
                          </span>
                        </td>
                        <td className="p-3 text-center">
                          <button
                            onClick={() => handleViewVehicle(v)}
                            className="px-2.5 py-1 text-[10px] border border-[#D3D1C7] rounded hover:bg-[#F1EFE8] transition-colors"
                          >
                            Audit / Details
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
      ) : (
        /* Form mode */
        <div className="space-y-6" id="vehicle-audit-container">
          {/* Form Header */}
          <div className="flex items-center justify-between bg-white p-4 rounded-xl border border-[#D3D1C7] shadow-sm">
            <button 
              onClick={() => {
                setViewMode('list');
                setActiveVehicle(null);
              }}
              className="flex items-center gap-1.5 text-xs text-[#5F5E5A] hover:text-[#2C2C2A] font-sans font-medium transition-colors"
            >
              <ArrowLeft className="w-4 h-4" /> Back to fleet list
            </button>
            <span className="text-xs font-bold text-[#1D9E75] font-sans">
              {activeVehicle?.plateNumber ? `Auditing Fleet: ${activeVehicle.plateNumber}` : 'Deploying New Fleet Vehicle'}
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
            
            {/* Form Fields (2/3 width) */}
            <div className="bg-white p-6 rounded-xl border border-[#D3D1C7] shadow-sm lg:col-span-2 space-y-4">
              <h3 className="text-xs font-bold text-[#2C2C2A] border-b border-[#D3D1C7] pb-2 uppercase tracking-wider">
                Fleet & Driver Registration
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-sans">
                <div className="flex flex-col gap-1">
                  <label className="text-[11px] text-[#5F5E5A] font-medium uppercase tracking-tight">Plate number</label>
                  <input 
                    type="text" 
                    value={activeVehicle?.plateNumber || ''} 
                    onChange={(e) => handleFieldChange('plateNumber', e.target.value)}
                    className="h-9 px-3 border border-[#D3D1C7] rounded-lg focus:outline-none focus:border-[#1D9E75] font-mono font-bold"
                    placeholder="e.g. ET-3-A98412"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[11px] text-[#5F5E5A] font-medium uppercase tracking-tight">Car Type</label>
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
                  <label className="text-[11px] text-[#5F5E5A] font-medium uppercase tracking-tight">Supplier (logistics partner)</label>
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
                  <label className="text-[11px] text-[#5F5E5A] font-medium uppercase tracking-tight">Vehicle model & build</label>
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
                    <label className="text-[11px] text-[#5F5E5A] font-medium uppercase tracking-tight">Ton capacity</label>
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
                      <option value="0–5 yrs">0–5 yrs</option>
                      <option value="6–10 yrs">6–10 yrs</option>
                      <option value="10+ yrs">10+ yrs</option>
                    </select>
                  </div>
                </div>

                {/* Driver select from list of drivers */}
                <div className="flex flex-col gap-1 sm:col-span-2 bg-[#F1EFE8]/20 p-3 rounded-lg border border-[#D3D1C7]/60">
                  <label className="text-[11px] text-[#2C2C2A] font-bold uppercase tracking-tight flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-[#1D9E75]" /> Select Registered Driver
                  </label>
                  <select 
                    value={activeVehicle?.driverId || ''} 
                    onChange={(e) => {
                      const dId = e.target.value;
                      if (dId === 'custom') {
                        // Let user type custom
                      } else {
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
                      }
                    }}
                    className="h-9 px-2 border border-[#D3D1C7] rounded bg-white text-xs font-sans mt-1 cursor-pointer focus:outline-none focus:border-[#1D9E75]"
                  >
                    <option value="">-- No Driver Associated --</option>
                    {drivers.map(d => (
                      <option key={d.id} value={d.id}>
                        {d.name} ({d.id} - Exp: {d.experienceYears} yrs)
                      </option>
                    ))}
                    <option value="custom">-- Type Custom Driver Details Below --</option>
                  </select>
                </div>

                {/* Driver details (Read-only or fillable depending on select state) */}
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
                  <label className="text-[11px] text-[#5F5E5A] font-medium uppercase tracking-tight">Driver license / ID number</label>
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

                <div className="flex flex-col gap-1">
                  <label className="text-[11px] text-[#5F5E5A] font-medium uppercase tracking-tight">Assigned route / zone</label>
                  <input 
                    type="text" 
                    value={activeVehicle?.assignedRoute || ''} 
                    onChange={(e) => handleFieldChange('assignedRoute', e.target.value)}
                    className="h-9 px-3 border border-[#D3D1C7] rounded-lg focus:outline-none"
                    placeholder="e.g. Addis to Bahir Dar"
                  />
                </div>

                {/* Service and compliance dates/KMs tracking */}
                <div className="sm:col-span-2 border-t border-[#D3D1C7]/60 pt-4 mt-2">
                  <h4 className="text-[11px] font-bold text-[#2C2C2A] uppercase tracking-wider mb-3 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-[#1D9E75]" /> Service & Maintenance logs
                  </h4>
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
              </div>
            </div>

            {/* QEHS Compliance Checklist (1/3 width) */}
            <div className="space-y-4 bg-white p-5 rounded-xl border border-[#D3D1C7] shadow-sm">
              <div className="flex items-center gap-1.5 border-b border-[#D3D1C7] pb-2">
                <ShieldCheck className="w-4 h-4 text-[#1D9E75]" />
                <h3 className="text-xs font-bold text-[#2C2C2A] uppercase tracking-wider">
                  QEHS Compliance Checklist
                </h3>
              </div>

              {/* Checklist items */}
              <div className="space-y-2 text-xs font-sans">
                {[
                  { field: 'qehsInsurance', label: 'Valid insurance cover' },
                  { field: 'qehsRoadWorthy', label: 'Road-worthy certificate' },
                  { field: 'qehsDriverLicence', label: 'Driver licence validity check' },
                  { field: 'qehsLoadSecurity', label: 'Load security equipment present' },
                  { field: 'qehsFireExtinguisher', label: 'Fire extinguisher fitted' },
                  { field: 'qehsFirstAid', label: 'First-aid kit present' },
                  { field: 'qehsGpsTracker', label: 'GPS tracking unit functional' }
                ].map(item => {
                  const isChecked = !!(activeVehicle as any)[item.field];
                  return (
                    <label key={item.field} className="flex items-center justify-between py-1 border-b border-[#D3D1C7]/30 last:border-0 cursor-pointer">
                      <span className="text-[#2C2C2A] text-xs font-medium">{item.label}</span>
                      <input 
                        type="checkbox" 
                        checked={isChecked}
                        onChange={() => handleFieldChange(item.field as keyof Vehicle, !isChecked)}
                        className="rounded border-[#D3D1C7] text-[#1D9E75] focus:ring-[#1D9E75] w-4 h-4 cursor-pointer"
                      />
                    </label>
                  );
                })}
              </div>

              {/* Photo Upload Zone */}
              <div className="pt-2 space-y-3">
                <span className="text-[11px] text-[#5F5E5A] font-semibold uppercase tracking-tight block">Required audit photos</span>
                
                <div className="grid grid-cols-2 gap-2">
                  <div className="flex flex-col items-center justify-center p-2 border border-dashed border-[#D3D1C7] rounded-lg bg-[#F1EFE8]/15 hover:bg-[#F1EFE8]/30 transition-colors text-center">
                    {activeVehicle?.qehsVehiclePhotoUrl ? (
                      <div className="relative group w-full h-16">
                        <img src={activeVehicle.qehsVehiclePhotoUrl} referrerPolicy="no-referrer" className="w-full h-full object-cover rounded" />
                        <button onClick={() => handleFieldChange('qehsVehiclePhotoUrl', '')} className="absolute inset-0 bg-red-600/70 text-white text-[10px] font-bold rounded flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          Remove
                        </button>
                      </div>
                    ) : (
                      <button onClick={() => handleSimulatePhotoUpload('qehsVehiclePhotoUrl')} className="flex flex-col items-center justify-center text-[10px] text-[#5F5E5A] gap-1">
                        <Upload className="w-4 h-4 text-[#1D9E75]" />
                        <span>Vehicle Photo</span>
                      </button>
                    )}
                  </div>

                  <div className="flex flex-col items-center justify-center p-2 border border-dashed border-[#D3D1C7] rounded-lg bg-[#F1EFE8]/15 hover:bg-[#F1EFE8]/30 transition-colors text-center">
                    {activeVehicle?.qehsDriverIdPhotoUrl ? (
                      <div className="relative group w-full h-16">
                        <img src={activeVehicle.qehsDriverIdPhotoUrl} referrerPolicy="no-referrer" className="w-full h-full object-cover rounded" />
                        <button onClick={() => handleFieldChange('qehsDriverIdPhotoUrl', '')} className="absolute inset-0 bg-red-600/70 text-white text-[10px] font-bold rounded flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          Remove
                        </button>
                      </div>
                    ) : (
                      <button onClick={() => handleSimulatePhotoUpload('qehsDriverIdPhotoUrl')} className="flex flex-col items-center justify-center text-[10px] text-[#5F5E5A] gap-1">
                        <Upload className="w-4 h-4 text-[#1D9E75]" />
                        <span>Driver License</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Additional Audit/Compliance Photos */}
              <div className="pt-3 border-t border-[#D3D1C7]/50 space-y-2">
                <span className="text-[11px] text-[#5F5E5A] font-semibold uppercase tracking-tight block">Additional Audit Photos</span>
                <div className="grid grid-cols-3 gap-2">
                  {(activeVehicle?.additionalPhotos || []).map((url, idx) => (
                    <div key={idx} className="relative group w-full h-16 border border-[#D3D1C7] rounded overflow-hidden">
                      <img src={url} referrerPolicy="no-referrer" className="w-full h-full object-cover" />
                      <button 
                        onClick={() => {
                          const updatedPhotos = (activeVehicle?.additionalPhotos || []).filter((_, i) => i !== idx);
                          handleFieldChange('additionalPhotos', updatedPhotos);
                        }} 
                        className="absolute inset-0 bg-red-600/80 text-white text-[9px] font-bold flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                  
                  <button
                    onClick={() => {
                      const sampleImages = [
                        'https://images.unsplash.com/photo-1516576224410-b97c0f16bf58?auto=format&fit=crop&q=80&w=400',
                        'https://images.unsplash.com/photo-1544383835-bda2bc66a55d?auto=format&fit=crop&q=80&w=400',
                        'https://images.unsplash.com/photo-1506015391300-4802dc74de2e?auto=format&fit=crop&q=80&w=400'
                      ];
                      const randomImg = sampleImages[Math.floor(Math.random() * sampleImages.length)];
                      const currentPhotos = activeVehicle?.additionalPhotos || [];
                      handleFieldChange('additionalPhotos', [...currentPhotos, randomImg]);
                    }}
                    className="flex flex-col items-center justify-center border border-dashed border-[#D3D1C7] rounded bg-[#F1EFE8]/10 hover:bg-[#F1EFE8]/25 transition-colors h-16 cursor-pointer text-center text-[10px] text-[#5F5E5A] gap-1"
                  >
                    <Plus className="w-3.5 h-3.5 text-[#1D9E75]" />
                    <span>Add Image</span>
                  </button>
                </div>
              </div>

              {/* Compliance Result Badge */}
              <div className="pt-3 border-t border-[#D3D1C7]/80">
                <span className="text-[11px] text-[#5F5E5A] font-semibold uppercase tracking-tight block mb-2">Audit Verdict</span>
                <div className="flex items-center gap-2">
                  {activeVehicle?.status === 'Compliant' ? (
                    <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg text-xs font-bold font-sans">
                      <ShieldCheck className="w-4 h-4" /> APPROVED
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 text-red-700 border border-red-200 rounded-lg text-xs font-bold font-sans">
                      <ShieldAlert className="w-4 h-4" /> REJECTED
                    </div>
                  )}
                  <span className="text-[10px] text-[#5F5E5A] italic">Calculated in real-time</span>
                </div>

                {activeVehicle?.status !== 'Compliant' && (
                  <div className="mt-3 flex flex-col gap-1 text-[11px]">
                    <span className="text-red-700 font-bold uppercase tracking-tight flex items-center gap-1">
                      <Ban className="w-3 h-3" /> Rejection reason:
                    </span>
                    <p className="text-[#5F5E5A] leading-relaxed bg-red-50/20 p-2 rounded border border-red-100 italic">
                      {activeVehicle?.rejectionReason || 'Checklist criteria not fully completed.'}
                    </p>
                  </div>
                )}
              </div>
            </div>

          </div>

          {/* Sticky Audit Footer */}
          <div className="fixed bottom-0 left-[240px] right-0 h-16 bg-white border-t border-[#D3D1C7] px-6 flex items-center justify-between shadow-md z-40">
            <div className="flex items-center gap-1 text-xs text-[#5F5E5A]">
              <Info className="w-4 h-4 text-[#1D9E75]" />
              <span>Vehicles marked Compliant are dispatched automatically on Work Orders.</span>
            </div>
            
            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  setViewMode('list');
                  setActiveVehicle(null);
                }}
                className="px-4 py-2 border border-[#D3D1C7] bg-white text-[#2C2C2A] hover:bg-[#F1EFE8] rounded-lg text-xs font-sans font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                id="vehicle-save-btn"
                onClick={handleSave}
                className="flex items-center gap-1 px-5 py-2 bg-[#1D9E75] hover:bg-[#1D9E75]/95 text-white rounded-lg text-xs font-sans font-semibold cursor-pointer transition-all shadow-sm"
              >
                <Check className="w-4 h-4" /> Register vehicle log
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

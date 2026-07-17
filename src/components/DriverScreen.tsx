import React, { useState } from 'react';
import { Driver, Vehicle } from '../types';
import { Plus, Search, ArrowLeft, Upload, Check, User, Phone, Calendar, Award, Trash2, Car, ShieldAlert, ShieldCheck } from 'lucide-react';

interface DriverScreenProps {
  drivers: Driver[];
  vehicles: Vehicle[];
  onSaveDriver: (driver: Driver) => void;
  onRemoveDriver?: (driverId: string) => void;
}

export default function DriverScreen({ drivers, vehicles, onSaveDriver, onRemoveDriver }: DriverScreenProps) {
  const [viewMode, setViewMode] = useState<'list' | 'form'>('list');
  const [activeDriver, setActiveDriver] = useState<Driver | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Filtered drivers list
  const filteredDrivers = drivers.filter(d => {
    const matchesSearch = d.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          d.phone.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          d.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          d.licenseNumber.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter ? d.status === statusFilter : true;
    return matchesSearch && matchesStatus;
  });

  const handleInitNewDriver = () => {
    const newDriver: Driver = {
      id: `DRV-${Math.floor(100000 + Math.random() * 900000)}`,
      name: '',
      phone: '',
      licenseNumber: '',
      licenseClass: 'Dry Cargo (Grade 3)',
      licenseExpiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      status: 'Active',
      assignedVehiclePlate: '',
      experienceYears: 2,
      photoUrl: ''
    };
    setActiveDriver(newDriver);
    setViewMode('form');
  };

  const handleViewDriver = (d: Driver) => {
    setActiveDriver({ ...d });
    setViewMode('form');
  };

  const handleFieldChange = (field: keyof Driver, value: any) => {
    if (!activeDriver) return;
    setActiveDriver({ ...activeDriver, [field]: value });
  };

  const handleSave = () => {
    if (!activeDriver) return;
    if (!activeDriver.name.trim()) {
      alert('Driver name is required.');
      return;
    }
    if (!activeDriver.phone.trim()) {
      alert('Phone number is required.');
      return;
    }
    if (!activeDriver.id.trim()) {
      alert('Driver ID/DL Number is required.');
      return;
    }
    
    onSaveDriver(activeDriver);
    setViewMode('list');
    setActiveDriver(null);
    alert(`Driver ${activeDriver.name} information successfully saved.`);
  };

  const handleSimulatePhotoUpload = () => {
    const urls = [
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=400',
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=400',
      'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=400',
      'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=400'
    ];
    const randomUrl = urls[Math.floor(Math.random() * urls.length)];
    handleFieldChange('photoUrl', randomUrl);
  };

  const handleSimulateLicenseUpload = () => {
    const urls = [
      'https://images.unsplash.com/photo-1557200134-90327ee9fafa?auto=format&fit=crop&q=80&w=400',
      'https://images.unsplash.com/photo-1512418490979-92798cec1380?auto=format&fit=crop&q=80&w=400'
    ];
    const randomUrl = urls[Math.floor(Math.random() * urls.length)];
    handleFieldChange('licensePhotoUrl', randomUrl);
  };

  const getStatusStyle = (status: string) => {
    if (status === 'Active') return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    if (status === 'Suspended') return 'bg-red-50 text-red-700 border-red-200';
    return 'bg-slate-100 text-slate-700 border-slate-200'; // Inactive
  };

  return (
    <div className="space-y-6 select-none" id="driver-screen-container">
      {viewMode === 'list' ? (
        <div className="bg-white p-6 rounded-xl border border-[#D3D1C7] shadow-sm space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              {/* Search */}
              <div className="relative w-64">
                <Search className="w-3.5 h-3.5 text-[#5F5E5A] absolute left-3 top-1/2 -translate-y-1/2" />
                <input 
                  type="text" 
                  placeholder="Search driver name, ID, license, or phone..." 
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
                <option value="">All Statuses</option>
                <option value="Active">Active</option>
                <option value="Suspended">Suspended</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>

            <button 
              id="add-driver-btn"
              onClick={handleInitNewDriver}
              className="flex items-center gap-1.5 px-4 py-2 bg-[#1D9E75] hover:bg-[#1D9E75]/90 text-white rounded-lg text-xs font-sans font-semibold cursor-pointer transition-colors"
            >
              <Plus className="w-4 h-4" /> Add Driver
            </button>
          </div>

          <div className="overflow-x-auto border border-[#D3D1C7]/60 rounded-lg">
            <table className="w-full text-left border-collapse" id="drivers-table">
              <thead>
                <tr className="bg-[#F1EFE8]/45 border-b border-[#D3D1C7]/80 text-[10px] font-sans font-semibold text-[#5F5E5A] uppercase tracking-wider">
                  <th className="p-3">Photo</th>
                  <th className="p-3">Driver ID / Name</th>
                  <th className="p-3">Phone</th>
                  <th className="p-3">License No. & Class</th>
                  <th className="p-3 text-center">Exp. Years</th>
                  <th className="p-3">License Expiry</th>
                  <th className="p-3">Assigned Vehicle</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#D3D1C7]/40 text-xs font-sans text-[#2C2C2A]">
                {filteredDrivers.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="p-8 text-center text-[#5F5E5A] italic">
                      No drivers registered yet — add the first driver record
                    </td>
                  </tr>
                ) : (
                  filteredDrivers.map((d) => {
                    const assignedVehicle = vehicles.find(v => v.plateNumber === d.assignedVehiclePlate);
                    return (
                      <tr key={d.id} className="hover:bg-[#F1EFE8]/25 transition-colors">
                        <td className="p-3">
                          <img 
                            src={d.photoUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=100'} 
                            alt={d.name} 
                            referrerPolicy="no-referrer"
                            className="w-10 h-10 object-cover rounded-full border border-gray-200"
                          />
                        </td>
                        <td className="p-3">
                          <div className="flex flex-col">
                            <span className="font-bold text-[#2C2C2A]">{d.name}</span>
                            <span className="text-[10px] font-mono text-slate-500">{d.id}</span>
                          </div>
                        </td>
                        <td className="p-3 font-mono text-slate-600">{d.phone}</td>
                        <td className="p-3">
                          <div className="flex flex-col">
                            <div className="flex items-center gap-1.5">
                              <span className="font-semibold text-slate-700">{d.licenseNumber || '---'}</span>
                              {d.licensePhotoUrl && (
                                <span className="inline-flex items-center gap-0.5 bg-[#1D9E75]/10 text-[#1D9E75] text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-tight" title="Driver License Scan Uploaded">
                                  <Check className="w-2 h-2" /> Scan
                                </span>
                              )}
                            </div>
                            <span className="text-[10px] text-slate-500">{d.licenseClass}</span>
                          </div>
                        </td>
                        <td className="p-3 text-center font-mono font-bold text-[#1D9E75]">
                          {d.experienceYears !== undefined ? `${d.experienceYears} Yrs` : '---'}
                        </td>
                        <td className="p-3 font-mono text-slate-500">{d.licenseExpiryDate}</td>
                        <td className="p-3">
                          {assignedVehicle ? (
                            <div className="flex items-center gap-1.5 bg-[#1D9E75]/10 text-[#1D9E75] px-2 py-1 rounded text-[11px] font-semibold font-mono w-fit">
                              <Car className="w-3 h-3" />
                              <span>{assignedVehicle.plateNumber}</span>
                              <span className="text-[9px] text-slate-500 font-sans">({assignedVehicle.model})</span>
                            </div>
                          ) : (
                            <span className="text-slate-400 italic">No assigned vehicle</span>
                          )}
                        </td>
                        <td className="p-3">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${getStatusStyle(d.status)}`}>
                            {d.status}
                          </span>
                        </td>
                        <td className="p-3 text-center">
                          <button
                            onClick={() => handleViewDriver(d)}
                            className="px-2.5 py-1 text-[10px] border border-[#D3D1C7] rounded hover:bg-[#F1EFE8] transition-colors cursor-pointer"
                          >
                            Edit / Details
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
        <div className="space-y-6" id="driver-form-container">
          <div className="flex items-center justify-between bg-white p-4 rounded-xl border border-[#D3D1C7] shadow-sm">
            <button 
              onClick={() => {
                setViewMode('list');
                setActiveDriver(null);
              }}
              className="flex items-center gap-1.5 text-xs text-[#5F5E5A] hover:text-[#2C2C2A] font-sans font-medium transition-colors"
            >
              <ArrowLeft className="w-4 h-4" /> Back to drivers list
            </button>
            <span className="text-xs font-bold text-[#1D9E75] font-sans">
              {activeDriver?.name ? `Editing Driver: ${activeDriver.name}` : 'Register New Driver'}
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
            {/* Form Fields */}
            <div className="bg-white p-6 rounded-xl border border-[#D3D1C7] shadow-sm lg:col-span-2 space-y-4">
              <h3 className="text-xs font-bold text-[#2C2C2A] border-b border-[#D3D1C7] pb-2 uppercase tracking-wider">
                Driver Personal & Professional Records
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-sans">
                <div className="flex flex-col gap-1">
                  <label className="text-[11px] text-[#5F5E5A] font-medium uppercase tracking-tight">Driver Full Name</label>
                  <input 
                    type="text" 
                    value={activeDriver?.name || ''} 
                    onChange={(e) => handleFieldChange('name', e.target.value)}
                    className="h-9 px-3 border border-[#D3D1C7] rounded-lg focus:outline-none focus:border-[#1D9E75]"
                    placeholder="Full legal name"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[11px] text-[#5F5E5A] font-medium uppercase tracking-tight">Driver ID / ID Number</label>
                  <input 
                    type="text" 
                    value={activeDriver?.id || ''} 
                    onChange={(e) => handleFieldChange('id', e.target.value)}
                    className="h-9 px-3 border border-[#D3D1C7] rounded-lg focus:outline-none focus:border-[#1D9E75] font-mono"
                    placeholder="e.g. DL-8914562"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[11px] text-[#5F5E5A] font-medium uppercase tracking-tight">Mobile Phone Number</label>
                  <input 
                    type="text" 
                    value={activeDriver?.phone || ''} 
                    onChange={(e) => handleFieldChange('phone', e.target.value)}
                    className="h-9 px-3 border border-[#D3D1C7] rounded-lg focus:outline-none focus:border-[#1D9E75]"
                    placeholder="e.g. +251911998877"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[11px] text-[#5F5E5A] font-medium uppercase tracking-tight">Driving License Number</label>
                  <input 
                    type="text" 
                    value={activeDriver?.licenseNumber || ''} 
                    onChange={(e) => handleFieldChange('licenseNumber', e.target.value)}
                    className="h-9 px-3 border border-[#D3D1C7] rounded-lg focus:outline-none focus:border-[#1D9E75] font-mono"
                    placeholder="e.g. L-ET-8914562"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[11px] text-[#5F5E5A] font-medium uppercase tracking-tight">License Classification</label>
                  <select 
                    value={activeDriver?.licenseClass || 'Dry Cargo (Grade 3)'} 
                    onChange={(e) => handleFieldChange('licenseClass', e.target.value)}
                    className="h-9 px-2 border border-[#D3D1C7] rounded-lg focus:outline-none bg-white"
                  >
                    <option value="Dry Cargo (Grade 3)">Dry Cargo (Grade 3)</option>
                    <option value="Dry Cargo (Grade 4)">Dry Cargo (Grade 4)</option>
                    <option value="Dry Cargo (Grade 5)">Dry Cargo (Grade 5)</option>
                    <option value="Liquid Cargo / Dangerous Goods">Liquid Cargo / Dangerous Goods</option>
                    <option value="Trailer / Heavy Truck">Trailer / Heavy Truck</option>
                  </select>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[11px] text-[#5F5E5A] font-medium uppercase tracking-tight">License Expiry Date</label>
                  <input 
                    type="date" 
                    value={activeDriver?.licenseExpiryDate || ''} 
                    onChange={(e) => handleFieldChange('licenseExpiryDate', e.target.value)}
                    className="h-9 px-3 border border-[#D3D1C7] rounded-lg focus:outline-none focus:border-[#1D9E75]"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[11px] text-[#5F5E5A] font-medium uppercase tracking-tight">Years of Experience</label>
                  <input 
                    type="number" 
                    value={activeDriver?.experienceYears || 0} 
                    onChange={(e) => handleFieldChange('experienceYears', Number(e.target.value))}
                    className="h-9 px-3 border border-[#D3D1C7] rounded-lg focus:outline-none focus:border-[#1D9E75] font-bold"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[11px] text-[#5F5E5A] font-medium uppercase tracking-tight">System Status</label>
                  <select 
                    value={activeDriver?.status || 'Active'} 
                    onChange={(e) => handleFieldChange('status', e.target.value)}
                    className="h-9 px-2 border border-[#D3D1C7] rounded-lg focus:outline-none bg-white font-semibold"
                  >
                    <option value="Active">Active</option>
                    <option value="Suspended">Suspended</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>

                <div className="flex flex-col gap-1 sm:col-span-2">
                  <label className="text-[11px] text-[#5F5E5A] font-medium uppercase tracking-tight">Assigned Vehicle to Drive</label>
                  <select
                    value={activeDriver?.assignedVehiclePlate || ''}
                    onChange={(e) => handleFieldChange('assignedVehiclePlate', e.target.value)}
                    className="h-9 px-2 border border-[#D3D1C7] rounded-lg focus:outline-none bg-white font-mono font-bold"
                  >
                    <option value="">-- No Vehicle Assigned --</option>
                    {vehicles.map(v => (
                      <option key={v.plateNumber} value={v.plateNumber}>
                        {v.plateNumber} ({v.model} - {v.tonCapacity}T)
                      </option>
                    ))}
                  </select>
                  <p className="text-[10px] text-slate-500 mt-0.5">
                    Associating this vehicle will show this car in the driver's registry and vice-versa.
                  </p>
                </div>
              </div>
            </div>

            {/* Profile Picture & License Cards */}
            <div className="space-y-6">
              {/* Profile Photo */}
              <div className="bg-white p-5 rounded-xl border border-[#D3D1C7] shadow-sm space-y-4">
                <h3 className="text-xs font-bold text-[#2C2C2A] border-b border-[#D3D1C7] pb-2 uppercase tracking-wider">
                  Driver Photo ID
                </h3>

                <div className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-[#D3D1C7] rounded-xl bg-[#F1EFE8]/15 text-center space-y-3">
                  {activeDriver?.photoUrl ? (
                    <div className="relative group w-40 h-40">
                      <img 
                        src={activeDriver.photoUrl} 
                        alt="Driver" 
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover rounded-xl border border-slate-300" 
                      />
                      <button 
                        onClick={() => handleFieldChange('photoUrl', '')} 
                        className="absolute inset-0 bg-red-600/80 text-white text-xs font-bold rounded-xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                      >
                        Delete Photo
                      </button>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-12 h-12 bg-[#F1EFE8] rounded-full flex items-center justify-center text-slate-400">
                        <User className="w-6 h-6" />
                      </div>
                      <button 
                        onClick={handleSimulatePhotoUpload}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-[#1D9E75] hover:bg-[#1D9E75]/90 text-white rounded text-[11px] font-semibold cursor-pointer"
                      >
                        <Upload className="w-3.5 h-3.5" /> Upload Photo
                      </button>
                      <span className="text-[10px] text-slate-400">Supported files: JPG, PNG</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Driving License Scan Attachment */}
              <div className="bg-white p-5 rounded-xl border border-[#D3D1C7] shadow-sm space-y-4">
                <h3 className="text-xs font-bold text-[#2C2C2A] border-b border-[#D3D1C7] pb-2 uppercase tracking-wider">
                  Driver License Attachment
                </h3>

                <div className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-[#D3D1C7] rounded-xl bg-[#F1EFE8]/15 text-center space-y-3">
                  {activeDriver?.licensePhotoUrl ? (
                    <div className="relative group w-full h-32">
                      <img 
                        src={activeDriver.licensePhotoUrl} 
                        alt="Driving License" 
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover rounded-xl border border-slate-300" 
                      />
                      <button 
                        onClick={() => handleFieldChange('licensePhotoUrl', '')} 
                        className="absolute inset-0 bg-red-600/80 text-white text-xs font-bold rounded-xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                      >
                        Delete License File
                      </button>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-12 h-12 bg-[#F1EFE8] rounded-full flex items-center justify-center text-slate-400">
                        <Award className="w-6 h-6" />
                      </div>
                      <button 
                        onClick={handleSimulateLicenseUpload}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-[#1D9E75] hover:bg-[#1D9E75]/90 text-white rounded text-[11px] font-semibold cursor-pointer"
                      >
                        <Upload className="w-3.5 h-3.5" /> Upload License Scan
                      </button>
                      <span className="text-[10px] text-slate-400">Attach digital copy (PDF, PNG, JPG)</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Summary Checklist */}
              <div className="bg-white p-5 rounded-xl border border-[#D3D1C7] shadow-sm space-y-3">
                <div className="bg-slate-50 p-3 rounded-lg border border-[#D3D1C7]/60 space-y-2 text-xs font-sans">
                  <span className="text-[10px] font-bold uppercase tracking-tight text-[#5F5E5A]">Verification Status</span>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-600">License Expiry:</span>
                    {activeDriver?.licenseExpiryDate && new Date(activeDriver.licenseExpiryDate) > new Date() ? (
                      <span className="text-emerald-700 font-bold flex items-center gap-1 text-[11px]">
                        <ShieldCheck className="w-3.5 h-3.5" /> Valid
                      </span>
                    ) : (
                      <span className="text-red-700 font-bold flex items-center gap-1 text-[11px]">
                        <ShieldAlert className="w-3.5 h-3.5" /> Expired
                      </span>
                    )}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-600">Assigned Vehicle:</span>
                    <span className="font-mono text-[11px] font-semibold">
                      {activeDriver?.assignedVehiclePlate || 'None'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-600">License Scan:</span>
                    {activeDriver?.licensePhotoUrl ? (
                      <span className="text-emerald-700 font-bold flex items-center gap-0.5 text-[11px]">
                        <Check className="w-3.5 h-3.5" /> Attached
                      </span>
                    ) : (
                      <span className="text-amber-600 italic text-[11px]">Pending Upload</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Sticky form footer */}
          <div className="fixed bottom-0 left-[240px] right-0 h-16 bg-white border-t border-[#D3D1C7] px-6 flex items-center justify-end gap-3 shadow-md z-40">
            <button
              onClick={() => {
                setViewMode('list');
                setActiveDriver(null);
              }}
              className="px-4 py-2 border border-[#D3D1C7] bg-white text-[#2C2C2A] hover:bg-[#F1EFE8] rounded-lg text-xs font-sans font-semibold cursor-pointer"
            >
              Cancel
            </button>
            <button
              id="driver-save-btn"
              onClick={handleSave}
              className="flex items-center gap-1 px-5 py-2 bg-[#1D9E75] hover:bg-[#1D9E75]/95 text-white rounded-lg text-xs font-sans font-semibold cursor-pointer transition-all shadow-sm"
            >
              <Check className="w-4 h-4" /> Save Driver Record
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

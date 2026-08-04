import React, { useState } from 'react';
import { Contact } from '../types';
import { ETHIOPIAN_REGIONS } from '../data';
import { Search, Eye, Edit2, Plus, Star, ArrowLeft, ToggleLeft, ToggleRight, Check, Sparkles } from 'lucide-react';

interface ContactScreenProps {
  contacts: Contact[];
  onSaveContact: (contact: Contact) => void;
}

export default function ContactScreen({ contacts, onSaveContact }: ContactScreenProps) {
  const [viewMode, setViewMode] = useState<'list' | 'form'>('list');
  const [activeContact, setActiveContact] = useState<Contact | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [regionFilter, setRegionFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Search and filter logic
  const filteredContacts = contacts.filter(contact => {
    const matchesSearch = contact.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          contact.tin.includes(searchQuery) ||
                          contact.contactPerson.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCategory = categoryFilter ? contact.category === categoryFilter : true;
    const matchesRegion = regionFilter ? contact.region === regionFilter : true;
    const matchesStatus = statusFilter ? contact.status === statusFilter : true;

    return matchesSearch && matchesCategory && matchesRegion && matchesStatus;
  });

  const totalContacts = contacts.length;
  const activeSuppliers = contacts.filter(c => c.status === 'Active' && c.category === 'Supplier').length;
  const activeVendors = contacts.filter(c => c.status === 'Active' && c.category === 'Vendor').length;

  const handleInitNewContact = () => {
    const newContact: Contact = {
      id: `contact-${Date.now()}`,
      name: '',
      tin: '',
      category: 'Supplier',
      region: ETHIOPIAN_REGIONS[0],
      city: '',
      capitalCity: '',
      licenseNo: '',
      status: 'Active',
      rating: 100,
      address: '',
      phone: '',
      email: '',
      contactPerson: '',
      licenseExpiryDate: '',
      serviceQualityScore: 100,
      creditFacility: true,
      experienceWithAdiu: true,
      notes: '',
      perfCreditFacility: 20,
      perfProductQuality: 20,
      perfServiceQuality: 20,
      perfAvailability: 20,
      perfExperienceWithAdiu: 20
    };
    setActiveContact(newContact);
    setViewMode('form');
  };

  const handleViewContact = (contact: Contact) => {
    setActiveContact({ ...contact });
    setViewMode('form');
  };

  const handleFieldChange = (field: keyof Contact, value: any) => {
    if (!activeContact) return;
    
    // Create copy
    const updated = { ...activeContact, [field]: value };

    // If change affects performance metrics, recalculate rating %
    if (field.toString().startsWith('perf') || field === 'creditFacility' || field === 'experienceWithAdiu') {
      // Standardize the weights:
      // perfCreditFacility is 20%, perfProductQuality is 20%, perfServiceQuality is 20%, perfAvailability is 20%, perfExperienceWithAdiu is 20%
      const cred = updated.perfCreditFacility || 0;
      const prod = updated.perfProductQuality || 0;
      const serv = updated.perfServiceQuality || 0;
      const avail = updated.perfAvailability || 0;
      const exp = updated.perfExperienceWithAdiu || 0;
      
      const totalScore = cred + prod + serv + avail + exp;
      updated.rating = Math.min(100, Math.max(0, totalScore));
    }

    setActiveContact(updated);
  };

  const handleSave = () => {
    if (!activeContact) return;
    if (!activeContact.name || !activeContact.tin) {
      alert('Contact name and TIN are required.');
      return;
    }
    onSaveContact(activeContact);
    setViewMode('list');
    setActiveContact(null);
    alert('Contact record has been registered successfully.');
  };

  return (
    <div className="space-y-6 select-none" id="contact-screen-container">
      {viewMode === 'list' ? (
        <div className="space-y-5 bg-white p-6 rounded-xl border border-[#D3D1C7] shadow-sm">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-[#2C2C2A]">Contact Registry</h2>
              <p className="text-sm text-[#5F5E5A]">Manage suppliers and vendors at a glance.</p>
            </div>
            <button 
              id="add-contact-btn"
              onClick={handleInitNewContact}
              className="flex items-center gap-1.5 px-4 py-2 bg-[#1D9E75] hover:bg-[#1D9E75]/90 text-white rounded-lg text-xs font-sans font-semibold cursor-pointer transition-colors"
            >
              <Plus className="w-4 h-4" /> Add Contact
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="rounded-xl border border-[#D3D1C7] bg-[#F1EFE8]/40 p-4">
              <p className="text-[10px] uppercase tracking-wider text-[#5F5E5A] font-semibold">Total Contacts</p>
              <p className="mt-2 text-2xl font-bold text-[#2C2C2A]">{totalContacts}</p>
            </div>
            <div className="rounded-xl border border-[#D3D1C7] bg-[#F1EFE8]/40 p-4">
              <p className="text-[10px] uppercase tracking-wider text-[#5F5E5A] font-semibold">Active Suppliers</p>
              <p className="mt-2 text-2xl font-bold text-[#1D9E75]">{activeSuppliers}</p>
            </div>
            <div className="rounded-xl border border-[#D3D1C7] bg-[#F1EFE8]/40 p-4">
              <p className="text-[10px] uppercase tracking-wider text-[#5F5E5A] font-semibold">Active Vendors</p>
              <p className="mt-2 text-2xl font-bold text-[#1D9E75]">{activeVendors}</p>
            </div>
          </div>

          {/* Filter Bar */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-3 flex-1">
              {/* Search */}
              <div className="relative w-64">
                <Search className="w-3.5 h-3.5 text-[#5F5E5A] absolute left-3 top-1/2 -translate-y-1/2" />
                <input 
                  type="text" 
                  placeholder="Search by name, TIN, or contact..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full h-9 pl-9 pr-3 rounded-lg border border-[#D3D1C7] bg-[#F1EFE8]/30 font-sans text-xs text-[#2C2C2A] focus:outline-none focus:border-[#1D9E75]"
                />
              </div>

              {/* Category Filter */}
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="h-9 px-2 rounded-lg border border-[#D3D1C7] text-xs font-sans text-[#2C2C2A] bg-white focus:outline-none"
              >
                <option value="">All Categories</option>
                <option value="Supplier">Supplier</option>
                <option value="Vendor">Vendor</option>
              </select>

              {/* Region Filter */}
              <select
                value={regionFilter}
                onChange={(e) => setRegionFilter(e.target.value)}
                className="h-9 px-2 rounded-lg border border-[#D3D1C7] text-xs font-sans text-[#2C2C2A] bg-white focus:outline-none"
              >
                <option value="">All Regions</option>
                {ETHIOPIAN_REGIONS.map(r => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>

              {/* Status Filter */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="h-9 px-2 rounded-lg border border-[#D3D1C7] text-xs font-sans text-[#2C2C2A] bg-white focus:outline-none"
              >
                <option value="">All Statuses</option>
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>

            <button 
              id="add-contact-btn"
              onClick={handleInitNewContact}
              className="flex items-center gap-1.5 px-4 py-2 bg-[#1D9E75] hover:bg-[#1D9E75]/90 text-white rounded-lg text-xs font-sans font-semibold cursor-pointer transition-colors"
            >
              <Plus className="w-4 h-4" /> Add Contact
            </button>
          </div>

          {/* Contact Data Table */}
          <div className="overflow-x-auto border border-[#D3D1C7]/60 rounded-lg">
            <table className="w-full text-left border-collapse" id="contacts-table">
              <thead>
                <tr className="bg-[#F1EFE8]/45 border-b border-[#D3D1C7]/80 text-[10px] font-sans font-semibold text-[#5F5E5A] uppercase tracking-wider">
                  <th className="p-3">Name</th>
                  <th className="p-3">Category</th>
                  <th className="p-3 font-mono">TIN</th>
                  <th className="p-3">Region</th>
                  <th className="p-3">City</th>
                  <th className="p-3">License No.</th>
                  <th className="p-3">Rating %</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#D3D1C7]/40 text-xs font-sans text-[#2C2C2A]">
                {filteredContacts.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="p-8 text-center text-[#5F5E5A] italic">
                      No records yet — add the first one
                    </td>
                  </tr>
                ) : (
                  filteredContacts.map((contact) => (
                    <tr key={contact.id} className="hover:bg-[#F1EFE8]/25 transition-colors">
                      <td className="p-3 font-semibold text-[#2C2C2A]">{contact.name}</td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] border ${contact.category === 'Supplier' ? 'bg-blue-50 text-blue-600 border-blue-200' : 'bg-purple-50 text-purple-600 border-purple-200'}`}>{contact.category}</span>
                      </td>
                      <td className="p-3 font-mono text-[11px]">{contact.tin}</td>
                      <td className="p-3"><span className="bg-[#F1EFE8] px-1.5 py-0.5 rounded border border-[#D3D1C7]/40 font-mono text-[10px]">{contact.region}</span></td>
                      <td className="p-3">{contact.city || '---'}</td>
                      <td className="p-3 text-slate-600">{contact.licenseNo || '---'}</td>
                      <td className="p-3">
                        <div className="flex items-center gap-1">
                          <span className="font-bold text-[#1D9E75]">{contact.rating}%</span>
                          <span className="text-[10px] text-[#5F5E5A] italic">({contact.rating >= 80 ? 'Class A' : contact.rating >= 60 ? 'Class B' : 'Class C'})</span>
                        </div>
                      </td>
                      <td className="p-3">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold border ${
                          contact.status === 'Active' 
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                            : 'bg-slate-50 text-slate-600 border-slate-200'
                        }`}>
                          {contact.status}
                        </span>
                      </td>
                      <td className="p-3 text-center">
                        <button
                          onClick={() => handleViewContact(contact)}
                          className="px-2.5 py-1 text-[10px] font-medium border border-[#D3D1C7] rounded hover:bg-[#F1EFE8] transition-colors inline-flex items-center gap-1"
                        >
                          <Eye className="w-3 h-3 text-[#5F5E5A]" /> View / Edit
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Form mode */
        <div className="space-y-6" id="contact-form-container">
          {/* Header */}
          <div className="flex items-center justify-between bg-white p-4 rounded-xl border border-[#D3D1C7] shadow-sm">
            <button 
              onClick={() => {
                setViewMode('list');
                setActiveContact(null);
              }}
              className="flex items-center gap-1.5 text-xs text-[#5F5E5A] hover:text-[#2C2C2A] font-sans font-medium transition-colors"
            >
              <ArrowLeft className="w-4 h-4" /> Back to contacts list
            </button>
            <span className="text-xs font-bold font-sans text-[#1D9E75]">
              {activeContact?.name ? `Editing: ${activeContact.name}` : 'Registering New Contact'}
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
            {/* Form Fields (2/3 width) */}
            <div className="bg-white p-6 rounded-xl border border-[#D3D1C7] shadow-sm lg:col-span-2 space-y-4">
              <h3 className="text-xs font-bold text-[#2C2C2A] border-b border-[#D3D1C7] pb-2 uppercase tracking-wider">
                Contact Profile Details
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-sans">
                <div className="flex flex-col gap-1">
                  <label className="text-[11px] text-[#5F5E5A] font-medium uppercase tracking-tight">Name</label>
                  <input 
                    type="text" 
                    value={activeContact?.name || ''} 
                    onChange={(e) => handleFieldChange('name', e.target.value)}
                    className="h-9 px-3 border border-[#D3D1C7] rounded-lg focus:outline-none focus:border-[#1D9E75]"
                    placeholder="Enter official business name"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[11px] text-[#5F5E5A] font-medium uppercase tracking-tight">Category</label>
                  <select
                    value={activeContact?.category || 'Supplier'}
                    onChange={(e) => handleFieldChange('category', e.target.value)}
                    className="h-9 px-2 border border-[#D3D1C7] rounded-lg focus:outline-none focus:border-[#1D9E75]"
                  >
                    <option value="Supplier">Supplier</option>
                    <option value="Vendor">Vendor</option>
                  </select>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[11px] text-[#5F5E5A] font-medium uppercase tracking-tight">TIN (Taxpayer Identification No)</label>
                  <input 
                    type="text" 
                    value={activeContact?.tin || ''} 
                    onChange={(e) => handleFieldChange('tin', e.target.value)}
                    className="h-9 px-3 border border-[#D3D1C7] rounded-lg focus:outline-none focus:border-[#1D9E75] font-mono"
                    placeholder="e.g. 0012489632"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[11px] text-[#5F5E5A] font-medium uppercase tracking-tight">Contact person name</label>
                  <input 
                    type="text" 
                    value={activeContact?.contactPerson || ''} 
                    onChange={(e) => handleFieldChange('contactPerson', e.target.value)}
                    className="h-9 px-3 border border-[#D3D1C7] rounded-lg focus:outline-none focus:border-[#1D9E75]"
                    placeholder="Primary coordinator"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[11px] text-[#5F5E5A] font-medium uppercase tracking-tight">Phone number(s)</label>
                  <input 
                    type="text" 
                    value={activeContact?.phone || ''} 
                    onChange={(e) => handleFieldChange('phone', e.target.value)}
                    className="h-9 px-3 border border-[#D3D1C7] rounded-lg focus:outline-none focus:border-[#1D9E75]"
                    placeholder="e.g. +251116634522"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[11px] text-[#5F5E5A] font-medium uppercase tracking-tight">Email address</label>
                  <input 
                    type="email" 
                    value={activeContact?.email || ''} 
                    onChange={(e) => handleFieldChange('email', e.target.value)}
                    className="h-9 px-3 border border-[#D3D1C7] rounded-lg focus:outline-none focus:border-[#1D9E75]"
                    placeholder="e.g. info@supplier.com"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[11px] text-[#5F5E5A] font-medium uppercase tracking-tight">Region of main operations</label>
                  <select 
                    value={activeContact?.region || ''} 
                    onChange={(e) => handleFieldChange('region', e.target.value)}
                    className="h-9 px-2 border border-[#D3D1C7] rounded-lg focus:outline-none focus:border-[#1D9E75]"
                  >
                    {ETHIOPIAN_REGIONS.map(r => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[11px] text-[#5F5E5A] font-medium uppercase tracking-tight">City</label>
                  <input 
                    type="text" 
                    value={activeContact?.city || ''} 
                    onChange={(e) => handleFieldChange('city', e.target.value)}
                    className="h-9 px-3 border border-[#D3D1C7] rounded-lg focus:outline-none focus:border-[#1D9E75]"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[11px] text-[#5F5E5A] font-medium uppercase tracking-tight">Capital city</label>
                  <input 
                    type="text" 
                    value={activeContact?.capitalCity || ''} 
                    onChange={(e) => handleFieldChange('capitalCity', e.target.value)}
                    className="h-9 px-3 border border-[#D3D1C7] rounded-lg focus:outline-none focus:border-[#1D9E75]"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[11px] text-[#5F5E5A] font-medium uppercase tracking-tight">Business license number</label>
                  <input 
                    type="text" 
                    value={activeContact?.licenseNo || ''} 
                    onChange={(e) => handleFieldChange('licenseNo', e.target.value)}
                    className="h-9 px-3 border border-[#D3D1C7] rounded-lg focus:outline-none focus:border-[#1D9E75]"
                    placeholder="e.g. BL/AA/2024/9912"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[11px] text-[#5F5E5A] font-medium uppercase tracking-tight">License expiry date</label>
                  <input 
                    type="date" 
                    value={activeContact?.licenseExpiryDate || ''} 
                    onChange={(e) => handleFieldChange('licenseExpiryDate', e.target.value)}
                    className="h-9 px-2 border border-[#D3D1C7] rounded-lg focus:outline-none"
                  />
                </div>

                <div className="flex flex-col gap-1 sm:col-span-2">
                  <label className="text-[11px] text-[#5F5E5A] font-medium uppercase tracking-tight">Physical street address</label>
                  <input 
                    type="text" 
                    value={activeContact?.address || ''} 
                    onChange={(e) => handleFieldChange('address', e.target.value)}
                    className="h-9 px-3 border border-[#D3D1C7] rounded-lg focus:outline-none focus:border-[#1D9E75]"
                    placeholder="Street, Building, Floor number"
                  />
                </div>

                {/* Credit Facility & Adiu Experience Toggles */}
                <div className="grid grid-cols-3 gap-4 sm:col-span-2 py-2">
                  <div className="flex flex-col gap-1">
                    <span className="text-[11px] text-[#5F5E5A] font-medium uppercase tracking-tight">Credit facility available</span>
                    <button
                      onClick={() => handleFieldChange('creditFacility', !activeContact?.creditFacility)}
                      className="flex items-center gap-1.5 text-xs text-[#2C2C2A] text-left font-semibold py-1.5 cursor-pointer"
                    >
                      {activeContact?.creditFacility ? (
                        <span className="text-emerald-600 flex items-center gap-1"><ToggleRight className="w-7 h-7" /> Yes (Credit terms active)</span>
                      ) : (
                        <span className="text-[#5F5E5A] flex items-center gap-1"><ToggleLeft className="w-7 h-7" /> No (Cash payment required)</span>
                      )}
                    </button>
                  </div>

                  <div className="flex flex-col gap-1">
                    <span className="text-[11px] text-[#5F5E5A] font-medium uppercase tracking-tight">Prior experience with Adiu</span>
                    <button
                      onClick={() => handleFieldChange('experienceWithAdiu', !activeContact?.experienceWithAdiu)}
                      className="flex items-center gap-1.5 text-xs text-[#2C2C2A] text-left font-semibold py-1.5 cursor-pointer"
                    >
                      {activeContact?.experienceWithAdiu ? (
                        <span className="text-emerald-600 flex items-center gap-1"><ToggleRight className="w-7 h-7" /> Yes (Onboarded partner)</span>
                      ) : (
                        <span className="text-[#5F5E5A] flex items-center gap-1"><ToggleLeft className="w-7 h-7" /> No (New vendor)</span>
                      )}
                    </button>
                  </div>

                  <div className="flex flex-col gap-1">
                    <span className="text-[11px] text-[#5F5E5A] font-medium uppercase tracking-tight">Registry status</span>
                    <select
                      value={activeContact?.status || 'Active'}
                      onChange={(e) => handleFieldChange('status', e.target.value)}
                      className="h-9 px-2 mt-0.5 border border-[#D3D1C7] rounded-lg focus:outline-none bg-white font-medium"
                    >
                      <option value="Active">Active</option>
                      <option value="Inactive">Inactive</option>
                    </select>
                  </div>
                </div>

                <div className="flex flex-col gap-1 sm:col-span-2">
                  <label className="text-[11px] text-[#5F5E5A] font-medium uppercase tracking-tight">Internal Notes</label>
                  <textarea 
                    rows={3} 
                    value={activeContact?.notes || ''} 
                    onChange={(e) => handleFieldChange('notes', e.target.value)}
                    className="p-3 border border-[#D3D1C7] rounded-lg focus:outline-none font-sans"
                    placeholder="General service records, contract terms..."
                  />
                </div>
              </div>
            </div>

            {/* Performance evaluation scoreboard (1/3 width) */}
            <div className="space-y-6">
              
              {/* Scorecard panel */}
              <div className="bg-white p-5 rounded-xl border border-[#D3D1C7] shadow-sm space-y-4">
                <div className="flex items-center gap-1.5 border-b border-[#D3D1C7] pb-2">
                  <Sparkles className="w-4 h-4 text-[#1D9E75]" />
                  <h3 className="text-xs font-bold text-[#2C2C2A] uppercase tracking-wider">
                    Performance Evaluation Panel
                  </h3>
                </div>

                <p className="text-[11px] text-[#5F5E5A]">
                  Weighted scorecard (5 criteria x 20% each). Tweak individual weights to update rating.
                </p>

                <div className="space-y-3.5 text-xs font-sans">
                  {/* Criteria 1 */}
                  <div className="space-y-1">
                    <div className="flex justify-between font-medium">
                      <span>Credit facility</span>
                      <span className="font-semibold text-[#1D9E75]">{activeContact?.perfCreditFacility || 0}% / 20%</span>
                    </div>
                    <input 
                      type="range" min="0" max="20" 
                      value={activeContact?.perfCreditFacility || 0}
                      onChange={(e) => handleFieldChange('perfCreditFacility', Number(e.target.value))}
                      className="w-full accent-[#1D9E75]"
                    />
                  </div>

                  {/* Criteria 2 */}
                  <div className="space-y-1">
                    <div className="flex justify-between font-medium">
                      <span>Product quality</span>
                      <span className="font-semibold text-[#1D9E75]">{activeContact?.perfProductQuality || 0}% / 20%</span>
                    </div>
                    <input 
                      type="range" min="0" max="20" 
                      value={activeContact?.perfProductQuality || 0}
                      onChange={(e) => handleFieldChange('perfProductQuality', Number(e.target.value))}
                      className="w-full accent-[#1D9E75]"
                    />
                  </div>

                  {/* Criteria 3 */}
                  <div className="space-y-1">
                    <div className="flex justify-between font-medium">
                      <span>Service quality</span>
                      <span className="font-semibold text-[#1D9E75]">{activeContact?.perfServiceQuality || 0}% / 20%</span>
                    </div>
                    <input 
                      type="range" min="0" max="20" 
                      value={activeContact?.perfServiceQuality || 0}
                      onChange={(e) => handleFieldChange('perfServiceQuality', Number(e.target.value))}
                      className="w-full accent-[#1D9E75]"
                    />
                  </div>

                  {/* Criteria 4 */}
                  <div className="space-y-1">
                    <div className="flex justify-between font-medium">
                      <span>Availability / stock</span>
                      <span className="font-semibold text-[#1D9E75]">{activeContact?.perfAvailability || 0}% / 20%</span>
                    </div>
                    <input 
                      type="range" min="0" max="20" 
                      value={activeContact?.perfAvailability || 0}
                      onChange={(e) => handleFieldChange('perfAvailability', Number(e.target.value))}
                      className="w-full accent-[#1D9E75]"
                    />
                  </div>

                  {/* Criteria 5 */}
                  <div className="space-y-1">
                    <div className="flex justify-between font-medium">
                      <span>Experience with Adiu</span>
                      <span className="font-semibold text-[#1D9E75]">{activeContact?.perfExperienceWithAdiu || 0}% / 20%</span>
                    </div>
                    <input 
                      type="range" min="0" max="20" 
                      value={activeContact?.perfExperienceWithAdiu || 0}
                      onChange={(e) => handleFieldChange('perfExperienceWithAdiu', Number(e.target.value))}
                      className="w-full accent-[#1D9E75]"
                    />
                  </div>

                  {/* Score total */}
                  <div className="pt-3 border-t border-[#D3D1C7] flex items-center justify-between">
                    <span className="font-bold text-xs uppercase text-[#2C2C2A]">Total rating percentage</span>
                    <div className="text-xl font-extrabold text-[#1D9E75] font-sans">
                      {activeContact?.rating}%
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Sticky footer for supplier edit */}
          <div className="fixed bottom-0 left-[240px] right-0 h-16 bg-white border-t border-[#D3D1C7] px-6 flex items-center justify-between shadow-md z-40">
            <span className="text-xs text-[#5F5E5A]">
              TIN Validation state: <span className="text-emerald-600 font-semibold">✓ Compliant</span>
            </span>
            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  setViewMode('list');
                  setActiveContact(null);
                }}
                className="px-4 py-2 border border-[#D3D1C7] bg-white text-[#2C2C2A] hover:bg-[#F1EFE8] rounded-lg text-xs font-sans font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                id="contact-save-btn"
                onClick={handleSave}
                className="flex items-center gap-1 px-5 py-2 bg-[#1D9E75] hover:bg-[#1D9E75]/95 text-white rounded-lg text-xs font-sans font-semibold cursor-pointer transition-all shadow-sm"
              >
                <Check className="w-4 h-4" /> Save Contact Registry
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

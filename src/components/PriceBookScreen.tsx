import React, { useState } from 'react';
import { PriceBookEntry, PriceThresholdConfig, Supplier, ItemCategory } from '../types';
import { Search, Plus, Save, Edit2, AlertCircle, HelpCircle, Check, Trash2 } from 'lucide-react';

interface PriceBookScreenProps {
  priceBook: PriceBookEntry[];
  suppliers: Supplier[];
  categories: ItemCategory[];
  thresholdConfigs: PriceThresholdConfig[];
  onSavePriceEntry: (entry: PriceBookEntry) => void;
  onSaveThresholdConfig: (config: PriceThresholdConfig) => void;
  onRemovePriceEntry?: (id: string) => void;
}

export default function PriceBookScreen({
  priceBook,
  suppliers,
  categories,
  thresholdConfigs,
  onSavePriceEntry,
  onSaveThresholdConfig,
  onRemovePriceEntry
}: PriceBookScreenProps) {
  
  const [supplierFilter, setSupplierFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Inline editing state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editFields, setEditFields] = useState<Partial<PriceBookEntry>>({});

  // Threshold config state
  const [selectedConfigSupplierId, setSelectedConfigSupplierId] = useState(suppliers[0]?.id || '');
  const [thresholdAmount, setThresholdAmount] = useState(
    thresholdConfigs.find(c => c.supplierId === (suppliers[0]?.id || ''))?.thresholdAmount || 100000
  );
  const [alertThresholdPercent, setAlertThresholdPercent] = useState(
    thresholdConfigs.find(c => c.supplierId === (suppliers[0]?.id || ''))?.alertThresholdPercent || 10
  );

  // Sync threshold controls when supplier selection changes
  const handleThresholdSupplierChange = (supId: string) => {
    setSelectedConfigSupplierId(supId);
    const existing = thresholdConfigs.find(c => c.supplierId === supId);
    if (existing) {
      setThresholdAmount(existing.thresholdAmount);
      setAlertThresholdPercent(existing.alertThresholdPercent);
    } else {
      setThresholdAmount(100000);
      setAlertThresholdPercent(10);
    }
  };

  const handleSaveThreshold = () => {
    onSaveThresholdConfig({
      supplierId: selectedConfigSupplierId,
      thresholdAmount,
      alertThresholdPercent
    });
    alert(`Threshold rules successfully updated for ${suppliers.find(s => s.id === selectedConfigSupplierId)?.name}`);
  };

  const handleStartEdit = (entry: PriceBookEntry) => {
    setEditingId(entry.id);
    setEditFields({ ...entry });
  };

  const handleEditFieldChange = (field: keyof PriceBookEntry, value: any) => {
    setEditFields(prev => ({ ...prev, [field]: value }));
  };

  const handleSaveEdit = () => {
    if (editingId && editFields) {
      onSavePriceEntry(editFields as PriceBookEntry);
      setEditingId(null);
      setEditFields({});
    }
  };

  const handleAddNewEntry = () => {
    const nextNum = priceBook.length + 1;
    const newEntry: PriceBookEntry = {
      id: `pb-add-${Date.now()}`,
      code: `PB-NEW-0${nextNum}`,
      itemDescription: 'New item specification',
      unit: 'Trip',
      unitPrice: 15000,
      effectiveDate: new Date().toISOString().split('T')[0],
      expiryDate: '2026-12-31',
      status: 'Active',
      supplierId: suppliers[0]?.id || 'sup-01',
      itemCategoryId: categories[0]?.id || 'cat-01'
    };
    onSavePriceEntry(newEntry);
    handleStartEdit(newEntry);
  };

  // Filter Price Book entries
  const filteredEntries = priceBook.filter(entry => {
    const matchesSupplier = supplierFilter ? entry.supplierId === supplierFilter : true;
    const matchesCategory = categoryFilter ? entry.itemCategoryId === categoryFilter : true;
    const matchesSearch = searchQuery 
      ? entry.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        entry.itemDescription.toLowerCase().includes(searchQuery.toLowerCase())
      : true;
    
    return matchesSupplier && matchesCategory && matchesSearch;
  });

  return (
    <div className="space-y-6 select-none" id="price-book-container">
      {/* Page Description Subtitle */}
      <div className="bg-white px-5 py-3.5 rounded-xl border border-[#D3D1C7] flex items-center justify-between shadow-sm">
        <span className="text-xs font-semibold text-[#5F5E5A] font-sans">
          List prices — <span className="text-[#2C2C2A] font-bold">ETB without VAT</span>, all other taxes and duties inclusive.
        </span>
        <span className="text-[10px] bg-[#1D9E75]/10 text-[#1D9E75] font-mono font-bold px-2.5 py-1 rounded border border-[#1D9E75]/35 uppercase tracking-wide">
          Standardized Price Book
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
        
        {/* Left Area (3/4 width) - Main Lists and Filter */}
        <div className="lg:col-span-3 bg-white p-5 rounded-xl border border-[#D3D1C7] shadow-sm space-y-4">
          
          {/* Filters Bar */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Search */}
            <div className="relative w-56">
              <Search className="w-3.5 h-3.5 text-[#5F5E5A] absolute left-3 top-1/2 -translate-y-1/2" />
              <input 
                type="text" 
                placeholder="Search by code or description..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-9 pl-9 pr-3 rounded-lg border border-[#D3D1C7] bg-[#F1EFE8]/30 font-sans text-xs text-[#2C2C2A] focus:outline-none focus:border-[#1D9E75]"
              />
            </div>

            {/* Supplier Filter */}
            <select
              value={supplierFilter}
              onChange={(e) => setSupplierFilter(e.target.value)}
              className="h-9 px-2 rounded-lg border border-[#D3D1C7] text-xs font-sans text-[#2C2C2A] bg-white focus:outline-none"
            >
              <option value="">All Suppliers</option>
              {suppliers.map(sup => (
                <option key={sup.id} value={sup.id}>{sup.name}</option>
              ))}
            </select>

            {/* Category Filter */}
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="h-9 px-2 rounded-lg border border-[#D3D1C7] text-xs font-sans text-[#2C2C2A] bg-white focus:outline-none"
            >
              <option value="">All Categories</option>
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>

            <button
              id="add-price-item-btn"
              onClick={handleAddNewEntry}
              className="ml-auto flex items-center gap-1.5 px-3.5 py-2 bg-[#1D9E75] hover:bg-[#1D9E75]/90 text-white rounded-lg text-xs font-sans font-semibold cursor-pointer transition-colors"
            >
              <Plus className="w-3.5 h-3.5" /> + Add item
            </button>
          </div>

          {/* List prices Data Table */}
          <div className="overflow-x-auto border border-[#D3D1C7]/60 rounded-lg">
            <table className="w-full text-left border-collapse border border-gray-400" id="price-book-table">
              <thead>
                <tr className="bg-[#A9D08E] text-black font-serif text-xs font-bold border-b border-gray-500">
                  <th className="p-2.5 text-center border border-gray-400 w-[5%]">S/N</th>
                  <th className="p-2.5 text-center border border-gray-400 w-[10%]">Code</th>
                  <th className="p-2.5 text-left border border-gray-400 w-[30%]">Item</th>
                  <th className="p-2.5 text-left border border-gray-400 w-[15%]">Category</th>
                  <th className="p-2.5 text-left border border-gray-400 w-[15%]">Supplier</th>
                  <th className="p-2.5 text-center border border-gray-400 w-[8%]">Unit</th>
                  <th className="p-2.5 text-center border border-gray-400 w-[12%] leading-tight text-xs">
                    Unit Price
                  </th>
                  <th className="p-2.5 text-center border border-gray-400 w-[5%]">Action</th>
                </tr>
              </thead>
              <tbody className="text-xs font-sans text-[#2C2C2A] bg-white divide-y divide-gray-200">
                {filteredEntries.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-[#5F5E5A] italic">
                      No records yet — add the first one
                    </td>
                  </tr>
                ) : (
                  filteredEntries.map((entry, index) => {
                    const isEditing = editingId === entry.id;

                    return (
                      <tr key={entry.id} className="hover:bg-[#F1EFE8]/25 transition-colors">
                        <td className="p-2.5 text-center font-mono text-[#5F5E5A] border border-gray-300">{index + 1}</td>
                        <td className="p-2.5 border border-gray-300">
                          {isEditing ? (
                            <input 
                              type="text" 
                              value={editFields.code || ''} 
                              onChange={(e) => handleEditFieldChange('code', e.target.value)}
                              className="w-full h-8 px-1 border border-[#D3D1C7] rounded text-xs focus:outline-none bg-white"
                            />
                          ) : (
                            <span className="font-mono font-semibold text-[#1D9E75]">{entry.code}</span>
                          )}
                        </td>
                        <td className="p-2.5 min-w-[150px] border border-gray-300">
                          {isEditing ? (
                            <input 
                              type="text" 
                              value={editFields.itemDescription || ''} 
                              onChange={(e) => handleEditFieldChange('itemDescription', e.target.value)}
                              className="w-full h-8 px-1 border border-[#D3D1C7] rounded text-xs focus:outline-none bg-white"
                            />
                          ) : (
                            <span>{entry.itemDescription}</span>
                          )}
                        </td>
                        <td className="p-2.5 border border-gray-300">
                          {isEditing ? (
                            <select
                              value={editFields.itemCategoryId || ''}
                              onChange={(e) => handleEditFieldChange('itemCategoryId', e.target.value)}
                              className="w-full h-8 px-1 border border-[#D3D1C7] rounded text-xs bg-white focus:outline-none"
                            >
                              {categories.map(cat => (
                                <option key={cat.id} value={cat.id}>{cat.name}</option>
                              ))}
                            </select>
                          ) : (
                            <span className="text-[#5F5E5A] font-medium">{categories.find(c => c.id === entry.itemCategoryId)?.name || 'Unknown'}</span>
                          )}
                        </td>
                        <td className="p-2.5 border border-gray-300">
                          {isEditing ? (
                            <select
                              value={editFields.supplierId || ''}
                              onChange={(e) => handleEditFieldChange('supplierId', e.target.value)}
                              className="w-full h-8 px-1 border border-[#D3D1C7] rounded text-xs bg-white focus:outline-none"
                            >
                              {suppliers.map(sup => (
                                <option key={sup.id} value={sup.id}>{sup.name}</option>
                              ))}
                            </select>
                          ) : (
                            <span className="text-[#5F5E5A] font-medium">{suppliers.find(s => s.id === entry.supplierId)?.name || 'Unknown'}</span>
                          )}
                        </td>
                        <td className="p-2.5 text-center border border-gray-300">
                          {isEditing ? (
                            <input 
                              type="text" 
                              value={editFields.unit || ''} 
                              onChange={(e) => handleEditFieldChange('unit', e.target.value)}
                              className="w-16 h-8 text-center border border-[#D3D1C7] rounded text-xs focus:outline-none bg-white"
                            />
                          ) : (
                            <span>{entry.unit}</span>
                          )}
                        </td>
                        <td className="p-2.5 text-right font-mono font-medium text-[#2C2C2A] border border-gray-300 bg-[#F9F9F6]">
                          {isEditing ? (
                            <input 
                              type="number" 
                              value={editFields.unitPrice || 0} 
                              onChange={(e) => handleEditFieldChange('unitPrice', Number(e.target.value))}
                              className="w-full h-8 text-right border border-[#D3D1C7] rounded text-xs focus:outline-none bg-white"
                            />
                          ) : (
                            <span className="font-bold font-mono">{entry.unitPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                          )}
                        </td>
                        <td className="p-2.5 text-center border border-gray-300">
                          {isEditing ? (
                            <button
                              onClick={handleSaveEdit}
                              className="px-2.5 py-1 text-[10px] bg-[#1D9E75] text-white rounded font-medium hover:bg-[#1D9E75]/90 cursor-pointer"
                            >
                              Save
                            </button>
                          ) : (
                            <div className="flex items-center justify-center gap-1">
                              <button
                                onClick={() => handleStartEdit(entry)}
                                className="p-1 hover:bg-[#F1EFE8] rounded text-[#2C2C2A] transition-colors cursor-pointer"
                              >
                                <Edit2 className="w-3.5 h-3.5 text-[#5F5E5A]" />
                              </button>
                              {onRemovePriceEntry && (
                                <button
                                  onClick={() => onRemovePriceEntry(entry.id)}
                                  className="p-1 hover:bg-red-50 rounded text-red-600 transition-colors cursor-pointer"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Area (1/4 width) - Price threshold config panel */}
        <div className="bg-white p-5 rounded-xl border border-[#D3D1C7] shadow-sm space-y-4">
          <div className="flex items-center gap-1.5 border-b border-[#D3D1C7] pb-2">
            <AlertCircle className="w-4 h-4 text-[#1D9E75]" />
            <h3 className="text-xs font-bold text-[#2C2C2A] uppercase tracking-wider">
              Variance Rules config
            </h3>
          </div>

          <p className="text-[11px] text-[#5F5E5A]">
            Define upper cost limits and warning triggers per logistics partner. Exceeding quotes flag the validation flow automatically.
          </p>

          <div className="space-y-3 text-xs font-sans">
            {/* Supplier select */}
            <div className="flex flex-col gap-1">
              <label className="text-[11px] text-[#5F5E5A] font-medium uppercase tracking-tight">Supplier name</label>
              <select
                value={selectedConfigSupplierId}
                onChange={(e) => handleThresholdSupplierChange(e.target.value)}
                className="h-9 px-2 border border-[#D3D1C7] rounded-lg focus:outline-none focus:border-[#1D9E75] bg-white font-medium"
              >
                {suppliers.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>

            {/* Threshold Amount */}
            <div className="flex flex-col gap-1">
              <label className="text-[11px] text-[#5F5E5A] font-medium uppercase tracking-tight">Threshold amount (ETB ex-VAT)</label>
              <div className="relative">
                <input 
                  type="number" 
                  value={thresholdAmount}
                  onChange={(e) => setThresholdAmount(Number(e.target.value))}
                  className="w-full h-9 pl-3 pr-12 border border-[#D3D1C7] rounded-lg focus:outline-none focus:border-[#1D9E75] font-mono font-bold"
                />
                <span className="absolute right-3 top-2.5 text-[10px] text-[#5F5E5A] font-bold">ETB</span>
              </div>
            </div>

            {/* Alert threshold % */}
            <div className="flex flex-col gap-1">
              <label className="text-[11px] text-[#5F5E5A] font-medium uppercase tracking-tight">Alert variance threshold %</label>
              <div className="relative">
                <input 
                  type="number" 
                  value={alertThresholdPercent}
                  onChange={(e) => setAlertThresholdPercent(Number(e.target.value))}
                  className="w-full h-9 pl-3 pr-10 border border-[#D3D1C7] rounded-lg focus:outline-none focus:border-[#1D9E75] font-mono font-bold"
                />
                <span className="absolute right-3 top-2.5 text-xs text-[#5F5E5A] font-bold">%</span>
              </div>
              <span className="text-[10px] text-[#5F5E5A] mt-0.5 leading-normal">
                If submitted quote exceeds standard list price by this %, the system triggers a mandatory review.
              </span>
            </div>

            <button
              id="threshold-save-btn"
              onClick={handleSaveThreshold}
              className="w-full flex items-center justify-center gap-1 px-4 py-2.5 bg-[#1D9E75] hover:bg-[#1D9E75]/95 text-white rounded-lg text-xs font-sans font-semibold cursor-pointer transition-colors shadow-sm pt-2"
            >
              <Check className="w-3.5 h-3.5" /> Save threshold rules
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}

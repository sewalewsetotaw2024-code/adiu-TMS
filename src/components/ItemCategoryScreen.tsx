import React, { useState } from 'react';
import { ItemCategory } from '../types';
import { Plus, Check, Edit2, Search, Trash2 } from 'lucide-react';

interface ItemCategoryScreenProps {
  categories: ItemCategory[];
  onSaveCategory: (category: ItemCategory) => void;
  onRemoveCategory?: (id: string) => void;
}

export default function ItemCategoryScreen({ categories, onSaveCategory, onRemoveCategory }: ItemCategoryScreenProps) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Category form states
  const [catName, setCatName] = useState('');
  const [catCode, setCatCode] = useState('');
  const [catDesc, setCatDesc] = useState('');
  const [parentCat, setParentCat] = useState('');
  const [catStatus, setCatStatus] = useState<'Active' | 'Inactive'>('Active');

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!catName || !catCode) {
      alert('Category Name and Code are required.');
      return;
    }

    const newCat: ItemCategory = {
      id: `cat-${Date.now()}`,
      name: catName,
      code: catCode,
      description: catDesc,
      parentCategory: parentCat || undefined,
      status: catStatus
    };

    onSaveCategory(newCat);
    
    // reset form
    setCatName('');
    setCatCode('');
    setCatDesc('');
    setParentCat('');
    setCatStatus('Active');
    setShowAddForm(false);
    alert(`Category ${newCat.name} added successfully!`);
  };

  const handleToggleStatus = (cat: ItemCategory) => {
    const updated = {
      ...cat,
      status: cat.status === 'Active' ? ('Inactive' as const) : ('Active' as const)
    };
    onSaveCategory(updated);
  };

  const filtered = categories.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 select-none" id="item-categories-container">
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Categories List (2/3 width) */}
        <div className="lg:col-span-2 bg-white p-6 rounded-xl border border-[#D3D1C7] shadow-sm space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#D3D1C7]/60 pb-3">
            <div className="flex flex-col">
              <h3 className="text-xs font-bold text-[#2C2C2A] uppercase tracking-wider">Item Categories Flat List</h3>
              <p className="text-xs text-[#5F5E5A]">Referenced by material transport request line items and list prices</p>
            </div>
            
            <div className="flex items-center gap-2">
              <div className="relative w-48">
                <Search className="w-3.5 h-3.5 text-[#5F5E5A] absolute left-3 top-1/2 -translate-y-1/2" />
                <input 
                  type="text" 
                  placeholder="Search categories..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full h-8 pl-9 pr-3 rounded-lg border border-[#D3D1C7] bg-[#F1EFE8]/30 font-sans text-xs text-[#2C2C2A] focus:outline-none focus:border-[#1D9E75]"
                />
              </div>

              {!showAddForm && (
                <button
                  id="toggle-add-cat-btn"
                  onClick={() => setShowAddForm(true)}
                  className="flex items-center gap-1 px-3.5 py-1.5 bg-[#1D9E75] hover:bg-[#1D9E75]/90 text-white rounded-lg text-xs font-sans font-semibold cursor-pointer transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" /> Add
                </button>
              )}
            </div>
          </div>

          <div className="overflow-x-auto border border-[#D3D1C7]/60 rounded-lg">
            <table className="w-full text-left border-collapse" id="categories-table">
              <thead>
                <tr className="bg-[#F1EFE8]/45 border-b border-[#D3D1C7]/80 text-[10px] font-sans font-semibold text-[#5F5E5A] uppercase tracking-wider">
                  <th className="p-3">Category Code</th>
                  <th className="p-3">Category Name</th>
                  <th className="p-3">Description</th>
                  <th className="p-3">Parent Category</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#D3D1C7]/40 text-xs font-sans text-[#2C2C2A]">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-[#5F5E5A] italic">
                      No records found matching search.
                    </td>
                  </tr>
                ) : (
                  filtered.map((cat) => (
                    <tr key={cat.id} className="hover:bg-[#F1EFE8]/25 transition-colors">
                      <td className="p-3 font-mono font-bold text-[#1D9E75]">{cat.code}</td>
                      <td className="p-3 font-semibold">{cat.name}</td>
                      <td className="p-3 text-[#5F5E5A] max-w-[200px] truncate" title={cat.description}>{cat.description}</td>
                      <td className="p-3 text-[#5F5E5A] italic">{cat.parentCategory || '---'}</td>
                      <td className="p-3">
                        <button 
                          onClick={() => handleToggleStatus(cat)}
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold border transition-all cursor-pointer ${
                            cat.status === 'Active' 
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100' 
                              : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          {cat.status}
                        </button>
                      </td>
                      <td className="p-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => handleToggleStatus(cat)}
                            className="text-[10px] border border-[#D3D1C7] hover:bg-[#F1EFE8] px-2 py-0.5 rounded text-[#2C2C2A] cursor-pointer"
                          >
                            Toggle Status
                          </button>
                          {onRemoveCategory && (
                            <button
                              onClick={() => onRemoveCategory(cat.id)}
                              className="p-1 hover:bg-red-50 text-red-600 rounded transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Add Form (1/3 width) - conditionally shown or defaults as sidebar add widget */}
        <div className="bg-white p-5 rounded-xl border border-[#D3D1C7] shadow-sm space-y-4">
          <div className="border-b border-[#D3D1C7] pb-2">
            <h3 className="text-xs font-bold text-[#2C2C2A] uppercase tracking-wider">
              {showAddForm ? 'Create Category' : 'Materials Classification Guidance'}
            </h3>
          </div>

          {showAddForm ? (
            <form onSubmit={handleSave} className="space-y-4 text-xs font-sans">
              <div className="flex flex-col gap-1">
                <label className="text-[11px] text-[#5F5E5A] font-semibold uppercase tracking-tight">Category name</label>
                <input 
                  type="text" 
                  value={catName} 
                  onChange={(e) => setCatName(e.target.value)}
                  className="h-9 px-3 border border-[#D3D1C7] rounded-lg focus:outline-none focus:border-[#1D9E75]"
                  placeholder="e.g. Microwave Equipment"
                  required
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[11px] text-[#5F5E5A] font-semibold uppercase tracking-tight">Category code (all caps, unique)</label>
                <input 
                  type="text" 
                  value={catCode} 
                  onChange={(e) => setCatCode(e.target.value.toUpperCase())}
                  className="h-9 px-3 border border-[#D3D1C7] rounded-lg focus:outline-none font-mono"
                  placeholder="e.g. MW-EQP"
                  required
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[11px] text-[#5F5E5A] font-semibold uppercase tracking-tight">Parent category (optional)</label>
                <select 
                  value={parentCat} 
                  onChange={(e) => setParentCat(e.target.value)}
                  className="h-9 px-2 border border-[#D3D1C7] rounded-lg focus:outline-none bg-white"
                >
                  <option value="">None (Top-Level Category)</option>
                  {categories.map(c => (
                    <option key={c.id} value={c.code}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[11px] text-[#5F5E5A] font-semibold uppercase tracking-tight">Status</label>
                <select 
                  value={catStatus} 
                  onChange={(e) => setCatStatus(e.target.value as any)}
                  className="h-9 px-2 border border-[#D3D1C7] rounded-lg focus:outline-none bg-white"
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[11px] text-[#5F5E5A] font-semibold uppercase tracking-tight">Description</label>
                <textarea 
                  rows={3} 
                  value={catDesc} 
                  onChange={(e) => setCatDesc(e.target.value)}
                  className="p-3 border border-[#D3D1C7] rounded-lg focus:outline-none font-sans"
                  placeholder="Summarize the types of materials grouped under this tag..."
                />
              </div>

              <div className="flex gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="flex-1 py-2 border border-[#D3D1C7] rounded-lg text-center font-bold text-[#5F5E5A] hover:bg-[#F1EFE8] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 bg-[#1D9E75] hover:bg-[#1D9E75]/95 text-white rounded-lg text-center font-bold cursor-pointer"
                >
                  Save category
                </button>
              </div>
            </form>
          ) : (
            <div className="text-xs text-[#5F5E5A] space-y-3 leading-relaxed">
              <p>
                Adiu TMS utilizes flat categories classification to filter and map material list prices in standard contracts.
              </p>
              <div className="bg-[#F1EFE8]/40 p-3 rounded-lg border border-[#D3D1C7]/60 space-y-2">
                <span className="font-bold text-[#2C2C2A] block text-[11px] uppercase tracking-tight">Core Rules:</span>
                <ul className="list-disc pl-4 space-y-1">
                  <li>Only **Active** categories are select-able on MR line items.</li>
                  <li>Inactivating a category keeps existing MR histories untouched, but blocks future Price Book entries.</li>
                  <li>Ensure Code formatting is uppercase (e.g., RF-ANT).</li>
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>

    </div>
  );
}

import React, { useState } from 'react';
import { Project, Contact } from '../types';
import { Search, Plus, Briefcase, Activity, Eye, Edit2, Trash2 } from 'lucide-react';

interface ProjectsScreenProps {
  projects: Project[];
  vendors: Contact[];
  onSaveProject: (project: Project) => void;
  onRemoveProject?: (projectId: string) => void;
}

export default function ProjectsScreen({ projects, vendors, onSaveProject, onRemoveProject }: ProjectsScreenProps) {
  const [viewMode, setViewMode] = useState<'list' | 'detail'>('list');
  const [searchTerm, setSearchTerm] = useState('');
  const [activeProject, setActiveProject] = useState<Project | null>(null);

  const activeCount = projects.filter(p => p.status === 'Active').length;
  const completedCount = projects.filter(p => p.status === 'Completed').length;

  const handleCreateNew = () => {
    setActiveProject({
      id: `PRJ-${Date.now()}`,
      name: '',
      code: '',
      projectManager: '',
      customerClient: '',
      regionCluster: 'CNR',
      status: 'Draft',
      assignedSites: [],
      budgetEtb: 0
    });
    setViewMode('detail');
  };

  const handleEdit = (project: Project) => {
    setActiveProject({ ...project });
    setViewMode('detail');
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (activeProject) {
      onSaveProject(activeProject);
      setViewMode('list');
      setActiveProject(null);
    }
  };

  const filteredProjects = projects.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (viewMode === 'list') {
    return (
      <div className="space-y-6 select-none pb-20">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white p-5 rounded-xl border border-[#D3D1C7] shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-[#5F5E5A] uppercase tracking-wider mb-1">Total Projects</p>
              <div className="text-2xl font-bold text-[#2C2C2A]">{projects.length}</div>
            </div>
            <div className="w-10 h-10 rounded-full bg-[#1D9E75]/10 flex items-center justify-center text-[#1D9E75]">
              <Briefcase className="w-5 h-5" />
            </div>
          </div>
          <div className="bg-white p-5 rounded-xl border border-[#D3D1C7] shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-[#5F5E5A] uppercase tracking-wider mb-1">Active</p>
              <div className="text-2xl font-bold text-[#2C2C2A]">{activeCount}</div>
            </div>
            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
              <Activity className="w-5 h-5" />
            </div>
          </div>
          <div className="bg-white p-5 rounded-xl border border-[#D3D1C7] shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-[#5F5E5A] uppercase tracking-wider mb-1">Completed</p>
              <div className="text-2xl font-bold text-[#2C2C2A]">{completedCount}</div>
            </div>
            <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
              <Activity className="w-5 h-5" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-[#D3D1C7] shadow-sm overflow-hidden flex flex-col">
          <div className="p-4 border-b border-[#D3D1C7] flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#F1EFE8]/30">
            <div className="relative max-w-md w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#5F5E5A]" />
              <input 
                type="text" 
                placeholder="Search projects..." 
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border border-[#D3D1C7] rounded-lg text-sm focus:outline-none focus:border-[#1D9E75] focus:ring-1 focus:ring-[#1D9E75]"
              />
            </div>
            <button 
              onClick={handleCreateNew}
              className="flex items-center gap-2 px-4 py-2 bg-[#1D9E75] text-white rounded-lg text-sm font-semibold hover:bg-[#168561] transition-colors"
            >
              <Plus className="w-4 h-4" /> New Project
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#F1EFE8]/50 border-b border-[#D3D1C7] text-xs font-semibold text-[#5F5E5A] uppercase tracking-wider">
                  <th className="px-5 py-3">Code</th>
                  <th className="px-5 py-3">Name</th>
                  <th className="px-5 py-3">Customer / Client</th>
                  <th className="px-5 py-3">Region / Geofencezone</th>
                  <th className="px-5 py-3">Manager</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#D3D1C7] text-sm text-[#2C2C2A]">
                {filteredProjects.map(project => (
                  <tr key={project.id} className="hover:bg-[#F1EFE8]/20 transition-colors">
                    <td className="px-5 py-4 font-mono font-semibold">{project.code}</td>
                    <td className="px-5 py-4 font-semibold">{project.name}</td>
                    <td className="px-5 py-4">{project.customerClient}</td>
                    <td className="px-5 py-4">{project.regionCluster}</td>
                    <td className="px-5 py-4">{project.projectManager}</td>
                    <td className="px-5 py-4">
                      <span className={`px-2 py-1 rounded-full text-[10px] font-semibold ${
                        project.status === 'Active' ? 'bg-blue-100 text-blue-800' :
                        project.status === 'Completed' ? 'bg-emerald-100 text-emerald-800' :
                        project.status === 'On Hold' ? 'bg-amber-100 text-amber-800' :
                        project.status === 'Cancelled' ? 'bg-red-100 text-red-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {project.status}
                      </span>
                    </td>
                    <td className="p-3 text-right">
                        <div className="flex items-center justify-end gap-3">
                          <button onClick={(e) => { e.stopPropagation(); handleEdit(project); }} className="text-[#1D9E75] hover:text-[#168561] font-semibold text-xs flex items-center gap-1 transition-colors"><Eye className="w-3.5 h-3.5"/> View</button>
                          <button onClick={(e) => { e.stopPropagation(); handleEdit(project); }} className="text-amber-600 hover:text-amber-700 font-semibold text-xs flex items-center gap-1 transition-colors"><Edit2 className="w-3.5 h-3.5"/> Edit</button>
                          <button onClick={(e) => { e.stopPropagation(); if (onRemoveProject) onRemoveProject(project.id); }} className="text-red-500 hover:text-red-700 font-semibold text-xs flex items-center gap-1 transition-colors"><Trash2 className="w-3.5 h-3.5"/> Delete</button>
                        </div>
                      </td>
                  </tr>
                ))}
                {filteredProjects.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-5 py-8 text-center text-[#5F5E5A]">
                      No projects found matching your search.
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
    <div className="space-y-6 select-none pb-20">
      <div className="bg-white rounded-xl border border-[#D3D1C7] shadow-sm overflow-hidden">
        <div className="p-5 border-b border-[#D3D1C7] flex items-center justify-between bg-[#F1EFE8]/30">
          <h2 className="text-lg font-bold text-[#2C2C2A]">
            {activeProject?.id.startsWith('PRJ') && activeProject.code === '' ? 'Create New Project' : 'Edit Project'}
          </h2>
          <button 
            type="button"
            onClick={() => setViewMode('list')}
            className="px-4 py-2 border border-[#D3D1C7] text-[#2C2C2A] rounded-lg text-sm font-semibold hover:bg-[#F1EFE8] transition-colors"
          >
            Cancel
          </button>
        </div>

        {activeProject && (
          <form onSubmit={handleSave} className="p-5 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-semibold text-[#5F5E5A] uppercase tracking-wider">Project Code</label>
                <input 
                  type="text" 
                  required
                  value={activeProject.code}
                  onChange={e => setActiveProject({...activeProject, code: e.target.value})}
                  className="w-full h-10 px-3 border border-[#D3D1C7] rounded-lg text-sm focus:outline-none focus:border-[#1D9E75]"
                  placeholder="e.g., ET-PHASE-1"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold text-[#5F5E5A] uppercase tracking-wider">Project Name</label>
                <input 
                  type="text" 
                  required
                  value={activeProject.name}
                  onChange={e => setActiveProject({...activeProject, name: e.target.value})}
                  className="w-full h-10 px-3 border border-[#D3D1C7] rounded-lg text-sm focus:outline-none focus:border-[#1D9E75]"
                  placeholder="e.g., Safaricom Phase 1 Rollout"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold text-[#5F5E5A] uppercase tracking-wider">Customer / Client</label>
                <select
                  required
                  value={activeProject.customerClient}
                  onChange={e => setActiveProject({...activeProject, customerClient: e.target.value})}
                  className="w-full h-10 px-3 border border-[#D3D1C7] rounded-lg text-sm focus:outline-none focus:border-[#1D9E75] bg-white"
                >
                  <option value="" disabled>Select a customer...</option>
                  {vendors.map(v => (
                    <option key={v.id} value={v.name}>{v.name}</option>
                  ))}
                  <option value="in-house">In-house</option>
                  <option value="Ericsson">Ericsson</option>
                  <option value="ZTE">ZTE</option>
                  <option value="Huawei">Huawei</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold text-[#5F5E5A] uppercase tracking-wider">Region / Geofencezone</label>
                <select
                  required
                  value={activeProject.regionCluster}
                  onChange={e => setActiveProject({...activeProject, regionCluster: e.target.value})}
                  className="w-full h-10 px-3 border border-[#D3D1C7] rounded-lg text-sm focus:outline-none focus:border-[#1D9E75] bg-white"
                >
                  <option value="" disabled>Select region...</option>
                  {['CWR', 'CNR', 'SER', 'SR', 'NER', 'SWR', 'NR', 'NWR', 'ER', 'WR', 'SSWR', 'Somali'].map(r => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold text-[#5F5E5A] uppercase tracking-wider">Project Manager</label>
                <input 
                  type="text" 
                  required
                  value={activeProject.projectManager}
                  onChange={e => setActiveProject({...activeProject, projectManager: e.target.value})}
                  className="w-full h-10 px-3 border border-[#D3D1C7] rounded-lg text-sm focus:outline-none focus:border-[#1D9E75]"
                  placeholder="Manager Name"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold text-[#5F5E5A] uppercase tracking-wider">Status</label>
                <select
                  value={activeProject.status}
                  onChange={e => setActiveProject({...activeProject, status: e.target.value as any})}
                  className="w-full h-10 px-3 border border-[#D3D1C7] rounded-lg text-sm focus:outline-none focus:border-[#1D9E75] bg-white"
                >
                  <option value="Draft">Draft</option>
                  <option value="Active">Active</option>
                  <option value="On Hold">On Hold</option>
                  <option value="Completed">Completed</option>
                  <option value="Closed">Closed</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
              </div>
            </div>

            <div className="pt-4 flex justify-end">
              <button 
                type="submit"
                className="px-6 py-2 bg-[#1D9E75] text-white rounded-lg text-sm font-semibold hover:bg-[#168561] transition-colors shadow-sm"
              >
                Save Project
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

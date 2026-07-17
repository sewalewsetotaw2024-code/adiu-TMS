import React, { useState } from 'react';
import { ProjectSite, StoreCluster, Project } from '../types';
import { ETHIOPIAN_REGIONS, TIM_STAFF } from '../data';
import { Search, MapPin, Layers, Plus, Trash2, Edit2, Check, ArrowLeft, Briefcase, Users } from 'lucide-react';

interface SitesScreenProps {
  sites: ProjectSite[];
  clusters: StoreCluster[];
  projects: Project[];
  onSaveSite: (site: ProjectSite) => void;
  onSaveCluster: (cluster: StoreCluster) => void;
  onRemoveCluster?: (id: string) => void;
  onSaveProject: (project: Project) => void;
  onRemoveProject?: (id: string) => void;
}

export default function SitesScreen({
  sites,
  clusters,
  projects,
  onSaveSite,
  onSaveCluster,
  onRemoveCluster,
  onSaveProject,
  onRemoveProject
}: SitesScreenProps) {
  
  const [activeTab, setActiveTab] = useState<'sites' | 'clusters' | 'projects'>('sites');
  
  // Sites View States
  const [sitesViewMode, setSitesViewMode] = useState<'list' | 'form'>('list');
  const [activeSite, setActiveSite] = useState<ProjectSite | null>(null);
  const [siteSearchQuery, setSiteSearchQuery] = useState('');

  // Clusters View States
  const [clustersViewMode, setClustersViewMode] = useState<'list' | 'form'>('list');
  const [activeCluster, setActiveCluster] = useState<StoreCluster | null>(null);

  // Projects View States
  const [projectsViewMode, setProjectsViewMode] = useState<'list' | 'form'>('list');
  const [activeProject, setActiveProject] = useState<Project | null>(null);
  const [projectSearchQuery, setProjectSearchQuery] = useState('');

  // --- Sites Logic ---
  const handleInitNewSite = () => {
    const nextNum = sites.length + 1024;
    const newSite: ProjectSite = {
      siteId: `ET-GEN-${nextNum}`,
      siteName: '',
      latitude: 9.0,
      longitude: 38.0,
      town: 'Addis Ababa',
      projectScope: 'Antenna overhaul',
      zoneManager: 'Mulugeta Alene',
      implementationPriority: 'Medium',
      distance: 0,
      geofenceZone: 'CNR',
      receiverName: '',
      receiverPhone: '',
      status: 'Active'
    };
    setActiveSite(newSite);
    setSitesViewMode('form');
  };

  const handleEditSite = (site: ProjectSite) => {
    setActiveSite({ ...site });
    setSitesViewMode('form');
  };

  const handleSaveSite = () => {
    if (!activeSite) return;
    if (!activeSite.siteId || !activeSite.siteName) {
      alert('Site ID and Site Name are mandatory.');
      return;
    }
    onSaveSite(activeSite);
    setSitesViewMode('list');
    setActiveSite(null);
    alert(`Project Site ${activeSite.siteId} registered in global geofence.`);
  };

  const filteredSites = sites.filter(s => 
    s.siteId.toLowerCase().includes(siteSearchQuery.toLowerCase()) ||
    s.siteName.toLowerCase().includes(siteSearchQuery.toLowerCase()) ||
    s.town.toLowerCase().includes(siteSearchQuery.toLowerCase())
  );

  // --- Clusters Logic ---
  const handleInitNewCluster = () => {
    const nextNum = clusters.length + 1;
    const newCluster: StoreCluster = {
      id: `cl-add-${Date.now()}`,
      name: '',
      code: `CL-ZONE-0${nextNum}`,
      assignedSites: [],
      zone: 'CNR',
      estimatedTotalDistance: 0,
      assignedSdt: TIM_STAFF[0],
      notes: ''
    };
    setActiveCluster(newCluster);
    setClustersViewMode('form');
  };

  const handleEditCluster = (cl: StoreCluster) => {
    setActiveCluster({ ...cl });
    setClustersViewMode('form');
  };

  const handleClusterFieldChange = (field: keyof StoreCluster, value: any) => {
    if (!activeCluster) return;
    const updated = { ...activeCluster, [field]: value };

    // Auto-calculate total distance of assigned sites
    if (field === 'assignedSites') {
      const selectedSiteIds = value as string[];
      const totalDist = sites
        .filter(s => selectedSiteIds.includes(s.siteId))
        .reduce((sum, s) => sum + s.distance, 0);
      updated.estimatedTotalDistance = totalDist;
    }

    setActiveCluster(updated);
  };

  const handleToggleClusterSite = (siteId: string) => {
    if (!activeCluster) return;
    const currentList = activeCluster.assignedSites || [];
    const updatedList = currentList.includes(siteId) 
      ? currentList.filter(id => id !== siteId) 
      : [...currentList, siteId];

    handleClusterFieldChange('assignedSites', updatedList);
  };

  const handleSaveCluster = () => {
    if (!activeCluster) return;
    if (!activeCluster.name || !activeCluster.code) {
      alert('Cluster Name and Code are mandatory.');
      return;
    }
    onSaveCluster(activeCluster);
    setClustersViewMode('list');
    setActiveCluster(null);
    alert(`Store Cluster ${activeCluster.name} successfully deployed.`);
  };

  // --- Projects Logic ---
  const handleInitNewProject = () => {
    const nextNum = projects.length + 1;
    const newProject: Project = {
      id: `prj-${Date.now()}`,
      name: '',
      code: `PRJ-NEW-0${nextNum}`,
      projectManager: 'Solomon Tekle',
      client: 'Ethio Telecom',
      status: 'Active',
      assignedSites: [],
      budgetEtb: 1000000
    };
    setActiveProject(newProject);
    setProjectsViewMode('form');
  };

  const handleEditProject = (prj: Project) => {
    setActiveProject({ ...prj });
    setProjectsViewMode('form');
  };

  const handleProjectFieldChange = (field: keyof Project, value: any) => {
    if (!activeProject) return;
    setActiveProject({ ...activeProject, [field]: value });
  };

  const handleToggleProjectSite = (siteId: string) => {
    if (!activeProject) return;
    const currentList = activeProject.assignedSites || [];
    const updatedList = currentList.includes(siteId)
      ? currentList.filter(id => id !== siteId)
      : [...currentList, siteId];
    
    handleProjectFieldChange('assignedSites', updatedList);
  };

  const handleSaveProject = () => {
    if (!activeProject) return;
    if (!activeProject.name || !activeProject.code) {
      alert('Project Name and Code are mandatory.');
      return;
    }
    onSaveProject(activeProject);
    setProjectsViewMode('list');
    setActiveProject(null);
    alert(`Project ${activeProject.name} successfully saved.`);
  };

  return (
    <div className="space-y-6 select-none pb-12" id="sites-screen-container">
      
      {/* Top Tabs */}
      <div className="flex border-b border-[#D3D1C7] gap-2">
        <button
          onClick={() => { setActiveTab('sites'); }}
          className={`px-5 py-2.5 text-xs font-sans font-semibold transition-all flex items-center gap-2 border-b-2 -mb-[2px] ${
            activeTab === 'sites' 
              ? 'border-[#1D9E75] text-[#1D9E75]' 
              : 'border-transparent text-[#5F5E5A] hover:text-[#2C2C2A]'
          }`}
        >
          <MapPin className="w-4 h-4" /> 7a/7b — Project site list & geofences
        </button>
        
        <button
          onClick={() => { setActiveTab('clusters'); }}
          className={`px-5 py-2.5 text-xs font-sans font-semibold transition-all flex items-center gap-2 border-b-2 -mb-[2px] ${
            activeTab === 'clusters' 
              ? 'border-[#1D9E75] text-[#1D9E75]' 
              : 'border-transparent text-[#5F5E5A] hover:text-[#2C2C2A]'
          }`}
        >
          <Layers className="w-4 h-4" /> 7c — Store cluster routing management
        </button>

        <button
          onClick={() => { setActiveTab('projects'); }}
          className={`px-5 py-2.5 text-xs font-sans font-semibold transition-all flex items-center gap-2 border-b-2 -mb-[2px] ${
            activeTab === 'projects' 
              ? 'border-[#1D9E75] text-[#1D9E75]' 
              : 'border-transparent text-[#5F5E5A] hover:text-[#2C2C2A]'
          }`}
        >
          <Briefcase className="w-4 h-4" /> 7d — Projects & Site Assignments
        </button>
      </div>

      {activeTab === 'sites' ? (
        sitesViewMode === 'list' ? (
          /* Sites List */
          <div className="bg-white p-6 rounded-xl border border-[#D3D1C7] shadow-sm space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="relative w-64">
                <Search className="w-3.5 h-3.5 text-[#5F5E5A] absolute left-3 top-1/2 -translate-y-1/2" />
                <input 
                  type="text" 
                  placeholder="Search site, town, or geofence..." 
                  value={siteSearchQuery}
                  onChange={(e) => setSiteSearchQuery(e.target.value)}
                  className="w-full h-9 pl-9 pr-3 rounded-lg border border-[#D3D1C7] bg-[#F1EFE8]/30 font-sans text-xs text-[#2C2C2A] focus:outline-none focus:border-[#1D9E75]"
                />
              </div>

              <button
                id="add-site-btn"
                onClick={handleInitNewSite}
                className="flex items-center gap-1.5 px-4 py-2 bg-[#1D9E75] hover:bg-[#1D9E75]/90 text-white rounded-lg text-xs font-sans font-semibold cursor-pointer transition-colors"
              >
                <Plus className="w-4 h-4" /> + Register Site
              </button>
            </div>

            <div className="overflow-x-auto border border-[#D3D1C7]/60 rounded-lg">
              <table className="w-full text-left border-collapse" id="project-sites-table">
                <thead>
                  <tr className="bg-[#F1EFE8]/45 border-b border-[#D3D1C7]/80 text-[10px] font-sans font-semibold text-[#5F5E5A] uppercase tracking-wider">
                    <th className="p-3">Site ID</th>
                    <th className="p-3">Site Name</th>
                    <th className="p-3 text-right">Latitude</th>
                    <th className="p-3 text-right">Longitude</th>
                    <th className="p-3">Town</th>
                    <th className="p-3">Geofence Zone</th>
                    <th className="p-3">Receiver Name</th>
                    <th className="p-3">Priority</th>
                    <th className="p-3 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#D3D1C7]/40 text-xs font-sans text-[#2C2C2A]">
                  {filteredSites.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="p-8 text-center text-[#5F5E5A] italic">
                        No records yet — add the first one
                      </td>
                    </tr>
                  ) : (
                    filteredSites.map((site) => (
                      <tr key={site.siteId} className="hover:bg-[#F1EFE8]/25 transition-colors">
                        <td className="p-3 font-mono font-bold text-[#1D9E75]">{site.siteId}</td>
                        <td className="p-3 font-medium">{site.siteName}</td>
                        <td className="p-3 text-right font-mono text-[11px] text-slate-600">{site.latitude}</td>
                        <td className="p-3 text-right font-mono text-[11px] text-slate-600">{site.longitude}</td>
                        <td className="p-3">{site.town}</td>
                        <td className="p-3">
                          <span className="bg-[#F1EFE8] px-2 py-0.5 rounded border border-[#D3D1C7]/45 font-mono text-[10px] font-bold text-[#2C2C2A]">
                            {site.geofenceZone}
                          </span>
                        </td>
                        <td className="p-3 text-slate-600">{site.receiverName || '---'}</td>
                        <td className="p-3">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${
                            site.implementationPriority === 'High' 
                              ? 'bg-red-50 text-red-700 border-red-100' 
                              : site.implementationPriority === 'Medium'
                              ? 'bg-amber-50 text-amber-700 border-amber-100'
                              : 'bg-slate-50 text-slate-600 border-slate-100'
                          }`}>
                            {site.implementationPriority}
                          </span>
                        </td>
                        <td className="p-3 text-center">
                          <button
                            onClick={() => handleEditSite(site)}
                            className="p-1 hover:bg-[#F1EFE8] rounded text-[#2C2C2A] transition-colors"
                          >
                            <Edit2 className="w-3.5 h-3.5 text-[#5F5E5A]" />
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
          /* Site Form */
          <div className="bg-white p-6 rounded-xl border border-[#D3D1C7] shadow-sm space-y-4" id="site-form-container">
            <div className="flex items-center justify-between border-b border-[#D3D1C7] pb-3">
              <button 
                onClick={() => { setSitesViewMode('list'); setActiveSite(null); }}
                className="flex items-center gap-1.5 text-xs text-[#5F5E5A] hover:text-[#2C2C2A] font-sans font-medium transition-colors"
              >
                <ArrowLeft className="w-4 h-4" /> Back to site registry
              </button>
              <span className="text-xs font-bold text-[#1D9E75]">
                {activeSite?.siteName ? `Editing geofence: ${activeSite.siteId}` : 'Registering New Telecommunication Site'}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 text-xs font-sans">
              {/* Fields */}
              <div className="flex flex-col gap-1">
                <label className="text-[11px] text-[#5F5E5A] font-medium uppercase tracking-tight">Site ID (e.g. ET-ADD-1024)</label>
                <input 
                  type="text" 
                  value={activeSite?.siteId || ''} 
                  onChange={(e) => setActiveSite({ ...activeSite!, siteId: e.target.value })}
                  className="h-9 px-3 border border-[#D3D1C7] rounded-lg focus:outline-none focus:border-[#1D9E75] font-mono font-semibold"
                  placeholder="ET-ADD-1024"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[11px] text-[#5F5E5A] font-medium uppercase tracking-tight">Site name</label>
                <input 
                  type="text" 
                  value={activeSite?.siteName || ''} 
                  onChange={(e) => setActiveSite({ ...activeSite!, siteName: e.target.value })}
                  className="h-9 px-3 border border-[#D3D1C7] rounded-lg focus:outline-none focus:border-[#1D9E75]"
                  placeholder="e.g. Bole Medhanialem High"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[11px] text-[#5F5E5A] font-medium uppercase tracking-tight">Town / City</label>
                <input 
                  type="text" 
                  value={activeSite?.town || ''} 
                  onChange={(e) => setActiveSite({ ...activeSite!, town: e.target.value })}
                  className="h-9 px-3 border border-[#D3D1C7] rounded-lg focus:outline-none focus:border-[#1D9E75]"
                  placeholder="Addis Ababa"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-[11px] text-[#5F5E5A] font-medium uppercase tracking-tight">Latitude</label>
                  <input 
                    type="number" step="0.0001"
                    value={activeSite?.latitude || 0} 
                    onChange={(e) => setActiveSite({ ...activeSite!, latitude: Number(e.target.value) })}
                    className="h-9 px-2 border border-[#D3D1C7] rounded-lg focus:outline-none text-right font-mono"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[11px] text-[#5F5E5A] font-medium uppercase tracking-tight">Longitude</label>
                  <input 
                    type="number" step="0.0001"
                    value={activeSite?.longitude || 0} 
                    onChange={(e) => setActiveSite({ ...activeSite!, longitude: Number(e.target.value) })}
                    className="h-9 px-2 border border-[#D3D1C7] rounded-lg focus:outline-none text-right font-mono"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[11px] text-[#5F5E5A] font-medium uppercase tracking-tight">Project scope summary</label>
                <input 
                  type="text" 
                  value={activeSite?.projectScope || ''} 
                  onChange={(e) => setActiveSite({ ...activeSite!, projectScope: e.target.value })}
                  className="h-9 px-3 border border-[#D3D1C7] rounded-lg focus:outline-none"
                  placeholder="e.g. LTE Swap & Upgrade"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[11px] text-[#5F5E5A] font-medium uppercase tracking-tight">Zone Manager</label>
                <input 
                  type="text" 
                  value={activeSite?.zoneManager || ''} 
                  onChange={(e) => setActiveSite({ ...activeSite!, zoneManager: e.target.value })}
                  className="h-9 px-3 border border-[#D3D1C7] rounded-lg focus:outline-none"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[11px] text-[#5F5E5A] font-medium uppercase tracking-tight">Implementation Priority</label>
                <select 
                  value={activeSite?.implementationPriority || 'Medium'} 
                  onChange={(e) => setActiveSite({ ...activeSite!, implementationPriority: e.target.value as any })}
                  className="h-9 px-2 border border-[#D3D1C7] rounded-lg focus:outline-none bg-white font-medium"
                >
                  <option value="High">High</option>
                  <option value="Medium">Medium</option>
                  <option value="Low">Low</option>
                </select>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[11px] text-[#5F5E5A] font-medium uppercase tracking-tight">Standard distance (km)</label>
                <input 
                  type="number" 
                  value={activeSite?.distance || 0} 
                  onChange={(e) => setActiveSite({ ...activeSite!, distance: Number(e.target.value) })}
                  className="h-9 px-3 border border-[#D3D1C7] rounded-lg focus:outline-none text-right font-mono font-bold"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[11px] text-[#5F5E5A] font-medium uppercase tracking-tight">Geofence zone (Ethiopian Region)</label>
                <select 
                  value={activeSite?.geofenceZone || ''} 
                  onChange={(e) => setActiveSite({ ...activeSite!, geofenceZone: e.target.value })}
                  className="h-9 px-2 border border-[#D3D1C7] rounded-lg focus:outline-none bg-white font-semibold text-[#1D9E75]"
                >
                  {ETHIOPIAN_REGIONS.map(r => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[11px] text-[#5F5E5A] font-medium uppercase tracking-tight">Site Receiver contact name</label>
                <input 
                  type="text" 
                  value={activeSite?.receiverName || ''} 
                  onChange={(e) => setActiveSite({ ...activeSite!, receiverName: e.target.value })}
                  className="h-9 px-3 border border-[#D3D1C7] rounded-lg focus:outline-none"
                  placeholder="Supervisor name"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[11px] text-[#5F5E5A] font-medium uppercase tracking-tight">Site Receiver phone</label>
                <input 
                  type="text" 
                  value={activeSite?.receiverPhone || ''} 
                  onChange={(e) => setActiveSite({ ...activeSite!, receiverPhone: e.target.value })}
                  className="h-9 px-3 border border-[#D3D1C7] rounded-lg focus:outline-none"
                  placeholder="+251-9..."
                />
              </div>
            </div>

            <div className="pt-4 flex justify-end gap-3">
              <button 
                onClick={() => { setSitesViewMode('list'); setActiveSite(null); }}
                className="px-4 py-2 border border-[#D3D1C7] bg-white text-[#2C2C2A] rounded-lg font-sans font-semibold hover:bg-[#F1EFE8] cursor-pointer"
              >
                Cancel
              </button>
              <button 
                id="save-site-btn"
                onClick={handleSaveSite}
                className="flex items-center gap-1 px-5 py-2 bg-[#1D9E75] hover:bg-[#1D9E75]/95 text-white rounded-lg font-sans font-semibold cursor-pointer transition-colors shadow-sm"
              >
                <Check className="w-4 h-4" /> Save Geofenced Site
              </button>
            </div>
          </div>
        )
      ) : activeTab === 'clusters' ? (
        clustersViewMode === 'list' ? (
          <div className="space-y-6">
            {/* Control Bar */}
            <div className="flex items-center justify-between bg-white p-5 rounded-xl border border-[#D3D1C7] shadow-sm">
              <div className="flex flex-col">
                <h3 className="text-xs font-bold text-[#2C2C2A] uppercase tracking-wider">Store Routing Clusters</h3>
                <p className="text-xs text-[#5F5E5A]">Consolidated regional routing for multi-drop delivery networks</p>
              </div>
              <button
                id="add-cluster-btn"
                onClick={handleInitNewCluster}
                className="flex items-center gap-1 px-4 py-2 bg-[#1D9E75] text-white rounded-lg text-xs font-sans font-semibold cursor-pointer"
              >
                <Plus className="w-4 h-4" /> Create Cluster
              </button>
            </div>

            {/* Cluster Grid Cards View */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5" id="clusters-grid">
              {clusters.length === 0 ? (
                <div className="md:col-span-2 bg-white p-8 text-center border border-dashed border-[#D3D1C7] rounded-xl text-[#5F5E5A]">
                  No clusters registered — add the first routing cluster.
                </div>
              ) : (
                clusters.map((cl) => (
                  <div 
                    key={cl.id}
                    className="bg-white p-5 rounded-xl border border-[#D3D1C7] shadow-sm flex flex-col justify-between hover:shadow-md transition-all gap-4"
                  >
                    <div className="space-y-2">
                      <div className="flex items-start justify-between">
                        <div className="flex flex-col">
                          <span className="font-sans font-bold text-sm text-[#2C2C2A]">{cl.name}</span>
                          <span className="text-[10px] text-[#5F5E5A] font-mono font-semibold tracking-wider uppercase mt-0.5">{cl.code}</span>
                        </div>
                        <span className="bg-[#1D9E75]/10 text-[#1D9E75] px-2.5 py-0.5 rounded-full font-mono text-[10px] font-bold border border-[#1D9E75]/30">
                          {cl.zone}
                        </span>
                      </div>

                      <p className="text-xs text-[#5F5E5A] line-clamp-2">{cl.notes || 'No description notes provided.'}</p>
                    </div>

                    <div className="bg-[#F1EFE8]/40 p-3.5 rounded-lg border border-[#D3D1C7]/60 grid grid-cols-3 gap-2 text-center text-xs font-sans">
                      <div className="flex flex-col">
                        <span className="text-[10px] text-[#5F5E5A] font-medium uppercase tracking-wider">Sites</span>
                        <span className="font-bold text-[#2C2C2A] mt-1">{cl.assignedSites?.length || 0} sites</span>
                      </div>
                      <div className="flex flex-col border-x border-[#D3D1C7]/60">
                        <span className="text-[10px] text-[#5F5E5A] font-medium uppercase tracking-wider">Distance</span>
                        <span className="font-bold text-[#2C2C2A] mt-1 font-mono">{cl.estimatedTotalDistance} km</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[10px] text-[#5F5E5A] font-medium uppercase tracking-wider">Assigned SDT</span>
                        <span className="font-bold text-[#2C2C2A] truncate mt-1" title={cl.assignedSdt}>{cl.assignedSdt || '---'}</span>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-[#D3D1C7]/40 flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleEditCluster(cl)}
                        className="px-3 py-1 border border-[#D3D1C7] hover:bg-[#F1EFE8] rounded-md text-xs font-sans font-medium text-[#2C2C2A]"
                      >
                        Edit Cluster
                      </button>
                      {onRemoveCluster && (
                        <button
                          onClick={() => onRemoveCluster(cl.id)}
                          className="p-1 hover:bg-red-50 text-red-600 rounded transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        ) : (
          /* Cluster Form */
          <div className="bg-white p-6 rounded-xl border border-[#D3D1C7] shadow-sm space-y-5" id="cluster-form-container">
            <div className="flex items-center justify-between border-b border-[#D3D1C7] pb-3">
              <button 
                onClick={() => { setClustersViewMode('list'); setActiveCluster(null); }}
                className="flex items-center gap-1.5 text-xs text-[#5F5E5A] hover:text-[#2C2C2A] font-sans font-medium transition-colors"
              >
                <ArrowLeft className="w-4 h-4" /> Back to clusters inventory
              </button>
              <span className="text-xs font-bold text-[#1D9E75]">
                {activeCluster?.name ? `Editing Cluster: ${activeCluster.name}` : 'Deploying New Routing Cluster'}
              </span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
              {/* Form entries (2/3) */}
              <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-sans">
                <div className="flex flex-col gap-1">
                  <label className="text-[11px] text-[#5F5E5A] font-medium uppercase tracking-tight">Cluster name</label>
                  <input 
                    type="text" 
                    value={activeCluster?.name || ''} 
                    onChange={(e) => handleClusterFieldChange('name', e.target.value)}
                    className="h-9 px-3 border border-[#D3D1C7] rounded-lg focus:outline-none"
                    placeholder="e.g. Addis East Cluster"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[11px] text-[#5F5E5A] font-medium uppercase tracking-tight">Cluster code</label>
                  <input 
                    type="text" 
                    value={activeCluster?.code || ''} 
                    onChange={(e) => handleClusterFieldChange('code', e.target.value)}
                    className="h-9 px-3 border border-[#D3D1C7] rounded-lg focus:outline-none font-mono"
                    placeholder="CL-ADD-E"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[11px] text-[#5F5E5A] font-medium uppercase tracking-tight">Zone (Ethiopian Region)</label>
                  <select 
                    value={activeCluster?.zone || ''} 
                    onChange={(e) => handleClusterFieldChange('zone', e.target.value)}
                    className="h-9 px-2 border border-[#D3D1C7] rounded-lg focus:outline-none bg-white font-medium text-[#1D9E75]"
                  >
                    {ETHIOPIAN_REGIONS.map(r => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[11px] text-[#5F5E5A] font-medium uppercase tracking-tight">Assigned SDT Coordinator</label>
                  <select 
                    value={activeCluster?.assignedSdt || ''} 
                    onChange={(e) => handleClusterFieldChange('assignedSdt', e.target.value)}
                    className="h-9 px-2 border border-[#D3D1C7] rounded-lg focus:outline-none bg-white"
                  >
                    {TIM_STAFF.map(sdt => (
                      <option key={sdt} value={sdt}>{sdt}</option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col gap-1 sm:col-span-2">
                  <label className="text-[11px] text-[#5F5E5A] font-medium uppercase tracking-tight">Estimated Total Distance (Auto calculated)</label>
                  <input 
                    type="text" 
                    value={`${activeCluster?.estimatedTotalDistance || 0} km`} 
                    disabled 
                    className="h-9 px-3 border border-[#D3D1C7] bg-[#F1EFE8]/50 rounded-lg font-semibold text-[#1D9E75]"
                  />
                </div>

                <div className="flex flex-col gap-1 sm:col-span-2">
                  <label className="text-[11px] text-[#5F5E5A] font-medium uppercase tracking-tight">Notes / descriptions</label>
                  <textarea 
                    rows={3} 
                    value={activeCluster?.notes || ''} 
                    onChange={(e) => handleClusterFieldChange('notes', e.target.value)}
                    className="p-3 border border-[#D3D1C7] rounded-lg focus:outline-none font-sans"
                    placeholder="Route instructions, drop priorities, or cluster constraints..."
                  />
                </div>
              </div>

              {/* Multi-select site checklist (1/3) */}
              <div className="bg-[#F1EFE8]/25 p-4 rounded-xl border border-[#D3D1C7] space-y-3">
                <span className="text-[11px] text-[#5F5E5A] font-bold uppercase tracking-wider block border-b border-[#D3D1C7] pb-1.5">
                  Assign Sites to Cluster
                </span>

                <div className="space-y-1 max-h-[220px] overflow-y-auto pr-1">
                  {sites.map(s => {
                    const isAssigned = activeCluster?.assignedSites?.includes(s.siteId);
                    return (
                      <label key={s.siteId} className="flex items-center justify-between py-1.5 px-2 border-b border-[#D3D1C7]/30 hover:bg-white rounded transition-colors cursor-pointer text-xs font-sans">
                        <div className="flex flex-col">
                          <span className="font-bold text-[#2C2C2A]">{s.siteId}</span>
                          <span className="text-[10px] text-[#5F5E5A] truncate max-w-[140px]">{s.siteName}</span>
                        </div>
                        <input 
                          type="checkbox" 
                          checked={isAssigned || false}
                          onChange={() => handleToggleClusterSite(s.siteId)}
                          className="rounded border-[#D3D1C7] text-[#1D9E75] focus:ring-[#1D9E75] w-4 h-4 cursor-pointer"
                        />
                      </label>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-[#D3D1C7] flex justify-end gap-3">
              <button 
                onClick={() => { setClustersViewMode('list'); setActiveCluster(null); }}
                className="px-4 py-2 border border-[#D3D1C7] bg-white text-[#2C2C2A] rounded-lg font-sans font-semibold hover:bg-[#F1EFE8]"
              >
                Cancel
              </button>
              <button 
                id="save-cluster-btn"
                onClick={handleSaveCluster}
                className="flex items-center gap-1 px-5 py-2 bg-[#1D9E75] hover:bg-[#1D9E75]/95 text-white rounded-lg font-sans font-semibold cursor-pointer transition-colors"
              >
                <Check className="w-4 h-4" /> Deploy Routing Cluster
              </button>
            </div>
          </div>
        )
      ) : (
        /* Projects Tab (7d) */
        projectsViewMode === 'list' ? (
          <div className="space-y-6" id="projects-list-tab">
            <div className="flex items-center justify-between bg-white p-5 rounded-xl border border-[#D3D1C7] shadow-sm">
              <div className="flex flex-col">
                <h3 className="text-xs font-bold text-[#2C2C2A] uppercase tracking-wider">Multi-Site Projects Directory</h3>
                <p className="text-xs text-[#5F5E5A]">Manage telecommunication infrastructure projects and map standard site geofences under each project</p>
              </div>
              <button
                id="add-project-btn"
                onClick={handleInitNewProject}
                className="flex items-center gap-1 px-4 py-2 bg-[#1D9E75] text-white rounded-lg text-xs font-sans font-semibold cursor-pointer animate-fade-in"
              >
                <Plus className="w-4 h-4" /> Create Project
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5" id="projects-grid">
              {projects.length === 0 ? (
                <div className="md:col-span-2 bg-white p-8 text-center border border-dashed border-[#D3D1C7] rounded-xl text-[#5F5E5A]">
                  No projects registered yet. Create a project and associate multiple sites.
                </div>
              ) : (
                projects.map((prj) => (
                  <div 
                    key={prj.id}
                    className="bg-white p-5 rounded-xl border border-[#D3D1C7] shadow-sm flex flex-col justify-between hover:shadow-md transition-all gap-4"
                  >
                    <div className="space-y-2">
                      <div className="flex items-start justify-between">
                        <div className="flex flex-col">
                          <span className="font-sans font-bold text-sm text-[#2C2C2A]">{prj.name}</span>
                          <span className="text-[10px] text-[#5F5E5A] font-mono font-semibold tracking-wider uppercase mt-0.5">{prj.code}</span>
                        </div>
                        <span className={`px-2.5 py-0.5 rounded-full font-sans text-[10px] font-bold border ${
                          prj.status === 'Active'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : prj.status === 'Completed'
                            ? 'bg-blue-50 text-blue-700 border-blue-200'
                            : 'bg-slate-50 text-slate-700 border-slate-200'
                        }`}>
                          {prj.status}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-xs py-1.5 border-t border-b border-slate-100 font-sans">
                        <div>
                          <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Client Partner</span>
                          <span className="font-semibold text-slate-700">{prj.client}</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Project Manager</span>
                          <span className="font-semibold text-slate-700">{prj.projectManager}</span>
                        </div>
                      </div>
                    </div>

                    <div className="bg-[#F1EFE8]/40 p-3 rounded-lg border border-[#D3D1C7]/60 space-y-2 font-sans text-xs">
                      <div className="flex justify-between items-center text-[10px] text-[#5F5E5A] font-bold uppercase tracking-wider border-b border-[#D3D1C7]/40 pb-1">
                        <span>Assigned Sites ({prj.assignedSites?.length || 0})</span>
                        {prj.budgetEtb && <span className="font-mono text-[#1D9E75] font-bold">Budget: {prj.budgetEtb.toLocaleString()} ETB</span>}
                      </div>

                      <div className="flex flex-wrap gap-1 max-h-[80px] overflow-y-auto pr-1">
                        {prj.assignedSites?.length === 0 ? (
                          <span className="text-slate-400 italic text-[11px]">No sites assigned yet. Edit project to link sites.</span>
                        ) : (
                          prj.assignedSites?.map(sid => {
                            const foundSite = sites.find(s => s.siteId === sid);
                            return (
                              <span 
                                key={sid} 
                                className="bg-white border border-[#D3D1C7] text-[10px] font-mono px-1.5 py-0.5 rounded font-semibold text-slate-700 flex items-center gap-1"
                                title={foundSite?.siteName}
                              >
                                <span className="w-1.5 h-1.5 rounded-full bg-[#1D9E75]"></span>
                                {sid}
                              </span>
                            );
                          })
                        )}
                      </div>
                    </div>

                    <div className="pt-2 border-t border-[#D3D1C7]/40 flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleEditProject(prj)}
                        className="px-3 py-1 border border-[#D3D1C7] hover:bg-[#F1EFE8] rounded-md text-xs font-sans font-medium text-[#2C2C2A] cursor-pointer"
                      >
                        Edit / Assign Sites
                      </button>
                      {onRemoveProject && (
                        <button
                          onClick={() => onRemoveProject(prj.id)}
                          className="p-1 hover:bg-red-50 text-red-600 rounded transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        ) : (
          /* Project Form */
          <div className="bg-white p-6 rounded-xl border border-[#D3D1C7] shadow-sm space-y-5" id="project-form-container">
            <div className="flex items-center justify-between border-b border-[#D3D1C7] pb-3">
              <button 
                onClick={() => { setProjectsViewMode('list'); setActiveProject(null); }}
                className="flex items-center gap-1.5 text-xs text-[#5F5E5A] hover:text-[#2C2C2A] font-sans font-medium transition-colors"
              >
                <ArrowLeft className="w-4 h-4" /> Back to projects directory
              </button>
              <span className="text-xs font-bold text-[#1D9E75]">
                {activeProject?.name ? `Editing Project: ${activeProject.name}` : 'Create New Multi-Site Project'}
              </span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
              {/* Form entries (2/3) */}
              <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-sans">
                <div className="flex flex-col gap-1">
                  <label className="text-[11px] text-[#5F5E5A] font-medium uppercase tracking-tight">Project name</label>
                  <input 
                    type="text" 
                    value={activeProject?.name || ''} 
                    onChange={(e) => handleProjectFieldChange('name', e.target.value)}
                    className="h-9 px-3 border border-[#D3D1C7] rounded-lg focus:outline-none focus:border-[#1D9E75]"
                    placeholder="e.g. ZTE LTE Overhaul North"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[11px] text-[#5F5E5A] font-medium uppercase tracking-tight">Project code</label>
                  <input 
                    type="text" 
                    value={activeProject?.code || ''} 
                    onChange={(e) => handleProjectFieldChange('code', e.target.value)}
                    className="h-9 px-3 border border-[#D3D1C7] rounded-lg focus:outline-none font-mono"
                    placeholder="e.g. PRJ-ZTE-2026-N"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[11px] text-[#5F5E5A] font-medium uppercase tracking-tight">Client partner / customer</label>
                  <input 
                    type="text" 
                    value={activeProject?.client || ''} 
                    onChange={(e) => handleProjectFieldChange('client', e.target.value)}
                    className="h-9 px-3 border border-[#D3D1C7] rounded-lg focus:outline-none"
                    placeholder="e.g. Ethio Telecom"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[11px] text-[#5F5E5A] font-medium uppercase tracking-tight">Project Manager</label>
                  <input 
                    type="text" 
                    value={activeProject?.projectManager || ''} 
                    onChange={(e) => handleProjectFieldChange('projectManager', e.target.value)}
                    className="h-9 px-3 border border-[#D3D1C7] rounded-lg focus:outline-none"
                    placeholder="e.g. Solomon Tekle"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[11px] text-[#5F5E5A] font-medium uppercase tracking-tight">Project Budget (ETB)</label>
                  <input 
                    type="number" 
                    value={activeProject?.budgetEtb || 0} 
                    onChange={(e) => handleProjectFieldChange('budgetEtb', Number(e.target.value))}
                    className="h-9 px-3 border border-[#D3D1C7] rounded-lg focus:outline-none font-mono font-bold text-[#1D9E75]"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[11px] text-[#5F5E5A] font-medium uppercase tracking-tight">Project Status</label>
                  <select 
                    value={activeProject?.status || 'Active'} 
                    onChange={(e) => handleProjectFieldChange('status', e.target.value)}
                    className="h-9 px-2 border border-[#D3D1C7] rounded-lg focus:outline-none bg-white font-medium"
                  >
                    <option value="Draft">Draft</option>
                    <option value="Active">Active</option>
                    <option value="Completed">Completed</option>
                    <option value="Suspended">Suspended</option>
                  </select>
                </div>
              </div>

              {/* Multi-select site checklist (1/3) */}
              <div className="bg-[#F1EFE8]/25 p-4 rounded-xl border border-[#D3D1C7] space-y-3">
                <span className="text-[11px] text-[#5F5E5A] font-bold uppercase tracking-wider block border-b border-[#D3D1C7] pb-1.5">
                  Assign Sites to Project
                </span>

                <div className="space-y-1 max-h-[300px] overflow-y-auto pr-1">
                  {sites.length === 0 ? (
                    <p className="text-slate-400 italic text-[11px] p-2 text-center">No sites registered yet. Go to Site tab to add.</p>
                  ) : (
                    sites.map(s => {
                      const isAssigned = activeProject?.assignedSites?.includes(s.siteId);
                      return (
                        <label key={s.siteId} className="flex items-center justify-between py-1.5 px-2 border-b border-[#D3D1C7]/30 hover:bg-white rounded transition-colors cursor-pointer text-xs font-sans">
                          <div className="flex flex-col">
                            <span className="font-bold text-[#2C2C2A]">{s.siteId}</span>
                            <span className="text-[10px] text-[#5F5E5A] truncate max-w-[140px]">{s.siteName}</span>
                          </div>
                          <input 
                            type="checkbox" 
                            checked={isAssigned || false}
                            onChange={() => handleToggleProjectSite(s.siteId)}
                            className="rounded border-[#D3D1C7] text-[#1D9E75] focus:ring-[#1D9E75] w-4 h-4 cursor-pointer"
                          />
                        </label>
                      );
                    })
                  )}
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-[#D3D1C7] flex justify-end gap-3">
              <button 
                onClick={() => { setProjectsViewMode('list'); setActiveProject(null); }}
                className="px-4 py-2 border border-[#D3D1C7] bg-white text-[#2C2C2A] rounded-lg font-sans font-semibold hover:bg-[#F1EFE8]"
              >
                Cancel
              </button>
              <button 
                id="save-project-btn"
                onClick={handleSaveProject}
                className="flex items-center gap-1 px-5 py-2 bg-[#1D9E75] hover:bg-[#1D9E75]/95 text-white rounded-lg font-sans font-semibold cursor-pointer transition-colors"
              >
                <Check className="w-4 h-4" /> Save Project & Mapped Sites
              </button>
            </div>
          </div>
        )
      )}
    </div>
  );
}

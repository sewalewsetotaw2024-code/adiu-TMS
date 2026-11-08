import React, { useState, useMemo, useEffect } from 'react';
import { 
  ProjectAllocation, Vehicle, Driver, Project, Supplier, WorkAnalysis, ProfitabilityAnalysis, MR, ProjectSite, StoreCluster 
} from '../types';
import { 
  Plus, Search, ShieldCheck, Info, Calendar, 
  User, Send, Clock, CheckCircle2, XCircle, AlertTriangle, 
  X, Truck, Lock, Unlock, FolderKanban, Award, 
  FileCheck2, Building2, Eye, FileText, Check
} from 'lucide-react';

interface ProjectFleetComplianceScreenProps {
  allocations: ProjectAllocation[];
  workAnalyses: WorkAnalysis[];
  pas: ProfitabilityAnalysis[];
  mrs: MR[];
  sites: ProjectSite[];
  clusters: StoreCluster[];
  projects: Project[];
  suppliers: Supplier[];
  vehicles: Vehicle[];
  drivers: Driver[];
  onSaveAllocation: (allocation: ProjectAllocation) => void;
  onApproveAllocation: (allocationId: string, qehsDetails: { officer: string; comments?: string }) => void;
  onRejectAllocation: (allocationId: string, reason: string, correctiveAction?: string) => void;
  onReleaseAllocation: (allocationId: string) => void;
  onSaveVehicle?: (vehicle: Vehicle) => void;
}

export default function ProjectFleetComplianceScreen({
  allocations,
  workAnalyses,
  pas,
  mrs,
  sites,
  projects,
  suppliers,
  vehicles,
  drivers,
  onSaveAllocation,
  onApproveAllocation,
  onRejectAllocation,
  onReleaseAllocation
}: ProjectFleetComplianceScreenProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'draft' | 'pending' | 'approved' | 'rejected' | 'released'>('all');
  const [waFilter, setWaFilter] = useState('');
  const [supplierFilter, setSupplierFilter] = useState('');

  // Modal States
  const [allocationModalOpen, setAllocationModalOpen] = useState(false);
  const [reviewModalAllocation, setReviewModalAllocation] = useState<ProjectAllocation | null>(null);
  const [rejectionModalAllocation, setRejectionModalAllocation] = useState<ProjectAllocation | null>(null);
  const [detailModalAllocation, setDetailModalAllocation] = useState<ProjectAllocation | null>(null);
  const [saveSuccessNotice, setSaveSuccessNotice] = useState('');

  // New Allocation Form State
  const [selectedWaId, setSelectedWaId] = useState('');
  const [selectedPlateNumber, setSelectedPlateNumber] = useState('');
  const [selectedDriverId, setSelectedDriverId] = useState('');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [expectedEndDate, setExpectedEndDate] = useState('');
  const [operationalZone, setOperationalZone] = useState('');
  const [allocationNotes, setAllocationNotes] = useState('');
  const [allowExternalFleet, setAllowExternalFleet] = useState(false);

  // QEHS Review State
  const [qehsOfficerName, setQehsOfficerName] = useState('Solomon Tekle (QEHS Officer)');
  const [qehsComments, setQehsComments] = useState('');
  const [activeChecklist, setActiveChecklist] = useState({
    qehsInsurance: true,
    qehsRoadWorthy: true,
    qehsDriverLicence: true,
    qehsLoadSecurity: true,
    qehsFireExtinguisher: true,
    qehsFirstAid: true,
    qehsGpsTracker: true
  });

  // Rejection Form State
  const [rejectionReason, setRejectionReason] = useState('');
  const [correctiveAction, setCorrectiveAction] = useState('');

  // Derived context for the selected Work Analysis in Modal
  const activeWa = useMemo(() => {
    return workAnalyses.find(w => w.id === selectedWaId) || workAnalyses[0] || null;
  }, [workAnalyses, selectedWaId]);

  // Find linked PA / Work Order for the active Work Analysis
  const linkedPa = useMemo(() => {
    if (!activeWa) return null;
    return pas.find(p => (p.workAnalysisId && p.workAnalysisId === activeWa.id) || (p.mrRef === activeWa.mrRef && p.approvalStatus === 'Approved')) ||
           pas.find(p => p.workAnalysisId === activeWa.id || p.mrRef === activeWa.mrRef) || null;
  }, [pas, activeWa]);

  // Sourced Winning Supplier
  const winningSupplierId = useMemo(() => {
    return linkedPa?.selectedSupplierId || linkedPa?.supplierId || '';
  }, [linkedPa]);

  const winningSupplier = useMemo(() => {
    if (!winningSupplierId) return null;
    return suppliers.find(s => s.id === winningSupplierId) || null;
  }, [suppliers, winningSupplierId]);

  // Sourced Expected Outbound Date from Work Order
  const sourcedOutboundDate = useMemo(() => {
    return linkedPa?.issuedDate || activeWa?.date || new Date().toISOString().split('T')[0];
  }, [linkedPa, activeWa]);

  // Sourced Work Order Number
  const sourcedWorkOrder = useMemo(() => {
    return linkedPa?.workOrderNumber || 'WO-PENDING';
  }, [linkedPa]);

  // Derived Linked Project and Client
  const linkedProject = useMemo(() => {
    if (!activeWa) return projects[0];
    const matchedSite = sites.find(s => activeWa.sites?.some(was => was.siteId === s.siteId));
    if (matchedSite && matchedSite.projectId) {
      const prj = projects.find(p => p.id === matchedSite.projectId);
      if (prj) return prj;
    }
    const matchedMr = mrs.find(m => m.mrNumber === activeWa.mrRef);
    if (matchedMr && matchedMr.vendorClient) {
      const clientLower = matchedMr.vendorClient.toLowerCase();
      const prj = projects.find(p => clientLower.includes(p.client.toLowerCase()) || p.client.toLowerCase().includes(clientLower));
      if (prj) return prj;
    }
    return projects[0];
  }, [activeWa, sites, projects, mrs]);

  // Available vehicles filtered strictly to winning supplier
  const availableVehicles = useMemo(() => {
    if (!allowExternalFleet && winningSupplierId) {
      return vehicles.filter(v => !v.isAssigned && v.supplierId === winningSupplierId);
    }
    return vehicles.filter(v => !v.isAssigned);
  }, [vehicles, winningSupplierId, allowExternalFleet]);

  // Available drivers
  const availableDrivers = useMemo(() => {
    return drivers.filter(d => !d.isAssigned && d.status === 'Active');
  }, [drivers]);

  // Auto-update dependent fields on WA change
  useEffect(() => {
    if (activeWa && allocationModalOpen) {
      setStartDate(sourcedOutboundDate);
      setOperationalZone(activeWa.route || activeWa.warehouseName || 'Standard Corridor');
      
      const instructions = linkedPa?.specialInstructions ? ` | WO Notes: ${linkedPa.specialInstructions}` : '';
      const notes = (activeWa.specialRequirements?.length ? `Special: ${activeWa.specialRequirements.join(', ')}` : '') + instructions;
      setAllocationNotes(notes);

      if (availableVehicles.length > 0) {
        const matchingTruck = availableVehicles.find(v => {
          if (activeWa.truckTypeRecommended === '3-ton') return v.tonCapacity <= 3;
          if (activeWa.truckTypeRecommended === '5-ton') return v.tonCapacity >= 4 && v.tonCapacity <= 6;
          if (activeWa.truckTypeRecommended === '10-ton') return v.tonCapacity >= 8;
          return true;
        }) || availableVehicles[0];

        setSelectedPlateNumber(matchingTruck.plateNumber);

        if (matchingTruck.driverId) {
          const matchingDriver = availableDrivers.find(d => d.id === matchingTruck.driverId);
          if (matchingDriver) {
            setSelectedDriverId(matchingDriver.id);
          } else if (availableDrivers.length > 0) {
            setSelectedDriverId(availableDrivers[0].id);
          }
        } else if (availableDrivers.length > 0) {
          setSelectedDriverId(availableDrivers[0].id);
        }
      } else {
        setSelectedPlateNumber('');
      }
    }
  }, [selectedWaId, activeWa, linkedPa, sourcedOutboundDate, availableVehicles, availableDrivers, allocationModalOpen]);

  const handleVehicleChange = (plate: string) => {
    setSelectedPlateNumber(plate);
    const vehicleObj = vehicles.find(v => v.plateNumber === plate);
    if (vehicleObj && vehicleObj.driverId) {
      const match = availableDrivers.find(d => d.id === vehicleObj.driverId);
      if (match) setSelectedDriverId(match.id);
    }
  };

  // Counts
  const draftCount = allocations.filter(a => a.status === 'Draft').length;
  const pendingCount = allocations.filter(a => a.status === 'Pending QEHS').length;
  const approvedCount = allocations.filter(a => a.status === 'Approved').length;
  const rejectedCount = allocations.filter(a => a.status === 'Rejected').length;
  const releasedCount = allocations.filter(a => a.status === 'Released').length;

  // Filtered Allocations
  const filteredAllocations = useMemo(() => {
    return allocations.filter(a => {
      const q = searchQuery.toLowerCase();
      const matchesSearch = 
        a.id.toLowerCase().includes(q) ||
        (a.workAnalysisId && a.workAnalysisId.toLowerCase().includes(q)) ||
        (a.workOrderNumber && a.workOrderNumber.toLowerCase().includes(q)) ||
        (a.supplierName && a.supplierName.toLowerCase().includes(q)) ||
        a.projectName.toLowerCase().includes(q) ||
        a.vehiclePlate.toLowerCase().includes(q) ||
        a.driverName.toLowerCase().includes(q) ||
        a.client.toLowerCase().includes(q);
      
      let matchesTab = true;
      if (activeTab === 'draft') matchesTab = a.status === 'Draft';
      else if (activeTab === 'pending') matchesTab = a.status === 'Pending QEHS';
      else if (activeTab === 'approved') matchesTab = a.status === 'Approved';
      else if (activeTab === 'rejected') matchesTab = a.status === 'Rejected';
      else if (activeTab === 'released') matchesTab = a.status === 'Released';

      const matchesWa = waFilter ? a.workAnalysisId === waFilter : true;
      const matchesSupplier = supplierFilter ? a.supplierId === supplierFilter : true;

      return matchesSearch && matchesTab && matchesWa && matchesSupplier;
    });
  }, [allocations, searchQuery, activeTab, waFilter, supplierFilter]);

  // Open registration modal
  const handleOpenAllocationModal = () => {
    const firstWa = workAnalyses[0];
    if (firstWa) {
      setSelectedWaId(firstWa.id);
    }
    setSaveSuccessNotice('');
    setAllowExternalFleet(false);
    setAllocationModalOpen(true);
  };

  // Build allocation payload from current form state
  const buildAllocationPayload = (status: 'Draft' | 'Pending QEHS'): ProjectAllocation | null => {
    if (!activeWa) {
      alert('Please select a Work Analysis.');
      return null;
    }
    if (!selectedPlateNumber) {
      alert('Please select an available vehicle.');
      return null;
    }
    if (!selectedDriverId) {
      alert('Please select an available driver.');
      return null;
    }

    const vehicle = vehicles.find(v => v.plateNumber === selectedPlateNumber);
    const driver = drivers.find(d => d.id === selectedDriverId);

    if (!vehicle || !driver) {
      alert('Invalid vehicle or driver selection.');
      return null;
    }

    const newAllocation: ProjectAllocation = {
      id: `ALC-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`,
      workAnalysisId: activeWa.id,
      workOrderNumber: sourcedWorkOrder,
      paNumber: linkedPa?.paNumber,
      mrRef: activeWa.mrRef,
      supplierId: winningSupplierId || vehicle.supplierId,
      supplierName: winningSupplier?.name || 'Selected Transporter',
      expectedOutboundDate: startDate || sourcedOutboundDate,
      clusterRef: activeWa.clusterRef || 'Cluster Scope',
      clusterName: activeWa.clusterRef || 'Cluster Scope',
      sitesCount: activeWa.sites?.length || 1,

      projectId: linkedProject?.id || 'prj-et-central',
      projectName: linkedProject?.name || 'Ethio Telecom Cluster Operations',
      client: linkedProject?.client || 'Ethio Telecom',
      vehiclePlate: vehicle.plateNumber,
      vehicleModel: vehicle.model,
      tonCapacity: vehicle.tonCapacity,
      driverId: driver.id,
      driverName: driver.name,
      driverPhone: driver.phone,
      driverLicense: driver.licenseNumber,
      startDate: startDate || sourcedOutboundDate,
      expectedEndDate: expectedEndDate || undefined,
      operationalZone: operationalZone || activeWa.route || 'Standard Scope',
      notes: allocationNotes,
      status: status,
      qehsInsurance: vehicle.qehsInsurance || false,
      qehsRoadWorthy: vehicle.qehsRoadWorthy || false,
      qehsDriverLicence: vehicle.qehsDriverLicence || false,
      qehsLoadSecurity: vehicle.qehsLoadSecurity || false,
      qehsFireExtinguisher: vehicle.qehsFireExtinguisher || false,
      qehsFirstAid: vehicle.qehsFirstAid || false,
      qehsGpsTracker: vehicle.qehsGpsTracker || false,
      submittedBy: 'Project Logistics Operations',
      submittedDate: new Date().toISOString().split('T')[0]
    };

    return newAllocation;
  };

  // Action 1: Save & Close (Saves as Draft, closes modal)
  const handleSaveAndClose = () => {
    const newAlc = buildAllocationPayload('Draft');
    if (!newAlc) return;

    onSaveAllocation(newAlc);
    setAllocationModalOpen(false);
  };

  // Action 2: Save & New (Saves as Draft, resets form for next registration)
  const handleSaveAndNew = () => {
    const newAlc = buildAllocationPayload('Draft');
    if (!newAlc) return;

    onSaveAllocation(newAlc);

    // Filter out the used vehicle to set up next one
    const remainingVehicles = availableVehicles.filter(v => v.plateNumber !== selectedPlateNumber);
    if (remainingVehicles.length > 0) {
      setSelectedPlateNumber(remainingVehicles[0].plateNumber);
      if (remainingVehicles[0].driverId) {
        setSelectedDriverId(remainingVehicles[0].driverId);
      } else {
        const remainingDrivers = availableDrivers.filter(d => d.id !== selectedDriverId);
        if (remainingDrivers.length > 0) setSelectedDriverId(remainingDrivers[0].id);
      }
    } else {
      setSelectedPlateNumber('');
      setSelectedDriverId('');
    }

    setSaveSuccessNotice(`Saved Draft ${newAlc.id} (${newAlc.vehiclePlate}). Enter next allocation below:`);
    setTimeout(() => setSaveSuccessNotice(''), 4500);
  };

  // Action 3: Submit for QEHS Approval (Directly submits to Pending QEHS)
  const handleSubmitForQehsApproval = () => {
    const newAlc = buildAllocationPayload('Pending QEHS');
    if (!newAlc) return;

    onSaveAllocation(newAlc);
    setAllocationModalOpen(false);
    alert(`Resource pairing ${newAlc.id} (Vehicle ${newAlc.vehiclePlate} & Driver ${newAlc.driverName}) submitted for QEHS inspection clearance!`);
  };

  // Submit an existing Draft for QEHS approval
  const handleSubmitExistingForQehs = (alcId: string) => {
    const today = new Date().toISOString().split('T')[0];
    const target = allocations.find(a => a.id === alcId);
    if (!target) return;

    const updatedAlc: ProjectAllocation = {
      ...target,
      status: 'Pending QEHS',
      submittedDate: today,
      submittedBy: 'Project Logistics Operations'
    };

    onSaveAllocation(updatedAlc);

    if (detailModalAllocation && detailModalAllocation.id === alcId) {
      setDetailModalAllocation(updatedAlc);
    }

    alert(`Allocation ${alcId} submitted for QEHS clearance! Status is now Awaiting QEHS.`);
  };

  // Open QEHS inspection review modal
  const handleOpenReview = (alc: ProjectAllocation) => {
    setReviewModalAllocation(alc);
    setQehsOfficerName('Solomon Tekle (QEHS Officer)');
    setQehsComments(alc.qehsComments || '');
    setActiveChecklist({
      qehsInsurance: alc.qehsInsurance,
      qehsRoadWorthy: alc.qehsRoadWorthy,
      qehsDriverLicence: alc.qehsDriverLicence,
      qehsLoadSecurity: alc.qehsLoadSecurity,
      qehsFireExtinguisher: alc.qehsFireExtinguisher,
      qehsFirstAid: alc.qehsFirstAid,
      qehsGpsTracker: alc.qehsGpsTracker
    });
  };

  // Approve allocation
  const handleApprove = () => {
    if (!reviewModalAllocation) return;

    const mandatory = [
      activeChecklist.qehsInsurance,
      activeChecklist.qehsRoadWorthy,
      activeChecklist.qehsDriverLicence,
      activeChecklist.qehsLoadSecurity,
      activeChecklist.qehsFireExtinguisher
    ];

    if (!mandatory.every(Boolean)) {
      alert('Mandatory safety items (Insurance, Road-worthy, Licence, Load security, Fire extinguisher) must all be checked before clearance.');
      return;
    }

    onApproveAllocation(reviewModalAllocation.id, {
      officer: qehsOfficerName,
      comments: qehsComments || 'Approved for project deployment.'
    });

    if (detailModalAllocation && detailModalAllocation.id === reviewModalAllocation.id) {
      setDetailModalAllocation(prev => prev ? {
        ...prev,
        status: 'Approved',
        reviewedByQehsOfficer: qehsOfficerName,
        reviewedDate: new Date().toISOString().split('T')[0]
      } : null);
    }

    setReviewModalAllocation(null);
    alert(`APPROVED: Vehicle ${reviewModalAllocation.vehiclePlate} and Driver ${reviewModalAllocation.driverName} are certified and locked to "${reviewModalAllocation.projectName}".`);
  };

  // Open reject modal
  const handleOpenReject = (alc: ProjectAllocation) => {
    setRejectionModalAllocation(alc);
    setRejectionReason(alc.rejectionReason || '');
    setCorrectiveAction(alc.correctiveAction || '');
  };

  const handleConfirmReject = () => {
    if (!rejectionModalAllocation) return;
    if (!rejectionReason.trim()) {
      alert('Please specify the rejection reason.');
      return;
    }

    onRejectAllocation(rejectionModalAllocation.id, rejectionReason.trim(), correctiveAction.trim());

    if (detailModalAllocation && detailModalAllocation.id === rejectionModalAllocation.id) {
      setDetailModalAllocation(prev => prev ? {
        ...prev,
        status: 'Rejected',
        rejectionReason: rejectionReason.trim(),
        correctiveAction: correctiveAction.trim(),
        reviewedDate: new Date().toISOString().split('T')[0]
      } : null);
    }

    setRejectionModalAllocation(null);
    if (reviewModalAllocation?.id === rejectionModalAllocation.id) {
      setReviewModalAllocation(null);
    }
    alert(`Allocation ${rejectionModalAllocation.id} marked as REJECTED.`);
  };

  // Release allocation
  const handleRelease = (alc: ProjectAllocation) => {
    const confirm = window.confirm(
      `Release ${alc.vehiclePlate} and ${alc.driverName} from "${alc.projectName}"?`
    );
    if (!confirm) return;

    onReleaseAllocation(alc.id);

    if (detailModalAllocation && detailModalAllocation.id === alc.id) {
      setDetailModalAllocation(prev => prev ? { ...prev, status: 'Released' } : null);
    }
  };

  const getStatusBadge = (status: ProjectAllocation['status']) => {
    switch (status) {
      case 'Draft':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-300">
            <FileText className="w-3 h-3 text-slate-500" /> Draft (Not Sent)
          </span>
        );
      case 'Approved':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-300">
            <Lock className="w-3 h-3 text-emerald-600" /> Active & Assigned
          </span>
        );
      case 'Pending QEHS':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-300 animate-pulse">
            <Clock className="w-3 h-3 text-amber-600" /> Awaiting QEHS
          </span>
        );
      case 'Rejected':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-red-50 text-red-700 border border-red-300">
            <XCircle className="w-3 h-3 text-red-600" /> Rejected
          </span>
        );
      case 'Released':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-300">
            <Unlock className="w-3 h-3 text-slate-500" /> Released
          </span>
        );
    }
  };

  return (
    <div className="space-y-5 select-none" id="project-fleet-compliance-root">
      
      {/* SECTION 1: TOP KPI CARDS */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tight block">Active Deployments</span>
            <div className="text-xl font-bold text-emerald-700 font-mono mt-0.5">{approvedCount}</div>
            <span className="text-[10px] text-slate-400">Assigned & locked</span>
          </div>
          <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <Lock className="w-4 h-4" />
          </div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tight block">Awaiting QEHS</span>
            <div className="text-xl font-bold text-amber-600 font-mono mt-0.5">{pendingCount}</div>
            <span className="text-[10px] text-slate-400">Pending review</span>
          </div>
          <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
            <Clock className="w-4 h-4" />
          </div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tight block">Draft Allocations</span>
            <div className="text-xl font-bold text-slate-700 font-mono mt-0.5">{draftCount}</div>
            <span className="text-[10px] text-slate-400">Not submitted</span>
          </div>
          <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center">
            <FileText className="w-4 h-4" />
          </div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tight block">Available Vehicles</span>
            <div className="text-xl font-bold text-blue-700 font-mono mt-0.5">
              {vehicles.filter(v => !v.isAssigned).length}
            </div>
            <span className="text-[10px] text-slate-400">Unassigned fleet</span>
          </div>
          <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
            <Truck className="w-4 h-4" />
          </div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tight block">Available Drivers</span>
            <div className="text-xl font-bold text-purple-700 font-mono mt-0.5">
              {drivers.filter(d => !d.isAssigned && d.status === 'Active').length}
            </div>
            <span className="text-[10px] text-slate-400">Unassigned drivers</span>
          </div>
          <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
            <User className="w-4 h-4" />
          </div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tight block">Work Analyses</span>
            <div className="text-xl font-bold text-slate-800 font-mono mt-0.5">{workAnalyses.length}</div>
            <span className="text-[10px] text-slate-400">Evaluated clusters</span>
          </div>
          <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center">
            <FolderKanban className="w-4 h-4" />
          </div>
        </div>
      </div>

      {/* SECTION 2: CONSOLE & CONTROLS */}
      <div className="bg-white p-5 rounded-xl border border-[#D3D1C7] shadow-2xs space-y-3.5">
        
        {/* Clean, Minimized Banner */}
        <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-xl flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center shrink-0">
              <Award className="w-3.5 h-3.5" />
            </div>
            <div>
              <h4 className="font-bold text-blue-950 text-xs">Work Analysis Fleet Allocation</h4>
              <p className="text-blue-700 text-[11px]">
                Assign winning transporter fleet to Work Analysis and submit for QEHS clearance. Click any row to view full details.
              </p>
            </div>
          </div>
          <button
            onClick={handleOpenAllocationModal}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold cursor-pointer transition-colors shadow-2xs shrink-0"
          >
            <Plus className="w-3.5 h-3.5" /> New Allocation
          </button>
        </div>

        {/* Controls */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-0.5">
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Search */}
            <div className="relative w-56">
              <Search className="w-3.5 h-3.5 text-[#5F5E5A] absolute left-3 top-1/2 -translate-y-1/2" />
              <input 
                type="text" 
                placeholder="Search WA, WO, plate, driver..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-8.5 pl-8.5 pr-2.5 rounded-lg border border-[#D3D1C7] bg-[#F1EFE8]/30 font-sans text-xs text-[#2C2C2A] focus:outline-none focus:border-[#1D9E75]"
              />
            </div>

            {/* WA Filter */}
            <select
              value={waFilter}
              onChange={(e) => setWaFilter(e.target.value)}
              className="h-8.5 px-2.5 rounded-lg border border-[#D3D1C7] text-xs font-sans text-[#2C2C2A] bg-white focus:outline-none"
            >
              <option value="">All WAs ({workAnalyses.length})</option>
              {workAnalyses.map(w => (
                <option key={w.id} value={w.id}>{w.id}</option>
              ))}
            </select>

            {/* Supplier Filter */}
            <select
              value={supplierFilter}
              onChange={(e) => setSupplierFilter(e.target.value)}
              className="h-8.5 px-2.5 rounded-lg border border-[#D3D1C7] text-xs font-sans text-[#2C2C2A] bg-white focus:outline-none"
            >
              <option value="">All Transporters ({suppliers.length})</option>
              {suppliers.map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>

            {/* Status Tabs */}
            <div className="flex items-center bg-[#F1EFE8]/60 p-0.5 rounded-lg border border-[#D3D1C7]/70 gap-0.5 text-xs font-sans">
              <button
                onClick={() => setActiveTab('all')}
                className={`px-2.5 py-1 rounded-md text-xs font-medium cursor-pointer ${
                  activeTab === 'all' ? 'bg-white shadow-2xs text-[#2C2C2A] font-bold' : 'text-[#5F5E5A] hover:text-[#2C2C2A]'
                }`}
              >
                All ({allocations.length})
              </button>
              <button
                onClick={() => setActiveTab('draft')}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium cursor-pointer ${
                  activeTab === 'draft' ? 'bg-white shadow-2xs text-slate-800 font-bold' : 'text-[#5F5E5A] hover:text-[#2C2C2A]'
                }`}
              >
                <span>Drafts</span>
                {draftCount > 0 && (
                  <span className="w-3.5 h-3.5 rounded-full bg-slate-500 text-white text-[9px] flex items-center justify-center font-bold">
                    {draftCount}
                  </span>
                )}
              </button>
              <button
                onClick={() => setActiveTab('pending')}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium cursor-pointer ${
                  activeTab === 'pending' ? 'bg-white shadow-2xs text-amber-700 font-bold' : 'text-[#5F5E5A] hover:text-[#2C2C2A]'
                }`}
              >
                <span>Awaiting QEHS</span>
                {pendingCount > 0 && (
                  <span className="w-3.5 h-3.5 rounded-full bg-amber-500 text-white text-[9px] flex items-center justify-center font-bold">
                    {pendingCount}
                  </span>
                )}
              </button>
              <button
                onClick={() => setActiveTab('approved')}
                className={`px-2.5 py-1 rounded-md text-xs font-medium cursor-pointer ${
                  activeTab === 'approved' ? 'bg-white shadow-2xs text-emerald-700 font-bold' : 'text-[#5F5E5A] hover:text-[#2C2C2A]'
                }`}
              >
                Active ({approvedCount})
              </button>
              <button
                onClick={() => setActiveTab('rejected')}
                className={`px-2.5 py-1 rounded-md text-xs font-medium cursor-pointer ${
                  activeTab === 'rejected' ? 'bg-white shadow-2xs text-red-700 font-bold' : 'text-[#5F5E5A] hover:text-[#2C2C2A]'
                }`}
              >
                Rejected ({rejectedCount})
              </button>
              <button
                onClick={() => setActiveTab('released')}
                className={`px-2.5 py-1 rounded-md text-xs font-medium cursor-pointer ${
                  activeTab === 'released' ? 'bg-white shadow-2xs text-slate-700 font-bold' : 'text-[#5F5E5A] hover:text-[#2C2C2A]'
                }`}
              >
                Released ({releasedCount})
              </button>
            </div>
          </div>
        </div>

        {/* Table of Allocations */}
        <div className="overflow-x-auto border border-[#D3D1C7]/60 rounded-lg">
          <table className="w-full text-left border-collapse" id="allocations-table">
            <thead>
              <tr className="bg-[#F1EFE8]/45 border-b border-[#D3D1C7]/80 text-[10px] font-sans font-semibold text-[#5F5E5A] uppercase tracking-wider">
                <th className="p-2.5">WA & Work Order</th>
                <th className="p-2.5">Transporter</th>
                <th className="p-2.5">Outbound</th>
                <th className="p-2.5">Vehicle</th>
                <th className="p-2.5">Driver</th>
                <th className="p-2.5">Route Scope</th>
                <th className="p-2.5">Status</th>
                <th className="p-2.5 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#D3D1C7]/40 text-xs font-sans text-[#2C2C2A]">
              {filteredAllocations.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-6 text-center text-[#5F5E5A] italic">
                    No fleet allocations found. Click "+ New Allocation" to register.
                  </td>
                </tr>
              ) : (
                filteredAllocations.map((alc) => {
                  return (
                    <tr 
                      key={alc.id} 
                      onClick={() => setDetailModalAllocation(alc)}
                      className="hover:bg-[#F1EFE8]/40 transition-colors cursor-pointer group"
                      title="Click to view complete details"
                    >
                      <td className="p-2.5 font-mono font-bold text-slate-800">
                        <div className="flex flex-col gap-0.5">
                          <span className="text-[#1D9E75] font-bold group-hover:underline flex items-center gap-1">
                            {alc.workAnalysisId || 'WA-N/A'}
                          </span>
                          <span className="text-[10px] text-slate-500 font-mono">WO: {alc.workOrderNumber || 'WO-PENDING'}</span>
                        </div>
                      </td>
                      <td className="p-2.5">
                        <span className="font-bold text-slate-900 flex items-center gap-1">
                          <Building2 className="w-3 h-3 text-slate-400" />
                          {alc.supplierName || 'Transporter'}
                        </span>
                      </td>
                      <td className="p-2.5">
                        <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-blue-50/70 border border-blue-200 text-blue-800 font-mono font-semibold text-[11px]">
                          <Calendar className="w-3 h-3 text-blue-600" />
                          {alc.expectedOutboundDate || alc.startDate}
                        </div>
                      </td>
                      <td className="p-2.5">
                        <div className="flex items-center gap-1.5">
                          <Truck className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                          <div>
                            <span className="font-mono font-bold text-[#1D9E75] block flex items-center gap-1">
                              {alc.vehiclePlate}
                              {alc.status === 'Approved' && <Lock className="w-3 h-3 text-emerald-600 inline" />}
                            </span>
                            <span className="text-[10px] text-slate-500">{alc.vehicleModel || `${alc.tonCapacity || 10}T`}</span>
                          </div>
                        </div>
                      </td>
                      <td className="p-2.5">
                        <div className="flex items-center gap-1.5">
                          <User className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                          <div>
                            <span className="font-semibold text-slate-800 block">{alc.driverName}</span>
                            <span className="text-[10px] text-slate-500 font-mono">{alc.driverPhone}</span>
                          </div>
                        </div>
                      </td>
                      <td className="p-2.5 text-[11px] text-slate-600 max-w-[180px] truncate" title={alc.operationalZone}>
                        {alc.operationalZone || alc.projectName}
                      </td>
                      <td className="p-2.5">
                        {getStatusBadge(alc.status)}
                      </td>
                      <td className="p-2.5 text-center" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-center gap-1.5">
                          {/* If not sent yet (Draft), show direct submit button */}
                          {alc.status === 'Draft' && (
                            <button
                              onClick={() => handleSubmitExistingForQehs(alc.id)}
                              className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-bold transition-colors shadow-2xs flex items-center gap-1 cursor-pointer"
                              title="Submit this draft allocation for QEHS approval"
                            >
                              <Send className="w-3 h-3" /> Submit to QEHS
                            </button>
                          )}

                          {alc.status === 'Pending QEHS' && (
                            <button
                              onClick={() => handleOpenReview(alc)}
                              className="px-2.5 py-1 bg-amber-500 hover:bg-amber-600 text-white rounded text-xs font-bold transition-colors shadow-2xs flex items-center gap-1 cursor-pointer"
                            >
                              <ShieldCheck className="w-3 h-3" /> Review
                            </button>
                          )}

                          {alc.status === 'Approved' && (
                            <button
                              onClick={() => handleRelease(alc)}
                              className="px-2 py-0.5 border border-slate-300 text-slate-600 hover:text-red-700 hover:border-red-300 rounded text-[11px] flex items-center gap-0.5 cursor-pointer"
                              title="Release resources"
                            >
                              <Unlock className="w-2.5 h-2.5" /> Release
                            </button>
                          )}

                          {/* Always accessible Details View Button */}
                          <button
                            onClick={() => setDetailModalAllocation(alc)}
                            className="px-2 py-0.5 border border-[#D3D1C7] text-slate-700 hover:bg-white rounded text-[11px] flex items-center gap-1 cursor-pointer"
                            title="View complete allocation dossier"
                          >
                            <Eye className="w-3 h-3 text-slate-500" /> View
                          </button>
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

      {/* MODAL 1: ALLOCATE FLEET TO WORK ANALYSIS & WINNER SUPPLIER */}
      {allocationModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl border border-slate-300 shadow-2xl max-w-xl w-full p-5 space-y-3.5 animate-zoomIn max-h-[92vh] overflow-y-auto">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
              <div className="flex items-center gap-2 text-blue-600">
                <Award className="w-4 h-4 text-blue-600" />
                <h3 className="text-sm font-bold uppercase tracking-wider">
                  Allocate Fleet to Work Analysis
                </h3>
              </div>
              <button 
                onClick={() => setAllocationModalOpen(false)}
                className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Success alert banner on Save & New */}
            {saveSuccessNotice && (
              <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-800 text-xs font-semibold flex items-center gap-1.5 animate-fadeIn">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{saveSuccessNotice}</span>
              </div>
            )}

            <div className="space-y-3.5 text-xs font-sans">
              
              {/* 1. Work Analysis Selector */}
              <div className="flex flex-col gap-1">
                <label className="font-bold text-slate-700 uppercase tracking-tight text-[10px] flex items-center gap-1">
                  <FolderKanban className="w-3 h-3 text-blue-600" />
                  1. Work Analysis *
                </label>
                <select
                  value={selectedWaId}
                  onChange={(e) => setSelectedWaId(e.target.value)}
                  className="h-9 px-2.5 border border-slate-300 rounded-lg bg-white focus:outline-none focus:border-blue-600 font-semibold text-slate-800"
                  required
                >
                  {workAnalyses.map(w => (
                    <option key={w.id} value={w.id}>
                      {w.id} — {w.route || w.warehouseName} ({w.totalSites || w.sites?.length || 1} Sites | Rec: {w.truckTypeRecommended})
                    </option>
                  ))}
                </select>
              </div>

              {/* Sourced Context Summary */}
              {activeWa && (
                <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200 grid grid-cols-2 gap-2 text-[11px]">
                  <div>
                    <span className="text-[9px] text-slate-400 font-bold uppercase block">Winner Transporter</span>
                    <strong className="text-slate-900 block truncate">{winningSupplier?.name || 'No winner awarded'}</strong>
                    <span className="text-[10px] text-slate-500">WO: {sourcedWorkOrder}</span>
                  </div>
                  <div>
                    <span className="text-[9px] text-slate-400 font-bold uppercase block">Expected Outbound Date</span>
                    <strong className="text-blue-700 font-mono block">{sourcedOutboundDate}</strong>
                    <span className="text-[10px] text-slate-500">Rec Truck: {activeWa.truckTypeRecommended}</span>
                  </div>
                </div>
              )}

              {/* 2. Vehicle Selector */}
              <div className="flex flex-col gap-1">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-slate-700 uppercase tracking-tight text-[10px] flex items-center gap-1">
                    <Truck className="w-3 h-3 text-blue-600" />
                    2. Transporter Vehicle *
                  </label>
                  <span className="text-[10px] text-blue-600 font-semibold">
                    {availableVehicles.length} available
                  </span>
                </div>

                {availableVehicles.length === 0 ? (
                  <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-lg text-amber-800 text-xs space-y-1">
                    <div className="flex items-center gap-1 font-semibold">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                      No unassigned vehicles for "{winningSupplier?.name || 'Transporter'}".
                    </div>
                    <label className="flex items-center gap-1.5 text-slate-700 font-medium cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={allowExternalFleet} 
                        onChange={(e) => setAllowExternalFleet(e.target.checked)} 
                        className="rounded"
                      />
                      <span>Show unassigned vehicles from other transporters</span>
                    </label>
                  </div>
                ) : (
                  <select
                    value={selectedPlateNumber}
                    onChange={(e) => handleVehicleChange(e.target.value)}
                    className="h-9 px-2.5 border border-slate-300 rounded-lg bg-white focus:outline-none focus:border-blue-600 font-mono font-bold text-slate-800"
                    required
                  >
                    {availableVehicles.map(v => (
                      <option key={v.plateNumber} value={v.plateNumber}>
                        {v.plateNumber} — {v.model} ({v.tonCapacity}T) — Driver: {v.driverName || 'None'}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* 3. Driver Selector */}
              <div className="flex flex-col gap-1">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-slate-700 uppercase tracking-tight text-[10px] flex items-center gap-1">
                    <User className="w-3 h-3 text-purple-600" />
                    3. Qualified Driver *
                  </label>
                  <span className="text-[10px] text-purple-600 font-semibold">{availableDrivers.length} available</span>
                </div>

                {availableDrivers.length === 0 ? (
                  <div className="p-2 bg-amber-50 border border-amber-200 rounded text-amber-800 text-xs">
                    No unassigned drivers available.
                  </div>
                ) : (
                  <select
                    value={selectedDriverId}
                    onChange={(e) => setSelectedDriverId(e.target.value)}
                    className="h-9 px-2.5 border border-slate-300 rounded-lg bg-white focus:outline-none focus:border-blue-600 font-medium text-slate-800"
                    required
                  >
                    {availableDrivers.map(d => (
                      <option key={d.id} value={d.id}>
                        {d.name} — {d.licenseClass} (Tel: {d.phone}) {d.assignedVehiclePlate === selectedPlateNumber ? '★ Primary' : ''}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* 4. Schedule Dates */}
              <div className="grid grid-cols-2 gap-2.5">
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] text-slate-600 font-bold uppercase flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-blue-600" />
                    Outbound Date (WO) *
                  </label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="h-8.5 px-2.5 border border-slate-300 rounded-lg focus:outline-none font-mono font-semibold"
                    required
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] text-slate-600 font-bold uppercase">Expected End Date</label>
                  <input
                    type="date"
                    value={expectedEndDate}
                    onChange={(e) => setExpectedEndDate(e.target.value)}
                    className="h-8.5 px-2.5 border border-slate-300 rounded-lg focus:outline-none"
                  />
                </div>
              </div>

              {/* Route Scope */}
              <div className="flex flex-col gap-1">
                <label className="text-[10px] text-slate-600 font-bold uppercase">Route / Zone Scope</label>
                <input
                  type="text"
                  value={operationalZone}
                  onChange={(e) => setOperationalZone(e.target.value)}
                  placeholder="e.g. Kality Warehouse → Addis Ababa"
                  className="h-8.5 px-2.5 border border-slate-300 rounded-lg focus:outline-none text-xs"
                />
              </div>

              {/* Notes */}
              <div className="flex flex-col gap-1">
                <label className="text-[10px] text-slate-600 font-bold uppercase">Instructions / Cargo Notes</label>
                <textarea
                  value={allocationNotes}
                  onChange={(e) => setAllocationNotes(e.target.value)}
                  placeholder="Special instructions or cargo handling notes..."
                  rows={2}
                  className="p-2 border border-slate-300 rounded-lg focus:outline-none text-xs"
                />
              </div>

              {/* Action Buttons: Cancel, Save & New, Save & Close, Submit for QEHS Approval */}
              <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setAllocationModalOpen(false)}
                  className="px-3.5 py-1.5 border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 rounded-lg text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={handleSaveAndNew}
                    disabled={availableVehicles.length === 0 || availableDrivers.length === 0}
                    className="flex items-center gap-1 px-3 py-1.5 border border-slate-300 bg-slate-50 hover:bg-slate-100 text-slate-700 disabled:opacity-50 rounded-lg text-xs font-semibold cursor-pointer transition-colors shadow-2xs"
                  >
                    <Plus className="w-3.5 h-3.5 text-slate-600" /> Save & New
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveAndClose}
                    disabled={availableVehicles.length === 0 || availableDrivers.length === 0}
                    className="flex items-center gap-1 px-3.5 py-1.5 border border-blue-600 bg-blue-50 text-blue-700 hover:bg-blue-100 disabled:opacity-50 rounded-lg text-xs font-bold cursor-pointer transition-colors shadow-2xs"
                  >
                    <FileText className="w-3.5 h-3.5" /> Save & Close
                  </button>
                  <button
                    type="button"
                    onClick={handleSubmitForQehsApproval}
                    disabled={availableVehicles.length === 0 || availableDrivers.length === 0}
                    className="flex items-center gap-1.5 px-4 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg text-xs font-bold cursor-pointer transition-colors shadow-2xs"
                  >
                    <Send className="w-3.5 h-3.5" /> Submit for QEHS Approval
                  </button>
                </div>
              </div>

            </div>

          </div>
        </div>
      )}

      {/* MODAL 2: COMPREHENSIVE DETAIL VIEW (Opens on row click or View button) */}
      {detailModalAllocation && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl border border-slate-300 shadow-2xl max-w-2xl w-full p-5 space-y-4 animate-zoomIn max-h-[92vh] overflow-y-auto">
            
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <FolderKanban className="w-5 h-5 text-blue-600" />
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-slate-900 font-mono">
                      {detailModalAllocation.id}
                    </h3>
                    {getStatusBadge(detailModalAllocation.status)}
                  </div>
                  <span className="text-[10px] text-slate-400">
                    Created: {detailModalAllocation.submittedDate || '---'} by {detailModalAllocation.submittedBy || 'Operations'}
                  </span>
                </div>
              </div>
              <button 
                onClick={() => setDetailModalAllocation(null)}
                className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* If Draft, show callout to submit */}
            {detailModalAllocation.status === 'Draft' && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2 text-amber-900">
                  <Clock className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>This allocation is saved as a <strong>Draft</strong> and has not yet been submitted for QEHS clearance.</span>
                </div>
                <button
                  onClick={() => handleSubmitExistingForQehs(detailModalAllocation.id)}
                  className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold cursor-pointer transition-colors shadow-2xs shrink-0"
                >
                  <Send className="w-3.5 h-3.5" /> Submit for QEHS Approval
                </button>
              </div>
            )}

            {/* Dossier Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              
              {/* Card 1: Work Order & Scope */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tight block border-b border-slate-200/80 pb-1">
                  1. Work Analysis & Logistics Scope
                </span>
                <div className="space-y-1 text-[11px]">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Work Analysis:</span>
                    <strong className="text-[#1D9E75] font-mono">{detailModalAllocation.workAnalysisId || '---'}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Work Order Ref:</span>
                    <strong className="text-slate-900 font-mono">{detailModalAllocation.workOrderNumber || '---'}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Winning Transporter:</span>
                    <strong className="text-slate-900">{detailModalAllocation.supplierName}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Expected Outbound:</span>
                    <strong className="text-blue-700 font-mono">{detailModalAllocation.expectedOutboundDate || detailModalAllocation.startDate}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Target Project:</span>
                    <span className="font-semibold text-slate-800 truncate max-w-[170px]">{detailModalAllocation.projectName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Route & Zone:</span>
                    <span className="text-slate-700 truncate max-w-[170px]">{detailModalAllocation.operationalZone}</span>
                  </div>
                </div>
              </div>

              {/* Card 2: Vehicle & Driver Pairing */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tight block border-b border-slate-200/80 pb-1">
                  2. Vehicle Unit & Driver Assignment
                </span>
                <div className="space-y-1.5 text-[11px]">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 flex items-center gap-1">
                      <Truck className="w-3.5 h-3.5 text-blue-600" /> Vehicle Plate:
                    </span>
                    <strong className="text-[#1D9E75] font-mono text-[12px]">{detailModalAllocation.vehiclePlate}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Model & Specs:</span>
                    <span className="text-slate-800">{detailModalAllocation.vehicleModel} ({detailModalAllocation.tonCapacity || 10}T)</span>
                  </div>
                  <div className="border-t border-slate-200/60 pt-1.5 flex items-center justify-between">
                    <span className="text-slate-500 flex items-center gap-1">
                      <User className="w-3.5 h-3.5 text-purple-600" /> Driver Name:
                    </span>
                    <strong className="text-slate-900">{detailModalAllocation.driverName}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Driver Phone:</span>
                    <span className="text-slate-700 font-mono">{detailModalAllocation.driverPhone}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Licence No:</span>
                    <span className="text-slate-700 font-mono">{detailModalAllocation.driverLicense || 'Standard'}</span>
                  </div>
                </div>
              </div>

            </div>

            {/* Checklist Overview */}
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2 text-xs">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tight block border-b border-slate-200/80 pb-1">
                3. Mandatory Safety & Technical Checks
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className={`w-3.5 h-3.5 ${detailModalAllocation.qehsInsurance ? 'text-emerald-600' : 'text-slate-300'}`} />
                  <span className={detailModalAllocation.qehsInsurance ? 'text-slate-800 font-medium' : 'text-slate-400'}>Insurance</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className={`w-3.5 h-3.5 ${detailModalAllocation.qehsRoadWorthy ? 'text-emerald-600' : 'text-slate-300'}`} />
                  <span className={detailModalAllocation.qehsRoadWorthy ? 'text-slate-800 font-medium' : 'text-slate-400'}>Road-Worthy</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className={`w-3.5 h-3.5 ${detailModalAllocation.qehsDriverLicence ? 'text-emerald-600' : 'text-slate-300'}`} />
                  <span className={detailModalAllocation.qehsDriverLicence ? 'text-slate-800 font-medium' : 'text-slate-400'}>Licence</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className={`w-3.5 h-3.5 ${detailModalAllocation.qehsLoadSecurity ? 'text-emerald-600' : 'text-slate-300'}`} />
                  <span className={detailModalAllocation.qehsLoadSecurity ? 'text-slate-800 font-medium' : 'text-slate-400'}>Load Security</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className={`w-3.5 h-3.5 ${detailModalAllocation.qehsFireExtinguisher ? 'text-emerald-600' : 'text-slate-300'}`} />
                  <span className={detailModalAllocation.qehsFireExtinguisher ? 'text-slate-800 font-medium' : 'text-slate-400'}>Extinguisher</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className={`w-3.5 h-3.5 ${detailModalAllocation.qehsFirstAid ? 'text-emerald-600' : 'text-slate-300'}`} />
                  <span className={detailModalAllocation.qehsFirstAid ? 'text-slate-800 font-medium' : 'text-slate-400'}>First Aid</span>
                </div>
                <div className="flex items-center gap-1.5 sm:col-span-2">
                  <CheckCircle2 className={`w-3.5 h-3.5 ${detailModalAllocation.qehsGpsTracker ? 'text-emerald-600' : 'text-slate-300'}`} />
                  <span className={detailModalAllocation.qehsGpsTracker ? 'text-slate-800 font-medium' : 'text-slate-400'}>GPS Telematics</span>
                </div>
              </div>
            </div>

            {/* Audit / Review Log */}
            {detailModalAllocation.reviewedDate && (
              <div className="p-3 bg-emerald-50/60 border border-emerald-200 rounded-xl text-xs space-y-1">
                <span className="text-[10px] font-bold text-emerald-800 uppercase block">
                  QEHS Clearance Audit
                </span>
                <div className="text-[11px] text-emerald-950 flex flex-wrap gap-x-4">
                  <span>Audited by: <strong>{detailModalAllocation.reviewedByQehsOfficer || 'QEHS Officer'}</strong></span>
                  <span>Date: <strong>{detailModalAllocation.reviewedDate}</strong></span>
                </div>
                {detailModalAllocation.qehsComments && (
                  <p className="text-[11px] text-emerald-800 italic mt-0.5">
                    "{detailModalAllocation.qehsComments}"
                  </p>
                )}
              </div>
            )}

            {detailModalAllocation.status === 'Rejected' && detailModalAllocation.rejectionReason && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs space-y-1">
                <span className="text-[10px] font-bold text-red-800 uppercase block">Rejection Details</span>
                <p className="text-[11px] text-red-700">Reason: {detailModalAllocation.rejectionReason}</p>
                {detailModalAllocation.correctiveAction && (
                  <p className="text-[11px] text-red-600 font-medium">Corrective Action: {detailModalAllocation.correctiveAction}</p>
                )}
              </div>
            )}

            {/* Modal Footer Actions */}
            <div className="flex items-center justify-between pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setDetailModalAllocation(null)}
                className="px-4 py-1.5 border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 rounded-lg text-xs font-semibold cursor-pointer"
              >
                Close
              </button>

              <div className="flex items-center gap-2">
                {detailModalAllocation.status === 'Draft' && (
                  <button
                    onClick={() => handleSubmitExistingForQehs(detailModalAllocation.id)}
                    className="flex items-center gap-1.5 px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold cursor-pointer transition-colors shadow-2xs"
                  >
                    <Send className="w-3.5 h-3.5" /> Submit for QEHS Approval
                  </button>
                )}

                {detailModalAllocation.status === 'Pending QEHS' && (
                  <button
                    onClick={() => {
                      const alc = detailModalAllocation;
                      setDetailModalAllocation(null);
                      handleOpenReview(alc);
                    }}
                    className="flex items-center gap-1.5 px-4 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-xs font-bold cursor-pointer transition-colors shadow-2xs"
                  >
                    <ShieldCheck className="w-3.5 h-3.5" /> Open QEHS Inspection Review
                  </button>
                )}

                {detailModalAllocation.status === 'Approved' && (
                  <button
                    onClick={() => handleRelease(detailModalAllocation)}
                    className="flex items-center gap-1 px-3 py-1.5 border border-slate-300 text-slate-700 hover:text-red-700 hover:border-red-300 rounded-lg text-xs font-semibold cursor-pointer transition-colors"
                  >
                    <Unlock className="w-3 h-3" /> Release Allocation
                  </button>
                )}
              </div>
            </div>

          </div>
        </div>
      )}

      {/* MODAL 3: QEHS OFFICER AUDIT & CLEARANCE */}
      {reviewModalAllocation && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl border border-slate-300 shadow-2xl max-w-xl w-full p-5 space-y-3.5 animate-zoomIn max-h-[92vh] overflow-y-auto">
            
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
              <div className="flex items-center gap-2 text-emerald-700">
                <ShieldCheck className="w-4 h-4" />
                <h3 className="text-sm font-bold uppercase tracking-wider">
                  QEHS Clearance: {reviewModalAllocation.id}
                </h3>
              </div>
              <button 
                onClick={() => setReviewModalAllocation(null)}
                className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Allocation Dossier */}
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 grid grid-cols-2 gap-2 text-xs">
              <div>
                <span className="text-[9px] text-slate-400 font-bold uppercase block">Work Analysis</span>
                <span className="font-bold text-slate-900 block">{reviewModalAllocation.workAnalysisId}</span>
                <span className="text-[10px] text-slate-600 font-mono">WO: {reviewModalAllocation.workOrderNumber || 'WO-PENDING'}</span>
              </div>
              <div>
                <span className="text-[9px] text-slate-400 font-bold uppercase block">Transporter</span>
                <span className="font-semibold text-slate-800 block truncate">{reviewModalAllocation.supplierName}</span>
                <span className="text-[10px] text-blue-700 font-mono">Outbound: {reviewModalAllocation.expectedOutboundDate || reviewModalAllocation.startDate}</span>
              </div>
              <div className="border-t border-slate-200 pt-1.5">
                <span className="text-[9px] text-slate-400 font-bold uppercase block">Vehicle</span>
                <span className="font-mono font-bold text-[#1D9E75] block">{reviewModalAllocation.vehiclePlate}</span>
              </div>
              <div className="border-t border-slate-200 pt-1.5">
                <span className="text-[9px] text-slate-400 font-bold uppercase block">Driver</span>
                <span className="font-bold text-slate-800 block">{reviewModalAllocation.driverName}</span>
              </div>
            </div>

            {/* Checklist Header */}
            <div className="flex items-center justify-between pt-0.5">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wide flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-[#1D9E75]" /> Safety Checklist
              </h4>
              <button
                type="button"
                onClick={() => {
                  setActiveChecklist({
                    qehsInsurance: true,
                    qehsRoadWorthy: true,
                    qehsDriverLicence: true,
                    qehsLoadSecurity: true,
                    qehsFireExtinguisher: true,
                    qehsFirstAid: true,
                    qehsGpsTracker: true
                  });
                }}
                className="text-[11px] text-blue-600 hover:text-blue-800 font-semibold cursor-pointer"
              >
                Mark All Compliant
              </button>
            </div>

            {/* Checklist */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <label className="flex items-center gap-2 p-1.5 bg-slate-50 border border-slate-200 rounded-lg cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={activeChecklist.qehsInsurance} 
                  onChange={(e) => setActiveChecklist({ ...activeChecklist, qehsInsurance: e.target.checked })}
                  className="rounded text-emerald-600" 
                />
                <span className="font-medium text-slate-800 text-[11px]">1. Insurance Valid *</span>
              </label>

              <label className="flex items-center gap-2 p-1.5 bg-slate-50 border border-slate-200 rounded-lg cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={activeChecklist.qehsRoadWorthy} 
                  onChange={(e) => setActiveChecklist({ ...activeChecklist, qehsRoadWorthy: e.target.checked })}
                  className="rounded text-emerald-600" 
                />
                <span className="font-medium text-slate-800 text-[11px]">2. Road-Worthy Passed *</span>
              </label>

              <label className="flex items-center gap-2 p-1.5 bg-slate-50 border border-slate-200 rounded-lg cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={activeChecklist.qehsDriverLicence} 
                  onChange={(e) => setActiveChecklist({ ...activeChecklist, qehsDriverLicence: e.target.checked })}
                  className="rounded text-emerald-600" 
                />
                <span className="font-medium text-slate-800 text-[11px]">3. Driver Licence Valid *</span>
              </label>

              <label className="flex items-center gap-2 p-1.5 bg-slate-50 border border-slate-200 rounded-lg cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={activeChecklist.qehsLoadSecurity} 
                  onChange={(e) => setActiveChecklist({ ...activeChecklist, qehsLoadSecurity: e.target.checked })}
                  className="rounded text-emerald-600" 
                />
                <span className="font-medium text-slate-800 text-[11px]">4. Cargo Load Security *</span>
              </label>

              <label className="flex items-center gap-2 p-1.5 bg-slate-50 border border-slate-200 rounded-lg cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={activeChecklist.qehsFireExtinguisher} 
                  onChange={(e) => setActiveChecklist({ ...activeChecklist, qehsFireExtinguisher: e.target.checked })}
                  className="rounded text-emerald-600" 
                />
                <span className="font-medium text-slate-800 text-[11px]">5. Fire Extinguisher *</span>
              </label>

              <label className="flex items-center gap-2 p-1.5 bg-slate-50 border border-slate-200 rounded-lg cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={activeChecklist.qehsFirstAid} 
                  onChange={(e) => setActiveChecklist({ ...activeChecklist, qehsFirstAid: e.target.checked })}
                  className="rounded text-emerald-600" 
                />
                <span className="font-medium text-slate-800 text-[11px]">6. First Aid Kit</span>
              </label>

              <label className="flex items-center gap-2 p-1.5 bg-slate-50 border border-slate-200 rounded-lg cursor-pointer col-span-2">
                <input 
                  type="checkbox" 
                  checked={activeChecklist.qehsGpsTracker} 
                  onChange={(e) => setActiveChecklist({ ...activeChecklist, qehsGpsTracker: e.target.checked })}
                  className="rounded text-emerald-600" 
                />
                <span className="font-medium text-slate-800 text-[11px]">7. GPS Tracker Functional</span>
              </label>
            </div>

            {/* Officer & Notes */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="flex flex-col gap-1">
                <label className="text-[10px] text-slate-500 font-bold uppercase">QEHS Officer</label>
                <input 
                  type="text" 
                  value={qehsOfficerName} 
                  onChange={(e) => setQehsOfficerName(e.target.value)}
                  className="h-8 px-2 border border-slate-300 rounded focus:outline-none text-xs" 
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[10px] text-slate-500 font-bold uppercase">Notes</label>
                <input 
                  type="text" 
                  value={qehsComments} 
                  onChange={(e) => setQehsComments(e.target.value)}
                  placeholder="Clearance comments..."
                  className="h-8 px-2 border border-slate-300 rounded focus:outline-none text-xs" 
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between pt-2.5 border-t border-slate-100">
              <button
                type="button"
                onClick={() => handleOpenReject(reviewModalAllocation)}
                className="flex items-center gap-1 px-3 py-1.5 border border-red-300 bg-red-50 text-red-700 hover:bg-red-100 rounded text-xs font-bold cursor-pointer"
              >
                <XCircle className="w-3.5 h-3.5" /> Reject
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setReviewModalAllocation(null)}
                  className="px-3 py-1.5 border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 rounded text-xs font-semibold cursor-pointer"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={handleApprove}
                  className="flex items-center gap-1 px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-xs font-bold cursor-pointer transition-colors shadow-2xs"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" /> Approve & Assign
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* MODAL 4: REJECTION REASON */}
      {rejectionModalAllocation && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl border border-red-200 shadow-2xl max-w-md w-full p-5 space-y-3 animate-zoomIn">
            
            <div className="flex items-center justify-between border-b border-red-100 pb-2">
              <div className="flex items-center gap-1.5 text-red-700">
                <AlertTriangle className="w-4 h-4 text-red-600" />
                <h3 className="text-xs font-bold uppercase tracking-wider">
                  Reject Allocation: {rejectionModalAllocation.id}
                </h3>
              </div>
              <button 
                onClick={() => setRejectionModalAllocation(null)}
                className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            <p className="text-xs text-slate-600">
              Specify reason for rejecting vehicle <strong>{rejectionModalAllocation.vehiclePlate}</strong>:
            </p>

            <div className="space-y-2 text-xs">
              <div className="flex flex-col gap-1">
                <label className="text-[10px] text-slate-600 font-bold uppercase">Rejection Reason *</label>
                <textarea 
                  value={rejectionReason} 
                  onChange={(e) => setRejectionReason(e.target.value)}
                  rows={2}
                  placeholder="e.g. Expired road-worthy certificate..."
                  className="p-2 border border-red-300 rounded focus:outline-none" 
                  required
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[10px] text-slate-600 font-bold uppercase">Corrective Action</label>
                <input 
                  type="text"
                  value={correctiveAction} 
                  onChange={(e) => setCorrectiveAction(e.target.value)}
                  placeholder="e.g. Replace certificate or assign alternate unit..."
                  className="h-8 px-2 border border-slate-300 rounded focus:outline-none" 
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setRejectionModalAllocation(null)}
                className="px-3 py-1.5 border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 rounded text-xs font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmReject}
                className="flex items-center gap-1 px-4 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded text-xs font-bold cursor-pointer"
              >
                <XCircle className="w-3.5 h-3.5" /> Confirm Rejection
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}

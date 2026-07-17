import React, { useState } from 'react';
import { 
  Users, 
  Shield, 
  GitMerge, 
  TrendingUp, 
  Plus, 
  Trash2, 
  Check, 
  AlertTriangle, 
  UserCheck, 
  ToggleLeft, 
  ToggleRight, 
  Save,
  ArrowUp,
  ArrowDown,
  PlusCircle,
  RotateCcw,
  Search,
  Sparkles
} from 'lucide-react';
import { PriceThresholdConfig } from '../types';

interface UserItem {
  id: string;
  name: string;
  email: string;
  role: string;
  region: string;
  status: 'Active' | 'Suspended';
}

interface WorkflowStage {
  id: string;
  name: string;
  variancePercent?: number; // negative variance threshold percentage
  role: string;
}

interface ApprovalWorkflow {
  id: string;
  name: string;
  entityType: string;
  status: 'Active' | 'Inactive';
  stages: WorkflowStage[];
}

interface RolePermission {
  resource: string;
  read: boolean;
  create: boolean;
  update: boolean;
  delete: boolean;
}

interface RoleItem {
  id: string;
  name: string;
  description: string;
  permissions: RolePermission[];
}

const RESOURCES_LIST = [
  'Address',
  'Allowance',
  'Allowance Type',
  'Bank',
  'Career Event',
  'Celebration',
  'Certificate',
  'Material Requests (MRs)',
  'Work Analysis & Truck Recommendations',
  'Price Book Entry',
  'Profitability Analysis (PA)',
  'Delivery Tracker Jobs',
  'Vehicles & Drivers Database',
  'WCC Closures',
  'Projects & Geofences'
];

const seedPermissions = (roleName: string): RolePermission[] => {
  return RESOURCES_LIST.map(resource => {
    let read = true;
    let create = false;
    let update = false;
    let del = false;

    if (roleName === 'Admin') {
      create = true;
      update = true;
      del = true;
    } else if (roleName === 'SDT Coordinator') {
      if (['Material Requests (MRs)', 'Work Analysis & Truck Recommendations', 'Projects & Geofences', 'Address'].includes(resource)) {
        create = true;
        update = true;
      }
      if (['Vehicles & Drivers Database'].includes(resource)) {
        create = true;
        update = true;
      }
    } else if (roleName === 'Procurement Officer') {
      if (['Price Book Entry', 'Profitability Analysis (PA)', 'Allowance', 'Allowance Type'].includes(resource)) {
        create = true;
        update = true;
      }
    } else if (roleName === 'Driver Supervisor') {
      if (['Delivery Tracker Jobs'].includes(resource)) {
        update = true;
      }
    }

    return { resource, read, create, update, delete: del };
  });
};

interface SettingsScreenProps {
  thresholdConfigs: PriceThresholdConfig[];
  onSaveThresholdConfig: (config: PriceThresholdConfig) => void;
  onResetData?: () => void;
}

export default function SettingsScreen({
  thresholdConfigs,
  onSaveThresholdConfig,
  onResetData
}: SettingsScreenProps) {
  
  const [activeTab, setActiveTab] = useState<'users' | 'roles' | 'workflows'>('users');

  // Custom roles states
  const [customRoleName, setCustomRoleName] = useState('');
  const [customRoleDesc, setCustomRoleDesc] = useState('');
  const [showAddRole, setShowAddRole] = useState(false);

  // 1. Initial Users state
  const [users, setUsers] = useState<UserItem[]>([
    { id: 'u-1', name: 'Solomon Tekle', email: 'solomon@adiu-tms.com', role: 'SDT Coordinator', region: 'Addis Ababa', status: 'Active' },
    { id: 'u-2', name: 'Mustefa Kemal', email: 'mustefa@adiu-tms.com', role: 'Procurement Officer', region: 'Zonal/North', status: 'Active' },
    { id: 'u-3', name: 'Yonas Berhe', email: 'yonas@adiu-tms.com', role: 'Admin', region: 'All Regions', status: 'Active' },
    { id: 'u-4', name: 'Ashenafi Hailu', email: 'ashenafi@adiu-tms.com', role: 'Driver Supervisor', region: 'Hawassa', status: 'Active' },
  ]);

  const [newUser, setNewUser] = useState<Omit<UserItem, 'id'>>({
    name: '',
    email: '',
    role: 'Procurement Officer',
    region: 'Addis Ababa',
    status: 'Active'
  });

  const [showAddUser, setShowAddUser] = useState(false);

  // 2. Roles state
  const [selectedRoleId, setSelectedRoleId] = useState<string>('r-1');
  const [roles, setRoles] = useState<RoleItem[]>([
    {
      id: 'r-1',
      name: 'Admin',
      description: 'Full administrative access and system overrides',
      permissions: seedPermissions('Admin')
    },
    {
      id: 'r-2',
      name: 'SDT Coordinator',
      description: 'Coordinates sites, geofences, and transport requests',
      permissions: seedPermissions('SDT Coordinator')
    },
    {
      id: 'r-3',
      name: 'Procurement Officer',
      description: 'Conducts pricing, supplier allocations, and commercial analysis',
      permissions: seedPermissions('Procurement Officer')
    },
    {
      id: 'r-4',
      name: 'Driver Supervisor',
      description: 'Manages loading scans and coordinates on-ground logistics',
      permissions: seedPermissions('Driver Supervisor')
    },
    {
      id: 'r-5',
      name: 'Transport Lead',
      description: 'Reviews and signs off on negative quote variances ≤10%',
      permissions: seedPermissions('Transport Lead')
    },
    {
      id: 'r-6',
      name: 'Sourcing, Transport and PIM Manager',
      description: 'Approves negative quote variances in the 10% to 20% range',
      permissions: seedPermissions('Sourcing, Transport and PIM Manager')
    },
    {
      id: 'r-7',
      name: 'Supply Chain Director',
      description: 'Maintains ultimate veto and approval rights for high-variance quote deviations >20%',
      permissions: seedPermissions('Supply Chain Director')
    }
  ]);

  // 3. Workflows configuration
  const [workflows, setWorkflows] = useState({
    requireDoubleSignOff: true,
    autoEscalateSupervisor: false,
    autoDeployDeliveryOnApproval: true,
    blockLowerThanThreshold: false,
    notifyVarianceAlerts: true
  });

  // Interactive workflows state
  const [approvalWorkflows, setApprovalWorkflows] = useState<ApprovalWorkflow[]>([
    {
      id: 'wf-1',
      name: 'Profitability Threshold',
      entityType: 'ProfitabilityAnalysis',
      status: 'Active',
      stages: [
        { id: 'stg-1-1', name: 'Transport Lead Approval', variancePercent: 10, role: 'Transport Lead' },
        { id: 'stg-1-2', name: 'Sourcing, Transport and PIM Manager Approval', variancePercent: 20, role: 'Sourcing, Transport and PIM Manager' },
        { id: 'stg-1-3', name: 'Supply Chain Director Approval', variancePercent: 100, role: 'Supply Chain Director' }
      ]
    },
    {
      id: 'wf-2',
      name: 'Recruitment Request Approval',
      entityType: 'RecruitmentRequest',
      status: 'Active',
      stages: [
        { id: 'stg-2-1', name: 'HR Review', role: 'Admin' },
        { id: 'stg-2-2', name: 'Department Head Sign-Off', role: 'SDT Coordinator' }
      ]
    },
    {
      id: 'wf-3',
      name: 'Work Analysis Review',
      entityType: 'WorkAnalysis',
      status: 'Active',
      stages: [
        { id: 'stg-3-1', name: 'Ground Supervisor Verification', role: 'Driver Supervisor' },
        { id: 'stg-3-2', name: 'SDT Coordinator Approval', role: 'SDT Coordinator' }
      ]
    }
  ]);

  const [selectedWorkflowId, setSelectedWorkflowId] = useState<string>('wf-1');
  const [searchWorkflowQuery, setSearchWorkflowQuery] = useState<string>('');

  // Filter workflows based on query
  const filteredWorkflows = approvalWorkflows.filter(wf => 
    wf.name.toLowerCase().includes(searchWorkflowQuery.toLowerCase()) ||
    wf.entityType.toLowerCase().includes(searchWorkflowQuery.toLowerCase())
  );
  
  // Custom draft workflow states for creation and edit
  const [isCreatingWorkflow, setIsCreatingWorkflow] = useState<boolean>(false);
  const [newWfName, setNewWfName] = useState<string>('');
  const [newWfEntityType, setNewWfEntityType] = useState<string>('ProfitabilityAnalysis');
  const [newWfStages, setNewWfStages] = useState<WorkflowStage[]>([
    { id: 'stg-init-1', name: 'Transport Lead Approval', variancePercent: 10, role: 'Transport Lead' }
  ]);

  // 4. Threshold configs (Local edits proxying back to App)
  const [localConfigs, setLocalConfigs] = useState<PriceThresholdConfig[]>(thresholdConfigs);

  // Handlers
  const handleAddUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUser.name || !newUser.email) {
      alert('Name and Email are required.');
      return;
    }
    const created: UserItem = {
      id: `u-${Date.now()}`,
      ...newUser
    };
    setUsers(prev => [created, ...prev]);
    setNewUser({
      name: '',
      email: '',
      role: 'Procurement Officer',
      region: 'Addis Ababa',
      status: 'Active'
    });
    setShowAddUser(false);
    alert('User added successfully.');
  };

  const handleToggleUserStatus = (userId: string) => {
    setUsers(prev => prev.map(u => {
      if (u.id === userId) {
        const nextStatus = u.status === 'Active' ? 'Suspended' : 'Active';
        return { ...u, status: nextStatus };
      }
      return u;
    }));
  };

  const handleDeleteUser = (userId: string) => {
    if (confirm('Are you sure you want to delete this user account?')) {
      setUsers(prev => prev.filter(u => u.id !== userId));
    }
  };

  const handleTogglePermission = (roleId: string, resourceName: string, field: 'read' | 'create' | 'update' | 'delete') => {
    setRoles(prev => prev.map(r => {
      if (r.id === roleId) {
        return {
          ...r,
          permissions: r.permissions.map(p => {
            if (p.resource === resourceName) {
              return {
                ...p,
                read: field === 'read' ? !p.read : p.read,
                create: field === 'create' ? !p.create : p.create,
                update: field === 'update' ? !p.update : p.update,
                delete: field === 'delete' ? !p.delete : p.delete
              };
            }
            return p;
          })
        };
      }
      return r;
    }));
  };

  const handleAddCustomRole = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customRoleName.trim()) {
      alert('Please enter a role name.');
      return;
    }
    const newId = `r-${Date.now()}`;
    const newRole: RoleItem = {
      id: newId,
      name: customRoleName.trim(),
      description: customRoleDesc.trim() || 'Custom security role with user-defined capabilities',
      permissions: seedPermissions(customRoleName.trim())
    };
    setRoles(prev => [...prev, newRole]);
    setSelectedRoleId(newId);
    setCustomRoleName('');
    setCustomRoleDesc('');
    setShowAddRole(false);
    alert(`Custom Role "${newRole.name}" created successfully with default permissions matrix!`);
  };

  const handleWorkflowToggle = (key: keyof typeof workflows) => {
    setWorkflows(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const handleConfigChange = (supplierId: string, field: 'thresholdAmount' | 'alertThresholdPercent', value: number) => {
    const updated = localConfigs.map(c => {
      if (c.supplierId === supplierId) {
        return { ...c, [field]: value };
      }
      return c;
    });
    setLocalConfigs(updated);
  };

  // --- Handlers for Approval Workflows ---
  
  // Create a new empty stage draft for creation form
  const handleAddNewWfStage = () => {
    setNewWfStages(prev => [
      ...prev,
      { id: `stg-new-${Date.now()}`, name: `Approval Tier ${prev.length + 1}`, role: 'Transport Lead' }
    ]);
  };

  // Remove a stage draft from creation form
  const handleRemoveNewWfStage = (id: string) => {
    setNewWfStages(prev => prev.filter(s => s.id !== id));
  };

  // Update a stage draft's field in creation form
  const handleUpdateNewWfStage = (id: string, field: 'name' | 'role' | 'variancePercent', value: any) => {
    setNewWfStages(prev => prev.map(s => {
      if (s.id === id) {
        if (field === 'variancePercent') {
          return { ...s, variancePercent: value === '' ? undefined : Number(value) };
        }
        return { ...s, [field]: value };
      }
      return s;
    }));
  };

  // Save the newly created workflow
  const handleSaveNewWorkflow = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWfName.trim()) {
      alert('Please enter a name for the new workflow.');
      return;
    }
    if (newWfStages.length === 0) {
      alert('A workflow must have at least one stage.');
      return;
    }

    const createdId = `wf-${Date.now()}`;
    const newWf: ApprovalWorkflow = {
      id: createdId,
      name: newWfName.trim(),
      entityType: newWfEntityType,
      status: 'Active',
      stages: newWfStages.map((s, idx) => ({
        ...s,
        id: s.id.startsWith('stg-new') ? `stg-${createdId}-${idx}` : s.id
      }))
    };

    setApprovalWorkflows(prev => [...prev, newWf]);
    setSelectedWorkflowId(createdId);
    setIsCreatingWorkflow(false);
    
    // Clear draft state
    setNewWfName('');
    setNewWfEntityType('ProfitabilityAnalysis');
    setNewWfStages([{ id: 'stg-init-1', name: 'Transport Lead Approval', variancePercent: 10, role: 'Transport Lead' }]);
    
    alert(`New workflow "${newWf.name}" saved successfully!`);
  };

  // Update fields of the currently selected workflow directly
  const handleUpdateSelectedWorkflowField = (field: 'name' | 'status', value: any) => {
    setApprovalWorkflows(prev => prev.map(w => {
      if (w.id === selectedWorkflowId) {
        return { ...w, [field]: value };
      }
      return w;
    }));
  };

  // Add stage to existing workflow
  const handleAddStageToSelectedWorkflow = () => {
    setApprovalWorkflows(prev => prev.map(w => {
      if (w.id === selectedWorkflowId) {
        const nextIdx = w.stages.length + 1;
        const newStage: WorkflowStage = {
          id: `stg-${w.id}-${Date.now()}`,
          name: `Approval Tier ${nextIdx}`,
          role: 'Transport Lead'
        };
        return { ...w, stages: [...w.stages, newStage] };
      }
      return w;
    }));
  };

  // Remove stage from existing workflow
  const handleRemoveStageFromSelectedWorkflow = (stageId: string) => {
    setApprovalWorkflows(prev => prev.map(w => {
      if (w.id === selectedWorkflowId) {
        return { ...w, stages: w.stages.filter(s => s.id !== stageId) };
      }
      return w;
    }));
  };

  // Update existing workflow's stage field
  const handleUpdateStageInSelectedWorkflow = (stageId: string, field: 'name' | 'role' | 'variancePercent', value: any) => {
    setApprovalWorkflows(prev => prev.map(w => {
      if (w.id === selectedWorkflowId) {
        return {
          ...w,
          stages: w.stages.map(s => {
            if (s.id === stageId) {
              if (field === 'variancePercent') {
                return { ...s, variancePercent: value === '' ? undefined : Number(value) };
              }
              return { ...s, [field]: value };
            }
            return s;
          })
        };
      }
      return w;
    }));
  };

  // Move stage up or down
  const handleMoveStageInSelectedWorkflow = (stageIndex: number, direction: 'up' | 'down') => {
    setApprovalWorkflows(prev => prev.map(w => {
      if (w.id === selectedWorkflowId) {
        const stagesCopy = [...w.stages];
        const targetIndex = direction === 'up' ? stageIndex - 1 : stageIndex + 1;
        if (targetIndex >= 0 && targetIndex < stagesCopy.length) {
          const temp = stagesCopy[stageIndex];
          stagesCopy[stageIndex] = stagesCopy[targetIndex];
          stagesCopy[targetIndex] = temp;
          return { ...w, stages: stagesCopy };
        }
      }
      return w;
    }));
  };

  // Revert selected workflow back to original seed values
  const handleRevertSelectedWorkflow = () => {
    const originalSeeds: Record<string, ApprovalWorkflow> = {
      'wf-1': {
        id: 'wf-1',
        name: 'Profitability Threshold',
        entityType: 'ProfitabilityAnalysis',
        status: 'Active',
        stages: [
          { id: 'stg-1-1', name: 'Transport Lead Approval', variancePercent: 10, role: 'Transport Lead' },
          { id: 'stg-1-2', name: 'Sourcing, Transport and PIM Manager Approval', variancePercent: 20, role: 'Sourcing, Transport and PIM Manager' },
          { id: 'stg-1-3', name: 'Supply Chain Director Approval', variancePercent: 100, role: 'Supply Chain Director' }
        ]
      },
      'wf-2': {
        id: 'wf-2',
        name: 'Recruitment Request Approval',
        entityType: 'RecruitmentRequest',
        status: 'Active',
        stages: [
          { id: 'stg-2-1', name: 'HR Review', role: 'Admin' },
          { id: 'stg-2-2', name: 'Department Head Sign-Off', role: 'SDT Coordinator' }
        ]
      },
      'wf-3': {
        id: 'wf-3',
        name: 'Work Analysis Review',
        entityType: 'WorkAnalysis',
        status: 'Active',
        stages: [
          { id: 'stg-3-1', name: 'Ground Supervisor Verification', role: 'Driver Supervisor' },
          { id: 'stg-3-2', name: 'SDT Coordinator Approval', role: 'SDT Coordinator' }
        ]
      }
    };

    if (originalSeeds[selectedWorkflowId]) {
      setApprovalWorkflows(prev => prev.map(w => {
        if (w.id === selectedWorkflowId) {
          return JSON.parse(JSON.stringify(originalSeeds[selectedWorkflowId]));
        }
        return w;
      }));
      alert('Workflow reverted to original parameters.');
    } else {
      alert('Only predefined workflows can be reverted to original seeds.');
    }
  };

  // Delete workflow entirely
  const handleDeleteWorkflow = (wfId: string) => {
    if (confirm('Are you sure you want to delete this approval workflow?')) {
      const remaining = approvalWorkflows.filter(w => w.id !== wfId);
      setApprovalWorkflows(remaining);
      // select another one
      if (remaining.length > 0) {
        setSelectedWorkflowId(remaining[0].id);
      }
    }
  };

  return (
    <div className="space-y-6 select-none pb-12" id="settings-screen-root">
      
      {/* Settings Navigation Bar */}
      <div className="flex border-b border-[#D3D1C7] gap-2">
        <button
          onClick={() => setActiveTab('users')}
          className={`px-5 py-2.5 text-xs font-sans font-semibold transition-all flex items-center gap-2 border-b-2 -mb-[2px] ${
            activeTab === 'users' 
              ? 'border-[#1D9E75] text-[#1D9E75]' 
              : 'border-transparent text-[#5F5E5A] hover:text-[#2C2C2A]'
          }`}
        >
          <Users className="w-4 h-4" /> User Management
        </button>

        <button
          onClick={() => setActiveTab('roles')}
          className={`px-5 py-2.5 text-xs font-sans font-semibold transition-all flex items-center gap-2 border-b-2 -mb-[2px] ${
            activeTab === 'roles' 
              ? 'border-[#1D9E75] text-[#1D9E75]' 
              : 'border-transparent text-[#5F5E5A] hover:text-[#2C2C2A]'
          }`}
        >
          <Shield className="w-4 h-4" /> Roles & Permissions
        </button>

        <button
          onClick={() => setActiveTab('workflows')}
          className={`px-5 py-2.5 text-xs font-sans font-semibold transition-all flex items-center gap-2 border-b-2 -mb-[2px] ${
            activeTab === 'workflows' 
              ? 'border-[#1D9E75] text-[#1D9E75]' 
              : 'border-transparent text-[#5F5E5A] hover:text-[#2C2C2A]'
          }`}
        >
          <GitMerge className="w-4 h-4" /> Approval Workflows
        </button>
      </div>

      {/* Rendering Active Tab */}
      {activeTab === 'users' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between bg-white p-5 rounded-xl border border-[#D3D1C7] shadow-sm">
            <div className="flex flex-col">
              <span className="text-xs font-bold text-[#2C2C2A] uppercase tracking-wider block">Authorized System Users</span>
              <span className="text-xs text-[#5F5E5A]">Manage user accounts, assign specific operational roles and regional bounds</span>
            </div>
            <button
              onClick={() => setShowAddUser(!showAddUser)}
              className="flex items-center gap-1 px-4 py-2 bg-[#1D9E75] hover:bg-[#1D9E75]/90 text-white rounded-lg text-xs font-sans font-semibold cursor-pointer"
            >
              <Plus className="w-4 h-4" /> {showAddUser ? 'Cancel' : 'Add User Account'}
            </button>
          </div>

          {showAddUser && (
            <form onSubmit={handleAddUser} className="bg-white p-5 rounded-xl border border-[#D3D1C7] shadow-sm space-y-4">
              <h3 className="text-xs font-bold text-[#2C2C2A] border-b border-[#D3D1C7] pb-1.5 uppercase">Create Authorized Account</h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs font-sans">
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] uppercase font-bold text-[#5F5E5A]">Full Name</label>
                  <input
                    type="text"
                    required
                    value={newUser.name}
                    onChange={(e) => setNewUser(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g. Mustefa Kemal"
                    className="h-9 px-3 border border-[#D3D1C7] rounded-lg focus:outline-none"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[10px] uppercase font-bold text-[#5F5E5A]">Email Address</label>
                  <input
                    type="email"
                    required
                    value={newUser.email}
                    onChange={(e) => setNewUser(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="e.g. mustefa@adiu.com"
                    className="h-9 px-3 border border-[#D3D1C7] rounded-lg focus:outline-none"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[10px] uppercase font-bold text-[#5F5E5A]">System Role</label>
                  <select
                    value={newUser.role}
                    onChange={(e) => setNewUser(prev => ({ ...prev, role: e.target.value }))}
                    className="h-9 px-2 border border-[#D3D1C7] rounded-lg bg-white"
                  >
                    <option value="Admin">Admin</option>
                    <option value="SDT Coordinator">SDT Coordinator</option>
                    <option value="Procurement Officer">Procurement Officer</option>
                    <option value="Driver Supervisor">Driver Supervisor</option>
                  </select>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[10px] uppercase font-bold text-[#5F5E5A]">Region Bounds</label>
                  <input
                    type="text"
                    value={newUser.region}
                    onChange={(e) => setNewUser(prev => ({ ...prev, region: e.target.value }))}
                    placeholder="e.g. Addis Ababa"
                    className="h-9 px-3 border border-[#D3D1C7] rounded-lg focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  className="flex items-center gap-1.5 px-5 py-2 bg-[#1D9E75] hover:bg-[#1D9E75]/95 text-white text-xs font-semibold rounded-lg cursor-pointer"
                >
                  <Check className="w-4 h-4" /> Authorize Account
                </button>
              </div>
            </form>
          )}

          {/* User Table */}
          <div className="bg-white rounded-xl border border-[#D3D1C7] shadow-sm overflow-hidden">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-[#D3D1C7] text-[#5F5E5A] font-sans font-bold uppercase tracking-wider">
                  <th className="p-3">User</th>
                  <th className="p-3">Role</th>
                  <th className="p-3">Region Bound</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#D3D1C7]/40 font-sans">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50/50">
                    <td className="p-3">
                      <div className="flex flex-col">
                        <span className="font-bold text-[#2C2C2A]">{u.name}</span>
                        <span className="text-[10px] text-slate-400 font-mono">{u.email}</span>
                      </div>
                    </td>
                    <td className="p-3">
                      <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-[10px] font-semibold">
                        {u.role}
                      </span>
                    </td>
                    <td className="p-3 font-semibold text-slate-600">{u.region}</td>
                    <td className="p-3">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                        u.status === 'Active' 
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                          : 'bg-red-50 text-red-700 border-red-200'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${u.status === 'Active' ? 'bg-emerald-500' : 'bg-red-500'}`}></span>
                        {u.status}
                      </span>
                    </td>
                    <td className="p-3 text-right flex items-center justify-end gap-2.5">
                      <button
                        onClick={() => handleToggleUserStatus(u.id)}
                        className={`text-[10px] font-bold px-2.5 py-1 rounded border cursor-pointer ${
                          u.status === 'Active'
                            ? 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100'
                            : 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                        }`}
                      >
                        {u.status === 'Active' ? 'Suspend' : 'Activate'}
                      </button>
                      <button
                        onClick={() => handleDeleteUser(u.id)}
                        className="p-1 hover:bg-red-50 text-red-600 rounded transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'roles' && (
        <div className="space-y-6">
          <div className="bg-white p-5 rounded-xl border border-[#D3D1C7] shadow-sm flex flex-col sm:flex-row justify-between sm:items-center gap-4">
            <div>
              <span className="text-xs font-bold text-[#2C2C2A] uppercase tracking-wider block">Security Roles & Permissions Matrix</span>
              <span className="text-xs text-[#5F5E5A]">Select a security role from the left list, then tick the checkboxes to map resources and CRUD permissions dynamically.</span>
            </div>
            <button
              type="button"
              onClick={() => setShowAddRole(!showAddRole)}
              className="px-3.5 py-1.5 bg-[#1D9E75] hover:bg-[#1D9E75]/90 text-white rounded-lg text-xs font-semibold shadow-sm transition-all flex items-center gap-1 cursor-pointer"
            >
              <Shield className="w-3.5 h-3.5" /> + Create Custom Role
            </button>
          </div>

          {/* Add custom role panel */}
          {showAddRole && (
            <form onSubmit={handleAddCustomRole} className="bg-white p-5 rounded-xl border border-[#1D9E75] shadow-sm max-w-xl space-y-4">
              <h3 className="text-xs font-bold text-[#2C2C2A] uppercase">Create Custom Security Role</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Role Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g., Regional Auditor"
                    value={customRoleName}
                    onChange={(e) => setCustomRoleName(e.target.value)}
                    className="h-9 px-3 border border-[#D3D1C7] rounded-lg text-xs"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Description</label>
                  <input
                    type="text"
                    placeholder="e.g., Conducts regional inventory audits"
                    value={customRoleDesc}
                    onChange={(e) => setCustomRoleDesc(e.target.value)}
                    className="h-9 px-3 border border-[#D3D1C7] rounded-lg text-xs"
                  />
                </div>
              </div>
              <div className="flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => setShowAddRole(false)}
                  className="px-3 py-1.5 border border-[#D3D1C7] text-slate-600 rounded-lg text-xs font-semibold hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3 py-1.5 bg-[#1D9E75] text-white rounded-lg text-xs font-semibold hover:bg-[#1D9E75]/90"
                >
                  Add Role
                </button>
              </div>
            </form>
          )}

          <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
            {/* Left sidebar: Roles selection list */}
            <div className="space-y-3 xl:col-span-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#5F5E5A] block px-1">Security Levels</span>
              <div className="space-y-2">
                {roles.map((r) => {
                  const isSelected = r.id === selectedRoleId;
                  return (
                    <div
                      key={r.id}
                      onClick={() => setSelectedRoleId(r.id)}
                      className={`p-4 rounded-xl border transition-all cursor-pointer ${
                        isSelected
                          ? 'border-[#1D9E75] bg-[#1D9E75]/5 ring-1 ring-[#1D9E75]'
                          : 'border-[#D3D1C7] hover:bg-[#F1EFE8]/20 bg-white'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <Shield className={`w-4 h-4 ${isSelected ? 'text-[#1D9E75]' : 'text-slate-400'}`} />
                        <span className="font-sans font-bold text-[#2C2C2A] text-xs">{r.name}</span>
                      </div>
                      <p className="text-[11px] text-[#5F5E5A] mt-1 line-clamp-2 leading-relaxed">{r.description}</p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Right panel: Permissions Matrix */}
            <div className="xl:col-span-3 space-y-4">
              {roles.find(r => r.id === selectedRoleId) && (() => {
                const currentRole = roles.find(r => r.id === selectedRoleId)!;
                return (
                  <div className="bg-white rounded-xl border border-[#D3D1C7] shadow-sm overflow-hidden">
                    
                    {/* Matrix Header bar with quick bulk controls */}
                    <div className="bg-[#F1EFE8]/30 px-4 py-3 border-b border-[#D3D1C7] flex flex-col sm:flex-row justify-between sm:items-center gap-3">
                      <div>
                        <span className="text-xs font-bold text-[#2C2C2A] uppercase tracking-wider block">
                          Mapping Permissions for: <span className="text-[#1D9E75]">{currentRole.name}</span>
                        </span>
                        <span className="text-[10px] text-[#5F5E5A] mt-0.5 block italic">{currentRole.description}</span>
                      </div>

                      {/* Bulk actions */}
                      <div className="flex flex-wrap gap-1.5 text-[10px] font-bold">
                        <button
                          type="button"
                          onClick={() => {
                            setRoles(prev => prev.map(r => {
                              if (r.id === selectedRoleId) {
                                return {
                                  ...r,
                                  permissions: r.permissions.map(p => ({ ...p, read: true, create: true, update: true, delete: true }))
                                };
                              }
                              return r;
                            }));
                          }}
                          className="px-2.5 py-1 border border-[#D3D1C7] bg-white rounded hover:bg-slate-50 cursor-pointer"
                        >
                          Check All
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setRoles(prev => prev.map(r => {
                              if (r.id === selectedRoleId) {
                                return {
                                  ...r,
                                  permissions: r.permissions.map(p => ({ ...p, read: false, create: false, update: false, delete: false }))
                                };
                              }
                              return r;
                            }));
                          }}
                          className="px-2.5 py-1 border border-[#D3D1C7] bg-white rounded hover:bg-slate-50 text-red-600 cursor-pointer"
                        >
                          Uncheck All
                        </button>
                      </div>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse" id="roles-matrix-table">
                        <thead>
                          <tr className="bg-[#F1EFE8]/15 border-b border-[#D3D1C7]/80 text-[10px] font-sans font-bold text-[#5F5E5A] uppercase tracking-wider">
                            <th className="p-3 pl-4">Resource / System Module</th>
                            <th className="p-3 text-center w-20">Read</th>
                            <th className="p-3 text-center w-20">Create</th>
                            <th className="p-3 text-center w-20">Update</th>
                            <th className="p-3 text-center w-20">Delete</th>
                            <th className="p-3 text-right pr-4 w-24">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#D3D1C7]/30 text-xs font-sans text-[#2C2C2A]">
                          {currentRole.permissions.map((perm) => (
                            <tr key={perm.resource} className="hover:bg-slate-50/50 transition-colors">
                              <td className="p-3 pl-4 font-semibold text-slate-700">{perm.resource}</td>
                              
                              {/* Read */}
                              <td className="p-3 text-center">
                                <input
                                  type="checkbox"
                                  checked={perm.read}
                                  onChange={() => handleTogglePermission(currentRole.id, perm.resource, 'read')}
                                  className="w-5 h-5 rounded border-[#D3D1C7] text-[#1D9E75] focus:ring-[#1D9E75] cursor-pointer accent-[#1D9E75]"
                                />
                              </td>

                              {/* Create */}
                              <td className="p-3 text-center">
                                <input
                                  type="checkbox"
                                  checked={perm.create}
                                  onChange={() => handleTogglePermission(currentRole.id, perm.resource, 'create')}
                                  className="w-5 h-5 rounded border-[#D3D1C7] text-[#1D9E75] focus:ring-[#1D9E75] cursor-pointer accent-[#1D9E75]"
                                />
                              </td>

                              {/* Update */}
                              <td className="p-3 text-center">
                                <input
                                  type="checkbox"
                                  checked={perm.update}
                                  onChange={() => handleTogglePermission(currentRole.id, perm.resource, 'update')}
                                  className="w-5 h-5 rounded border-[#D3D1C7] text-[#1D9E75] focus:ring-[#1D9E75] cursor-pointer accent-[#1D9E75]"
                                />
                              </td>

                              {/* Delete */}
                              <td className="p-3 text-center">
                                <input
                                  type="checkbox"
                                  checked={perm.delete}
                                  onChange={() => handleTogglePermission(currentRole.id, perm.resource, 'delete')}
                                  className="w-5 h-5 rounded border-[#D3D1C7] text-[#1D9E75] focus:ring-[#1D9E75] cursor-pointer accent-[#1D9E75]"
                                />
                              </td>

                              {/* Actions (Row toggle) */}
                              <td className="p-3 text-right pr-4">
                                <div className="flex justify-end gap-1 text-[9px] font-bold uppercase">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setRoles(prev => prev.map(r => {
                                        if (r.id === selectedRoleId) {
                                          return {
                                            ...r,
                                            permissions: r.permissions.map(p => p.resource === perm.resource ? { ...p, read: true, create: true, update: true, delete: true } : p)
                                          };
                                        }
                                        return r;
                                      }));
                                    }}
                                    className="px-1.5 py-0.5 border border-[#D3D1C7]/60 bg-white rounded hover:bg-slate-50 text-slate-600 cursor-pointer"
                                  >
                                    All
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setRoles(prev => prev.map(r => {
                                        if (r.id === selectedRoleId) {
                                          return {
                                            ...r,
                                            permissions: r.permissions.map(p => p.resource === perm.resource ? { ...p, read: false, create: false, update: false, delete: false } : p)
                                          };
                                        }
                                        return r;
                                      }));
                                    }}
                                    className="px-1.5 py-0.5 border border-[#D3D1C7]/60 bg-white rounded hover:bg-slate-50 text-slate-400 cursor-pointer"
                                  >
                                    None
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'workflows' && (
        <div className="space-y-6" id="workflows-tab-root">
          <div className="bg-white p-5 rounded-xl border border-[#D3D1C7] shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <span className="text-xs font-bold text-[#2C2C2A] uppercase tracking-wider block">Approval Workflows Configuration</span>
              <span className="text-xs text-[#5F5E5A]">Configure multi-stage approval chains, custom variance-based routing thresholds, and veto actions.</span>
            </div>
            <button
              type="button"
              onClick={() => {
                setIsCreatingWorkflow(true);
                setNewWfName('');
                setNewWfEntityType('ProfitabilityAnalysis');
                setNewWfStages([
                  { id: 'stg-new-1', name: 'Transport Lead Approval', variancePercent: 10, role: 'Transport Lead' },
                  { id: 'stg-new-2', name: 'Sourcing, Transport and PIM Manager Approval', variancePercent: 20, role: 'Sourcing, Transport and PIM Manager' },
                  { id: 'stg-new-3', name: 'Supply Chain Director Approval', variancePercent: 100, role: 'Supply Chain Director' }
                ]);
              }}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-[#1D9E75] hover:bg-[#1D9E75]/90 text-white rounded-lg text-xs font-sans font-semibold cursor-pointer shadow-sm transition-all"
            >
              <Plus className="w-3.5 h-3.5" /> New Workflow
            </button>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
            
            {/* Left Column: Workflows List */}
            <div className="xl:col-span-1 bg-white p-4 rounded-xl border border-[#D3D1C7] shadow-sm flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Workflows</span>
                <span className="text-[10px] font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">{approvalWorkflows.length} Loaded</span>
              </div>

              {/* Search */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-[#5F5E5A] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search workflows..."
                  value={searchWorkflowQuery}
                  onChange={(e) => setSearchWorkflowQuery(e.target.value)}
                  className="w-full h-8 pl-8 pr-2.5 rounded border border-[#D3D1C7] bg-white font-sans text-xs focus:outline-none focus:ring-1 focus:ring-[#1D9E75]"
                />
              </div>

              {/* List */}
              <div className="space-y-2 max-h-[480px] overflow-y-auto pr-1">
                {filteredWorkflows.length === 0 ? (
                  <div className="p-4 text-center text-xs text-[#5F5E5A] italic">No workflows found.</div>
                ) : (
                  filteredWorkflows.map((wf) => {
                    const isSelected = selectedWorkflowId === wf.id && !isCreatingWorkflow;
                    return (
                      <div
                        key={wf.id}
                        onClick={() => {
                          setSelectedWorkflowId(wf.id);
                          setIsCreatingWorkflow(false);
                        }}
                        className={`p-3.5 rounded-lg border text-left cursor-pointer transition-all ${
                          isSelected
                            ? 'border-[#1D9E75] bg-[#1D9E75]/5 ring-1 ring-[#1D9E75]'
                            : 'border-[#D3D1C7]/60 hover:bg-[#F1EFE8]/30 bg-white'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <span className="font-sans font-bold text-[#2C2C2A] text-xs truncate max-w-[130px]">{wf.name}</span>
                          <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold uppercase ${
                            wf.status === 'Active' ? 'bg-[#1D9E75]/10 text-[#1D9E75]' : 'bg-slate-100 text-slate-400'
                          }`}>
                            {wf.status}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-[10px] text-[#5F5E5A]">
                          <span className="font-mono font-medium opacity-75">{wf.entityType}</span>
                          <span className="font-semibold">{wf.stages.length} Stages</span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Right Column: Workflow Details/Creator Panel */}
            <div className="xl:col-span-3">
              
              {isCreatingWorkflow ? (
                /* --- Create Workflow Form --- */
                <form onSubmit={handleSaveNewWorkflow} className="bg-white p-5 rounded-xl border border-[#1D9E75] shadow-sm space-y-5">
                  <div className="border-b border-[#D3D1C7] pb-3 flex items-center justify-between">
                    <div>
                      <h3 className="text-xs font-bold text-[#2C2C2A] uppercase tracking-wide">Create New Approval Workflow</h3>
                      <p className="text-[10px] text-[#5F5E5A] mt-0.5">Design a sequential role-based approval chain with custom threshold limits</p>
                    </div>
                    <span className="text-[10px] bg-[#1D9E75]/10 text-[#1D9E75] font-bold px-2.5 py-1 rounded">DRAFT STATE</span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase">Workflow Name</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g., Profitability Threshold"
                        value={newWfName}
                        onChange={(e) => setNewWfName(e.target.value)}
                        className="h-9 px-3 border border-[#D3D1C7] rounded-lg text-xs"
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase">Process Module Override</label>
                      <select
                        value={newWfEntityType}
                        onChange={(e) => setNewWfEntityType(e.target.value)}
                        className="h-9 px-3 border border-[#D3D1C7] rounded-lg text-xs bg-white cursor-pointer"
                      >
                        <option value="ProfitabilityAnalysis">Profitability Analysis (PA)</option>
                        <option value="WorkAnalysis">Work Analysis & Recommendations</option>
                        <option value="RecruitmentRequest">Recruitment Request</option>
                        <option value="DeliveryJob">Delivery Job & Tracker</option>
                      </select>
                    </div>
                  </div>

                  {/* Stage Editor inside Creator */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between border-b border-[#D3D1C7]/40 pb-1.5">
                      <span className="text-[11px] font-bold text-[#2C2C2A] uppercase">Workflow Approval Stages</span>
                      <button
                        type="button"
                        onClick={handleAddNewWfStage}
                        className="text-[#1D9E75] hover:underline font-bold text-[11px] flex items-center gap-1 cursor-pointer"
                      >
                        <PlusCircle className="w-3.5 h-3.5" /> Add Stage
                      </button>
                    </div>

                    <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                      {newWfStages.map((s, idx) => (
                        <div key={s.id} className="p-3 bg-slate-50 border border-[#D3D1C7]/60 rounded-lg space-y-2 relative flex flex-col gap-2">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-[#2C2C2A] text-xs">Stage {idx + 1}</span>
                            {newWfStages.length > 1 && (
                              <button
                                type="button"
                                onClick={() => handleRemoveNewWfStage(s.id)}
                                className="text-red-500 hover:text-red-700 font-bold text-[10px] cursor-pointer"
                              >
                                Remove
                              </button>
                            )}
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
                            <div className="flex flex-col gap-0.5">
                              <label className="text-[9px] font-bold text-slate-400">Stage Name</label>
                              <input
                                type="text"
                                required
                                value={s.name}
                                onChange={(e) => handleUpdateNewWfStage(s.id, 'name', e.target.value)}
                                className="h-8 px-2 border border-[#D3D1C7] rounded text-xs bg-white"
                              />
                            </div>
                            <div className="flex flex-col gap-0.5">
                              <label className="text-[9px] font-bold text-slate-400">Max Negative Variance (%)</label>
                              <input
                                type="number"
                                placeholder="e.g. 10"
                                value={s.variancePercent !== undefined ? s.variancePercent : ''}
                                onChange={(e) => handleUpdateNewWfStage(s.id, 'variancePercent', e.target.value)}
                                className="h-8 px-2 border border-[#D3D1C7] rounded text-xs bg-white font-mono"
                              />
                            </div>
                            <div className="flex flex-col gap-0.5">
                              <label className="text-[9px] font-bold text-slate-400">Approver Role</label>
                              <select
                                value={s.role}
                                onChange={(e) => handleUpdateNewWfStage(s.id, 'role', e.target.value)}
                                className="h-8 px-2 border border-[#D3D1C7] rounded text-xs bg-white cursor-pointer"
                              >
                                {roles.map(r => (
                                  <option key={r.id} value={r.name}>{r.name}</option>
                                ))}
                              </select>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center justify-between border-t border-[#D3D1C7] pt-4">
                    <button
                      type="button"
                      onClick={() => setIsCreatingWorkflow(false)}
                      className="px-4 py-2 border border-[#D3D1C7] hover:bg-slate-50 rounded-lg text-xs font-semibold text-slate-600 cursor-pointer"
                    >
                      Cancel Draft
                    </button>
                    <button
                      type="submit"
                      className="flex items-center gap-1.5 px-4.5 py-2 bg-[#1D9E75] hover:bg-[#1D9E75]/90 text-white rounded-lg text-xs font-semibold cursor-pointer shadow"
                    >
                      <Save className="w-4 h-4" /> Save Workflow
                    </button>
                  </div>
                </form>
              ) : (
                /* --- View and Edit Selected Workflow --- */
                (() => {
                  const currentWf = approvalWorkflows.find(w => w.id === selectedWorkflowId);
                  if (!currentWf) {
                    return (
                      <div className="bg-white p-8 rounded-xl border border-[#D3D1C7] shadow-sm text-center text-xs text-[#5F5E5A] italic">
                        Please select an approval workflow from the left panel or create a new one.
                      </div>
                    );
                  }

                  return (
                    <div className="bg-white rounded-xl border border-[#D3D1C7] shadow-sm overflow-hidden flex flex-col">
                      
                      {/* Details Header Bar */}
                      <div className="bg-[#F1EFE8]/20 px-5 py-4 border-b border-[#D3D1C7] flex flex-wrap items-center justify-between gap-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-sans font-bold text-sm text-[#2C2C2A]">{currentWf.name}</span>
                            <span className="text-[10px] font-mono bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full uppercase">{currentWf.entityType}</span>
                          </div>
                          <span className="text-[11px] text-[#5F5E5A] block italic">{currentWf.stages.length} Approval stage transitions defined</span>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              const nextStatus = currentWf.status === 'Active' ? 'Inactive' : 'Active';
                              handleUpdateSelectedWorkflowField('status', nextStatus);
                            }}
                            className={`px-3 py-1.5 text-xs font-bold rounded-lg cursor-pointer transition-all ${
                              currentWf.status === 'Active' 
                                ? 'bg-[#1D9E75] text-white' 
                                : 'bg-slate-100 text-slate-400 border border-[#D3D1C7]/60'
                            }`}
                          >
                            {currentWf.status === 'Active' ? 'Active' : 'Inactive'}
                          </button>
                          
                          <button
                            type="button"
                            onClick={() => handleDeleteWorkflow(currentWf.id)}
                            className="p-1.5 border border-[#D3D1C7] text-slate-400 hover:text-red-600 hover:border-red-200 rounded-lg transition-colors cursor-pointer"
                            title="Delete Workflow"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {/* Sticky action bar */}
                      <div className="px-5 py-2.5 bg-slate-50 border-b border-[#D3D1C7]/40 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={handleRevertSelectedWorkflow}
                            className="flex items-center gap-1 px-3 py-1.5 border border-[#D3D1C7] bg-white rounded hover:bg-slate-50 text-[11px] font-semibold text-slate-600 cursor-pointer"
                          >
                            <RotateCcw className="w-3.5 h-3.5" /> Revert
                          </button>
                          <button
                            type="button"
                            onClick={() => alert('Workflow stages and configuration successfully saved!')}
                            className="flex items-center gap-1 px-3.5 py-1.5 bg-[#1D9E75] hover:bg-[#1D9E75]/90 text-white rounded text-[11px] font-semibold cursor-pointer shadow-sm"
                          >
                            <Save className="w-3.5 h-3.5" /> Save Changes
                          </button>
                        </div>
                        <span className="text-[10px] text-[#5F5E5A] italic hidden sm:inline">Save here stays pinned while the stage list scrolls.</span>
                      </div>

                      {/* Stages list container */}
                      <div className="p-5 space-y-4 max-h-[420px] overflow-y-auto scrollbar-thin">
                        {currentWf.stages.length === 0 ? (
                          <div className="p-8 text-center border-2 border-dashed border-[#D3D1C7]/60 rounded-xl text-xs text-[#5F5E5A]">
                            No stages defined. Click the button below to add your first workflow stage.
                          </div>
                        ) : (
                          currentWf.stages.map((s, idx) => (
                            <div key={s.id} className="p-4 bg-slate-50 border border-[#D3D1C7]/60 rounded-xl space-y-3 relative">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <span className="w-6 h-6 rounded-full bg-[#1D9E75]/10 text-[#1D9E75] flex items-center justify-center font-bold text-xs">{idx + 1}</span>
                                  <span className="font-bold text-[#2C2C2A] text-xs">Approval Stage {idx + 1}</span>
                                </div>
                                
                                <div className="flex items-center gap-1">
                                  <button 
                                    type="button"
                                    disabled={idx === 0}
                                    onClick={() => handleMoveStageInSelectedWorkflow(idx, 'up')}
                                    className="p-1 text-slate-400 hover:text-slate-600 disabled:opacity-30 cursor-pointer"
                                    title="Move stage up"
                                  >
                                    <ArrowUp className="w-4 h-4" />
                                  </button>
                                  <button 
                                    type="button"
                                    disabled={idx === currentWf.stages.length - 1}
                                    onClick={() => handleMoveStageInSelectedWorkflow(idx, 'down')}
                                    className="p-1 text-slate-400 hover:text-slate-600 disabled:opacity-30 cursor-pointer"
                                    title="Move stage down"
                                  >
                                    <ArrowDown className="w-4 h-4" />
                                  </button>
                                  <button 
                                    type="button"
                                    onClick={() => handleRemoveStageFromSelectedWorkflow(s.id)}
                                    className="p-1 text-slate-400 hover:text-red-600 cursor-pointer ml-1"
                                    title="Remove stage"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                <div className="flex flex-col gap-1">
                                  <label className="text-[10px] font-bold text-slate-500 uppercase">Stage Name</label>
                                  <input 
                                    type="text"
                                    value={s.name}
                                    onChange={(e) => handleUpdateStageInSelectedWorkflow(s.id, 'name', e.target.value)}
                                    className="h-8 px-2 border border-[#D3D1C7] rounded bg-white text-xs"
                                  />
                                </div>

                                <div className="flex flex-col gap-1">
                                  <label className="text-[10px] font-bold text-slate-500 uppercase">Max Negative Variance (%)</label>
                                  <input 
                                    type="number"
                                    placeholder="Optional"
                                    value={s.variancePercent !== undefined ? s.variancePercent : ''}
                                    onChange={(e) => handleUpdateStageInSelectedWorkflow(s.id, 'variancePercent', e.target.value)}
                                    className="h-8 px-2 border border-[#D3D1C7] rounded bg-white text-xs font-mono font-medium"
                                  />
                                </div>

                                <div className="flex flex-col gap-1">
                                  <label className="text-[10px] font-bold text-slate-500 uppercase">Approver Role</label>
                                  <select
                                    value={s.role}
                                    onChange={(e) => handleUpdateStageInSelectedWorkflow(s.id, 'role', e.target.value)}
                                    className="h-8 px-2 border border-[#D3D1C7] rounded bg-white text-xs cursor-pointer focus:outline-none focus:ring-1 focus:ring-[#1D9E75]"
                                  >
                                    {roles.map(r => (
                                      <option key={r.id} value={r.name}>{r.name}</option>
                                    ))}
                                  </select>
                                </div>
                              </div>
                              
                              {/* Dynamic help description tailored specifically to their profitability rule! */}
                              {currentWf.id === 'wf-1' && s.variancePercent !== undefined && (
                                <div className="text-[10px] text-[#1D9E75] font-medium flex items-center gap-1.5 bg-[#1D9E75]/5 px-2.5 py-1 rounded border border-[#1D9E75]/15">
                                  <Sparkles className="w-3 h-3 text-[#1D9E75]" />
                                  <span>
                                    Rule Match: Negative variance 
                                    {idx === 0 ? ` ≤ ${s.variancePercent}%: ${s.role} approves` : ''}
                                    {idx === 1 ? ` between ${currentWf.stages[0]?.variancePercent || 10}% and ${s.variancePercent}%: ${s.role} approves` : ''}
                                    {idx === 2 ? ` > ${currentWf.stages[1]?.variancePercent || 20}%: ${s.role} approves` : ''}
                                  </span>
                                </div>
                              )}
                            </div>
                          ))
                        )}

                        <button
                          onClick={handleAddStageToSelectedWorkflow}
                          className="w-full py-2.5 border-2 border-dashed border-[#D3D1C7] hover:border-[#1D9E75] hover:bg-[#1D9E75]/5 text-[#5F5E5A] hover:text-[#1D9E75] rounded-xl flex items-center justify-center gap-1 text-xs font-semibold cursor-pointer transition-all"
                        >
                          <PlusCircle className="w-4 h-4" /> Add Stage to Chain
                        </button>
                      </div>

                      {/* Profitability Rules Guide Banner */}
                      {currentWf.id === 'wf-1' && (
                        <div className="mx-5 mb-5 p-4 bg-[#1D9E75]/5 border border-[#1D9E75]/20 rounded-xl space-y-2">
                          <div className="flex items-center gap-2">
                            <Sparkles className="w-4 h-4 text-[#1D9E75]" />
                            <span className="text-xs font-bold text-[#1D9E75] uppercase tracking-wider">Business Rule Guide: Profitability Threshold</span>
                          </div>
                          <p className="text-[11px] text-[#2C2C2A] leading-relaxed">
                            These tiers regulate commercial transport requisition approvals before issuing a work order:
                          </p>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-[10px] font-sans">
                            <div className="bg-white p-2 rounded border border-[#1D9E75]/10">
                              <span className="font-bold text-[#1D9E75]">Variance 0% or positive:</span>
                              <p className="text-slate-500">Proceed directly (automatic approval).</p>
                            </div>
                            <div className="bg-white p-2 rounded border border-[#1D9E75]/10">
                              <span className="font-bold text-[#1D9E75]">Negative Variance ≤10%:</span>
                              <p className="text-slate-500">Transport Lead Role approves.</p>
                            </div>
                            <div className="bg-white p-2 rounded border border-[#1D9E75]/10">
                              <span className="font-bold text-[#1D9E75]">Variance 10% – 20%:</span>
                              <p className="text-slate-500">Sourcing, Transport and PIM Manager Role approves.</p>
                            </div>
                            <div className="bg-white p-2 rounded border border-[#1D9E75]/10">
                              <span className="font-bold text-[#1D9E75]">Variance &gt;20%:</span>
                              <p className="text-slate-500">Supply Chain Director Role approves.</p>
                            </div>
                          </div>
                          <div className="text-[10px] text-red-700 font-bold bg-red-50 p-2 rounded border border-red-100 flex items-center gap-1">
                            <AlertTriangle className="w-3.5 h-3.5 text-red-600 shrink-0" />
                            <span>Strict Control Guard: All approvals must be fully documented in-system before issuing work orders.</span>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })()
              )}

            </div>
          </div>

          {/* Operational toggles card kept below the workflows dashboard */}
          <div className="bg-white p-6 rounded-xl border border-[#D3D1C7] shadow-sm space-y-4 font-sans text-xs">
            <h3 className="text-xs font-bold text-[#2C2C2A] uppercase border-b border-[#D3D1C7] pb-2">Global Routing Guardrails</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-start justify-between gap-4 p-3 rounded-lg border border-[#D3D1C7]/40 bg-slate-50/50">
                <div className="space-y-1">
                  <span className="font-bold text-[#2C2C2A]">Two-Tier Coordinator Sign-Off</span>
                  <p className="text-[#5F5E5A] text-[11px]">Require second administrator confirmation when setting extreme/custom geofences.</p>
                </div>
                <button 
                  type="button"
                  onClick={() => handleWorkflowToggle('requireDoubleSignOff')}
                  className="text-slate-600 hover:text-slate-900 cursor-pointer focus:outline-none"
                >
                  {workflows.requireDoubleSignOff ? <ToggleRight className="w-10 h-10 text-[#1D9E75]" /> : <ToggleLeft className="w-10 h-10 text-slate-400" />}
                </button>
              </div>

              <div className="flex items-start justify-between gap-4 p-3 rounded-lg border border-[#D3D1C7]/40 bg-slate-50/50">
                <div className="space-y-1">
                  <span className="font-bold text-[#2C2C2A]">Supervisor Escalation Trigger</span>
                  <p className="text-[#5F5E5A] text-[11px]">Auto-escalate transport tasks to regional coordinator if ground supervisor is unreachable for 3 hours.</p>
                </div>
                <button 
                  type="button"
                  onClick={() => handleWorkflowToggle('autoEscalateSupervisor')}
                  className="text-slate-600 hover:text-slate-900 cursor-pointer focus:outline-none"
                >
                  {workflows.autoEscalateSupervisor ? <ToggleRight className="w-10 h-10 text-[#1D9E75]" /> : <ToggleLeft className="w-10 h-10 text-slate-400" />}
                </button>
              </div>

              <div className="flex items-start justify-between gap-4 p-3 rounded-lg border border-[#D3D1C7]/40 bg-slate-50/50">
                <div className="space-y-1">
                  <span className="font-bold text-[#2C2C2A]">Auto Delivery Dispatch</span>
                  <p className="text-[#5F5E5A] text-[11px]">Automatically build and dispatch active Loading Jobs onto the Delivery Tracker the moment a Profitability Analysis (PA) is approved.</p>
                </div>
                <button 
                  type="button"
                  onClick={() => handleWorkflowToggle('autoDeployDeliveryOnApproval')}
                  className="text-slate-600 hover:text-slate-900 cursor-pointer focus:outline-none"
                >
                  {workflows.autoDeployDeliveryOnApproval ? <ToggleRight className="w-10 h-10 text-[#1D9E75]" /> : <ToggleLeft className="w-10 h-10 text-slate-400" />}
                </button>
              </div>

              <div className="flex items-start justify-between gap-4 p-3 rounded-lg border border-[#D3D1C7]/40 bg-slate-50/50">
                <div className="space-y-1">
                  <span className="font-bold text-[#2C2C2A]">Block Under-Threshold Quotes</span>
                  <p className="text-[#5F5E5A] text-[11px]">Prevent procurement officers from saving commercial quotes that bypass standard multiplier rules entirely.</p>
                </div>
                <button 
                  type="button"
                  onClick={() => handleWorkflowToggle('blockLowerThanThreshold')}
                  className="text-slate-600 hover:text-slate-900 cursor-pointer focus:outline-none"
                >
                  {workflows.blockLowerThanThreshold ? <ToggleRight className="w-10 h-10 text-[#1D9E75]" /> : <ToggleLeft className="w-10 h-10 text-slate-400" />}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Database Resetter at bottom */}
      {onResetData && (
        <div className="bg-slate-100/60 p-5 rounded-xl border border-[#D3D1C7] mt-8 flex flex-wrap items-center justify-between gap-4 font-sans text-xs">
          <div className="space-y-1">
            <span className="font-bold text-[#2C2C2A] uppercase text-xs tracking-tight block">System Database Maintenance</span>
            <p className="text-[#5F5E5A] max-w-xl">
              Reset the local application state pool. This wipes active session modifications and restores all vehicles, geofences, and price books to factory original seeds.
            </p>
          </div>
          <button
            onClick={() => {
              if (confirm('Are you sure you want to reset all operational data? This action is irreversible.')) {
                onResetData();
              }
            }}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg font-bold cursor-pointer transition-colors"
          >
            Reset In-Memory Database
          </button>
        </div>
      )}
    </div>
  );
}

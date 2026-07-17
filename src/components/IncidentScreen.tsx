import React, { useState } from 'react';
import { Incident, IncidentLogEntry, MR, Vehicle, Driver, Supplier, ProjectSite } from '../types';
import {
  ShieldAlert,
  Plus,
  X,
  Clock,
  User,
  ArrowUpCircle,
  CheckCircle2,
  AlertTriangle,
  Lock,
  MessageSquarePlus,
  Link2,
  FolderCheck
} from 'lucide-react';

interface IncidentScreenProps {
  incidents: Incident[];
  onSaveIncident: (incident: Incident) => void;
  mrs: MR[];
  vehicles: Vehicle[];
  drivers: Driver[];
  suppliers: Supplier[];
  sites: ProjectSite[];
  prefillMrRef?: string | null;
}

const CURRENT_USER = 'Solomon Tekle';

const TYPES: Incident['type'][] = ['Theft', 'Loss', 'Damage', 'Delay', 'Route Deviation', 'Compliance Breach', 'Documentation Discrepancy'];
const SEVERITIES: Incident['severity'][] = ['Low', 'Medium', 'High', 'Critical'];
const ASSIGNED_ROLES: Incident['assignedRole'][] = ['Security', 'Transport', 'QEHS', 'Supplier Focal', 'Other'];

function blankIncident(nextNum: number, prefillMrRef?: string | null): Incident {
  const today = new Date().toISOString().split('T')[0];
  return {
    id: `INC-2026-${String(nextNum).padStart(3, '0')}`,
    type: 'Damage',
    severity: 'Medium',
    status: 'Open',
    title: '',
    description: '',
    reportedBy: CURRENT_USER,
    reportedDate: today,
    mrRef: prefillMrRef || '',
    vehiclePlate: '',
    driverId: '',
    supplierId: '',
    siteId: '',
    assignedRole: 'Transport',
    assignedTo: '',
    dueDate: '',
    rootCause: '',
    correctiveAction: '',
    escalated: false,
    escalatedTo: '',
    escalatedDate: '',
    resolutionNotes: '',
    closedBy: '',
    closedDate: '',
    log: []
  };
}

function severityColor(severity: Incident['severity']) {
  switch (severity) {
    case 'Critical': return 'bg-red-100 text-red-800 border-red-200';
    case 'High': return 'bg-orange-50 text-orange-800 border-orange-200';
    case 'Medium': return 'bg-amber-50 text-amber-800 border-amber-200';
    default: return 'bg-slate-100 text-slate-600 border-slate-200';
  }
}

function statusColor(status: Incident['status']) {
  switch (status) {
    case 'Open': return 'bg-red-50 text-red-700 border-red-200';
    case 'In Progress': return 'bg-amber-50 text-amber-800 border-amber-200';
    case 'Pending Evidence': return 'bg-orange-50 text-orange-800 border-orange-200';
    case 'Resolved': return 'bg-[#1D9E75]/10 text-[#1D9E75] border-[#1D9E75]/20';
    case 'Closed': return 'bg-slate-100 text-slate-500 border-slate-200';
  }
}

export default function IncidentScreen({
  incidents,
  onSaveIncident,
  mrs,
  vehicles,
  drivers,
  suppliers,
  sites,
  prefillMrRef
}: IncidentScreenProps) {
  const [filterStatus, setFilterStatus] = useState<string>('All');
  const [filterSeverity, setFilterSeverity] = useState<string>('All');
  const [filterType, setFilterType] = useState<string>('All');

  const [selectedCaseId, setSelectedCaseId] = useState<string>('');
  const [draft, setDraft] = useState<Incident | null>(null);
  const [newNote, setNewNote] = useState('');
  const [escalateTarget, setEscalateTarget] = useState('');

  const isDraftNew = draft ? !incidents.some(i => i.id === draft.id) : false;

  const filteredIncidents = incidents.filter(i =>
    (filterStatus === 'All' || i.status === filterStatus) &&
    (filterSeverity === 'All' || i.severity === filterSeverity) &&
    (filterType === 'All' || i.type === filterType)
  ).sort((a, b) => (a.reportedDate < b.reportedDate ? 1 : -1));

  const isOverdue = (incident: Incident) => {
    if (!incident.dueDate || incident.status === 'Closed' || incident.status === 'Resolved') return false;
    return new Date(incident.dueDate) < new Date();
  };

  const openCase = (incident: Incident) => {
    setSelectedCaseId(incident.id);
    setDraft(JSON.parse(JSON.stringify(incident)));
    setNewNote('');
    setEscalateTarget(incident.escalatedTo || '');
  };

  const startNewCase = () => {
    const nextNum = incidents.length + 1;
    const blank = blankIncident(nextNum, prefillMrRef);
    setSelectedCaseId(blank.id);
    setDraft(blank);
    setNewNote('');
    setEscalateTarget('');
  };

  const closePanel = () => {
    setSelectedCaseId('');
    setDraft(null);
  };

  const updateDraft = (field: keyof Incident, value: any) => {
    if (!draft) return;
    setDraft({ ...draft, [field]: value });
  };

  const appendLog = (action: string, comment?: string) => {
    if (!draft) return;
    const entry: IncidentLogEntry = {
      id: `log-${draft.id}-${draft.log.length + 1}-${Date.now()}`,
      timestamp: new Date().toISOString(),
      user: CURRENT_USER,
      action,
      comment: comment || undefined
    };
    return entry;
  };

  const handleSaveCase = (overrides?: Partial<Incident>, logAction?: string, logComment?: string) => {
    if (!draft) return;
    if (!draft.title.trim()) {
      alert('Please provide a short case title before saving.');
      return;
    }

    let updated: Incident = { ...draft, ...(overrides || {}) };

    if (isDraftNew) {
      updated = {
        ...updated,
        log: [
          ...updated.log,
          {
            id: `log-${updated.id}-open-${Date.now()}`,
            timestamp: new Date().toISOString(),
            user: CURRENT_USER,
            action: 'Case opened',
            comment: updated.description || undefined
          }
        ]
      };
    }

    if (logAction) {
      const entry = appendLog(logAction, logComment);
      if (entry) updated = { ...updated, log: [...updated.log, entry] };
    }

    onSaveIncident(updated);
    setDraft(updated);
    setSelectedCaseId(updated.id);
  };

  const handleAddNote = () => {
    if (!newNote.trim()) return;
    handleSaveCase({}, 'Comment added', newNote.trim());
    setNewNote('');
  };

  const handleStatusTransition = (nextStatus: Incident['status']) => {
    if (!draft) return;

    if (nextStatus === 'Resolved' && (!draft.rootCause?.trim() || !draft.correctiveAction?.trim())) {
      alert('Root cause and corrective action must be recorded before a case can be marked Resolved.');
      return;
    }

    if (nextStatus === 'Closed' && !draft.resolutionNotes?.trim()) {
      alert('Resolution notes are required before a case can be closed.');
      return;
    }

    const overrides: Partial<Incident> = { status: nextStatus };
    if (nextStatus === 'Closed') {
      overrides.closedBy = CURRENT_USER;
      overrides.closedDate = new Date().toISOString().split('T')[0];
    }

    handleSaveCase(overrides, `Status changed to ${nextStatus}`);
  };

  const handleEscalate = () => {
    if (!draft) return;
    if (!escalateTarget.trim()) {
      alert('Please specify who this case is being escalated to.');
      return;
    }
    handleSaveCase(
      {
        escalated: true,
        escalatedTo: escalateTarget.trim(),
        escalatedDate: new Date().toISOString().split('T')[0]
      },
      'Escalated',
      `Escalated to ${escalateTarget.trim()}`
    );
  };

  const linkedVehicle = draft ? vehicles.find(v => v.plateNumber === draft.vehiclePlate) : null;
  const linkedSupplier = draft ? suppliers.find(s => s.id === draft.supplierId) : null;
  const linkedDriver = draft ? drivers.find(d => d.id === draft.driverId) : null;
  const linkedSite = draft ? sites.find(s => s.siteId === draft.siteId) : null;

  return (
    <div className="space-y-6 select-none pb-10" id="incident-screen-container">
      {/* Header / KPI strip */}
      <div className="flex flex-wrap items-center justify-between bg-white p-4 rounded-xl border border-[#D3D1C7] gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-red-50 text-red-600 flex items-center justify-center">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-[#2C2C2A]">Incident Management &amp; Investigation</h2>
            <p className="text-[11px] text-[#5F5E5A]">Theft, loss, damage, delay, route deviation, and compliance case tracking</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <select value={filterType} onChange={(e) => setFilterType(e.target.value)} className="h-9 px-3 rounded-lg border border-[#D3D1C7] text-xs font-sans bg-[#F1EFE8]/30">
            <option value="All">All Types</option>
            {TYPES.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
          <select value={filterSeverity} onChange={(e) => setFilterSeverity(e.target.value)} className="h-9 px-3 rounded-lg border border-[#D3D1C7] text-xs font-sans bg-[#F1EFE8]/30">
            <option value="All">All Severities</option>
            {SEVERITIES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="h-9 px-3 rounded-lg border border-[#D3D1C7] text-xs font-sans bg-[#F1EFE8]/30">
            <option value="All">All Statuses</option>
            <option value="Open">Open</option>
            <option value="In Progress">In Progress</option>
            <option value="Pending Evidence">Pending Evidence</option>
            <option value="Resolved">Resolved</option>
            <option value="Closed">Closed</option>
          </select>
          <button
            onClick={startNewCase}
            className="flex items-center gap-1.5 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-sans font-semibold cursor-pointer"
          >
            <Plus className="w-4 h-4" /> New Incident
          </button>
        </div>
      </div>

      {/* Case list */}
      <div className="overflow-x-auto border border-[#D3D1C7]/60 rounded-lg bg-white">
        <table className="w-full text-left border-collapse" id="incident-table">
          <thead>
            <tr className="bg-[#F1EFE8]/45 border-b border-[#D3D1C7]/80 text-[10px] font-sans font-semibold text-[#5F5E5A] uppercase tracking-wider">
              <th className="p-3">Case #</th>
              <th className="p-3">Type</th>
              <th className="p-3">Severity</th>
              <th className="p-3">Status</th>
              <th className="p-3">Linked Job / Vehicle</th>
              <th className="p-3">Assigned To</th>
              <th className="p-3">Reported</th>
              <th className="p-3">Due</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#D3D1C7]/40 text-xs font-sans text-[#2C2C2A]">
            {filteredIncidents.length === 0 && (
              <tr>
                <td colSpan={8} className="p-8 text-center text-[#5F5E5A]">No incidents match the selected filters.</td>
              </tr>
            )}
            {filteredIncidents.map(incident => (
              <tr
                key={incident.id}
                onClick={() => openCase(incident)}
                className={`cursor-pointer hover:bg-[#F1EFE8]/20 transition-all ${selectedCaseId === incident.id ? 'bg-emerald-50/40' : ''}`}
              >
                <td className="p-3 font-mono font-bold text-[#2C2C2A]">{incident.id}</td>
                <td className="p-3 text-slate-600">{incident.type}</td>
                <td className="p-3">
                  <span className={`px-2 py-0.5 rounded border text-[10px] font-bold ${severityColor(incident.severity)}`}>{incident.severity}</span>
                </td>
                <td className="p-3">
                  <span className={`px-2 py-0.5 rounded border text-[10px] font-bold ${statusColor(incident.status)}`}>{incident.status}</span>
                </td>
                <td className="p-3 text-slate-600">
                  {incident.mrRef || '—'}{incident.vehiclePlate ? ` / ${incident.vehiclePlate}` : ''}
                </td>
                <td className="p-3 text-slate-600">{incident.assignedTo || '—'}</td>
                <td className="p-3 font-mono text-slate-500">{incident.reportedDate}</td>
                <td className={`p-3 font-mono ${isOverdue(incident) ? 'text-red-600 font-bold' : 'text-slate-500'}`}>
                  {incident.dueDate || '—'}
                  {isOverdue(incident) && <AlertTriangle className="w-3 h-3 inline ml-1 -mt-0.5" />}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Case detail panel */}
      {draft && (
        <div className="space-y-6 bg-white p-6 rounded-xl border border-[#D3D1C7] shadow-sm">
          <div className="flex items-center justify-between border-b border-[#D3D1C7] pb-3">
            <div className="flex items-center gap-3">
              <span className="font-mono font-bold text-sm text-[#2C2C2A]">{draft.id}</span>
              <span className={`px-2 py-0.5 rounded border text-[10px] font-bold ${severityColor(draft.severity)}`}>{draft.severity}</span>
              <span className={`px-2 py-0.5 rounded border text-[10px] font-bold ${statusColor(draft.status)}`}>{draft.status}</span>
              {draft.escalated && (
                <span className="px-2 py-0.5 rounded border text-[10px] font-bold bg-purple-50 text-purple-700 border-purple-200 flex items-center gap-1">
                  <ArrowUpCircle className="w-3 h-3" /> Escalated to {draft.escalatedTo}
                </span>
              )}
            </div>
            <button onClick={closePanel} className="text-[#5F5E5A] hover:text-[#2C2C2A]">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left: case fields */}
            <div className="lg:col-span-2 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-sans">
                <div className="flex flex-col gap-1 sm:col-span-2">
                  <label className="text-[11px] text-[#5F5E5A] font-medium uppercase tracking-tight">Case Title</label>
                  <input
                    type="text"
                    value={draft.title}
                    onChange={(e) => updateDraft('title', e.target.value)}
                    placeholder="Short summary of what happened"
                    className="h-9 px-3 border border-[#D3D1C7] rounded-lg"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[11px] text-[#5F5E5A] font-medium uppercase tracking-tight">Type</label>
                  <select value={draft.type} onChange={(e) => updateDraft('type', e.target.value)} className="h-9 px-3 border border-[#D3D1C7] rounded-lg">
                    {TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[11px] text-[#5F5E5A] font-medium uppercase tracking-tight">Severity</label>
                  <select value={draft.severity} onChange={(e) => updateDraft('severity', e.target.value)} className="h-9 px-3 border border-[#D3D1C7] rounded-lg">
                    {SEVERITIES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>

                <div className="flex flex-col gap-1 sm:col-span-2">
                  <label className="text-[11px] text-[#5F5E5A] font-medium uppercase tracking-tight">Description</label>
                  <textarea
                    value={draft.description}
                    onChange={(e) => updateDraft('description', e.target.value)}
                    rows={3}
                    className="px-3 py-2 border border-[#D3D1C7] rounded-lg"
                  />
                </div>
              </div>

              {/* Linkage */}
              <div className="space-y-2">
                <div className="flex items-center gap-1.5 text-[11px] font-bold text-[#5F5E5A] uppercase tracking-tight">
                  <Link2 className="w-3.5 h-3.5" /> Linked Records
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs font-sans">
                  <div className="flex flex-col gap-1">
                    <label className="text-[11px] text-[#5F5E5A] font-medium uppercase tracking-tight">MR / Trip Ref</label>
                    <select value={draft.mrRef || ''} onChange={(e) => updateDraft('mrRef', e.target.value)} className="h-9 px-3 border border-[#D3D1C7] rounded-lg">
                      <option value="">-- None --</option>
                      {mrs.map(m => <option key={m.mrNumber} value={m.mrNumber}>{m.mrNumber}</option>)}
                    </select>
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[11px] text-[#5F5E5A] font-medium uppercase tracking-tight">Vehicle</label>
                    <select value={draft.vehiclePlate || ''} onChange={(e) => updateDraft('vehiclePlate', e.target.value)} className="h-9 px-3 border border-[#D3D1C7] rounded-lg">
                      <option value="">-- None --</option>
                      {vehicles.map(v => <option key={v.plateNumber} value={v.plateNumber}>{v.plateNumber}</option>)}
                    </select>
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[11px] text-[#5F5E5A] font-medium uppercase tracking-tight">Driver</label>
                    <select value={draft.driverId || ''} onChange={(e) => updateDraft('driverId', e.target.value)} className="h-9 px-3 border border-[#D3D1C7] rounded-lg">
                      <option value="">-- None --</option>
                      {drivers.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                    </select>
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[11px] text-[#5F5E5A] font-medium uppercase tracking-tight">Supplier</label>
                    <select value={draft.supplierId || ''} onChange={(e) => updateDraft('supplierId', e.target.value)} className="h-9 px-3 border border-[#D3D1C7] rounded-lg">
                      <option value="">-- None --</option>
                      {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[11px] text-[#5F5E5A] font-medium uppercase tracking-tight">Site</label>
                    <select value={draft.siteId || ''} onChange={(e) => updateDraft('siteId', e.target.value)} className="h-9 px-3 border border-[#D3D1C7] rounded-lg">
                      <option value="">-- None --</option>
                      {sites.map(s => <option key={s.siteId} value={s.siteId}>{s.siteName}</option>)}
                    </select>
                  </div>
                </div>
                {(linkedVehicle || linkedSupplier || linkedDriver || linkedSite) && (
                  <p className="text-[10px] text-[#5F5E5A] italic">
                    {linkedSupplier ? `${linkedSupplier.name} · ` : ''}
                    {linkedVehicle ? `${linkedVehicle.model} (${linkedVehicle.tonCapacity}T) · ` : ''}
                    {linkedDriver ? `${linkedDriver.phone} · ` : ''}
                    {linkedSite ? linkedSite.town : ''}
                  </p>
                )}
              </div>

              {/* Assignment */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs font-sans">
                <div className="flex flex-col gap-1">
                  <label className="text-[11px] text-[#5F5E5A] font-medium uppercase tracking-tight">Assigned Role</label>
                  <select value={draft.assignedRole} onChange={(e) => updateDraft('assignedRole', e.target.value)} className="h-9 px-3 border border-[#D3D1C7] rounded-lg">
                    {ASSIGNED_ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[11px] text-[#5F5E5A] font-medium uppercase tracking-tight">Assigned To</label>
                  <input type="text" value={draft.assignedTo} onChange={(e) => updateDraft('assignedTo', e.target.value)} className="h-9 px-3 border border-[#D3D1C7] rounded-lg" placeholder="Name" />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[11px] text-[#5F5E5A] font-medium uppercase tracking-tight">Due Date</label>
                  <input type="date" value={draft.dueDate || ''} onChange={(e) => updateDraft('dueDate', e.target.value)} className="h-9 px-3 border border-[#D3D1C7] rounded-lg" />
                </div>
              </div>

              {/* Root cause / corrective action */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-sans">
                <div className="flex flex-col gap-1">
                  <label className="text-[11px] text-[#5F5E5A] font-medium uppercase tracking-tight">Root Cause</label>
                  <textarea value={draft.rootCause || ''} onChange={(e) => updateDraft('rootCause', e.target.value)} rows={2} className="px-3 py-2 border border-[#D3D1C7] rounded-lg" />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[11px] text-[#5F5E5A] font-medium uppercase tracking-tight">Corrective Action</label>
                  <textarea value={draft.correctiveAction || ''} onChange={(e) => updateDraft('correctiveAction', e.target.value)} rows={2} className="px-3 py-2 border border-[#D3D1C7] rounded-lg" />
                </div>
              </div>

              {/* Escalation */}
              <div className="flex items-end gap-3 text-xs font-sans bg-purple-50/40 border border-purple-100 rounded-lg p-3">
                <div className="flex flex-col gap-1 flex-1">
                  <label className="text-[11px] text-purple-800 font-medium uppercase tracking-tight">Escalate To (Manager / Director)</label>
                  <input
                    type="text"
                    value={escalateTarget}
                    onChange={(e) => setEscalateTarget(e.target.value)}
                    disabled={draft.escalated}
                    placeholder="e.g. ST&PIM Manager"
                    className="h-9 px-3 border border-[#D3D1C7] rounded-lg disabled:bg-slate-100 disabled:text-slate-400"
                  />
                </div>
                <button
                  onClick={handleEscalate}
                  disabled={draft.escalated}
                  className="h-9 px-4 rounded-lg text-xs font-bold text-white bg-purple-600 hover:bg-purple-700 disabled:bg-slate-300 disabled:cursor-not-allowed flex items-center gap-1.5"
                >
                  <ArrowUpCircle className="w-3.5 h-3.5" /> {draft.escalated ? 'Escalated' : 'Escalate'}
                </button>
              </div>

              {/* Resolution notes */}
              <div className="flex flex-col gap-1 text-xs font-sans">
                <label className="text-[11px] text-[#5F5E5A] font-medium uppercase tracking-tight flex items-center gap-1">
                  <Lock className="w-3 h-3" /> Resolution Notes (required to close)
                </label>
                <textarea value={draft.resolutionNotes || ''} onChange={(e) => updateDraft('resolutionNotes', e.target.value)} rows={2} className="px-3 py-2 border border-[#D3D1C7] rounded-lg" />
              </div>

              {/* Action buttons */}
              <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-[#D3D1C7]">
                <button onClick={() => handleSaveCase()} className="px-4 py-2 border border-[#D3D1C7] bg-white hover:bg-[#F1EFE8] rounded-lg text-xs font-sans font-semibold cursor-pointer">
                  Save Case
                </button>
                {draft.status === 'Open' && (
                  <button onClick={() => handleStatusTransition('In Progress')} className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-xs font-sans font-semibold cursor-pointer">
                    Start Investigation
                  </button>
                )}
                {(draft.status === 'Open' || draft.status === 'In Progress') && (
                  <button onClick={() => handleStatusTransition('Pending Evidence')} className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-xs font-sans font-semibold cursor-pointer">
                    Mark Pending Evidence
                  </button>
                )}
                {draft.status === 'Pending Evidence' && (
                  <button onClick={() => handleStatusTransition('In Progress')} className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-xs font-sans font-semibold cursor-pointer">
                    Evidence Received
                  </button>
                )}
                {(draft.status === 'In Progress' || draft.status === 'Pending Evidence') && (
                  <button onClick={() => handleStatusTransition('Resolved')} className="flex items-center gap-1.5 px-4 py-2 bg-[#1D9E75] hover:bg-[#1D9E75]/90 text-white rounded-lg text-xs font-sans font-semibold cursor-pointer">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Mark Resolved
                  </button>
                )}
                {draft.status === 'Resolved' && (
                  <button onClick={() => handleStatusTransition('Closed')} className="flex items-center gap-1.5 px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-sans font-semibold cursor-pointer">
                    <FolderCheck className="w-3.5 h-3.5" /> Close Case
                  </button>
                )}
                {draft.status === 'Closed' && (
                  <span className="text-[11px] text-[#5F5E5A] italic">
                    Closed by {draft.closedBy} on {draft.closedDate}. Case history is preserved and read-only for status.
                  </span>
                )}
              </div>
            </div>

            {/* Right: accountability log */}
            <div className="space-y-3">
              <div className="flex items-center gap-1.5 text-[11px] font-bold text-[#5F5E5A] uppercase tracking-tight">
                <Clock className="w-3.5 h-3.5" /> Accountability Log
              </div>
              <div className="border border-[#D3D1C7]/60 rounded-lg divide-y divide-[#D3D1C7]/40 max-h-[420px] overflow-y-auto bg-[#F1EFE8]/20">
                {draft.log.length === 0 && (
                  <p className="p-3 text-[11px] text-[#5F5E5A] italic">No history yet — save this case to open the log.</p>
                )}
                {[...draft.log].reverse().map(entry => (
                  <div key={entry.id} className="p-3 text-[11px] font-sans">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-[#2C2C2A] flex items-center gap-1"><User className="w-3 h-3" /> {entry.user}</span>
                      <span className="text-[#5F5E5A] font-mono">{new Date(entry.timestamp).toLocaleString()}</span>
                    </div>
                    <div className="text-[#1D9E75] font-semibold mt-0.5">{entry.action}</div>
                    {entry.comment && <div className="text-[#5F5E5A] mt-0.5">{entry.comment}</div>}
                  </div>
                ))}
              </div>

              <div className="flex flex-col gap-2">
                <textarea
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  rows={2}
                  placeholder="Add a note to the case history..."
                  className="px-3 py-2 border border-[#D3D1C7] rounded-lg text-xs font-sans"
                  disabled={isDraftNew}
                />
                <button
                  onClick={handleAddNote}
                  disabled={isDraftNew || !newNote.trim()}
                  className="flex items-center justify-center gap-1.5 px-3 py-2 border border-[#D3D1C7] bg-white hover:bg-[#F1EFE8] rounded-lg text-xs font-sans font-semibold cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <MessageSquarePlus className="w-3.5 h-3.5" /> Add Note
                </button>
                {isDraftNew && (
                  <p className="text-[10px] text-[#5F5E5A] italic">Save the case first to start its accountability log.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

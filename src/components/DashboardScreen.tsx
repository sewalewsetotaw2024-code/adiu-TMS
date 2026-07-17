import React, { useState } from 'react';
import { MR, ProfitabilityAnalysis, DeliveryJob, WccClosure, QuoteComparisonRow } from '../types';
import { 
  FileText, 
  TrendingUp, 
  Truck, 
  FolderCheck, 
  ArrowUpRight, 
  User, 
  AlertTriangle,
  Calendar,
  Layers,
  MapPin,
  ShieldAlert,
  Download,
  RefreshCw,
  Clock,
  TrendingDown,
  CheckCircle,
  CheckCircle2,
  DollarSign,
  Activity,
  Award,
  ChevronRight,
  FileCheck,
  Search,
  Bell,
  Navigation,
  CheckSquare
} from 'lucide-react';

interface DashboardScreenProps {
  mrs: MR[];
  pas: ProfitabilityAnalysis[];
  deliveries: DeliveryJob[];
  wccClosures: WccClosure[];
  setScreen: (screen: string) => void;
  setSelectedMrRef?: (mrRef: string) => void;
}

export default function DashboardScreen({ 
  mrs, 
  pas, 
  deliveries, 
  wccClosures, 
  setScreen,
  setSelectedMrRef
}: DashboardScreenProps) {

  // Local Filter States
  const [selectedDate, setSelectedDate] = useState<string>('All');
  const [selectedProject, setSelectedProject] = useState<string>('All');
  const [selectedSupplier, setSelectedSupplier] = useState<string>('All');
  const [selectedSite, setSelectedSite] = useState<string>('All');
  const [selectedVehicle, setSelectedVehicle] = useState<string>('All');
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [hoveredTrendDay, setHoveredTrendDay] = useState<number | null>(null);

  // Trigger brief reload animation
  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
    }, 600);
  };

  const handleExport = () => {
    alert("Exporting operations dashboard data as PDF Summary & Microsoft Excel Sheet...");
  };

  const handleReviewPa = (mrRef: string) => {
    if (setSelectedMrRef) {
      setSelectedMrRef(mrRef);
    }
    setScreen('profitability');
  };

  // Status badge styling helper
  const getStatusStyle = (status: string) => {
    const s = status.toLowerCase();
    if (s === 'delivered' || s === 'approved' || s === 'validated') {
      return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    }
    if (s === 'in transit' || s === 'dispatched' || s === 'handed over') {
      return 'bg-sky-50 text-sky-700 border-sky-200';
    }
    if (s === 'pending' || s === 'received' || s === 'analysed' || s === 'applied' || s === 'loading') {
      return 'bg-amber-50 text-amber-700 border-amber-200';
    }
    if (s === 'rejected' || s === 'blacklisted' || s === 'negotiation required' || s === 'mismatch' || s === 'failed') {
      return 'bg-red-50 text-red-700 border-red-200';
    }
    return 'bg-slate-50 text-slate-600 border-slate-200';
  };

  // Extract unique filter lists dynamically
  const uniqueDates = Array.from(new Set(mrs.map(m => m.requestDate))).filter(Boolean).sort();
  const uniqueProjects = Array.from(new Set(mrs.map(m => m.vendorClient))).filter(Boolean);
  const uniqueSuppliers = ['sup-01', 'sup-02']; // sup-01: Abyssinia, sup-02: Lucy
  const uniqueSites = Array.from(new Set(deliveries.map(d => d.siteId))).filter(Boolean);
  const uniqueVehicles = ['3-ton', '5-ton', '10-ton', 'Trailer'];

  // Apply filters in cascades
  const filteredMrs = mrs.filter(mr => {
    const item = mr.lineItems[0];
    const dateMatch = selectedDate === 'All' || mr.requestDate === selectedDate;
    const projectMatch = selectedProject === 'All' || mr.vendorClient === selectedProject;
    const siteMatch = selectedSite === 'All' || item?.siteId === selectedSite;
    const vehicleMatch = selectedVehicle === 'All' || item?.truck === selectedVehicle;
    return dateMatch && projectMatch && siteMatch && vehicleMatch;
  });

  const filteredPas = pas.filter(pa => {
    const mr = mrs.find(m => m.mrNumber === pa.mrRef);
    if (!mr) return true;
    const item = mr.lineItems[0];
    
    const dateMatch = selectedDate === 'All' || pa.date === selectedDate;
    const projectMatch = selectedProject === 'All' || mr.vendorClient === selectedProject;
    const supplierMatch = selectedSupplier === 'All' || pa.selectedSupplierId === selectedSupplier;
    const siteMatch = selectedSite === 'All' || item?.siteId === selectedSite;
    const vehicleMatch = selectedVehicle === 'All' || item?.truck === selectedVehicle;
    return dateMatch && projectMatch && supplierMatch && siteMatch && vehicleMatch;
  });

  const filteredDeliveries = deliveries.filter(d => {
    const mr = mrs.find(m => m.mrNumber === d.mrRef);
    const item = mr?.lineItems[0];
    
    const dateMatch = selectedDate === 'All' || (mr && mr.requestDate === selectedDate);
    const projectMatch = selectedProject === 'All' || (mr && mr.vendorClient === selectedProject);
    const supplierMatch = selectedSupplier === 'All' || d.supplierId === selectedSupplier;
    const siteMatch = selectedSite === 'All' || d.siteId === selectedSite;
    const vehicleMatch = selectedVehicle === 'All' || d.truck.includes(selectedVehicle);
    return dateMatch && projectMatch && supplierMatch && siteMatch && vehicleMatch;
  });

  const filteredWccs = wccClosures.filter(w => {
    const mr = mrs.find(m => m.mrNumber === w.mrRef);
    const item = mr?.lineItems[0];
    
    const projectMatch = selectedProject === 'All' || (mr && mr.vendorClient === selectedProject);
    const siteMatch = selectedSite === 'All' || item?.siteId === selectedSite;
    const vehicleMatch = selectedVehicle === 'All' || item?.truck === selectedVehicle;
    return projectMatch && siteMatch && vehicleMatch;
  });

  // Calculate high-fidelity KPI stats based on filtered subsets
  const totalDeliveriesCount = filteredDeliveries.length;
  const deliveredCount = filteredDeliveries.filter(d => d.status === 'Delivered').length;
  const inTransitCount = filteredDeliveries.filter(d => d.status === 'In transit').length;
  const loadingCount = filteredDeliveries.filter(d => d.status === 'Loading').length;

  const activeTripsCount = inTransitCount + loadingCount;
  const delayedTripsCount = filteredDeliveries.filter(d => d.supervisorUnavailable || d.escalationNote).length;
  const pendingIncidentsCount = filteredDeliveries.filter(d => d.escalationNote && d.escalationNote.toLowerCase().includes('incident')).length || (delayedTripsCount > 0 ? 1 : 0);
  
  // Open Discrepancies
  const openDiscrepanciesCount = filteredWccs.filter(w => w.poVariancePercent !== 0 || !w.docMrSigned || !w.docSupplierInvoice).length;
  
  // On-time performance estimation (e.g. 94.2%)
  const onTimePerformance = totalDeliveriesCount > 0 
    ? Math.round(((totalDeliveriesCount - delayedTripsCount) / totalDeliveriesCount) * 1000) / 10 
    : 94.2;

  // Average Cost Variance across comparison quotes
  let totalVariance = 0;
  let varianceCount = 0;
  filteredPas.forEach(pa => {
    pa.quoteComparison.forEach(qc => {
      totalVariance += qc.variancePercent;
      varianceCount++;
    });
  });
  const avgCostVariance = varianceCount > 0 ? Math.round((totalVariance / varianceCount) * 10) / 10 : -3.8;

  // Supplier rating score summary
  const supplierPerformanceSla = selectedSupplier === 'sup-02' ? 91.2 : 96.5;

  return (
    <div className={`space-y-6 select-none transition-all duration-300 ${isRefreshing ? 'opacity-40 scale-[0.99]' : ''}`} id="dashboard-screen-container">
      
      {/* LOCAL TOP NAVIGATION */}
      <div className="bg-[#1D9E75] text-white p-4 rounded-xl flex flex-wrap items-center justify-between gap-4 shadow-sm" id="local-top-nav">
        <div className="flex items-center gap-3">
          <div className="bg-white/10 p-2 rounded-lg">
            <Navigation className="w-5 h-5 text-white animate-pulse" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold tracking-widest text-emerald-100 block">Adiu Network Systems</span>
            <span className="text-sm font-black tracking-tight">Active Ingress &amp; Trans-Africa Logistics Control Center</span>
          </div>
        </div>
        <div className="flex items-center gap-4 text-xs font-mono">
          <div className="bg-black/10 px-3 py-1.5 rounded border border-white/10 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
            <span>NODE-01: OK</span>
          </div>
          <div className="hidden sm:block text-slate-100 font-sans">
            User: <strong className="text-white">SewalewS29</strong>
          </div>
        </div>
      </div>

      {/* PAGE HEADER */}
      <div className="bg-white p-5 rounded-xl border border-[#D3D1C7] shadow-sm space-y-4" id="dashboard-page-header">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-0.5">
            <h1 className="text-xl font-bold font-sans text-[#2C2C2A] tracking-tight">Dashboard</h1>
            <p className="text-xs text-[#5F5E5A] font-medium flex items-center gap-1">
              <span className="inline-block w-2 h-2 rounded-full bg-[#1D9E75]"></span>
              Today Overview — High-Resolution Supply Chain Telemetry &amp; Financial Audits
            </p>
          </div>

          <div className="flex items-center gap-2 self-end">
            <button 
              onClick={handleExport}
              className="px-3.5 py-1.5 border border-[#D3D1C7] text-[#2C2C2A] hover:bg-[#F1EFE8]/40 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-[#5F5E5A]" />
              Export
            </button>
            <button 
              onClick={handleRefresh}
              className="px-3.5 py-1.5 bg-[#1D9E75] hover:bg-[#1D9E75]/90 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-sm cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </div>

        {/* FILTERS PANEL */}
        <div className="pt-3 border-t border-[#D3D1C7]/50 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          
          {/* Date Filter */}
          <div className="flex flex-col gap-1">
            <label className="text-[10px] text-[#5F5E5A] font-bold uppercase tracking-tight flex items-center gap-1">
              <Calendar className="w-3 h-3 text-[#1D9E75]" /> Date Filter
            </label>
            <select 
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="h-9 px-2 text-xs border border-[#D3D1C7] rounded bg-[#F1EFE8]/30 font-sans focus:outline-none focus:border-[#1D9E75]"
            >
              <option value="All">All Request Dates</option>
              {uniqueDates.map(d => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>

          {/* Project Filter */}
          <div className="flex flex-col gap-1">
            <label className="text-[10px] text-[#5F5E5A] font-bold uppercase tracking-tight flex items-center gap-1">
              <Layers className="w-3 h-3 text-[#1D9E75]" /> Project Filter
            </label>
            <select 
              value={selectedProject}
              onChange={(e) => setSelectedProject(e.target.value)}
              className="h-9 px-2 text-xs border border-[#D3D1C7] rounded bg-[#F1EFE8]/30 font-sans focus:outline-none focus:border-[#1D9E75]"
            >
              <option value="All">All Client Projects</option>
              {uniqueProjects.map(p => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>

          {/* Supplier Filter */}
          <div className="flex flex-col gap-1">
            <label className="text-[10px] text-[#5F5E5A] font-bold uppercase tracking-tight flex items-center gap-1">
              <User className="w-3 h-3 text-[#1D9E75]" /> Supplier Filter
            </label>
            <select 
              value={selectedSupplier}
              onChange={(e) => setSelectedSupplier(e.target.value)}
              className="h-9 px-2 text-xs border border-[#D3D1C7] rounded bg-[#F1EFE8]/30 font-sans focus:outline-none focus:border-[#1D9E75]"
            >
              <option value="All">All Primary Carriers</option>
              <option value="sup-01">Abyssinia Logistics Plc</option>
              <option value="sup-02">Lucy Freight &amp; Transit Plc</option>
            </select>
          </div>

          {/* Site Filter */}
          <div className="flex flex-col gap-1">
            <label className="text-[10px] text-[#5F5E5A] font-bold uppercase tracking-tight flex items-center gap-1">
              <MapPin className="w-3 h-3 text-[#1D9E75]" /> Site Filter
            </label>
            <select 
              value={selectedSite}
              onChange={(e) => setSelectedSite(e.target.value)}
              className="h-9 px-2 text-xs border border-[#D3D1C7] rounded bg-[#F1EFE8]/30 font-sans focus:outline-none focus:border-[#1D9E75]"
            >
              <option value="All">All Project Sites</option>
              {uniqueSites.map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          {/* Vehicle Filter */}
          <div className="flex flex-col gap-1 col-span-2 sm:col-span-1">
            <label className="text-[10px] text-[#5F5E5A] font-bold uppercase tracking-tight flex items-center gap-1">
              <Truck className="w-3 h-3 text-[#1D9E75]" /> Vehicle Filter
            </label>
            <select 
              value={selectedVehicle}
              onChange={(e) => setSelectedVehicle(e.target.value)}
              className="h-9 px-2 text-xs border border-[#D3D1C7] rounded bg-[#F1EFE8]/30 font-sans focus:outline-none focus:border-[#1D9E75]"
            >
              <option value="All">All Vehicle Classes</option>
              {uniqueVehicles.map(v => (
                <option key={v} value={v}>{v}</option>
              ))}
            </select>
          </div>

        </div>
      </div>

      {/* KPI CARDS (8 Cards) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4" id="kpi-cards-grid">
        
        {/* Card 1: Delivery Status */}
        <div className="bg-white p-4 rounded-xl border border-[#D3D1C7] shadow-sm space-y-1.5 flex flex-col justify-between">
          <span className="text-[10px] font-bold text-[#5F5E5A] uppercase tracking-wider block">Delivery Status</span>
          <div className="py-1">
            <div className="text-xl font-extrabold text-[#2C2C2A] font-sans flex items-baseline gap-1">
              <span>{deliveredCount}</span>
              <span className="text-[10px] text-slate-400 font-normal">of {totalDeliveriesCount} Completed</span>
            </div>
            <div className="flex items-center gap-2 mt-2 text-[10px] font-medium text-[#5F5E5A]">
              <span className="px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800">{deliveredCount} Del</span>
              <span className="px-1.5 py-0.5 rounded bg-sky-100 text-sky-800">{inTransitCount} Trn</span>
              <span className="px-1.5 py-0.5 rounded bg-amber-100 text-amber-800">{loadingCount} Ld</span>
            </div>
          </div>
          <span className="text-[9px] text-[#1D9E75] font-semibold">Live deployment pipeline</span>
        </div>

        {/* Card 2: On-Time Performance */}
        <div className="bg-white p-4 rounded-xl border border-[#D3D1C7] shadow-sm space-y-1.5 flex flex-col justify-between">
          <span className="text-[10px] font-bold text-[#5F5E5A] uppercase tracking-wider block">On-Time Performance</span>
          <div className="py-1">
            <div className="text-xl font-extrabold text-emerald-700 font-mono flex items-baseline gap-1">
              <span>{onTimePerformance}%</span>
              <span className="text-[9px] text-emerald-600 font-semibold">(+1.2%)</span>
            </div>
            <p className="text-[10px] text-[#5F5E5A] mt-1.5">SLA delivery target standard: &gt;90%</p>
          </div>
          <span className="text-[9px] text-emerald-600 font-semibold">Target limit met</span>
        </div>

        {/* Card 3: Active Trips */}
        <div className="bg-white p-4 rounded-xl border border-[#D3D1C7] shadow-sm space-y-1.5 flex flex-col justify-between">
          <span className="text-[10px] font-bold text-[#5F5E5A] uppercase tracking-wider block">Active Trips</span>
          <div className="py-1">
            <div className="text-xl font-extrabold text-[#2C2C2A] flex items-center gap-1.5">
              <span>{activeTripsCount}</span>
              <span className="text-[10px] text-[#1D9E75] font-semibold bg-[#1D9E75]/10 px-1.5 py-0.5 rounded font-mono">ON DISPATCH</span>
            </div>
            <p className="text-[10px] text-[#5F5E5A] mt-1.5">{inTransitCount} trucks currently steering route</p>
          </div>
          <span className="text-[9px] text-blue-600 font-semibold">Track GPS beacons</span>
        </div>

        {/* Card 4: Delayed Trips */}
        <div className="bg-white p-4 rounded-xl border border-[#D3D1C7] shadow-sm space-y-1.5 flex flex-col justify-between">
          <span className="text-[10px] font-bold text-[#5F5E5A] uppercase tracking-wider block">Delayed Trips</span>
          <div className="py-1">
            <div className={`text-xl font-extrabold ${delayedTripsCount > 0 ? 'text-red-600' : 'text-slate-700'}`}>
              {delayedTripsCount} <span className="text-[10px] text-slate-400 font-normal">Trips</span>
            </div>
            <p className="text-[10px] text-[#5F5E5A] mt-1.5">
              {delayedTripsCount > 0 ? 'Checkpoint delay or missing staff' : 'All trucks running on route cycle'}
            </p>
          </div>
          <span className={`text-[9px] font-semibold ${delayedTripsCount > 0 ? 'text-red-500 animate-pulse' : 'text-slate-500'}`}>
            {delayedTripsCount > 0 ? 'Escalations triggered' : 'System nominal'}
          </span>
        </div>

        {/* Card 5: Pending Incidents */}
        <div className="bg-white p-4 rounded-xl border border-[#D3D1C7] shadow-sm space-y-1.5 flex flex-col justify-between">
          <span className="text-[10px] font-bold text-[#5F5E5A] uppercase tracking-wider block">Pending Incidents</span>
          <div className="py-1">
            <div className={`text-xl font-extrabold ${pendingIncidentsCount > 0 ? 'text-red-600 animate-pulse' : 'text-slate-700'}`}>
              {pendingIncidentsCount} <span className="text-[10px] text-slate-400 font-normal">Active</span>
            </div>
            <p className="text-[10px] text-[#5F5E5A] mt-1.5">
              {pendingIncidentsCount > 0 ? 'Safety audit failure or rejection' : '0 active critical safety reports'}
            </p>
          </div>
          <span className="text-[9px] text-slate-400 font-semibold">QEHS validation status</span>
        </div>

        {/* Card 6: Open Discrepancies */}
        <div className="bg-white p-4 rounded-xl border border-[#D3D1C7] shadow-sm space-y-1.5 flex flex-col justify-between">
          <span className="text-[10px] font-bold text-[#5F5E5A] uppercase tracking-wider block">Open Discrepancies</span>
          <div className="py-1">
            <div className={`text-xl font-extrabold ${openDiscrepanciesCount > 0 ? 'text-orange-600' : 'text-slate-700'}`}>
              {openDiscrepanciesCount} <span className="text-[10px] text-slate-400 font-normal">Audits</span>
            </div>
            <p className="text-[10px] text-[#5F5E5A] mt-1.5">
              {openDiscrepanciesCount > 0 ? 'WCC PO and invoice mismatches' : 'All invoice clearances reconciled'}
            </p>
          </div>
          <span className="text-[9px] text-[#1D9E75] font-semibold">Finance sync verified</span>
        </div>

        {/* Card 7: Transport Cost Variance */}
        <div className="bg-white p-4 rounded-xl border border-[#D3D1C7] shadow-sm space-y-1.5 flex flex-col justify-between">
          <span className="text-[10px] font-bold text-[#5F5E5A] uppercase tracking-wider block">Transport Cost Variance</span>
          <div className="py-1">
            <div className="text-xl font-extrabold text-emerald-600 font-mono flex items-baseline gap-1">
              <span>{avgCostVariance > 0 ? `+${avgCostVariance}%` : `${avgCostVariance}%`}</span>
              <span className="text-[9px] text-slate-400 font-normal">avg vs Budget</span>
            </div>
            <p className="text-[10px] text-[#5F5E5A] mt-1.5">Savings compiled via price book validations</p>
          </div>
          <span className="text-[9px] text-emerald-600 font-semibold">Positive fiscal health</span>
        </div>

        {/* Card 8: Supplier Performance */}
        <div className="bg-white p-4 rounded-xl border border-[#D3D1C7] shadow-sm space-y-1.5 flex flex-col justify-between">
          <span className="text-[10px] font-bold text-[#5F5E5A] uppercase tracking-wider block">Supplier SLA Score</span>
          <div className="py-1">
            <div className="text-xl font-extrabold text-slate-800 font-mono flex items-baseline gap-1">
              <span>{supplierPerformanceSla}%</span>
              <span className="text-[10px] text-slate-400 font-normal">Average</span>
            </div>
            <p className="text-[10px] text-[#5F5E5A] mt-1.5">Based on on-time delivery ratios</p>
          </div>
          <span className="text-[9px] text-amber-600 font-semibold">Weighted compliance score</span>
        </div>

      </div>

      {/* CHARTS ROW (4 Charts) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5" id="dashboard-charts-row">
        
        {/* Chart 1: Delivery Trend */}
        <div className="bg-white p-4 rounded-xl border border-[#D3D1C7] shadow-sm space-y-4">
          <div>
            <h3 className="text-xs font-bold text-[#2C2C2A] uppercase tracking-wider">01. Delivery Trend</h3>
            <p className="text-[10px] text-[#5F5E5A]">Completed shipments vs Active loading queue (5 Days)</p>
          </div>
          
          {/* SVG Bar Chart with Hover Effects */}
          <div className="h-32 flex items-end justify-between gap-2 px-1 relative">
            {[
              { day: 'Mon', completed: 8, loading: 3 },
              { day: 'Tue', completed: 11, loading: 4 },
              { day: 'Wed', completed: 15, loading: 2 },
              { day: 'Thu', completed: 9, loading: 5 },
              { day: 'Fri', completed: 12, loading: 3 }
            ].map((d, idx) => {
              const maxVal = 20;
              const compHeight = (d.completed / maxVal) * 100;
              const loadHeight = (d.loading / maxVal) * 100;
              const isHovered = hoveredTrendDay === idx;

              return (
                <div 
                  key={d.day} 
                  className="flex-1 flex flex-col items-center justify-end h-full group cursor-pointer"
                  onMouseEnter={() => setHoveredTrendDay(idx)}
                  onMouseLeave={() => setHoveredTrendDay(null)}
                >
                  <div className="w-full flex gap-1 justify-center items-end h-full">
                    {/* Completed Bar */}
                    <div 
                      className={`w-3 rounded-t-sm transition-all duration-300 ${isHovered ? 'bg-[#1D9E75]' : 'bg-[#1D9E75]/70'}`}
                      style={{ height: `${compHeight}%` }}
                    />
                    {/* Loading Bar */}
                    <div 
                      className={`w-3 rounded-t-sm transition-all duration-300 ${isHovered ? 'bg-amber-500' : 'bg-amber-400/70'}`}
                      style={{ height: `${loadHeight}%` }}
                    />
                  </div>
                  <span className="text-[9px] font-bold text-[#5F5E5A] mt-1.5">{d.day}</span>
                </div>
              );
            })}

            {/* Hover Tooltip inside SVG Area */}
            {hoveredTrendDay !== null && (
              <div className="absolute top-0 left-1/2 -translate-x-1/2 bg-[#2C2C2A] text-white p-2 rounded-lg shadow-lg text-[9px] font-sans space-y-0.5 border border-white/10 z-10">
                <span className="font-bold block text-slate-300">
                  {hoveredTrendDay === 0 ? 'Monday' : hoveredTrendDay === 1 ? 'Tuesday' : hoveredTrendDay === 2 ? 'Wednesday' : hoveredTrendDay === 3 ? 'Thursday' : 'Friday'}
                </span>
                <div className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-[#1D9E75] rounded-full"></span>
                  <span>Delivered: <strong>{hoveredTrendDay === 0 ? 8 : hoveredTrendDay === 1 ? 11 : hoveredTrendDay === 2 ? 15 : hoveredTrendDay === 3 ? 9 : 12}</strong></span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-amber-400 rounded-full"></span>
                  <span>Loading: <strong>{hoveredTrendDay === 0 ? 3 : hoveredTrendDay === 1 ? 4 : hoveredTrendDay === 2 ? 2 : hoveredTrendDay === 3 ? 5 : 3}</strong></span>
                </div>
              </div>
            )}
          </div>
          
          <div className="flex items-center justify-between text-[9px] font-sans text-slate-400 pt-1 border-t border-slate-100">
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-[#1D9E75]"></span> Delivered</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-amber-400"></span> Dispatching</span>
          </div>
        </div>

        {/* Chart 2: Trip Cycle Time */}
        <div className="bg-white p-4 rounded-xl border border-[#D3D1C7] shadow-sm space-y-4">
          <div>
            <h3 className="text-xs font-bold text-[#2C2C2A] uppercase tracking-wider">02. Trip Cycle Time</h3>
            <p className="text-[10px] text-[#5F5E5A]">Average duration metrics across operations (Hours)</p>
          </div>

          <div className="space-y-2.5 pt-1">
            {[
              { stage: 'Loading & QA', hours: 3.5, color: 'bg-emerald-500' },
              { stage: 'In Transit', hours: 14.2, color: 'bg-sky-500' },
              { stage: 'Checkpoint Clearance', hours: 4.8, color: 'bg-amber-500' },
              { stage: 'Offloading & POD', hours: 2.1, color: 'bg-purple-500' }
            ].map(stage => (
              <div key={stage.stage} className="space-y-1 text-[10px]">
                <div className="flex justify-between font-medium text-slate-600">
                  <span>{stage.stage}</span>
                  <span className="font-mono font-bold text-[#2C2C2A]">{stage.hours} hrs</span>
                </div>
                <div className="h-1.5 bg-[#F1EFE8] rounded-full overflow-hidden">
                  <div className={`h-full rounded-full ${stage.color}`} style={{ width: `${(stage.hours / 20) * 100}%` }} />
                </div>
              </div>
            ))}
          </div>

          <div className="text-[9px] text-slate-400 text-center italic font-sans pt-1">
            Mean system turnaround: <strong>24.6 Hours</strong>
          </div>
        </div>

        {/* Chart 3: Supplier SLA & Variance */}
        <div className="bg-white p-4 rounded-xl border border-[#D3D1C7] shadow-sm space-y-4">
          <div>
            <h3 className="text-xs font-bold text-[#2C2C2A] uppercase tracking-wider">03. Supplier Performance</h3>
            <p className="text-[10px] text-[#5F5E5A]">Abyssinia Logistics vs Lucy Freight metrics</p>
          </div>

          <div className="space-y-3 pt-1">
            {/* Abyssinia SLA */}
            <div className="space-y-1 text-[10px]">
              <span className="font-bold text-slate-700 block">Abyssinia Logistics (SLA)</span>
              <div className="flex items-center gap-3">
                <div className="flex-1 h-3 bg-[#F1EFE8] rounded-full overflow-hidden flex">
                  <div className="bg-[#1D9E75] h-full" style={{ width: '96.5%' }} />
                </div>
                <span className="font-mono font-bold w-10 text-right">96.5%</span>
              </div>
            </div>

            {/* Abyssinia Price Compliance */}
            <div className="space-y-1 text-[10px]">
              <span className="font-semibold text-slate-500 block">Abyssinia (Price Compliance)</span>
              <div className="flex items-center gap-3">
                <div className="flex-1 h-2 bg-[#F1EFE8] rounded-full overflow-hidden flex">
                  <div className="bg-[#1D9E75]/60 h-full" style={{ width: '98%' }} />
                </div>
                <span className="font-mono font-medium text-slate-500 w-10 text-right">98.0%</span>
              </div>
            </div>

            {/* Lucy SLA */}
            <div className="space-y-1 text-[10px]">
              <span className="font-bold text-slate-700 block">Lucy Freight &amp; Transit (SLA)</span>
              <div className="flex items-center gap-3">
                <div className="flex-1 h-3 bg-[#F1EFE8] rounded-full overflow-hidden flex">
                  <div className="bg-amber-500 h-full" style={{ width: '91.2%' }} />
                </div>
                <span className="font-mono font-bold w-10 text-right">91.2%</span>
              </div>
            </div>

            {/* Lucy Price Compliance */}
            <div className="space-y-1 text-[10px]">
              <span className="font-semibold text-slate-500 block">Lucy (Price Compliance)</span>
              <div className="flex items-center gap-3">
                <div className="flex-1 h-2 bg-[#F1EFE8] rounded-full overflow-hidden flex">
                  <div className="bg-amber-500/60 h-full" style={{ width: '94%' }} />
                </div>
                <span className="font-mono font-medium text-slate-500 w-10 text-right">94.0%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Chart 4: Incident Trend */}
        <div className="bg-white p-4 rounded-xl border border-[#D3D1C7] shadow-sm space-y-4">
          <div>
            <h3 className="text-xs font-bold text-[#2C2C2A] uppercase tracking-wider">04. Incident Trend</h3>
            <p className="text-[10px] text-[#5F5E5A]">Safety &amp; Compliance violations over time</p>
          </div>

          {/* Area Chart using SVG coordinates */}
          <div className="h-32 w-full pt-2">
            <svg viewBox="0 0 100 35" className="w-full h-full overflow-visible">
              <defs>
                <linearGradient id="gradient-incident" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#ef4444" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="#ef4444" stopOpacity="0" />
                </linearGradient>
              </defs>
              {/* Grid Lines */}
              <line x1="0" y1="0" x2="100" y2="0" stroke="#F1EFE8" strokeWidth="0.5" />
              <line x1="0" y1="15" x2="100" y2="15" stroke="#F1EFE8" strokeWidth="0.5" />
              <line x1="0" y1="30" x2="100" y2="30" stroke="#F1EFE8" strokeWidth="0.5" />

              {/* Area path */}
              <path 
                d="M 0 30 Q 20 10, 40 25 T 80 5 T 100 30 L 100 30 L 0 30 Z" 
                fill="url(#gradient-incident)" 
              />
              {/* Line path */}
              <path 
                d="M 0 30 Q 20 10, 40 25 T 80 5 T 100 30" 
                fill="none" 
                stroke="#ef4444" 
                strokeWidth="1.5" 
              />
              {/* Interactive Points */}
              <circle cx="20" cy="15" r="1.5" fill="#ef4444" />
              <circle cx="50" cy="20" r="1.5" fill="#ef4444" />
              <circle cx="80" cy="5" r="1.5" fill="#ef4444" />

              {/* Labels */}
              <text x="0" y="34" fontSize="3" fill="#5F5E5A" fontWeight="bold">Jan</text>
              <text x="25" y="34" fontSize="3" fill="#5F5E5A" fontWeight="bold">Mar</text>
              <text x="50" y="34" fontSize="3" fill="#5F5E5A" fontWeight="bold">May</text>
              <text x="75" y="34" fontSize="3" fill="#5F5E5A" fontWeight="bold">Jul</text>
              <text x="94" y="34" fontSize="3" fill="#5F5E5A" fontWeight="bold">Sep</text>
            </svg>
          </div>

          <div className="text-[10px] text-[#5F5E5A] bg-red-50 border border-red-100 p-2 rounded flex items-center gap-2">
            <ShieldAlert className="w-3.5 h-3.5 text-red-600 shrink-0" />
            <span>Incidents decreased <strong className="text-red-700">-60%</strong> since strict ex-VAT Price Book locking.</span>
          </div>
        </div>

      </div>

      {/* OPERATIONAL TABLES (4 Tables) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6" id="dashboard-operational-tables">
        
        {/* Table 1: Active Trips */}
        <div className="bg-white p-5 rounded-xl border border-[#D3D1C7] shadow-sm space-y-4 flex flex-col justify-between">
          <div className="space-y-1">
            <h2 className="text-xs font-bold text-[#2C2C2A] uppercase tracking-wider flex items-center gap-1.5">
              <Truck className="w-4 h-4 text-[#1D9E75]" /> Active Trips
            </h2>
            <p className="text-[11px] text-[#5F5E5A]">Live GPS beacons and delivery progress on road routes</p>
          </div>

          <div className="overflow-x-auto border border-[#D3D1C7]/60 rounded-lg">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-[#F1EFE8]/45 border-b border-[#D3D1C7]/80 text-[10px] font-sans font-semibold text-[#5F5E5A] uppercase tracking-wider">
                  <th className="p-3">MR Ref</th>
                  <th className="p-3">Site ID</th>
                  <th className="p-3">Primary Driver</th>
                  <th className="p-3">GPS Status / Route Code</th>
                  <th className="p-3 text-right">Progress</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#D3D1C7]/40 text-[#2C2C2A]">
                {filteredDeliveries.filter(d => d.status !== 'Delivered').length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-6 text-center text-slate-400 italic">No active dispatch trips in progress</td>
                  </tr>
                ) : (
                  filteredDeliveries.filter(d => d.status !== 'Delivered').slice(0, 3).map(d => (
                    <tr key={d.mrRef} className="hover:bg-[#F1EFE8]/30 transition-colors">
                      <td className="p-3 font-semibold text-[#1D9E75]">{d.mrRef}</td>
                      <td className="p-3 font-mono">{d.siteId}</td>
                      <td className="p-3">{d.driver.split(' (')[0]}</td>
                      <td className="p-3 text-[10px] text-[#5F5E5A] max-w-[150px] truncate" title={d.inTransitGpsStatus}>
                        {d.inTransitGpsStatus}
                      </td>
                      <td className="p-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <span className="font-mono font-bold text-[#2C2C2A] text-[10px]">
                            {d.status === 'Loading' ? '20%' : '75%'}
                          </span>
                          <div className="w-12 h-1.5 bg-[#F1EFE8] rounded-full overflow-hidden inline-flex">
                            <div className="bg-[#1D9E75] h-full" style={{ width: d.status === 'Loading' ? '20%' : '75%' }} />
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <button 
            onClick={() => setScreen('tracking')}
            className="w-full py-2 bg-[#F1EFE8]/60 hover:bg-[#F1EFE8] text-xs font-semibold text-slate-700 rounded-lg text-center transition-all cursor-pointer border border-[#D3D1C7]/40"
          >
            Track GPS &amp; Live Route &rarr;
          </button>
        </div>

        {/* Table 2: Delayed Trips */}
        <div className="bg-white p-5 rounded-xl border border-[#D3D1C7] shadow-sm space-y-4 flex flex-col justify-between">
          <div className="space-y-1">
            <h2 className="text-xs font-bold text-[#2C2C2A] uppercase tracking-wider flex items-center gap-1.5 text-red-600">
              <AlertTriangle className="w-4 h-4" /> Delayed Trips
            </h2>
            <p className="text-[11px] text-[#5F5E5A]">Critical cargo halted or experiencing gate-in delays</p>
          </div>

          <div className="overflow-x-auto border border-[#D3D1C7]/60 rounded-lg">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-red-50/50 border-b border-[#D3D1C7]/80 text-[10px] font-sans font-semibold text-red-800 uppercase tracking-wider">
                  <th className="p-3">MR Ref</th>
                  <th className="p-3">Carrier / Truck</th>
                  <th className="p-3">Delay Code / Issue</th>
                  <th className="p-3">ETA Impact</th>
                  <th className="p-3 text-center">Severity</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#D3D1C7]/40 text-[#2C2C2A]">
                {delayedTripsCount === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-6 text-center text-emerald-600 font-semibold italic">0 delayed trips recorded today. All smooth!</td>
                  </tr>
                ) : (
                  filteredDeliveries.filter(d => d.supervisorUnavailable || d.escalationNote).slice(0, 3).map(d => (
                    <tr key={d.mrRef} className="hover:bg-red-50/20 transition-colors">
                      <td className="p-3 font-semibold text-red-600">{d.mrRef}</td>
                      <td className="p-3 truncate max-w-[120px]" title={d.truck}>{d.truck}</td>
                      <td className="p-3 text-[10px] text-red-800 font-medium">
                        {d.supervisorUnavailable ? 'Supervisor Absent on Site' : d.escalationNote || 'Delayed clearance'}
                      </td>
                      <td className="p-3 font-mono font-medium">{d.inTransitEta || 'Unknown'}</td>
                      <td className="p-3 text-center">
                        <span className="px-2 py-0.5 rounded bg-red-100 text-red-800 text-[9px] font-bold">
                          HIGH
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <button 
            onClick={() => setScreen('delivery')}
            className="w-full py-2 bg-red-50/50 hover:bg-red-50 text-xs font-semibold text-red-700 rounded-lg text-center transition-all cursor-pointer border border-red-200"
          >
            Review Gate Escalation Protocols &rarr;
          </button>
        </div>

        {/* Table 3: Pending Closure Checklist */}
        <div className="bg-white p-5 rounded-xl border border-[#D3D1C7] shadow-sm space-y-4 flex flex-col justify-between">
          <div className="space-y-1">
            <h2 className="text-xs font-bold text-[#2C2C2A] uppercase tracking-wider flex items-center gap-1.5">
              <FolderCheck className="w-4 h-4 text-[#1D9E75]" /> Pending Closure Checklist
            </h2>
            <p className="text-[11px] text-[#5F5E5A]">Post-delivery audit of signed MR copies &amp; invoice matches</p>
          </div>

          <div className="overflow-x-auto border border-[#D3D1C7]/60 rounded-lg">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-[#F1EFE8]/45 border-b border-[#D3D1C7]/80 text-[10px] font-sans font-semibold text-[#5F5E5A] uppercase tracking-wider">
                  <th className="p-3">PO Number</th>
                  <th className="p-3">MR Ref</th>
                  <th className="p-3 text-right">Invoice Amount</th>
                  <th className="p-3 text-center">Doc Checklist</th>
                  <th className="p-3 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#D3D1C7]/40 text-[#2C2C2A]">
                {filteredWccs.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-6 text-center text-slate-400 italic">No pending closure reconciliations found</td>
                  </tr>
                ) : (
                  filteredWccs.slice(0, 3).map(w => (
                    <tr key={w.mrRef} className="hover:bg-[#F1EFE8]/30 transition-colors">
                      <td className="p-3 font-mono font-semibold">{w.poNumber}</td>
                      <td className="p-3 font-semibold text-slate-700">{w.mrRef}</td>
                      <td className="p-3 text-right font-mono font-medium">{w.supplierInvoiceAmount.toLocaleString()} ETB</td>
                      <td className="p-3">
                        <div className="flex items-center justify-center gap-1.5">
                          <span className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[8px] font-bold ${w.docMrSigned ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-500'}`} title="Signed MR">MR</span>
                          <span className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[8px] font-bold ${w.docDeliveryPhoto ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-500'}`} title="Delivery Photo">PH</span>
                          <span className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[8px] font-bold ${w.docSupplierInvoice ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-500'}`} title="Invoice Copy">IV</span>
                          <span className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[8px] font-bold ${w.docGrn ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-500'}`} title="GRN document">GR</span>
                        </div>
                      </td>
                      <td className="p-3 text-right">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-medium border ${getStatusStyle(w.wccStatus)}`}>
                          {w.wccStatus}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <button 
            onClick={() => setScreen('wcc')}
            className="w-full py-2 bg-[#F1EFE8]/60 hover:bg-[#F1EFE8] text-xs font-semibold text-slate-700 rounded-lg text-center transition-all cursor-pointer border border-[#D3D1C7]/40"
          >
            Audit Financial Closures &rarr;
          </button>
        </div>

        {/* Table 4: Recent Activities Feed */}
        <div className="bg-white p-5 rounded-xl border border-[#D3D1C7] shadow-sm space-y-4 flex flex-col justify-between">
          <div className="space-y-1">
            <h2 className="text-xs font-bold text-[#2C2C2A] uppercase tracking-wider flex items-center gap-1.5">
              <Activity className="w-4 h-4 text-[#1D9E75]" /> Recent Activities
            </h2>
            <p className="text-[11px] text-[#5F5E5A]">Chronological real-time logistical trace log</p>
          </div>

          <div className="space-y-3.5 pr-1 max-h-[175px] overflow-y-auto">
            
            <div className="flex items-start gap-3 text-xs">
              <div className="w-2 h-2 rounded-full bg-[#1D9E75] mt-1.5 animate-ping" />
              <div className="space-y-0.5 flex-1">
                <span className="font-sans text-[#2C2C2A] font-semibold block">Work order issued automatically for Abyssinia Logistics</span>
                <span className="text-[10px] text-slate-400 block font-mono">2026-06-26 23:05</span>
              </div>
            </div>

            <div className="flex items-start gap-3 text-xs">
              <div className="w-2 h-2 rounded-full bg-amber-500 mt-1.5" />
              <div className="space-y-0.5 flex-1">
                <span className="font-sans text-[#2C2C2A] font-medium block">GPS coordinate refresh: ET-3-A98412 currently near Meskel Square</span>
                <span className="text-[10px] text-slate-400 block font-mono">2026-06-26 22:50</span>
              </div>
            </div>

            <div className="flex items-start gap-3 text-xs">
              <div className="w-2 h-2 rounded-full bg-emerald-500 mt-1.5" />
              <div className="space-y-0.5 flex-1">
                <span className="font-sans text-[#2C2C2A] font-medium block">Price book contract Ex-VAT item validated automatically</span>
                <span className="text-[10px] text-slate-400 block font-mono">2026-06-26 21:15</span>
              </div>
            </div>

            <div className="flex items-start gap-3 text-xs">
              <div className="w-2 h-2 rounded-full bg-red-500 mt-1.5" />
              <div className="space-y-0.5 flex-1">
                <span className="font-sans text-[#2C2C2A] font-medium block">Safety incident escalation cleared for vehicle inspection</span>
                <span className="text-[10px] text-slate-400 block font-mono">2026-06-26 19:40</span>
              </div>
            </div>

          </div>

          <div className="text-[10px] text-[#5F5E5A] text-center pt-2 border-t border-slate-100">
            Audit logs are persistent and encrypted.
          </div>
        </div>

      </div>

      {/* BOTTOM SECTION */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6" id="dashboard-bottom-section">
        
        {/* Module 1: Financial Summary */}
        <div className="bg-white p-5 rounded-xl border border-[#D3D1C7] shadow-sm space-y-4 col-span-1 lg:col-span-1">
          <div>
            <h3 className="text-xs font-bold text-[#2C2C2A] uppercase tracking-wider flex items-center gap-1">
              <DollarSign className="w-4 h-4 text-[#1D9E75]" /> Financial Summary
            </h3>
            <p className="text-[10px] text-[#5F5E5A]">Budgeted vs. actual quoted transport costs (ETB)</p>
          </div>

          <div className="space-y-4 pt-1">
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div className="bg-slate-50 p-3 rounded-lg border border-[#D3D1C7]/40">
                <span className="text-[10px] text-[#5F5E5A] block uppercase font-bold">Total Budget Cap</span>
                <span className="text-base font-extrabold text-[#2C2C2A] font-mono">168,000 ETB</span>
              </div>
              <div className="bg-[#1D9E75]/5 p-3 rounded-lg border border-[#1D9E75]/20">
                <span className="text-[10px] text-[#1D9E75] block uppercase font-bold">Actual Quoted Paid</span>
                <span className="text-base font-extrabold text-[#1D9E75] font-mono">152,500 ETB</span>
              </div>
            </div>

            {/* Savings gauge */}
            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between text-[#5F5E5A] font-semibold">
                <span>Direct Savings Realized</span>
                <span className="text-emerald-700">15,500 ETB Saved (-9.2%)</span>
              </div>
              <div className="h-2.5 bg-[#F1EFE8] rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500 rounded-full" style={{ width: '91%' }} />
              </div>
            </div>

            <p className="text-[10px] text-[#5F5E5A] bg-[#F1EFE8]/40 p-2.5 rounded border border-[#D3D1C7]/60 leading-relaxed font-sans">
              All quotes are mapped securely to Standard Ex-VAT rates. Non-compliance is rejected automatically under the Multi-Tier threshold rules.
            </p>
          </div>
        </div>

        {/* Module 2: Approval Escalations */}
        <div className="bg-white p-5 rounded-xl border border-[#D3D1C7] shadow-sm space-y-4">
          <div>
            <h3 className="text-xs font-bold text-[#2C2C2A] uppercase tracking-wider flex items-center gap-1 text-amber-700">
              <Award className="w-4 h-4" /> Active Approval Escalations
            </h3>
            <p className="text-[10px] text-[#5F5E5A]">PA Commercial audits with high negative variance requiring veto</p>
          </div>

          <div className="space-y-3 pt-1">
            {filteredPas.filter(p => p.approvalStatus === 'Pending').length === 0 ? (
              <div className="p-6 text-center text-slate-400 italic text-xs bg-[#F1EFE8]/20 border border-dashed border-[#D3D1C7] rounded-lg">
                No active escalations. All variances validated.
              </div>
            ) : (
              filteredPas.filter(p => p.approvalStatus === 'Pending').slice(0, 2).map(p => {
                const maxVarianceQuote = p.quoteComparison.reduce((max, quote) => 
                  quote.variancePercent > max.variancePercent ? quote : max, 
                  p.quoteComparison[0]
                );

                const isSevere = maxVarianceQuote.variancePercent > 10;

                return (
                  <div 
                    key={p.paNumber}
                    onClick={() => handleReviewPa(p.mrRef)}
                    className="p-3 rounded-lg border border-[#D3D1C7] bg-[#F1EFE8]/20 flex items-center justify-between hover:border-[#1D9E75] transition-all cursor-pointer"
                  >
                    <div className="space-y-0.5">
                      <span className="text-xs font-bold text-[#2C2C2A] block">{p.paNumber}</span>
                      <span className="text-[10px] text-[#5F5E5A] block">MR Ref: <strong>{p.mrRef}</strong></span>
                    </div>
                    <div className="text-right">
                      <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${isSevere ? 'bg-red-100 text-red-800' : 'bg-orange-100 text-orange-800'}`}>
                        +{maxVarianceQuote.variancePercent}% Variance
                      </span>
                      <span className="text-[9px] text-[#1D9E75] font-semibold block mt-1 hover:underline">Review &rarr;</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Module 3: Proof of Delivery Completion */}
        <div className="bg-white p-5 rounded-xl border border-[#D3D1C7] shadow-sm space-y-4">
          <div>
            <h3 className="text-xs font-bold text-[#2C2C2A] uppercase tracking-wider flex items-center gap-1">
              <CheckSquare className="w-4 h-4 text-[#1D9E75]" /> Proof of Delivery (POD) Rates
            </h3>
            <p className="text-[10px] text-[#5F5E5A]">Verification status of signed physical receipts &amp; gate-in photos</p>
          </div>

          <div className="flex items-center gap-6 pt-1">
            {/* Visual Circular Gauge */}
            <div className="relative w-16 h-16 flex items-center justify-center shrink-0">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                <path
                  className="text-slate-100"
                  strokeWidth="3.5"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                <path
                  className="text-[#1D9E75]"
                  strokeDasharray="88, 100"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
              </svg>
              <div className="absolute text-xs font-black text-[#2C2C2A] font-mono">
                88%
              </div>
            </div>

            {/* Checklist details */}
            <div className="space-y-1 text-[11px] font-sans text-slate-600 flex-1">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>Signed physical MR copies uploaded: <strong>91%</strong></span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>Unloading photo logs recorded: <strong>85%</strong></span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>Authorized supervisor sign-offs: <strong>92%</strong></span>
              </div>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}

import React, { useMemo, useState } from 'react';
import { TripTracking, TripMilestone, TripMilestoneStatus, GeofenceEvent, TripAlert, RouteCheckpoint } from '../types';
import {
  Navigation, MapPin, Clock, Upload, Check, AlertTriangle, Wifi, WifiOff,
  RefreshCw, Radio, Flag, ShieldAlert, CheckCircle2, PlusCircle, Maximize2,
  BatteryCharging, SignalHigh, Truck, Route, AlertOctagon, Activity, Hash, Edit3, Save, Compass, Focus, X
} from 'lucide-react';

interface TrackingScreenProps {
  tracking: TripTracking[];
  onSaveTracking: (trip: TripTracking) => void;
}

const CURRENT_USER = 'Solomon Tekle';

// --- HELPERS ---
function useProjection(points: { latitude: number; longitude: number }[], W: number, H: number, pad: number) {
  return useMemo(() => {
    if (points.length === 0) return (lat: number, lng: number) => ({ x: W / 2, y: H / 2 });
    const lats = points.map(p => p.latitude);
    const lngs = points.map(p => p.longitude);
    const minLat = Math.min(...lats), maxLat = Math.max(...lats);
    const minLng = Math.min(...lngs), maxLng = Math.max(...lngs);
    const latRange = maxLat - minLat || 0.01;
    const lngRange = maxLng - minLng || 0.01;
    return (lat: number, lng: number) => {
      const x = ((lng - minLng) / lngRange) * (W - pad * 2) + pad;
      const y = (H - pad * 2) - ((lat - minLat) / latRange) * (H - pad * 2) + pad;
      return { x, y };
    };
  }, [points, W, H, pad]);
}

// --- SUB COMPONENTS ---

const LiveGPSDashboard = ({ activeTrip, tracking }: { activeTrip: TripTracking, tracking: TripTracking[] }) => {
  const [selectedMarker, setSelectedMarker] = useState<string | null>(activeTrip.mrRef);

  const W = 800, H = 400, PAD = 40;
  
  // Show all active trips on map, or just the active one
  const allPoints = tracking.flatMap(t => [...t.plannedRoute, { latitude: t.currentLat, longitude: t.currentLng }]);
  const project = useProjection(allPoints, W, H, PAD);

  const tripToDisplay = tracking.find(t => t.mrRef === selectedMarker) || activeTrip;
  
  // Draw route for the selected trip
  const routePoints = tripToDisplay.plannedRoute.slice().sort((a, b) => a.sequence - b.sequence);
  const pathD = routePoints.map((p, idx) => {
    const { x, y } = project(p.latitude, p.longitude);
    return `${idx === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`;
  }).join(' ');

  // Mock Info Data
  const mockSpeed = tripToDisplay.tripStatus === 'Active' ? Math.floor(Math.random() * 20 + 40) : 0;
  const mockEta = '2h 15m';
  const mockDist = '85 km';

  return (
    <div className="flex flex-col lg:flex-row gap-6">
       {/* Map Area */}
       <div className="flex-1 bg-slate-50 border border-slate-200 rounded-2xl overflow-hidden relative">
          <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-full min-h-[400px]">
             {/* Map Grid Pattern */}
             <defs>
               <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                 <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#E2E8F0" strokeWidth="0.5"/>
               </pattern>
             </defs>
             <rect width={W} height={H} fill="url(#grid)" />

             {/* Planned Route Line */}
             <path d={pathD} fill="none" stroke="#1976D2" strokeWidth={4} strokeDasharray="8 6" opacity={0.6} strokeLinecap="round" strokeLinejoin="round" />
             
             {/* Checkpoints */}
             {routePoints.map(p => {
               const { x, y } = project(p.latitude, p.longitude);
               const isWh = p.type === 'Warehouse';
               return (
                 <g key={p.id}>
                   <circle cx={x} cy={y} r={isWh ? 8 : 5} fill={isWh ? '#0D47A1' : '#64748B'} stroke="#fff" strokeWidth={2} />
                   <text x={x} y={y + 16} textAnchor="middle" fontSize="10" fill="#475569" fontWeight="600">{p.label}</text>
                 </g>
               );
             })}

             {/* Vehicle Markers */}
             {tracking.filter(t => t.tripStatus !== 'Completed').map(t => {
               const pos = project(t.currentLat, t.currentLng);
               const isSelected = selectedMarker === t.mrRef;
               const hasDeviation = t.alerts.some(a => a.type === 'Route Deviation' && !a.acknowledged);
               const color = hasDeviation ? '#DC2626' : (t.connectivity === 'Online' ? '#10B981' : '#94A3B8');
               
               return (
                 <g key={t.mrRef} onClick={() => setSelectedMarker(t.mrRef)} style={{cursor: 'pointer'}}>
                   {isSelected && (
                     <circle cx={pos.x} cy={pos.y} r={16} fill={color} opacity={0.2}>
                       <animate attributeName="r" values="16;24;16" dur="2s" repeatCount="indefinite" />
                     </circle>
                   )}
                   <circle cx={pos.x} cy={pos.y} r={8} fill={color} stroke="#fff" strokeWidth={2} />
                   <path d={`M${pos.x-4},${pos.y-2} L${pos.x+4},${pos.y-2} L${pos.x},${pos.y+4} Z`} fill="#fff" />
                 </g>
               );
             })}
          </svg>

          {/* Overlays */}
          <div className="absolute top-4 right-4 flex flex-col gap-2">
            <div className="bg-white/90 backdrop-blur px-3 py-2 rounded-lg shadow-sm border border-slate-200 text-[10px] font-bold uppercase tracking-wider text-slate-600 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500" /> Online
              <span className="w-2 h-2 rounded-full bg-slate-400 ml-2" /> Offline
              <span className="w-2 h-2 rounded-full bg-red-500 ml-2" /> Alert
            </div>
          </div>
       </div>

       {/* Info Card Panel */}
       <div className="w-full lg:w-80 flex flex-col gap-4">
          <div className="bg-white border border-[#1976D2]/30 shadow-md shadow-blue-900/5 rounded-2xl p-5 relative overflow-hidden">
             <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-[#0D47A1] to-[#1976D2]" />
             
             <div className="flex justify-between items-start mb-4">
               <div>
                 <div className="text-[10px] uppercase font-bold text-[#1976D2] tracking-wider mb-1">Trip Details</div>
                 <h2 className="text-lg font-black text-slate-800">{tripToDisplay.mrRef}</h2>
               </div>
               <div className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase ${tripToDisplay.tripStatus === 'Active' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>
                 {tripToDisplay.tripStatus}
               </div>
             </div>

             <div className="space-y-4">
               <div className="flex items-center gap-3">
                 <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-[#1976D2]">
                   <Truck className="w-5 h-5" />
                 </div>
                 <div>
                   <div className="text-sm font-bold text-slate-800">{tripToDisplay.vehiclePlate}</div>
                   <div className="text-xs text-slate-500">{tripToDisplay.driver}</div>
                 </div>
               </div>

               <div className="grid grid-cols-2 gap-3 pt-4 border-t border-slate-100">
                 <div>
                   <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1"><Activity className="w-3 h-3"/> Speed</div>
                   <div className="text-sm font-bold text-slate-800">{mockSpeed} km/h</div>
                 </div>
                 <div>
                   <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1"><Clock className="w-3 h-3"/> ETA</div>
                   <div className="text-sm font-bold text-slate-800">{mockEta}</div>
                 </div>
                 <div>
                   <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1"><Route className="w-3 h-3"/> Remaining</div>
                   <div className="text-sm font-bold text-slate-800">{mockDist}</div>
                 </div>
                 <div>
                   <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1"><BatteryCharging className="w-3 h-3"/> Device</div>
                   <div className="text-sm font-bold text-slate-800 flex items-center gap-1">87% <SignalHigh className="w-3 h-3 text-emerald-500"/></div>
                 </div>
               </div>

               <div className="pt-4 border-t border-slate-100">
                 <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">GPS Coordinates</div>
                 <div className="text-xs font-mono bg-slate-50 p-2 rounded border border-slate-200 text-slate-600">
                   {tripToDisplay.currentLat.toFixed(5)}, {tripToDisplay.currentLng.toFixed(5)}
                 </div>
                 <div className="text-[9px] text-slate-400 mt-1 text-right">
                   Updated {new Date(tripToDisplay.lastUpdateTime).toLocaleTimeString()}
                 </div>
               </div>
             </div>
          </div>
       </div>
    </div>
  )
};

const RoutePlanningScreen = ({ activeTrip }: { activeTrip: TripTracking }) => {
  const origin = activeTrip.plannedRoute.find(p => p.sequence === 1)?.label || 'Origin';
  const dest = activeTrip.plannedRoute.slice(-1)[0]?.label || 'Destination';

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2"><Route className="text-[#1976D2] w-5 h-5"/> Route Planning: {activeTrip.mrRef}</h2>
          <p className="text-xs text-slate-500">Configure checkpoints and expected timelines</p>
        </div>
        <div className="flex gap-2">
          <button className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg text-xs font-bold hover:bg-slate-200 flex items-center gap-2"><Edit3 className="w-4 h-4"/> Edit Route</button>
          <button className="px-4 py-2 bg-[#1976D2] text-white rounded-lg text-xs font-bold hover:bg-[#0D47A1] flex items-center gap-2"><Save className="w-4 h-4"/> Optimize & Save</button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-blue-50/50 p-5 rounded-2xl border border-blue-100">
        <div>
          <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Origin</div>
          <div className="text-sm font-bold text-slate-800 truncate">{origin}</div>
        </div>
        <div>
          <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Destination</div>
          <div className="text-sm font-bold text-slate-800 truncate">{dest}</div>
        </div>
        <div>
          <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Planned Distance</div>
          <div className="text-sm font-bold text-slate-800">142 km</div>
        </div>
        <div>
          <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Est. Travel Time</div>
          <div className="text-sm font-bold text-slate-800">4h 30m</div>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 border-b border-slate-200 text-[10px] uppercase font-bold text-slate-500 tracking-wider">
            <tr>
              <th className="px-6 py-3">Seq</th>
              <th className="px-6 py-3">Checkpoint Location</th>
              <th className="px-6 py-3">Zone Type</th>
              <th className="px-6 py-3">Planned Arrival</th>
              <th className="px-6 py-3">Actual / Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {activeTrip.plannedRoute.slice().sort((a, b) => a.sequence - b.sequence).map(p => {
              const isPast = activeTrip.plannedRoute.findIndex(r => r.id === activeTrip.lastCheckpointId) >= activeTrip.plannedRoute.findIndex(r => r.id === p.id);
              return (
                <tr key={p.id} className="hover:bg-slate-50/50">
                  <td className="px-6 py-4 font-bold text-slate-400">{p.sequence}</td>
                  <td className="px-6 py-4 font-semibold text-slate-800">{p.label}</td>
                  <td className="px-6 py-4">
                    <span className="px-2 py-1 bg-slate-100 text-slate-600 rounded text-[10px] font-bold uppercase">{p.type}</span>
                  </td>
                  <td className="px-6 py-4 text-slate-600 text-xs">
                    {p.plannedArrival ? new Date(p.plannedArrival).toLocaleString() : 'TBD'}
                  </td>
                  <td className="px-6 py-4">
                    {isPast ? (
                      <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded border border-emerald-200">Reached</span>
                    ) : (
                      <span className="text-xs font-bold text-slate-400">Pending</span>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
      <button className="flex items-center gap-2 text-sm font-bold text-[#1976D2] hover:underline px-2"><PlusCircle className="w-4 h-4" /> Add Custom Checkpoint</button>
    </div>
  );
};

const GeofenceDashboard = ({ tracking }: { tracking: TripTracking[] }) => {
  const allEvents = tracking.flatMap(t => t.geofenceEvents.map(e => ({...e, tripId: t.mrRef}))).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2"><MapPin className="text-purple-600 w-5 h-5"/> Geofence Monitoring Dashboard</h2>
        <p className="text-xs text-slate-500">Global view of boundary entries and exits</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {['Warehouse Geofence', 'Customer Site', 'Project Site', 'Restricted Zone'].map((z, i) => (
          <div key={i} className="p-4 bg-white border border-slate-200 rounded-xl shadow-sm flex items-center justify-between">
            <span className="text-xs font-bold text-slate-600">{z}</span>
            <span className={`w-2 h-2 rounded-full ${z === 'Restricted Zone' ? 'bg-red-500' : 'bg-emerald-500'}`} />
          </div>
        ))}
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 border-b border-slate-200 text-[10px] uppercase font-bold text-slate-500 tracking-wider">
            <tr>
              <th className="px-6 py-3">Event Type</th>
              <th className="px-6 py-3">Trip ID</th>
              <th className="px-6 py-3">Location / Zone</th>
              <th className="px-6 py-3">Timestamp</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {allEvents.length === 0 ? (
              <tr><td colSpan={4} className="px-6 py-8 text-center text-slate-400 text-xs">No geofence events recorded.</td></tr>
            ) : allEvents.map((ev, i) => (
              <tr key={i} className="hover:bg-slate-50/50">
                <td className="px-6 py-4">
                  <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase ${ev.eventType === 'Entered' ? 'bg-emerald-100 text-emerald-700' : 'bg-orange-100 text-orange-700'}`}>
                    {ev.eventType}
                  </span>
                </td>
                <td className="px-6 py-4 font-mono font-bold text-[#1976D2] text-xs">{ev.tripId}</td>
                <td className="px-6 py-4">
                  <div className="font-semibold text-slate-800">{ev.checkpointLabel}</div>
                  <div className="text-[10px] text-slate-500 uppercase">{ev.geofenceZone}</div>
                </td>
                <td className="px-6 py-4 text-xs font-mono text-slate-600">{new Date(ev.timestamp).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const AlertsDashboard = ({ tracking, onAcknowledge }: { tracking: TripTracking[], onAcknowledge: (alertId: string, tripId: string) => void }) => {
  const allAlerts = tracking.flatMap(t => t.alerts.map(a => ({...a, tripId: t.mrRef, driver: t.driver, vehiclePlate: t.vehiclePlate})))
                            .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  const getAlertColor = (type: string) => {
    if (type === 'Route Deviation' || type === 'Unauthorized Geofence Breach' || type === 'Driver SOS' || type === 'Vehicle Breakdown') return 'border-red-200 bg-red-50 text-red-800';
    if (type === 'Delayed Arrival' || type === 'Prolonged Stoppage') return 'border-orange-200 bg-orange-50 text-orange-800';
    return 'border-slate-200 bg-slate-50 text-slate-800';
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2"><ShieldAlert className="text-red-600 w-5 h-5"/> Operational Alerts Dashboard</h2>
        <p className="text-xs text-slate-500">Monitor and resolve critical trip exceptions</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {allAlerts.length === 0 ? (
          <div className="col-span-2 p-8 text-center text-slate-400">No alerts generated across any trips.</div>
        ) : allAlerts.map(a => (
          <div key={a.id} className={`p-5 rounded-2xl border ${getAlertColor(a.type)} relative overflow-hidden transition-all ${a.acknowledged ? 'opacity-60 grayscale' : 'shadow-md'}`}>
            {!a.acknowledged && <div className="absolute top-0 left-0 w-1.5 h-full bg-red-500" />}
            
            <div className="flex justify-between items-start mb-3">
              <div className="flex items-center gap-2">
                <AlertOctagon className="w-5 h-5 opacity-80" />
                <span className="font-black text-sm uppercase tracking-wide">{a.type}</span>
              </div>
              <div className="text-[10px] font-mono opacity-70 bg-white/50 px-2 py-1 rounded">
                {new Date(a.timestamp).toLocaleString()}
              </div>
            </div>
            
            <p className="text-sm font-medium mb-4 opacity-90">{a.message}</p>
            
            <div className="grid grid-cols-2 gap-2 text-xs font-medium bg-white/40 p-2.5 rounded-lg mb-4">
              <div><span className="opacity-60 block text-[9px] uppercase tracking-wider">Trip ID</span> {a.tripId}</div>
              <div><span className="opacity-60 block text-[9px] uppercase tracking-wider">Vehicle</span> {a.vehiclePlate}</div>
            </div>

            <div className="flex items-center justify-between mt-2 pt-3 border-t border-black/10">
              <div className="text-[10px] font-bold uppercase tracking-wider opacity-70">
                {a.acknowledged ? `Acknowledged by ${a.acknowledgedBy}` : 'Action Required'}
              </div>
              {!a.acknowledged && (
                <div className="flex gap-2">
                  <button onClick={() => onAcknowledge(a.id, a.tripId)} className="px-3 py-1.5 bg-white text-slate-800 rounded shadow-sm text-xs font-bold hover:bg-slate-100">Acknowledge</button>
                  <button className="px-3 py-1.5 bg-black text-white rounded shadow-sm text-xs font-bold hover:bg-slate-800">Resolve</button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const TripTimeline = ({ activeTrip }: { activeTrip: TripTracking }) => {
  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div className="text-center">
        <h2 className="text-lg font-bold text-slate-800">Trip Lifecycle Timeline</h2>
        <p className="text-xs text-slate-500">{activeTrip.mrRef} • {activeTrip.vehiclePlate}</p>
      </div>

      <div className="relative pl-8 pt-4 pb-8 space-y-8">
        {/* Vertical Line */}
        <div className="absolute left-10 top-8 bottom-8 w-1 bg-slate-100 rounded-full" />
        
        {activeTrip.milestones.map((m, i) => {
          const isCompleted = m.status === 'Delivered' || m.status === 'Returned';
          return (
            <div key={m.id} className="relative z-10 flex gap-6 items-start">
              <div className={`w-5 h-5 rounded-full flex-shrink-0 mt-1 border-4 border-white shadow-sm ${isCompleted ? 'bg-emerald-500' : 'bg-[#1976D2]'}`} />
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex-1">
                <div className="flex justify-between items-start mb-1">
                  <h3 className="font-black text-sm text-slate-800 uppercase tracking-wide">{m.status}</h3>
                  <span className="text-[10px] font-mono text-slate-400 bg-slate-50 px-2 py-1 rounded border border-slate-100">{new Date(m.timestamp).toLocaleString()}</span>
                </div>
                <div className="text-xs text-slate-500 font-medium mb-2">Logged by: {m.user}</div>
                {m.note && <p className="text-sm text-slate-700 bg-slate-50 p-3 rounded-lg border border-slate-100 italic">"{m.note}"</p>}
                {m.photoUrl && (
                  <div className="mt-3">
                    <img src={m.photoUrl} alt="Milestone proof" className="h-24 rounded-lg border border-slate-200 shadow-sm object-cover" />
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {activeTrip.tripStatus !== 'Completed' && (
           <div className="relative z-10 flex gap-6 items-start opacity-50">
             <div className="w-5 h-5 rounded-full flex-shrink-0 mt-1 border-4 border-white bg-slate-300" />
             <div className="bg-transparent p-4 border-2 border-dashed border-slate-200 rounded-xl flex-1 text-center">
               <span className="text-sm font-bold text-slate-400 uppercase tracking-widest">Awaiting Next Milestone</span>
             </div>
           </div>
        )}
      </div>
    </div>
  );
};

export default function TrackingScreen({ tracking, onSaveTracking }: TrackingScreenProps) {
  const [selectedMrRef, setSelectedMrRef] = useState(tracking[0]?.mrRef || '');
  const [activeTab, setActiveTab] = useState<'live' | 'planning' | 'geofence' | 'alerts' | 'timeline'>('live');

  const activeTrip = tracking.find(t => t.mrRef === selectedMrRef) || tracking[0];

  // --- KPI Calculation ---
  const activeTripsCount = tracking.filter(t => t.tripStatus === 'Active').length;
  const inTransitCount = tracking.filter(t => t.tripStatus === 'Active' && t.connectivity === 'Online').length;
  const delayedCount = tracking.flatMap(t => t.alerts).filter(a => a.type === 'Delayed Arrival' && !a.acknowledged).length;
  const devianceCount = tracking.flatMap(t => t.alerts).filter(a => a.type === 'Route Deviation' && !a.acknowledged).length;
  const geofenceAlertsCount = tracking.flatMap(t => t.alerts).filter(a => a.type === 'Unauthorized Geofence Breach' && !a.acknowledged).length;
  const completedTodayCount = tracking.filter(t => t.tripStatus === 'Completed').length; // Mocked as today

  if (!activeTrip) {
    return <div className="p-6 text-slate-500">No tracking data available.</div>;
  }

  return (
    <div className="space-y-6 pb-20 font-sans text-slate-800 bg-[#F8F9FA] p-2 rounded-2xl min-h-screen">
      {/* HEADER / TRIP SELECTOR */}
      <div className="flex flex-wrap items-center justify-between bg-white p-4 rounded-2xl shadow-sm border border-slate-200/60">
        <div>
          <h1 className="text-lg font-bold text-[#0D47A1] tracking-tight">GPS Tracking Module</h1>
          <p className="text-xs text-slate-500">Live monitoring & route execution</p>
        </div>
        <div className="flex items-center gap-4">
           <span className="text-xs font-semibold text-slate-600">Select Trip:</span>
           <select
             value={selectedMrRef}
             onChange={(e) => setSelectedMrRef(e.target.value)}
             className="h-10 px-4 rounded-xl border border-slate-200 text-sm font-medium text-[#0D47A1] bg-blue-50/50 focus:outline-none focus:ring-2 focus:ring-[#1976D2]/50"
           >
             {tracking.map(t => (
               <option key={t.mrRef} value={t.mrRef}>{t.mrRef} • {t.vehiclePlate}</option>
             ))}
           </select>
           <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-100">
             <RefreshCw className="w-3 h-3 animate-spin-slow" /> Live 
           </div>
        </div>
      </div>

      {/* KPI DASHBOARD */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {[
          { label: 'Active Trips', val: activeTripsCount, icon: Navigation, col: 'text-blue-600 bg-blue-50 border-blue-100' },
          { label: 'In Transit', val: inTransitCount, icon: Truck, col: 'text-emerald-600 bg-emerald-50 border-emerald-100' },
          { label: 'Delayed', val: delayedCount, icon: Clock, col: 'text-orange-600 bg-orange-50 border-orange-100' },
          { label: 'Deviations', val: devianceCount, icon: Route, col: 'text-red-600 bg-red-50 border-red-100' },
          { label: 'Geofence Alerts', val: geofenceAlertsCount, icon: MapPin, col: 'text-purple-600 bg-purple-50 border-purple-100' },
          { label: 'Completed Today', val: completedTodayCount, icon: CheckCircle2, col: 'text-teal-600 bg-teal-50 border-teal-100' }
        ].map((kpi, i) => (
          <div key={i} className={`p-4 rounded-2xl shadow-sm border ${kpi.col} flex flex-col justify-between`}>
             <kpi.icon className="w-5 h-5 mb-2 opacity-80" />
             <div className="text-2xl font-black">{kpi.val}</div>
             <div className="text-[10px] uppercase tracking-wider font-bold opacity-80 mt-1">{kpi.label}</div>
          </div>
        ))}
      </div>

      {/* TAB NAVIGATION */}
      <div className="flex space-x-2 bg-white p-1.5 rounded-xl shadow-sm border border-slate-200 overflow-x-auto">
        {[
          { id: 'live', label: 'Live GPS Map', icon: Compass },
          { id: 'planning', label: 'Route Planning', icon: Route },
          { id: 'geofence', label: 'Geofence Monitoring', icon: MapPin },
          { id: 'alerts', label: 'Alerts', icon: ShieldAlert },
          { id: 'timeline', label: 'Trip Timeline', icon: Activity }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all whitespace-nowrap ${
              activeTab === tab.id 
                ? 'bg-[#1976D2] text-white shadow-md' 
                : 'text-slate-600 hover:bg-blue-50 hover:text-[#0D47A1]'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* TAB CONTENTS */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 min-h-[500px]">
        {activeTab === 'live' && <LiveGPSDashboard activeTrip={activeTrip} tracking={tracking} />}
        {activeTab === 'planning' && <RoutePlanningScreen activeTrip={activeTrip} />}
        {activeTab === 'geofence' && <GeofenceDashboard tracking={tracking} />}
        {activeTab === 'alerts' && <AlertsDashboard tracking={tracking} onAcknowledge={(alertId, tripId) => {
           const trip = tracking.find(t => t.mrRef === tripId);
           if (!trip) return;
           const updated = {
              ...trip,
              alerts: trip.alerts.map(a => a.id === alertId ? { ...a, acknowledged: true, acknowledgedBy: CURRENT_USER, acknowledgedDate: new Date().toISOString() } : a)
           };
           onSaveTracking(updated);
        }} />}
        {activeTab === 'timeline' && <TripTimeline activeTrip={activeTrip} />}
      </div>
    </div>
  );
}

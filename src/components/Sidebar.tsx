import React from 'react';
import { 
  LayoutDashboard, 
  FileText, 
  Activity, 
  Users, 
  ShieldCheck, 
  MapPin, 
  BookOpen, 
  Percent, 
  Truck, 
  FolderCheck, 
  Settings,
  Layers,
  UserCheck,
  ShieldAlert,
  Navigation,
  PackageCheck
} from 'lucide-react';

interface SidebarProps {
  currentScreen: string;
  setScreen: (screen: string) => void;
}

export default function Sidebar({ currentScreen, setScreen }: SidebarProps) {
  const menuItems = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard,
      group: 'Core Operations'
    },
    {
      id: 'mr',
      label: 'Transport requests (MR)',
      icon: FileText,
      group: 'Core Operations'
    },
    {
      id: 'work-analysis',
      label: 'Work analysis',
      icon: Activity,
      group: 'Planning & Analysis'
    },
    {
      id: 'supplier-quotation',
      label: 'Supplier Quotations',
      icon: Layers,
      group: 'Planning & Analysis'
    },
    {
      id: 'profitability',
      label: 'Profitability (PA)',
      icon: Percent,
      group: 'Planning & Analysis'
    },
    {
      id: 'suppliers',
      label: 'Suppliers',
      icon: Users,
      group: 'Asset & Partner Management'
    },
    {
      id: 'drivers',
      label: 'Drivers management',
      icon: UserCheck,
      group: 'Asset & Partner Management'
    },
    {
      id: 'vehicles',
      label: 'Vehicles management',
      icon: ShieldCheck,
      group: 'Asset & Partner Management'
    },
    {
      id: 'compliance',
      label: 'Vehicles & compliance',
      icon: ShieldCheck,
      group: 'Asset & Partner Management'
    },
    {
      id: 'sites',
      label: 'Sites & clusters',
      icon: MapPin,
      group: 'Master Data & Config'
    },
    {
      id: 'categories',
      label: 'Item categories',
      icon: Layers,
      group: 'Master Data & Config'
    },
    {
      id: 'price-book',
      label: 'Price Book',
      icon: BookOpen,
      group: 'Master Data & Config'
    },
    {
      id: 'item-tracking',
      label: 'Item Tracking & POD',
      icon: Truck,
      group: 'Execution & Closure'
    },
    {
      id: 'loading-confirmation',
      label: 'Loading Confirmation',
      icon: PackageCheck,
      group: 'Execution & Closure'
    },
    {
      id: 'tracking',
      label: 'GPS Tracking',
      icon: Navigation,
      group: 'Execution & Closure'
    },
    {
      id: 'wcc',
      label: 'Closure & WCC',
      icon: FolderCheck,
      group: 'Execution & Closure'
    },
    {
      id: 'incidents',
      label: 'Incident Management',
      icon: ShieldAlert,
      group: 'Execution & Closure'
    },
    {
      id: 'settings',
      label: 'Configuration',
      icon: Settings,
      group: 'System Management'
    }
  ];

  // Group items
  const groups = [
    'Core Operations',
    'Planning & Analysis',
    'Asset & Partner Management',
    'Master Data & Config',
    'Execution & Closure',
    'System Management'
  ];

  return (
    <div className="fixed top-0 bottom-0 left-0 w-[240px] h-screen bg-[#2C2C2A] flex flex-col shrink-0 select-none border-r border-[#2C2C2A] z-30" id="adiu-sidebar">
      {/* Brand Header */}
      <div className="p-5 flex flex-col gap-1">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-md bg-[#1D9E75] flex items-center justify-center text-white font-bold text-lg shadow-sm">
            <div className="w-4 h-4 border-2 border-white rounded-sm"></div>
          </div>
          <div className="flex flex-col">
            <span className="font-sans font-bold text-white text-lg tracking-tight leading-none">Adiu TMS</span>
            <span className="text-[10px] text-white/40 font-sans tracking-wide uppercase mt-1">Ethiopian Logistics</span>
          </div>
        </div>
      </div>

      {/* Navigation Links */}
      <div className="flex-1 overflow-y-auto py-4 px-3 space-y-6 scrollbar-thin">
        {groups.map((group) => {
          const itemsInGroup = menuItems.filter(item => item.group === group);
          if (itemsInGroup.length === 0) return null;

          return (
            <div key={group} className="space-y-1">
              <h3 className="px-3 text-[10px] font-semibold uppercase tracking-wider text-white/30 mb-2 font-sans">
                {group}
              </h3>
              <div className="space-y-0.5">
                {itemsInGroup.map((item) => {
                  const Icon = item.icon;
                  const isActive = currentScreen === item.id;
                  
                  return (
                    <button
                      key={item.id}
                      id={`sidebar-btn-${item.id}`}
                      onClick={() => setScreen(item.id)}
                      className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-sans font-medium transition-all text-left ${
                        isActive 
                          ? 'bg-white/5 text-[#1D9E75]' 
                          : 'text-white/60 hover:text-white hover:bg-white/5'
                      }`}
                    >
                      <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-[#1D9E75]' : 'text-white/55'}`} />
                      <span className="truncate">{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* User Status / Info */}
      <div className="p-4 border-t border-white/10 bg-white/5">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-white/10 text-white flex items-center justify-center font-bold text-xs">
            ST
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-xs font-medium text-white truncate">Solomon Tekle</span>
            <span className="text-[10px] text-white/40 truncate">Operations manager</span>
          </div>
        </div>
      </div>
    </div>
  );
}

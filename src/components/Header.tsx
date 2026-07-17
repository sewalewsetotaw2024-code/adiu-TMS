import React, { useState } from 'react';
import { Search, Bell, Clock, LogOut, Check } from 'lucide-react';

interface HeaderProps {
  currentScreen: string;
}

export default function Header({ currentScreen }: HeaderProps) {
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([
    { id: 1, text: 'New MR-2026-0414 requires work analysis.', time: '10 mins ago', read: false },
    { id: 2, text: 'Vehicle ET-3-C88145 flagged as non-compliant.', time: '2 hours ago', read: false },
    { id: 3, text: 'PA-2026-0210 has been approved by SCD.', time: '1 day ago', read: true }
  ]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAllAsRead = () => {
    setNotifications(notifications.map(n => ({ ...n, read: true })));
  };

  const getScreenTitle = () => {
    switch (currentScreen) {
      case 'dashboard':
        return { main: 'Dashboard', sub: 'Performance overview & metrics' };
      case 'mr':
        return { main: 'Transport requests (MR)', sub: 'Material request & transport dispatch coordination' };
      case 'work-analysis':
        return { main: 'Work analysis', sub: 'Truck capacity and route feasibility analysis' };
      case 'suppliers':
        return { main: 'Suppliers', sub: 'Service partner registry and rating scorecards' };
      case 'vehicles':
        return { main: 'Vehicles', sub: 'Fleet list, driver allocation, and QEHS audits' };
      case 'vehicles':
        return { main: 'Vehicles & compliance', sub: 'Fleet list, driver allocation, and QEHS audits' };
      case 'sites':
        return { main: 'Sites & clusters', sub: 'Project site coordinates and regional store clusters' };
      case 'price-book':
        return { main: 'Price Book', sub: 'Approved list prices and quote variance thresholds' };
      case 'categories':
        return { main: 'Item categories', sub: 'Flat categories classification for material requests' };
      case 'profitability':
        return { main: 'Profitability (PA)', sub: 'Supplier quotes, budget variance, and multi-tier routing approval' };
      case 'delivery':
        return { main: 'Delivery & proof', sub: 'Milestone tracking, last-mile approval, and photo proof' };
      case 'wcc':
        return { main: 'Closure & WCC', sub: 'Post-delivery document audit and PO reconciliation' };
      case 'settings':
        return { main: 'Configuration', sub: 'Adjust default parameters and threshold limits' };
      default:
        return { main: 'Adiu TMS', sub: 'Transport management system' };
    }
  };

  const { main, sub } = getScreenTitle();

  return (
    <div className="h-16 bg-white border-b border-[#D3D1C7] flex items-center justify-between px-8 shrink-0 relative select-none" id="adiu-header">
      {/* Left Breadcrumb info */}
      <div className="flex items-center gap-2 text-xs font-sans text-[#5F5E5A]">
        <span>Home</span>
        <span className="text-[#D3D1C7]">/</span>
        <span className="text-[#2C2C2A] font-medium">{main}</span>
        <span className="hidden md:inline-flex text-[#D3D1C7]">|</span>
        <span className="hidden md:inline-flex text-[11px] text-[#5F5E5A]/80 font-normal">{sub}</span>
      </div>

      {/* Right Tools Area */}
      <div className="flex items-center gap-6">
        {/* Search */}
        <div className="relative w-64">
          <Search className="w-3.5 h-3.5 text-[#5F5E5A] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input 
            type="text" 
            placeholder="Search..." 
            className="w-full h-9 pl-9 pr-3 rounded-lg border-none bg-[#F1EFE8] font-sans text-xs text-[#2C2C2A] focus:outline-none focus:ring-1 focus:ring-[#1D9E75] placeholder-[#5F5E5A]/60"
          />
        </div>

        {/* Date Time Indicator */}
        <div className="hidden lg:flex items-center gap-1.5 text-xs text-[#5F5E5A]">
          <Clock className="w-3.5 h-3.5 text-[#1D9E75]" />
          <span className="font-sans font-medium text-[11px]">System time: 2026-06-26 23:10</span>
        </div>

        {/* Notification Bell */}
        <div className="relative">
          <button 
            id="notification-bell-btn"
            onClick={() => setShowNotifications(!showNotifications)}
            className="w-9 h-9 rounded-lg border border-[#D3D1C7] hover:bg-[#F1EFE8] flex items-center justify-center transition-colors relative cursor-pointer"
          >
            <Bell className="w-4 h-4 text-[#2C2C2A]" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4.5 h-4.5 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center ring-2 ring-white">
                {unreadCount}
              </span>
            )}
          </button>

          {/* Notifications Dropdown */}
          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl border border-[#D3D1C7] shadow-lg z-50 py-3 flex flex-col">
              <div className="px-4 pb-2 border-b border-[#D3D1C7] flex items-center justify-between">
                <span className="text-xs font-semibold text-[#2C2C2A]">Notifications</span>
                {unreadCount > 0 && (
                  <button 
                    onClick={markAllAsRead}
                    className="text-[10px] text-[#1D9E75] hover:underline font-medium flex items-center gap-1"
                  >
                    <Check className="w-3 h-3" /> Mark read
                  </button>
                )}
              </div>
              <div className="max-h-60 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="p-4 text-center text-xs text-[#5F5E5A]">No messages.</div>
                ) : (
                  notifications.map((n) => (
                    <div 
                      key={n.id} 
                      className={`px-4 py-2.5 border-b border-[#D3D1C7]/40 hover:bg-[#F1EFE8]/40 flex flex-col gap-0.5 ${!n.read ? 'bg-[#1D9E75]/5' : ''}`}
                    >
                      <span className="text-[11px] text-[#2C2C2A] font-sans font-medium">{n.text}</span>
                      <span className="text-[9px] text-[#5F5E5A]">{n.time}</span>
                    </div>
                  ))
                )}
              </div>
              <div className="px-4 pt-2 text-center border-t border-[#D3D1C7] mt-1">
                <span className="text-[10px] text-[#5F5E5A]">Showing urgent dispatch updates</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

import React from 'react';
import { BarChart, Activity, TrendingUp, DollarSign } from 'lucide-react';

export default function ReportingScreen() {
  return (
    <div className="space-y-6 select-none pb-20">
      <div className="bg-white p-5 rounded-xl border border-[#D3D1C7] shadow-sm flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-[#2C2C2A]">Reporting & Analytics</h2>
          <p className="text-xs text-[#5F5E5A]">Detailed performance metrics, financial reports, and operational dashboards.</p>
        </div>
        <div className="w-10 h-10 rounded-full bg-[#1D9E75]/10 flex items-center justify-center text-[#1D9E75]">
          <BarChart className="w-5 h-5" />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Placeholder Report Cards */}
        <div className="bg-white p-6 rounded-xl border border-[#D3D1C7] shadow-sm hover:border-[#1D9E75] transition-colors cursor-pointer group">
          <div className="w-12 h-12 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600 mb-4 group-hover:scale-110 transition-transform">
            <Activity className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-[#2C2C2A] mb-2">Transport Operations Status</h3>
          <p className="text-xs text-[#5F5E5A]">Real-time view of active deliveries, pending requests, and resource utilization across all clusters.</p>
        </div>

        <div className="bg-white p-6 rounded-xl border border-[#D3D1C7] shadow-sm hover:border-[#1D9E75] transition-colors cursor-pointer group">
          <div className="w-12 h-12 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600 mb-4 group-hover:scale-110 transition-transform">
            <DollarSign className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-[#2C2C2A] mb-2">Profitability & Margins</h3>
          <p className="text-xs text-[#5F5E5A]">Financial breakdown of transport margins, actual vs. quoted analysis, and cost saving metrics.</p>
        </div>

        <div className="bg-white p-6 rounded-xl border border-[#D3D1C7] shadow-sm hover:border-[#1D9E75] transition-colors cursor-pointer group">
          <div className="w-12 h-12 rounded-lg bg-purple-50 flex items-center justify-center text-purple-600 mb-4 group-hover:scale-110 transition-transform">
            <TrendingUp className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-[#2C2C2A] mb-2">Vehicle Utilization</h3>
          <p className="text-xs text-[#5F5E5A]">Insights into fleet availability, maintenance downtime, and third-party transporter performance.</p>
        </div>
      </div>
    </div>
  );
}

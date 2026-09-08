import React from 'react';
import { 
  LayoutDashboard, 
  MapPin, 
  BookOpen, 
  Search, 
  Sliders, 
  Sparkles, 
  BarChart3, 
  Shield, 
  Lock,
  ExternalLink,
  BrainCircuit
} from 'lucide-react';
import { useAuthRole } from '../context/AuthRoleContext';

export default function Sidebar({ activeTab, setActiveTab }) {
  const { role, permissions } = useAuthRole();

  const navItems = role === 'policymaker' ? [
    { id: 'dashboard', label: 'Policy Command Center', icon: LayoutDashboard, badge: 'Home' },
    { id: 'gis-map', label: 'GIS District Intelligence', icon: MapPin, badge: 'Map' },
    { id: 'intelligence', label: 'Risk & Early Warnings', icon: BrainCircuit, badge: 'AI', highlight: true },
    { id: 'simulator', label: 'AI Policy Simulator', icon: Sliders, badge: 'Featured', highlight: true },
    { id: 'assistant', label: 'Research Briefing', icon: Sparkles, badge: 'Synthesis' },
    { id: 'analytics', label: 'Policy Analytics', icon: BarChart3, badge: null }
  ] : role === 'researcher' ? [
    { id: 'dashboard', label: 'Research Workspace', icon: LayoutDashboard, badge: 'Home' },
    { id: 'repository', label: 'Research Repository', icon: BookOpen, badge: 'Docs' },
    { id: 'search', label: 'Evidence Search (RAG)', icon: Search, badge: 'AI', highlight: true },
    { id: 'assistant', label: 'AI Research Assistant', icon: Sparkles, badge: 'Synthesis' },
    { id: 'intelligence', label: 'Document Verification', icon: BrainCircuit, badge: 'NEW', highlight: true },
    { id: 'simulator', label: 'Policy Scenario Lab', icon: Sliders, badge: 'Analysis' },
    { id: 'analytics', label: 'Research Analytics', icon: BarChart3, badge: null }
  ] : [
    { id: 'dashboard', label: 'Public Overview', icon: LayoutDashboard, badge: 'Home' },
    { id: 'gis-map', label: 'District Explorer', icon: MapPin, badge: 'Map' },
    { id: 'analytics', label: 'Public Analytics', icon: BarChart3, badge: null }
  ];

  return (
    <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col shrink-0 border-r border-slate-800 min-h-[calc(100vh-80px)]">
      {/* Navigation Links */}
      <div className="p-3 space-y-1 flex-1">
        <div className="px-3 py-2 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
          Platform Navigation
        </div>

        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg text-xs font-medium transition-all group ${
                isActive
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-900/30'
                  : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
              } ${item.highlight && !isActive ? 'border border-blue-500/20 bg-blue-950/20' : ''}`}
            >
              <div className="flex items-center gap-3">
                <Icon className={`w-4 h-4 transition-colors ${
                  isActive 
                    ? 'text-white' 
                    : item.highlight 
                    ? 'text-blue-400 group-hover:text-blue-300' 
                    : 'text-slate-400 group-hover:text-slate-200'
                }`} />
                <span>{item.label}</span>
              </div>

              {item.badge && (
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                  isActive
                    ? 'bg-blue-700 text-blue-100'
                    : item.highlight
                    ? 'bg-blue-900/60 text-blue-300 border border-blue-700/50'
                    : 'bg-slate-800 text-slate-400'
                }`}>
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}

        {/* Role Permissions Card */}
        <div className="pt-6 px-1">
          <div className="p-3.5 rounded-xl bg-slate-800/60 border border-slate-700/60 text-xs space-y-2">
            <div className="flex items-center gap-1.5 font-semibold text-slate-200">
              <Shield className="w-3.5 h-3.5 text-blue-400" />
              <span>Role-specific access</span>
            </div>
            <div className="space-y-1 text-[11px] text-slate-400">
              <div className="flex items-center justify-between">
                <span>Doc Upload:</span>
                <span className={permissions.canUploadDocuments ? 'text-emerald-400 font-medium' : 'text-slate-500'}>
                  {permissions.canUploadDocuments ? 'Enabled' : 'Restricted'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span>AI Simulation:</span>
                <span className={permissions.canRunSimulations ? 'text-emerald-400 font-medium' : 'text-slate-500'}>
                  {permissions.canRunSimulations ? 'Full Access' : 'View Only'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span>Research Synthesis:</span>
                <span className={permissions.canRunResearchAssistant ? 'text-emerald-400 font-medium' : 'text-slate-500'}>
                  {permissions.canRunResearchAssistant ? 'Full Access' : 'View Only'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Branding */}
      <div className="p-4 border-t border-slate-800 bg-slate-950/60 text-[11px] text-slate-500">
        <div className="font-semibold text-slate-400">Smart India Hackathon 2024</div>
        <div>Problem Statement: #26019</div>
        <div className="text-[10px] text-slate-600 mt-1">
          MoRD Dept. of Land Resources
        </div>
      </div>
    </aside>
  );
}

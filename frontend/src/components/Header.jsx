import React, { useState } from 'react';
import { Building2, UserCircle, ChevronDown, LogOut, ShieldCheck, Cpu } from 'lucide-react';
import { useAuthRole } from '../context/AuthRoleContext';
import { api } from '../services/api';

export default function Header() {
  const { user, profile, logout, permissions } = useAuthRole();
  const [open, setOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
  };

  return (
    <header className="bg-slate-900 text-white border-b border-slate-800 sticky top-0 z-40 shadow-md">
      <div className="bg-slate-950 border-b border-slate-800 px-4 py-1.5 text-[11px] text-slate-400 flex justify-between">
        <span className="font-medium text-slate-300">BhoomiIntel · National Land Governance Intelligence</span>
        <span className="hidden sm:flex items-center gap-1.5 text-emerald-400"><span className="w-1.5 h-1.5 rounded-full bg-emerald-400"/> Secure session</span>
      </div>
      <div className="px-4 lg:px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-700 to-emerald-600 p-0.5 shadow-lg flex items-center justify-center">
            <div className="w-full h-full bg-slate-900 rounded-[10px] flex items-center justify-center"><Building2 className="w-5 h-5 text-blue-400"/></div>
          </div>
          <div>
            <div className="flex items-center gap-2"><h1 className="text-lg font-bold tracking-tight">BhoomiIntel</h1><span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30">LandGov AI</span></div>
            <p className="text-[11px] text-slate-400 hidden sm:block">Research · GIS · Policy Intelligence</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-xs">
            <Cpu className="w-3.5 h-3.5 text-indigo-400"/>
            <span className="text-slate-400">AI model</span>
            <span className="font-semibold">Configured server-side</span>
          </div>
          <div className="relative">
            <button onClick={() => setOpen(v => !v)} className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700">
              <UserCircle className="w-4 h-4 text-blue-400"/>
              <div className="hidden sm:block text-left"><div className="text-xs font-semibold">{profile.name}</div><div className="text-[10px] text-slate-400">{profile.badge}</div></div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400"/>
            </button>
            {open && <div className="absolute right-0 mt-2 w-72 bg-white text-slate-900 rounded-xl shadow-2xl border border-slate-200 overflow-hidden">
              <div className="p-4 border-b bg-slate-50">
                <div className="font-semibold text-sm">{user.name}</div>
                <div className="text-xs text-slate-500">{user.email}</div>
                <span className={`inline-flex mt-2 text-[10px] px-2 py-1 rounded border ${profile.badgeColor}`}>{user.role}</span>
              </div>
              <div className="p-3 text-xs text-slate-500 flex items-center gap-2"><ShieldCheck className="w-4 h-4 text-emerald-600"/> Permissions enforced by the server</div>
              <button onClick={handleLogout} className="w-full border-t p-3 text-left text-sm font-semibold text-red-600 hover:bg-red-50 flex items-center gap-2"><LogOut className="w-4 h-4"/> Sign out</button>
            </div>}
          </div>
        </div>
      </div>
    </header>
  );
}

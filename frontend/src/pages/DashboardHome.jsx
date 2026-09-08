import React, { useEffect, useState } from 'react';
import {
  AlertTriangle, ArrowRight, BarChart3, BookOpen, CheckCircle2, FileCheck2,
  FileText, Gauge, MapPin, ShieldCheck, Sliders, Sparkles, Users, TrendingUp, Radio, RefreshCw
} from 'lucide-react';
import { api } from '../services/api';
import { useAuthRole, ROLES } from '../context/AuthRoleContext';
import AIBadge from '../components/AIBadge';

const roleCopy = {
  policymaker: {
    eyebrow: 'POLICY COMMAND CENTER',
    title: 'Turn land data into policy decisions',
    text: 'Prioritize districts, test interventions, monitor risk signals and review evidence before taking action.',
    accent: 'blue'
  },
  researcher: {
    eyebrow: 'RESEARCH WORKSPACE',
    title: 'Discover evidence behind land-governance problems',
    text: 'Search policy literature, compare documents and build evidence-backed research insights for decision makers.',
    accent: 'emerald'
  },
  public: {
    eyebrow: 'PUBLIC LAND GOVERNANCE VIEW',
    title: 'Understand how land governance is performing',
    text: 'Explore published district indicators, digitization progress and public-facing governance insights.',
    accent: 'indigo'
  }
};

function Stat({ label, value, hint, icon: Icon }) {
  return <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
    <div className="flex items-center justify-between"><span className="text-xs font-semibold uppercase tracking-wider text-slate-500">{label}</span><div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center text-slate-600"><Icon className="w-4 h-4"/></div></div>
    <div className="text-3xl font-black text-slate-950 mt-3">{value}</div>
    <div className="text-xs text-slate-500 mt-1">{hint}</div>
  </div>;
}

function ActionCard({ icon: Icon, title, text, button, onClick, tone='blue' }) {
  const tones = { blue:'border-blue-200 bg-blue-50/60 text-blue-700', emerald:'border-emerald-200 bg-emerald-50/60 text-emerald-700', indigo:'border-indigo-200 bg-indigo-50/60 text-indigo-700', amber:'border-amber-200 bg-amber-50/60 text-amber-700' };
  return <div className={`rounded-2xl border p-5 ${tones[tone]}`}><div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shadow-sm"><Icon className="w-5 h-5"/></div><h3 className="font-bold text-slate-950 mt-4">{title}</h3><p className="text-xs leading-5 text-slate-600 mt-1">{text}</p><button onClick={onClick} className="mt-4 inline-flex items-center gap-1 text-xs font-bold text-slate-900 hover:gap-2 transition-all">{button}<ArrowRight className="w-3.5 h-3.5"/></button></div>;
}

export default function DashboardHome({ setActiveTab, onSelectDistrictForSim }) {
  const { role, user } = useAuthRole();
  const [metrics, setMetrics] = useState(null);
  const [simulations, setSimulations] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [live, setLive] = useState(null);
  const [refreshingLive, setRefreshingLive] = useState(false);

  const loadData = async (refreshLive = false) => {
    try {
      setLoading(true);
      const [m, s, d, l] = await Promise.all([api.getDashboardMetrics(), api.getSimulations(), api.getDistrictsGeoJSON(), api.getLiveDILRMP(refreshLive)]);
      setMetrics(m.metrics); setSimulations(s.data || []); setDistricts(d.features || []); setLive(l);
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  useEffect(() => { loadData(); }, []);

  const refreshLive = async () => {
    setRefreshingLive(true);
    try { setLive(await api.getLiveDILRMP(true)); } catch (e) { console.error(e); } finally { setRefreshingLive(false); }
  };

  const copy = roleCopy[role] || roleCopy.public;
  const national = live?.national || {};
  const districtCount = national.master?.districts || metrics?.districts_covered || districts.length;
  const rorPct = national.land_records?.percent;
  const mapsPct = national.digitized_maps?.percent;
  const sroPct = national.sro_computerized?.percent;
  const revenueCourtPct = national.revenue_courts?.percent;
  const liveReady = Boolean(live?.success && !live?.stale);
  const fetchedAt = live?.fetched_at ? new Date(live.fetched_at).toLocaleString() : null;
  const digitization = rorPct ?? null;
  const disputes = metrics?.total_monitored_disputes ?? 0;

  return <div className="space-y-6">
    <section className="relative overflow-hidden rounded-3xl bg-slate-950 text-white p-7 lg:p-9 border border-slate-800 shadow-xl">
      <div className="absolute inset-0 opacity-30 bg-[radial-gradient(circle_at_80%_20%,#2563eb,transparent_35%),radial-gradient(circle_at_20%_100%,#059669,transparent_30%)]"/>
      <div className="relative max-w-4xl">
        <div className="flex flex-wrap items-center gap-2 text-[11px] font-bold tracking-widest"><span className="text-blue-300">{copy.eyebrow}</span><span className="text-slate-600">•</span><span className="text-slate-400">{user?.name} · {user?.role}</span><AIBadge/></div>
        <h1 className="text-3xl lg:text-4xl font-black tracking-tight mt-3">{copy.title}</h1>
        <p className="text-sm lg:text-base text-slate-300 leading-6 mt-3 max-w-3xl">{copy.text}</p>
        <div className="flex flex-wrap gap-3 mt-6">
          {role === ROLES.POLICYMAKER && <button onClick={()=>setActiveTab('simulator')} className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-sm font-bold flex items-center gap-2"><Sliders className="w-4 h-4"/>Launch Policy Simulator</button>}
          {role === ROLES.RESEARCHER && <button onClick={()=>setActiveTab('search')} className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-sm font-bold flex items-center gap-2"><Sparkles className="w-4 h-4"/>Search Research Evidence</button>}
          {role === ROLES.PUBLIC && <button onClick={()=>setActiveTab('gis-map')} className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-sm font-bold flex items-center gap-2"><MapPin className="w-4 h-4"/>Explore District Map</button>}
        </div>
      </div>
    </section>

    <section className="bg-white border border-slate-200 rounded-2xl p-4 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 shadow-sm">
      <div className="flex items-start gap-3">
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${liveReady ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}><Radio className="w-4 h-4"/></div>
        <div>
          <div className="text-sm font-bold text-slate-900">{liveReady ? 'LIVE OFFICIAL DATA CONNECTED' : live?.stale ? 'LIVE SOURCE CACHE' : 'LIVE SOURCE UNAVAILABLE'}</div>
          <div className="text-[11px] text-slate-500 mt-0.5">DILRMP-MIS · Department of Land Resources · {fetchedAt ? `updated ${fetchedAt}` : 'waiting for official source'}</div>
        </div>
      </div>
      <div className="flex items-center gap-2">
        {live?.source_url && <a href={live.source_url} target="_blank" rel="noreferrer" className="text-xs font-semibold text-blue-700 hover:underline">Open official source</a>}
        <button onClick={refreshLive} disabled={refreshingLive} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-50"><RefreshCw className={`w-3.5 h-3.5 ${refreshingLive ? 'animate-spin' : ''}`}/>Refresh live data</button>
      </div>
    </section>

    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
      <Stat label="Districts in DILRMP" value={loading?'…':districtCount ?? 'N/A'} hint="Official national master count" icon={MapPin}/>
      <Stat label="RoR computerized" value={loading?'…':rorPct != null ? `${rorPct}%` : 'N/A'} hint="Official DILRMP indicator" icon={CheckCircle2}/>
      <Stat label="Cadastral maps digitized" value={loading?'…':mapsPct != null ? `${mapsPct}%` : 'N/A'} hint="Official DILRMP indicator" icon={ShieldCheck}/>
      {role === ROLES.POLICYMAKER ? <Stat label="Revenue courts online" value={loading?'…':revenueCourtPct != null ? `${revenueCourtPct}%` : 'N/A'} hint="Official DILRMP indicator" icon={AlertTriangle}/> : role === ROLES.RESEARCHER ? <Stat label="Saved simulations" value={loading?'…':simulations.length} hint="Modeled scenarios, not live facts" icon={Sliders}/> : <Stat label="SROs computerized" value={loading?'…':sroPct != null ? `${sroPct}%` : 'N/A'} hint="Official DILRMP indicator" icon={BarChart3}/>}
    </div>

    {role === ROLES.POLICYMAKER && <>
      <div className="flex items-end justify-between"><div><div className="text-xs font-bold uppercase tracking-widest text-blue-600">Decision workflow</div><h2 className="text-xl font-black text-slate-950 mt-1">What needs attention?</h2></div><button onClick={()=>setActiveTab('intelligence')} className="text-xs font-bold text-blue-600">Open Intelligence Center →</button></div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <ActionCard icon={Gauge} title="District Risk" text="Identify high-risk districts and understand the drivers behind each score." button="Review risk signals" onClick={()=>setActiveTab('intelligence')} />
        <ActionCard icon={Sliders} title="Policy Simulator" text="Test funding and administrative interventions before recommending a policy change." button="Run scenario" onClick={()=>setActiveTab('simulator')} tone="indigo" />
        <ActionCard icon={MapPin} title="Spatial Priorities" text="Use the GIS view to locate clusters of disputes, pendency and digitization gaps." button="Open GIS" onClick={()=>setActiveTab('gis-map')} tone="amber" />
      </div>
      <section className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm"><div className="p-5 border-b border-slate-100"><h3 className="font-bold">Recent policy scenarios</h3><p className="text-xs text-slate-500 mt-1">Only scenarios relevant to your policymaker workspace are shown.</p></div><div className="divide-y divide-slate-100">{simulations.slice(0,5).map(s=><div key={s.id} className="p-4 flex justify-between gap-4"><div><div className="text-sm font-bold">{s.district_name} · {s.policy_type}</div><div className="text-xs text-slate-500 mt-1">{s.predicted_impact?.rationale || 'Saved policy intervention scenario.'}</div></div><span className="text-xs font-bold text-emerald-600">-{s.predicted_impact?.dispute_reduction_pct || 40}% disputes</span></div>)}{!simulations.length&&<div className="p-6 text-sm text-slate-500">No scenarios yet. Launch the simulator to create the first one.</div>}</div></section>
    </>}

    {role === ROLES.RESEARCHER && <>
      <div className="flex items-end justify-between"><div><div className="text-xs font-bold uppercase tracking-widest text-emerald-600">Evidence workflow</div><h2 className="text-xl font-black text-slate-950 mt-1">Researcher tools</h2></div><button onClick={()=>setActiveTab('repository')} className="text-xs font-bold text-emerald-600">Open Repository →</button></div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <ActionCard icon={BookOpen} title="Research Repository" text="Upload, organize and publish policy documents for evidence retrieval." button="Manage documents" onClick={()=>setActiveTab('repository')} tone="emerald" />
        <ActionCard icon={Sparkles} title="AI Research Assistant" text="Synthesize findings across selected documents and turn evidence into a structured brief." button="Start synthesis" onClick={()=>setActiveTab('assistant')} />
        <ActionCard icon={FileCheck2} title="Cross-Document Verification" text="Compare extracted fields across documents and flag conflicts before using the evidence." button="Verify documents" onClick={()=>setActiveTab('intelligence')} tone="indigo" />
      </div>
      <section className="bg-emerald-950 text-white rounded-2xl p-6"><div className="flex items-center gap-2"><FileText className="w-5 h-5 text-emerald-300"/><h3 className="font-bold">Research-to-policy pipeline</h3></div><div className="grid grid-cols-1 md:grid-cols-4 gap-3 mt-5">{['Upload evidence','Semantic retrieval','AI synthesis','Policy-ready brief'].map((x,i)=><div key={x} className="rounded-xl bg-white/5 border border-white/10 p-4"><div className="text-xs text-emerald-300 font-bold">0{i+1}</div><div className="text-sm font-semibold mt-2">{x}</div></div>)}</div></section>
    </>}

    {role === ROLES.PUBLIC && <>
      <div className="flex items-end justify-between"><div><div className="text-xs font-bold uppercase tracking-widest text-indigo-600">Public information</div><h2 className="text-xl font-black text-slate-950 mt-1">Explore published land-governance insights</h2></div><button onClick={()=>setActiveTab('analytics')} className="text-xs font-bold text-indigo-600">View analytics →</button></div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <ActionCard icon={MapPin} title="District Explorer" text="See where digitization is progressing and where governance indicators need attention." button="Explore map" onClick={()=>setActiveTab('gis-map')} tone="indigo" />
        <ActionCard icon={BarChart3} title="Public Analytics" text="Compare published district indicators without access to internal research or policy controls." button="View trends" onClick={()=>setActiveTab('analytics')} />
        <ActionCard icon={Users} title="Citizen View" text="Understand governance performance through plain-language public indicators." button="Browse insights" onClick={()=>setActiveTab('gis-map')} tone="emerald" />
      </div>
      <section className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm"><h3 className="font-bold">Public snapshot</h3><p className="text-xs text-slate-500 mt-1">These indicators are intended for public understanding. They are not case-specific legal advice.</p><div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-5"><div className="p-4 rounded-xl bg-slate-50"><div className="text-xs text-slate-500">Digitization progress</div><div className="text-2xl font-black mt-1">{digitization}%</div></div><div className="p-4 rounded-xl bg-slate-50"><div className="text-xs text-slate-500">Districts monitored</div><div className="text-2xl font-black mt-1">{districtCount}</div></div><div className="p-4 rounded-xl bg-slate-50"><div className="text-xs text-slate-500">Governance disputes monitored</div><div className="text-2xl font-black mt-1">{disputes.toLocaleString()}</div></div></div></section>
    </>}

    <section className="bg-slate-950 text-white rounded-2xl p-5 border border-slate-800"><div className="flex items-center gap-2"><ShieldCheck className="w-4 h-4 text-emerald-300"/><h3 className="font-bold text-sm">Data integrity & provenance</h3></div><div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-4 text-xs"><div className="rounded-xl bg-white/5 border border-white/10 p-3"><div className="text-emerald-300 font-bold">OFFICIAL / LIVE</div><div className="text-slate-300 mt-1">DILRMP-MIS national modernization indicators fetched at runtime.</div></div><div className="rounded-xl bg-white/5 border border-white/10 p-3"><div className="text-blue-300 font-bold">ANALYTICAL</div><div className="text-slate-300 mt-1">Platform risk scores and trends are computed from available datasets.</div></div><div className="rounded-xl bg-white/5 border border-white/10 p-3"><div className="text-amber-300 font-bold">FORECAST</div><div className="text-slate-300 mt-1">Policy simulation outputs are modeled scenarios, not government commitments.</div></div></div><div className="text-[11px] text-slate-500 mt-4">District boundary geometry is labelled separately from official indicators. Scanned documents are evidence-ready only after successful OCR/manual transcription.</div></section>
  </div>;
}

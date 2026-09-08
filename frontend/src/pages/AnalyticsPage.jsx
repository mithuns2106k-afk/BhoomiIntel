import React, { useEffect, useState } from 'react';
import { BarChart3, Database, ExternalLink, RefreshCw, ShieldCheck } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { api } from '../services/api';

export default function AnalyticsPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = async (refresh = false) => {
    try {
      setLoading(true);
      if (refresh) await api.getLiveDILRMP(true);
      setData(await api.getAnalyticsTrends());
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const national = data?.live_national || {};
  const cards = [
    ['RoR computerized', national.land_records?.percent],
    ['Cadastral maps digitized', national.digitized_maps?.percent],
    ['Modern record rooms', national.modern_record_rooms?.percent],
    ['SROs computerized', national.sro_computerized?.percent]
  ];

  const refresh = async () => {
    setRefreshing(true);
    try { await load(true); } finally { setRefreshing(false); }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2"><BarChart3 className="w-5 h-5 text-blue-600"/>Live Land Governance Analytics</h2>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">OFFICIAL SOURCE</span>
          </div>
          <p className="text-xs text-slate-500 mt-1">Runtime indicators pulled from the Department of Land Resources DILRMP-MIS portal.</p>
        </div>
        <div className="flex items-center gap-3">
          {data?.live_source_url && <a href={data.live_source_url} target="_blank" rel="noreferrer" className="text-xs font-bold text-blue-700 inline-flex items-center gap-1">Official source <ExternalLink className="w-3 h-3"/></a>}
          <button onClick={refresh} disabled={refreshing} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-200 text-xs font-bold"><RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`}/>Refresh</button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map(([label, value]) => <div key={label} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm"><div className="text-xs font-semibold uppercase tracking-wider text-slate-500">{label}</div><div className="text-3xl font-black text-slate-950 mt-2">{loading ? '…' : value != null ? `${value}%` : 'N/A'}</div><div className="text-[11px] text-slate-500 mt-1">Official DILRMP indicator</div></div>)}
      </div>

      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-2 mb-4"><Database className="w-4 h-4 text-blue-600"/><div><h3 className="font-bold text-sm">Live district data</h3><p className="text-xs text-slate-500">District rows published through the official DILRMP-MIS source.</p></div></div>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={(data?.districts_comparison || []).slice(0, 20)}>
              <CartesianGrid strokeDasharray="3 3" vertical={false}/>
              <XAxis dataKey="name" tick={{fontSize:9}} interval={0} angle={-25} textAnchor="end" height={70}/>
              <YAxis tick={{fontSize:10}}/>
              <Tooltip contentStyle={{fontSize:'11px',borderRadius:'8px'}}/>
              <Legend wrapperStyle={{fontSize:'11px'}}/>
              <Bar dataKey="clr_completed_villages" fill="#059669" name="CLR completed villages" radius={[4,4,0,0]}/>
              <Bar dataKey="digitized_mapsheets" fill="#2563eb" name="Digitized mapsheets" radius={[4,4,0,0]}/>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
        <h3 className="font-bold text-sm">Recorded policy simulations</h3>
        <p className="text-xs text-slate-500 mt-1">Only scenarios actually run in BhoomiIntel are shown. These are model forecasts, not live government outcomes.</p>
        {data?.policy_efficacy_benchmarks?.length ? <div className="overflow-x-auto mt-4"><table className="w-full text-left text-xs"><thead className="bg-slate-50 border-b border-slate-200"><tr><th className="p-3">Policy type</th><th className="p-3">Average modeled dispute reduction</th><th className="p-3">Runs</th><th className="p-3">Status</th></tr></thead><tbody className="divide-y divide-slate-100">{data.policy_efficacy_benchmarks.map((b)=><tr key={b.intervention}><td className="p-3 font-semibold">{b.intervention}</td><td className="p-3 text-emerald-700 font-bold">{b.avg_reduction}%</td><td className="p-3">{b.sample_count}</td><td className="p-3">Model output</td></tr>)}</tbody></table></div> : <div className="p-5 mt-4 rounded-xl bg-slate-50 text-xs text-slate-500">No saved policy simulations yet.</div>}
      </div>

      <div className="text-[11px] text-slate-400 flex items-center gap-2"><ShieldCheck className="w-3.5 h-3.5"/> Source timestamp: {data?.live_fetched_at ? new Date(data.live_fetched_at).toLocaleString() : 'Unavailable'}. Official source data may be updated by State/UT administrations.</div>
    </div>
  );
}

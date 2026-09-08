import React, { useState, useEffect } from 'react';
import { 
  Sliders, 
  Sparkles, 
  TrendingDown, 
  TrendingUp, 
  AlertTriangle, 
  ShieldAlert, 
  CheckCircle2, 
  Clock, 
  DollarSign, 
  Layers, 
  MapPin, 
  RotateCcw,
  BarChart2,
  Users,
  AlertCircle,
  ChevronRight,
  History,
  Trash2,
  Info
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Legend, 
  Cell 
} from 'recharts';
import { api } from '../services/api';
import { useAuthRole } from '../context/AuthRoleContext';
import AIBadge from '../components/AIBadge';

const INTERVENTIONS = [
  {
    id: 'Digitize Land Records & Cadastral Blockchain Hashing',
    name: 'Digitize Land Records & Cadastral Drone Mapping (DILRMP + SVAMITVA)',
    description: 'High-resolution drone orthophotos, computerization of RoRs, and real-time auto-mutation linkages.'
  },
  {
    id: 'Specialized Fast-Track Land Dispute Tribunals',
    name: 'Specialized Fast-Track Land Dispute Tribunals (180-Day Summary Disposal)',
    description: 'Mandatory pre-litigation Lok Adalats, digital evidence admissibility, and dedicated revenue magistrate benches.'
  },
  {
    id: 'Restrict Agricultural-to-Non-Agricultural Conversion',
    name: 'Restrict Agricultural-to-Non-Agricultural Conversion (Peri-Urban Zoning)',
    description: 'Statutory greenbelts preventing speculative farmland sub-divisions and unregularized layout formations.'
  },
  {
    id: 'Forest Rights Act (FRA) Customary Community Resource Titling',
    name: 'Forest Rights Act (FRA) Customary Community Resource Titling',
    description: 'GPS boundary delineation of Gram Sabha community forest rights and PESA 1996 statutory alignment.'
  },
  {
    id: 'AI Cadastral Boundary Cross-Verification & Auto-Mutation',
    name: 'AI Cadastral Boundary Cross-Verification & Auto-Mutation Sync',
    description: 'Algorithmically detecting overlapping survey numbers during property registration before disputes escalate.'
  }
];

export default function PolicySimulationPage({ preselectedDistrictId, setActiveTab }) {
  const { role, permissions } = useAuthRole();
  const [districts, setDistricts] = useState([]);
  const [selectedDistrictId, setSelectedDistrictId] = useState(preselectedDistrictId || 1);
  const [policyType, setPolicyType] = useState(INTERVENTIONS[0].id);
  const [rolloutPct, setRolloutPct] = useState(80);
  const [timelineYears, setTimelineYears] = useState(3);
  const [enforcementLevel, setEnforcementLevel] = useState('high');
  const [focusArea, setFocusArea] = useState('balanced');

  const [loading, setLoading] = useState(false);
  const [simulationResult, setSimulationResult] = useState(null);
  const [pastSimulations, setPastSimulations] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadDistricts();
    loadPastSimulations();
  }, []);

  useEffect(() => {
    if (preselectedDistrictId) {
      setSelectedDistrictId(preselectedDistrictId);
    }
  }, [preselectedDistrictId]);

  const loadDistricts = async () => {
    try {
      const res = await api.getDistrictsGeoJSON();
      const features = res.features || [];
      setDistricts(features);
      if (!preselectedDistrictId && features.length > 0) {
        setSelectedDistrictId(features[0].properties.id);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const loadPastSimulations = async () => {
    try {
      const res = await api.getSimulations();
      setPastSimulations(res.data || []);
      // If no active result yet, set the latest simulation as default view
      if (!simulationResult && res.data && res.data.length > 0) {
        const latest = res.data[0];
        setSimulationResult({
          district: {
            name: latest.district_name,
            baseline_disputes: latest.predicted_impact.baseline_dispute_count,
            baseline_efficiency: latest.predicted_impact.projected_land_use_efficiency - latest.predicted_impact.land_use_efficiency_change_pct
          },
          policy_type: latest.policy_type,
          parameters: latest.parameters,
          predicted_impact: latest.predicted_impact
        });
      }
    } catch (err) {
      console.error(err);
    }
  };

  const currentDistrict = districts.find(d => d.properties.id === Number(selectedDistrictId))?.properties;

  const handleRunSimulation = async (e) => {
    if (e) e.preventDefault();
    if (!selectedDistrictId) return;

    setLoading(true);
    setError('');

    try {
      const payload = {
        district_id: Number(selectedDistrictId),
        policy_type: policyType,
        rollout_pct: Number(rolloutPct),
        timeline_years: Number(timelineYears),
        enforcement_level: enforcementLevel,
        focus_area: focusArea
      };

      const res = await api.runSimulation(payload);
      setSimulationResult(res);
      await loadPastSimulations();
    } catch (err) {
      setError(err.message || 'Simulation execution failed');
    } finally {
      setLoading(false);
    }
  };

  // Prepare chart data for Before vs After
  const beforeAfterData = simulationResult ? [
    {
      name: 'Disputes Count',
      Before: simulationResult.predicted_impact.baseline_dispute_count,
      After: simulationResult.predicted_impact.projected_dispute_count,
      unit: 'cases'
    },
    {
      name: 'Efficiency Index',
      Before: Math.round((simulationResult.predicted_impact.projected_land_use_efficiency - simulationResult.predicted_impact.land_use_efficiency_change_pct) * 10) / 10,
      After: simulationResult.predicted_impact.projected_land_use_efficiency,
      unit: '%'
    }
  ] : [];

  // Trajectory line chart data
  const trajectoryData = simulationResult?.predicted_impact?.timeline_milestones?.map(m => ({
    name: `Year ${m.year}`,
    Disputes: m.projected_dispute_count,
    Reduction: `${m.dispute_reduction_pct}%`
  })) || [];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 rounded-2xl p-6 lg:p-8 text-white shadow-xl border border-slate-800">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-400 text-slate-950 uppercase tracking-wide">
                Standout Feature
              </span>
              <AIBadge model="Claude Policy Simulation Engine" />
            </div>
            <h2 className="text-2xl font-bold tracking-tight mt-2">
              AI Land Policy Simulation & Econometric Forecasting
            </h2>
            <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
              Model the systemic impact of land governance policy interventions before physical rollout. Simulate dispute reduction velocity, land use efficiency gains, and institutional risk factors.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start md:self-center">
            <button
              onClick={() => setShowHistory(!showHistory)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold transition-colors"
            >
              <History className="w-4 h-4 text-blue-400" />
              <span>Simulation History ({pastSimulations.length})</span>
            </button>
          </div>
        </div>

        {/* Prominent Required Disclaimer */}
        <div className="mt-5 p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs flex items-center gap-2.5">
          <ShieldAlert className="w-5 h-5 text-amber-400 shrink-0" />
          <span className="font-medium">
            <b>Official Notice:</b> AI-generated projection for demonstration purposes — not validated against real econometric models. Framed as a decision-support aid, not a statutory guarantee.
          </span>
        </div>
      </div>

      {/* Main Simulation Form & Visualization Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Form: Parameter Controls (4 Cols) */}
        <div className="lg:col-span-4 bg-white rounded-xl border border-slate-200 shadow-xs p-5 space-y-5">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
              <Sliders className="w-4 h-4 text-blue-600" />
              <span>Simulation Parameter Controls</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Customize region, intervention type, and implementation timeline
            </p>
          </div>

          <form onSubmit={handleRunSimulation} className="space-y-4">
            {/* Region / District Selector */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Target District (Local visualization layer)
              </label>
              <select
                value={selectedDistrictId}
                onChange={(e) => setSelectedDistrictId(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500 bg-white font-medium text-slate-800"
              >
                {districts.map((f) => (
                  <option key={f.properties.id} value={f.properties.id}>
                    {f.properties.name} ({f.properties.state}) — {f.properties.dispute_count.toLocaleString()} disputes
                  </option>
                ))}
              </select>

              {/* District quick stats pill */}
              {currentDistrict && (
                <div className="mt-2 p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-[11px] text-slate-600 grid grid-cols-2 gap-2">
                  <div>
                    Disputes: <b className="text-rose-700">{currentDistrict.dispute_count.toLocaleString()}</b>
                  </div>
                  <div>
                    Digitization: <b className="text-emerald-700">{currentDistrict.digitization_progress_pct}%</b>
                  </div>
                  <div>
                    Climate Vuln: <b className="text-amber-700">{currentDistrict.climate_vulnerability_index}</b>
                  </div>
                  <div>
                    Pending Cases: <b className="text-slate-800">{currentDistrict.pending_court_cases?.toLocaleString()}</b>
                  </div>
                </div>
              )}
            </div>

            {/* Policy Intervention Dropdown */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Policy Intervention Framework
              </label>
              <select
                value={policyType}
                onChange={(e) => setPolicyType(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500 bg-white font-medium text-slate-800"
              >
                {INTERVENTIONS.map((intv) => (
                  <option key={intv.id} value={intv.id}>
                    {intv.name}
                  </option>
                ))}
              </select>
              <p className="text-[10px] text-slate-500 mt-1">
                {INTERVENTIONS.find(i => i.id === policyType)?.description}
              </p>
            </div>

            {/* Rollout Percentage Slider */}
            <div>
              <div className="flex items-center justify-between text-xs font-semibold text-slate-700 mb-1">
                <span>Target Rollout Coverage</span>
                <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 font-bold">
                  {rolloutPct}%
                </span>
              </div>
              <input
                type="range"
                min="20"
                max="100"
                step="5"
                value={rolloutPct}
                onChange={(e) => setRolloutPct(e.target.value)}
                className="w-full accent-blue-600 h-2 bg-slate-200 rounded-lg cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-400 mt-0.5">
                <span>20% (Pilot)</span>
                <span>60% (Tehsil Wide)</span>
                <span>100% (Full District)</span>
              </div>
            </div>

            {/* Implementation Timeline */}
            <div>
              <div className="flex items-center justify-between text-xs font-semibold text-slate-700 mb-1">
                <span>Implementation Horizon</span>
                <span className="px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 font-bold">
                  {timelineYears} Year{timelineYears > 1 ? 's' : ''}
                </span>
              </div>
              <input
                type="range"
                min="1"
                max="5"
                step="1"
                value={timelineYears}
                onChange={(e) => setTimelineYears(e.target.value)}
                className="w-full accent-indigo-600 h-2 bg-slate-200 rounded-lg cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-400 mt-0.5">
                <span>1 Year</span>
                <span>3 Years (Recommended)</span>
                <span>5 Years</span>
              </div>
            </div>

            {/* Enforcement Rigor */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Enforcement Rigor
                </label>
                <select
                  value={enforcementLevel}
                  onChange={(e) => setEnforcementLevel(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  <option value="high">High (Strict Audit)</option>
                  <option value="medium">Medium (Standard)</option>
                  <option value="moderate">Moderate (Phased)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Strategic Priority
                </label>
                <select
                  value={focusArea}
                  onChange={(e) => setFocusArea(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  <option value="balanced">Balanced Impact</option>
                  <option value="dispute_resolution">Max Dispute Drop</option>
                  <option value="ecological">Farmland Protect</option>
                </select>
              </div>
            </div>

            {/* Trigger Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3 px-4 rounded-xl bg-gradient-to-r from-blue-700 to-indigo-700 hover:from-blue-600 hover:to-indigo-600 text-white font-bold text-xs shadow-md shadow-blue-700/20 disabled:opacity-50 transition-all flex items-center justify-center gap-2 cursor-pointer hover:scale-[1.01]"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Running Econometric Model...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-amber-300" />
                  <span>Run AI Policy Simulation</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Right Area: Results Dashboard & Charts (8 Cols) */}
        <div className="lg:col-span-8 space-y-6">
          {simulationResult ? (
            <div className="space-y-6">
              {/* Outcome Header Badges */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {/* Reduction Delta */}
                <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200">
                  <div className="flex items-center justify-between text-xs font-bold text-emerald-700">
                    <span>Dispute Reduction</span>
                    <TrendingDown className="w-4 h-4" />
                  </div>
                  <div className="text-2xl font-black text-emerald-800 mt-1">
                    -{simulationResult.predicted_impact.dispute_reduction_pct}%
                  </div>
                  <div className="text-[11px] text-emerald-600 mt-0.5">
                    {simulationResult.predicted_impact.baseline_dispute_count.toLocaleString()} → {simulationResult.predicted_impact.projected_dispute_count.toLocaleString()}
                  </div>
                </div>

                {/* Efficiency Gain */}
                <div className="p-4 rounded-xl bg-blue-50 border border-blue-200">
                  <div className="flex items-center justify-between text-xs font-bold text-blue-700">
                    <span>Land Use Efficiency</span>
                    <TrendingUp className="w-4 h-4" />
                  </div>
                  <div className="text-2xl font-black text-blue-800 mt-1">
                    +{simulationResult.predicted_impact.land_use_efficiency_change_pct}%
                  </div>
                  <div className="text-[11px] text-blue-600 mt-0.5">
                    Score: {simulationResult.predicted_impact.projected_land_use_efficiency}%
                  </div>
                </div>

                {/* Value Unlocked */}
                <div className="p-4 rounded-xl bg-amber-50 border border-amber-200">
                  <div className="flex items-center justify-between text-xs font-bold text-amber-700">
                    <span>Capital Unlocked</span>
                    <DollarSign className="w-4 h-4" />
                  </div>
                  <div className="text-2xl font-black text-amber-800 mt-1">
                    ₹{simulationResult.predicted_impact.economic_value_unlocked_crores} Cr
                  </div>
                  <div className="text-[11px] text-amber-600 mt-0.5">
                    Credit & Asset Liquidity
                  </div>
                </div>

                {/* Risk & Feasibility */}
                <div className="p-4 rounded-xl bg-indigo-50 border border-indigo-200">
                  <div className="flex items-center justify-between text-xs font-bold text-indigo-700">
                    <span>Budget Feasibility</span>
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <div className="text-lg font-black text-indigo-900 mt-1">
                    {simulationResult.predicted_impact.budget_feasibility || 'High'}
                  </div>
                  <div className="text-[11px] text-indigo-600 mt-0.5">
                    Risk Score: {simulationResult.predicted_impact.implementation_risk_score}/100
                  </div>
                </div>
              </div>

              {/* Before vs After Charts */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Bar Chart: Before vs After */}
                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                      Before vs. After Comparison
                    </h4>
                    <span className="text-[10px] text-slate-400">Total Cases</span>
                  </div>

                  <div className="h-56">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={beforeAfterData.slice(0, 1)}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                        <YAxis tick={{ fontSize: 11 }} />
                        <Tooltip 
                          formatter={(value) => [value.toLocaleString(), 'Dispute Cases']}
                          contentStyle={{ fontSize: '11px', borderRadius: '8px' }}
                        />
                        <Legend wrapperStyle={{ fontSize: '11px' }} />
                        <Bar dataKey="Before" fill="#ef4444" radius={[4, 4, 0, 0]} name="Before Intervention" />
                        <Bar dataKey="After" fill="#10b981" radius={[4, 4, 0, 0]} name="After Intervention" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Line Chart: Multi-Year Trajectory */}
                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                      Dispute Reduction Trajectory
                    </h4>
                    <span className="text-[10px] text-slate-400">Over {timelineYears} Years</span>
                  </div>

                  <div className="h-56">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={trajectoryData}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                        <YAxis tick={{ fontSize: 11 }} />
                        <Tooltip contentStyle={{ fontSize: '11px', borderRadius: '8px' }} />
                        <Line 
                          type="monotone" 
                          dataKey="Disputes" 
                          stroke="#2563eb" 
                          strokeWidth={2.5} 
                          dot={{ r: 4, fill: '#1e40af' }}
                          name="Projected Disputes"
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              {/* Rationale & Beneficiaries Card */}
              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2">
                    <h4 className="font-bold text-sm text-slate-900">
                      Econometric & Governance Rationale
                    </h4>
                    <AIBadge model={simulationResult.predicted_impact.provider || 'Claude server-side model'} />
                  </div>
                </div>

                <p className="text-xs text-slate-700 leading-relaxed bg-slate-50 p-4 rounded-xl border border-slate-200/80">
                  {simulationResult.predicted_impact.rationale}
                </p>

                {/* Key Beneficiaries */}
                <div>
                  <div className="text-xs font-semibold text-slate-800 mb-1.5 flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-blue-600" />
                    <span>Key Beneficiaries Identified:</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {simulationResult.predicted_impact.key_beneficiaries?.map((ben, i) => (
                      <span key={i} className="px-2.5 py-1 rounded-md text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
                        {ben}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Implementation Risk Factors */}
                <div className="pt-2 border-t border-slate-100">
                  <div className="text-xs font-semibold text-slate-800 mb-1.5 flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                    <span>Implementation Risk Factors & Mitigation:</span>
                  </div>
                  <div className="space-y-1.5">
                    {simulationResult.predicted_impact.risk_factors?.map((risk, i) => (
                      <div key={i} className="text-xs text-slate-600 flex items-start gap-2 bg-amber-50/50 p-2 rounded-lg border border-amber-200/60">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0 mt-1.5" />
                        <span>{risk}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-12 text-center text-slate-400 bg-white rounded-xl border border-slate-200 space-y-3">
              <Sliders className="w-8 h-8 mx-auto text-slate-300" />
              <div className="text-sm font-semibold text-slate-700">No Simulation Active</div>
              <div className="text-xs text-slate-400">Select parameters on the left and click "Run AI Policy Simulation"</div>
            </div>
          )}
        </div>
      </div>

      {/* Past Simulations History Modal / Drawer */}
      {showHistory && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-lg p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
              <History className="w-4 h-4 text-blue-600" />
              <span>Simulation Run History ({pastSimulations.length})</span>
            </h3>
            <button
              onClick={() => setShowHistory(false)}
              className="text-xs text-slate-500 hover:text-slate-800 font-semibold"
            >
              Close History
            </button>
          </div>

          <div className="divide-y divide-slate-100 max-h-80 overflow-y-auto">
            {pastSimulations.map((s) => {
              const impact = s.predicted_impact || {};
              return (
                <div key={s.id} className="py-3 flex items-center justify-between gap-4 hover:bg-slate-50 px-2 rounded-lg transition-colors">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs text-slate-900">{s.district_name}</span>
                      <span className="text-slate-300">•</span>
                      <span className="text-xs text-slate-600 font-medium">{s.policy_type}</span>
                    </div>
                    <div className="text-[11px] text-slate-400 mt-0.5">
                      Rollout: {s.parameters?.rollout_pct || 80}% • Timeline: {s.parameters?.timeline_years || 3} Years • Created: {new Date(s.created_at).toLocaleDateString()}
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-xs font-bold text-emerald-600">
                      -{impact.dispute_reduction_pct || 40}% Disputes
                    </span>
                    <button
                      onClick={() => {
                        setSimulationResult({
                          district: { name: s.district_name, baseline_disputes: impact.baseline_dispute_count },
                          policy_type: s.policy_type,
                          parameters: s.parameters,
                          predicted_impact: impact
                        });
                        setShowHistory(false);
                      }}
                      className="px-2.5 py-1 text-xs font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-md"
                    >
                      Load View
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

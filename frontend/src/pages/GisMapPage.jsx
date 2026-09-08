import React, { useState, useEffect, useRef } from 'react';
import L from 'leaflet';
import { 
  MapPin, 
  Layers, 
  AlertTriangle, 
  CheckCircle2, 
  FileText, 
  Sliders, 
  ExternalLink, 
  Info,
  ChevronRight,
  X,
  Compass,
  Building,
  TrendingUp,
  Percent
} from 'lucide-react';
import { api } from '../services/api';

const METRICS = [
  { id: 'ror', label: 'Official RoR Computerization', unit: '% by state benchmark', color: 'emerald' },
  { id: 'maps', label: 'Official Cadastral Map Digitization', unit: '% by state benchmark', color: 'blue' },
  { id: 'disputes', label: 'Platform Dispute Density', unit: 'per sq km', color: 'rose' },
  { id: 'climate', label: 'Platform Climate Indicator', unit: 'index', color: 'amber' }
];

export default function GisMapPage({ onSelectDistrictForSim, setActiveTab }) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const geojsonLayerRef = useRef(null);

  const [districtsData, setDistrictsData] = useState(null);
  const [selectedDistrict, setSelectedDistrict] = useState(null);
  const [activeMetric, setActiveMetric] = useState('ror');
  const [loading, setLoading] = useState(true);
  const [districtDetails, setDistrictDetails] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  useEffect(() => {
    loadDistricts();
  }, []);

  const loadDistricts = async () => {
    try {
      setLoading(true);
      const data = await api.getDistrictsGeoJSON();
      setDistrictsData(data);
      // Auto-select first district (Pune) for demo inspection
      if (data.features && data.features.length > 0) {
        handleSelectDistrict(data.features[0].properties);
      }
    } catch (err) {
      console.error('Failed to load districts GeoJSON:', err);
    } finally {
      setLoading(false);
    }
  };

  // Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [21.5, 79.5], // Center of India
        zoom: 5,
        zoomControl: true,
        scrollWheelZoom: true
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors | BhoomiIntel',
        maxZoom: 18
      }).addTo(map);

      mapInstanceRef.current = map;
    }

    return () => {
      // clean up on unmount if needed
    };
  }, []);

  // Update GeoJSON Layer when data or activeMetric changes
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !districtsData) return;

    if (geojsonLayerRef.current) {
      map.removeLayer(geojsonLayerRef.current);
    }

    const getColor = (feature) => {
      const p = feature.properties;
      if (activeMetric === 'ror') {
        const v = p.live_clr_completed_villages;
        if (v == null) return '#cbd5e1';
        return v >= 5000 ? '#059669' : v >= 1000 ? '#10b981' : v >= 250 ? '#f59e0b' : '#ef4444';
      } else if (activeMetric === 'maps') {
        const v = p.live_digitized_mapsheets;
        if (v == null) return '#cbd5e1';
        return v >= 100000 ? '#2563eb' : v >= 25000 ? '#60a5fa' : v >= 5000 ? '#f59e0b' : '#ef4444';
      } else if (activeMetric === 'disputes') {
        const d = p.dispute_density_per_sqkm;
        return d > 7 ? '#e11d48' : d > 4 ? '#f97316' : d > 1.5 ? '#f59e0b' : '#10b981';
      } else if (activeMetric === 'climate') {
        const c = p.climate_vulnerability_index;
        return c > 0.8 ? '#7c3aed' : c > 0.65 ? '#c026d3' : c > 0.5 ? '#f59e0b' : '#3b82f6';
      } else if (activeMetric === 'digitization') {
        const dig = p.digitization_progress_pct;
        return dig > 90 ? '#059669' : dig > 80 ? '#10b981' : dig > 70 ? '#34d399' : '#f59e0b';
      } else {
        const eff = p.land_use_efficiency;
        return eff > 80 ? '#2563eb' : eff > 70 ? '#3b82f6' : eff > 60 ? '#60a5fa' : '#93c5fd';
      }
    };

    const layer = L.geoJSON(districtsData, {
      style: (feature) => {
        const isSelected = selectedDistrict && selectedDistrict.id === feature.properties.id;
        return {
          fillColor: getColor(feature),
          weight: isSelected ? 3.5 : 1.5,
          opacity: 1,
          color: isSelected ? '#1e3a8a' : '#ffffff',
          fillOpacity: isSelected ? 0.75 : 0.55
        };
      },
      onEachFeature: (feature, l) => {
        const p = feature.properties;
        l.bindTooltip(`
          <div class="font-sans text-xs p-1">
            <strong class="text-slate-900">${p.name}</strong> (${p.state})<br/>
            Live CLR villages: <b>${p.live_clr_completed_villages != null ? p.live_clr_completed_villages.toLocaleString() : 'N/A'}</b><br/>
            Live digitized maps: <b>${p.live_digitized_mapsheets != null ? p.live_digitized_mapsheets.toLocaleString() : 'N/A'}</b>
          </div>
        `, { sticky: true });

        l.on({
          click: () => {
            handleSelectDistrict(p);
            // Center map on polygon
            const bounds = l.getBounds();
            map.fitBounds(bounds, { maxZoom: 8, padding: [40, 40] });
          }
        });
      }
    }).addTo(map);

    geojsonLayerRef.current = layer;
  }, [districtsData, activeMetric, selectedDistrict]);

  const handleSelectDistrict = async (props) => {
    setSelectedDistrict(props);
    setLoadingDetails(true);
    try {
      const res = await api.getDistrictById(props.id);
      setDistrictDetails(res.data);
    } catch (e) {
      console.error('Failed to load district details:', e);
    } finally {
      setLoadingDetails(false);
    }
  };

  const handleLaunchSimulation = () => {
    if (selectedDistrict && onSelectDistrictForSim) {
      onSelectDistrictForSim(selectedDistrict.id);
      setActiveTab('simulator');
    }
  };

  return (
    <div className="space-y-4">
      {/* Top Controls Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="font-bold text-base text-slate-900 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-blue-600" />
              GIS Land Cadastre & District Vulnerability Map
            </h2>
            <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-50 text-amber-800 border border-amber-200">
              LIVE DILRMP METRICS
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Official DILRMP indicators are fetched at runtime. District geometry remains a local visualization layer until an authoritative parcel/district geometry feed is connected.
          </p>
        </div>

        {/* Metric Selector Tabs */}
        <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-lg border border-slate-200">
          {METRICS.map((m) => (
            <button
              key={m.id}
              onClick={() => setActiveMetric(m.id)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                activeMetric === m.id
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Map & Inspector Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 min-h-[640px]">
        {/* Map Container (8 cols) */}
        <div className="lg:col-span-8 bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden relative flex flex-col">
          {/* Quick District Selector Buttons */}
          <div className="bg-slate-50 border-b border-slate-200 p-2.5 flex items-center gap-2 overflow-x-auto text-xs">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider shrink-0 ml-1">
              Select District:
            </span>
            {districtsData?.features?.map((f) => {
              const p = f.properties;
              const isSelected = selectedDistrict?.id === p.id;
              return (
                <button
                  key={p.id}
                  onClick={() => handleSelectDistrict(p)}
                  className={`px-2.5 py-1 rounded-md text-xs font-medium shrink-0 transition-colors ${
                    isSelected
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  {p.name} ({p.state.slice(0, 2)})
                </button>
              );
            })}
          </div>

          {/* Leaflet Container */}
          <div className="flex-1 relative min-h-[500px]">
            <div ref={mapContainerRef} className="w-full h-full" />

            {/* Map Legend Overlay */}
            <div className="absolute bottom-4 left-4 z-[400] bg-white/95 backdrop-blur-xs p-3 rounded-lg shadow-md border border-slate-200 text-xs space-y-1.5 max-w-[200px]">
              <div className="font-bold text-slate-800 text-[11px] uppercase tracking-wide">
                Legend: {METRICS.find(m => m.id === activeMetric)?.label}
              </div>
              <div className="space-y-1 text-[10px] text-slate-600">
                {activeMetric === 'ror' ? (
                  <>
                    <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-xs bg-[#059669]" /> <span>CLR completed villages ≥ 5,000</span></div>
                    <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-xs bg-[#10b981]" /> <span>1,000–4,999</span></div>
                    <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-xs bg-[#f59e0b]" /> <span>250–999</span></div>
                    <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-xs bg-[#ef4444]" /> <span>&lt; 250</span></div>
                  </>
                ) : activeMetric === 'maps' ? (
                  <>
                    <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-xs bg-[#2563eb]" /> <span>Digitized maps ≥ 100,000</span></div>
                    <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-xs bg-[#60a5fa]" /> <span>25,000–99,999</span></div>
                    <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-xs bg-[#f59e0b]" /> <span>5,000–24,999</span></div>
                    <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-xs bg-[#ef4444]" /> <span>&lt; 5,000</span></div>
                  </>
                ) : activeMetric === 'disputes' ? (
                  <>
                    <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-xs bg-[#e11d48]" /> <span>&gt; 7 disputes/km²</span></div>
                    <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-xs bg-[#f97316]" /> <span>4–7 disputes/km²</span></div>
                    <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-xs bg-[#f59e0b]" /> <span>1.5–4 disputes/km²</span></div>
                    <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-xs bg-[#10b981]" /> <span>&lt; 1.5 disputes/km²</span></div>
                  </>
                ) : (
                  <>
                    <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-xs bg-[#7c3aed]" /> <span>&gt; 0.80 vulnerability</span></div>
                    <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-xs bg-[#c026d3]" /> <span>0.65–0.80</span></div>
                    <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-xs bg-[#3b82f6]" /> <span>&lt; 0.65</span></div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-8 -mb-2 text-[10px] text-slate-500 flex items-center justify-between"><span>Map geometry: platform sample polygons. Metrics: official DILRMP values where available.</span><a href="https://dilrmp.gov.in/dilrmpold/" target="_blank" rel="noreferrer" className="text-blue-700 font-semibold hover:underline">Official DILRMP source ↗</a></div>

        {/* District Inspector Drawer (4 cols) */}
        <div className="lg:col-span-4 bg-white rounded-xl border border-slate-200 shadow-xs flex flex-col overflow-hidden">
          {selectedDistrict ? (
            <div className="p-5 space-y-5 overflow-y-auto flex-1 max-h-[640px]">
              {/* Header */}
              <div className="border-b border-slate-100 pb-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                    District Profile
                  </span>
                  <span className="text-xs text-slate-400">
                    ID #{selectedDistrict.id}
                  </span>
                </div>
                <h3 className="text-xl font-bold text-slate-900 mt-1">
                  {selectedDistrict.name}
                </h3>
                <div className="text-xs text-slate-500 font-medium">
                  {selectedDistrict.state} • Area: {selectedDistrict.area_sqkm?.toLocaleString() || 'N/A'} km² • Pop: {selectedDistrict.population?.toLocaleString() || 'N/A'}
                </div>
              </div>

              {/* Action Button: Simulate Policy */}
              <button
                onClick={handleLaunchSimulation}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-blue-700 hover:bg-blue-800 text-white font-semibold text-xs shadow-md shadow-blue-700/20 transition-all hover:scale-[1.02]"
              >
                <Sliders className="w-4 h-4 text-amber-300" />
                <span>Simulate Policy on {selectedDistrict.name}</span>
                <ChevronRight className="w-4 h-4 ml-auto" />
              </button>

              {/* Official live DILRMP indicators */}
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200">
                <div className="text-[10px] uppercase font-bold text-emerald-700">Official live DILRMP indicators</div>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  <div><div className="text-[10px] text-emerald-700">CLR completed villages</div><div className="text-base font-black text-emerald-950">{selectedDistrict.live_clr_completed_villages?.toLocaleString() || 'N/A'}</div></div>
                  <div><div className="text-[10px] text-emerald-700">Digitized maps</div><div className="text-base font-black text-emerald-950">{selectedDistrict.live_digitized_mapsheets?.toLocaleString() || 'N/A'}</div></div>
                  <div><div className="text-[10px] text-emerald-700">Maps linked to RoR</div><div className="text-base font-black text-emerald-950">{selectedDistrict.live_maps_linked_to_ror?.toLocaleString() || 'N/A'}</div></div>
                  <div><div className="text-[10px] text-emerald-700">SRO computerized</div><div className="text-base font-black text-emerald-950">{selectedDistrict.live_sro_computerized?.toLocaleString() || 'N/A'}</div></div>
                </div>
              </div>

              {/* Stat Badges Grid */}
              <div className="grid grid-cols-2 gap-2.5">
                <div className="p-3 rounded-lg bg-rose-50 border border-rose-100">
                  <div className="text-[10px] uppercase font-bold text-rose-700">Land Disputes</div>
                  <div className="text-lg font-black text-rose-900">
                    {selectedDistrict.dispute_count?.toLocaleString()}
                  </div>
                  <div className="text-[10px] text-rose-600">
                    {selectedDistrict.dispute_density_per_sqkm} / km²
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-100">
                  <div className="text-[10px] uppercase font-bold text-emerald-700">Digitization</div>
                  <div className="text-lg font-black text-emerald-900">
                    {selectedDistrict.digitization_progress_pct}%
                  </div>
                  <div className="text-[10px] text-emerald-600">DILRMP RoR Sync</div>
                </div>

                <div className="p-3 rounded-lg bg-amber-50 border border-amber-100">
                  <div className="text-[10px] uppercase font-bold text-amber-700">Climate Vulnerability</div>
                  <div className="text-lg font-black text-amber-900">
                    {selectedDistrict.climate_vulnerability_index}
                  </div>
                  <div className="text-[10px] text-amber-600">0 to 1 index scale</div>
                </div>

                <div className="p-3 rounded-lg bg-indigo-50 border border-indigo-100">
                  <div className="text-[10px] uppercase font-bold text-indigo-700">Pending Court Cases</div>
                  <div className="text-lg font-black text-indigo-900">
                    {selectedDistrict.pending_court_cases?.toLocaleString()}
                  </div>
                  <div className="text-[10px] text-indigo-600">In SDM & Civil Courts</div>
                </div>
              </div>

              {/* Land Distribution Bar */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
                  <span>Land Use Classification</span>
                  <span className="text-[11px] text-slate-500 font-normal">
                    Eff: {selectedDistrict.land_use_efficiency}%
                  </span>
                </div>
                <div className="w-full h-3 rounded-full bg-slate-100 flex overflow-hidden">
                  <div 
                    style={{ width: `${selectedDistrict.agricultural_pct || 50}%` }}
                    className="bg-emerald-500" 
                    title={`Agricultural: ${selectedDistrict.agricultural_pct}%`}
                  />
                  <div 
                    style={{ width: `${selectedDistrict.urban_pct || 25}%` }}
                    className="bg-blue-500" 
                    title={`Urban: ${selectedDistrict.urban_pct}%`}
                  />
                  <div 
                    style={{ width: `${selectedDistrict.forest_pct || 15}%` }}
                    className="bg-teal-700" 
                    title={`Forest: ${selectedDistrict.forest_pct}%`}
                  />
                </div>
                <div className="flex items-center justify-between text-[10px] text-slate-500 pt-0.5">
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" /> Agri ({selectedDistrict.agricultural_pct}%)
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-blue-500" /> Urban ({selectedDistrict.urban_pct}%)
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-teal-700" /> Forest ({selectedDistrict.forest_pct}%)
                  </span>
                </div>
              </div>

              {/* Common Dispute Types */}
              <div className="space-y-1.5">
                <div className="text-xs font-semibold text-slate-700">
                  Prevalent Land Dispute Typologies:
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {selectedDistrict.common_dispute_types?.map((t, idx) => (
                    <span 
                      key={idx}
                      className="px-2 py-0.5 rounded-md text-[11px] bg-slate-100 text-slate-700 border border-slate-200"
                    >
                      {t}
                    </span>
                  ))}
                </div>
              </div>

              {/* Structural Challenges */}
              {selectedDistrict.key_challenges && (
                <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs space-y-1">
                  <div className="font-semibold text-slate-800 flex items-center gap-1.5">
                    <Info className="w-3.5 h-3.5 text-blue-600" />
                    <span>Structural Governance Friction:</span>
                  </div>
                  <p className="text-slate-600 leading-relaxed text-[11px]">
                    {selectedDistrict.key_challenges}
                  </p>
                </div>
              )}

              {/* Related Research & Policy Documents (linking back to feature 1's repository) */}
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-blue-600" />
                    <span>Related Research & Policy Docs</span>
                  </h4>
                  <button
                    onClick={() => setActiveTab('repository')}
                    className="text-[11px] font-semibold text-blue-600 hover:text-blue-800"
                  >
                    View Repository
                  </button>
                </div>

                {loadingDetails ? (
                  <div className="text-xs text-slate-400 py-3 text-center">
                    Loading related policy papers...
                  </div>
                ) : districtDetails?.related_documents?.length > 0 ? (
                  <div className="space-y-1.5">
                    {districtDetails.related_documents.map((doc) => (
                      <div
                        key={doc.id}
                        onClick={() => setActiveTab('repository')}
                        className="p-2.5 rounded-lg border border-slate-100 bg-slate-50/70 hover:bg-blue-50/60 hover:border-blue-200 cursor-pointer transition-colors"
                      >
                        <div className="text-xs font-semibold text-slate-800 line-clamp-1">
                          {doc.title}
                        </div>
                        <div className="flex items-center justify-between text-[10px] text-slate-500 mt-1">
                          <span>{doc.theme}</span>
                          <span className="text-blue-600 flex items-center gap-0.5">
                            Read <ExternalLink className="w-2.5 h-2.5" />
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-xs text-slate-400 py-2">
                    No specific papers tagged directly for this district.
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="p-8 text-center text-slate-400 text-xs my-auto">
              Select a district on the map to inspect land records and policy data.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// BhoomiIntel API Service Client
const BASE_URL = import.meta.env.VITE_API_URL || '/api';

const request = (url, options = {}) => fetch(url, { credentials: 'include', ...options });

async function handleResponse(response) {
  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || `HTTP error ${response.status}`);
    }
    return data;
  }
  const text = await response.text();
  if (!response.ok) {
    throw new Error(text || `HTTP error ${response.status}`);
  }
  return text;
}

export const api = {
  register: (payload) => request(`${BASE_URL}/auth/register`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  }).then(handleResponse),
  login: (email, password) => request(`${BASE_URL}/auth/login`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  }).then(handleResponse),
  logout: () => request(`${BASE_URL}/auth/logout`, { method: 'POST' }).then(handleResponse),
  me: () => request(`${BASE_URL}/auth/me`).then(handleResponse),
  // Health
  checkHealth: () => request(`${BASE_URL}/health`).then(handleResponse),
  getLiveDILRMP: (refresh = false) => request(`${BASE_URL}/live/dilrmp${refresh ? '?refresh=1' : ''}`).then(handleResponse),
  getLiveStatus: () => request(`${BASE_URL}/live/status`).then(handleResponse),
  getLiveSources: () => request(`${BASE_URL}/live/sources`).then(handleResponse),

  // Dashboard Metrics
  getDashboardMetrics: () => request(`${BASE_URL}/dashboard-metrics`).then(handleResponse),

  // Districts & GeoJSON
  getDistrictsGeoJSON: () => request(`${BASE_URL}/districts`).then(handleResponse),
  getDistrictById: (id) => request(`${BASE_URL}/districts/${id}`).then(handleResponse),

  // Documents
  getDocuments: (params = {}) => {
    const query = new URLSearchParams();
    if (params.category && params.category !== 'all') query.append('category', params.category);
    if (params.theme && params.theme !== 'all') query.append('theme', params.theme);
    if (params.district && params.district !== 'all') query.append('district', params.district);
    if (params.search) query.append('search', params.search);
    const qs = query.toString();
    return request(`${BASE_URL}/documents${qs ? '?' + qs : ''}`).then(handleResponse);
  },
  getDocumentCategoriesAndThemes: () => request(`${BASE_URL}/documents/categories-and-themes`).then(handleResponse),
  getDocumentById: (id) => request(`${BASE_URL}/documents/${id}`).then(handleResponse),
  uploadDocument: (formData) => 
    request(`${BASE_URL}/documents/upload`, {
      method: 'POST',
      body: formData
    }).then(handleResponse),
  publishDocument: (id) => request(`${BASE_URL}/documents/${id}/publish`, { method: 'PATCH' }).then(handleResponse),
  deleteDocument: (id) => 
    request(`${BASE_URL}/documents/${id}`, {
      method: 'DELETE'
    }).then(handleResponse),

  // Semantic Search (RAG)
  searchRepository: (payload) => 
    request(`${BASE_URL}/search`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    }).then(handleResponse),

  // Policy Simulation
  runSimulation: (payload) => 
    request(`${BASE_URL}/simulate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    }).then(handleResponse),
  getSimulations: () => request(`${BASE_URL}/simulate`).then(handleResponse),
  getSimulationById: (id) => request(`${BASE_URL}/simulate/${id}`).then(handleResponse),
  deleteSimulation: (id) => 
    request(`${BASE_URL}/simulate/${id}`, {
      method: 'DELETE'
    }).then(handleResponse),

  // Research Assistant
  runResearchAssistant: (documentIds) => 
    request(`${BASE_URL}/research-assistant`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ document_ids: documentIds })
    }).then(handleResponse),

  saveResearchReport: (documentIds, report) =>
    request(`${BASE_URL}/research-assistant/reports`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ document_ids: documentIds, report })
    }).then(handleResponse),
  getResearchReports: () => request(`${BASE_URL}/research-assistant/reports`).then(handleResponse),

  // Analytics & Trends
  getAnalyticsTrends: () => request(`${BASE_URL}/analytics/trends`).then(handleResponse),


  // Intelligence Center
  verifyDocuments: (documentIds) => request(`${BASE_URL}/intelligence/verify`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ document_ids: documentIds })
  }).then(handleResponse),
  getIntelligenceOverview: () => request(`${BASE_URL}/intelligence/overview`).then(handleResponse),
  explainDistrictMetric: (districtId, metric = 'risk_score') => request(`${BASE_URL}/intelligence/explain`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ district_id: districtId, metric })
  }).then(handleResponse),

  // AI Configuration
  getConfigStatus: () => request(`${BASE_URL}/config/status`).then(handleResponse),
  updateApiKey: (apiKey) => 
    request(`${BASE_URL}/config/api-key`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ api_key: apiKey })
    }).then(handleResponse),
  resetApiKey: () => 
    request(`${BASE_URL}/config/reset-key`, {
      method: 'POST'
    }).then(handleResponse),
};

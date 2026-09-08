const SOURCES = {
  clr: 'https://dilrmp.gov.in/physicalProgressReports/clr/state-level',
  mrr: 'https://dilrmp.gov.in/physicalProgressReports/mrr/state-level',
  survey: 'https://dilrmp.gov.in/physicalProgressReports/survey/state-level',
  rcms: 'https://dilrmp.gov.in/physicalProgressReports/rcms/state-level',
  aadhaar: 'https://dilrmp.gov.in/physicalProgressReports/aadhar-link/state-level',
  sro: 'https://dilrmp.gov.in/dilrmpold/PhyscialComponent/sro/state-level',
  maps: 'https://dilrmp.gov.in/dilrmpold/PhyscialComponent/mapDigitization/digitizedstatusreport',
  legacy: 'https://dilrmp.gov.in/dilrmpold/',
  mis4: 'https://dilrmp.gov.in/'
};

const CACHE_TTL_MS = Number(process.env.LIVE_DATA_CACHE_TTL_MS || 10 * 60 * 1000);
const DEFAULT_TIMEOUT_MS = Number(process.env.LIVE_DATA_REQUEST_TIMEOUT_MS || 35000);
const LEGACY_TIMEOUT_MS = Number(process.env.DILRMP_LEGACY_TIMEOUT_MS || 120000);
const ALLOW_INSECURE_TLS = String(process.env.DILRMP_ALLOW_INSECURE_TLS || '').toLowerCase() === 'true';
let cache = null;
let lastError = null;

function cleanHtml(value) {
  return String(value || '')
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&#39;/gi, "'")
    .replace(/&quot;/gi, '"')
    .replace(/&#x2F;/gi, '/')
    .replace(/\s+/g, ' ')
    .trim();
}

function numberFrom(value) {
  if (value == null) return null;
  const match = String(value).replace(/,/g, '').match(/-?\d+(?:\.\d+)?/);
  return match ? Number(match[0]) : null;
}

function numbersFromCells(cells) {
  return cells.map(numberFrom).filter(v => v !== null);
}

function tableRows(html) {
  return String(html || '').match(/<tr\b[\s\S]*?<\/tr>/gi) || [];
}

function rowCells(row) {
  return (String(row).match(/<t[dh]\b[^>]*>[\s\S]*?<\/t[dh]>/gi) || []).map(cleanHtml);
}

function findGrandTotalCells(html) {
  for (const row of tableRows(html)) {
    const cells = rowCells(row);
    if (cells.some(c => /^grand total$/i.test(c.trim())) || /Grand Total/i.test(cells.join(' | '))) {
      return cells;
    }
  }
  return [];
}

function percentMetric(text, labels) {
  const source = String(text || '');
  for (const label of labels) {
    const escaped = label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    let match = source.match(new RegExp(`([\\d,]+)\\s*\\(([\\d.]+)%\\)\\s*${escaped}`, 'i'));
    if (match) return { value: numberFrom(match[1]), percent: Number(match[2]) };
    match = source.match(new RegExp(`${escaped}\\s*[:\\-]?\\s*([\\d,]+)\\s*\\(([\\d.]+)%\\)`, 'i'));
    if (match) return { value: numberFrom(match[1]), percent: Number(match[2]) };
  }
  return null;
}

function parseClr(html) {
  const cells = findGrandTotalCells(html);
  const nums = numbersFromCells(cells.slice(1));
  // Current official table: districts, tehsils, villages, RoRs, computerized villages, %.
  if (nums.length >= 6) {
    return {
      land_records: { value: nums[4], percent: nums[5] },
      master: { states: 36, districts: nums[0], tehsils: nums[1], villages: nums[2] }
    };
  }
  return { land_records: percentMetric(cleanHtml(html), ['Computerization of Land Records']), master: { states: 36, districts: null, tehsils: null, villages: null } };
}

function parseMrr(html) {
  const cells = findGrandTotalCells(html);
  const nums = numbersFromCells(cells.slice(1));
  // districts, tehsils, sanctioned, sanctioned%, completed, completed%, completed-against-sanctioned, %
  if (nums.length >= 8) {
    return { modern_record_rooms: { value: nums[6], percent: nums[7] } };
  }
  return { modern_record_rooms: percentMetric(cleanHtml(html), ['MRR Completed']) };
}

function parseSurvey(html) {
  const cells = findGrandTotalCells(html);
  const nums = numbersFromCells(cells.slice(1));
  // districts, tehsils, villages, revenue area, sanctioned area, drone-flying villages, ...
  if (nums.length >= 6) {
    return { survey_resurvey: { value: nums[5], percent: nums[2] ? Number((nums[5] / nums[2] * 100).toFixed(2)) : null } };
  }
  return { survey_resurvey: null };
}

function parseRcms(html) {
  const cells = findGrandTotalCells(html);
  const nums = numbersFromCells(cells.slice(1));
  // districts, tehsils, revenue courts, computerized/online, %.
  if (nums.length >= 5) {
    return { revenue_courts: { value: nums[3], percent: nums[4] } };
  }
  return { revenue_courts: percentMetric(cleanHtml(html), ['Computerized/Online Revenue Courts']) };
}

function parseAadhaar(html) {
  const cells = findGrandTotalCells(html);
  const nums = numbersFromCells(cells.slice(1));
  // districts, tehsils, villages, villages >=1 linked, %, villages 100% linked, %, total RoR, linked RoR, %, mobile-linked RoR, %.
  if (nums.length >= 7) {
    return { aadhaar_linked: { value: nums[5], percent: nums[6] } };
  }
  return { aadhaar_linked: percentMetric(cleanHtml(html), ['Aadhaar Linked With RoR']) };
}

function parseSro(html) {
  const text = cleanHtml(html);
  // Prefer the labelled official KPI. This avoids accidentally interpreting
  // unrelated numeric columns from the legacy SRO page as the national KPI.
  const labelled = percentMetric(text, [
    'SROs Computerized',
    'SROs Computerized (No.)',
    'SRO Computerization'
  ]);
  if (labelled && labelled.percent >= 0 && labelled.percent <= 100) return { sro_computerized: labelled };

  const cells = findGrandTotalCells(html);
  const nums = numbersFromCells(cells.slice(1));
  // Only accept the positional fallback when it looks like a national total.
  // The previous parser accepted tiny values such as 3 / 4 from unrelated
  // columns and reported them as the national SRO KPI.
  if (nums.length >= 3 && nums[1] >= 100 && nums[2] >= 0 && nums[2] <= 100) {
    return { sro_computerized: { value: nums[1], percent: nums[2] } };
  }
  return { sro_computerized: null };
}

function parseLegacyHomepage(html) {
  const text = cleanHtml(html);
  const result = {
    sro_computerized: percentMetric(text, ['SROs Computerized', 'SROs Computerized (No.)']),
    digitized_maps: percentMetric(text, ['Digitized Mapsheets/FMBs/Tippans']),
    modern_record_rooms: percentMetric(text, ['Completed Modern Record Room']),
    master: { states: null, districts: null, tehsils: null, villages: null }
  };
  const master = text.match(/Master Details[\s\S]{0,1800}?([\d,]+)\s*States?\s*[/&]?\s*UTs?[\s\S]{0,180}?([\d,]+)\s*Districts?[\s\S]{0,180}?([\d,]+)\s*Tehsils?[\s\S]{0,180}?([\d,]+)\s*Villages?/i);
  if (master) result.master = { states: numberFrom(master[1]), districts: numberFrom(master[2]), tehsils: numberFrom(master[3]), villages: numberFrom(master[4]) };
  return result;
}

function parseMaps(html) {
  const cells = findGrandTotalCells(html);
  const nums = numbersFromCells(cells.slice(1));
  // Legacy map table: districts, villages, total maps, good-condition maps, digitized maps, ...
  if (nums.length >= 5) {
    return { digitized_maps: { value: nums[4], percent: nums[2] ? Number((nums[4] / nums[2] * 100).toFixed(2)) : null } };
  }
  return { digitized_maps: percentMetric(cleanHtml(html), ['Digitized Mapsheets/FMBs/Tippans', 'Digitized Cadastral Maps']) };
}

function parseNationalMis4(html) {
  const text = cleanHtml(html);
  const metric = (labels) => percentMetric(text, labels);
  const result = {
    land_records: metric(['RoR Computerized']),
    digitized_maps: metric(['Digitized Cadastral Maps']),
    modern_record_rooms: metric(['MRR Completed']),
    survey_resurvey: metric(['Survey/Resurvey Completed']),
    revenue_courts: metric(['Computerized/Online Revenue Courts']),
    aadhaar_linked: metric(['Aadhaar Linked With RoR']),
    sro_computerized: metric(['SROs Computerized']),
    geo_referenced_villages: null,
    ulpin_villages: null,
    master: { states: null, districts: null, tehsils: null, villages: null }
  };
  const geo = text.match(/([\d,]+)\s*Geo-Referenced/i);
  const ulpin = text.match(/([\d,]+)\s*ULPIN/i);
  result.geo_referenced_villages = geo ? numberFrom(geo[1]) : null;
  result.ulpin_villages = ulpin ? numberFrom(ulpin[1]) : null;
  const master = text.match(/Master Details[\s\S]{0,1200}?([\d,]+)\s*States?[\s\S]{0,100}?([\d,]+)\s*Districts?[\s\S]{0,100}?([\d,]+)\s*Tehsils?[\s\S]{0,100}?([\d,]+)\s*Villages?/i);
  if (master) result.master = { states: numberFrom(master[1]), districts: numberFrom(master[2]), tehsils: numberFrom(master[3]), villages: numberFrom(master[4]) };
  return result;
}

function parseDistrictRows(html) {
  const rows = [];
  for (const row of tableRows(html)) {
    const cells = rowCells(row);
    if (cells.length < 7) continue;
    let offset = 0;
    if (/^\(?\d+\)?$/.test(cells[0].trim())) offset = 1;
    const state = cells[offset];
    const district = cells[offset + 1];
    if (!state || !district || /state\/ut|state|district name|grand total/i.test(`${state} ${district}`)) continue;
    const nums = numbersFromCells(cells.slice(offset + 2));
    if (nums.length < 5) continue;
    rows.push({
      state,
      district,
      clr_completed_villages: nums[0],
      digitized_mapsheets: nums[1],
      maps_linked_to_ror: nums[2],
      sro_computerized: nums[3],
      sro_integrated_with_land_records: nums[4]
    });
  }
  return rows;
}

async function fetchText(url, { insecure = false, timeoutMs = DEFAULT_TIMEOUT_MS } = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const options = {
      signal: controller.signal,
      redirect: 'follow',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/131 Safari/537.36 BhoomiIntel/3.2.2',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-IN,en;q=0.9',
        'Cache-Control': 'no-cache'
      }
    };
    if (insecure) {
      const https = await import('node:https');
      options.agent = new https.Agent({ rejectUnauthorized: false });
    }
    const response = await fetch(url, options);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return await response.text();
  } finally {
    clearTimeout(timer);
  }
}

async function fetchTextCurl(url, { insecure = false, timeoutMs = DEFAULT_TIMEOUT_MS } = {}) {
  const { execFile } = await import('node:child_process');
  return await new Promise((resolve, reject) => {
    const executable = process.platform === 'win32' ? 'curl.exe' : 'curl';
    const args = [
      '--location', '--silent', '--show-error', '--compressed', '--http1.1',
      '--max-time', String(Math.ceil(timeoutMs / 1000)), '--connect-timeout', '15', '--retry', '1', '--retry-delay', '1',
      '--user-agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/131 Safari/537.36 BhoomiIntel/3.2.2',
      '--header', 'Accept: text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      '--header', 'Accept-Language: en-IN,en;q=0.9', '--header', 'Cache-Control: no-cache'
    ];
    if (insecure) args.splice(0, 0, '--insecure');
    args.push(url);
    execFile(executable, args, { windowsHide: true, maxBuffer: 64 * 1024 * 1024, timeout: timeoutMs + 5000 }, (error, stdout, stderr) => {
      if (error) {
        const detail = String(stderr || error.message || '').trim().replace(/\s+/g, ' ');
        reject(new Error(`curl ${error.killed ? 'timed out' : `failed${error.code ? ` (${error.code})` : ''}`}${detail ? `: ${detail.slice(0, 600)}` : ''}`));
        return;
      }
      if (!stdout || stdout.length < 200) {
        reject(new Error('curl returned an empty response'));
        return;
      }
      resolve(stdout);
    });
  });
}

async function fetchTextHttpsIpv4(url, { timeoutMs = DEFAULT_TIMEOUT_MS } = {}) {
  const { request } = await import('node:https');
  const { URL } = await import('node:url');
  const { lookup } = await import('node:dns');
  const parsed = new URL(url);
  return await new Promise((resolve, reject) => {
    const req = request({
      protocol: parsed.protocol,
      hostname: parsed.hostname,
      port: parsed.port || 443,
      path: `${parsed.pathname}${parsed.search}`,
      family: 4,
      lookup: (hostname, options, callback) => lookup(hostname, { ...options, family: 4 }, callback),
      headers: { 'User-Agent': 'Mozilla/5.0 BhoomiIntel/3.2.2', Accept: 'text/html,*/*;q=0.8' },
      timeout: timeoutMs
    }, response => {
      let body = '';
      response.setEncoding('utf8');
      response.on('data', chunk => { body += chunk; });
      response.on('end', () => {
        if (!response.statusCode || response.statusCode < 200 || response.statusCode >= 300) return reject(new Error(`HTTP ${response.statusCode || 'unknown'}`));
        resolve(body);
      });
    });
    req.on('timeout', () => req.destroy(new Error('HTTPS IPv4 timeout')));
    req.on('error', reject);
    req.end();
  });
}

async function fetchOne(url, { timeoutMs = DEFAULT_TIMEOUT_MS } = {}) {
  const attempts = [
    ['curl-system-trust', () => fetchTextCurl(url, { timeoutMs })],
    ['node-fetch', () => fetchText(url, { timeoutMs })],
    ['https-ipv4', () => fetchTextHttpsIpv4(url, { timeoutMs })]
  ];
  if (ALLOW_INSECURE_TLS) {
    attempts.push(['curl-insecure-explicit', () => fetchTextCurl(url, { insecure: true, timeoutMs })]);
    attempts.push(['node-fetch-insecure-explicit', () => fetchText(url, { insecure: true, timeoutMs })]);
  }
  const errors = [];
  for (const [transport, getter] of attempts) {
    try {
      const html = await getter();
      return { html, transport };
    } catch (error) {
      errors.push(`${transport}: ${error?.cause?.code || error?.code || error?.message || 'failed'}`);
    }
  }
  throw new Error(errors.join(' | '));
}

async function fetchReport(key, parser, errors, options = {}) {
  try {
    const result = await fetchOne(SOURCES[key], options);
    const parsed = parser(result.html);
    const useful = Object.values(parsed).some(v => v && typeof v === 'object' && v.percent != null);
    if (!useful) throw new Error(`parsed unusable data (transport=${result.transport})`);
    return { parsed, transport: result.transport, url: SOURCES[key] };
  } catch (error) {
    errors.push(`${SOURCES[key]}: ${error.message}`);
    return null;
  }
}

async function fetchOfficialDILRMP() {
  const errors = [];
  const national = {
    land_records: null,
    digitized_maps: null,
    modern_record_rooms: null,
    survey_resurvey: null,
    revenue_courts: null,
    aadhaar_linked: null,
    sro_computerized: null,
    geo_referenced_villages: null,
    ulpin_villages: null,
    master: { states: 36, districts: null, tehsils: null, villages: null }
  };
  let transport = null;
  let sourceUrl = null;

  const jobs = [
    ['clr', parseClr, 'land_records'],
    ['maps', parseMaps, 'digitized_maps'],
    ['mrr', parseMrr, 'modern_record_rooms'],
    ['survey', parseSurvey, 'survey_resurvey'],
    ['rcms', parseRcms, 'revenue_courts'],
    ['aadhaar', parseAadhaar, 'aadhaar_linked'],
    ['sro', parseSro, 'sro_computerized']
  ];

  // Fetch the seven official report pages concurrently. The DILRMP server can
  // be slow, so sequential requests unnecessarily amplify latency.
  const settled = await Promise.all(jobs.map(([key, parser, field]) =>
    fetchReport(key, parser, errors).then(item => ({ key, field, item }))
  ));
  for (const { key, field, item } of settled) {
    if (!item) continue;
    national[field] = item.parsed[field];
    if (key === 'clr' && item.parsed.master?.districts) national.master = item.parsed.master;
    if (!sourceUrl) sourceUrl = item.url;
    if (!transport) transport = item.transport;
  }

  // The legacy MIS page is the official source that contains the national
  // cumulative district table. It is large and slow on some Windows networks,
  // so give it a longer timeout than the small KPI report pages.
  let districts = [];
  try {
    const legacy = await fetchOne(SOURCES.legacy, { timeoutMs: LEGACY_TIMEOUT_MS });
    const legacyParsed = parseLegacyHomepage(legacy.html);
    if (legacyParsed.sro_computerized) {
      national.sro_computerized = legacyParsed.sro_computerized;
    }
    if (legacyParsed.master?.districts) {
      national.master = legacyParsed.master;
    }
    districts = parseDistrictRows(legacy.html);
    if (!districts.length) errors.push(`${SOURCES.legacy}: fetched but district table parsed empty`);
    if (!sourceUrl && districts.length) sourceUrl = SOURCES.legacy;
    if (!transport && districts.length) transport = legacy.transport;
  } catch (error) {
    errors.push(`${SOURCES.legacy}: ${error.message}`);
  }

  // MIS 4.0 is dynamic on direct requests, but keep it as a last-resort parser.
  const kpiCount = Object.values(national).filter(v => v && typeof v === 'object' && v.percent != null).length;
  if (kpiCount === 0) {
    try {
      const mis4 = await fetchOne(SOURCES.mis4);
      const parsed = parseNationalMis4(mis4.html);
      const parsedCount = Object.values(parsed).filter(v => v && typeof v === 'object' && v.percent != null).length;
      if (parsedCount) {
        Object.assign(national, parsed);
        sourceUrl = SOURCES.mis4;
        transport = mis4.transport;
      }
    } catch (error) {
      errors.push(`${SOURCES.mis4}: ${error.message}`);
    }
  }

  const finalKpiCount = Object.values(national).filter(v => v && typeof v === 'object' && v.percent != null).length;
  if (finalKpiCount === 0) {
    throw new Error(`No official DILRMP KPI could be parsed. ${errors.join(' | ')}`);
  }

  return { national, districts, url: sourceUrl || SOURCES.clr, transport: transport || 'unknown', parsedKpiCount: finalKpiCount, errors };
}

export async function getLiveDILRMP({ force = false } = {}) {
  const now = Date.now();
  if (!force && cache && now - cache.fetchedAt < CACHE_TTL_MS) return cache.data;

  try {
    const fetched = await fetchOfficialDILRMP();
    const data = {
      success: true,
      live: true,
      source: 'DILRMP-MIS, Department of Land Resources, Ministry of Rural Development, Government of India',
      source_url: fetched.url,
      fetched_at: new Date().toISOString(),
      transport: fetched.transport,
      parsed_kpis: fetched.parsedKpiCount,
      cache_ttl_seconds: Math.round(CACHE_TTL_MS / 1000),
      national: fetched.national,
      districts: fetched.districts,
      parser_notes: fetched.errors.slice(0, 10),
      security_note: ALLOW_INSECURE_TLS ? 'DILRMP TLS verification bypass is explicitly enabled. Use only for a controlled demo environment.' : null,
      disclaimer: 'Official DILRMP-MIS data fetched at runtime. Values reflect the source portal and may be updated by State/UT administrations. AI-derived scores are not official government ratings.'
    };
    cache = { fetchedAt: now, data };
    lastError = null;
    return data;
  } catch (error) {
    lastError = { message: error.message, at: new Date().toISOString() };
    if (cache) return { ...cache.data, live_error: lastError.message, stale: true };
    return {
      success: false,
      live: false,
      source: 'DILRMP-MIS, Department of Land Resources, Ministry of Rural Development, Government of India',
      source_url: SOURCES.clr,
      fetched_at: null,
      national: null,
      districts: [],
      error: lastError.message,
      disclaimer: 'Live official source is temporarily unavailable. No simulated values are returned by the live connector.'
    };
  }
}

export function getLiveSourceCatalog() {
  return [
    { id: 'dilrmp-mis', name: 'DILRMP-MIS', authority: 'Department of Land Resources, Ministry of Rural Development, Government of India', url: SOURCES.clr, data: ['land-record computerization', 'cadastral map digitization', 'modern record rooms', 'survey/resurvey', 'revenue courts', 'Aadhaar linkage', 'SRO computerization', 'district physical-progress rows'], refresh: 'runtime + 10 minute cache', official: true },
    { id: 'platform-analytics', name: 'BhoomiIntel Analytical Layer', authority: 'Platform-derived', url: null, data: ['risk scoring', 'policy forecasts', 'trend calculations'], refresh: 'computed on request', official: false }
  ];
}

export function liveStatus() {
  return {
    cached: Boolean(cache),
    cached_at: cache ? cache.data.fetched_at : null,
    last_error: lastError,
    insecure_tls_enabled: ALLOW_INSECURE_TLS,
    source_catalog: getLiveSourceCatalog()
  };
}

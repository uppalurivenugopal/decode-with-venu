// PRYSM Live — a lightweight, dependency-free port of the PRYSM engine for the public showcase.
// Same principles as the full engine: retrieve first, compute numbers in code, cite everything,
// verify before returning. Covers SEC-registered (US-listed) companies.
// Output matches the shape of public/data/prysm/*.json so the page renders it with the same UI.
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const CATALOG = require('./catalog.json');

const SEC_UA = 'Decode with Venu PRYSM venu@decodewithvenu.com';
const WEB_UA = 'Mozilla/5.0';
const UNAVAILABLE = 'Data Unavailable in Public Sources';
const TIMEOUT_MS = 15000;

// ------------------------------------------------------------------ fetch helpers
async function get(url, { sec = false, as = 'text', ua } = {}) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    const r = await fetch(url, { headers: { 'User-Agent': ua || (sec ? SEC_UA : WEB_UA), 'Accept-Encoding': 'gzip, deflate' }, signal: ctrl.signal });
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    return as === 'json' ? await r.json() : await r.text();
  } finally { clearTimeout(t); }
}
const safe = async (p, fallback = null) => { try { return await p; } catch { return fallback; } };

// ------------------------------------------------------------------ evidence store
function makeStore() {
  const ev = {};
  const fetched = new Date().toISOString().slice(0, 16).replace('T', ' ');
  let n = 0;
  return {
    ev,
    add({ s, ty, sec = '', q, u = '', pd = null, b = '', raw = null }) {
      const key = `${u}|${sec}|${q}`;
      for (const [id, e] of Object.entries(ev)) if (e._k === key) return id;
      const id = `L-${(++n).toString(36)}${hash(key)}`;
      ev[id] = { s, ty, sec, q: String(q).slice(0, 900), u, pd, fd: fetched, b: b || `${ty}${sec ? `, ${sec}` : ''}`, _k: key, raw };
      return id;
    },
  };
}
function hash(s) { let h = 0; for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0; return (h >>> 0).toString(36).slice(0, 5); }

// ------------------------------------------------------------------ SEC: resolution
let TICKERS = null;
const STOP = new Set(['inc', 'corp', 'corporation', 'co', 'company', 'ltd', 'plc', 'llc', 'holdings', 'group', 'the', 'sa', 'ag', 'nv', 'se', 'limited', '&']);
const norm = (s) => s.toLowerCase().replace(/[^a-z0-9& ]/g, ' ').split(/\s+/).filter((t) => t && !STOP.has(t)).join(' ');
async function resolve(q) {
  if (!TICKERS) TICKERS = Object.values(await get('https://www.sec.gov/files/company_tickers.json', { sec: true, as: 'json' }));
  const raw = q.trim();
  const asTicker = raw.toUpperCase();
  let hit = TICKERS.find((r) => r.ticker.toUpperCase() === asTicker);
  if (!hit) {
    const t = norm(raw);
    if (!t) return null;
    hit = TICKERS.find((r) => norm(r.title) === t) || TICKERS.find((r) => norm(r.title).startsWith(t + ' '));
  }
  return hit ? { cik: String(hit.cik_str).padStart(10, '0'), ticker: hit.ticker, title: hit.title } : null;
}
// "3M CO" -> "3M Co", "CATERPILLAR INC" -> "Caterpillar Inc": title-case words, keep tokens with digits as-is.
const niceName = (n) => (n === n.toUpperCase() ? n.split(' ').map((w) => (/\d/.test(w) ? w : w.charAt(0) + w.slice(1).toLowerCase())).join(' ') : n);
const shortName = (n) => {
  let x = niceName(n).replace(/\s*\/[A-Za-z]+\/?$/, '');
  for (let i = 0; i < 3; i++) x = x.replace(/,?\s+(inc|corp|corporation|co|com|ltd|plc|llc|holdings|group|company)\.?$/i, '').replace(/[,.&\s]+$/, '').trim();
  return x;
};

// ------------------------------------------------------------------ SEC: XBRL facts
const CONCEPTS = {
  Revenue: ['Revenues', 'RevenueFromContractWithCustomerExcludingAssessedTax', 'RevenueFromContractWithCustomerIncludingAssessedTax', 'SalesRevenueNet'],
  OperatingIncome: ['OperatingIncomeLoss'], NetIncome: ['NetIncomeLoss', 'ProfitLoss'],
  DandA: ['DepreciationDepletionAndAmortization', 'DepreciationAndAmortization', 'DepreciationAmortizationAndAccretionNet'],
  COGS: ['CostOfRevenue', 'CostOfGoodsAndServicesSold', 'CostOfGoodsSold', 'CostOfServices'], GrossProfit: ['GrossProfit'],
  RnD: ['ResearchAndDevelopmentExpense', 'ResearchAndDevelopmentExpenseExcludingAcquiredInProcessCost'],
  SM: ['SellingAndMarketingExpense', 'MarketingAndAdvertisingExpense'], GA: ['GeneralAndAdministrativeExpense'],
  SGA: ['SellingGeneralAndAdministrativeExpense'], SBC: ['ShareBasedCompensation', 'AllocatedShareBasedCompensationExpense'],
  Restructuring: ['RestructuringCharges', 'RestructuringCosts'], Capex: ['PaymentsToAcquirePropertyPlantAndEquipment', 'PaymentsToAcquireProductiveAssets'],
  OCF: ['NetCashProvidedByUsedInOperatingActivities'], AR: ['AccountsReceivableNetCurrent'],
  AssetsCurrent: ['AssetsCurrent'], LiabilitiesCurrent: ['LiabilitiesCurrent'],
};
const FLOW = new Set(['Revenue', 'OperatingIncome', 'NetIncome', 'DandA', 'COGS', 'GrossProfit', 'RnD', 'SM', 'GA', 'SGA', 'SBC', 'Restructuring', 'Capex', 'OCF']);
const days = (a, b) => (new Date(b) - new Date(a)) / 86400000;

function series(facts, metric) {
  const gaap = facts?.facts?.['us-gaap'] || {};
  let best = [];
  for (const concept of CONCEPTS[metric]) {
    const units = gaap[concept]?.units;
    if (!units) continue;
    const unit = units.USD ? 'USD' : Object.keys(units)[0];
    const byEnd = {};
    for (const f of units[unit] || []) {
      if (!['10-K', '10-K/A', '20-F', '40-F'].includes(f.form)) continue;
      if (FLOW.has(metric) && (!f.start || days(f.start, f.end) < 350 || days(f.start, f.end) > 380)) continue;
      if (!byEnd[f.end] || (f.filed || '') > (byEnd[f.end].filed || '')) byEnd[f.end] = f;
    }
    const s = Object.values(byEnd).sort((a, b) => (a.end < b.end ? 1 : -1)).map((f) => ({ ...f, concept, unit }));
    if (s.length && (!best.length || s[0].end > best[0].end)) best = s;
  }
  return best;
}
const indexUrl = (cik, accn) => `https://www.sec.gov/Archives/edgar/data/${Number(cik)}/${accn.replace(/-/g, '')}/${accn}-index.htm`;
function factEv(store, cik, f) {
  const period = f.start ? `${f.start} to ${f.end}` : `as of ${f.end}`;
  return store.add({
    s: 'SEC EDGAR', ty: 'XBRL companyfacts', sec: `${f.form} ${f.concept}`,
    q: `us-gaap:${f.concept} = ${Math.round(f.val).toLocaleString('en-US')} ${f.unit} (${period}; form ${f.form}, accession ${f.accn}, filed ${f.filed})`,
    u: indexUrl(cik, f.accn), pd: f.filed, b: `SEC ${f.form} XBRL, FY${String(f.end).slice(0, 4)}`, raw: { val: f.val },
  });
}
const at = (s, end) => (s || []).find((f) => f.end === end);
function usd(v) {
  const a = Math.abs(v), sign = v < 0 ? '-' : '';
  for (const [d, suf] of [[1e12, 'T'], [1e9, 'B'], [1e6, 'M'], [1e3, 'K']]) if (a >= d) return `${sign}$${(a / d).toFixed(2)}${suf}`;
  return `${sign}$${a.toFixed(0)}`;
}
const pct = (v) => `${(v * 100).toFixed(1)}%`;
const spct = (v) => `${v >= 0 ? '+' : ''}${(v * 100).toFixed(1)}%`;
const bps = (v) => `${v >= 0 ? '+' : ''}${Math.round(v * 10000)} bps`;

// ------------------------------------------------------------------ 10-K text
function htmlToText(html) {
  return html.replace(/<(script|style)[\s\S]*?<\/\1>/gi, ' ').replace(/<ix:header[\s\S]*?<\/ix:header>/gi, ' ')
    .replace(/<br\s*\/?>|<\/(p|div|tr|li|h\d)>/gi, '\n').replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;|&#160;/g, ' ').replace(/&amp;/g, '&').replace(/&#8217;|&rsquo;/g, '’').replace(/&#8220;|&#8221;|&ldquo;|&rdquo;/g, '"')
    .replace(/&#\d+;|&\w+;/g, ' ').replace(/[ \t]+/g, ' ').replace(/\n\s*\n+/g, '\n\n');
}
const sentences = (t) => t.split(/(?<=[.;])\s+(?=[A-Z•])/).map((s) => s.replace(/\s+/g, ' ').trim()).filter((s) => s.length > 60 && s.length < 700);

// ------------------------------------------------------------------ number verification (same rules as the full engine)
const SCALE = { thousand: 1e3, k: 1e3, million: 1e6, mn: 1e6, m: 1e6, billion: 1e9, bn: 1e9, b: 1e9, trillion: 1e12, tn: 1e12, t: 1e12 };
function numbers(text) {
  const out = [];
  const re = /(?<![A-Za-z0-9.])([$€£¥₹])?\s?(\d{1,3}(?:,\d{3})+(?:\.\d+)?|\d+(?:\.\d+)?)\s?(%|percent\b|x\b|thousand\b|million\b|billion\b|trillion\b|mn\b|bn\b|tn\b|[kKmMbBtT]\b)?/g;
  let m;
  while ((m = re.exec(text))) {
    const raw = m[2].replace(/,/g, ''), suf = (m[3] || '').toLowerCase(), val = Number(raw);
    const before = text.slice(Math.max(0, m.index - 8), m.index).toLowerCase();
    if (/(item|part|section|note|q[1-4]|fy|form|rule)\s*$/.test(before)) continue;
    const after = text.slice(m.index + m[0].length, m.index + m[0].length + 2);
    if (/^-?[A-Z]\b|^-(?:K|Q|F)/.test(after)) continue;
    if (!suf && !m[1]) {
      if (!raw.includes('.') && !m[2].includes(',') && ((val >= 1900 && val <= 2100) || val < 10)) continue;
      if (/^[-/]\d/.test(after)) continue;
    }
    if (suf === '%' || suf === 'percent') out.push([val, true]);
    else if (SCALE[suf]) out.push([val * SCALE[suf], false]);
    else out.push([val, false]);
  }
  return out;
}
const close = (a, b, rel) => a === b || Math.abs(a - b) <= rel * Math.max(Math.abs(a), Math.abs(b));
function supported(v, isPct, cands) {
  return cands.some((c) => isPct ? Math.abs(c - v) <= 0.15 || Math.abs(c * 100 - v) <= 0.15
    : close(v, c, 0.006) || [1e3, 1e6, 1e9, 1e12].some((s) => close(v * s, c, 0.006) || close(v, c * s, 0.006)));
}

// ------------------------------------------------------------------ news
function parseRss(xml, limit = 40) {
  const items = [];
  for (const block of xml.split(/<item>/i).slice(1, limit + 1)) {
    const tag = (n) => (block.match(new RegExp(`<${n}[^>]*>([\\s\\S]*?)<\\/${n}>`, 'i')) || [])[1] || '';
    const clean = (s) => s.replace(/<!\[CDATA\[|\]\]>/g, '').replace(/<[^>]+>/g, ' ').replace(/&amp;/g, '&').replace(/&#39;|&apos;/g, "'").replace(/&quot;/g, '"').replace(/&lt;|&gt;/g, ' ').replace(/\s+/g, ' ').trim();
    let link = clean(tag('link'));
    const u = link.match(/[?&]url=([^&]+)/); if (u) link = decodeURIComponent(u[1]);
    const d = new Date(clean(tag('pubDate')));
    items.push({ title: clean(tag('title')), summary: clean(tag('description')), link, source: clean(tag('source')), date: isNaN(d) ? null : d.toISOString().slice(0, 10) });
  }
  return items;
}
const gnews = (q, days = 90) => get(`https://news.google.com/rss/search?q=${encodeURIComponent(q)}+when:${days}d&hl=en-US&gl=US&ceid=US:en`).then((x) => parseRss(x));
const bnews = (q) => get(`https://www.bing.com/news/search?q=${encodeURIComponent(q)}&format=rss`).then((x) => parseRss(x, 12));
const hostOf = (u) => { try { return new URL(u).hostname.replace(/^www\./, ''); } catch { return ''; } };

const NEWS_SIGNALS = [
  ['Executive leadership shift', /\b(appoints?|names?|named|hires?|taps|promotes?|steps? down|resigns?|retire|departs?|successor|new (?:ceo|cio|cto|cfo|coo))\b/i],
  ['M&A announcement', /\b(acquir\w*|acquisition|merger|to buy|buys|takeover|divest\w*|spin[- ]?off)\b/i],
  ['Earnings miss / guidance cut', /\b(miss(?:es|ed)?|below (?:estimates|expectations)|cuts? (?:guidance|outlook|forecast)|lowers? (?:guidance|outlook|forecast))\b/i],
  ['Restructuring / layoffs', /\b(layoffs?|job cuts|restructur\w*|cost[- ]cutting)\b/i],
  ['Expansion / new investment', /\b(expands? (?:into|operations|capacity|manufacturing)|new (?:plant|facility|factory|headquarters|data ?cent(?:er|re)s?|campus)|invest(?:s|ing|ment)? (?:\$|€|£|₹|\d))/i],
  ['Digital / AI initiative', /\b(ai|artificial intelligence|digital transformation|cloud migration|modernization|genai)\b/i],
];
const EIGHTK = { '5.02': 'Leadership change (8-K Item 5.02)', '1.01': 'Material agreement (8-K Item 1.01)', '2.01': 'M&A / asset deal completed (8-K Item 2.01)', '2.05': 'Restructuring / exit costs (8-K Item 2.05)', '2.06': 'Material impairment (8-K Item 2.06)' };
const MOVES = [
  ['Capacity / data-centre expansion', /data ?cent(?:er|re)|capacity|new (?:plant|facility|factory|region|campus)|expan(?:ds?|sion|ding) (?:into|in|its)|invest(?:s|ing|ment)? (?:\$|€|£|₹|\d)|gigawatt/i,
    '{peer} is adding capacity and footprint. Where they overlap, {subject} comes under pressure to match scale or win on efficiency and price, and may speed up its own infrastructure or cost programmes.', 'cloud'],
  ['Acquisition / M&A', /acquir|acquisition|merger|to buy|buys|takeover|deal to/i,
    '{peer} is buying capabilities, which can widen its bundled offer in accounts {subject} also targets. Expect {subject} to respond with partnerships, deals of its own or faster product integration.', 'ma_integration'],
  ['AI / product launch', /\bai\b|artificial intelligence|agentic|launch|unveil|introduc|rolls out|new (?:product|platform|feature)/i,
    "{peer}'s launches raise the feature bar. {subject} will be under pressure to accelerate its roadmap, which increases its need for engineering capacity and AI skills.", 'data_ai'],
  ['Partnership / alliance', /partner|alliance|collaborat|teams up|joins forces/i,
    '{peer} is deepening its ecosystem. {subject} risks displacement in shared accounts unless it strengthens its own alliances and integrations.', 'app_mod'],
  ['Pricing / commercial move', /\bprice|pricing|discount|bundle/i,
    "{peer}'s commercial moves can compress pricing across the category. {subject} may need to defend price through cost efficiency.", 'managed'],
  ['Restructuring / layoffs', /layoffs?|job cuts|restructur|cuts? (?:jobs|staff|workforce)/i,
    '{peer} is resetting its cost base. That frees up talent and may push {subject}’s leadership to seek similar efficiency gains.', 'managed'],
  ['Results / guidance', /earnings|results|guidance|beats|misses|quarter|outlook|forecast/i,
    "{peer}'s latest results set the benchmark investors will compare {subject} against.", ''],
];
const OFF = Object.fromEntries(CATALOG.offerings.map((o) => [o.id, o]));

const INDUSTRY = [
  ['telecom', /telecom|communication|wireless|cable|broadcast|media|entertainment|publishing/i],
  ['financial', /bank|insurance|financ|capital markets|asset management|credit|reit|broker|savings institution/i],
  ['healthcare', /health|pharma|biolog|medical|drug|diagnostic|surgical|hospital/i],
  ['energy', /oil|gas|energy|utilit|electric|petroleum|refin|power|mining|coal/i],
  ['technology', /software|semiconductor|computer|prepackaged|data processing|electronic|information|internet/i],
  ['consumer', /retail|stores|apparel|food|beverage|restaurant|grocery|household|cosmetic|catalog|mail-order/i],
  ['manufacturing', /machinery|manufactur|motor vehicle|aircraft|industrial|chemical|steel|equipment|construction|engines/i],
];

// ------------------------------------------------------------------ main
export async function deepDive(query) {
  const store = makeStore();
  const co = await resolve(query);
  if (!co) return { error: 'not_found' };
  const { cik, ticker } = co;
  const name = niceName(co.title);
  const short = shortName(co.title);

  const [subs, facts, wiki] = await Promise.all([
    safe(get(`https://data.sec.gov/submissions/CIK${cik}.json`, { sec: true, as: 'json' })),
    safe(get(`https://data.sec.gov/api/xbrl/companyfacts/CIK${cik}.json`, { sec: true, as: 'json' })),
    safe((async () => {
      const s = await get(`https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(short + ' company')}&format=json&srlimit=5`, { as: 'json', ua: SEC_UA });
      const hits = (s.query?.search || []).filter((h) => !h.title.includes(' v. '));
      const first = short.toLowerCase().split(' ')[0];
      const title = (hits.find((h) => h.title.toLowerCase().startsWith(first)) || hits[0])?.title;
      if (!title) return null;
      return get(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title.replace(/ /g, '_'))}`, { as: 'json', ua: SEC_UA });
    })()),
  ]);
  if (!facts) return { error: 'no_financials', name };

  const industryText = subs?.sicDescription || '';
  const industry = (INDUSTRY.find(([, re]) => re.test(industryText)) || ['generic'])[0];
  const physical = ['manufacturing', 'consumer', 'energy', 'healthcare'].includes(industry);

  // latest 10-K primary document (for management's driver sentences)
  const rec = subs?.filings?.recent || {};
  let tenk = null;
  for (let i = 0; i < (rec.form || []).length; i++) {
    if (rec.form[i] === '10-K') { tenk = { accn: rec.accessionNumber[i], doc: rec.primaryDocument[i], filed: rec.filingDate[i] }; break; }
  }
  const tenkUrl = tenk ? `https://www.sec.gov/Archives/edgar/data/${Number(cik)}/${tenk.accn.replace(/-/g, '')}/${tenk.doc}` : '';

  const [tenkText, news, similar] = await Promise.all([
    tenk ? safe(get(tenkUrl, { sec: true }).then(htmlToText), '') : '',
    safe(gnews(`"${short}"`, 90), []),
    safe(get(`https://query2.finance.yahoo.com/v6/finance/recommendationsbysymbol/${ticker}`, { as: 'json' }), null),
  ]);
  const tkSentences = tenkText ? sentences(tenkText) : [];
  const tkEv = (s, label) => store.add({ s: 'SEC EDGAR', ty: '10-K', sec: label, q: s, u: tenkUrl, pd: tenk?.filed, b: 'SEC 10-K' });

  // ---------------- About
  const about = { claims: [], facts: [], regions: [] };
  if (wiki?.extract) {
    const id = store.add({ s: 'Wikipedia', ty: 'Encyclopedia article', sec: 'Summary', q: wiki.extract, u: wiki.content_urls?.desktop?.page || '', pd: (wiki.timestamp || '').slice(0, 10), b: `Wikipedia, ${(wiki.timestamp || '').slice(0, 7)}` });
    const sents = wiki.extract.split(/(?<=[.!?])\s+(?=[A-Z])/);
    for (let i = 0; i < sents.length && about.claims.length < 2; i += 2) about.claims.push({ t: sents.slice(i, i + 2).join(' '), c: [id] });
  }
  const subsUrl = `https://www.sec.gov/cgi-bin/browse-edgar?action=getcompany&CIK=${cik}`;
  if (subs) {
    const addr = subs.addresses?.business || {};
    const sid = store.add({ s: 'SEC EDGAR', ty: 'Company registration', sec: 'Submissions index',
      q: `${subs.name} — CIK ${cik}; industry (SIC ${subs.sic}): ${subs.sicDescription}; business address: ${[addr.city, addr.stateOrCountryDescription].filter(Boolean).join(', ')}; exchanges: ${(subs.exchanges || []).join(', ')}; fiscal year end ${subs.fiscalYearEnd}`,
      u: subsUrl, b: 'SEC EDGAR, registrant' });
    if (subs.sicDescription) about.facts.push({ l: 'Industry (SEC)', v: subs.sicDescription, c: [sid] });
    if (addr.city) about.facts.push({ l: 'Business address', v: [niceName(addr.city), addr.stateOrCountryDescription].filter(Boolean).join(', '), c: [sid] });
    if ((subs.exchanges || []).length) about.facts.push({ l: 'Listing', v: `${ticker} · ${subs.exchanges.join(', ')}`, c: [sid] });
    if (subs.website) about.facts.push({ l: 'Website', v: subs.website.replace(/^https?:\/\//, ''), c: [sid] });
  }

  // ---------------- Financials
  const s = {};
  for (const k of Object.keys(CONCEPTS)) s[k] = series(facts, k);
  const rev = s.Revenue;
  const kpis = [];
  const metric = (l, value, d, p, c, formula = '', f = '') => ({ l, d, p, c, f, _v: value, _formula: formula });
  if (rev.length) {
    const r0 = rev[0], e0 = factEv(store, cik, r0);
    about.facts.push({ l: 'Annual revenue', v: `${usd(r0.val)} (FY ${r0.end})`, c: [e0] });
    if (rev[1]) { const e1 = factEv(store, cik, rev[1]); kpis.push(metric('Revenue growth (YoY)', r0.val / rev[1].val - 1, pct(r0.val / rev[1].val - 1), `${rev[1].end} → ${r0.end}`, [e0, e1], 'e0 / e1 - 1', 'Revenue this FY / last FY − 1')); }
    if (rev[3]) { const e3 = factEv(store, cik, rev[3]); const c = (r0.val / rev[3].val) ** (1 / 3) - 1; kpis.push(metric('Revenue CAGR (3-yr)', c, pct(c), `${rev[3].end} → ${r0.end}`, [e0, e3], '(e0 / e1) ** (1/3) - 1', '(Revenue / Revenue 3 yrs prior)^(1/3) − 1')); }
    const oi = at(s.OperatingIncome, r0.end); if (oi) kpis.push(metric('Operating income margin', oi.val / r0.val, pct(oi.val / r0.val), `FY ending ${r0.end}`, [factEv(store, cik, oi), e0], 'e0 / e1', 'Operating income / Revenue'));
    const ni = at(s.NetIncome, r0.end); if (ni) kpis.push(metric('Net income margin', ni.val / r0.val, pct(ni.val / r0.val), `FY ending ${r0.end}`, [factEv(store, cik, ni), e0], 'e0 / e1', 'Net income / Revenue'));
    const rd = at(s.RnD, r0.end); if (rd) kpis.push(metric('R&D intensity', rd.val / r0.val, pct(rd.val / r0.val), `FY ending ${r0.end}`, [factEv(store, cik, rd), e0], 'e0 / e1', 'R&D / Revenue'));
    const ca = s.AssetsCurrent[0], cl = ca && at(s.LiabilitiesCurrent, ca.end);
    if (ca && cl) kpis.push(metric('Current ratio', ca.val / cl.val, `${(ca.val / cl.val).toFixed(2)}x`, `as of ${ca.end}`, [factEv(store, cik, ca), factEv(store, cik, cl)], 'e0 / e1', 'Current assets / current liabilities'));
  }

  // line items
  const LINES = [
    ['revenue', 'Revenue', 'Growth', 'Revenue', ['revenue', 'net sales'], false],
    ['cogs', 'Cost of revenue (COGS)', 'Cost structure', 'COGS', ['cost of revenue', 'cost of sales', 'cost of goods', 'costs of revenue'], true],
    ['gross_profit', 'Gross profit', 'Profitability', 'GrossProfit', ['gross margin', 'gross profit'], false],
    ['rnd', 'Research & development', 'Cost structure', 'RnD', ['research and development'], true],
    ['sm', 'Sales & marketing', 'Cost structure', 'SM', ['sales and marketing', 'selling and marketing'], true],
    ['ga', 'General & administrative', 'Cost structure', 'GA', ['general and administrative'], true],
    ['sga', 'Selling, general & admin (SG&A)', 'Cost structure', 'SGA', ['selling, general and administrative', 'sg&a'], true],
    ['opinc', 'Operating income', 'Profitability', 'OperatingIncome', ['operating income', 'operating loss', 'operating margin'], false],
    ['restructuring', 'Restructuring charges', 'Cost structure', 'Restructuring', ['restructuring', 'severance'], true],
    ['capex', 'Capital expenditure', 'Cash & capital', 'Capex', ['capital expenditures', 'purchases of property', 'property and equipment'], true],
    ['ocf', 'Operating cash flow', 'Cash & capital', 'OCF', ['cash provided by operating', 'operating activities'], false],
  ];
  const CAUSAL = /primarily|driven by|due to|as a result of|attributable to|offset by|reflect|resulting from|because of|increase in|decrease in|partially offset/i;
  const CHANGE = /increase[ds]?|decrease[ds]?|grew|declin|higher|lower|compared to|year over year/i;
  const driverFor = (phrases) => {
    const re = new RegExp(phrases.map((p) => p.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|'), 'i');
    let best = null, bestScore = 0;
    for (const sent of tkSentences) {
      if (!re.test(sent) || !CAUSAL.test(sent)) continue;
      let sc = 1 + (CHANGE.test(sent) ? 2 : 0) + (/\d/.test(sent) ? 1 : 0) - (/consists? (?:primarily )?of|is comprised of/i.test(sent.slice(0, 120)) ? 3 : 0);
      if (sc > bestScore) { best = sent; bestScore = sc; }
    }
    return best;
  };
  const lines = [];
  const yoyBy = {}, shift = {};
  const r0 = rev[0], r1 = rev[1];
  const revYoy = r0 && r1 ? r0.val / r1.val - 1 : null;
  const hasSmGa = s.SM.length && s.GA.length;
  for (const [key, label, group, mk, phrases, isCost] of LINES) {
    if (!r0 || (key === 'sga' && hasSmGa)) continue;
    const f0 = at(s[mk], r0.end);
    if (!f0) continue;
    const f1 = r1 && at(s[mk], r1.end);
    const e0 = factEv(store, cik, f0);
    const li = { key, l: label, g: group, v: metric('FY value', f0.val, usd(f0.val), `FY ending ${f0.end}`, [e0]), yoy: null, share: null, shift: null, a: 'neutral', drv: [], angle: null };
    if (f1 && f1.val) {
      const y = f0.val / f1.val - 1; yoyBy[key] = y;
      li.yoy = metric('YoY change', y, spct(y), `${f1.end} → ${f0.end}`, [e0, factEv(store, cik, f1)], 'e0 / e1 - 1');
    }
    if (key !== 'revenue') {
      const sh = f0.val / r0.val; const er = factEv(store, cik, r0);
      li.share = metric('% of revenue', sh, `${(sh * 100).toFixed(1)}%`, `FY ending ${f0.end}`, [e0, er], 'e0 / e1');
      if (f1 && r1) {
        const d = f0.val / r0.val - f1.val / r1.val; shift[key] = d;
        li.shift = metric('Shift in % of revenue', d, bps(d), `${r1.end} → ${f0.end}`, [e0, er, factEv(store, cik, f1), factEv(store, cik, r1)], 'e0 / e1 - e2 / e3');
      }
    }
    if (isCost) li.a = shift[key] > 0.003 ? 'headwind' : shift[key] < -0.003 ? 'tailwind' : 'neutral';
    else li.a = yoyBy[key] > 0.02 ? 'tailwind' : yoyBy[key] < -0.02 ? 'headwind' : 'neutral';
    const drv = driverFor(phrases);
    if (drv) li.drv.push({ t: drv, c: [tkEv(drv, '10-K (MD&A)')] });
    lines.push(li);
  }
  const angle = (key, rule, why) => {
    const li = lines.find((l) => l.key === key); if (!li) return;
    let oid = CATALOG.line_rules[rule]; if (rule === 'cogs_up' && physical) oid = 'supply_chain';
    const o = OFF[oid];
    const cites = [...new Set([...(li.yoy?.c.slice(0, 1) || li.v.c), ...(li.share?.c.slice(0, 1) || []), ...(li.drv[0]?.c || [])])];
    li.angle = { o: o.name, id: oid, r: { t: `${why} Sales angle: ${o.name.toLowerCase()}.`, c: cites, i: 1 } };
  };
  if (shift.cogs > 0.003) angle('cogs', 'cogs_up', 'Cost of revenue is taking a larger share of every revenue dollar, squeezing gross margin.');
  if (revYoy !== null && yoyBy.ga > revYoy) angle('ga', 'ga_up', 'G&A is growing faster than revenue, so the back office is not scaling efficiently.');
  if (revYoy !== null && yoyBy.sm > revYoy) angle('sm', 'sm_up', 'Sales & marketing is growing faster than revenue: each new revenue dollar costs more to win.');
  if (shift.rnd > 0.003) angle('rnd', 'rnd_up', 'R&D intensity is rising, so engineering spend is a growing priority and pressure point.');
  if (yoyBy.capex > 0.15) angle('capex', 'capex_up', 'Capital spending is rising sharply, which points to infrastructure or capacity build-out.');
  if (lines.find((l) => l.key === 'restructuring')?.v._v > 0) angle('restructuring', 'restructuring', 'The company is booking restructuring charges, a sign of an active cost-reset programme.');
  if (shift.opinc < -0.005) angle('opinc', 'margin_down', 'Operating margin is shrinking, so cost transformation is likely on the CFO’s agenda.');
  if (revYoy !== null && yoyBy.ocf !== undefined && yoyBy.ocf < revYoy - 0.05) angle('ocf', 'ocf_lag', 'Operating cash flow is lagging revenue growth, a working-capital or collections pressure point.');
  if (rev.length > 2 && revYoy !== null && revYoy < rev[1].val / rev[2].val - 1 - 0.02) angle('revenue', 'growth_slowing', 'Revenue growth is decelerating versus the prior year.');

  // ---------------- Signals
  const signals = [];
  const today = Date.now();
  for (let i = 0; i < (rec.form || []).length; i++) {
    if (!/^8-K/.test(rec.form[i])) continue;
    if ((today - new Date(rec.filingDate[i])) / 86400000 > 365) break;
    const items = String(rec.items[i] || '').split(',').map((x) => x.trim()).filter((x) => EIGHTK[x]);
    if (!items.length) continue;
    const url = `https://www.sec.gov/Archives/edgar/data/${Number(cik)}/${rec.accessionNumber[i].replace(/-/g, '')}/${rec.primaryDocument[i]}`;
    const id = store.add({ s: 'SEC EDGAR', ty: rec.form[i], sec: 'Filing index', q: `${rec.form[i]} filed ${rec.filingDate[i]}: ${items.map((x) => `Item ${x} (${EIGHTK[x]})`).join('; ')}`, u: url, pd: rec.filingDate[i], b: `SEC ${rec.form[i]}, ${rec.filingDate[i]}` });
    signals.push({ k: EIGHTK[items[0]], d: `8-K filed ${rec.filingDate[i]}: ${items.map((x) => `Item ${x}`).join(', ')}`, dt: rec.filingDate[i], c: [id] });
  }
  const newsEv = (n) => store.add({ s: n.source || hostOf(n.link) || 'News', ty: 'News headline', sec: n.source || '', q: n.title, u: n.link, pd: n.date, b: `${n.source || 'News'}, ${n.date || 'n.d.'}` });
  for (const n of news) {
    const hit = NEWS_SIGNALS.find(([, re]) => re.test(n.title));
    if (hit) signals.push({ k: hit[0], d: n.title, dt: n.date || '', c: [newsEv(n)] });
  }
  signals.sort((a, b) => (a.dt < b.dt ? 1 : -1));

  // ---------------- Peers
  const peers = [];
  const syms = similar?.finance?.result?.[0]?.recommendedSymbols?.map((x) => x.symbol) || [];
  // Yahoo's list reflects what investors also watch, so keep only peers in the same SEC industry group
  // (first two SIC digits); fall back to at most two unfiltered names if none match.
  const sic2 = String(subs?.sic || '').slice(0, 2);
  const peerCands = [];
  for (const sym of syms.slice(0, 8)) {
    const pc = await safe(resolve(sym));
    if (pc && pc.cik !== cik) peerCands.push({ ...pc, sym });
  }
  const withSic = await Promise.all(peerCands.map(async (pc) => {
    const ps = await safe(get(`https://data.sec.gov/submissions/CIK${pc.cik}.json`, { sec: true, as: 'json' }));
    return { ...pc, sic: String(ps?.sic || ''), sicDesc: ps?.sicDescription || '' };
  }));
  let peerCos = withSic.filter((pc) => sic2 && pc.sic.startsWith(sic2)).slice(0, 4);
  if (!peerCos.length) peerCos = withSic.slice(0, 2);
  const subjectGrowth = revYoy;
  const tkCompete = tkSentences.find((x) => /compet/i.test(x) && /(compete|competitors|competition)/i.test(x));
  const subjCtx = tkCompete ? tkEv(tkCompete, '10-K (Competition)') : null;
  await Promise.all(peerCos.map(async (pc) => {
    const pname = shortName(pc.title);
    const [pf, pnews] = await Promise.all([
      safe(get(`https://data.sec.gov/api/xbrl/companyfacts/CIK${pc.cik}.json`, { sec: true, as: 'json' })),
      safe(gnews(`"${pname}"`, 120), []),
    ]);
    const sameGroup = sic2 && pc.sic.startsWith(sic2);
    const p = { n: pname, t: pc.ticker, rel: sameGroup ? `Market peer · ${pc.sicDesc || 'same industry group'}` : 'Market peer (Yahoo Finance)', threat: 'low', m: [], moves: [], imp: [] };
    const prev = pf ? series(pf, 'Revenue') : [];
    if (prev.length) {
      const e0 = factEv(store, pc.cik, prev[0]);
      p.m.push({ v: `${usd(prev[0].val)} (FY ${prev[0].end.slice(0, 4)})`, c: [e0] });
      if (prev[1]) { p.m.push({ v: pct(prev[0].val / prev[1].val - 1), c: [e0, factEv(store, pc.cik, prev[1])] }); if (subjectGrowth !== null && prev[0].val / prev[1].val - 1 > subjectGrowth) p.threat = 'medium'; } else p.m.push({ v: '—', c: [] });
      const o = at(series(pf, 'OperatingIncome'), prev[0].end); p.m.push(o ? { v: pct(o.val / prev[0].val), c: [factEv(store, pc.cik, o), e0] } : { v: '—', c: [] });
      const d = at(series(pf, 'RnD'), prev[0].end); p.m.push(d ? { v: pct(d.val / prev[0].val), c: [factEv(store, pc.cik, d), e0] } : { v: '—', c: [] });
    } else p.m.push({ v: UNAVAILABLE, c: [] }, { v: '—', c: [] }, { v: '—', c: [] }, { v: '—', c: [] });
    p.m.push({ v: '—', c: [] }, { v: '—', c: [] });
    const used = new Set();
    for (const n of pnews) {
      if (!n.title.toLowerCase().includes(pname.split(' ')[0].toLowerCase())) continue;
      const mv = MOVES.find(([cat, re]) => re.test(n.title) && !used.has(cat));
      if (!mv) continue;
      used.add(mv[0]);
      const id = newsEv(n);
      p.moves.push({ k: mv[0], d: n.title, dt: n.date || '', u: n.link, c: [id] });
      let text = mv[2].replaceAll('{peer}', pname).replaceAll('{subject}', short);
      if (mv[3]) text += ` Presales angle at ${short}: ${OFF[mv[3]].name.toLowerCase()}.`;
      p.imp.push({ t: text, c: [id, ...(subjCtx ? [subjCtx] : [])], i: 1 });
      if (p.moves.length >= 3) break;
    }
    peers.push(p);
  }));
  peers.sort((a, b) => ({ high: 0, medium: 1, low: 2 }[a.threat] - { high: 0, medium: 1, low: 2 }[b.threat]));

  // ---------------- Industry shifts (headline level in live mode)
  const themes = (CATALOG.themes[industry] || CATALOG.themes.generic).slice(0, 4);
  const IMPACT_NUM = /\d+(?:\.\d+)?\s?(?:%|percent|x\b|hours?|days?|weeks?|million|billion)|\$\s?\d/i;
  const IMPACT_VERB = /reduc|cut|lower|improv|increas|sav|faster|boost|accelerat|shorten|decreas|grew|doubl|halv|lift/i;
  const trends = await Promise.all(themes.map(async (th) => {
    const items = (await safe(bnews(th.query), [])).filter((n) => n.title && n.link).slice(0, 8);
    const ev = items.map((n) => store.add({ s: hostOf(n.link) || 'News', ty: 'News article (summary)', sec: n.title.slice(0, 160), q: `${n.title}. ${n.summary}`.trim(), u: n.link, pd: n.date, b: `${hostOf(n.link) || 'News'}, ${n.date || 'n.d.'}` }));
    const impact = [], use = [];
    items.forEach((n, i) => {
      const txt = `${n.title}. ${n.summary}`;
      if (IMPACT_NUM.test(txt) && IMPACT_VERB.test(txt) && impact.length < 2) impact.push({ t: txt.slice(0, 380), c: [ev[i]] });
      else if (use.length < 2 && /\b(deploy|uses|using|rolled out|launch|pilot|adopt)/i.test(txt)) use.push({ t: txt.slice(0, 300), c: [ev[i]] });
    });
    const relRe = new RegExp(th.rel, 'i');
    const relSent = tkSentences.find((x) => relRe.test(x));
    const rel = relSent ? [{ t: `${short} already discusses this area in its 10-K: “${relSent.slice(0, 300)}”`, c: [tkEv(relSent, '10-K')] }]
      : ev.length ? [{ t: `Not visible in ${short}’s 10-K: a whitespace topic to raise as a point of view.`, c: [ev[0]], i: 1 }] : [];
    return { t: th.title, k: th.kind, mom: items.length >= 8 ? 'high' : items.length >= 4 ? 'medium' : 'low', def: th.def, imp: impact, use, rel, _off: th.offering };
  }));

  // ---------------- Sales plays (presales lens)
  const plays = [];
  for (const o of CATALOG.offerings) {
    const re = new RegExp(o.pattern, 'i');
    const why = [], pain = [];
    const mods = new Set();
    let score = 0, direct = false, trigger = false;
    for (const li of lines) if (li.angle?.id === o.id) {
      score += 3; direct = true; mods.add('financials'); pain.push(li.angle.r);
      if (li.drv[0]) why.push({ t: `${li.l}: ${li.drv[0].t}`, c: li.drv[0].c });
    }
    let nSig = 0;
    for (const sg of signals) {
      if (nSig >= 2) break;
      if (o.signals.includes(sg.k)) { score += 3; trigger = true; nSig++; mods.add('signals'); why.push({ t: `Trigger — ${sg.k}: ${sg.d.slice(0, 200)}`, c: sg.c }); }
      else if (re.test(sg.d)) { score += 1; nSig++; mods.add('signals'); why.push({ t: `Signal — ${sg.d.slice(0, 200)}`, c: sg.c }); }
    }
    let nTk = 0;
    for (const sent of tkSentences) {
      if (nTk >= 2) break;
      if (re.test(sent) && /(risk|strateg|invest|priorit|expect|plan|intend|could adversely|depend)/i.test(sent)) {
        score += 1.5; nTk++; mods.add('filing'); why.push({ t: `10-K — ${sent.slice(0, 300)}`, c: [tkEv(sent, '10-K')] });
      }
    }
    const tr = trends.filter((t) => t._off === o.id && (t.imp.length || t.use.length));
    if (tr.length) { score += 0.5; mods.add('industry'); }
    for (const p of peers) if (p.imp.some((c) => c.t.includes(o.name.toLowerCase()))) { score += 1; mods.add('peers'); break; }
    if (mods.size < 2 || score < 3 || !why.length) continue;
    const conf = direct && (trigger || mods.size >= 4) ? 'high' : direct || trigger || mods.size >= 3 ? 'medium' : 'low';
    const cites = [...new Set(why.slice(0, 3).map((w) => w.c[0]))];
    plays.push({ o: o.name, cat: o.category, conf, score, why: why.slice(0, 3), pain: pain.slice(0, 1),
      talk: [{ t: `Value hypothesis: ${o.pitch.replaceAll('{company}', short)}.`, c: cites, i: 1 }], roles: o.roles, q: o.questions, mods: [...mods] });
  }
  plays.sort((a, b) => ({ high: 0, medium: 1, low: 2 }[a.conf] - { high: 0, medium: 1, low: 2 }[b.conf]) || b.score - a.score);

  // ---------------- Verification guardrail
  const v = { numbers_checked: 0, numbers_verified: 0, metrics_checked: 0, metrics_verified: 0, claims_dropped: 0 };
  const cands = (ids) => ids.flatMap((id) => { const e = store.ev[id]; if (!e) return []; const r = numbers(e.q).map((x) => x[0]); if (e.raw?.val !== undefined) r.push(e.raw.val); return r; });
  const checkClaims = (arr) => arr.filter((c) => {
    c.c = (c.c || []).filter((id) => store.ev[id]);
    if (!c.c.length) { v.claims_dropped++; return false; }
    const cs = cands(c.c);
    for (const [val, isP] of numbers(c.t)) { v.numbers_checked++; if (supported(val, isP, cs)) v.numbers_verified++; else { v.claims_dropped++; return false; } }
    return true;
  });
  const checkMetric = (m) => {
    if (!m) return m;
    v.metrics_checked++;
    const env = m.c.map((id) => store.ev[id]?.raw?.val);
    let expected = env[0];
    if (m._formula) expected = Function('e0', 'e1', 'e2', 'e3', `return ${m._formula.replace(/\*\*/g, '**')};`)(...env);
    if (expected !== undefined && close(m._v, expected, 1e-6)) v.metrics_verified++; else { m.d = UNAVAILABLE; }
    delete m._v; delete m._formula;
    return m;
  };
  about.claims = checkClaims(about.claims);
  kpis.forEach(checkMetric);
  for (const li of lines) { ['v', 'yoy', 'share', 'shift'].forEach((k) => checkMetric(li[k])); li.drv = checkClaims(li.drv); if (li.angle && !checkClaims([li.angle.r]).length) li.angle = null; delete li.key; if (li.angle) delete li.angle.id; }
  for (const p of plays) { p.why = checkClaims(p.why); p.pain = checkClaims(p.pain); p.talk = checkClaims(p.talk); }
  for (const p of peers) p.imp = checkClaims(p.imp);
  for (const t of trends) { t.imp = checkClaims(t.imp); t.use = checkClaims(t.use); t.rel = checkClaims(t.rel); delete t._off; }

  // ship only cited evidence
  const used = new Set();
  const walk = (x) => { if (Array.isArray(x)) x.forEach(walk); else if (x && typeof x === 'object') { if (Array.isArray(x.c)) x.c.forEach((id) => used.add(id)); Object.values(x).forEach(walk); } };
  const out = {
    company: { name, ticker, cik, domain: (subs?.website || '').replace(/^https?:\/\//, ''), industry: industryText },
    generated: new Date().toISOString().slice(0, 10), mode: 'live',
    verification: v, about, kpis, plays: plays.filter((p) => p.why.length).slice(0, 4), lines, peers, trends, signals: signals.slice(0, 6),
  };
  walk(out);
  out.evidence = Object.fromEntries(Object.entries(store.ev).filter(([id]) => used.has(id)).map(([id, e]) => [id, { s: e.s, ty: e.ty, sec: e.sec, q: e.q, u: e.u, pd: e.pd, fd: e.fd, b: e.b }]));
  return out;
}

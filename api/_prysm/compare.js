// PRYSM Live — competitor scan and comparison (up to 4 competitors + the subject company).
// Same rules as the main engine: numbers from SEC XBRL and computed in code, text quoted from each
// company's latest 10-K, every claim cited and number-checked. Cross-company "what the numbers say"
// paragraphs are computed comparisons, written without figures and labelled as inference.
import {
  SEC_UA, UNAVAILABLE, allTickers, at, close, factEv, get, htmlToText, makeStore, niceName, numbers, pct, resolve,
  safe, sentences, series, shortName, supported, usd,
} from './engine.js';

const subsOf = (cik) => get(`https://data.sec.gov/submissions/CIK${cik}.json`, { sec: true, as: 'json' });

// ------------------------------------------------------------------ nearest competitors
const NAME_RX = /\b([A-Z][A-Za-z0-9&.\-]+(?:\s(?:[A-Z][A-Za-z0-9&.\-]+|of|and|&))*)/g;
const GENERIC = new Set(['We', 'Our', 'The', 'These', 'In', 'Many', 'Some', 'Competitors', 'Competition', 'Item', 'Risk', 'Factors',
  'Business', 'Company', 'U.S.', 'United States', 'Internet', 'Cloud', 'AI', 'Asia', 'Europe', 'China', 'North America', 'Japan', 'India']);

function namedCompetitors(text) {
  const out = [];
  for (const sent of sentences(text)) {
    if (!/compet/i.test(sent)) continue;
    const tail = sent.split(/compete with|competitors include|competitors are|such as|including|competition from/i)[1];
    if (!tail) continue;
    for (const m of tail.matchAll(NAME_RX)) {
      const n = m[1].trim().replace(/[.,]$/, '');
      if (!GENERIC.has(n) && n.length > 2 && !out.includes(n)) out.push(n);
    }
  }
  return out.slice(0, 12);
}

async function latestTenK(cik, subs) {
  const rec = subs?.filings?.recent || {};
  for (let i = 0; i < (rec.form || []).length; i++) {
    if (rec.form[i] === '10-K') {
      const url = `https://www.sec.gov/Archives/edgar/data/${Number(cik)}/${rec.accessionNumber[i].replace(/-/g, '')}/${rec.primaryDocument[i]}`;
      return { url, filed: rec.filingDate[i] };
    }
  }
  return null;
}

async function sameSic(sic) {
  const ciks = new Set();
  for (let start = 0; start < 300; start += 100) {
    const xml = await safe(get(`https://www.sec.gov/cgi-bin/browse-edgar?action=getcompany&SIC=${sic}&type=10-K&dateb=&owner=include&start=${start}&count=100&output=atom`, { sec: true }), '');
    const found = [...xml.matchAll(/<cik>(\d+)<\/cik>/g)].map((m) => m[1].padStart(10, '0'));
    found.forEach((c) => ciks.add(c));
    if (found.length < 100) break;
  }
  return ciks;
}

export async function suggest(q) {
  const co = await resolve(q);
  if (!co) return { error: 'not_found' };
  const subs = await safe(subsOf(co.cik));
  const sic = String(subs?.sic || '');
  const sicDesc = subs?.sicDescription || '';
  const out = [];
  const seen = new Set([co.cik]);
  const push = (pc, reason) => { if (pc && !seen.has(pc.cik) && out.length < 8) { seen.add(pc.cik); out.push({ ticker: pc.ticker, name: shortName(pc.title), reason }); } };

  // 1. Named as competitors in the company's own 10-K
  const tk = await latestTenK(co.cik, subs);
  const text = tk ? await safe(get(tk.url, { sec: true }).then(htmlToText), '') : '';
  // A named competitor counts only if its name matches a listed company almost exactly
  // ("Intel" -> Intel Corp, "Amazon" -> Amazon.com), never a loose prefix ("Israel" -> Israel Acquisitions).
  const SUFFIX = new Set(['com', 'technologies', 'technology', 'systems', 'platforms', 'devices', 'networks', 'international', 'industries', 'worldwide', 'global', 'semiconductor', 'software', 'motors', 'brands', 'stores', 'wholesale']);
  const nrm = (x) => x.toLowerCase().replace(/[^a-z0-9& ]/g, ' ').split(/\s+/).filter((t) => t && !['inc', 'corp', 'corporation', 'co', 'company', 'ltd', 'plc', 'llc', 'holdings', 'group', 'the', 'n', 'v', 'nv', 'sa', 'ag', 'se', 'limited', '&'].includes(t));
  for (const n of namedCompetitors(text)) {
    const pc = await safe(resolve(n));
    if (!pc || !/^[A-Z]{1,5}$/.test(pc.ticker)) continue;
    const a = nrm(n), b = nrm(pc.title);
    const exact = a.join(' ') === b.join(' ');
    const near = a.length >= 1 && b.slice(0, a.length).join(' ') === a.join(' ') && b.slice(a.length).every((t) => SUFFIX.has(t));
    if (exact || near) push(pc, 'Named as a competitor in its 10-K');
    if (out.length >= 4) break;
  }
  // 2. Investor peer list, kept only within the same SEC industry group
  if (out.length < 4) {
    const sim = await safe(get(`https://query2.finance.yahoo.com/v6/finance/recommendationsbysymbol/${co.ticker}`, { as: 'json' }));
    for (const sym of sim?.finance?.result?.[0]?.recommendedSymbols?.map((x) => x.symbol) || []) {
      const pc = await safe(resolve(sym));
      if (!pc || seen.has(pc.cik)) continue;
      const ps = await safe(subsOf(pc.cik));
      if (sic && String(ps?.sic || '').slice(0, 2) === sic.slice(0, 2)) push(pc, 'Same industry group, on investor peer lists');
      if (out.length >= 4) break;
    }
  }
  // 3. Largest listed companies with the same SEC industry code
  if (out.length < 4 && sic) {
    const ciks = await sameSic(sic);
    for (const r of await allTickers()) {
      const c = String(r.cik_str).padStart(10, '0');
      if (ciks.has(c)) push({ cik: c, ticker: r.ticker, title: r.title }, `Largest listed peer in SEC industry “${niceName(sicDesc)}”`);
      if (out.length >= 4) break;
    }
  }
  return { subject: { ticker: co.ticker, name: shortName(co.title) }, suggestions: out.slice(0, 4) };
}

export async function resolveOne(q) {
  const co = await resolve(q);
  return co ? { ticker: co.ticker, name: shortName(co.title) } : { error: 'not_found' };
}

// ------------------------------------------------------------------ comparison
export const METRIC_ROWS = [
  ['revenue', 'Revenue (latest FY)', 'high'], ['growth', 'Revenue growth (YoY)', 'high'], ['cagr', 'Revenue CAGR (3-yr)', 'high'],
  ['gross', 'Gross margin', 'high'], ['cogs', 'Cost of revenue, % of revenue', 'low'], ['opm', 'Operating margin', 'high'],
  ['npm', 'Net margin', 'high'], ['rnd', 'R&D, % of revenue', 'none'], ['sga', 'SG&A, % of revenue', 'low'],
  ['capex', 'Capex, % of revenue', 'none'], ['ocf', 'Operating cash flow margin', 'high'], ['cur', 'Current ratio', 'high'],
  ['de', 'Long-term debt to equity', 'low'],
];

const STRATEGY = /\b(strateg|we intend|we plan|we will continue|continue to invest|invest(?:ing|ment)? in|expand|growth|acqui|priorit|focus(?:ed)? on|new markets|roadmap|transform)/i;
const DIFFER = /\b(we believe|competitive advantage|differentiat|competitive strengths?|compete (?:favorably|effectively|primarily|on the basis)|market leader|leading provider|leading position|industry[- ]leading|unique|proprietary|broadest|installed base|brand)/i;
const CUST = /no (?:single|one|individual) customer|(?:customers?|distributors?|dealers?|clients?)[^.]{0,140}(?:accounted|represented|comprised)[^.]{0,80}(?:\d+(?:\.\d+)?\s?%|percent)[^.]{0,60}(?:revenue|sales)|(?:\d+(?:\.\d+)?\s?%|percent) of (?:our )?(?:total |net |consolidated )?(?:revenue|sales)[^.]{0,80}(?:customers?|distributors?|dealers?|clients?)|largest customers?[^.]{0,120}(?:revenue|sales)/i;
const GEO = /(?:revenue|sales)[^.]{0,140}(?:outside (?:of )?the united states|outside the u\.s\.|international|non-u\.s\.|united states|north america|europe|asia|china|emea|apac|americas|latin america|middle east|region)[^.]{0,100}(?:\d+(?:\.\d+)?\s?%|percent)|(?:\d+(?:\.\d+)?\s?%|percent) of (?:our )?(?:total |net |consolidated )?(?:revenue|sales)[^.]{0,120}(?:outside|international|united states|u\.s\.|europe|asia|china|region|countr)/i;
const SHORT = /(?=[^.]*\b(?:we expect|we anticipate|outlook|next (?:fiscal )?year|coming year|near[- ]term|in (?:fiscal )?20(?:2[6-9])|backlog)\b)(?=[^.]*\b(?:demand|sales|revenue|growth|market|margin|volume|orders|pricing)\b)/i;
const LONG = /(?=[^.]*\b(?:long[- ]term|over time|secular|addressable market|market opportunity|future growth|years to come|megatrend|energy transition|digital transformation)\b)(?=[^.]*\b(?:demand|growth|grow|market|opportunit|adoption|trend)\b)/i;
const JUNK = /forward-looking|this annual report|item 1a|incorporated (?:herein )?by reference|table of contents|see note|^\(?\d|\bpage\b|refer to|part ii|statements that|similar (?:statements|expressions)/i;
// Risk-factor phrasing describes what could go wrong, not what sets a company apart.
const RISKY = /\bif we (?:do not|fail|are unable|cannot)|could (?:adversely|harm|be harmed)|may (?:adversely|harm)|failure to|unable to|materially adversely|negatively impact/i;

function pickSentences(sents, re, k, max = 380) {
  const out = [];
  for (const s of sents) {
    if (out.length >= k) break;
    if (!re.test(s) || JUNK.test(s) || !/\b(we|our|the company)\b/i.test(s)) continue;
    if (out.some((o) => o.slice(0, 60) === s.slice(0, 60))) continue;
    out.push(s.length > max ? s.slice(0, max).replace(/\s+\S*$/, '') + '…' : s);
  }
  return out;
}

async function profile(ticker, store) {
  const co = await resolve(ticker);
  if (!co) return { ticker, error: 'not_found' };
  const [subs, facts] = await Promise.all([safe(subsOf(co.cik)), safe(get(`https://data.sec.gov/api/xbrl/companyfacts/CIK${co.cik}.json`, { sec: true, as: 'json' }))]);
  const tk = await latestTenK(co.cik, subs);
  const text = tk ? await safe(get(tk.url, { sec: true }).then(htmlToText), '') : '';
  const sents = text ? sentences(text) : [];
  const cite = (s, label) => store.add({ s: 'SEC EDGAR', ty: '10-K', sec: `${shortName(co.title)} 10-K (${label})`, q: s.replace(/…$/, ''), u: tk?.url || '', pd: tk?.filed, b: `SEC 10-K, ${shortName(co.title)}` });

  const m = {};
  const cell = (d, c, v, formula) => ({ d, c, _v: v, _f: formula });
  const S = {};
  for (const k of ['Revenue', 'COGS', 'GrossProfit', 'OperatingIncome', 'NetIncome', 'RnD', 'SGA', 'SM', 'GA', 'Capex', 'OCF', 'AssetsCurrent', 'LiabilitiesCurrent', 'LongTermDebt', 'Equity']) S[k] = facts ? series(facts, k) : [];
  const rev = S.Revenue;
  let fy = '';
  if (rev.length) {
    const r0 = rev[0], e0 = factEv(store, co.cik, r0); fy = r0.end;
    m.revenue = cell(usd(r0.val), [e0], r0.val);
    if (rev[1]) m.growth = cell(pct(r0.val / rev[1].val - 1), [e0, factEv(store, co.cik, rev[1])], r0.val / rev[1].val - 1, 'e0 / e1 - 1');
    if (rev[3]) { const v = (r0.val / rev[3].val) ** (1 / 3) - 1; m.cagr = cell(pct(v), [e0, factEv(store, co.cik, rev[3])], v, '(e0 / e1) ** (1/3) - 1'); }
    const ratio = (key, f) => { if (f) m[key] = cell(pct(f.val / r0.val), [factEv(store, co.cik, f), e0], f.val / r0.val, 'e0 / e1'); };
    const gp = at(S.GrossProfit, r0.end), cg = at(S.COGS, r0.end);
    if (gp) ratio('gross', gp); else if (cg) m.gross = cell(pct(1 - cg.val / r0.val), [factEv(store, co.cik, cg), e0], 1 - cg.val / r0.val, '1 - e0 / e1');
    ratio('cogs', cg); ratio('opm', at(S.OperatingIncome, r0.end)); ratio('npm', at(S.NetIncome, r0.end)); ratio('rnd', at(S.RnD, r0.end));
    const sga = at(S.SGA, r0.end), sm = at(S.SM, r0.end), ga = at(S.GA, r0.end);
    if (sga) ratio('sga', sga); else if (sm && ga) m.sga = cell(pct((sm.val + ga.val) / r0.val), [factEv(store, co.cik, sm), factEv(store, co.cik, ga), e0], (sm.val + ga.val) / r0.val, '(e0 + e1) / e2');
    ratio('capex', at(S.Capex, r0.end)); ratio('ocf', at(S.OCF, r0.end));
  }
  const ca = S.AssetsCurrent[0], cl = ca && at(S.LiabilitiesCurrent, ca.end);
  if (ca && cl) m.cur = cell(`${(ca.val / cl.val).toFixed(2)}x`, [factEv(store, co.cik, ca), factEv(store, co.cik, cl)], ca.val / cl.val, 'e0 / e1');
  const dt = S.LongTermDebt[0], eq = dt && at(S.Equity, dt.end);
  if (dt && eq && eq.val > 0) m.de = cell(`${(dt.val / eq.val).toFixed(2)}x`, [factEv(store, co.cik, dt), factEv(store, co.cik, eq)], dt.val / eq.val, 'e0 / e1');

  // recent completed deals (8-K Item 2.01, last 3 years)
  const rec = subs?.filings?.recent || {};
  let deal = null;
  for (let i = 0; i < (rec.form || []).length; i++) {
    if (!/^8-K/.test(rec.form[i])) continue;
    if ((Date.now() - new Date(rec.filingDate[i])) / 86400000 > 1095) break;
    if (String(rec.items[i] || '').includes('2.01')) {
      const url = `https://www.sec.gov/Archives/edgar/data/${Number(co.cik)}/${rec.accessionNumber[i].replace(/-/g, '')}/${rec.primaryDocument[i]}`;
      deal = store.add({ s: 'SEC EDGAR', ty: rec.form[i], sec: 'Item 2.01 Completion of acquisition or disposition', q: `${rec.form[i]} filed ${rec.filingDate[i]}: Item 2.01 (Completion of Acquisition or Disposition of Assets)`, u: url, pd: rec.filingDate[i], b: `SEC 8-K, ${rec.filingDate[i]}` });
      break;
    }
  }

  const claims = (arr, label) => arr.map((s) => ({ t: s, c: [cite(s, label)] }));
  const EARNED = /\b(accounted for|represented|derived|generated|comprised|attributable to|from customers)\b/i;
  const custS = pickSentences(sents, CUST, 2), geoS = pickSentences(sents.filter((x) => EARNED.test(x)), GEO, 2);
  const custFlag = custS.some((s) => /no (single|one) customer/i.test(s)) ? 'Diversified: no single customer is material'
    : custS.some((s) => /(\d{2}(?:\.\d+)?)\s?%/.test(s) && /customer|distributor|dealer/i.test(s)) ? 'Notable concentration disclosed' : custS.length ? 'Discussed in the 10-K' : 'Not disclosed in the 10-K text';
  const geoFlag = geoS.length ? 'Regional mix disclosed' : 'Not disclosed in the 10-K text';
  return {
    ticker: co.ticker, name: shortName(co.title), industry: subs?.sicDescription || '', fy, m, deal, has10k: !!text,
    own: claims(pickSentences(sents, STRATEGY, 3, 300), 'strategy'),
    customer: { flag: custFlag, claims: claims(custS, 'customers') },
    geo: { flag: geoFlag, claims: claims(geoS, 'geography') },
    diff: claims(pickSentences(sents.filter((x) => !RISKY.test(x)), DIFFER, 3), 'differentiators'),
    short: claims(pickSentences(sents, SHORT, 2), 'outlook'),
    long: claims(pickSentences(sents, LONG, 2), 'long-term outlook'),
  };
}

const median = (xs) => { const a = xs.filter((x) => Number.isFinite(x)).sort((p, q) => p - q); if (!a.length) return NaN; const h = a.length >> 1; return a.length % 2 ? a[h] : (a[h - 1] + a[h]) / 2; };

/** Number-free comparative read for one company against the group (labelled inference, cites its inputs). */
function numbersRead(p, all) {
  const out = [];
  const val = (x, k) => x.m[k]?._v;
  const rank = (k) => { const vs = all.map((x) => val(x, k)).filter(Number.isFinite).sort((a, b) => b - a); return vs.indexOf(val(p, k)); };
  const cites = (...ks) => [...new Set(ks.flatMap((k) => p.m[k]?.c?.slice(0, 1) || []))];
  const g = val(p, 'growth'), gm = median(all.map((x) => val(x, 'growth')));
  if (Number.isFinite(g) && Number.isFinite(gm) && all.length > 1) {
    const lead = rank('growth') === 0;
    out.push({ t: lead ? `${p.name} is growing fastest in this group, a sign its current strategy is winning share or riding a strong segment.`
      : g > gm ? `${p.name} is growing faster than the group median, so its strategy is gaining traction.`
        : `${p.name} is growing more slowly than the group median, which puts pressure on management to find new growth or defend margin.`, c: cites('growth'), i: 1 });
  }
  const r = val(p, 'rnd'), rm = median(all.map((x) => val(x, 'rnd')));
  const cx = val(p, 'capex'), cxm = median(all.map((x) => val(x, 'capex')));
  const inv = [];
  if (Number.isFinite(r) && Number.isFinite(rm)) inv.push(rank('rnd') === 0 ? 'the heaviest R&D investor in the group' : r > rm ? 'investing more in R&D than the group median' : 'investing less in R&D than the group median');
  if (Number.isFinite(cx) && Number.isFinite(cxm)) inv.push(cx > cxm ? 'spending more on capital projects than peers' : 'more capital-light than peers');
  if (inv.length) out.push({ t: `On investment, it is ${inv.join(' and ')}, which signals whether growth is being bought through innovation, capacity or neither.`, c: cites('rnd', 'capex'), i: 1 });
  const o = val(p, 'opm'), om = median(all.map((x) => val(x, 'opm')));
  if (Number.isFinite(o) && Number.isFinite(om)) out.push({ t: o > om ? 'Its operating margin is above the group median, giving it room to fund expansion from its own cash.' : 'Its operating margin is below the group median, so efficiency is likely as much a priority as growth.', c: cites('opm'), i: 1 });
  if (p.deal) out.push({ t: 'It has reported a completed acquisition or disposal in the past three years (8-K Item 2.01), so M&A is part of its playbook.', c: [p.deal], i: 1 });
  return out;
}

export async function compare(tickers) {
  const store = makeStore();
  const list = [...new Set(tickers.map((t) => t.toUpperCase()))].slice(0, 5);
  const profiles = (await Promise.all(list.map((t) => safe(profile(t, store), { ticker: t, error: 'failed' })))).filter((p) => !p.error);
  if (!profiles.length) return { error: 'not_found' };

  // verification: recompute every metric from its cited raw values; number-check every quoted claim
  const v = { numbers_checked: 0, numbers_verified: 0, metrics_checked: 0, metrics_verified: 0, claims_dropped: 0 };
  const raw = (id) => store.ev[id]?.raw?.val;
  for (const p of profiles) for (const [k, c] of Object.entries(p.m)) {
    v.metrics_checked++;
    const env = c.c.map(raw);
    const expected = c._f ? Function('e0', 'e1', 'e2', `return ${c._f};`)(...env) : env[0];
    if (Number.isFinite(expected) && close(c._v, expected, 1e-6)) v.metrics_verified++; else p.m[k] = { d: UNAVAILABLE, c: [] };
  }
  const best = {};
  for (const [key, , dir] of METRIC_ROWS) {
    if (dir === 'none') continue;
    const vs = profiles.map((p) => p.m[key]?._v).filter(Number.isFinite);
    if (vs.length > 1) best[key] = dir === 'high' ? Math.max(...vs) : Math.min(...vs);
  }
  for (const p of profiles) {
    p.nums = numbersRead(p, profiles);
    for (const [key] of METRIC_ROWS) if (p.m[key] && Number.isFinite(p.m[key]._v) && p.m[key]._v === best[key]) p.m[key].best = 1;
  }
  const cands = (ids) => ids.flatMap((id) => { const e = store.ev[id]; return e ? [...numbers(e.q).map((x) => x[0]), ...(e.raw?.val !== undefined ? [e.raw.val] : [])] : []; });
  const check = (arr) => arr.filter((c) => {
    const cs = cands(c.c);
    for (const [val, isP] of numbers(c.t)) { v.numbers_checked++; if (supported(val, isP, cs)) v.numbers_verified++; else { v.claims_dropped++; return false; } }
    return true;
  });
  for (const p of profiles) {
    p.own = check(p.own); p.nums = check(p.nums); p.diff = check(p.diff); p.short = check(p.short); p.long = check(p.long);
    p.customer.claims = check(p.customer.claims); p.geo.claims = check(p.geo.claims);
    for (const c of Object.values(p.m)) { delete c._v; delete c._f; }
  }
  const used = new Set();
  const walk = (x) => { if (Array.isArray(x)) x.forEach(walk); else if (x && typeof x === 'object') { if (Array.isArray(x.c)) x.c.forEach((id) => used.add(id)); if (typeof x.deal === 'string') used.add(x.deal); Object.values(x).forEach(walk); } };
  walk(profiles);
  return {
    generated: new Date().toISOString().slice(0, 10), rows: METRIC_ROWS.map(([key, label, dir]) => ({ key, label, dir })),
    companies: profiles, verification: v,
    evidence: Object.fromEntries(Object.entries(store.ev).filter(([id]) => used.has(id)).map(([id, e]) => [id, { s: e.s, ty: e.ty, sec: e.sec, q: e.q, u: e.u, pd: e.pd, fd: e.fd, b: e.b }])),
  };
}

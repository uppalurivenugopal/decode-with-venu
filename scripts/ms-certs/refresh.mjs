// =====================================================================
// Monthly refresh for the Microsoft Certification Path page.
//
// Runs on GitHub Actions (.github/workflows/ms-certs-monthly.yml) on the
// 1st of every month. It reads Microsoft Learn — the same live list that
// powers learn.microsoft.com/credentials/browse — and rewrites
// src/data/ms-certifications.refresh.json with:
//   • every active certification, its exam code, page and level
//   • beta status and any scheduled retirement date
//   • the official "skills measured" outline from each study guide
//   • the Last refreshed / Next refresh dates shown on the page
// The page merges this file with the hand-written data in
// src/data/ms-certifications.js, so new certifications appear and retired
// ones disappear without anyone editing code.
//
// Safety: if Microsoft Learn returns far fewer certifications than last
// time (an outage or a blocked request), the script refuses to write, the
// workflow fails, and the live page stays as it was ("stale but safe").
//
// Run locally:  node scripts/ms-certs/refresh.mjs
// =====================================================================

import fs from 'node:fs';

const LEARN = 'https://learn.microsoft.com';
const OUT = 'src/data/ms-certifications.refresh.json';
const REPORT = process.env.MS_CERTS_REPORT || '/tmp/ms-certs-report.md';

// ---------- small helpers ----------

// Fetch a URL as text, retrying twice on network hiccups.
async function getText(url) {
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const r = await fetch(url, { headers: { 'User-Agent': 'decodewithvenu-cert-refresh (+https://www.decodewithvenu.com)' } });
      if (r.status === 404) return null;                       // page genuinely doesn't exist
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      return await r.text();
    } catch (e) {
      if (attempt === 3) throw new Error(`${url}: ${e.message}`);
      await new Promise((ok) => setTimeout(ok, 1500 * attempt));
    }
  }
}

// Run fn over items, a few at a time, so we're polite to Microsoft's servers.
async function mapLimit(items, limit, fn) {
  const out = new Array(items.length);
  let next = 0;
  async function worker() {
    while (next < items.length) { const i = next++; out[i] = await fn(items[i], i); }
  }
  await Promise.all(Array.from({ length: limit }, worker));
  return out;
}

// "November 30, 2026" → "2026-11-30"
function isoDate(text) {
  const d = new Date(text + ' 12:00 UTC');
  return isNaN(d) ? null : d.toISOString().slice(0, 10);
}

// ---------- 1. the live list of certifications ----------

// The search API behind learn.microsoft.com/credentials/browse (30 per page).
async function liveList() {
  const base = `${LEARN}/api/contentbrowser/search/credentials?locale=en-us` +
    `&%24filter=(credential_types%2Fany(c%3A%20c%20eq%20%27certification%27))&%24orderBy=title&%24top=30&fuzzySearch=false`;
  let all = [], skip = 0, count = Infinity;
  while (skip < count) {
    const j = JSON.parse(await getText(`${base}&%24skip=${skip}`));
    count = j.count;
    all = all.concat(j.results || []);
    if (!j.results || !j.results.length) break;
    skip += 30;
  }
  // Office Specialist and Certified Educator are a separate (Certiport) programme — out of scope.
  return all.filter((x) => !x.hidden && !/Office Specialist|Certified Educator/i.test(x.title));
}

// ---------- 2. each certification's own exam code ----------

// Best source: the page's own "Schedule through Pearson VUE" button, whose link
// carries the exam id (…?examUid=exam.AZ-104…). Fallback: the first code under
// the "Certification exam(s)" heading.
async function examCode(slug) {
  const html = await getText(`${LEARN}/en-us/credentials/certifications/${slug}/`);
  if (!html) return { code: null };
  const uid = (html.match(/examUid=exam\.([A-Z]{2}-\d{3})/i) || [])[1];
  const at = html.search(/Certification exam/i);
  const scope = at >= 0 ? html.slice(at, at + 4000) : html;
  const code = (uid || (scope.match(/\b([A-Z]{2}-\d{3})\b/) || [])[1] || '').toUpperCase() || null;
  const retireText = (html.match(/will retire on ([A-Z][a-z]+ \d{1,2}, \d{4})/) || [])[1];
  return { code, retire: retireText ? isoDate(retireText) : null };
}

// ---------- 3. Microsoft's retirement schedule ----------

async function retirementSchedule() {
  const md = (await getText(`${LEARN}/en-us/credentials/support/retired-certification-exams?accept=text/markdown`)) || '';
  const section = (title) => {
    const a = md.indexOf(title);
    if (a < 0) return '';
    const b = md.indexOf('\n## ', a + title.length);
    return md.slice(a, b < 0 ? undefined : b);
  };
  const rows = (text) => [...text.matchAll(/^\|\s*\[([A-Z]{2}-\d{3})\][^|]*\|\s*([^|]+?)\s*\|\s*([A-Z][a-z]+ \d{1,2}, \d{4})\s*\|/gm)]
    .map((m) => ({ code: m[1], name: m[2].replace(/^(Microsoft 365 Certified|Microsoft Certified|GitHub Certified):\s*/, ''), date: isoDate(m[3]) }));
  return { scheduled: rows(section('## Exams scheduled to retire')), recent: rows(section('## Recently retired exams')) };
}

// ---------- 4. the official skills outline ----------

// From "Study guide for Exam XX-NNN": the "Skills at a glance" domains with
// their % weights, plus the task headings inside each domain.
async function skills(code) {
  const md = await getText(`${LEARN}/en-us/credentials/certifications/resources/study-guides/${code.toLowerCase()}?accept=text/markdown`);
  if (!md) return null;
  const text = md.replace(/\r/g, '');
  const at = text.indexOf('Skills at a glance');
  if (at < 0) return null;
  const glance = (text.slice(at).split('\n\n')[1] || '').split('\n')
    .filter((l) => l.startsWith('- '))
    .map((l) => l.slice(2).trim())
    .map((l) => { const m = l.match(/^(.*?)\s*\((\d+)\s*[–-]\s*(\d+)%\)$/); return m ? [m[1], `${m[2]}–${m[3]}`] : null; })
    .filter(Boolean);
  if (!glance.length) return null;
  const blocks = text.split(/\n### /).slice(1);
  // Match each domain to its own section by the full heading (minus the % weight) —
  // not a prefix, because some domains share a start ("Develop by using AL" vs "… AL objects").
  const heading = (b) => b.split('\n')[0].replace(/\s*\([^)]*%\)\s*$/, '').trim();
  return glance.map(([name, weight]) => {
    const block = blocks.find((b) => heading(b) === name);
    const subs = block ? [...block.matchAll(/\n#### (.*)/g)].map((m) => m[1].trim()) : [];
    return [name, weight, subs];
  });
}

// ---------- put it together ----------

export async function collect(log = console.log) {
  const list = await liveList();
  log(`Live certifications in scope: ${list.length}`);
  const details = await mapLimit(list, 6, async (x) => {
    const slug = x.url.split('/').filter(Boolean).pop();
    const { code, retire } = await examCode(slug);
    return {
      code, slug,
      title: x.title.replace(/^(Microsoft 365 Certified|Microsoft Certified|GitHub Certified):\s*/, '').replace(/\s*\(beta\)\s*$/i, ''),
      beta: /\(beta\)/i.test(x.title),
      level: (x.display_levels || [])[0] || null,
      types: (x.display_credential_types || []).filter(Boolean),
      roles: (x.display_roles || []).join(', '),
      retire,
    };
  });
  const sched = await retirementSchedule();
  log(`Retirement schedule: ${sched.scheduled.length} scheduled, ${sched.recent.length} recently retired`);
  const certs = details.filter((d) => d.code);
  const withSkills = await mapLimit(certs, 6, async (c) => ({ ...c, skills: await skills(c.code) }));
  for (const c of withSkills) {                                  // retirement page date wins if the cert page lacks one
    const s = sched.scheduled.find((r) => r.code === c.code);
    if (!c.retire && s) c.retire = s.date;
  }
  return { certs: withSkills.sort((a, b) => a.code.localeCompare(b.code)), unmatched: details.filter((d) => !d.code).map((d) => d.title), retirements: sched };
}

// First day of the month after `date` → the next scheduled run.
function firstOfNextMonth(date) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 1)).toISOString().slice(0, 10);
}

async function main() {
  const prev = fs.existsSync(OUT) ? JSON.parse(fs.readFileSync(OUT, 'utf8')) : null;
  const result = await collect();

  // ---- safety checks: refuse to publish a broken refresh ----
  const prevCount = prev ? prev.certs.length : 0;
  if (result.certs.length < 30 || result.certs.length < 0.6 * prevCount) {
    throw new Error(`Only ${result.certs.length} certifications found (last run: ${prevCount}). Not writing — looks like a fetch problem.`);
  }
  const noSkills = result.certs.filter((c) => !c.skills).map((c) => c.code);
  if (noSkills.length > result.certs.length * 0.25) {
    throw new Error(`${noSkills.length} certifications had no readable skills outline. Not writing.`);
  }

  // ---- keep the date each certification was first seen (drives the "New" label) ----
  const today = new Date();
  const todayIso = today.toISOString().slice(0, 10);
  const firstSeen = Object.fromEntries((prev?.certs || []).map((c) => [c.code, c.firstSeen]));
  for (const c of result.certs) c.firstSeen = firstSeen[c.code] || todayIso;

  const out = {
    lastRefreshed: todayIso,
    nextRefresh: firstOfNextMonth(today),
    baseline: prev?.baseline || todayIso,   // date of the very first run; "New" labels count from after it
    source: 'Microsoft Learn: credentials browse API, certification pages, study guides, retirement schedule',
    certs: result.certs,
    retirements: result.retirements,
  };
  fs.writeFileSync(OUT, JSON.stringify(out, null, 1) + '\n');

  // ---- a short report of what changed, used for a GitHub issue ----
  const before = new Map((prev?.certs || []).map((c) => [c.code, c]));
  const after = new Map(result.certs.map((c) => [c.code, c]));
  const lines = [];
  for (const c of result.certs) if (!before.has(c.code)) lines.push(`- **New:** ${c.code} · ${c.title}${c.beta ? ' (beta)' : ''}`);
  for (const c of before.values()) if (!after.has(c.code)) lines.push(`- **Gone from Microsoft Learn:** ${c.code} · ${c.title}`);
  for (const c of result.certs) {
    const p = before.get(c.code);
    if (p && c.retire && c.retire !== p.retire) lines.push(`- **Retirement announced:** ${c.code} · ${c.title} — ${c.retire}`);
    if (p && p.beta && !c.beta) lines.push(`- **Out of beta:** ${c.code} · ${c.title}`);
    if (p && JSON.stringify(p.skills) !== JSON.stringify(c.skills)) lines.push(`- **Skills outline updated:** ${c.code} · ${c.title}`);
  }
  if (result.unmatched.length) lines.push(`- **Couldn't find an exam code for:** ${result.unmatched.join('; ')}`);
  const report = lines.length
    ? `The monthly refresh on ${todayIso} found these changes. The page already shows them; new certifications need a quick editorial pass (value notes, decision-tree placement, partner credit) in \`src/data/ms-certifications.js\`.\n\n${lines.join('\n')}\n`
    : '';
  fs.writeFileSync(REPORT, report);
  console.log(report || 'No catalogue changes this month (dates refreshed).');
}

// Only run main() when executed directly, not when imported.
if (process.argv[1] && import.meta.url === new URL(`file://${process.argv[1]}`).href) {
  main().catch((e) => { console.error(e.message); process.exit(1); });
}

// PRYSM report export: Word (.docx, built in the browser) and PDF (print-ready document → "Save as PDF").
// Both carry the AI-generated-content disclaimer and a numbered sources appendix, so every [n]
// in the text can be traced back to its public source.
import {
  AlignmentType, BorderStyle, Document, ExternalHyperlink, HeadingLevel, Packer, Paragraph, ShadingType,
  Table, TableCell, TableRow, TextRun, WidthType,
} from 'docx';

type Cl = { t: string; c: string[]; i?: number };
type Met = { l: string; d: string; p: string; c: string[] };
export type ExportData = {
  company: { name: string; ticker: string; industry: string };
  generated: string; mode: string;
  verification: { numbers_checked: number; numbers_verified: number; metrics_checked: number; metrics_verified: number };
  about: { claims: Cl[]; facts: { l: string; v: string; c: string[] }[]; regions: { n: string; d: string; c: string[] }[] };
  kpis: Met[];
  plays: { o: string; cat: string; conf: string; why: Cl[]; pain: Cl[]; talk: Cl[]; roles: string[]; q: string[] }[];
  lines: { l: string; v: Met; yoy: Met | null; share: Met | null; shift: Met | null; a: string; drv: Cl[]; angle: { o: string; r: Cl } | null }[];
  peers: { n: string; t: string; rel: string; threat: string; m: { v: string; c: string[] }[]; moves: { k: string; d: string; dt: string; c: string[] }[]; imp: Cl[] }[];
  trends: { t: string; k: string; mom: string; imp: Cl[]; use: Cl[]; rel: Cl[] }[];
  signals: { k: string; d: string; dt: string; c: string[] }[];
  evidence: Record<string, { s: string; ty: string; sec: string; u: string; pd: string | null; b: string }>;
  comparison?: {
    rows: { key: string; label: string }[];
    companies: { name: string; ticker: string; fy: string; m: Record<string, { d: string; c: string[] }>; own: Cl[]; nums: Cl[];
      customer: { flag: string; claims: Cl[] }; geo: { flag: string; claims: Cl[] }; diff: Cl[]; short: Cl[]; long: Cl[] }[];
  };
};

export const DISCLAIMER =
  'AI-generated content. This report was produced automatically by AI research agents from public sources and may contain errors, ' +
  'omissions or out-of-date information. Check important facts against the cited sources before you rely on them. ' +
  'Not financial, investment or legal advice. No affiliation with the companies shown.';

// ---------------------------------------------------------------- shared document model
type Block =
  | { k: 'h1' | 'h2' | 'h3' | 'p' | 'note'; text: string }
  | { k: 'bullets'; items: string[] }
  | { k: 'table'; head: string[]; rows: string[][] };

function model(d: ExportData, num: (id: string) => number): Block[] {
  const refs = (ids: string[] = []) => {
    const ns = [...new Set(ids.map(num).filter(Boolean))];
    return ns.length ? ` [${ns.join(', ')}]` : '';
  };
  const c = (x: Cl) => `${x.i ? 'Inference: ' : ''}${x.t}${refs(x.c)}`;
  const B: Block[] = [];
  B.push({ k: 'h1', text: `${d.company.name}: account deep dive` });
  B.push({ k: 'p', text: [d.company.ticker, d.company.industry, `Generated ${d.generated}`, d.mode === 'live' ? 'PRYSM Live' : 'PRYSM sample'].filter(Boolean).join(' · ') });
  B.push({ k: 'note', text: DISCLAIMER });
  B.push({ k: 'p', text: `Verification: ${d.verification.numbers_verified}/${d.verification.numbers_checked} numbers in sentences matched to their source; ${d.verification.metrics_verified}/${d.verification.metrics_checked} financial metrics recomputed from raw data. Numbers in [ ] refer to the sources list at the end.` });

  B.push({ k: 'h2', text: 'About the company' });
  if (d.about.claims.length) B.push({ k: 'bullets', items: d.about.claims.map(c) });
  if (d.about.facts.length) B.push({ k: 'table', head: ['Fact', 'Value'], rows: d.about.facts.map((f) => [f.l, f.v + refs(f.c)]) });
  if (d.about.regions.length) B.push({ k: 'p', text: 'Where it operates: ' + d.about.regions.map((r) => `${r.n} (${r.d})${refs(r.c)}`).join('; ') });

  if (d.kpis.length) {
    B.push({ k: 'h2', text: 'Key numbers' });
    B.push({ k: 'table', head: ['Metric', 'Value', 'Period'], rows: d.kpis.map((k) => [k.l, k.d + refs(k.c), k.p]) });
  }

  if (d.plays.length) {
    B.push({ k: 'h2', text: 'Sales plays' });
    d.plays.forEach((p, i) => {
      B.push({ k: 'h3', text: `${i + 1}. ${p.o} (${p.conf} confidence)` });
      B.push({ k: 'p', text: 'Why now:' }); B.push({ k: 'bullets', items: p.why.map(c) });
      if (p.pain.length) { B.push({ k: 'p', text: 'Pain point:' }); B.push({ k: 'bullets', items: p.pain.map(c) }); }
      B.push({ k: 'p', text: 'Talking point:' }); B.push({ k: 'bullets', items: p.talk.map(c) });
      B.push({ k: 'p', text: `Who to target: ${p.roles.join(', ')}` });
      B.push({ k: 'p', text: 'Ask in discovery:' }); B.push({ k: 'bullets', items: p.q });
    });
  }

  if (d.lines.length) {
    B.push({ k: 'h2', text: 'Financial drivers' });
    B.push({ k: 'table', head: ['Line item', 'FY value', 'YoY', '% of revenue', 'Shift', 'Read', 'Sales angle'],
      rows: d.lines.map((l) => [l.l, l.v.d + refs(l.v.c), l.yoy?.d ?? '—', l.share?.d ?? '—', l.shift?.d ?? '—', l.a, l.angle?.o ?? '—']) });
    d.lines.filter((l) => l.drv.length || l.angle).forEach((l) => {
      B.push({ k: 'h3', text: l.l });
      if (l.drv.length) B.push({ k: 'bullets', items: l.drv.map((x) => `Driver (management): ${x.t}${refs(x.c)}`) });
      if (l.angle) B.push({ k: 'bullets', items: [c(l.angle.r)] });
    });
  }

  if (d.peers.length) {
    B.push({ k: 'h2', text: 'Peers and what their moves mean' });
    B.push({ k: 'table', head: ['Peer', 'Relationship', 'Revenue', 'Growth', 'Op. margin', 'R&D %', 'Threat'],
      rows: d.peers.map((p) => [`${p.n} (${p.t})`, p.rel, ...p.m.slice(0, 4).map((x) => x.v + refs(x.c)), p.threat]) });
    d.peers.forEach((p) => {
      if (!p.moves.length && !p.imp.length) return;
      B.push({ k: 'h3', text: p.n });
      if (p.moves.length) B.push({ k: 'bullets', items: p.moves.map((m) => `${m.k} (${m.dt}): ${m.d}${refs(m.c)}`) });
      if (p.imp.length) B.push({ k: 'bullets', items: p.imp.map(c) });
    });
  }

  if (d.comparison?.companies.length) {
    const cmp = d.comparison;
    const para = (cs: Cl[]) => (cs.length ? cs.map(c).join(' ') : 'Not disclosed in the latest 10-K text.');
    B.push({ k: 'h2', text: 'Competitor comparison' });
    B.push({ k: 'p', text: `${cmp.companies.map((x) => x.name).join(' vs. ')}. Financials from SEC XBRL (latest fiscal year per company); text quoted from each company's latest 10-K.` });
    B.push({ k: 'table', head: ['Indicator', ...cmp.companies.map((x) => `${x.name} (FY ${x.fy.slice(0, 4)})`)],
      rows: cmp.rows.map((r) => [r.label, ...cmp.companies.map((x) => (x.m[r.key] ? x.m[r.key].d + refs(x.m[r.key].c) : '—'))]) });
    B.push({ k: 'h3', text: 'Growth strategy' });
    cmp.companies.forEach((x) => B.push({ k: 'bullets', items: [`${x.name}, in its own words: ${para(x.own)}`, `${x.name}, what the numbers say: ${para(x.nums)}`] }));
    B.push({ k: 'h3', text: 'Customer and geographic concentration' });
    cmp.companies.forEach((x) => B.push({ k: 'bullets', items: [`${x.name}, customers (${x.customer.flag}): ${para(x.customer.claims)}`, `${x.name}, geography (${x.geo.flag}): ${para(x.geo.claims)}`] }));
    B.push({ k: 'h3', text: 'Key differentiators' });
    cmp.companies.forEach((x) => B.push({ k: 'bullets', items: [`${x.name}: ${para(x.diff)}`] }));
    B.push({ k: 'h3', text: 'Market outlook' });
    cmp.companies.forEach((x) => B.push({ k: 'bullets', items: [`${x.name}, short term: ${para(x.short)}`, `${x.name}, long term: ${para(x.long)}`] }));
  }

  if (d.trends.length) {
    B.push({ k: 'h2', text: 'Industry shifts' });
    d.trends.forEach((t) => {
      B.push({ k: 'h3', text: `${t.t} (${t.k === 'AI' ? 'AI shift' : 'market shift'}, ${t.mom} momentum)` });
      const items = [...t.imp.map((x) => `Impact: ${c(x)}`), ...t.use.map((x) => `Use case: ${c(x)}`), ...t.rel.map(c)];
      if (items.length) B.push({ k: 'bullets', items });
    });
  }

  if (d.signals.length) {
    B.push({ k: 'h2', text: 'Buying signals' });
    B.push({ k: 'bullets', items: d.signals.map((s) => `${s.dt} · ${s.k}: ${s.d}${refs(s.c)}`) });
  }

  B.push({ k: 'h2', text: 'Sources' });
  const ids = Object.keys(d.evidence).filter((id) => num(id)).sort((a, b) => num(a) - num(b));
  B.push({ k: 'bullets', items: ids.map((id) => { const e = d.evidence[id]; return `[${num(id)}] ${e.b}. ${e.s}${e.sec ? `, ${e.sec}` : ''}${e.pd ? ` (${e.pd})` : ''}. ${e.u}`; }) });
  B.push({ k: 'note', text: DISCLAIMER });
  return B;
}

const fileBase = (d: ExportData) => `PRYSM_${d.company.name.replace(/[^\w]+/g, '_').replace(/_+$/, '')}_${d.generated}`;
function download(blob: Blob, name: string) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob); a.download = name;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 4000);
}

// ---------------------------------------------------------------- Word
export async function exportWord(d: ExportData, num: (id: string) => number) {
  const ink = '13283C', accent = '0E8297';
  const cellBorder = { style: BorderStyle.SINGLE, size: 4, color: 'D5DFEB' };
  const children: (Paragraph | Table)[] = [];
  const urlRe = /(https?:\/\/\S+)$/;
  for (const b of model(d, num)) {
    if (b.k === 'h1') children.push(new Paragraph({ heading: HeadingLevel.TITLE, children: [new TextRun({ text: b.text, bold: true, color: ink, size: 40 })] }));
    else if (b.k === 'h2') children.push(new Paragraph({ heading: HeadingLevel.HEADING_1, spacing: { before: 320, after: 120 }, children: [new TextRun({ text: b.text, bold: true, color: ink, size: 30 })] }));
    else if (b.k === 'h3') children.push(new Paragraph({ heading: HeadingLevel.HEADING_2, spacing: { before: 200, after: 80 }, children: [new TextRun({ text: b.text, bold: true, color: accent, size: 24 })] }));
    else if (b.k === 'p') children.push(new Paragraph({ spacing: { after: 80 }, children: [new TextRun({ text: b.text, size: 21 })] }));
    else if (b.k === 'note') children.push(new Paragraph({
      spacing: { before: 120, after: 160 }, shading: { type: ShadingType.CLEAR, fill: 'FFF4E5', color: 'auto' },
      border: { left: { style: BorderStyle.SINGLE, size: 18, color: 'D68C14' } },
      children: [new TextRun({ text: b.text, italics: true, size: 19, color: '6B4A06' })] }));
    else if (b.k === 'bullets') b.items.forEach((t) => {
      const m = t.match(urlRe);
      children.push(new Paragraph({ bullet: { level: 0 }, spacing: { after: 60 }, children: m
        ? [new TextRun({ text: t.slice(0, m.index), size: 19 }), new ExternalHyperlink({ link: m[1], children: [new TextRun({ text: m[1], style: 'Hyperlink', size: 17 })] })]
        : [new TextRun({ text: t, size: 20 })] }));
    });
    else if (b.k === 'table') children.push(new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [b.head, ...b.rows].map((r, i) => new TableRow({ tableHeader: i === 0, children: r.map((v) => new TableCell({
        shading: i === 0 ? { type: ShadingType.CLEAR, fill: '07161A', color: 'auto' } : undefined,
        borders: { top: cellBorder, bottom: cellBorder, left: cellBorder, right: cellBorder },
        children: [new Paragraph({ children: [new TextRun({ text: v, bold: i === 0, color: i === 0 ? 'E8FBFC' : ink, size: i === 0 ? 18 : 18 })] })],
      })) })),
    }), new Paragraph({ text: '' }));
  }
  const doc = new Document({
    creator: 'PRYSM · decodewithvenu.com', title: `${d.company.name}: account deep dive`, description: DISCLAIMER,
    styles: { default: { document: { run: { font: 'Calibri' } } } },
    sections: [{
      headers: undefined,
      children: [new Paragraph({ alignment: AlignmentType.LEFT, children: [new TextRun({ text: 'PRYSM', bold: true, color: accent, size: 20, characterSpacing: 60 })] }), ...children],
    }],
  });
  download(await Packer.toBlob(doc), `${fileBase(d)}.docx`);
}

// ---------------------------------------------------------------- PDF (print-ready document)
export function exportPdf(d: ExportData, num: (id: string) => number) {
  const esc = (s: string) => s.replace(/[&<>"]/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[ch]!));
  const linkify = (s: string) => esc(s).replace(/(https?:\/\/[^\s<]+)$/, '<a href="$1">$1</a>');
  const html = model(d, num).map((b) => {
    if (b.k === 'h1') return `<h1>${esc(b.text)}</h1>`;
    if (b.k === 'h2') return `<h2>${esc(b.text)}</h2>`;
    if (b.k === 'h3') return `<h3>${esc(b.text)}</h3>`;
    if (b.k === 'p') return `<p>${esc(b.text)}</p>`;
    if (b.k === 'note') return `<p class="note">${esc(b.text)}</p>`;
    if (b.k === 'bullets') return `<ul>${b.items.map((t) => `<li>${linkify(t)}</li>`).join('')}</ul>`;
    return `<table><thead><tr>${b.head.map((h) => `<th>${esc(h)}</th>`).join('')}</tr></thead><tbody>${b.rows.map((r) => `<tr>${r.map((v) => `<td>${esc(v)}</td>`).join('')}</tr>`).join('')}</tbody></table>`;
  }).join('\n');
  const doc = `<!doctype html><html><head><meta charset="utf-8"><title>${esc(fileBase(d))}</title><style>
    @page { margin: 16mm 14mm; }
    body { font-family: "DM Sans", Calibri, Arial, sans-serif; color: #13283c; font-size: 10.5pt; line-height: 1.45; }
    .brand { font-weight: 800; letter-spacing: .2em; color: #0e8297; font-size: 9pt; }
    h1 { font-family: "Source Serif 4", Georgia, serif; font-size: 22pt; margin: 4px 0 6px; }
    h2 { font-family: "Source Serif 4", Georgia, serif; font-size: 15pt; margin: 18px 0 6px; border-bottom: 2px solid #13283c; padding-bottom: 3px; break-after: avoid; }
    h3 { font-size: 11pt; color: #0e8297; margin: 12px 0 4px; break-after: avoid; }
    p { margin: 4px 0; } ul { margin: 4px 0 8px 18px; padding: 0; } li { margin: 2px 0; }
    .note { background: #fff4e5; border-left: 4px solid #d68c14; padding: 8px 10px; font-style: italic; color: #6b4a06; margin: 10px 0; }
    table { width: 100%; border-collapse: collapse; margin: 6px 0 10px; font-size: 9pt; break-inside: auto; }
    th { background: #07161a; color: #e8fbfc; text-align: left; padding: 5px 6px; } td { border-bottom: 1px solid #d5dfeb; padding: 4px 6px; vertical-align: top; }
    tr { break-inside: avoid; } a { color: #0e8297; word-break: break-all; }
    * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  </style></head><body><div class="brand">PRYSM</div>${html}</body></html>`;
  const frame = document.createElement('iframe');
  frame.style.cssText = 'position:fixed;right:0;bottom:0;width:0;height:0;border:0;';
  document.body.appendChild(frame);
  const w = frame.contentWindow!;
  w.document.open(); w.document.write(doc); w.document.close();
  setTimeout(() => { w.focus(); w.print(); setTimeout(() => frame.remove(), 1500); }, 300);
}

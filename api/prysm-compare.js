// Vercel serverless function: competitor scan for PRYSM Live.
//   GET /api/prysm-compare?suggest=CAT          -> 4 nearest competitors (with the reason for each)
//   GET /api/prysm-compare?resolve=Komatsu      -> resolve a user-added company to an SEC filer
//   GET /api/prysm-compare?tickers=CAT,DE,CMI   -> side-by-side comparison (subject first, max 5)
// Edge-cached for 6 hours per query.
import { compare, resolveOne, suggest } from './_prysm/compare.js';

const OK = /^[\p{L}\p{N} .,&'()-]+$/u;

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'method_not_allowed' });
  const q = req.query || {};
  try {
    let out;
    if (q.suggest) {
      const s = String(q.suggest).trim().slice(0, 80);
      if (!OK.test(s)) return res.status(400).json({ error: 'bad_query' });
      out = await suggest(s);
    } else if (q.resolve) {
      const s = String(q.resolve).trim().slice(0, 80);
      if (!OK.test(s)) return res.status(400).json({ error: 'bad_query' });
      out = await resolveOne(s);
    } else if (q.tickers) {
      const list = String(q.tickers).split(',').map((t) => t.trim()).filter((t) => /^[A-Za-z.\-]{1,10}$/.test(t)).slice(0, 5);
      if (!list.length) return res.status(400).json({ error: 'bad_query' });
      out = await compare(list);
    } else return res.status(400).json({ error: 'bad_query' });
    res.setHeader('Cache-Control', out.error ? 'public, s-maxage=3600' : 'public, s-maxage=21600, stale-while-revalidate=86400');
    return res.status(out.error ? 404 : 200).json(out);
  } catch (e) {
    return res.status(502).json({ error: 'upstream', detail: String(e?.message || e).slice(0, 200) });
  }
}

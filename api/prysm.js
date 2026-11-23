// Vercel serverless function: GET /api/prysm?q=<company name or ticker>
// Runs the lightweight PRYSM Live engine. Responses are cached at the edge for 6 hours per query
// (stale-while-revalidate for a day) so repeat searches are instant and the SEC isn't hit repeatedly.
import { deepDive } from './_prysm/engine.js';

export default async function handler(req, res) {
  const q = String(req.query?.q || '').trim().slice(0, 80);
  if (req.method !== 'GET') return res.status(405).json({ error: 'method_not_allowed' });
  if (!q || !/^[\p{L}\p{N} .,&'()-]+$/u.test(q)) return res.status(400).json({ error: 'bad_query' });
  try {
    const report = await deepDive(q);
    if (report.error) {
      res.setHeader('Cache-Control', 'public, s-maxage=3600');
      return res.status(404).json(report);
    }
    res.setHeader('Cache-Control', 'public, s-maxage=21600, stale-while-revalidate=86400');
    return res.status(200).json(report);
  } catch (e) {
    return res.status(502).json({ error: 'upstream', detail: String(e?.message || e).slice(0, 200) });
  }
}

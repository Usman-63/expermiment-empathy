/**
 * Catch-all stub for backend endpoints not implemented in this standalone deployment.
 * Returns a successful empty response so the frontend can navigate without crashing.
 */
export default function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  if (req.method === "OPTIONS") return res.status(204).end();
  return res.status(200).json({ ok: true, stub: true });
}

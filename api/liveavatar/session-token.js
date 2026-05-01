/**
 * Vercel serverless function — POST /api/liveavatar/session-token
 * Exchanges HeyGen API key for a short-lived LiveAvatar session token.
 * Keeps the API key server-side (never exposed to the browser).
 */

const HEYGEN_API_BASE = "https://api.heygen.com";

export default async function handler(req, res) {
  // CORS headers for local dev
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(204).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const apiKey = process.env.VITE_LIVEAVATAR_API_KEY || process.env.HEYGEN_API_KEY;
  if (!apiKey) {
    console.error("[session-token] Missing VITE_LIVEAVATAR_API_KEY env var");
    return res.status(500).json({ error: "Server configuration error: missing API key" });
  }

  let body = {};
  if (req.body) {
    body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
  }

  const {
    avatar_id,
    is_sandbox = false,
    mode = "FULL",
    voice_id,
    context_id,
    language = "en",
    dynamic_variables = {},
  } = body;

  try {
    const heygenRes = await fetch(`${HEYGEN_API_BASE}/v1/streaming.create_token`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Api-Key": apiKey,
      },
      body: JSON.stringify({
        avatar_id,
        is_sandbox,
        mode,
        voice_id,
        context_id,
        language,
        dynamic_variables,
      }),
    });

    const data = await heygenRes.json().catch(() => ({}));

    if (!heygenRes.ok) {
      console.error("[session-token] HeyGen error:", heygenRes.status, data);
      return res.status(heygenRes.status).json({
        error: data?.message || data?.error || "HeyGen token creation failed",
        details: data,
      });
    }

    // HeyGen returns { data: { session_token: "..." } }
    const session_token = data?.data?.session_token || data?.session_token;
    if (!session_token) {
      console.error("[session-token] No session_token in response:", data);
      return res.status(502).json({ error: "Invalid response from HeyGen", details: data });
    }

    return res.status(200).json({ session_token });
  } catch (err) {
    console.error("[session-token] Fetch failed:", err);
    return res.status(500).json({ error: err.message || "Internal server error" });
  }
}

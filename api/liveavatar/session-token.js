/**
 * Vercel serverless function — POST /api/liveavatar/session-token
 * Creates a LiveAvatar session and returns the session_token.
 */

const LIVEAVATAR_API_BASE = "https://api.liveavatar.com";

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const apiKey = process.env.VITE_LIVEAVATAR_API_KEY || process.env.HEYGEN_API_KEY;
  if (!apiKey) {
    console.error("[session-token] Missing VITE_LIVEAVATAR_API_KEY");
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

  const reqBody = {
    mode,
    avatar_id,
    is_sandbox,
  };

  if (mode === "FULL") {
    const persona = { language };
    if (context_id) persona.context_id = context_id;
    if (voice_id) persona.voice_id = voice_id;
    reqBody.interactivity_type = "CONVERSATIONAL";
    reqBody.avatar_persona = persona;
    if (Object.keys(dynamic_variables).length > 0) {
      reqBody.dynamic_variables = dynamic_variables;
    }
  }

  try {
    const liveRes = await fetch(`${LIVEAVATAR_API_BASE}/v1/sessions/token`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
        "X-API-KEY": apiKey,
      },
      body: JSON.stringify(reqBody),
    });

    const data = await liveRes.json().catch(() => ({}));

    if (!liveRes.ok) {
      console.error("[session-token] LiveAvatar error:", liveRes.status, data);
      return res.status(liveRes.status).json({
        error: data?.message || data?.error || "LiveAvatar session creation failed",
        details: data,
      });
    }

    const session_token = data?.data?.session_token || data?.session_token;
    if (!session_token) {
      console.error("[session-token] No session_token in response:", data);
      return res.status(502).json({ error: "Invalid response from LiveAvatar API", details: data });
    }

    return res.status(200).json({ session_token });
  } catch (err) {
    console.error("[session-token] Fetch failed:", err);
    return res.status(500).json({ error: err.message || "Internal server error" });
  }
}

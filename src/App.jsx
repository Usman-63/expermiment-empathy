import { useCallback, useEffect, useRef, useState } from "react";
import {
  AgentEventsEnum,
  LiveAvatarSession,
  SessionEvent,
  SessionInteractivityMode,
  SessionState,
  VoiceChatState,
} from "@heygen/liveavatar-web-sdk";

// ─── Config ──────────────────────────────────────────────────────────────────

const API_KEY    = import.meta.env.VITE_LIVEAVATAR_API_KEY || "";
const VOICE_ID   = import.meta.env.VITE_VOICE_ID          || "de5574fc-009e-4a01-a881-9919ef8f5a0c";
const CONTEXT_ID = import.meta.env.VITE_CONTEXT_ID        || "062b8d8c-5a16-4f14-b838-a507f5affee9";
const AVATAR_ID  = import.meta.env.VITE_AVATAR_ID         || "998e5637-cfca-4700-891e-8a40ce33f562";

// ─── Helpers ─────────────────────────────────────────────────────────────────

async function fetchSessionToken() {
  const res = await fetch("https://api.liveavatar.com/v1/sessions/token", {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Api-Key": API_KEY },
    body: JSON.stringify({
      mode: "FULL",
      avatar_id: AVATAR_ID,
      is_sandbox: false,
      interactivity_type: "CONVERSATIONAL",
      avatar_persona: { voice_id: VOICE_ID, context_id: CONTEXT_ID, language: "en" },
    }),
  });
  const data = await res.json();
  if (!res.ok || !data?.data?.session_token)
    throw new Error(data?.message || data?.error || `Token request failed (${res.status})`);
  return data.data.session_token;
}

// Converts "two" / "2" / "three" / "3" etc → integer
function parseWordNumber(str) {
  const map = { one:1, two:2, three:3, four:4, five:5, six:6 };
  const s = (str || "").toLowerCase().trim();
  return map[s] ?? parseInt(s) ?? 0;
}

// Detect "We'll go slowly for [N] time(s)" in avatar speech
function extractCycleCount(text) {
  const m = (text || "").match(/go\s+slowly\s+for\s+(\w+)\s+time/i);
  if (!m) return 0;
  const n = parseWordNumber(m[1]);
  return n >= 1 && n <= 8 ? n : 0;
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// ─── Box breathing animation ──────────────────────────────────────────────────

const PHASE_LABELS = {
  inhale:   "Breathe in",
  hold_in:  "Hold",
  exhale:   "Breathe out",
  hold_out: "Hold",
};

const PHASE_SCALE = {
  inhale:   1.5,
  hold_in:  1.5,
  exhale:   0.85,
  hold_out: 0.85,
};

function BreathingOverlay({ phase, cycleNum, totalCycles }) {
  const label = PHASE_LABELS[phase] ?? "";
  const scale = PHASE_SCALE[phase] ?? 1;
  const transition = phase === "inhale" || phase === "exhale" ? "transform 4s ease-in-out" : "transform 0.3s ease";

  return (
    <div style={{
      position: "absolute", inset: 0,
      background: "rgba(15,23,42,0.82)",
      display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      gap: 28, zIndex: 10,
    }}>
      {/* Pulsing circle */}
      <div style={{
        width: 120, height: 120, borderRadius: "50%",
        border: "3px solid rgba(99,102,241,0.5)",
        display: "flex", alignItems: "center", justifyContent: "center",
        position: "relative",
      }}>
        <div style={{
          width: 80, height: 80, borderRadius: "50%",
          background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
          transform: `scale(${scale})`,
          transition,
          boxShadow: "0 0 40px rgba(99,102,241,0.5)",
        }} />
      </div>

      {/* Phase label */}
      <div style={{ textAlign: "center", color: "#fff" }}>
        <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: "-0.01em", marginBottom: 6 }}>
          {label}
        </div>
        <div style={{ fontSize: 12, color: "rgba(255,255,255,0.45)", fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase" }}>
          Cycle {cycleNum} of {totalCycles}
        </div>
      </div>
    </div>
  );
}

// ─── Chat bubble ──────────────────────────────────────────────────────────────

function Bubble({ role, text, isBreathing }) {
  const isUser = role === "user";
  return (
    <div style={{ display: "flex", justifyContent: isUser ? "flex-end" : "flex-start", marginBottom: 10 }}>
      <div style={{
        maxWidth: "78%", padding: "10px 14px",
        borderRadius: isUser ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
        background: isBreathing ? "rgba(99,102,241,0.08)" : isUser ? "#4F46E5" : "#fff",
        color: isUser ? "#fff" : "#111",
        border: isUser ? "none" : `1px solid ${isBreathing ? "rgba(99,102,241,0.2)" : "#e2e8f0"}`,
        fontSize: 14, lineHeight: 1.55,
        boxShadow: "0 2px 6px rgba(0,0,0,0.07)",
      }}>
        <div style={{ fontSize: 10, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 4, opacity: 0.55 }}>
          {isBreathing ? "🫁 Breathing" : isUser ? "You" : "Avatar"}
        </div>
        {text}
      </div>
    </div>
  );
}

// ─── App ──────────────────────────────────────────────────────────────────────

export default function App() {
  const videoRef            = useRef(null);
  const sessionRef          = useRef(null);
  const pendingRef          = useRef("");
  const breathTriggerRef    = useRef(0);   // cycles to run, set on trigger detection
  const breathAbortRef      = useRef(false); // set to true to abort mid-sequence

  const [phase, setPhase]               = useState("idle");
  const [status, setStatus]             = useState("Ready");
  const [micActive, setMicActive]       = useState(false);
  const [avatarTalking, setAvatarTalking] = useState(false);
  const [transcript, setTranscript]     = useState([]);
  const [breathPhase, setBreathPhase]   = useState(null); // inhale | hold_in | exhale | hold_out | null
  const [breathCycle, setBreathCycle]   = useState({ current: 0, total: 0 });
  const [breathingActive, setBreathingActive] = useState(false);

  const transcriptRef    = useRef(transcript);
  transcriptRef.current  = transcript;
  const breathingActiveRef = useRef(false);

  const push = useCallback((role, text, tag) => {
    if (!(text || "").trim()) return;
    setTranscript(p => [...p, { id: crypto.randomUUID(), role, text: text.trim(), tag }]);
  }, []);

  // ── Breathing sequence ────────────────────────────────────────────────────

  const runBreathingSequence = useCallback(async (n) => {
    const s = sessionRef.current;
    if (!s) return;

    breathAbortRef.current   = false;
    breathingActiveRef.current = true;
    setBreathingActive(true);
    setStatus("Box breathing…");

    // Lock the mic so user speech doesn't trigger LLM mid-breathing
    try { await s.voiceChat?.mute?.(); }    catch {}
    try { s.stopListening?.(); }             catch {}

    // Wraps session.repeat() and resolves when avatar finishes speaking
    const sayAndWait = (text) => new Promise((resolve) => {
      const s = sessionRef.current;
      if (!s || breathAbortRef.current) { resolve(); return; }

      const onEnd = () => {
        s.off(AgentEventsEnum.AVATAR_SPEAK_ENDED, onEnd);
        resolve();
      };
      s.on(AgentEventsEnum.AVATAR_SPEAK_ENDED, onEnd);
      try {
        s.repeat(text);
      } catch {
        s.off(AgentEventsEnum.AVATAR_SPEAK_ENDED, onEnd);
        resolve();
      }
    });

    const gap = 350; // brief pause between cues (ms)

    for (let i = 1; i <= n; i++) {
      if (breathAbortRef.current) break;

      setBreathCycle({ current: i, total: n });
      const isLast = i === n;
      const prefix = isLast ? "And one last time. " : "";

      // — Inhale —
      setBreathPhase("inhale");
      await sayAndWait(`${prefix}Let's inhale together — breathe in through your nose…`);
      await sleep(4200); // hold the breath for ~4 seconds

      // — Hold in —
      if (breathAbortRef.current) break;
      setBreathPhase("hold_in");
      await sayAndWait("Gently hold…");
      await sleep(4200);

      // — Exhale —
      if (breathAbortRef.current) break;
      setBreathPhase("exhale");
      await sayAndWait("Now let's exhale — breathe out slowly through your mouth…");
      await sleep(4200);

      // — Hold out —
      if (breathAbortRef.current) break;
      setBreathPhase("hold_out");
      await sayAndWait("And gently hold again…");
      await sleep(4200);
    }

    setBreathPhase(null);
    breathingActiveRef.current = false;
    setBreathingActive(false);
    setBreathCycle({ current: 0, total: 0 });

    if (!breathAbortRef.current) {
      await sayAndWait("Let the breath return to its natural rhythm.");
      await sleep(1500);
    }

    setStatus("Connected");
    try { await s.voiceChat?.unmute?.(); } catch {}
    try { s.startListening?.(); }          catch {}
  }, [push]);

  // ── Session stop ──────────────────────────────────────────────────────────

  const stop = useCallback(async () => {
    breathAbortRef.current = true;
    const s = sessionRef.current;
    sessionRef.current = null;
    if (s) try { await s.stop(); } catch {}
    setPhase("idle");
    setStatus("Disconnected");
    setMicActive(false);
    setAvatarTalking(false);
    setBreathingActive(false);
    setBreathPhase(null);
  }, []);

  // ── Session start ─────────────────────────────────────────────────────────

  const start = useCallback(async () => {
    if (sessionRef.current) return;
    setPhase("connecting");
    setStatus("Fetching token…");

    try {
      const token = await fetchSessionToken();
      setStatus("Connecting…");

      const session = new LiveAvatarSession(token, { voiceChat: true });
      sessionRef.current = session;

      // Connection state
      session.on(SessionEvent.SESSION_STATE_CHANGED, (state) => {
        if (state === SessionState.CONNECTED) {
          setPhase("connected");
          setStatus("Connected");
          if (videoRef.current) {
            try { session.attach(videoRef.current); } catch {}
            videoRef.current.muted = false;
            videoRef.current.volume = 1;
            videoRef.current.play().catch(() => {});
          }
        }
        if (state === SessionState.DISCONNECTED) {
          if (sessionRef.current === session) sessionRef.current = null;
          setPhase("idle");
          setStatus("Disconnected");
          setBreathingActive(false);
          setBreathPhase(null);
        }
      });

      session.on(SessionEvent.SESSION_STREAM_READY, () => {
        if (videoRef.current) {
          try { session.attach(videoRef.current); } catch {}
          videoRef.current.muted = false;
          videoRef.current.volume = 1;
          videoRef.current.play().catch(() => {});
        }
      });

      // Avatar speaking
      session.on(AgentEventsEnum.AVATAR_SPEAK_STARTED, () => {
        setAvatarTalking(true);
        setStatus("Avatar speaking…");
      });

      // On AVATAR_SPEAK_ENDED: check if a breathing trigger is queued
      session.on(AgentEventsEnum.AVATAR_SPEAK_ENDED, () => {
        setAvatarTalking(false);
        setStatus("Connected");

        const n = breathTriggerRef.current;
        if (n > 0) {
          breathTriggerRef.current = 0;
          runBreathingSequence(n);
        }
      });

      // Avatar transcript — tag as breathing if sequence is active
      session.on(AgentEventsEnum.AVATAR_TRANSCRIPTION, (e) => {
        const text = (e?.text || "");
        const tag  = breathingActiveRef.current ? "breathing" : undefined;
        push("avatar", text, tag);

        const cycles = extractCycleCount(text);
        if (cycles > 0) {
          // Queue the breathing to start after this utterance finishes
          breathTriggerRef.current = cycles;
        }
      });

      // User speaking
      session.on(AgentEventsEnum.USER_SPEAK_STARTED, () => {
        setMicActive(true);
        setStatus("Listening…");
      });
      session.on(AgentEventsEnum.USER_SPEAK_ENDED, () => {
        setMicActive(false);
        setStatus("Connected");
        const p = pendingRef.current.trim();
        pendingRef.current = "";
        if (p) push("user", p);
      });
      session.on(AgentEventsEnum.USER_TRANSCRIPTION_CHUNK, (e) => { pendingRef.current = e?.text || ""; });
      session.on(AgentEventsEnum.USER_TRANSCRIPTION,       (e) => { pendingRef.current = ""; push("user", e?.text || ""); });

      await session.start();

      if (session.voiceChat?.state !== VoiceChatState.ACTIVE) {
        await session.voiceChat.start({
          mode: SessionInteractivityMode.PUSH_TO_TALK,
          defaultMuted: true,
        });
      }
    } catch (err) {
      setPhase("error");
      setStatus(`Error: ${err?.message || err}`);
      const s = sessionRef.current;
      sessionRef.current = null;
      if (s) try { await s.stop(); } catch {}
    }
  }, [push, runBreathingSequence]);

  // ── Mic controls ──────────────────────────────────────────────────────────

  const pressMic = useCallback(async () => {
    if (breathingActive) return; // block mic during breathing
    const s = sessionRef.current;
    if (!s) return;
    try { await s.voiceChat?.unmute?.(); }     catch {}
    try { await s.voiceChat?.startPushToTalk?.(); } catch {}
    try { s.startListening?.(); }               catch {}
  }, [breathingActive]);

  const releaseMic = useCallback(async () => {
    const s = sessionRef.current;
    if (!s) return;
    try { await s.voiceChat?.stopPushToTalk?.(); } catch {}
    try { await s.voiceChat?.mute?.(); }           catch {}
    try { s.stopListening?.(); }                    catch {}
  }, []);

  // Space bar = push to talk (disabled during breathing)
  useEffect(() => {
    if (phase !== "connected") return;
    let held = false;
    const dn = (e) => { if (e.code === "Space" && !held && !e.repeat) { held = true; pressMic(); } };
    const up = (e) => { if (e.code === "Space" && held) { held = false; releaseMic(); } };
    window.addEventListener("keydown", dn);
    window.addEventListener("keyup",   up);
    return () => { window.removeEventListener("keydown", dn); window.removeEventListener("keyup", up); };
  }, [phase, pressMic, releaseMic]);

  useEffect(() => () => { stop(); }, [stop]);

  const connected  = phase === "connected";
  const connecting = phase === "connecting";

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div style={{ minHeight: "100vh", background: "#f8fafc", fontFamily: "system-ui, sans-serif", display: "flex", flexDirection: "column" }}>

      {/* Header */}
      <div style={{ padding: "12px 20px", borderBottom: "1px solid #e2e8f0", background: "#fff", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <strong style={{ fontSize: 15 }}>Context Session Test</strong>
        <span style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 12, color: "#64748b", fontWeight: 600 }}>
          <span style={{
            width: 8, height: 8, borderRadius: "50%",
            background: breathingActive ? "#8b5cf6" : connected ? "#10b981" : connecting ? "#f59e0b" : phase === "error" ? "#ef4444" : "#cbd5e1",
            boxShadow: breathingActive ? "0 0 0 4px rgba(139,92,246,0.2)" : connected ? "0 0 0 4px rgba(16,185,129,0.18)" : "none",
          }} />
          {status}
        </span>
      </div>

      {/* Body */}
      <div style={{ flex: 1, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, padding: 20, maxWidth: 960, width: "100%", margin: "0 auto", boxSizing: "border-box" }}>

        {/* Video + controls */}
        <div style={{ border: "1px solid #e2e8f0", borderRadius: 20, overflow: "hidden", background: "#fff", boxShadow: "0 4px 20px rgba(0,0,0,0.06)", display: "flex", flexDirection: "column" }}>
          <div style={{ position: "relative", aspectRatio: "9/16", background: "#0f172a", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <video
              ref={videoRef} autoPlay playsInline
              style={{ width: "100%", height: "100%", objectFit: "cover", display: connected ? "block" : "none" }}
            />
            {!connected && (
              <div style={{ color: "#475569", fontSize: 13 }}>
                {connecting ? "Connecting…" : "Avatar offline"}
              </div>
            )}

            {/* Speaking bars */}
            {avatarTalking && !breathingActive && (
              <div style={{ position: "absolute", bottom: 12, left: "50%", transform: "translateX(-50%)", display: "flex", gap: 3, alignItems: "flex-end", height: 18 }}>
                {[0,1,2,3].map(i => (
                  <div key={i} style={{ width: 3, borderRadius: 2, background: "#fff", height: 6 + i * 4, animation: `wave 0.7s ease-in-out ${i * 0.1}s infinite` }} />
                ))}
              </div>
            )}

            {/* Breathing overlay */}
            {breathingActive && breathPhase && (
              <BreathingOverlay
                phase={breathPhase}
                cycleNum={breathCycle.current}
                totalCycles={breathCycle.total}
              />
            )}
          </div>

          {/* Controls */}
          <div style={{ padding: 16, textAlign: "center" }}>
            {connected ? (
              <>
                <button
                  onMouseDown={pressMic} onMouseUp={releaseMic}
                  onTouchStart={(e) => { e.preventDefault(); pressMic(); }}
                  onTouchEnd={(e)   => { e.preventDefault(); releaseMic(); }}
                  disabled={breathingActive}
                  style={{
                    width: 60, height: 60, borderRadius: "50%", border: "none",
                    cursor: breathingActive ? "not-allowed" : "pointer",
                    background: micActive ? "#4F46E5" : breathingActive ? "#f1f5f9" : "#f1f5f9",
                    color: micActive ? "#fff" : "#64748b",
                    opacity: breathingActive ? 0.4 : 1,
                    boxShadow: micActive ? "0 0 0 8px rgba(79,70,229,0.18)" : "0 2px 6px rgba(0,0,0,0.1)",
                    transition: "all 0.15s",
                    display: "inline-flex", alignItems: "center", justifyContent: "center",
                  }}
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="9" y="2" width="6" height="12" rx="3" />
                    <path d="M5 10a7 7 0 0 0 14 0" />
                    <line x1="12" y1="19" x2="12" y2="22" />
                    <line x1="8" y1="22" x2="16" y2="22" />
                  </svg>
                </button>
                <div style={{ marginTop: 7, fontSize: 11, color: "#94a3b8", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em" }}>
                  {breathingActive ? "Breathing exercise…" : micActive ? "Listening…" : "Hold · or Space"}
                </div>
                <button onClick={stop} style={{ display: "block", margin: "12px auto 0", padding: "8px 20px", borderRadius: 12, border: "1px solid #fca5a5", background: "rgba(254,226,226,0.6)", color: "#ef4444", fontWeight: 700, fontSize: 12, cursor: "pointer" }}>
                  End Session
                </button>
              </>
            ) : (
              <button
                onClick={phase === "idle" || phase === "error" ? start : undefined}
                disabled={connecting}
                style={{
                  padding: "12px 28px", borderRadius: 14, border: "none",
                  cursor: connecting ? "default" : "pointer",
                  background: connecting ? "#e2e8f0" : "#4F46E5",
                  color: connecting ? "#94a3b8" : "#fff",
                  fontWeight: 800, fontSize: 14,
                  boxShadow: connecting ? "none" : "0 4px 16px rgba(79,70,229,0.3)",
                }}
              >
                {connecting ? "Connecting…" : "Start Session"}
              </button>
            )}
          </div>
        </div>

        {/* Transcript */}
        <div style={{ border: "1px solid #e2e8f0", borderRadius: 20, background: "#fff", boxShadow: "0 4px 20px rgba(0,0,0,0.06)", display: "flex", flexDirection: "column", minHeight: 300 }}>
          <div style={{ padding: "12px 16px", borderBottom: "1px solid #e2e8f0", fontSize: 11, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.1em", color: "#94a3b8", display: "flex", justifyContent: "space-between" }}>
            <span>Transcript</span>
            {transcript.length > 0 && (
              <button onClick={() => setTranscript([])} style={{ background: "none", border: "none", color: "#cbd5e1", cursor: "pointer", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em" }}>Clear</button>
            )}
          </div>
          <div style={{ flex: 1, overflowY: "auto", padding: "12px 12px 8px" }}>
            {transcript.length === 0 ? (
              <div style={{ textAlign: "center", color: "#cbd5e1", fontSize: 13, marginTop: 40 }}>
                {connected ? "Hold the mic button to speak" : "Start to begin"}
              </div>
            ) : (
              transcript.map(e => <Bubble key={e.id} role={e.role} text={e.text} isBreathing={e.tag === "breathing"} />)
            )}
          </div>
        </div>

      </div>

      {/* Config strip */}
      <div style={{ padding: "10px 20px", borderTop: "1px solid #e2e8f0", background: "#fff", fontSize: 11, color: "#94a3b8", display: "flex", gap: 20, flexWrap: "wrap" }}>
        <span><strong style={{ color: "#4F46E5" }}>context</strong> {CONTEXT_ID}</span>
        <span><strong style={{ color: "#4F46E5" }}>voice</strong> {VOICE_ID}</span>
        <span><strong style={{ color: "#4F46E5" }}>avatar</strong> {AVATAR_ID}</span>
      </div>

      <style>{`
        * { box-sizing: border-box; }
        @keyframes wave { 0%,100%{transform:scaleY(1)} 50%{transform:scaleY(2)} }
      `}</style>
    </div>
  );
}

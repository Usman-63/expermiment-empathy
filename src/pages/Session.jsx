import React, { forwardRef, useCallback, useEffect, useImperativeHandle, useMemo, useRef, useState } from "react";
import { AgentEventsEnum, LiveAvatarSession, SessionDisconnectReason, SessionEvent, SessionInteractivityMode, SessionState, VoiceChatState } from "@heygen/liveavatar-web-sdk";
import { AnimatePresence, motion } from "framer-motion";
import { Lock, Maximize2, Mic, MicOff, PhoneOff, Sparkles, Video, VideoOff, Waves } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { getApiBaseUrl } from "../services/apiClient.js";

// ─── Config ───────────────────────────────────────────────────────────────────

function normalizeBaseUrl(url) {
  return (url || "").toString().replace(/\/+$/, "");
}

const USE_LIVEAVATAR_FULL_MODE = true;
const env = (import.meta && import.meta.env) ? import.meta.env : {};

function envString(key, fallback) {
  const raw = env?.[key];
  if (raw == null) return fallback;
  const s = String(raw);
  return s ? s : fallback;
}

const LIVEAVATAR_FULL_VOICE_ID   = envString("VITE_LIVEAVATAR_VOICE_ID",  "de5574fc-009e-4a01-a881-9919ef8f5a0c");
const LIVEAVATAR_FULL_CONTEXT_ID = envString("VITE_LIVEAVATAR_CONTEXT_ID", "062b8d8c-5a16-4f14-b838-a507f5affee9");
const LIVEAVATAR_FULL_LANGUAGE   = envString("VITE_LIVEAVATAR_LANGUAGE",   "en");

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getApiErrorMessage(payload, rawText, fallback, response) {
  const details = payload?.details;
  if (Array.isArray(details?.data) && details.data[0]?.message) return `${fallback}: ${details.data[0].message}`;
  const detailMessage = details?.message || details?.error?.message || details?.msg || details?.raw || payload?.message || payload?.detail;
  const detailCode = details?.code || payload?.code;
  if (detailMessage && detailCode) return `${fallback}: ${detailMessage} (code ${detailCode})`;
  if (detailMessage) return `${fallback}: ${detailMessage}`;
  if (payload?.error) return payload.error;
  if (response) return `${fallback}: HTTP ${response.status} ${response.statusText || ""}`.trim();
  if (rawText) return `${fallback}: ${rawText.slice(0, 160)}`;
  return fallback;
}

async function parseApiResponse(response) {
  const rawText = await response.text();
  let payload = {};
  if (rawText) { try { payload = JSON.parse(rawText); } catch { payload = {}; } }
  return { rawText, payload };
}

// Detect "We'll go slowly for [N] times" in avatar speech
function extractCycleCount(text) {
  const m = (text || "").match(/go\s+slowly\s+for\s+(\w+)\s+time/i);
  if (!m) return 0;
  const map = { one:1, two:2, three:3, four:4, five:5, six:6, seven:7, eight:8 };
  const s = m[1].toLowerCase();
  const n = map[s] ?? parseInt(s) ?? 0;
  return n >= 1 && n <= 8 ? n : 0;
}

// ─── CircularTimer ────────────────────────────────────────────────────────────

function CircularTimer({ endAtMs, durationMs }) {
  const [nowMs, setNowMs] = useState(() => Date.now());
  useEffect(() => {
    let rafId = 0;
    const tick = () => { setNowMs(Date.now()); rafId = requestAnimationFrame(tick); };
    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [endAtMs, durationMs]);

  const dur = Math.max(1, Number(durationMs || 0));
  const remainingMs = Math.max(0, Number(endAtMs || 0) - nowMs);
  const progress = Math.max(0, Math.min(1, remainingMs / dur));
  const timeLeft = Math.max(0, Math.ceil(remainingMs / 1000));
  const radius = 44;
  const strokeWidth = 8;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * (1 - progress);

  return (
    <div style={{ width: 112, height: 112, display: "grid", placeItems: "center", position: "relative" }}>
      <svg width="112" height="112" style={{ transform: "rotate(-90deg)" }}>
        <circle cx="56" cy="56" r={radius} stroke="rgba(229,231,235,0.55)" strokeWidth={strokeWidth} fill="transparent" />
        <circle cx="56" cy="56" r={radius} stroke="#3B82F6" strokeWidth={strokeWidth} fill="transparent"
          strokeDasharray={circumference} strokeDashoffset={strokeDashoffset} strokeLinecap="round" />
      </svg>
      <div style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center", color: "#fff", fontSize: 22, fontWeight: 800, userSelect: "none" }}>
        {timeLeft}
      </div>
    </div>
  );
}

// ─── HeyGenLiveAvatar ─────────────────────────────────────────────────────────

const HeyGenLiveAvatar = forwardRef(function HeyGenLiveAvatar(
  { apiBase, avatarId, voice, isSandbox, participantName, onReady, onStatus, onError, onSpeakingChange, onUserTranscript, onUserSpeakingChange, onAvatarTranscript, suppressHeygenAIRef },
  ref
) {
  const videoRef = useRef(null);
  const sessionRef = useRef(null);
  const speakLockRef = useRef(Promise.resolve());
  const startedOnceRef = useRef(false);
  const startingRef = useRef(false);
  const sessionStartedRef = useRef(false);
  const streamReadyRef = useRef(false);
  const configRef = useRef({ apiBase, avatarId, voice, isSandbox, participantName });
  const onReadyRef = useRef(onReady);
  const onStatusRef = useRef(onStatus);
  const onErrorRef = useRef(onError);
  const onSpeakingChangeRef = useRef(onSpeakingChange);
  const onAvatarTranscriptRef = useRef(onAvatarTranscript);
  const suppressExternalRef = useRef(suppressHeygenAIRef);

  configRef.current = { apiBase, avatarId, voice, isSandbox, participantName };
  onReadyRef.current = onReady;
  onStatusRef.current = onStatus;
  onErrorRef.current = onError;
  onSpeakingChangeRef.current = onSpeakingChange;
  onAvatarTranscriptRef.current = onAvatarTranscript;
  suppressExternalRef.current = suppressHeygenAIRef;

  const isSuppressed = useCallback(() => Boolean(suppressExternalRef.current?.current), []);

  const stopSession = useCallback(async () => {
    const s = sessionRef.current;
    const canStop = sessionStartedRef.current;
    sessionRef.current = null;
    sessionStartedRef.current = false;
    streamReadyRef.current = false;
    if (!s || !canStop) return;
    try { await s.stop(); } catch { /* ignore */ }
  }, []);

  const ensurePlayback = useCallback(async () => {
    const el = videoRef.current;
    if (!el) return;
    try { el.muted = false; el.volume = 1; } catch { /* ignore */ }
    try {
      const p = el.play();
      if (p && typeof p.then === "function") {
        await Promise.race([p, new Promise((r) => window.setTimeout(r, 400))]);
      }
    } catch { onStatusRef.current?.("Tap to enable audio"); }
  }, []);

  const startSession = useCallback(async () => {
    if (startingRef.current || sessionRef.current) return;
    startingRef.current = true;
    sessionStartedRef.current = false;
    streamReadyRef.current = false;

    const { apiBase: cfgApiBase, avatarId: cfgAvatarId, isSandbox: cfgIsSandbox, participantName: cfgParticipantName } = configRef.current;
    const base = normalizeBaseUrl(cfgApiBase);
    if (!base) throw new Error("HeyGen: apiBase missing");

    try {
      const fetchToken = async () => {
        const controller = new AbortController();
        const timer = window.setTimeout(() => controller.abort(), 8000);
        try {
          const response = await fetch(`${base}/liveavatar/session-token`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              avatar_id: cfgAvatarId,
              is_sandbox: Boolean(cfgIsSandbox),
              mode: "FULL",
              voice_id: LIVEAVATAR_FULL_VOICE_ID,
              context_id: LIVEAVATAR_FULL_CONTEXT_ID,
              language: LIVEAVATAR_FULL_LANGUAGE,
              dynamic_variables: {
                participant_name: (cfgParticipantName || "").toString() || "there",
              },
            }),
            signal: controller.signal,
          });
          const { payload, rawText } = await parseApiResponse(response);
          return { response, payload, rawText };
        } catch (e) {
          if ((e?.name || "").toString() === "AbortError") throw new Error("Session token creation failed: request timed out");
          throw e;
        } finally {
          window.clearTimeout(timer);
        }
      };

      onStatusRef.current?.("Requesting session…");
      let tokenRes = await fetchToken();
      if (tokenRes.response.status === 403) {
        const msg = getApiErrorMessage(tokenRes.payload, tokenRes.rawText, "Session token creation failed", tokenRes.response);
        if (msg.toLowerCase().includes("concurr")) {
          await new Promise((r) => window.setTimeout(r, 2000));
          tokenRes = await fetchToken();
        }
      }
      if (!tokenRes.response.ok || !tokenRes.payload?.session_token) {
        throw new Error(getApiErrorMessage(tokenRes.payload, tokenRes.rawText, "Session token creation failed", tokenRes.response));
      }

      const session = new LiveAvatarSession(tokenRes.payload.session_token, { voiceChat: true });
      sessionRef.current = session;

      session.on(SessionEvent.SESSION_STATE_CHANGED, (nextState) => {
        const label = nextState === SessionState.CONNECTED ? "Connected" : nextState === SessionState.DISCONNECTED ? "Disconnected" : "Connecting";
        onStatusRef.current?.(label);
        if (nextState === SessionState.CONNECTED) {
          streamReadyRef.current = true;
          if (videoRef.current) { try { session.attach(videoRef.current); void ensurePlayback(); } catch { /* ignore */ } }
        }
        if (nextState === SessionState.DISCONNECTED) {
          sessionStartedRef.current = false;
          streamReadyRef.current = false;
          if (sessionRef.current === session) sessionRef.current = null;
        }
      });

      session.on(SessionEvent.SESSION_DISCONNECTED, (reason) => {
        onStatusRef.current?.("Disconnected");
      });

      session.on(SessionEvent.SESSION_STREAM_READY, () => {
        streamReadyRef.current = true;
        onStatusRef.current?.("Stream ready");
        if (videoRef.current) { try { session.attach(videoRef.current); void ensurePlayback(); } catch { /* ignore */ } }
      });

      session.on(AgentEventsEnum.AVATAR_SPEAK_STARTED, () => {
        onStatusRef.current?.("Speaking…");
        onSpeakingChangeRef.current?.(true);
      });
      session.on(AgentEventsEnum.AVATAR_SPEAK_ENDED, () => {
        onStatusRef.current?.("Stream ready");
        onSpeakingChangeRef.current?.(false);
      });

      // ← NEW: forward avatar transcript to main component for breathing trigger detection
      session.on(AgentEventsEnum.AVATAR_TRANSCRIPTION, (e) => {
        const t = (e?.text || "").toString();
        if (t.trim()) onAvatarTranscriptRef.current?.(t);
      });

      session.on(AgentEventsEnum.USER_SPEAK_STARTED, () => { onUserSpeakingChange?.(true); });
      session.on(AgentEventsEnum.USER_SPEAK_ENDED,   () => { onUserSpeakingChange?.(false); });
      session.on(AgentEventsEnum.USER_TRANSCRIPTION_CHUNK, (e) => {
        const t = (e?.text || "").toString();
        if (t.trim()) onUserTranscript?.(t, { final: false });
      });
      session.on(AgentEventsEnum.USER_TRANSCRIPTION, (e) => {
        const t = (e?.text || "").toString();
        if (t.trim()) onUserTranscript?.(t, { final: true });
      });

      onStatusRef.current?.("Starting…");
      await Promise.race([
        session.start(),
        new Promise((_, reject) => window.setTimeout(() => reject(new Error("HeyGen start timed out")), 20000)),
      ]);
      sessionStartedRef.current = true;

      try {
        if (session.voiceChat?.state !== VoiceChatState.ACTIVE) {
          onStatusRef.current?.("Enabling voice chat…");
          await session.voiceChat.start({ mode: SessionInteractivityMode.PUSH_TO_TALK, defaultMuted: true });
          try { await session.voiceChat.startPushToTalk(); } catch { /* ignore */ }
        }
        try { session.startListening(); } catch { /* ignore */ }
      } catch (e) {
        throw new Error(e?.message || "HeyGen: voice chat failed to start");
      }

      onReadyRef.current?.({
        speak: async (text) => {
          if (!streamReadyRef.current) throw new Error("Avatar not ready");
          const trimmed = (text || "").toString().trim();
          if (!trimmed) return;
          speakLockRef.current = speakLockRef.current.then(async () => {
            const s = sessionRef.current;
            if (!s || s !== session) throw new Error("HeyGen: session not connected");
            try { await s.voiceChat?.mute?.(); } catch { /* ignore */ }
            try { s.stopListening?.(); } catch { /* ignore */ }
            let resolveSpeak = null;
            const done = new Promise((resolve) => { resolveSpeak = resolve; });
            try { s.repeat(trimmed); } catch (e) {
              if (!isSuppressed()) { try { s.startListening?.(); } catch { /* ignore */ } }
              try { await s.voiceChat?.unmute?.(); } catch { /* ignore */ }
              throw new Error(e?.message || "HeyGen: repeat failed");
            }
            const onEnded = () => {
              window.clearTimeout(endedTimer);
              s.off(AgentEventsEnum.AVATAR_SPEAK_ENDED, onEnded);
              resolveSpeak?.();
            };
            const endedTimer = window.setTimeout(() => {
              s.off(AgentEventsEnum.AVATAR_SPEAK_ENDED, onEnded);
              resolveSpeak?.();
            }, 30000);
            s.on(AgentEventsEnum.AVATAR_SPEAK_ENDED, onEnded);
            void ensurePlayback();
            await done;
            if (!isSuppressed()) { try { s.startListening?.(); } catch { /* ignore */ } }
            try { await s.voiceChat?.unmute?.(); } catch { /* ignore */ }
          });
          return speakLockRef.current;
        },
        interrupt: () => { const s = sessionRef.current; if (!s || s !== session) return; try { s.interrupt(); } catch { /* ignore */ } },
        stop: async () => { if (sessionRef.current !== session) return; await stopSession(); },
        muteMic: async () => { try { await session.voiceChat?.mute?.(); } catch { /* ignore */ } },
        unmuteMic: async () => { try { await session.voiceChat?.unmute?.(); } catch { /* ignore */ } },
        stopHeygenListening: () => { try { session.stopListening?.(); } catch { /* ignore */ } },
        startHeygenListening: () => { try { session.startListening?.(); } catch { /* ignore */ } },
        getVideoElement: () => videoRef.current,
        ensurePlayback,
      });
    } finally {
      startingRef.current = false;
    }
  }, [ensurePlayback, isSuppressed, stopSession]);

  useEffect(() => {
    return () => { void stopSession(); if (videoRef.current) videoRef.current.srcObject = null; };
  }, [startSession, stopSession]);

  useEffect(() => {
    window.addEventListener("pointerdown", ensurePlayback, { passive: true });
    return () => window.removeEventListener("pointerdown", ensurePlayback);
  }, [ensurePlayback]);

  useImperativeHandle(ref, () => ({
    start: async () => {
      if (startedOnceRef.current) return;
      startedOnceRef.current = true;
      onStatusRef.current?.("Initializing…");
      try { await ensurePlayback(); } catch { /* ignore */ }
      try { await startSession(); } catch (e) {
        onErrorRef.current?.(e);
        onStatusRef.current?.(e?.message || "Failed to start HeyGen avatar");
        throw e;
      }
    },
    ensurePlayback,
    stop: stopSession,
  }), [ensurePlayback, startSession, stopSession]);

  return <video ref={videoRef} autoPlay playsInline style={{ width: "100%", height: "100%", objectFit: "contain" }} />;
});

// ─── Session ──────────────────────────────────────────────────────────────────

export default function Session() {
  const navigate      = useNavigate();
  const avatarUiRef   = useRef(null);
  const avatarControlsRef = useRef(null);
  const cancelledRef  = useRef(false);
  const suppressHeygenAIRef = useRef(false);
  const breathTriggerRef    = useRef(0);    // cycle count queued from avatar transcript
  const speakFnRef          = useRef(null); // set after avatar ready

  const [userStarted,    setUserStarted]    = useState(false);
  const [avatarReady,    setAvatarReady]    = useState(false);
  const [avatarError,    setAvatarError]    = useState("");
  const [avatarStatusText, setAvatarStatusText] = useState("Starting");
  const [isAvatarSpeaking, setIsAvatarSpeaking] = useState(false);
  const [isMuted,        setIsMuted]        = useState(false);
  const [videoOff,       setVideoOff]       = useState(false);
  const [breathingTimer, setBreathingTimer] = useState(null);
  const [participantCameraStream, setParticipantCameraStream] = useState(null);
  const participantVideoRef = useRef(null);
  const avatarApiBase = useMemo(() => normalizeBaseUrl(getApiBaseUrl()), []);

  const sessionLive = userStarted && avatarReady;

  // ── Box breathing (frontend-owned, no LLM involvement) ───────────────────

  const runGuidedBoxBreathing = useCallback(async (cycles) => {
    const n        = Math.max(1, Math.min(8, Number(cycles ?? 4)));
    const durationMs = 4000;

    suppressHeygenAIRef.current = true;
    try { avatarControlsRef.current?.stopHeygenListening?.(); } catch { /* ignore */ }

    const wait = () => {
      setBreathingTimer({ endAtMs: Date.now() + durationMs, durationMs });
      return new Promise((r) => window.setTimeout(r, durationMs));
    };

    const say = (text) => speakFnRef.current?.(text);

    for (let c = 0; c < n; c++) {
      if (cancelledRef.current) break;
      const isFirst = c === 0;
      const isLast  = c === n - 1 && n > 1;

      const inhale = isFirst  ? "Let's inhale together — breathe in through your nose."
                   : isLast   ? "One last time — breathe in through your nose."
                              : "Again, breathe in through your nose.";
      await say(inhale);
      if (cancelledRef.current) break;
      await wait(); setBreathingTimer(null);

      await say("Gently hold.");
      if (cancelledRef.current) break;
      await wait(); setBreathingTimer(null);

      const exhale = isFirst ? "Now let's exhale — breathe out slowly through your mouth."
                             : "Breathe out slowly through your mouth.";
      await say(exhale);
      if (cancelledRef.current) break;
      await wait(); setBreathingTimer(null);

      await say("And gently hold.");
      if (cancelledRef.current) break;
      await wait(); setBreathingTimer(null);
    }

    setBreathingTimer(null);
    if (!cancelledRef.current) {
      await say("Let the breath return to its natural rhythm.");
    }

    suppressHeygenAIRef.current = false;
    try { avatarControlsRef.current?.startHeygenListening?.(); } catch { /* ignore */ }
  }, []);

  // ── Detect breathing trigger in avatar transcript ─────────────────────────

  const handleAvatarTranscript = useCallback((text) => {
    const n = extractCycleCount(text);
    if (n > 0) breathTriggerRef.current = n;
  }, []);

  // ── Fire breathing when avatar finishes the trigger utterance ─────────────

  const handleSpeakingChange = useCallback((speaking) => {
    setIsAvatarSpeaking(Boolean(speaking));
    if (!speaking && breathTriggerRef.current > 0) {
      const n = breathTriggerRef.current;
      breathTriggerRef.current = 0;
      void runGuidedBoxBreathing(n);
    }
  }, [runGuidedBoxBreathing]);

  // ── Camera (PIP) ──────────────────────────────────────────────────────────

  useEffect(() => {
    let active = true;
    navigator.mediaDevices?.getUserMedia({ video: true, audio: false })
      .then((stream) => { if (active) setParticipantCameraStream(stream); })
      .catch(() => {});
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (participantVideoRef.current && participantCameraStream) {
      participantVideoRef.current.srcObject = participantCameraStream;
    }
  }, [participantCameraStream]);

  // ── Start / End session UI ────────────────────────────────────────────────

  const startSessionUi = useCallback(() => {
    cancelledRef.current = false;
    setUserStarted(true);
    window.setTimeout(() => { avatarUiRef.current?.start?.().catch((e) => setAvatarError(e?.message || "Failed to start")); }, 300);
  }, []);

  const endSessionUi = useCallback(() => {
    cancelledRef.current = true;
    suppressHeygenAIRef.current = false;
    setBreathingTimer(null);
    avatarControlsRef.current?.stop?.();
    avatarControlsRef.current = null;
    participantCameraStream?.getTracks?.().forEach((t) => t.stop());
    navigate("/post-session-survey");
  }, [navigate, participantCameraStream]);

  const retryAvatar = useCallback(() => {
    setAvatarError("");
    setAvatarReady(false);
    setUserStarted(false);
    window.setTimeout(() => startSessionUi(), 100);
  }, [startSessionUi]);

  // ── Mic / Camera toggles ──────────────────────────────────────────────────

  const toggleMute = useCallback(() => {
    setIsMuted((prev) => {
      const next = !prev;
      if (next) avatarControlsRef.current?.muteMic?.();
      else avatarControlsRef.current?.unmuteMic?.();
      return next;
    });
  }, []);

  const toggleVideo = useCallback(() => {
    setVideoOff((prev) => {
      const next = !prev;
      if (participantCameraStream) {
        participantCameraStream.getVideoTracks().forEach((t) => { t.enabled = !next; });
      }
      return next;
    });
  }, [participantCameraStream]);

  useEffect(() => () => { cancelledRef.current = true; }, []);

  const GlassControl = useCallback(({ children, onClick, active = false, ariaLabel }) => (
    <button type="button" aria-label={ariaLabel} onClick={onClick}
      className={["sp-ctrl", active ? "sp-ctrlActive" : "sp-ctrlIdle"].join(" ")}>
      {children}
    </button>
  ), []);

  return (
    <div className="sp-root">
      <style>{`
        .sp-root{min-height:100vh;background:#F8FAFC;color:#0F172A;font-family:ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, "Apple Color Emoji","Segoe UI Emoji";overflow:hidden;display:flex;flex-direction:column}
        .sp-root ::selection{background:#E0E7FF;color:#312E81}
        .sp-nav{position:sticky;top:0;z-index:50;width:100%;border-bottom:1px solid rgba(226,232,240,0.60);background:rgba(255,255,255,0.70);backdrop-filter: blur(12px)}
        .sp-navInner{max-width:1152px;margin:0 auto;padding:16px 24px;display:flex;align-items:center;justify-content:space-between;gap:16px}
        .sp-brand{display:flex;align-items:center;gap:12px}
        .sp-logo{width:40px;height:40px;border-radius:16px;background:linear-gradient(45deg,#4F46E5,#8B5CF6);display:flex;align-items:center;justify-content:center;box-shadow:0 10px 15px -3px rgba(199,210,254,1),0 4px 6px -4px rgba(199,210,254,1)}
        .sp-brandName{font-weight:800;color:#1E293B;line-height:1;letter-spacing:-0.02em}
        .sp-brandSub{margin-top:2px;font-size:10px;font-weight:800;color:#6366F1;text-transform:uppercase;letter-spacing:0.16em}
        .sp-navRight{display:flex;align-items:center;gap:16px;color:#94A3B8}
        .sp-ready{display:flex;align-items:center;gap:8px;background:#FFFFFF;padding:6px 12px;border-radius:999px;border:1px solid #F1F5F9;box-shadow:0 1px 2px rgba(15,23,42,0.06)}
        .sp-readyDot{width:8px;height:8px;border-radius:999px;background:#CBD5E1}
        .sp-readyDotLive{background:#F43F5E;animation: spPulse 2s cubic-bezier(0.4,0,0.6,1) infinite}
        @keyframes spPulse{0%,100%{opacity:1}50%{opacity:0.5}}
        .sp-readyText{font-size:10px;font-weight:800;color:#64748B;text-transform:uppercase;letter-spacing:0.16em}

        .sp-main{flex:1;min-height:0;position:relative;display:flex;align-items:center;justify-content:center}
        .sp-bg{position:absolute;inset:0;pointer-events:none}
        .sp-blob1{position:absolute;top:25%;left:25%;width:500px;height:500px;background:rgba(199,210,254,0.30);filter: blur(120px);border-radius:999px}
        .sp-blob2{position:absolute;bottom:25%;right:25%;width:500px;height:500px;background:rgba(221,214,254,0.30);filter: blur(120px);border-radius:999px}
        .sp-shell{position:relative;width:100%;height:100%;min-height:0;max-width:1152px;margin:0 auto;display:flex;align-items:center;justify-content:center;padding:24px}
        @media (min-width: 1024px){.sp-shell{padding:48px}}

        .sp-startScreen{text-align:center;display:flex;flex-direction:column;align-items:center;gap:40px}
        .sp-startCopy{display:flex;flex-direction:column;gap:16px}
        .sp-h1{margin:0;font-size:48px;font-weight:900;letter-spacing:-0.03em;line-height:1.05;color:#0F172A}
        .sp-gradText{background:linear-gradient(90deg,#4F46E5,#7C3AED);-webkit-background-clip:text;background-clip:text;color:transparent}
        .sp-p{margin:0;font-size:18px;color:#64748B;line-height:1.7;max-width:560px}
        .sp-startBtn{position:relative;padding:20px 48px;background:#4F46E5;color:#FFFFFF;font-weight:900;border:none;border-radius:32px;box-shadow:0 25px 50px -12px rgba(199,210,254,0.90);cursor:pointer;transition:transform 160ms ease, background 160ms ease}
        .sp-startBtn:hover{background:#4338CA;transform:scale(1.02)}
        .sp-startBtn:active{transform:scale(0.99)}
        .sp-secure{display:flex;align-items:center;justify-content:center;gap:8px;color:#94A3B8}
        .sp-secureText{font-size:10px;font-weight:900;text-transform:uppercase;letter-spacing:0.22em}

        .sp-avatarWrap{position:relative;width:100%;height:100%;display:flex;align-items:center;justify-content:center}
        .sp-avatarFrame{position:relative;width:100%;height:100%;max-height:min(700px, calc(100vh - 240px));aspect-ratio:16/9;border-radius:48px;background:#0F172A;box-shadow:0 25px 50px -12px rgba(199,210,254,0.60);overflow:hidden;border:4px solid #FFFFFF}
        .sp-avatarFill{position:absolute;inset:0}
        .sp-overlayBadge{position:absolute;top:24px;left:24px;display:flex;align-items:center;gap:8px;background:rgba(0,0,0,0.20);backdrop-filter: blur(12px);padding:6px 12px;border-radius:999px;border:1px solid rgba(255,255,255,0.10)}
        .sp-overlayDot{width:8px;height:8px;border-radius:999px;background:#F43F5E;animation: spPulse 2s cubic-bezier(0.4,0,0.6,1) infinite}
        .sp-overlayText{font-size:9px;font-weight:900;color:#FFFFFF;text-transform:uppercase;letter-spacing:0.16em}
        .sp-connecting{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;background:rgba(15,23,42,0.70)}
        .sp-connectingInner{display:flex;flex-direction:column;align-items:center;gap:14px}
        .sp-spinner{width:64px;height:64px;border-radius:999px;border:4px solid rgba(99,102,241,0.20);border-top-color:#6366F1;animation: spSpin 0.9s linear infinite}
        @keyframes spSpin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
        .sp-connectingText{font-size:10px;font-weight:900;color:rgba(255,255,255,0.45);text-transform:uppercase;letter-spacing:0.26em;text-align:center;padding:0 18px}

        .sp-pip{position:absolute;bottom:40px;right:40px;width:192px;aspect-ratio:16/9;border-radius:24px;background:#0F172A;border:4px solid #FFFFFF;overflow:hidden;box-shadow:0 25px 50px -12px rgba(15,23,42,0.35);z-index:40}
        .sp-pipBg{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;background:#1F2937;color:#64748B}
        .sp-pipVideo{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;transform:scaleX(-1)}
        .sp-pipShade{position:absolute;inset:0;background:linear-gradient(to top, rgba(0,0,0,0.40), transparent);pointer-events:none}
        .sp-pipLabel{position:absolute;left:14px;bottom:14px;display:flex;align-items:center;gap:8px}
        .sp-pipDot{width:8px;height:8px;border-radius:999px;background:#10B981;animation: spPulse 2s cubic-bezier(0.4,0,0.6,1) infinite}
        .sp-pipDotOff{background:#64748B;animation:none}
        .sp-pipText{font-size:9px;font-weight:900;text-transform:uppercase;letter-spacing:0.20em;color:rgba(255,255,255,0.80)}

        .sp-footer{position:relative;z-index:50;padding:40px 24px;display:flex;justify-content:center}
        .sp-controls{display:flex;align-items:center;gap:20px;padding:16px 28px;background:rgba(255,255,255,0.90);backdrop-filter: blur(18px);border:1px solid #E2E8F0;border-radius:40px;box-shadow:0 20px 25px -5px rgba(226,232,240,0.80),0 8px 10px -6px rgba(226,232,240,0.80)}
        .sp-ctrlGroup{display:flex;align-items:center;gap:12px}
        .sp-divider{width:1px;height:40px;background:#E2E8F0}
        .sp-ctrl{width:56px;height:56px;border-radius:999px;transition:all 160ms ease;border:1px solid #E2E8F0;display:flex;align-items:center;justify-content:center;cursor:pointer}
        .sp-ctrlIdle{background:rgba(255,255,255,0.80);color:#475569;box-shadow:0 1px 2px rgba(15,23,42,0.08)}
        .sp-ctrlIdle:hover{background:#F8FAFC}
        .sp-ctrlActive{background:#4F46E5;color:#FFFFFF;border-color:#6366F1;box-shadow:0 10px 15px -3px rgba(224,231,255,1),0 4px 6px -4px rgba(224,231,255,1)}
        .sp-endBtn{padding:16px 28px;border-radius:999px;background:#FEF2F2;color:#E11D48;border:1px solid #FFE4E6;font-weight:900;font-size:14px;display:flex;align-items:center;gap:10px;cursor:pointer;transition:background 160ms ease,color 160ms ease}
        .sp-endBtn:hover{background:#E11D48;color:#FFFFFF}
        .sp-endBtn:disabled{opacity:0.5;cursor:not-allowed}

        @media (max-height: 760px){
          .sp-shell{padding:16px}
          .sp-avatarFrame{border-radius:32px;border-width:3px;max-height:calc(100vh - 200px)}
          .sp-footer{padding:18px 16px}
          .sp-controls{padding:12px 18px;border-radius:32px}
          .sp-pip{bottom:16px;right:16px;width:152px;border-width:3px;border-radius:20px}
        }
      `}</style>

      {/* Nav */}
      <div className="sp-nav" role="navigation">
        <div className="sp-navInner">
          <div className="sp-brand">
            <div className="sp-logo"><Sparkles size={18} color="#FFFFFF" /></div>
            <div>
              <div className="sp-brandName">AI Empath</div>
              <div className="sp-brandSub">Research Interface</div>
            </div>
          </div>
          <div className="sp-navRight">
            <div className="sp-ready" role="status" aria-live="polite">
              <div className={`sp-readyDot ${sessionLive ? "sp-readyDotLive" : ""}`.trim()} />
              <span className="sp-readyText">{sessionLive ? "Live Session" : avatarStatusText || "Ready"}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main */}
      <main className="sp-main">
        <div className="sp-bg">
          <div className="sp-blob1" />
          <div className="sp-blob2" />
        </div>

        <div className="sp-shell">
          <AnimatePresence>
            {!userStarted ? (
              <motion.div key="start-screen" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 1.05 }} className="sp-startScreen">
                <div className="sp-startCopy">
                  <h1 className="sp-h1">Ready to <span className="sp-gradText">Begin?</span></h1>
                  <p className="sp-p">The avatar is ready to guide you through your session.</p>
                </div>
                <button type="button" className="sp-startBtn" onClick={startSessionUi} disabled={Boolean(avatarError)}>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 12 }}>
                    Start Session <Waves size={20} style={{ opacity: 0.85 }} />
                  </span>
                </button>
                <div className="sp-secure">
                  <Lock size={16} />
                  <span className="sp-secureText">Secure Data Streaming Protocol</span>
                </div>
              </motion.div>
            ) : (
              <motion.div key="avatar-screen" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="sp-avatarWrap">
                <div className="sp-avatarFrame">
                  <div className="sp-avatarFill">
                    <HeyGenLiveAvatar
                      ref={avatarUiRef}
                      apiBase={avatarApiBase}
                      avatarId={undefined}
                      isSandbox={false}
                      suppressHeygenAIRef={suppressHeygenAIRef}
                      onAvatarTranscript={handleAvatarTranscript}
                      onUserTranscript={() => {}}
                      onUserSpeakingChange={() => {}}
                      onStatus={(msg) => {
                        setAvatarStatusText(msg || "");
                        if (msg === "Stream ready") setAvatarReady(true);
                      }}
                      onError={(e) => {
                        setIsAvatarSpeaking(false);
                        setAvatarReady(false);
                        setAvatarError(e?.message || "Failed to start HeyGen avatar");
                      }}
                      onReady={(controls) => {
                        avatarControlsRef.current = controls;
                        speakFnRef.current = controls.speak;
                        setAvatarError("");
                      }}
                      onSpeakingChange={handleSpeakingChange}
                    />
                  </div>

                  <div className="sp-overlayBadge">
                    <div className="sp-overlayDot" />
                    <span className="sp-overlayText">Live Session</span>
                  </div>

                  {!avatarReady && !avatarError && (
                    <div className="sp-connecting">
                      <div className="sp-connectingInner">
                        <div className="sp-spinner" />
                        <p className="sp-connectingText">{avatarStatusText || "Connecting to HeyGen Stream..."}</p>
                      </div>
                    </div>
                  )}

                  {avatarError && (
                    <div className="sp-connecting">
                      <div className="sp-connectingInner">
                        <p className="sp-connectingText" style={{ color: "rgba(255,255,255,0.75)", letterSpacing: "0.08em", textTransform: "none", fontSize: 12, fontWeight: 800 }}>
                          {avatarError}
                        </p>
                        <button type="button" onClick={retryAvatar} className="sp-startBtn" style={{ padding: "14px 24px", borderRadius: 999 }}>
                          Retry Connection
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Breathing countdown timer */}
                  {breathingTimer && (
                    <div style={{ position: "absolute", top: 16, right: 16, zIndex: 99, pointerEvents: "none", borderRadius: 999, background: "rgba(17,24,39,0.55)", border: "1px solid rgba(229,231,235,0.25)", backdropFilter: "blur(8px)" }}>
                      <CircularTimer endAtMs={breathingTimer.endAtMs} durationMs={breathingTimer.durationMs} />
                    </div>
                  )}
                </div>

                {/* PIP */}
                <div className="sp-pip">
                  <div className="sp-pipBg">
                    {videoOff ? <VideoOff size={22} /> : <Video size={22} />}
                  </div>
                  {!videoOff && participantCameraStream && (
                    <video ref={participantVideoRef} className="sp-pipVideo" autoPlay muted playsInline />
                  )}
                  <div className="sp-pipShade" />
                  <div className="sp-pipLabel">
                    <div className={`sp-pipDot ${videoOff || !participantCameraStream ? "sp-pipDotOff" : ""}`.trim()} />
                    <span className="sp-pipText">Participant</span>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      {/* Footer controls */}
      <footer className="sp-footer">
        <div className="sp-controls">
          <div className="sp-ctrlGroup">
            <GlassControl onClick={toggleMute} active={isMuted} ariaLabel={isMuted ? "Unmute microphone" : "Mute microphone"}>
              {isMuted ? <MicOff size={20} /> : <Mic size={20} />}
            </GlassControl>
            <GlassControl onClick={toggleVideo} active={videoOff} ariaLabel={videoOff ? "Enable camera" : "Disable camera"}>
              {videoOff ? <VideoOff size={20} /> : <Video size={20} />}
            </GlassControl>
          </div>
          <div className="sp-divider" />
          <button type="button" className="sp-endBtn" onClick={endSessionUi} disabled={!userStarted}>
            <PhoneOff size={16} />
            End Session
          </button>
        </div>
      </footer>
    </div>
  );
}

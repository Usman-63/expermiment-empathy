import { useEffect, useRef, useState } from "react";
import { pickBackchannelUtterance } from "../utils/backchannelPolicy.js";

function clampNumber(n, fallback) {
  const v = Number(n);
  return Number.isFinite(v) ? v : fallback;
}

function randomBetween(min, max) {
  const a = clampNumber(min, 0);
  const b = clampNumber(max, a);
  const lo = Math.min(a, b);
  const hi = Math.max(a, b);
  if (hi <= lo) return lo;
  return lo + Math.random() * (hi - lo);
}

export function useBackchannelScheduler({
  isSpeaking,
  enabled,
  resetKey,
  minPauseMs = 900,
  minGapMs = 5000,
  speechMinMs = 8000,
  speechMaxMs = 15000,
  maxConsecutive = 2,
}) {
  const [lastBackchannel, setLastBackchannel] = useState(null);

  const stateRef = useRef({
    prevIsSpeaking: null,
    speechStartAtMs: null,
    speechMsSinceLastBackchannel: 0,
    pauseStartAtMs: null,
    firedInThisPause: false,
    lastBackchannelAtMs: null,
    previousUtterance: null,
    consecutiveCount: 0,
    requiredSpeechMs: null,
  });

  // Reset accumulated state when entering a new turn (e.g. new stage)
  useEffect(() => {
    const st = stateRef.current;
    st.prevIsSpeaking = null;
    st.speechStartAtMs = null;
    st.speechMsSinceLastBackchannel = 0;
    st.pauseStartAtMs = null;
    st.firedInThisPause = false;
    st.lastBackchannelAtMs = null;
    st.consecutiveCount = 0;
    st.requiredSpeechMs = null;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resetKey]);

  useEffect(() => {
    if (!enabled) return;

    const nowMs = performance.now();
    const st = stateRef.current;
    if (st.requiredSpeechMs == null) st.requiredSpeechMs = randomBetween(speechMinMs, speechMaxMs);

    if (st.prevIsSpeaking == null) {
      st.prevIsSpeaking = isSpeaking;
      if (isSpeaking) st.speechStartAtMs = nowMs;
      if (!isSpeaking) st.pauseStartAtMs = nowMs;
      return;
    }

    const prev = st.prevIsSpeaking;
    st.prevIsSpeaking = isSpeaking;

    if (prev === false && isSpeaking === true) {
      st.firedInThisPause = false;
      st.pauseStartAtMs = null;
      st.speechStartAtMs = nowMs;
    }
    if (prev === true && isSpeaking === false) {
      if (st.speechStartAtMs != null) st.speechMsSinceLastBackchannel += Math.max(0, nowMs - st.speechStartAtMs);
      st.speechStartAtMs = null;
      st.pauseStartAtMs = nowMs;
    }
  }, [enabled, isSpeaking]);

  useEffect(() => {
    if (!enabled) return;
    if (isSpeaking) return;

    const st = stateRef.current;
    const nowMs = performance.now();
    if (st.pauseStartAtMs == null) return;
    if (st.firedInThisPause) return;
    if (st.consecutiveCount >= clampNumber(maxConsecutive, 2)) return;

    const requiredSpeechMs = clampNumber(st.requiredSpeechMs, randomBetween(speechMinMs, speechMaxMs));
    if (st.speechMsSinceLastBackchannel < requiredSpeechMs) return;

    if (st.lastBackchannelAtMs != null) {
      const gap = nowMs - st.lastBackchannelAtMs;
      if (gap < clampNumber(minGapMs, 5000)) return;
    }

    const pauseElapsedMs = nowMs - st.pauseStartAtMs;
    const remainingMs = Math.max(0, clampNumber(minPauseMs, 900) - pauseElapsedMs);

    const timer = window.setTimeout(() => {
      if (!enabled) return;
      if (isSpeaking) return;

      const t = performance.now();
      const st2 = stateRef.current;
      if (st2.pauseStartAtMs == null) return;
      if (st2.firedInThisPause) return;
      if (st2.consecutiveCount >= clampNumber(maxConsecutive, 2)) return;

      if (st2.requiredSpeechMs == null) st2.requiredSpeechMs = randomBetween(speechMinMs, speechMaxMs);
      if (st2.speechMsSinceLastBackchannel < clampNumber(st2.requiredSpeechMs, 8000)) return;

      if (st2.lastBackchannelAtMs != null) {
        const gap = t - st2.lastBackchannelAtMs;
        if (gap < clampNumber(minGapMs, 5000)) return;
      }

      if (t - st2.pauseStartAtMs < clampNumber(minPauseMs, 900)) return;

      const utterance = pickBackchannelUtterance(st2.previousUtterance);
      st2.previousUtterance = utterance;
      st2.lastBackchannelAtMs = t;
      st2.firedInThisPause = true;
      st2.consecutiveCount += 1;
      st2.speechMsSinceLastBackchannel = 0;
      st2.requiredSpeechMs = randomBetween(speechMinMs, speechMaxMs);
      setLastBackchannel({ utterance, occurredAtMs: t });
    }, remainingMs);

    return () => window.clearTimeout(timer);
  }, [enabled, isSpeaking, maxConsecutive, minGapMs, minPauseMs, speechMaxMs, speechMinMs]);

  return { lastBackchannel };
}

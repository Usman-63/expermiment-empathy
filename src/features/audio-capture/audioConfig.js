const env =
  (import.meta && import.meta.env)
    ? import.meta.env
    : (typeof process !== "undefined" && process.env ? process.env : {});

function envNumber(key, fallback) {
  const raw = env?.[key];
  if (raw == null || raw === "") return fallback;
  const n = Number(raw);
  return Number.isFinite(n) ? n : fallback;
}

export const audioConfig = {
  noiseGateDb: envNumber("VITE_VAD_NOISE_GATE_DB", -40),
  minSpeechMs: envNumber("VITE_VAD_MIN_SPEECH_MS", 200),
  minSilenceMs: envNumber("VITE_VAD_MIN_SILENCE_MS", 250),
  preEmphasis: envNumber("VITE_VAD_PRE_EMPHASIS", 0.97),
  speechBandMinHz: envNumber("VITE_VAD_SPEECH_BAND_MIN_HZ", 300),
  speechBandMaxHz: envNumber("VITE_VAD_SPEECH_BAND_MAX_HZ", 3400),
  minSpeechBandRatio: envNumber("VITE_VAD_MIN_SPEECH_BAND_RATIO", 0.2),
  maxLowBandRatio: envNumber("VITE_VAD_MAX_LOW_BAND_RATIO", 0.65),
  lowBandMaxHz: envNumber("VITE_VAD_LOW_BAND_MAX_HZ", 200),
  backchannelMinPauseMs: envNumber("VITE_BACKCHANNEL_MIN_PAUSE_MS", 250),
  backchannelMinGapMs: envNumber("VITE_BACKCHANNEL_MIN_GAP_MS", 2000),
  backchannelSpeechMinMs: envNumber("VITE_BACKCHANNEL_SPEECH_MIN_MS", 2000),
  backchannelSpeechMaxMs: envNumber("VITE_BACKCHANNEL_SPEECH_MAX_MS", 4000),
  backchannelMaxConsecutive: envNumber("VITE_BACKCHANNEL_MAX_CONSECUTIVE", 2),
  activeCaptureStartDelayMs: envNumber("VITE_ACTIVE_CAPTURE_START_DELAY_MS", 100),
  activeHoldSilenceMs: envNumber("VITE_ACTIVE_HOLD_SILENCE_MS", 700),
  activeEndTurnSilenceMs: envNumber("VITE_ACTIVE_END_TURN_SILENCE_MS", 3000),
  activeNoResponseMs: envNumber("VITE_ACTIVE_NO_RESPONSE_MS", 2000),
  responseDelayMs: envNumber("VITE_RESPONSE_DELAY_MS", 150),
  userInterruptMaxLagMs: envNumber("VITE_USER_INTERRUPT_MAX_LAG_MS", 300),
  avatarInterruptAfterMs: envNumber("VITE_AVATAR_INTERRUPT_AFTER_MS", 25000),
};

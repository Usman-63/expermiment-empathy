function clampNumber(n, fallback) {
  const v = Number(n);
  return Number.isFinite(v) ? v : fallback;
}

export function rmsDbFromPcmFloat(samples, preEmphasis = 0.97) {
  const a = clampNumber(preEmphasis, 0.97);
  let prev = 0;
  let sum = 0;
  const len = samples?.length || 0;
  if (!len) return -Infinity;
  for (let i = 0; i < len; i++) {
    const x = Number(samples[i]) || 0;
    const y = x - a * prev;
    prev = x;
    sum += y * y;
  }
  const rms = Math.sqrt(sum / len);
  if (!Number.isFinite(rms) || rms <= 0) return -Infinity;
  return 20 * Math.log10(rms);
}

export function bandEnergyRatiosFromDbSpectrum(freqDb, sampleRate, fftSize, cfg) {
  const sr = clampNumber(sampleRate, 0);
  const size = clampNumber(fftSize, 0);
  if (!sr || !size || !freqDb?.length) return { speechBandRatio: 0, lowBandRatio: 0 };

  const binHz = sr / size;
  const speechMinHz = clampNumber(cfg?.speechBandMinHz, 300);
  const speechMaxHz = clampNumber(cfg?.speechBandMaxHz, 3400);
  const lowMaxHz = clampNumber(cfg?.lowBandMaxHz, 200);

  let total = 0;
  let speech = 0;
  let low = 0;

  for (let i = 0; i < freqDb.length; i++) {
    const hz = i * binHz;
    const db = Number(freqDb[i]);
    if (!Number.isFinite(db)) continue;
    const lin = Math.pow(10, db / 10);
    if (!Number.isFinite(lin) || lin <= 0) continue;
    total += lin;
    if (hz >= speechMinHz && hz <= speechMaxHz) speech += lin;
    if (hz <= lowMaxHz) low += lin;
  }

  if (!total) return { speechBandRatio: 0, lowBandRatio: 0 };
  return {
    speechBandRatio: speech / total,
    lowBandRatio: low / total,
  };
}

export function frameLooksLikeSpeech({ rmsDb, speechBandRatio, lowBandRatio }, cfg) {
  const noiseGateDb = clampNumber(cfg?.noiseGateDb, -40);
  const minSpeechBandRatio = clampNumber(cfg?.minSpeechBandRatio, 0.2);
  const maxLowBandRatio = clampNumber(cfg?.maxLowBandRatio, 0.65);

  if (!Number.isFinite(rmsDb) || rmsDb < noiseGateDb) return false;
  if (!Number.isFinite(speechBandRatio) || speechBandRatio < minSpeechBandRatio) return false;
  if (Number.isFinite(lowBandRatio) && lowBandRatio > maxLowBandRatio) return false;
  return true;
}

export function updateVadState(prevState, features, nowMs, cfg) {
  const minSpeechMs = clampNumber(cfg?.minSpeechMs, 200);
  const minSilenceMs = clampNumber(cfg?.minSilenceMs, 250);

  const prev = prevState || { isSpeaking: false, aboveSinceMs: null, silenceSinceMs: null };
  const looksSpeech = frameLooksLikeSpeech(features, cfg);

  if (looksSpeech) {
    const startAt = prev.aboveSinceMs ?? nowMs;
    const speaking = (nowMs - startAt) >= minSpeechMs;
    return {
      isSpeaking: speaking,
      aboveSinceMs: startAt,
      silenceSinceMs: null,
    };
  }

  const silenceAt = prev.silenceSinceMs ?? nowMs;
  const stillSpeaking = prev.isSpeaking && (nowMs - silenceAt) < minSilenceMs;
  return {
    isSpeaking: stillSpeaking,
    aboveSinceMs: null,
    silenceSinceMs: silenceAt,
  };
}


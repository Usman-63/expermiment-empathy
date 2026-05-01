import { useCallback, useEffect, useRef, useState } from "react";

const DEFAULTS = {
  speakingStartThreshold: 0.045,
  speakingStopThreshold: 0.03,
  smoothing: 0.8
};

function computeRms(timeDomainData) {
  let sumSquares = 0;
  for (let i = 0; i < timeDomainData.length; i += 1) {
    const centered = (timeDomainData[i] - 128) / 128;
    sumSquares += centered * centered;
  }
  return Math.sqrt(sumSquares / timeDomainData.length);
}

export function useMicVad(options = {}) {
  const opts = { ...DEFAULTS, ...options };

  const [status, setStatus] = useState("idle");
  const [error, setError] = useState(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [rms, setRms] = useState(0);

  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const streamRef = useRef(null);
  const rafIdRef = useRef(null);
  const dataRef = useRef(null);
  const speakingRef = useRef(false);
  const smoothedRef = useRef(0);

  const stop = useCallback(async () => {
    if (rafIdRef.current) {
      cancelAnimationFrame(rafIdRef.current);
      rafIdRef.current = null;
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }

    if (audioContextRef.current) {
      try {
        await audioContextRef.current.close();
      } catch {
        return null;
      } finally {
        audioContextRef.current = null;
      }
    }

    analyserRef.current = null;
    dataRef.current = null;
    speakingRef.current = false;
    smoothedRef.current = 0;
    setIsSpeaking(false);
    setRms(0);
    setStatus("stopped");
    return null;
  }, []);

  const start = useCallback(async () => {
    if (status === "starting" || status === "running") return;
    setStatus("starting");
    setError(null);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      streamRef.current = stream;

      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      audioContextRef.current = audioContext;

      const source = audioContext.createMediaStreamSource(stream);
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 2048;
      analyser.smoothingTimeConstant = 0.1;
      analyserRef.current = analyser;
      source.connect(analyser);

      const data = new Uint8Array(analyser.fftSize);
      dataRef.current = data;

      const loop = () => {
        const a = analyserRef.current;
        const d = dataRef.current;
        if (!a || !d) return;

        a.getByteTimeDomainData(d);
        const current = computeRms(d);
        const nextSmoothed = opts.smoothing * smoothedRef.current + (1 - opts.smoothing) * current;
        smoothedRef.current = nextSmoothed;
        setRms(nextSmoothed);

        const currentlySpeaking = speakingRef.current;
        if (!currentlySpeaking && nextSmoothed >= opts.speakingStartThreshold) {
          speakingRef.current = true;
          setIsSpeaking(true);
        } else if (currentlySpeaking && nextSmoothed <= opts.speakingStopThreshold) {
          speakingRef.current = false;
          setIsSpeaking(false);
        }

        rafIdRef.current = requestAnimationFrame(loop);
      };

      rafIdRef.current = requestAnimationFrame(loop);
      setStatus("running");
    } catch (e) {
      setError(e instanceof Error ? e : new Error("Failed to start microphone"));
      setStatus("error");
      await stop();
    }
  }, [opts.smoothing, opts.speakingStartThreshold, opts.speakingStopThreshold, status, stop]);

  useEffect(() => () => void stop(), [stop]);

  return {
    status,
    error,
    isSpeaking,
    rms,
    start,
    stop
  };
}


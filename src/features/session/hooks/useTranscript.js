import { useCallback, useEffect, useRef, useState } from "react";

function normalizeSpaces(s) {
  return (s || "").toString().replace(/\s+/g, " ").trim();
}

function mergeTranscript(accumulated, segment) {
  const acc = normalizeSpaces(accumulated);
  const seg = normalizeSpaces(segment);
  if (!acc) return seg;
  if (!seg) return acc;
  if (seg.startsWith(acc)) return seg;
  if (acc.startsWith(seg)) return acc;

  const accWords = acc.split(" ").filter(Boolean);
  const segWords = seg.split(" ").filter(Boolean);
  const maxOverlap = Math.min(12, accWords.length, segWords.length);
  for (let k = maxOverlap; k >= 1; k -= 1) {
    const suffix = accWords.slice(-k).join(" ");
    const prefix = segWords.slice(0, k).join(" ");
    if (suffix === prefix) return [...accWords, ...segWords.slice(k)].join(" ");
  }
  return `${acc} ${seg}`;
}

export function useTranscript() {
  const [transcript, setTranscript] = useState("");
  const [isListening, setIsListening] = useState(false);
  const recorderRef = useRef(null);
  const mediaStreamRef = useRef(null);
  const chunkQueueRef = useRef([]);
  const pumpRunningRef = useRef(false);
  const nextSeqRef = useRef(1);
  const lastSeqSentRef = useRef(0);
  const ackWaitersRef = useRef(new Map());
  const transcriptRef = useRef("");
  const accumulatedRef = useRef("");
  const onFinalRef = useRef(null);
  const onSegmentRef = useRef(null);
  const realtimeRef = useRef(null);
  const unsubscribeRef = useRef(null);
  const streamIdRef = useRef("");
  const closingRef = useRef(false);
  const finalizeTimerRef = useRef(null);
  const lastStartRef = useRef({ onFinal: null, options: null });

  const cleanupStream = useCallback(() => {
    if (finalizeTimerRef.current) {
      window.clearTimeout(finalizeTimerRef.current);
      finalizeTimerRef.current = null;
    }
    const waiters = ackWaitersRef.current;
    ackWaitersRef.current = new Map();
    for (const [, w] of waiters) {
      try { w?.reject?.(new Error("Stream closed")); } catch { /* ignore */ }
    }
    chunkQueueRef.current = [];
    pumpRunningRef.current = false;
    nextSeqRef.current = 1;
    lastSeqSentRef.current = 0;
    const rec = recorderRef.current;
    recorderRef.current = null;
    if (rec && rec.state !== "inactive") {
      try { rec.stop(); } catch { /* ignore */ }
    }
    const media = mediaStreamRef.current;
    mediaStreamRef.current = null;
    if (media) media.getTracks().forEach((t) => t.stop());
    const unsub = unsubscribeRef.current;
    unsubscribeRef.current = null;
    if (typeof unsub === "function") {
      try { unsub(); } catch { /* ignore */ }
    }
    closingRef.current = false;
    streamIdRef.current = "";
  }, []);

  const finishWithCurrentTranscript = useCallback(() => {
    if (closingRef.current) return;
    closingRef.current = true;
    setIsListening(false);
    const cb = onFinalRef.current;
    onFinalRef.current = null;
    cb?.(transcriptRef.current);
    cleanupStream();
  }, [cleanupStream]);

  const stopListening = useCallback(() => {
    const rec = recorderRef.current;
    if (rec && rec.state !== "inactive") {
      try { rec.stop(); } catch { /* ignore */ }
    }
    setIsListening(false);
    if (finalizeTimerRef.current) window.clearTimeout(finalizeTimerRef.current);
    finalizeTimerRef.current = window.setTimeout(() => {
      finishWithCurrentTranscript();
    }, 15000);
  }, [finishWithCurrentTranscript]);

  const pauseListening = useCallback(() => {
    cleanupStream();
    setIsListening(false);
  }, [cleanupStream]);

  const startListening = useCallback((onFinal, options = {}) => {
    const {
      onSegment = null,
      realtimeClient = null,
      streamLabel = "active",
      preserveTranscript = false,
    } = options || {};
    if (!realtimeClient) return;
    if (recorderRef.current) return;

    if (!preserveTranscript) {
      transcriptRef.current = "";
      accumulatedRef.current = "";
      setTranscript("");
    }
    onFinalRef.current = onFinal;
    lastStartRef.current = { onFinal, options };
    onSegmentRef.current = typeof onSegment === "function" ? onSegment : null;
    realtimeRef.current = realtimeClient;
    const streamId = crypto.randomUUID();
    streamIdRef.current = streamId;
    closingRef.current = false;
    chunkQueueRef.current = [];
    pumpRunningRef.current = false;
    nextSeqRef.current = 1;
    lastSeqSentRef.current = 0;
    ackWaitersRef.current = new Map();

    const onMessage = (msg) => {
      if (!msg || msg.stream_id !== streamIdRef.current) return;
      if (msg.type === "stt.stream.chunk.ack") {
        const seq = Number(msg.seq || 0);
        if (!seq) return;
        const w = ackWaitersRef.current.get(seq);
        if (w) {
          ackWaitersRef.current.delete(seq);
          try { w.resolve(true); } catch { /* ignore */ }
        }
        return;
      }
      if (msg.type === "stt.stream.partial" || msg.type === "stt.stream.final") {
        const full = normalizeSpaces(msg.text || "");
        if (!full) return;
        const segment = full.startsWith(accumulatedRef.current)
          ? full.slice(accumulatedRef.current.length).trim()
          : full;
        const merged = mergeTranscript(accumulatedRef.current, segment);
        transcriptRef.current = merged;
        accumulatedRef.current = merged;
        setTranscript(merged);
        onSegmentRef.current?.(segment || full, merged);
      }
      if (msg.type === "stt.stream.final") {
        finishWithCurrentTranscript();
      }
    };
    unsubscribeRef.current = realtimeClient.subscribe(onMessage);

    const blobToBase64 = (blob) => new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const dataUrl = reader.result || "";
        const b64 = (dataUrl.toString().split(",")[1] || "").trim();
        if (!b64) reject(new Error("Empty audio chunk"));
        else resolve(b64);
      };
      reader.onerror = () => reject(new Error("Failed to read audio chunk"));
      reader.readAsDataURL(blob);
    });

    const waitForAck = (seq, timeoutMs = 4000) => new Promise((resolve, reject) => {
      const t = window.setTimeout(() => {
        ackWaitersRef.current.delete(seq);
        reject(new Error("Chunk ack timeout"));
      }, Math.max(200, timeoutMs));
      ackWaitersRef.current.set(seq, {
        resolve: (v) => { window.clearTimeout(t); resolve(v); },
        reject: (e) => { window.clearTimeout(t); reject(e); },
      });
    });

    const pump = async (mimeType) => {
      if (pumpRunningRef.current) return;
      pumpRunningRef.current = true;
      try {
        while (true) {
          if (!streamIdRef.current || closingRef.current) return;
          const rt = realtimeRef.current;
          if (!rt) return;
          const next = chunkQueueRef.current.shift();
          if (!next) return;

          const { blob, seq } = next;
          try {
            const audio_base64 = await blobToBase64(blob);
            if (!streamIdRef.current) return;
            rt.send("stt.stream.chunk", {
              stream_id: streamIdRef.current,
              mime_type: mimeType,
              seq,
              audio_base64,
            });
            lastSeqSentRef.current = seq;
            await waitForAck(seq, 5000);
          } catch {
            // drop failed chunk and keep stream alive
          }
        }
      } finally {
        pumpRunningRef.current = false;
      }
    };

    void (async () => {
      try {
        const media = await navigator.mediaDevices.getUserMedia({ audio: true });
        mediaStreamRef.current = media;
        const preferred = "audio/webm;codecs=opus";
        const mimeType = MediaRecorder.isTypeSupported(preferred) ? preferred : "audio/webm";
        const rec = new MediaRecorder(media, { mimeType });
        recorderRef.current = rec;

        realtimeClient.send("stt.stream.start", { stream_id: streamId, stream_label: streamLabel, mime_type: mimeType });

        rec.ondataavailable = (e) => {
          const blob = e?.data;
          if (!blob || !blob.size) return;
          const seq = nextSeqRef.current;
          nextSeqRef.current += 1;
          chunkQueueRef.current.push({ blob, seq });
          void pump(mimeType);
        };
        rec.onstop = () => {
          void (async () => {
            if (!streamIdRef.current) return;
            const deadline = Date.now() + 12000;
            while (Date.now() < deadline) {
              if (!chunkQueueRef.current.length && !pumpRunningRef.current && !ackWaitersRef.current.size) break;
              await new Promise((r) => window.setTimeout(r, 50));
            }
            if (!streamIdRef.current) return;
            try {
              realtimeClient.send("stt.stream.stop", { stream_id: streamIdRef.current, last_seq: lastSeqSentRef.current });
            } catch { /* ignore */ }
          })();
        };
        rec.start(800);
        setIsListening(true);
      } catch {
        cleanupStream();
        setIsListening(false);
      }
    })();
  }, [cleanupStream, finishWithCurrentTranscript]);

  const resumeListening = useCallback(() => {
    if (isListening) return;
    if (recorderRef.current) return;
    const last = lastStartRef.current;
    if (!last?.onFinal || !last?.options) return;
    startListening(last.onFinal, { ...(last.options || {}), preserveTranscript: true });
  }, [isListening, startListening]);

  useEffect(() => () => cleanupStream(), [cleanupStream]);

  return { transcript, isListening, startListening, stopListening, pauseListening, resumeListening };
}

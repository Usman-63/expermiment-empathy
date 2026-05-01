import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { ChevronRight, Info, ShieldCheck, Sparkles, Timer } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function PostSessionMeasurement() {
  const navigate = useNavigate();
  const [cameraStream, setCameraStream] = useState(null);
  const [permissionError, setPermissionError] = useState("");
  const [isMeasuring, setIsMeasuring] = useState(false);
  const [progress, setProgress] = useState(0);
  const videoRef = useRef(null);

  const stopMediaStream = useCallback((stream) => {
    if (!stream) return;
    try {
      stream.getTracks().forEach((t) => t.stop());
    } catch {
      return;
    }
  }, []);

  const attachVideo = useCallback((el, stream) => {
    if (!el) return;
    try {
      el.muted = true;
      el.playsInline = true;
      el.autoplay = true;
    } catch {
      return;
    }
    try {
      el.srcObject = stream || null;
    } catch {
      return;
    }
    if (!stream) return;
    try {
      const p = el.play?.();
      if (p && typeof p.catch === "function") p.catch(() => null);
    } catch {
      return;
    }
  }, []);

  const setVideoNode = useCallback(
    (node) => {
      videoRef.current = node;
      attachVideo(node, cameraStream);
    },
    [attachVideo, cameraStream]
  );

  const requestCamera = useCallback(async () => {
    setPermissionError("");
    if (!navigator?.mediaDevices?.getUserMedia) {
      setPermissionError("Camera is not supported in this browser.");
      return null;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      setCameraStream((prev) => {
        stopMediaStream(prev);
        return stream;
      });
      attachVideo(videoRef.current, stream);
      return stream;
    } catch (e) {
      setCameraStream((prev) => {
        stopMediaStream(prev);
        return null;
      });
      setPermissionError(e?.message || "Camera permission was denied.");
      return null;
    }
  }, [attachVideo, stopMediaStream]);

  useEffect(() => {
    void requestCamera();
  }, [requestCamera]);

  useEffect(() => {
    attachVideo(videoRef.current, cameraStream);
  }, [attachVideo, cameraStream]);

  useEffect(() => {
    return () => {
      stopMediaStream(cameraStream);
    };
  }, [cameraStream]);

  useEffect(() => {
    let interval;
    if (isMeasuring) {
      interval = window.setInterval(() => {
        setProgress((prev) => {
          if (prev >= 100) {
            window.clearInterval(interval);
            return 100;
          }
          return prev + 1;
        });
      }, 300);
    }
    return () => window.clearInterval(interval);
  }, [isMeasuring]);

  useEffect(() => {
    if (progress >= 100) setIsMeasuring(false);
  }, [progress]);

  const secondsLeft = Math.max(0, 30 - Math.floor(progress * 0.3));

  const reset = () => {
    setProgress(0);
    setIsMeasuring(false);
  };

  const cleanupDevices = () => {
    stopMediaStream(cameraStream);
    setCameraStream(null);
  };

  const pageStyle = useMemo(
    () => ({
      minHeight: "100vh",
      background: "radial-gradient(ellipse at top left, #EEF2FF 0%, #F8FAFC 48%, #FFFFFF 100%)",
      color: "#0F172A",
      fontFamily:
        'ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, "Apple Color Emoji","Segoe UI Emoji"',
      overflowX: "hidden"
    }),
    []
  );

  return (
    <div style={pageStyle} className="bp-root">
      <style>{`
        .bp-root ::selection{background:#E0E7FF;color:#312E81}
        .bp-nav{position:sticky;top:0;z-index:50;width:100%;border-bottom:1px solid rgba(226,232,240,0.60);background:rgba(255,255,255,0.70);backdrop-filter: blur(12px)}
        .bp-navInner{max-width:1152px;margin:0 auto;padding:16px 24px;display:flex;align-items:center;justify-content:space-between;gap:16px}
        .bp-brand{display:flex;align-items:center;gap:12px}
        .bp-logo{width:40px;height:40px;border-radius:16px;background:linear-gradient(45deg,#4F46E5,#8B5CF6);display:flex;align-items:center;justify-content:center;box-shadow:0 10px 15px -3px rgba(199,210,254,1),0 4px 6px -4px rgba(199,210,254,1)}
        .bp-brandName{font-weight:800;color:#1E293B;line-height:1}
        .bp-brandSub{margin-top:2px;font-size:10px;font-weight:800;color:#6366F1;text-transform:uppercase;letter-spacing:-0.05em}
        .bp-stage{font-size:12px;font-weight:600;background:#EEF2FF;color:#4F46E5;padding:4px 12px;border-radius:999px;border:1px solid #E0E7FF;display:flex;align-items:center;gap:6px;white-space:nowrap}
        .bp-stageDot{width:6px;height:6px;border-radius:999px;background:#6366F1}
        .bp-stageDotLive{background:#F43F5E;animation: bpTailwindPulse 2s cubic-bezier(0.4,0,0.6,1) infinite}
        @keyframes bpTailwindPulse{0%,100%{opacity:1}50%{opacity:0.5}}
        .bp-main{max-width:1152px;margin:0 auto;padding:48px 24px}
        @media (min-width: 1024px){.bp-main{padding:64px 24px}}

        .bp-step{max-width:896px;margin:0 auto}
        .bp-calStep{width:100%}
        .bp-calGrid{display:grid;gap:24px;align-items:start}
        @media (min-width: 1024px){.bp-calGrid{grid-template-columns:repeat(12,minmax(0,1fr));gap:32px}}
        .bp-calHeaderRow{grid-column:1 / -1}
        .bp-calHeaderGrid{display:grid;gap:24px}
        @media (min-width: 1024px){.bp-calHeaderGrid{grid-template-columns:repeat(12,minmax(0,1fr));gap:32px}}
        .bp-calHeaderLeft{grid-column:1 / -1}
        @media (min-width: 1024px){.bp-calHeaderLeft{grid-column: span 7 / span 7}}
        .bp-calLeft{grid-column:1 / -1}
        .bp-calRight{grid-column:1 / -1}
        @media (min-width: 1024px){.bp-calLeft{grid-column: span 7 / span 7}.bp-calRight{grid-column: span 5 / span 5}}
        @media (min-width: 1024px){
          .bp-calGrid{align-items:stretch}
          .bp-calLeft,.bp-calRight{display:flex;flex-direction:column}
          .bp-calLeft .bp-card,.bp-calRight .bp-card{height:100%}
          .bp-calLeft .bp-aspect{aspect-ratio:auto;height:100%;min-height:360px}
        }
        .bp-cardFooter{padding:24px;display:flex;align-items:center;justify-content:flex-end}
        .bp-title{margin:0;font-size:36px;font-weight:800;letter-spacing:-0.02em;line-height:1.25;color:#0F172A}
        .bp-desc{margin:0;margin-top:16px;font-size:18px;color:#475569;line-height:1.7}
        .bp-kicker{font-size:12px;font-weight:700;color:#94A3B8;text-transform:uppercase;letter-spacing:0.10em}
        .bp-stack{display:flex;flex-direction:column;gap:16px}
        .bp-goWrap{padding-top:16px}
        .bp-card{background:rgba(255,255,255,0.80);backdrop-filter: blur(4px);border:1px solid #E2E8F0;border-radius:32px;box-shadow:0 20px 25px -5px rgba(0,0,0,0.10),0 8px 10px -6px rgba(0,0,0,0.10)}
        .bp-aspect{position:relative;aspect-ratio:16/9;background:#0F172A}
        .bp-camera{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;transform:scaleX(-1)}
        .bp-mock{position:absolute;inset:0;opacity:0.40;background:#1F2937;display:flex;align-items:center;justify-content:center}
        .bp-mockRing1{width:320px;height:320px;border:1px solid rgba(255,255,255,0.05);border-radius:999px;display:flex;align-items:center;justify-content:center}
        .bp-mockRing2{width:240px;height:240px;border:1px solid rgba(255,255,255,0.10);border-radius:999px;animation: bpTailwindPulse 2s cubic-bezier(0.4,0,0.6,1) infinite}
        .bp-timer{position:absolute;top:24px;right:24px;z-index:30}
        .bp-timerBox{background:rgba(255,255,255,0.10);backdrop-filter: blur(24px);border:1px solid rgba(255,255,255,0.20);padding:16px;border-radius:16px;display:flex;align-items:center;gap:16px}
        .bp-timerLabel{font-size:8px;color:rgba(255,255,255,0.50);font-weight:700;text-transform:uppercase;letter-spacing:0.10em}
        .bp-timerValue{margin-top:4px;font-size:18px;color:#FFFFFF;font-family:ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,"Liberation Mono","Courier New",monospace;line-height:1}
        .bp-timerIcon{width:40px;height:40px;border-radius:12px;background:rgba(99,102,241,0.20);display:flex;align-items:center;justify-content:center}
        .bp-progressOuter{position:absolute;left:0;right:0;bottom:0;height:8px;background:rgba(255,255,255,0.05)}
        .bp-progressFill{height:100%;background:#6366F1}
        .bp-start{padding:12px 32px;background:#4F46E5;color:#FFFFFF;border:none;border-radius:12px;font-weight:700;font-size:14px;box-shadow:0 10px 15px -3px rgba(224,231,255,1),0 4px 6px -4px rgba(224,231,255,1);cursor:pointer;transition:background 160ms ease}
        .bp-start:hover{background:#4338CA}
        .bp-actions{display:flex;align-items:center;gap:16px}
        .bp-retry{background:transparent;border:none;font-size:12px;font-weight:700;color:#94A3B8;text-transform:uppercase;letter-spacing:0.10em;cursor:pointer}
        .bp-retry:hover{color:#4F46E5}
        .bp-proceed{padding:12px 32px;background:#059669;color:#FFFFFF;border:none;border-radius:12px;font-weight:700;font-size:14px;box-shadow:0 10px 15px -3px rgba(209,250,229,1),0 4px 6px -4px rgba(209,250,229,1);cursor:pointer;display:flex;align-items:center;gap:8px}
        .bp-tips{margin-top:32px;display:grid;gap:16px}
        @media (min-width: 640px){.bp-tips{grid-template-columns:1fr 1fr}}
        .bp-tipsOne{display:flex;flex-direction:column;gap:16px;margin-top:0}
        .bp-tip{padding:16px;border-radius:16px;background:#FFFFFF;border:1px solid #E2E8F0;display:flex;gap:12px;align-items:flex-start}
        .bp-tipText{margin:0;font-size:11px;color:#64748B;line-height:1.7}
        .bp-footer{max-width:1152px;margin:0 auto;padding:48px 24px;border-top:1px solid rgba(226,232,240,0.60);text-align:center}
        .bp-footerText{margin:0;font-size:10px;font-weight:700;color:#94A3B8;text-transform:uppercase;letter-spacing:0.40em}
      `}</style>

      <nav className="bp-nav">
        <div className="bp-navInner">
          <div className="bp-brand">
            <div className="bp-logo">
              <Sparkles size={18} color="#FFFFFF" />
            </div>
            <div>
              <div className="bp-brandName">AI Empath</div>
              <div className="bp-brandSub">Post-Session Measurement</div>
            </div>
          </div>
          <div className="bp-stage">
            <div className={`bp-stageDot ${isMeasuring ? "bp-stageDotLive" : ""}`.trim()} />
            Stage 05 / 06
          </div>
        </div>
      </nav>

      <main className="bp-main">
        <motion.div key="step-post-session-measurement" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bp-calStep">
          <div className="bp-calGrid">
            <div className="bp-calHeaderRow">
              <div className="bp-calHeaderGrid">
                <div className="bp-calHeaderLeft">
                  <h1 className="bp-title">Post-Session Measurement</h1>
                  <p className="bp-desc">To complete the physiological analysis, we need a final 30-second recording of your resting state.</p>
                </div>
              </div>
            </div>

            <div className="bp-calLeft">
              <div className="bp-card" style={{ overflow: "hidden" }}>
                <div className="bp-aspect">
                  {cameraStream ? <video ref={setVideoNode} className="bp-camera" autoPlay muted playsInline /> : null}
                  {!cameraStream ? (
                    <div className="bp-mock">
                      <div className="bp-mockRing1">
                        <div className="bp-mockRing2" />
                      </div>
                    </div>
                  ) : null}

                  <div className="bp-timer">
                    <div className="bp-timerBox">
                      <div style={{ textAlign: "right" }}>
                        <div className="bp-timerLabel">Post-Session Timer</div>
                        <div className="bp-timerValue">{secondsLeft}s</div>
                      </div>
                      <div className="bp-timerIcon">
                        <Timer size={24} color="#818CF8" />
                      </div>
                    </div>
                  </div>

                  <div className="bp-progressOuter">
                    <motion.div className="bp-progressFill" style={{ width: `${progress}%` }} />
                  </div>
                </div>
              </div>
            </div>

            <div className="bp-calRight">
              <div className="bp-card" style={{ padding: 32 }}>
                <div className="bp-kicker">Recovery Capture</div>
                <div style={{ height: 24 }} />

                <div className="bp-stack">
                  <div className="bp-goWrap" style={{ paddingTop: 0 }}>
                    {!isMeasuring && progress < 100 ? (
                      <button
                        type="button"
                        className="bp-start"
                        style={{ width: "100%" }}
                        onClick={async () => {
                          if (!cameraStream) {
                            const stream = await requestCamera();
                            if (!stream) return;
                          }
                          setIsMeasuring(true);
                        }}
                      >
                        Start Post-Session (30s)
                      </button>
                    ) : progress >= 100 ? (
                      <div className="bp-actions">
                        <button type="button" className="bp-retry" onClick={reset}>
                          Retry
                        </button>
                        <button
                          type="button"
                          className="bp-proceed"
                          onClick={() => {
                            cleanupDevices();
                            navigate("/post-session-survey");
                          }}
                        >
                          Proceed to Survey
                          <ChevronRight size={16} />
                        </button>
                      </div>
                    ) : null}
                  </div>

                  {permissionError ? (
                    <div style={{ marginTop: 12, fontSize: 12, fontWeight: 700, color: "#EF4444", textAlign: "center" }}>{permissionError}</div>
                  ) : null}

                  <div className="bp-tips bp-tipsOne">
                    <div className="bp-tip">
                      <Info size={20} color="#818CF8" style={{ flex: "0 0 auto", marginTop: 2 }} />
                      <p className="bp-tipText">Simply look into the camera and breathe normally. There is no need to speak during this final recording.</p>
                    </div>
                    <div className="bp-tip">
                      <ShieldCheck size={20} color="#34D399" style={{ flex: "0 0 auto", marginTop: 2 }} />
                      <p className="bp-tipText">
                        The post-session measurement allows us to observe how your physiological state adjusts following the interactive session.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </main>

      <footer className="bp-footer">
        <p className="bp-footerText">© 2026 AI Empath Human-AI Lab</p>
      </footer>
    </div>
  );
}

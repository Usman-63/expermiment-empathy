import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Camera, CheckCircle2, ChevronRight, Info, Mic, Scan, ShieldCheck, Sparkles, Timer } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useSession } from "../app/providers/SessionProvider.jsx";

export default function Baseline() {
  const navigate = useNavigate();
  const { hasCompletedPreSessionSurvey } = useSession();
  const [currentStep, setCurrentStep] = useState(1);
  const [permissions, setPermissions] = useState({ camera: false, mic: false });
  const [cameraStream, setCameraStream] = useState(null);
  const [permissionError, setPermissionError] = useState("");
  const [isCalibrating, setIsCalibrating] = useState(false);
  const [progress, setProgress] = useState(0);
  const canProceedToCalibration = Boolean(permissions.camera && permissions.mic);
  const videoRef = useRef(null);
  const micStreamRef = useRef(null);

  const stopMediaStream = (stream) => {
    if (!stream) return;
    try {
      stream.getTracks().forEach((t) => t.stop());
    } catch {
      return;
    }
  };

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

  const requestCamera = async () => {
    setPermissionError("");
    if (!navigator?.mediaDevices?.getUserMedia) {
      setPermissionError("Camera is not supported in this browser.");
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      setCameraStream(stream);
      setPermissions((p) => ({ ...p, camera: true }));
    } catch (e) {
      stopMediaStream(cameraStream);
      setCameraStream(null);
      setPermissions((p) => ({ ...p, camera: false }));
      setPermissionError(e?.message || "Camera permission was denied.");
    }
  };

  const requestMic = async () => {
    setPermissionError("");
    if (!navigator?.mediaDevices?.getUserMedia) {
      setPermissionError("Microphone is not supported in this browser.");
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: false, audio: true });
      stopMediaStream(micStreamRef.current);
      micStreamRef.current = stream;
      setPermissions((p) => ({ ...p, mic: true }));
    } catch (e) {
      stopMediaStream(micStreamRef.current);
      micStreamRef.current = null;
      setPermissions((p) => ({ ...p, mic: false }));
      setPermissionError(e?.message || "Microphone permission was denied.");
    }
  };

  const disableCamera = () => {
    stopMediaStream(cameraStream);
    setCameraStream(null);
    setPermissions((p) => ({ ...p, camera: false }));
  };

  const disableMic = () => {
    stopMediaStream(micStreamRef.current);
    micStreamRef.current = null;
    setPermissions((p) => ({ ...p, mic: false }));
  };

  useEffect(() => {
    if (hasCompletedPreSessionSurvey) return;
    navigate("/pre-session-survey", { replace: true });
  }, [hasCompletedPreSessionSurvey, navigate]);

  useEffect(() => {
    attachVideo(videoRef.current, cameraStream);
  }, [attachVideo, cameraStream, currentStep]);

  useEffect(() => {
    return () => {
      stopMediaStream(cameraStream);
      stopMediaStream(micStreamRef.current);
      micStreamRef.current = null;
    };
  }, [cameraStream]);

  useEffect(() => {
    let interval;
    if (isCalibrating) {
      interval = window.setInterval(() => {
        setProgress((prev) => {
          if (prev >= 100) {
            window.clearInterval(interval);
            setIsCalibrating(false);
            return 100;
          }
          return prev + 1;
        });
      }, 300);
    }
    return () => window.clearInterval(interval);
  }, [isCalibrating]);

  const secondsLeft = Math.max(0, 30 - Math.floor(progress * 0.3));

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

  const cleanupDevices = () => {
    stopMediaStream(cameraStream);
    setCameraStream(null);
    stopMediaStream(micStreamRef.current);
    micStreamRef.current = null;
    setPermissions({ camera: false, mic: false });
  };

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

        .bp-grid{display:grid;gap:40px;align-items:start}
        @media (min-width: 1024px){.bp-grid{grid-template-columns:repeat(12,minmax(0,1fr));gap:40px}}
        .bp-permHeader{grid-column:1 / -1}
        .bp-left{grid-column:1 / -1}
        .bp-right{grid-column:1 / -1}
        @media (min-width: 1024px){.bp-left{grid-column: span 7 / span 7}.bp-right{grid-column: span 5 / span 5}}
        @media (min-width: 1024px){.bp-grid{align-items:stretch}.bp-left{display:flex;flex-direction:column}.bp-right{height:100%}.bp-left .bp-video{flex:1;height:100%}.bp-right .bp-card{height:100%;display:flex;flex-direction:column}}
        .bp-title{margin:0;font-size:36px;font-weight:800;letter-spacing:-0.02em;line-height:1.25;color:#0F172A}
        .bp-gradText{background:linear-gradient(90deg,#4F46E5,#7C3AED);-webkit-background-clip:text;background-clip:text;color:transparent}
        .bp-desc{margin:0;margin-top:16px;font-size:18px;color:#475569;line-height:1.7}
        .bp-video{position:relative;aspect-ratio:16/9;background:#F1F5F9;border-radius:40px;border:4px solid #FFFFFF;box-shadow:0 25px 50px -12px rgba(15,23,42,0.25);overflow:hidden}
        .bp-camera{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;transform:scaleX(-1)}
        .bp-dots{position:absolute;inset:0;opacity:0.03;pointer-events:none;background-image:radial-gradient(#4F46E5 1px, transparent 1px);background-size:20px 20px}
        .bp-await{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;color:#94A3B8;gap:16px}
        .bp-awaitIcon{width:80px;height:80px;border-radius:999px;background:#FFFFFF;display:flex;align-items:center;justify-content:center;box-shadow:0 1px 2px rgba(15,23,42,0.08);border:1px solid #F1F5F9}
        .bp-awaitText{font-size:14px;font-weight:600;text-transform:uppercase;letter-spacing:0.10em}
        .bp-signal{position:absolute;inset:0;display:flex;align-items:center;justify-content:center}
        .bp-signalOverlay{position:absolute;inset:0;background:rgba(99,102,241,0.05);backdrop-filter: blur(1px)}
        .bp-badge{position:absolute;left:24px;bottom:24px;display:flex;align-items:center;gap:8px;background:rgba(255,255,255,0.90);backdrop-filter: blur(12px);padding:8px 16px;border-radius:999px;border:1px solid #E2E8F0;box-shadow:0 1px 2px rgba(15,23,42,0.06)}
        .bp-badgeDot{width:8px;height:8px;border-radius:999px;background:#10B981;animation: bpTailwindPulse 2s cubic-bezier(0.4,0,0.6,1) infinite}
        .bp-badgeText{font-size:10px;font-weight:700;color:#334155;text-transform:uppercase;letter-spacing:0.10em}
        .bp-kicker{font-size:12px;font-weight:700;color:#94A3B8;text-transform:uppercase;letter-spacing:0.10em}
        .bp-stack{display:flex;flex-direction:column;gap:16px}
        .bp-toggle{width:100%;padding:20px;border-radius:16px;border:2px solid transparent;background:#F8FAFC;display:flex;align-items:center;gap:16px;cursor:pointer;transition:background 160ms ease,border-color 160ms ease}
        .bp-toggle:hover{border-color:#E2E8F0}
        .bp-toggleActive{background:#EEF2FF;border-color:#6366F1}
        .bp-tileIcon{width:48px;height:48px;border-radius:12px;display:flex;align-items:center;justify-content:center;transition:background 160ms ease,color 160ms ease}
        .bp-tileIconOff{background:#FFFFFF;color:#94A3B8;box-shadow:0 1px 2px rgba(15,23,42,0.08)}
        .bp-tileIconOn{background:#4F46E5;color:#FFFFFF}
        .bp-tileTitle{font-size:14px;font-weight:700;color:#1E293B}
        .bp-tileSub{margin-top:2px;font-size:11px;color:#64748B}
        .bp-goWrap{padding-top:16px}
        .bp-go{width:100%;padding:16px;border-radius:16px;border:none;font-weight:700;color:#FFFFFF;display:flex;align-items:center;justify-content:center;gap:8px;box-shadow:0 10px 15px -3px rgba(224,231,255,1),0 4px 6px -4px rgba(224,231,255,1);transition:filter 160ms ease, transform 120ms ease}
        .bp-go:active{transform:scale(0.99)}
        .bp-goEnabled{background:linear-gradient(90deg,#4F46E5,#7C3AED)}
        .bp-goDisabled{background:#E2E8F0;color:#94A3B8;box-shadow:none;cursor:not-allowed}

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
        .bp-head{text-align:center;margin-bottom:40px;display:flex;flex-direction:column;gap:8px}
        .bp-h2{margin:0;font-size:30px;font-weight:900;color:#0F172A}
        .bp-sub{margin:0;color:#64748B;max-width:448px;margin-left:auto;margin-right:auto}
        .bp-card{background:rgba(255,255,255,0.80);backdrop-filter: blur(4px);border:1px solid #E2E8F0;border-radius:32px;box-shadow:0 20px 25px -5px rgba(0,0,0,0.10),0 8px 10px -6px rgba(0,0,0,0.10)}
        .bp-aspect{position:relative;aspect-ratio:16/9;background:#0F172A}
        .bp-mock{position:absolute;inset:0;opacity:0.40;background:#1F2937;display:flex;align-items:center;justify-content:center}
        .bp-mockRing1{width:320px;height:320px;border:1px solid rgba(255,255,255,0.05);border-radius:999px;display:flex;align-items:center;justify-content:center}
        .bp-mockRing2{width:240px;height:240px;border:1px solid rgba(255,255,255,0.10);border-radius:999px;animation: bpTailwindPulse 2s cubic-bezier(0.4,0,0.6,1) infinite}
        @keyframes bpTailwindPulse{0%,100%{opacity:1}50%{opacity:0.5}}
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
              <div className="bp-brandSub">Baseline Protocol</div>
            </div>
          </div>
          <div className="bp-stage">
            <div className={`bp-stageDot ${isCalibrating ? "bp-stageDotLive" : ""}`.trim()} />
            Stage {currentStep === 1 ? "02" : "03"} / 07
          </div>
        </div>
      </nav>

      <main className="bp-main">
        <AnimatePresence mode="wait">
          {currentStep === 1 ? (
            <motion.div
              key="step-permissions"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="bp-grid"
            >
              <div className="bp-permHeader">
                <h1 className="bp-title">
                  Preparing for <span className="bp-gradText">Measurement</span>
                </h1>
                <p className="bp-desc">
                  To measure your physiological data, we need permission to access to your camera and microphone. Please ensure your environment is well-lit.
                </p>
              </div>

              <div className="bp-left">
                <div className="bp-video">
                  <div className="bp-dots" />
                  <video ref={setVideoNode} className="bp-camera" autoPlay muted playsInline />
                  {!permissions.camera || !cameraStream ? (
                    <div className="bp-await">
                      <div className="bp-awaitIcon">
                        <Camera size={32} />
                      </div>
                      <div className="bp-awaitText">Awaiting Access</div>
                    </div>
                  ) : (
                    <div className="bp-signal">
                      <div className="bp-signalOverlay" />
                      <div className="bp-badge">
                        <div className="bp-badgeDot" />
                        <div className="bp-badgeText">Signal Verified</div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="bp-right">
                <div className="bp-card" style={{ padding: 32 }}>
                  <div className="bp-kicker">Hardware Verification</div>
                  <div style={{ height: 24 }} />

                  <div className="bp-stack">
                    <button
                      type="button"
                      className={`bp-toggle ${permissions.camera ? "bp-toggleActive" : ""}`.trim()}
                      onClick={() => (permissions.camera ? disableCamera() : void requestCamera())}
                    >
                      <div className={`bp-tileIcon ${permissions.camera ? "bp-tileIconOn" : "bp-tileIconOff"}`.trim()}>
                        <Camera size={24} />
                      </div>
                      <div style={{ flex: 1 }}>
                        <div className="bp-tileTitle">Enable Camera</div>
                        <div className="bp-tileSub">For rPPG extraction</div>
                      </div>
                      {permissions.camera ? <CheckCircle2 size={20} color="#4F46E5" /> : null}
                    </button>

                    <button
                      type="button"
                      className={`bp-toggle ${permissions.mic ? "bp-toggleActive" : ""}`.trim()}
                      onClick={() => (permissions.mic ? disableMic() : void requestMic())}
                    >
                      <div className={`bp-tileIcon ${permissions.mic ? "bp-tileIconOn" : "bp-tileIconOff"}`.trim()}>
                        <Mic size={24} />
                      </div>
                      <div style={{ flex: 1 }}>
                        <div className="bp-tileTitle">Enable Microphone</div>
                        <div className="bp-tileSub">For vocal analysis</div>
                      </div>
                      {permissions.mic ? <CheckCircle2 size={20} color="#4F46E5" /> : null}
                    </button>
                  </div>

                  {permissionError ? (
                    <div style={{ marginTop: 12, fontSize: 12, fontWeight: 700, color: "#EF4444" }}>{permissionError}</div>
                  ) : null}

                  <div className="bp-goWrap">
                    <button
                      type="button"
                      disabled={!canProceedToCalibration}
                      onClick={() => setCurrentStep(2)}
                      className={`bp-go ${canProceedToCalibration ? "bp-goEnabled" : "bp-goDisabled"}`.trim()}
                    >
                      Initialize Calibration
                      <ChevronRight size={20} />
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          ) : null}

          {currentStep === 2 ? (
            <motion.div key="step-baseline" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="bp-calStep">
              <div className="bp-calGrid">
                <div className="bp-calHeaderRow">
                  <div className="bp-calHeaderGrid">
                    <div className="bp-calHeaderLeft">
                      <h1 className="bp-title">Establishing Baseline</h1>
                      <p className="bp-desc">Please remain still and follow the breathing guide for the next 30 seconds.</p>
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
                            <div className="bp-timerLabel">Calibration Timer</div>
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
                    <div className="bp-kicker">Baseline Calibration</div>
                    <div style={{ height: 24 }} />

                    <div className="bp-stack">
                      <div className="bp-goWrap" style={{ paddingTop: 0 }}>
                        {!isCalibrating && progress < 100 ? (
                          <button type="button" className="bp-start" style={{ width: "100%" }} onClick={() => setIsCalibrating(true)}>
                            Start Baseline (30s)
                          </button>
                        ) : progress >= 100 ? (
                          <div className="bp-actions">
                            <button
                              type="button"
                              className="bp-retry"
                              onClick={() => {
                                setProgress(0);
                                setIsCalibrating(false);
                              }}
                            >
                              Retry
                            </button>
                            <button
                              type="button"
                              className="bp-proceed"
                              onClick={() => {
                                cleanupDevices();
                                navigate("/session");
                              }}
                            >
                              Proceed to Session
                              <ChevronRight size={16} />
                            </button>
                          </div>
                        ) : null}
                      </div>

                      <div className="bp-tips bp-tipsOne">
                        <div className="bp-tip">
                          <Info size={20} color="#818CF8" style={{ flex: "0 0 auto", marginTop: 2 }} />
                          <p className="bp-tipText">
                            Sit approximately 50cm (20 inches) from the camera for the highest fidelity pulse wave detection.
                          </p>
                        </div>
                        <div className="bp-tip">
                          <ShieldCheck size={20} color="#34D399" style={{ flex: "0 0 auto", marginTop: 2 }} />
                          <p className="bp-tipText">
                            Your baseline helps us calibrate the AI&apos;s emotional empathy response to your specific physiological range.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </main>

      <footer className="bp-footer">
        <p className="bp-footerText">© 2026 AI Empath Human-AI Lab</p>
      </footer>
    </div>
  );
}

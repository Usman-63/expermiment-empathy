import React, { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Camera, CheckCircle2, ChevronRight, Mic, Scan, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function Consent() {
  const navigate = useNavigate();
  const [permissions, setPermissions] = useState({ camera: false, mic: false });
  const canProceedToBaseline = Boolean(permissions.camera && permissions.mic);

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
    <div style={pageStyle}>
      <style>{`
        .bp-nav{position:sticky;top:0;z-index:50;width:100%;border-bottom:1px solid rgba(226,232,240,0.60);background:rgba(255,255,255,0.70);backdrop-filter: blur(12px)}
        .bp-navInner{max-width:1152px;margin:0 auto;padding:16px 16px;display:flex;align-items:center;justify-content:space-between;gap:16px}
        .bp-brand{display:flex;align-items:center;gap:12px}
        .bp-logo{width:40px;height:40px;border-radius:16px;background:linear-gradient(135deg,#4F46E5,#7C3AED);display:flex;align-items:center;justify-content:center;box-shadow:0 10px 15px -3px rgba(199,210,254,0.9),0 4px 6px -4px rgba(199,210,254,0.9)}
        .bp-brandName{font-weight:800;color:#1E293B;line-height:1}
        .bp-brandSub{margin-top:2px;font-size:10px;font-weight:800;color:#6366F1;text-transform:uppercase;letter-spacing:-0.02em}
        .bp-stage{font-size:12px;font-weight:800;background:#EEF2FF;color:#4F46E5;padding:6px 12px;border-radius:999px;border:1px solid #E0E7FF;display:flex;align-items:center;gap:8px;white-space:nowrap}
        .bp-stageDot{width:6px;height:6px;border-radius:999px;background:#6366F1}
        .bp-main{max-width:1024px;margin:0 auto;padding:48px 16px}
        @media (min-width: 1024px){.bp-main{padding:64px 16px}}
        .bp-grid{display:grid;gap:40px;align-items:center}
        @media (min-width: 1024px){.bp-grid{grid-template-columns:repeat(12,minmax(0,1fr));gap:40px}}
        .bp-left{grid-column:1 / -1}
        .bp-right{grid-column:1 / -1}
        @media (min-width: 1024px){.bp-left{grid-column: span 7 / span 7}.bp-right{grid-column: span 5 / span 5}}
        .bp-title{margin:0;font-size:36px;font-weight:900;letter-spacing:-0.02em;line-height:1.15;color:#0F172A}
        .bp-gradText{background:linear-gradient(90deg,#4F46E5,#7C3AED);-webkit-background-clip:text;background-clip:text;color:transparent}
        .bp-desc{margin:0;margin-top:14px;font-size:18px;color:#475569;line-height:1.7}
        .bp-video{position:relative;aspect-ratio:16/9;background:#F1F5F9;border-radius:40px;border:4px solid #FFFFFF;box-shadow:0 25px 50px -12px rgba(15,23,42,0.25);overflow:hidden}
        .bp-dots{position:absolute;inset:0;opacity:0.03;pointer-events:none;background-image:radial-gradient(#4F46E5 1px, transparent 1px);background-size:20px 20px}
        .bp-await{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;color:#94A3B8;gap:14px}
        .bp-awaitIcon{width:80px;height:80px;border-radius:999px;background:#FFFFFF;display:flex;align-items:center;justify-content:center;box-shadow:0 1px 2px rgba(15,23,42,0.08);border:1px solid #F1F5F9}
        .bp-awaitText{font-size:12px;font-weight:800;text-transform:uppercase;letter-spacing:0.18em}
        .bp-signal{position:absolute;inset:0;display:flex;align-items:center;justify-content:center}
        .bp-signalOverlay{position:absolute;inset:0;background:rgba(79,70,229,0.05);backdrop-filter: blur(1px)}
        .bp-spinRing{width:224px;height:224px;border-radius:999px;border:2px dashed rgba(99,102,241,0.40);animation: bpSpin 30s linear infinite}
        @keyframes bpSpin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
        .bp-faceShell{position:absolute;display:flex;flex-direction:column;align-items:center}
        .bp-faceInner{width:176px;height:176px;border-radius:999px;border:2px solid rgba(255,255,255,0.80);box-shadow: inset 0 1px 0 rgba(255,255,255,0.25);display:flex;align-items:center;justify-content:center;background:rgba(255,255,255,0.10);backdrop-filter: blur(6px)}
        .bp-badge{position:absolute;left:24px;bottom:24px;display:flex;align-items:center;gap:10px;background:rgba(255,255,255,0.90);backdrop-filter: blur(12px);padding:10px 14px;border-radius:999px;border:1px solid #E2E8F0;box-shadow:0 1px 2px rgba(15,23,42,0.06)}
        .bp-badgeDot{width:8px;height:8px;border-radius:999px;background:#10B981;animation: bpPulse 1.4s ease-in-out infinite}
        @keyframes bpPulse{0%,100%{transform:scale(1);opacity:1}50%{transform:scale(1.18);opacity:0.7}}
        .bp-badgeText{font-size:10px;font-weight:900;color:#334155;text-transform:uppercase;letter-spacing:0.18em}
        .bp-card{background:rgba(255,255,255,0.80);backdrop-filter: blur(10px);border:1px solid #E2E8F0;border-radius:32px;box-shadow:0 20px 25px -5px rgba(0,0,0,0.10),0 8px 10px -6px rgba(0,0,0,0.10)}
        .bp-cardPad{padding:32px}
        .bp-kicker{font-size:12px;font-weight:900;color:#94A3B8;text-transform:uppercase;letter-spacing:0.18em}
        .bp-stack{display:flex;flex-direction:column;gap:16px}
        .bp-toggle{width:100%;padding:20px;border-radius:16px;border:2px solid transparent;background:#F8FAFC;display:flex;align-items:center;gap:16px;cursor:pointer;transition:background 160ms ease,border-color 160ms ease}
        .bp-toggle:hover{border-color:#E2E8F0}
        .bp-toggleActive{background:#EEF2FF;border-color:#4F46E5}
        .bp-tileIcon{width:48px;height:48px;border-radius:14px;display:flex;align-items:center;justify-content:center;transition:background 160ms ease,color 160ms ease}
        .bp-tileIconOff{background:#FFFFFF;color:#94A3B8;box-shadow:0 1px 2px rgba(15,23,42,0.08)}
        .bp-tileIconOn{background:#4F46E5;color:#FFFFFF}
        .bp-tileTitle{font-size:14px;font-weight:900;color:#1E293B}
        .bp-tileSub{margin-top:2px;font-size:11px;color:#64748B}
        .bp-goWrap{padding-top:10px}
        .bp-go{width:100%;padding:16px;border-radius:16px;border:none;font-weight:900;color:#FFFFFF;display:flex;align-items:center;justify-content:center;gap:10px;box-shadow:0 10px 15px -3px rgba(199,210,254,0.9),0 4px 6px -4px rgba(199,210,254,0.9);transition:filter 160ms ease, transform 120ms ease}
        .bp-go:active{transform:scale(0.99)}
        .bp-goEnabled{background:linear-gradient(90deg,#4F46E5,#7C3AED)}
        .bp-goDisabled{background:#E2E8F0;color:#94A3B8;box-shadow:none;cursor:not-allowed}
        @media (min-width: 1280px){.bp-navInner{padding:16px 24px}.bp-main{max-width:1152px}}
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
            <div className="bp-stageDot" />
            Stage 02 / 07
          </div>
        </div>
      </nav>

      <main className="bp-main">
        <AnimatePresence mode="wait">
          <motion.div
            key="step-permissions"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="bp-grid"
          >
            <div className="bp-left" style={{ display: "flex", flexDirection: "column", gap: 32 }}>
              <div>
                <h1 className="bp-title">
                  Preparing for <span className="bp-gradText">Measurement</span>
                </h1>
                <p className="bp-desc">
                  To measure your physiological data, we need permission to access to your camera and microphone. Please ensure your environment is well-lit.
                </p>
              </div>

              <div className="bp-video">
                <div className="bp-dots" />
                {!permissions.camera ? (
                  <div className="bp-await">
                    <div className="bp-awaitIcon">
                      <Camera size={32} />
                    </div>
                    <div className="bp-awaitText">Awaiting Access</div>
                  </div>
                ) : (
                  <div className="bp-signal">
                    <div className="bp-signalOverlay" />
                    <div className="bp-spinRing" />
                    <div className="bp-faceShell">
                      <div className="bp-faceInner">
                        <Scan size={32} color="rgba(79,70,229,0.50)" />
                      </div>
                    </div>
                    <div className="bp-badge">
                      <div className="bp-badgeDot" />
                      <div className="bp-badgeText">Signal Verified</div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="bp-right">
              <div className="bp-card bp-cardPad">
                <div className="bp-kicker">Hardware Verification</div>
                <div style={{ height: 16 }} />

                <div className="bp-stack">
                  <button
                    type="button"
                    className={`bp-toggle ${permissions.camera ? "bp-toggleActive" : ""}`.trim()}
                    onClick={() => setPermissions((p) => ({ ...p, camera: !p.camera }))}
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
                    onClick={() => setPermissions((p) => ({ ...p, mic: !p.mic }))}
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

                <div className="bp-goWrap">
                  <button
                    type="button"
                    disabled={!canProceedToBaseline}
                    onClick={() => navigate("/baseline-measurement")}
                    className={`bp-go ${canProceedToBaseline ? "bp-goEnabled" : "bp-goDisabled"}`.trim()}
                  >
                    Initialize Calibration
                    <ChevronRight size={20} />
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}

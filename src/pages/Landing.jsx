import React, { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Camera, ChevronRight, HeartPulse, Lock, Mic, PartyPopper, ShieldCheck, Sparkles, Stethoscope, Timer, Video } from "lucide-react";
import { useSession } from "../app/providers/SessionProvider.jsx";
import { useNavigate } from "react-router-dom";

function Card({ children, className = "", style = {} }) {
  return (
    <div className={`lp-card ${className}`.trim()} style={style}>
      {children}
    </div>
  );
}

function InputField({ label, type = "text", placeholder, icon: Icon, value, onChange, onBlur, inputProps = {}, errorText }) {
  return (
    <div className="lp-field">
      <label className="lp-label">{label}</label>
      <div className="lp-inputWrap">
        {Icon ? <Icon className="lp-inputIcon" size={16} /> : null}
        <input
          className={`lp-input ${Icon ? "lp-inputWithIcon" : ""} ${errorText ? "lp-inputError" : ""}`.trim()}
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          onBlur={onBlur}
          {...inputProps}
        />
      </div>
      {errorText ? <div className="lp-errorText">{errorText}</div> : null}
    </div>
  );
}

export default function Landing() {
  const navigate = useNavigate();
  const { ensureSessionId, resetSurveys, setParticipantName } = useSession();
  const [currentStep, setCurrentStep] = useState(1);
  const [agreed, setAgreed] = useState(false);
  const [eligibility, setEligibility] = useState({ age: false, english: false, hardware: false });
  const [registration, setRegistration] = useState({ name: "", email: "", sex: "", age: "" });
  const [touched, setTouched] = useState({ name: false, email: false, sex: false, age: false });

  const nextStep = () => setCurrentStep((prev) => Math.min(prev + 1, 7));

  const allEligible = Boolean(eligibility.age && eligibility.english && eligibility.hardware);
  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i.test(registration.email.trim());
  const nameValid = registration.name.trim().length >= 2;
  const sexValid = ["Female", "Male", "Other", "Prefer not to say"].includes(registration.sex);
  const ageNumber = Number(registration.age);
  const ageValid = /^\d+$/.test(registration.age) && Number.isInteger(ageNumber) && ageNumber >= 18;
  const registrationValid = Boolean(nameValid && emailValid && sexValid && ageValid);
  const canProceedLanding = Boolean(agreed && allEligible && registrationValid);

  const pageStyle = useMemo(
    () => ({
      minHeight: "100vh",
      background: "radial-gradient(ellipse at top left, #EEF2FF 0%, #F8FAFC 48%, #FFFFFF 100%)",
      color: "#0F172A",
      fontFamily:
        'ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, "Apple Color Emoji","Segoe UI Emoji"'
    }),
    []
  );

  useEffect(() => {
    if (currentStep === 1) return;
    ensureSessionId();
  }, [currentStep, ensureSessionId]);

  const goToBaseline = () => {
    setTouched({ name: true, email: true, sex: true, age: true });
    if (!canProceedLanding) return;
    resetSurveys();
    setParticipantName(registration.name.trim());
    ensureSessionId();
    navigate("/pre-session-survey");
  };

  return (
    <div style={pageStyle} className="lp-root">
      <style>{`
        .lp-root ::selection{background:#E0E7FF;color:#1E1B4B}
        .lp-nav{position:sticky;top:0;z-index:50;width:100%;border-bottom:1px solid rgba(226,232,240,0.6);background:rgba(255,255,255,0.70);backdrop-filter: blur(12px)}
        .lp-navInner{max-width:1280px;margin:0 auto;padding:16px 16px;display:flex;align-items:center;justify-content:space-between;gap:16px}
        .lp-brand{display:flex;align-items:center;gap:12px}
        .lp-logo{width:40px;height:40px;border-radius:16px;background:linear-gradient(135deg,#4F46E5,#7C3AED);display:flex;align-items:center;justify-content:center;box-shadow:0 10px 15px -3px rgba(199,210,254,0.9),0 4px 6px -4px rgba(199,210,254,0.9)}
        .lp-brandName{font-weight:800;color:#1E293B;line-height:1}
        .lp-brandSub{margin-top:2px;font-size:10px;font-weight:800;color:#6366F1;text-transform:uppercase;letter-spacing:-0.02em}
        .lp-navRight{display:flex;align-items:center;gap:16px;color:#94A3B8}
        .lp-stage{font-size:12px;font-weight:700;background:#F1F5F9;padding:6px 12px;border-radius:999px;color:#64748B;white-space:nowrap}
        .lp-ssl{display:none;align-items:center;gap:6px;font-size:12px;font-weight:600;color:#94A3B8;white-space:nowrap}
        @media (min-width: 640px){.lp-ssl{display:flex}}
        .lp-stepMain{max-width:1280px;margin:0 auto;padding:48px 16px;display:grid;gap:48px;align-items:start}
        @media (min-width: 1024px){.lp-stepMain{padding:80px 16px;grid-template-columns:repeat(12,minmax(0,1fr));gap:48px}}
        .lp-colLeft{grid-column: 1 / -1}
        .lp-colRight{grid-column: 1 / -1}
        @media (min-width: 1024px){.lp-colLeft{grid-column: span 7 / span 7}.lp-colRight{grid-column: span 5 / span 5}}
        .lp-heroTitle{margin:0;font-weight:900;letter-spacing:-0.02em;color:#0F172A;line-height:1.1;font-size:36px}
        @media (min-width: 768px){.lp-heroTitle{font-size:48px}}
        .lp-gradientText{background:linear-gradient(90deg,#4F46E5,#7C3AED);-webkit-background-clip:text;background-clip:text;color:transparent}
        .lp-heroDesc{margin:0;margin-top:16px;font-size:18px;color:#475569;line-height:1.7;max-width:640px}
        .lp-metricGrid{display:grid;gap:16px;margin-top:36px}
        @media (min-width: 640px){.lp-metricGrid{grid-template-columns:repeat(3,minmax(0,1fr))}}
        .lp-metric{padding:16px;border-radius:16px;background:#FFFFFF;border:1px solid #E2E8F0;box-shadow:0 1px 2px rgba(15,23,42,0.06)}
        .lp-metricLabel{margin-top:10px;font-size:14px;font-weight:800;color:#1E293B}
        .lp-metricDesc{margin-top:6px;font-size:12px;color:#64748B}
        .lp-alert{margin-top:28px;padding:16px;border-radius:12px;background:#FFFBEB;border:1px solid #FEF3C7;color:#92400E;font-size:12px;display:flex;gap:12px;align-items:flex-start}
        .lp-card{background:rgba(255,255,255,0.80);backdrop-filter: blur(12px);border:1px solid #E2E8F0;box-shadow:0 20px 25px -5px rgba(0,0,0,0.10),0 8px 10px -6px rgba(0,0,0,0.10);border-radius:24px}
        .lp-cardPad{padding:32px}
        @media (min-width: 1024px){.lp-cardPad{padding:40px}}
        .lp-cardTitle{margin:0;font-size:24px;font-weight:900;color:#1E293B}
        .lp-cardSub{margin:0;margin-top:8px;font-size:14px;color:#64748B}
        .lp-field{display:flex;flex-direction:column;gap:6px}
        .lp-label{font-size:12px;font-weight:800;color:#64748B;text-transform:uppercase;letter-spacing:0.12em;margin-left:4px}
        .lp-inputWrap{position:relative}
        .lp-inputIcon{position:absolute;left:12px;top:50%;transform:translateY(-50%);color:#94A3B8}
        .lp-inputWrap:focus-within .lp-inputIcon{color:#6366F1}
        .lp-input{width:100%;background:#F8FAFC;border:1px solid #E2E8F0;border-radius:12px;padding:12px 16px;color:#334155;outline:none;font-size:14px;transition:border-color 160ms ease, box-shadow 160ms ease}
        .lp-inputWithIcon{padding-left:40px}
        .lp-input:focus{border-color:#4F46E5;box-shadow:0 0 0 4px rgba(79,70,229,0.12)}
        .lp-input::placeholder{color:#94A3B8}
        .lp-inputError{border-color:#FCA5A5}
        .lp-inputError:focus{border-color:#EF4444;box-shadow:0 0 0 4px rgba(239,68,68,0.12)}
        .lp-errorText{margin-top:6px;margin-left:4px;font-size:12px;font-weight:700;color:#EF4444}
        .lp-hintText{margin-top:10px;font-size:12px;font-weight:700;color:#94A3B8}
        .lp-select{appearance:none;cursor:pointer}
        .lp-grid2{display:grid;gap:16px;grid-template-columns:1fr 1fr}
        .lp-elig{margin-top:6px;padding:16px;border-radius:16px;background:#F8FAFC;border:1px solid #F1F5F9}
        .lp-eligTitle{font-size:11px;font-weight:900;color:#94A3B8;text-transform:uppercase;letter-spacing:0.16em;margin-bottom:10px}
        .lp-checkRow{display:flex;align-items:center;gap:12px;cursor:pointer}
        .lp-checkRow + .lp-checkRow{margin-top:10px}
        .lp-checkLabel{font-size:12px;color:#475569;font-weight:600;transition:color 160ms ease}
        .lp-checkRow:hover .lp-checkLabel{color:#0F172A}
        .lp-checkbox{width:16px;height:16px;border-radius:4px;accent-color:#4F46E5}
        .lp-consent{margin-top:10px;padding:16px;border-radius:16px;border:2px solid transparent;background:#F8FAFC;cursor:pointer;transition:background 160ms ease,border-color 160ms ease}
        .lp-consentAgreed{background:#EEF2FF;border-color:#C7D2FE}
        .lp-consentInner{display:flex;gap:12px}
        .lp-consentMark{margin-top:2px;width:20px;height:20px;border-radius:6px;background:#E2E8F0;display:flex;align-items:center;justify-content:center;transition:background 160ms ease}
        .lp-consentAgreed .lp-consentMark{background:#4F46E5}
        .lp-consentHdr{font-size:11px;font-weight:900;color:#1E293B;text-transform:uppercase;letter-spacing:-0.01em}
        .lp-consentText{margin:0;margin-top:6px;font-size:11px;line-height:1.6;color:#64748B}
        .lp-btn{width:100%;padding:16px;border-radius:16px;border:none;font-weight:900;color:white;display:flex;align-items:center;justify-content:center;gap:10px;box-shadow:0 10px 15px -3px rgba(199,210,254,0.9),0 4px 6px -4px rgba(199,210,254,0.9);transition:filter 160ms ease, transform 120ms ease}
        .lp-btn:active{transform:scale(0.99)}
        .lp-btnEnabled{background:linear-gradient(90deg,#4F46E5,#7C3AED)}
        .lp-btnDisabled{background:#CBD5E1;cursor:not-allowed;box-shadow:none}
        .lp-stepWrap{max-width:896px;margin:0 auto;padding:48px 16px}
        .lp-stepHead{text-align:center;margin-bottom:40px}
        .lp-stepTitle{margin:0;font-size:30px;font-weight:900;color:#0F172A}
        .lp-stepSub{margin:0;margin-top:10px;color:#64748B}
        .lp-prose{max-height:240px;overflow:auto;padding-right:16px;color:#475569;border-bottom:1px solid #E2E8F0;padding-bottom:24px}
        .lp-prose h4{margin:0 0 8px 0;color:#0F172A;font-weight:900}
        .lp-prose p{margin:0 0 12px 0;line-height:1.6}
        .lp-permGrid{display:grid;gap:16px}
        @media (min-width: 768px){.lp-permGrid{grid-template-columns:1fr 1fr}}
        .lp-permCard{padding:24px;border-radius:16px;background:#F8FAFC;border:1px solid #E2E8F0;display:flex;flex-direction:column;align-items:center;text-align:center;gap:10px}
        .lp-permIcon{width:48px;height:48px;border-radius:999px;background:#FFFFFF;box-shadow:0 1px 2px rgba(15,23,42,0.08);display:flex;align-items:center;justify-content:center}
        .lp-permTitle{font-weight:900}
        .lp-permDesc{font-size:12px;color:#64748B}
        .lp-linkBtn{background:transparent;border:none;color:#4F46E5;font-weight:900;font-size:12px;cursor:pointer;padding:0}
        .lp-linkBtn:hover{text-decoration:underline}
        .lp-centerCard{padding:48px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:28px;text-align:center}
        .lp-heart{width:32px;height:32px;color:#4F46E5;animation: lpPulse 1.2s ease-in-out infinite}
        @keyframes lpPulse{0%,100%{transform:scale(1)}50%{transform:scale(1.08)}}
        .lp-bpm{font-size:28px;font-weight:900;margin-top:6px;color:#0F172A}
        .lp-bpmLabel{font-size:10px;font-weight:900;letter-spacing:0.12em;text-transform:uppercase;color:#94A3B8;margin-top:2px}
        .lp-progressOuter{width:100%;max-width:320px;background:#F1F5F9;height:8px;border-radius:999px;overflow:hidden}
        .lp-progressFill{height:100%;background:#4F46E5}
        .lp-sessionShell{max-width:1280px;margin:0 auto;padding:48px 16px;height:80vh;display:flex;flex-direction:column}
        .lp-sessionCard{flex:1;display:flex;overflow:hidden;border-radius:24px}
        .lp-sessionLeft{width:33.333%;background:#0F172A;padding:24px;display:flex;flex-direction:column;justify-content:space-between}
        .lp-sessionVideo{aspect-ratio:16/9;border-radius:12px;background:#1F2937;border:1px solid #334155;display:flex;align-items:center;justify-content:center;position:relative;overflow:hidden}
        .lp-sessionBadge{position:absolute;left:8px;bottom:8px;padding:4px 8px;background:rgba(0,0,0,0.5);color:white;font-size:10px;border-radius:6px}
        .lp-sessionDataTitle{color:white;font-size:14px;font-weight:900;border-bottom:1px solid #1F2937;padding-bottom:10px}
        .lp-sessionRow{display:flex;justify-content:space-between;font-size:12px;margin-top:10px}
        .lp-sessionLabel{color:#64748B}
        .lp-sessionValue{color:#818CF8;font-weight:900}
        .lp-sessionRight{flex:1;display:flex;flex-direction:column;background:white}
        .lp-sessionTop{padding:24px 24px;border-bottom:1px solid #E2E8F0;display:flex;justify-content:space-between;align-items:center;gap:12px}
        .lp-sessionTitle{font-weight:900;color:#1E293B}
        .lp-sessionEndBtn{background:transparent;border:none;color:#4F46E5;font-weight:900;font-size:12px;cursor:pointer}
        .lp-sessionBody{flex:1;padding:32px;display:flex;align-items:center;justify-content:center;color:#94A3B8;font-style:italic}
        .lp-surveyQ{margin-top:20px}
        .lp-qText{margin:0;font-size:14px;font-weight:900;color:#334155}
        .lp-rateRow{display:flex;gap:8px;margin-top:12px}
        .lp-rateBtn{flex:1;padding:12px;border-radius:12px;border:1px solid #E2E8F0;background:white;font-weight:900;color:#64748B;cursor:pointer;transition:background 160ms ease, border-color 160ms ease, color 160ms ease}
        .lp-rateBtn:hover{border-color:#4F46E5;background:#EEF2FF;color:#3730A3}
        .lp-finishIcon{width:96px;height:96px;border-radius:999px;background:#ECFDF5;display:flex;align-items:center;justify-content:center}
        .lp-sessionIdWrap{padding-top:32px;border-top:1px solid #E2E8F0;width:100%}
        .lp-sessionIdLabel{font-size:12px;font-weight:900;color:#94A3B8;text-transform:uppercase;margin-bottom:16px;letter-spacing:-0.02em}
        .lp-sessionIdValue{background:#F8FAFC;padding:16px;border-radius:12px;border:1px solid #F1F5F9;font-family:ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,"Liberation Mono","Courier New",monospace;color:#4F46E5;font-weight:700}
        .lp-footer{max-width:1280px;margin:0 auto;padding:48px 16px;border-top:1px solid #E2E8F0;text-align:center;color:#94A3B8}
        .lp-footerText{font-size:12px;text-transform:uppercase;letter-spacing:0.16em;font-weight:800;margin:0}
      `}</style>

      <nav className="lp-nav">
        <div className="lp-navInner">
          <div className="lp-brand">
            <div className="lp-logo">
              <Sparkles size={18} color="#FFFFFF" />
            </div>
            <div>
              <div className="lp-brandName">AI Empath</div>
              <div className="lp-brandSub">Human-AI Interaction Lab</div>
            </div>
          </div>
          <div className="lp-navRight">
            <div className="lp-stage">Stage 01 / 06</div>
            <div className="lp-ssl">
              <Lock size={14} />
              <span>SSL Encrypted</span>
            </div>
          </div>
        </div>
      </nav>

      <AnimatePresence mode="wait">
        {currentStep === 1 ? (
          <motion.main
            key="step1"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="lp-stepMain"
          >
            <div className="lp-colLeft" style={{ display: "flex", flexDirection: "column", gap: 40 }}>
              <div>
                <h1 className="lp-heroTitle">
                  Explore the <span className="lp-gradientText">Nuance of Feeling</span> with AI.
                </h1>
                <p className="lp-heroDesc">
                  You are invited to participate in a pioneering research study observing physiological synchrony during guided emotional reflection.
                </p>
                <div className="lp-metricGrid">
                  {[
                    { Icon: Camera, label: "Visual Cues", desc: "Micro-expressions" },
                    { Icon: Mic, label: "Vocal Tone", desc: "Acoustic prosody" },
                    { Icon: HeartPulse, label: "Physiology", desc: "Heart rate variability" }
                  ].map((item) => (
                    <div key={item.label} className="lp-metric">
                      <item.Icon size={20} color="#6366F1" />
                      <div className="lp-metricLabel">{item.label}</div>
                      <div className="lp-metricDesc">{item.desc}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="lp-alert">
                <Stethoscope size={20} color="#F59E0B" style={{ flex: "0 0 auto" }} />
                <p style={{ margin: 0, lineHeight: 1.6 }}>
                  <strong>Notice:</strong> This is a research interface and not a clinical diagnostic tool. If you are experiencing a mental health emergency, please contact professional services immediately.
                </p>
              </div>
            </div>

            <div className="lp-colRight">
              <Card className="lp-cardPad">
                <div style={{ marginBottom: 32 }}>
                  <h2 className="lp-cardTitle">Registration</h2>
                  <p className="lp-cardSub">Please provide your details for the study registry.</p>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                  <InputField
                    label="Participant Name"
                    placeholder="e.g. Alex Johnson"
                    value={registration.name}
                    onChange={(e) => setRegistration((prev) => ({ ...prev, name: e.target.value }))}
                    onBlur={() => setTouched((prev) => ({ ...prev, name: true }))}
                    errorText={touched.name && !nameValid ? "Enter a valid name." : ""}
                    inputProps={{ autoComplete: "name" }}
                  />
                  <InputField
                    label="Contact Email"
                    type="email"
                    placeholder="alex@research.org"
                    value={registration.email}
                    onChange={(e) => setRegistration((prev) => ({ ...prev, email: e.target.value }))}
                    onBlur={() => setTouched((prev) => ({ ...prev, email: true }))}
                    errorText={touched.email && !emailValid ? "Enter a valid email address." : ""}
                    inputProps={{ autoComplete: "email" }}
                  />

                  <div className="lp-grid2">
                    <div className="lp-field">
                      <label className="lp-label">Assigned Sex</label>
                      <div className="lp-inputWrap">
                        <select
                          className={`lp-input lp-select ${touched.sex && !sexValid ? "lp-inputError" : ""}`.trim()}
                          value={registration.sex}
                          onChange={(e) => setRegistration((prev) => ({ ...prev, sex: e.target.value }))}
                          onBlur={() => setTouched((prev) => ({ ...prev, sex: true }))}
                        >
                          <option>Select</option>
                          <option>Female</option>
                          <option>Male</option>
                          <option>Other</option>
                          <option>Prefer not to say</option>
                        </select>
                      </div>
                      {touched.sex && !sexValid ? <div className="lp-errorText">Select a value.</div> : null}
                    </div>
                    <InputField
                      label="Age"
                      type="text"
                      placeholder="25"
                      value={registration.age}
                      onChange={(e) => {
                        const digits = String(e.target.value || "").replace(/\D/g, "");
                        setRegistration((prev) => ({ ...prev, age: digits }));
                      }}
                      onBlur={() => setTouched((prev) => ({ ...prev, age: true }))}
                      errorText={touched.age && !ageValid ? "Enter an integer age (18+)." : ""}
                      inputProps={{ inputMode: "numeric", pattern: "[0-9]*", autoComplete: "off" }}
                    />
                  </div>

                  <div className="lp-elig">
                    <div className="lp-eligTitle">Eligibility</div>
                    {[
                      { key: "age", label: "I am 18 years or older" },
                      { key: "english", label: "I am comfortable communicating in English" },
                      { key: "hardware", label: "I am willing to use my camera and microphone" }
                    ].map((item) => (
                      <label key={item.key} className="lp-checkRow">
                        <input
                          type="checkbox"
                          className="lp-checkbox"
                          checked={Boolean(eligibility[item.key])}
                          onChange={() => setEligibility((prev) => ({ ...prev, [item.key]: !prev[item.key] }))}
                        />
                        <span className="lp-checkLabel">{item.label}</span>
                      </label>
                    ))}
                  </div>

                  <div onClick={() => setAgreed((v) => !v)} className={`lp-consent ${agreed ? "lp-consentAgreed" : ""}`.trim()}>
                    <div className="lp-consentInner">
                      <div className="lp-consentMark">{agreed ? <ShieldCheck size={14} color="#FFFFFF" /> : null}</div>
                      <div>
                        <div className="lp-consentHdr">Consent</div>
                        <p className="lp-consentText">I agree to A/V and physiological data collection for research.</p>
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={goToBaseline}
                    className={`lp-btn ${canProceedLanding ? "lp-btnEnabled" : "lp-btnDisabled"}`.trim()}
                    disabled={!canProceedLanding}
                  >
                    Proceed to Pre-Session Survey
                    <ChevronRight size={20} color="#FFFFFF" />
                  </button>
                  {!canProceedLanding ? (
                    <div className="lp-hintText">Complete name, email, sex, age, eligibility, and consent to continue.</div>
                  ) : null}
                </div>
              </Card>
            </div>
          </motion.main>
        ) : null}

        {currentStep === 2 ? (
          <motion.div key="step2" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="lp-stepWrap">
            <div className="lp-stepHead">
              <h1 className="lp-stepTitle">Informed Consent</h1>
              <p className="lp-stepSub">Please review and authorize device permissions to begin the study.</p>
            </div>
            <Card className="lp-cardPad" style={{ display: "flex", flexDirection: "column", gap: 32 }}>
              <div className="lp-prose">
                <h4>Research Purpose</h4>
                <p>
                  This study investigates the interaction between artificial intelligence and human emotional regulation. Your physiological signals (Heart Rate, HRV) will be estimated via camera (rPPG) and audio features.
                </p>
                <h4>Data Privacy</h4>
                <p>
                  All data is encrypted. We do not store personally identifiable information alongside your biometric signals. You may withdraw at any time by closing this tab.
                </p>
              </div>

              <div className="lp-permGrid">
                <div className="lp-permCard">
                  <div className="lp-permIcon">
                    <Video size={24} color="#6366F1" />
                  </div>
                  <div className="lp-permTitle">Camera Access</div>
                  <p className="lp-permDesc">Required for micro-expression and pulse estimation</p>
                  <button type="button" className="lp-linkBtn">
                    Request Permission
                  </button>
                </div>
                <div className="lp-permCard">
                  <div className="lp-permIcon">
                    <Mic size={24} color="#6366F1" />
                  </div>
                  <div className="lp-permTitle">Microphone Access</div>
                  <p className="lp-permDesc">Required for speech sentiment analysis</p>
                  <button type="button" className="lp-linkBtn">
                    Request Permission
                  </button>
                </div>
              </div>

              <button type="button" onClick={nextStep} className="lp-btn lp-btnEnabled">
                Start Baseline Measurement
              </button>
            </Card>
          </motion.div>
        ) : null}

        {currentStep === 3 ? (
          <motion.div key="step3" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="lp-stepWrap">
            <div className="lp-stepHead">
              <h1 className="lp-stepTitle">Baseline Measurement</h1>
              <p className="lp-stepSub">Stay still and breathe naturally for 30 seconds.</p>
            </div>
            <Card className="lp-centerCard">
              <div style={{ position: "relative", width: 192, height: 192, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <motion.div
                  style={{ position: "absolute", inset: 0, borderRadius: 999, border: "4px solid #E0E7FF" }}
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1.2, opacity: 0.5 }}
                  transition={{ repeat: Infinity, duration: 2, ease: "easeOut" }}
                />
                <div
                  style={{
                    width: 128,
                    height: 128,
                    borderRadius: 999,
                    background: "#FFFFFF",
                    border: "4px solid #4F46E5",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    boxShadow: "0 20px 25px -5px rgba(0,0,0,0.10),0 8px 10px -6px rgba(0,0,0,0.10)"
                  }}
                >
                  <HeartPulse className="lp-heart" />
                  <div className="lp-bpm">72</div>
                  <div className="lp-bpmLabel">BPM</div>
                </div>
              </div>
              <div className="lp-progressOuter">
                <motion.div
                  className="lp-progressFill"
                  initial={{ width: "0%" }}
                  animate={{ width: "100%" }}
                  transition={{ duration: 10 }}
                  onAnimationComplete={nextStep}
                />
              </div>
              <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: "#94A3B8" }}>Capturing resting state...</p>
            </Card>
          </motion.div>
        ) : null}

        {currentStep === 4 ? (
          <motion.div key="step4" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="lp-sessionShell">
            <Card className="lp-sessionCard" style={{ padding: 0 }}>
              <div className="lp-sessionLeft">
                <div className="lp-sessionVideo">
                  <Video size={32} color="#475569" />
                  <div className="lp-sessionBadge">Participant View</div>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  <div className="lp-sessionDataTitle">Session Data</div>
                  <div className="lp-sessionRow">
                    <span className="lp-sessionLabel">Duration</span>
                    <span className="lp-sessionValue">20:00</span>
                  </div>
                </div>
              </div>
              <div className="lp-sessionRight">
                <div className="lp-sessionTop">
                  <div className="lp-sessionTitle">AI Empath Session</div>
                  <button type="button" className="lp-sessionEndBtn" onClick={nextStep}>
                    End Session Early
                  </button>
                </div>
                <div className="lp-sessionBody">[ Interactive AI Dialogue Interface ]</div>
              </div>
            </Card>
          </motion.div>
        ) : null}

        {currentStep === 5 ? (
          <motion.div key="step5" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="lp-stepWrap">
            <div className="lp-stepHead">
              <h1 className="lp-stepTitle">Cool-down Measurement</h1>
              <p className="lp-stepSub">Relax for a final 30-second recording.</p>
            </div>
            <Card className="lp-cardPad" style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 24 }}>
              <div style={{ width: 80, height: 80, background: "#EEF2FF", borderRadius: 999, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Timer size={40} color="#4F46E5" />
              </div>
              <p style={{ margin: 0, textAlign: "center", color: "#475569", maxWidth: 420 }}>
                Comparing post-session physiological state to your baseline measurement.
              </p>
              <div style={{ width: "100%", maxWidth: 448, background: "#F1F5F9", height: 12, borderRadius: 999, overflow: "hidden" }}>
                <motion.div
                  style={{ height: "100%", background: "#4F46E5" }}
                  initial={{ width: "0%" }}
                  animate={{ width: "100%" }}
                  transition={{ duration: 5 }}
                  onAnimationComplete={nextStep}
                />
              </div>
            </Card>
          </motion.div>
        ) : null}

        {currentStep === 6 ? (
          <motion.div key="step6" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="lp-stepWrap">
            <div className="lp-stepHead">
              <h1 className="lp-stepTitle">Final Survey</h1>
              <p className="lp-stepSub">Your subjective experience is vital to our research.</p>
            </div>
            <Card className="lp-cardPad" style={{ display: "flex", flexDirection: "column", gap: 28 }}>
              <div>
                {[
                  "How connected did you feel to the AI assistant?",
                  "Rate the naturalness of the interaction",
                  "Did you feel your privacy was respected?"
                ].map((q) => (
                  <div key={q} className="lp-surveyQ">
                    <p className="lp-qText">{q}</p>
                    <div className="lp-rateRow">
                      {[1, 2, 3, 4, 5].map((n) => (
                        <button key={n} type="button" className="lp-rateBtn">
                          {n}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              <button type="button" onClick={nextStep} className="lp-btn lp-btnEnabled">
                Submit &amp; Finish
              </button>
            </Card>
          </motion.div>
        ) : null}

        {currentStep === 7 ? (
          <motion.div key="step7" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="lp-stepWrap">
            <div className="lp-stepHead">
              <h1 className="lp-stepTitle">Session Complete</h1>
              <p className="lp-stepSub">Thank you for your valuable contribution.</p>
            </div>
            <Card className="lp-cardPad" style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 24, textAlign: "center" }}>
              <div className="lp-finishIcon">
                <PartyPopper size={48} color="#10B981" />
              </div>
              <h2 style={{ margin: 0, fontSize: 24, fontWeight: 900, color: "#1E293B" }}>You're all set!</h2>
              <p style={{ margin: 0, color: "#64748B", maxWidth: 520 }}>
                Your data has been successfully encrypted and uploaded to our secure research server. You may now close this window.
              </p>
              <div className="lp-sessionIdWrap">
                <div className="lp-sessionIdLabel">Your Session ID</div>
                <div className="lp-sessionIdValue">EMP-882-XQ1-2026</div>
              </div>
              <div style={{ fontSize: 10, color: "#94A3B8", fontStyle: "italic" }}>Finalizing background upload... 30s remaining</div>
            </Card>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <footer className="lp-footer">
        <p className="lp-footerText">© 2026 AI Empath</p>
      </footer>
    </div>
  );
}

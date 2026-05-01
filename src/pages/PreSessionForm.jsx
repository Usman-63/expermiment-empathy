import React, { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, ChevronRight, ClipboardCheck, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useSession } from "../app/providers/SessionProvider.jsx";
import { logMetadata } from "../services/sessionApi.js";

function Card({ children, className = "", style = {}, ...rest }) {
  return (
    <div className={`psf-card ${className}`.trim()} style={style} {...rest}>
      {children}
    </div>
  );
}

function LikertScale({ questionId, value, onChange, leftLabel, rightLabel, touched }) {
  const options = [
    { label: leftLabel || "Strongly Disagree", val: 1 },
    { label: "Disagree", val: 2 },
    { label: "Neutral", val: 3 },
    { label: "Agree", val: 4 },
    { label: rightLabel || "Strongly Agree", val: 5 }
  ];

  return (
    <div className={`psf-likert ${touched && !value ? "psf-likertError" : ""}`.trim()}>
      {options.map((opt) => (
        <button
          key={opt.val}
          type="button"
          onClick={() => onChange(questionId, opt.val)}
          data-testid={`psf-${questionId}-${opt.val}`}
          className={`psf-likertBtn ${value === opt.val ? "psf-likertBtnOn" : "psf-likertBtnOff"}`.trim()}
        >
          <span className={`psf-likertLbl ${value === opt.val ? "psf-likertLblOn" : ""}`.trim()}>{opt.label}</span>
          <span className="psf-likertVal">{opt.val}</span>
        </button>
      ))}
    </div>
  );
}

function ChoiceGroup({ questionId, value, onChange, options, touched }) {
  return (
    <div className={`psf-choiceGrid ${touched && !value ? "psf-choiceError" : ""}`.trim()}>
      {options.map((opt) => (
        <button
          key={opt}
          type="button"
          onClick={() => onChange(questionId, opt)}
          data-testid={`psf-${questionId}-${opt}`}
          className={`psf-choiceBtn ${value === opt ? "psf-choiceBtnOn" : "psf-choiceBtnOff"}`.trim()}
        >
          {opt}
        </button>
      ))}
    </div>
  );
}

export default function PreSessionForm() {
  const navigate = useNavigate();
  const { sessionId, ensureSessionId, preSessionSurvey, setPreSessionSurvey, setPreSessionSurveySubmittedAt } = useSession();
  const [surveyData, setSurveyData] = useState(() => (preSessionSurvey && typeof preSessionSurvey === "object" ? preSessionSurvey : {}));
  const [touched, setTouched] = useState({});
  const [errorText, setErrorText] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const questions = useMemo(
    () => [
      { id: "q1", type: "choice", required: true, text: "Have you consumed caffeine in the past 3 hours?", options: ["Yes", "No"] },
      { id: "q2", type: "choice", required: true, text: "Have you exercised in the past 3 hours?", options: ["Yes", "No"] },
      {
        id: "q3",
        type: "choice",
        required: true,
        text: "Are you currently taking prescription medication for any of the following?",
        options: ["Blood pressure or heart condition", "Anxiety, depression, or attention/focus", "None of the above", "Prefer not to say"]
      },
      { id: "q4", type: "text", required: false, text: "(Optional) If you'd like, you may list the medication:" },
      {
        id: "q5",
        type: "likert",
        required: true,
        text: "How would you rate your current stress level right now?",
        leftLabel: "Very low",
        rightLabel: "Very high"
      },
      { id: "q6", type: "likert", required: true, text: "I feel comfortable interacting with AI systems." },
      { id: "q9", type: "likert", required: true, text: "I would feel comfortable discussing personal experiences with an AI system." },
      { id: "q10", type: "likert", required: true, text: "I trust AI systems to respond appropriately in sensitive situations." },
    ],
    []
  );

  const requiredIds = useMemo(() => questions.filter((q) => q.required).map((q) => q.id), [questions]);
  const answeredRequiredCount = useMemo(() => requiredIds.filter((id) => Boolean(surveyData[id])).length, [requiredIds, surveyData]);
  const progress = Math.round((answeredRequiredCount / requiredIds.length) * 100);
  const isComplete = answeredRequiredCount === requiredIds.length;

  const onChange = (id, val) => setSurveyData((prev) => ({ ...prev, [id]: val }));

  const markAllTouched = () => {
    const next = {};
    for (const q of questions) {
      if (q.required) next[q.id] = true;
    }
    setTouched(next);
  };

  const submit = async () => {
    setErrorText("");
    markAllTouched();
    if (!isComplete || submitting) return;

    setSubmitting(true);
    try {
      const sid = sessionId || ensureSessionId();
      const payload = {
        pre_session_form: {
          ...surveyData,
          submitted_at: new Date().toISOString()
        }
      };
      await logMetadata({ sessionId: sid, metadata: payload });
      setPreSessionSurvey(surveyData);
      setPreSessionSurveySubmittedAt(payload.pre_session_form.submitted_at);
      navigate("/baseline-measurement");
    } catch (e) {
      setErrorText(e?.message || "Failed to submit. Please try again.");
    } finally {
      setSubmitting(false);
    }
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
    <div style={pageStyle} className="psf-root">
      <style>{`
        .psf-nav{position:sticky;top:0;z-index:50;width:100%;border-bottom:1px solid rgba(226,232,240,0.60);background:rgba(255,255,255,0.70);backdrop-filter: blur(12px)}
        .psf-navInner{max-width:1152px;margin:0 auto;padding:16px 24px;display:flex;align-items:center;justify-content:space-between;gap:16px}
        .psf-brand{display:flex;align-items:center;gap:12px}
        .psf-logo{width:40px;height:40px;border-radius:16px;background:linear-gradient(45deg,#4F46E5,#8B5CF6);display:flex;align-items:center;justify-content:center;box-shadow:0 10px 15px -3px rgba(199,210,254,1),0 4px 6px -4px rgba(199,210,254,1)}
        .psf-brandName{font-weight:800;color:#1E293B;line-height:1}
        .psf-brandSub{margin-top:2px;font-size:10px;font-weight:800;color:#6366F1;text-transform:uppercase;letter-spacing:-0.05em}
        .psf-stage{font-size:12px;font-weight:600;background:#EEF2FF;color:#4F46E5;padding:6px 12px;border-radius:999px;border:1px solid #E0E7FF;display:flex;align-items:center;gap:8px;white-space:nowrap}
        .psf-main{max-width:896px;margin:0 auto;padding:48px 24px}
        @media (min-width: 1024px){.psf-main{padding:64px 24px}}
        .psf-head{text-align:center;display:flex;flex-direction:column;gap:10px}
        .psf-title{margin:0;font-size:36px;font-weight:900;letter-spacing:-0.02em;line-height:1.2;color:#0F172A}
        .psf-gradText{background:linear-gradient(90deg,#4F46E5,#7C3AED);-webkit-background-clip:text;background-clip:text;color:transparent}
        .psf-sub{margin:0;font-size:16px;color:#64748B;line-height:1.7;max-width:640px;margin-left:auto;margin-right:auto}
        .psf-progressWrap{max-width:480px;margin:0 auto;margin-top:28px}
        .psf-progressTop{display:flex;justify-content:space-between;font-size:10px;font-weight:800;color:#94A3B8;text-transform:uppercase;letter-spacing:0.18em;padding:0 4px}
        .psf-progressTrack{margin-top:10px;height:6px;width:100%;background:#E2E8F0;border-radius:999px;overflow:hidden}
        .psf-progressFill{height:100%;background:#6366F1}
        .psf-card{background:rgba(255,255,255,0.80);backdrop-filter: blur(6px);border:1px solid #E2E8F0;border-radius:32px;box-shadow:0 20px 25px -5px rgba(0,0,0,0.10),0 8px 10px -6px rgba(0,0,0,0.10)}
        .psf-qCard{padding:24px}
        @media (min-width: 768px){.psf-qCard{padding:32px}}
        .psf-qRow{display:flex;gap:16px;align-items:flex-start}
        .psf-qIdx{width:40px;height:40px;border-radius:14px;background:#EEF2FF;color:#4F46E5;display:flex;align-items:center;justify-content:center;font-weight:900;font-size:12px;flex:0 0 auto;border:1px solid #E0E7FF}
        .psf-qMeta{flex:1}
        .psf-qText{margin:0;font-size:16px;font-weight:800;color:#1E293B;line-height:1.35}
        .psf-req{margin-left:10px;font-size:10px;font-weight:900;color:#EF4444;text-transform:uppercase;letter-spacing:0.18em}
        .psf-choiceGrid{display:flex;flex-direction:column;gap:10px;margin-top:14px}
        .psf-choiceBtn{width:100%;text-align:left;padding:12px 14px;border-radius:14px;border:2px solid transparent;background:#F8FAFC;color:#475569;font-weight:800;transition:border-color 160ms ease, background 160ms ease, color 160ms ease}
        .psf-choiceBtnOff:hover{border-color:#E2E8F0}
        .psf-choiceBtnOn{background:#EEF2FF;border-color:#6366F1;color:#1E293B}
        .psf-choiceError .psf-choiceBtn{border-color:rgba(239,68,68,0.25)}
        .psf-likert{display:flex;flex-wrap:wrap;gap:10px;margin-top:14px}
        .psf-likertBtn{flex:1;min-width:90px;min-height:60px;padding:10px 10px;border-radius:14px;border:2px solid transparent;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:6px;transition:background 160ms ease,border-color 160ms ease,color 160ms ease}
        .psf-likertBtnOff{background:#F8FAFC;color:#64748B}
        .psf-likertBtnOff:hover{border-color:#E2E8F0}
        .psf-likertBtnOn{background:#4F46E5;border-color:#4F46E5;color:#FFFFFF;box-shadow:0 10px 15px -3px rgba(224,231,255,1),0 4px 6px -4px rgba(224,231,255,1)}
        .psf-likertLbl{font-size:8px;font-weight:900;text-transform:uppercase;letter-spacing:0.16em;line-height:1;color:#94A3B8;text-align:center}
        .psf-likertLblOn{color:rgba(255,255,255,0.80)}
        .psf-likertVal{font-size:16px;font-weight:900;line-height:1}
        .psf-likertError{outline:2px solid rgba(239,68,68,0.20);outline-offset:6px;border-radius:16px}
        .psf-textarea{margin-top:14px;width:100%;min-height:100px;resize:vertical;border-radius:16px;padding:14px;border:1px solid #E2E8F0;background:#F8FAFC;color:#334155;outline:none;font-size:14px;line-height:1.6}
        .psf-textarea:focus{border-color:#4F46E5;box-shadow:0 0 0 4px rgba(79,70,229,0.12)}
        .psf-error{margin-top:18px;padding:12px 14px;border-radius:14px;background:#FEF2F2;border:1px solid #FECACA;color:#B91C1C;font-size:12px;font-weight:800}
        .psf-actions{display:flex;align-items:center;justify-content:space-between;gap:16px;margin-top:26px}
        .psf-back{display:flex;align-items:center;gap:8px;border:none;background:transparent;color:#94A3B8;font-weight:900;text-transform:uppercase;letter-spacing:0.16em;font-size:11px;cursor:pointer}
        .psf-back:hover{color:#64748B}
        .psf-submit{padding:16px 22px;border-radius:18px;border:none;font-weight:900;color:#FFFFFF;display:flex;align-items:center;justify-content:center;gap:10px;box-shadow:0 10px 15px -3px rgba(224,231,255,1),0 4px 6px -4px rgba(224,231,255,1);transition:filter 160ms ease, transform 120ms ease}
        .psf-submit:active{transform:scale(0.99)}
        .psf-submitOn{background:linear-gradient(90deg,#4F46E5,#7C3AED)}
        .psf-submitOff{background:#E2E8F0;color:#94A3B8;box-shadow:none;cursor:not-allowed}
        .psf-footer{max-width:1152px;margin:0 auto;padding:48px 24px;border-top:1px solid rgba(226,232,240,0.60);text-align:center}
        .psf-footerText{margin:0;font-size:10px;font-weight:700;color:#94A3B8;text-transform:uppercase;letter-spacing:0.40em}
      `}</style>

      <nav className="psf-nav">
        <div className="psf-navInner">
          <div className="psf-brand">
            <div className="psf-logo">
              <Sparkles size={18} color="#FFFFFF" />
            </div>
            <div>
              <div className="psf-brandName">AI Empath</div>
              <div className="psf-brandSub">Pre-Session Form</div>
            </div>
          </div>
          <div className="psf-stage">
            <ClipboardCheck size={16} />
            Stage 02 / 06
          </div>
        </div>
      </nav>

      <main className="psf-main">
        <AnimatePresence mode="wait">
          <motion.div key="form" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.98 }}>
            <div className="psf-head">
              <h1 className="psf-title">
                Pre-Session <span className="psf-gradText">Check-In</span>
              </h1>
              <p className="psf-sub">
                Please answer a few quick questions before we begin. Your responses help contextualize your baseline measurements.
              </p>
            </div>

            <div className="psf-progressWrap">
              <div className="psf-progressTop">
                <span>Completion</span>
                <span>{progress}%</span>
              </div>
              <div className="psf-progressTrack">
                <motion.div className="psf-progressFill" initial={{ width: 0 }} animate={{ width: `${progress}%` }} />
              </div>
            </div>

            <div style={{ marginTop: 28, display: "flex", flexDirection: "column", gap: 16 }}>
              {questions.map((q, idx) => (
                <Card key={q.id} className="psf-qCard" data-testid={`psf-card-${q.id}`}>
                  <div className="psf-qRow">
                    <div className="psf-qIdx">{idx + 1}</div>
                    <div className="psf-qMeta">
                      <div style={{ display: "flex", alignItems: "baseline", flexWrap: "wrap", gap: 8 }}>
                        <h3 className="psf-qText">{q.text}</h3>
                        {q.required ? <span className="psf-req">Required</span> : null}
                      </div>

                      {q.type === "choice" ? (
                        <ChoiceGroup
                          questionId={q.id}
                          value={surveyData[q.id]}
                          onChange={onChange}
                          options={q.options}
                          touched={Boolean(touched[q.id])}
                        />
                      ) : null}

                      {q.type === "likert" ? (
                        <LikertScale
                          questionId={q.id}
                          value={surveyData[q.id]}
                          onChange={onChange}
                          leftLabel={q.leftLabel}
                          rightLabel={q.rightLabel}
                          touched={Boolean(touched[q.id])}
                        />
                      ) : null}

                      {q.type === "text" ? (
                        <textarea
                          className="psf-textarea"
                          value={surveyData[q.id] || ""}
                          onChange={(e) => onChange(q.id, e.target.value)}
                          data-testid={`psf-${q.id}-text`}
                          placeholder="Type here…"
                        />
                      ) : null}
                    </div>
                  </div>
                </Card>
              ))}
            </div>

            {errorText ? <div className="psf-error">{errorText}</div> : null}

            <div className="psf-actions">
              <button type="button" className="psf-back" onClick={() => navigate("/home")}>
                <ChevronLeft size={16} />
                Back
              </button>
              <button
                type="button"
                disabled={!isComplete || submitting}
                onClick={submit}
                className={`psf-submit ${isComplete && !submitting ? "psf-submitOn" : "psf-submitOff"}`.trim()}
              >
                {submitting ? "Submitting…" : "Continue to Baseline"}
                <ChevronRight size={18} />
              </button>
            </div>
          </motion.div>
        </AnimatePresence>
      </main>

      <footer className="psf-footer">
        <p className="psf-footerText">© 2026 AI Empath Human-AI Lab</p>
      </footer>
    </div>
  );
}

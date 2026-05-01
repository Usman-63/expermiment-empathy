import React, { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2, ChevronLeft, ChevronRight, ClipboardCheck, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useSession } from "../app/providers/SessionProvider.jsx";
import { logMetadata } from "../services/sessionApi.js";

function Card({ children, className = "", style = {}, ...rest }) {
  return (
    <div className={`pos-card ${className}`.trim()} style={style} {...rest}>
      {children}
    </div>
  );
}

function LikertScale({ questionId, value, onChange, touched }) {
  const options = [
    { label: "Strongly Disagree", val: 1 },
    { label: "Disagree", val: 2 },
    { label: "Neutral", val: 3 },
    { label: "Agree", val: 4 },
    { label: "Strongly Agree", val: 5 }
  ];

  return (
    <div className={`pos-likert ${touched && !value ? "pos-likertError" : ""}`.trim()}>
      {options.map((opt) => (
        <button
          key={opt.val}
          type="button"
          onClick={() => onChange(questionId, opt.val)}
          data-testid={`pos-${questionId}-${opt.val}`}
          className={`pos-likertBtn ${value === opt.val ? "pos-likertBtnOn" : "pos-likertBtnOff"}`.trim()}
        >
          <span className={`pos-likertLbl ${value === opt.val ? "pos-likertLblOn" : ""}`.trim()}>{opt.label}</span>
          <span className="pos-likertVal">{opt.val}</span>
        </button>
      ))}
    </div>
  );
}

function ChoiceGroup({ questionId, value, onChange, options, touched }) {
  return (
    <div className={`pos-choiceGrid ${touched && !value ? "pos-choiceError" : ""}`.trim()}>
      {options.map((opt) => (
        <button
          key={opt}
          type="button"
          onClick={() => onChange(questionId, opt)}
          data-testid={`pos-${questionId}-${opt}`}
          className={`pos-choiceBtn ${value === opt ? "pos-choiceBtnOn" : "pos-choiceBtnOff"}`.trim()}
        >
          {opt}
        </button>
      ))}
    </div>
  );
}

export default function PostSession() {
  const navigate = useNavigate();
  const {
    sessionId,
    ensureSessionId,
    postSessionSurvey,
    postSessionSurveySubmittedAt,
    setPostSessionSurvey,
    setPostSessionSurveySubmittedAt,
    resetSurveys
  } = useSession();
  const [surveyData, setSurveyData] = useState(() => (postSessionSurvey && typeof postSessionSurvey === "object" ? postSessionSurvey : {}));
  const [touched, setTouched] = useState({});
  const [errorText, setErrorText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(() => Boolean(postSessionSurveySubmittedAt));

  const questions = useMemo(
    () => [
      { id: "q1", type: "likert", required: true, text: "Right now, I feel more settled in my body." },
      { id: "q2", type: "likert", required: true, text: "I feel more aware of what is happening in my body." },
      { id: "q3", type: "likert", required: true, text: "I feel better able to regulate my emotional state." },
      { id: "q4", type: "likert", required: true, text: "I felt understood during this interaction." },
      { id: "q5", type: "likert", required: true, text: "The system responded in a way that felt attuned to me." },
      { id: "q6", type: "likert", required: true, text: "The interaction felt responsive rather than scripted." },
      { id: "q7", type: "likert", required: true, text: "I felt safe sharing during this interaction." },
      { id: "q8", type: "likert", required: true, text: "I did not feel judged during this interaction." },
      { id: "q9", type: "likert", required: true, text: "I felt comfortable continuing to share if I wanted to." },
      { id: "q10", type: "likert", required: true, text: "I was engaged during the interaction." },
      { id: "q11", type: "likert", required: true, text: "The pacing of the interaction felt appropriate." },
      {
        id: "q12",
        type: "choice",
        required: true,
        text: "Compared to before the session, my stress level is now:",
        options: ["Much lower", "Slightly lower", "About the same", "Slightly higher", "Much higher"]
      },
      { id: "q13", type: "likert", required: true, text: "I feel comfortable interacting with AI systems." },
      { id: "q14", type: "likert", required: true, text: "I would feel comfortable discussing personal experiences with an AI system." },
      { id: "q15", type: "likert", required: true, text: "I trust AI systems to respond appropriately in sensitive situations." },
      { id: "q16", type: "text", required: false, text: "What felt supportive about the interaction?" },
      { id: "q17", type: "text", required: false, text: "What felt unsupportive or uncomfortable?" }
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
      const submittedAt = new Date().toISOString();
      const payload = {
        post_session_survey: {
          ...surveyData,
          submitted_at: submittedAt
        }
      };
      await logMetadata({ sessionId: sid, metadata: payload });
      setPostSessionSurvey(surveyData);
      setPostSessionSurveySubmittedAt(submittedAt);
      setIsSubmitted(true);
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
    <div style={pageStyle} className="pos-root">
      <style>{`
        .pos-nav{position:sticky;top:0;z-index:50;width:100%;border-bottom:1px solid rgba(226,232,240,0.60);background:rgba(255,255,255,0.70)}
        .pos-navInner{max-width:1152px;margin:0 auto;padding:16px 24px;display:flex;align-items:center;justify-content:space-between;gap:16px}
        .pos-brand{display:flex;align-items:center;gap:12px}
        .pos-logo{width:40px;height:40px;border-radius:16px;background:linear-gradient(45deg,#4F46E5,#8B5CF6);display:flex;align-items:center;justify-content:center;box-shadow:0 10px 15px -3px rgba(199,210,254,1),0 4px 6px -4px rgba(199,210,254,1)}
        .pos-brandName{font-weight:800;color:#1E293B;line-height:1}
        .pos-brandSub{margin-top:2px;font-size:10px;font-weight:800;color:#6366F1;text-transform:uppercase;letter-spacing:-0.05em}
        .pos-stage{font-size:12px;font-weight:600;background:#EEF2FF;color:#4F46E5;padding:6px 12px;border-radius:999px;border:1px solid #E0E7FF;display:flex;align-items:center;gap:8px;white-space:nowrap}
        .pos-main{max-width:896px;margin:0 auto;padding:48px 24px}
        @media (min-width: 1024px){.pos-main{padding:64px 24px}}
        .pos-head{text-align:center;display:flex;flex-direction:column;gap:10px}
        .pos-title{margin:0;font-size:36px;font-weight:900;letter-spacing:-0.02em;line-height:1.2;color:#0F172A}
        .pos-gradText{background:linear-gradient(90deg,#4F46E5,#7C3AED);-webkit-background-clip:text;background-clip:text;color:transparent}
        .pos-sub{margin:0;font-size:16px;color:#64748B;line-height:1.7;max-width:680px;margin-left:auto;margin-right:auto}
        .pos-progressWrap{max-width:520px;margin:0 auto;margin-top:28px}
        .pos-progressTop{display:flex;justify-content:space-between;font-size:10px;font-weight:800;color:#94A3B8;text-transform:uppercase;letter-spacing:0.18em;padding:0 4px}
        .pos-progressTrack{margin-top:10px;height:6px;width:100%;background:#E2E8F0;border-radius:999px;overflow:hidden}
        .pos-progressFill{height:100%;background:#6366F1}
        .pos-card{background:rgba(255,255,255,0.80);backdrop-filter: blur(6px);border:1px solid #E2E8F0;border-radius:32px;box-shadow:0 20px 25px -5px rgba(0,0,0,0.10),0 8px 10px -6px rgba(0,0,0,0.10)}
        .pos-qCard{padding:24px}
        @media (min-width: 768px){.pos-qCard{padding:32px}}
        .pos-qRow{display:flex;gap:16px;align-items:flex-start}
        .pos-qIdx{width:40px;height:40px;border-radius:14px;background:#EEF2FF;color:#4F46E5;display:flex;align-items:center;justify-content:center;font-weight:900;font-size:12px;flex:0 0 auto;border:1px solid #E0E7FF}
        .pos-qMeta{flex:1}
        .pos-qText{margin:0;font-size:16px;font-weight:800;color:#1E293B;line-height:1.35}
        .pos-req{margin-left:10px;font-size:10px;font-weight:900;color:#EF4444;text-transform:uppercase;letter-spacing:0.18em}
        .pos-choiceGrid{display:flex;flex-direction:column;gap:10px;margin-top:14px}
        .pos-choiceBtn{width:100%;text-align:left;padding:12px 14px;border-radius:14px;border:2px solid transparent;background:#F8FAFC;color:#475569;font-weight:800;transition:border-color 160ms ease, background 160ms ease, color 160ms ease}
        .pos-choiceBtnOff:hover{border-color:#E2E8F0}
        .pos-choiceBtnOn{background:#EEF2FF;border-color:#6366F1;color:#1E293B}
        .pos-choiceError .pos-choiceBtn{border-color:rgba(239,68,68,0.25)}
        .pos-likert{display:flex;flex-wrap:wrap;gap:10px;margin-top:14px}
        .pos-likertBtn{flex:1;min-width:90px;min-height:60px;padding:10px 10px;border-radius:14px;border:2px solid transparent;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:6px;transition:background 160ms ease,border-color 160ms ease,color 160ms ease}
        .pos-likertBtnOff{background:#F8FAFC;color:#64748B}
        .pos-likertBtnOff:hover{border-color:#E2E8F0}
        .pos-likertBtnOn{background:#4F46E5;border-color:#4F46E5;color:#FFFFFF;box-shadow:0 10px 15px -3px rgba(224,231,255,1),0 4px 6px -4px rgba(224,231,255,1)}
        .pos-likertLbl{font-size:8px;font-weight:900;text-transform:uppercase;letter-spacing:0.16em;line-height:1;color:#94A3B8;text-align:center}
        .pos-likertLblOn{color:rgba(255,255,255,0.80)}
        .pos-likertVal{font-size:16px;font-weight:900;line-height:1}
        .pos-likertError{outline:2px solid rgba(239,68,68,0.20);outline-offset:6px;border-radius:16px}
        .pos-textarea{margin-top:14px;width:100%;min-height:120px;resize:vertical;border-radius:16px;padding:14px;border:1px solid #E2E8F0;background:#F8FAFC;color:#334155;outline:none;font-size:14px;line-height:1.6}
        .pos-textarea:focus{border-color:#4F46E5;box-shadow:0 0 0 4px rgba(79,70,229,0.12)}
        .pos-error{margin-top:18px;padding:12px 14px;border-radius:14px;background:#FEF2F2;border:1px solid #FECACA;color:#B91C1C;font-size:12px;font-weight:800}
        .pos-actions{display:flex;align-items:center;justify-content:space-between;gap:16px;margin-top:26px}
        .pos-back{display:flex;align-items:center;gap:8px;border:none;background:transparent;color:#94A3B8;font-weight:900;text-transform:uppercase;letter-spacing:0.16em;font-size:11px;cursor:pointer}
        .pos-back:hover{color:#64748B}
        .pos-submit{padding:16px 22px;border-radius:18px;border:none;font-weight:900;color:#FFFFFF;display:flex;align-items:center;justify-content:center;gap:10px;box-shadow:0 10px 15px -3px rgba(224,231,255,1),0 4px 6px -4px rgba(224,231,255,1);transition:filter 160ms ease, transform 120ms ease}
        .pos-submit:active{transform:scale(0.99)}
        .pos-submitOn{background:linear-gradient(90deg,#4F46E5,#7C3AED)}
        .pos-submitOff{background:#E2E8F0;color:#94A3B8;box-shadow:none;cursor:not-allowed}
        .pos-success{padding:80px 0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:22px;text-align:center}
        .pos-successGlowWrap{position:relative;display:inline-flex;align-items:center;justify-content:center}
        .pos-successGlow{position:absolute;inset:-40px;background:rgba(16,185,129,0.20);filter:blur(48px);border-radius:999px}
        .pos-successIconRing{position:relative;width:96px;height:96px;border-radius:999px;background:rgba(16,185,129,0.08);border:2px solid rgba(16,185,129,0.18);display:flex;align-items:center;justify-content:center}
        .pos-successTitle{margin:0;font-size:30px;font-weight:900;letter-spacing:-0.02em;color:#0F172A}
        .pos-successSub{margin:0;font-size:14px;color:#64748B;line-height:1.6;max-width:380px}
        .pos-successBtn{padding:14px 18px;border-radius:18px;border:none;background:#0F172A;color:#FFFFFF;font-weight:900;font-size:12px;box-shadow:0 20px 25px -5px rgba(15,23,42,0.25),0 8px 10px -6px rgba(15,23,42,0.15);cursor:pointer}
        .pos-successBtn:hover{filter:brightness(1.06)}
        .pos-footer{max-width:1152px;margin:0 auto;padding:48px 24px;border-top:1px solid rgba(226,232,240,0.60);text-align:center}
        .pos-footerText{margin:0;font-size:10px;font-weight:700;color:#94A3B8;text-transform:uppercase;letter-spacing:0.40em}
      `}</style>

      <nav className="pos-nav">
        <div className="pos-navInner">
          <div className="pos-brand">
            <div className="pos-logo">
              <Sparkles size={18} color="#FFFFFF" />
            </div>
            <div>
              <div className="pos-brandName">AI Empath</div>
              <div className="pos-brandSub">Post-Session Survey</div>
            </div>
          </div>
          <div className="pos-stage">
            <ClipboardCheck size={16} />
            Stage 06 / 06
          </div>
        </div>
      </nav>

      <main className="pos-main">
        <AnimatePresence mode="sync">
          {!isSubmitted ? (
            <motion.div key="survey" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.98 }}>
              <div className="pos-head">
                <h1 className="pos-title">
                  Experience <span className="pos-gradText">Reflection</span>
                </h1>
                <p className="pos-sub">Please provide your honest feedback on the interaction quality and how you feel right now.</p>
              </div>

              <div className="pos-progressWrap">
                <div className="pos-progressTop">
                  <span>Completion</span>
                  <span>{progress}%</span>
                </div>
                <div className="pos-progressTrack">
                  <motion.div className="pos-progressFill" initial={{ width: 0 }} animate={{ width: `${progress}%` }} />
                </div>
              </div>

              <div style={{ marginTop: 28, display: "flex", flexDirection: "column", gap: 16 }}>
                {questions.map((q, idx) => (
                  <Card key={q.id} className="pos-qCard">
                    <div className="pos-qRow">
                      <div className="pos-qIdx">{idx + 1}</div>
                      <div className="pos-qMeta">
                        <div style={{ display: "flex", alignItems: "baseline", flexWrap: "wrap", gap: 8 }}>
                          <h3 className="pos-qText">{q.text}</h3>
                          {q.required ? <span className="pos-req">Required</span> : null}
                        </div>

                        {q.type === "likert" ? (
                          <LikertScale questionId={q.id} value={surveyData[q.id]} onChange={onChange} touched={Boolean(touched[q.id])} />
                        ) : null}

                        {q.type === "choice" ? (
                          <ChoiceGroup
                            questionId={q.id}
                            value={surveyData[q.id]}
                            onChange={onChange}
                            options={q.options}
                            touched={Boolean(touched[q.id])}
                          />
                        ) : null}

                        {q.type === "text" ? (
                          <textarea
                            className="pos-textarea"
                            value={surveyData[q.id] || ""}
                            onChange={(e) => onChange(q.id, e.target.value)}
                            placeholder="Type here…"
                          />
                        ) : null}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>

              {errorText ? <div className="pos-error">{errorText}</div> : null}

              <div className="pos-actions">
                <button type="button" className="pos-back" onClick={() => navigate("/post-session-measurement")}>
                  <ChevronLeft size={16} />
                  Back
                </button>
                <button
                  type="button"
                  disabled={!isComplete || submitting}
                  onClick={submit}
                  className={`pos-submit ${isComplete && !submitting ? "pos-submitOn" : "pos-submitOff"}`.trim()}
                >
                  {submitting ? "Submitting…" : "Finalize Submission"}
                  <ChevronRight size={18} />
                </button>
              </div>
            </motion.div>
          ) : (
            <motion.div key="success" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="pos-success">
              <div className="pos-successGlowWrap">
                <div className="pos-successGlow" />
                <div className="pos-successIconRing">
                  <CheckCircle2 size={48} color="#10B981" />
                </div>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <h2 className="pos-successTitle">Feedback Received</h2>
                <p className="pos-successSub">Your qualitative insights have been successfully linked with your physiological data.</p>
              </div>
              <button
                type="button"
                className="pos-successBtn"
                onClick={() => {
                  resetSurveys();
                  navigate("/home");
                }}
              >
                Proceed to Home
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <footer className="pos-footer">
        <p className="pos-footerText">© 2026 AI Empath Human-AI Lab</p>
      </footer>
    </div>
  );
}

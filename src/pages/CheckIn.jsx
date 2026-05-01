import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function CheckIn() {
  const navigate = useNavigate();
  const [response, setResponse] = useState("");

  return (
    <div className="ea-card" style={{ maxWidth: 860, margin: "0 auto" }}>
      <div className="ea-cardHeader">
        <div>
          <h1 className="ea-h2">Check-In</h1>
          <p className="ea-textMuted" style={{ marginTop: 8 }}>
            If you would like, share any reflections about the session.
          </p>
        </div>
        <div className="ea-badge">
          <span className="ea-dot" />
          Optional
        </div>
      </div>

      <textarea
        value={response}
        onChange={(e) => setResponse(e.target.value)}
        rows={8}
        style={{
          width: "100%",
          resize: "vertical",
          borderRadius: 18,
          padding: 14,
          border: "1px solid var(--ea-border)",
          background: "rgba(255,255,255,0.55)",
          color: "var(--ea-text)",
          outline: "none"
        }}
        placeholder="Type here…"
      />

      <div style={{ display: "flex", gap: 12, marginTop: 18, flexWrap: "wrap" }}>
        <button type="button" className="ea-btn ea-btnSecondary" onClick={() => navigate("/post-session-survey")}>
          Back
        </button>
        <button type="button" className="ea-btn ea-btnPrimary" onClick={() => navigate("/home")}>
          Finish
          <span style={{ opacity: 0.95 }}>→</span>
        </button>
      </div>
    </div>
  );
}

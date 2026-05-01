import React, { useEffect, useState } from "react";

const PHASES = ["Inhale", "Hold", "Exhale", "Hold"];

export function BoxBreathing({ active, phaseDurationMs = 4000 }) {
  const [phaseIdx, setPhaseIdx] = useState(0);

  useEffect(() => {
    if (!active) {
      setPhaseIdx(0);
      return;
    }

    const start = Date.now();
    let frameId;

    const tick = () => {
      const dur = Math.max(500, Number(phaseDurationMs) || 4000);
      const phase = Math.floor((Date.now() - start) / dur) % PHASES.length;
      setPhaseIdx(phase);
      frameId = requestAnimationFrame(tick);
    };

    frameId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameId);
  }, [active, phaseDurationMs]);

  if (!active) return null;

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "rgba(0,0,0,0.55)",
        zIndex: 10,
      }}
    >
      <div
        style={{
          color: "#fff",
          fontSize: 28,
          fontWeight: 700,
          letterSpacing: "0.08em",
          textTransform: "uppercase",
        }}
      >
        {PHASES[phaseIdx]}
      </div>
    </div>
  );
}

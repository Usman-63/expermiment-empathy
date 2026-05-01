import React, { useEffect, useState } from "react";

export default function BackchannelOverlay({ event }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!event) return;
    setVisible(true);
    const t = window.setTimeout(() => setVisible(false), 1200);
    return () => window.clearTimeout(t);
  }, [event]);

  if (!event || !visible) return null;

  return (
    <div
      style={{
        position: "absolute",
        left: 16,
        bottom: 16,
        padding: "10px 12px",
        borderRadius: 10,
        background: "rgba(0,0,0,0.7)",
        color: "white",
        fontSize: 16
      }}
    >
      {event.utterance}
    </div>
  );
}


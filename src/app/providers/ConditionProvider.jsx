import React, { createContext, useContext, useEffect, useMemo, useState } from "react";

const ConditionContext = createContext(null);

function normalizeCondition(value) {
  const v = String(value || "").trim().toUpperCase();
  if (v === "A" || v === "B") return v;
  return null;
}

export function ConditionProvider({ children }) {
  const [condition, setCondition] = useState(() => {
    const fromQuery = normalizeCondition(new URLSearchParams(window.location.search).get("condition"));
    if (fromQuery) return fromQuery;
    const fromStorage = normalizeCondition(window.localStorage.getItem("empath_condition"));
    if (fromStorage) return fromStorage;
    return Math.random() < 0.5 ? "A" : "B";
  });

  useEffect(() => {
    window.localStorage.setItem("empath_condition", condition);
  }, [condition]);

  const value = useMemo(() => ({ condition, setCondition }), [condition]);

  return <ConditionContext.Provider value={value}>{children}</ConditionContext.Provider>;
}

export function useCondition() {
  const ctx = useContext(ConditionContext);
  if (!ctx) throw new Error("useCondition must be used within ConditionProvider");
  return ctx;
}

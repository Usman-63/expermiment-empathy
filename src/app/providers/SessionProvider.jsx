import React, { createContext, useContext, useEffect, useMemo, useState } from "react";

const SessionContext = createContext(null);

export function SessionProvider({ children }) {
  const [sessionId, setSessionId] = useState(() => {
    try {
      return window.localStorage.getItem("empath.sessionId");
    } catch {
      return null;
    }
  });
  const [participantName, setParticipantName] = useState(() => {
    try {
      return window.localStorage.getItem("empath.participantName") || "";
    } catch {
      return "";
    }
  });
  const [preSessionSurvey, setPreSessionSurvey] = useState(() => {
    try {
      const raw = window.localStorage.getItem("empath.preSessionSurvey");
      if (!raw) return {};
      const parsed = JSON.parse(raw);
      return parsed && typeof parsed === "object" ? parsed : {};
    } catch {
      return {};
    }
  });
  const [preSessionSurveySubmittedAt, setPreSessionSurveySubmittedAt] = useState(() => {
    try {
      return window.localStorage.getItem("empath.preSessionSurveySubmittedAt") || "";
    } catch {
      return "";
    }
  });
  const [postSessionSurvey, setPostSessionSurvey] = useState(() => {
    try {
      const raw = window.localStorage.getItem("empath.postSessionSurvey");
      if (!raw) return {};
      const parsed = JSON.parse(raw);
      return parsed && typeof parsed === "object" ? parsed : {};
    } catch {
      return {};
    }
  });
  const [postSessionSurveySubmittedAt, setPostSessionSurveySubmittedAt] = useState(() => {
    try {
      return window.localStorage.getItem("empath.postSessionSurveySubmittedAt") || "";
    } catch {
      return "";
    }
  });

  useEffect(() => {
    try {
      if (sessionId) window.localStorage.setItem("empath.sessionId", sessionId);
    } catch {
      return;
    }
  }, [sessionId]);

  useEffect(() => {
    try {
      window.localStorage.setItem("empath.participantName", participantName || "");
    } catch {
      return;
    }
  }, [participantName]);

  useEffect(() => {
    try {
      window.localStorage.setItem("empath.preSessionSurvey", JSON.stringify(preSessionSurvey || {}));
    } catch {
      return;
    }
  }, [preSessionSurvey]);

  useEffect(() => {
    try {
      window.localStorage.setItem("empath.preSessionSurveySubmittedAt", preSessionSurveySubmittedAt || "");
    } catch {
      return;
    }
  }, [preSessionSurveySubmittedAt]);

  useEffect(() => {
    try {
      window.localStorage.setItem("empath.postSessionSurvey", JSON.stringify(postSessionSurvey || {}));
    } catch {
      return;
    }
  }, [postSessionSurvey]);

  useEffect(() => {
    try {
      window.localStorage.setItem("empath.postSessionSurveySubmittedAt", postSessionSurveySubmittedAt || "");
    } catch {
      return;
    }
  }, [postSessionSurveySubmittedAt]);

  const value = useMemo(() => {
    const ensureSessionId = () => {
      if (sessionId) return sessionId;
      const next = crypto.randomUUID();
      setSessionId(next);
      return next;
    };

    const resetSurveys = () => {
      setPreSessionSurvey({});
      setPreSessionSurveySubmittedAt("");
      setPostSessionSurvey({});
      setPostSessionSurveySubmittedAt("");
    };

    const hasCompletedPreSessionSurvey = Boolean(preSessionSurveySubmittedAt);
    const hasCompletedPostSessionSurvey = Boolean(postSessionSurveySubmittedAt);

    return {
      sessionId,
      setSessionId,
      ensureSessionId,
      participantName,
      setParticipantName,
      preSessionSurvey,
      setPreSessionSurvey,
      preSessionSurveySubmittedAt,
      setPreSessionSurveySubmittedAt,
      hasCompletedPreSessionSurvey,
      postSessionSurvey,
      setPostSessionSurvey,
      postSessionSurveySubmittedAt,
      setPostSessionSurveySubmittedAt,
      hasCompletedPostSessionSurvey,
      resetSurveys
    };
  }, [participantName, postSessionSurvey, postSessionSurveySubmittedAt, preSessionSurvey, preSessionSurveySubmittedAt, sessionId]);

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession() {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error("useSession must be used within SessionProvider");
  return ctx;
}

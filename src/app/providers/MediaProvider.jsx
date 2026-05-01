import React, { createContext, useContext, useMemo, useState } from "react";

const MediaContext = createContext(null);

export function MediaProvider({ children }) {
  const [isRecording, setIsRecording] = useState(false);
  const [micPermission, setMicPermission] = useState("unknown");
  const [cameraPermission, setCameraPermission] = useState("unknown");

  const value = useMemo(
    () => ({
      isRecording,
      setIsRecording,
      micPermission,
      setMicPermission,
      cameraPermission,
      setCameraPermission
    }),
    [isRecording, micPermission, cameraPermission]
  );

  return <MediaContext.Provider value={value}>{children}</MediaContext.Provider>;
}

export function useMedia() {
  const ctx = useContext(MediaContext);
  if (!ctx) throw new Error("useMedia must be used within MediaProvider");
  return ctx;
}

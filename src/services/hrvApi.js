import { apiFetch } from "./apiClient.js";

export function processHrv({ sessionId, phase, file }) {
  const form = new FormData();
  form.append("session_id", sessionId);
  form.append("phase", phase);
  form.append("file", file);

  return apiFetch("/process-hrv", {
    method: "POST",
    body: form
  });
}

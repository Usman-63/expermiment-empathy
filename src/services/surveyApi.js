import { apiFetch } from "./apiClient.js";

export function submitSurvey({ sessionId, phase, responses }) {
  return apiFetch("/survey", {
    method: "POST",
    body: { session_id: sessionId, phase, responses }
  });
}

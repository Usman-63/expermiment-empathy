import { apiFetch } from "./apiClient.js";

export function assignCondition({ sessionId }) {
  return apiFetch("/assign-condition", {
    method: "POST",
    body: { session_id: sessionId }
  });
}

export function logSessionEvent({ sessionId, eventType, payload = {} }) {
  return apiFetch("/log-session", {
    method: "POST",
    body: { session_id: sessionId, event_type: eventType, payload }
  });
}

export function logMetadata({ sessionId, metadata }) {
  return apiFetch("/log-metadata", {
    method: "POST",
    body: { session_id: sessionId, ...metadata }
  });
}

export function createLiveKitToken({ room, identity, name }) {
  return apiFetch("/livekit/token", {
    method: "POST",
    body: { room, identity, name }
  });
}

import { apiFetch } from "./apiClient.js";

export function uploadSessionMedia({ sessionId, file, kind }) {
  const form = new FormData();
  form.append("session_id", sessionId);
  form.append("kind", kind);
  form.append("file", file);

  return apiFetch("/upload-session", {
    method: "POST",
    body: form
  });
}

export function uploadAudioChunk({ sessionId, chunkBlob, startedAtMs, endedAtMs }) {
  const form = new FormData();
  form.append("session_id", sessionId);
  form.append("started_at_ms", String(startedAtMs));
  form.append("ended_at_ms", String(endedAtMs));
  form.append("file", chunkBlob, "chunk.webm");

  return apiFetch("/process-audio", {
    method: "POST",
    body: form
  });
}

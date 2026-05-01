function toWsUrl(httpBase) {
  const url = (httpBase || "").toString().trim();
  if (url.startsWith("https://")) return `wss://${url.slice("https://".length)}`;
  if (url.startsWith("http://")) return `ws://${url.slice("http://".length)}`;
  return url;
}

export function createRealtimeClient({ apiBaseUrl, sessionId, onMessage, onConnectionStatus } = {}) {
  const base = toWsUrl(apiBaseUrl);
  const wsUrl = `${base}/ws/sessions/${sessionId}`;
  let ws = null;
  let opened = false;
  const pending = new Map();
  const messageListeners = new Set();
  if (typeof onMessage === "function") messageListeners.add(onMessage);
  let openPromise = null;

  const updateConnectionStatus = (status) => {
    if (typeof onConnectionStatus === "function") onConnectionStatus(status);
  };

  function connect() {
    if (ws && ws.readyState === WebSocket.OPEN) return Promise.resolve(true);
    if (ws && ws.readyState === WebSocket.CONNECTING && openPromise) return openPromise;
    if (ws && (ws.readyState === WebSocket.CLOSING || ws.readyState === WebSocket.CLOSED)) {
      ws = null;
      openPromise = null;
    }

    ws = new WebSocket(wsUrl);
    updateConnectionStatus("connecting");
    openPromise = new Promise((resolve, reject) => {
      const timeout = window.setTimeout(() => reject(new Error("WebSocket open timeout")), 6000);
      ws.onopen = () => {
        window.clearTimeout(timeout);
        opened = true;
        updateConnectionStatus("open");
        try { ws.send(JSON.stringify({ type: "hello" })); } catch {}
        resolve(true);
      };
      ws.onclose = () => {
        window.clearTimeout(timeout);
        opened = false;
        ws = null;
        openPromise = null;
        updateConnectionStatus("closed");
        for (const [, p] of pending) p.reject(new Error("WebSocket closed"));
        pending.clear();
        reject(new Error("WebSocket closed"));
      };
      ws.onerror = () => {};
      ws.onmessage = (ev) => {
        let msg = null;
        try { msg = JSON.parse(ev.data); } catch { msg = null; }
        if (!msg) return;
        const rid = msg.request_id;
        if (rid && pending.has(rid)) {
          const p = pending.get(rid);
          pending.delete(rid);
          p.resolve(msg);
        }
        for (const fn of messageListeners) {
          try { fn(msg); } catch { /* ignore listener errors */ }
        }
      };
    });
    return openPromise;
  }

  function close() {
    opened = false;
    updateConnectionStatus("closed");
    try { ws?.close(); } catch {}
    ws = null;
    openPromise = null;
    for (const [, p] of pending) p.reject(new Error("WebSocket closed"));
    pending.clear();
  }

  function send(type, payload = {}) {
    if (!ws) connect();
    if (!ws || ws.readyState !== WebSocket.OPEN) return;
    try { ws.send(JSON.stringify({ type, ...payload })); } catch {}
  }

  function request(type, payload = {}, timeoutMs = 8000) {
    const request_id = crypto.randomUUID();
    return new Promise((resolve, reject) => {
      const t = window.setTimeout(() => {
        pending.delete(request_id);
        reject(new Error("WebSocket request timeout"));
      }, timeoutMs);
      pending.set(request_id, {
        resolve: (msg) => { window.clearTimeout(t); resolve(msg); },
        reject: (err) => { window.clearTimeout(t); reject(err); },
      });
      const start = Date.now();
      const waitForOpen = async () => {
        if (ws && ws.readyState === WebSocket.OPEN) return;
        const p = connect();
        const remaining = Math.max(0, timeoutMs - (Date.now() - start));
        if (!p) throw new Error("WebSocket not initialized");
        if (!remaining) throw new Error("WebSocket request timeout");
        await Promise.race([
          p,
          new Promise((_, r) => window.setTimeout(() => r(new Error("WebSocket request timeout")), remaining)),
        ]);
      };

      let attempt = 0;
      const trySend = async () => {
        try {
          await waitForOpen();
          if (!ws || ws.readyState !== WebSocket.OPEN) throw new Error("WebSocket not open");
          ws.send(JSON.stringify({ type, request_id, ...payload }));
        } catch (e) {
          const retryable = [
            "WebSocket closed",
            "WebSocket request timeout",
            "WebSocket open timeout",
            "WebSocket not open",
          ].includes(e?.message);
          if (retryable && attempt < 1) {
            attempt += 1;
            ws = null;
            openPromise = null;
            updateConnectionStatus("reconnecting");
            await new Promise((r) => window.setTimeout(r, 200));
            return trySend();
          }
          pending.delete(request_id);
          window.clearTimeout(t);
          reject(e);
        }
      };

      void trySend();
    });
  }

  function isReady() {
    return opened && ws && ws.readyState === WebSocket.OPEN;
  }

  function subscribe(handler) {
    if (typeof handler !== "function") return () => {};
    messageListeners.add(handler);
    return () => { messageListeners.delete(handler); };
  }

  return {
    connect,
    close,
    isReady,
    send,
    request,
    subscribe,
  };
}

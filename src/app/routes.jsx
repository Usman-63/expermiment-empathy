import React from "react";
import { Link, Navigate, Outlet, createBrowserRouter, useLocation } from "react-router-dom";
import Landing from "../pages/Landing.jsx";
import PreSessionForm from "../pages/PreSessionForm.jsx";
import Baseline from "../pages/Baseline.jsx";
import Session from "../pages/Session.jsx";
import PostSessionMeasurement from "../pages/PostSessionMeasurement.jsx";
import PostSession from "../pages/PostSession.jsx";
import CheckIn from "../pages/CheckIn.jsx";

function NotFound() {
  return (
    <div className="ea-card">
      <div className="ea-cardHeader">
        <h1 className="ea-h2">Not Found</h1>
      </div>
      <p className="ea-textMuted">The page you requested does not exist.</p>
      <div style={{ marginTop: 16 }}>
        <Link className="ea-btn ea-btnSecondary" to="/home">
          Go Home
        </Link>
      </div>
    </div>
  );
}

function Icon({ name, size = 20 }) {
  const common = {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "2",
    strokeLinecap: "round",
    strokeLinejoin: "round"
  };

  switch (name) {
    case "ai":
      return (
        <svg {...common}>
          <path d="M12 7.5v9" />
          <path d="M8.5 12h7" />
          <rect x="6" y="6" width="12" height="12" rx="3" />
          <path d="M9 2v3" />
          <path d="M15 2v3" />
          <path d="M9 19v3" />
          <path d="M15 19v3" />
          <path d="M2 9h3" />
          <path d="M2 15h3" />
          <path d="M19 9h3" />
          <path d="M19 15h3" />
        </svg>
      );
    case "clock":
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="9" />
          <path d="M12 7v6l4 2" />
        </svg>
      );
    case "settings":
      return (
        <svg {...common}>
          <path d="M12 15.5A3.5 3.5 0 1 0 12 8.5a3.5 3.5 0 0 0 0 7z" />
          <path d="M19.4 15a7.9 7.9 0 0 0 .1-2l2-1.2-2-3.4-2.3.6a7.6 7.6 0 0 0-1.7-1L14.9 4h-3.8l-.6 2.4a7.6 7.6 0 0 0-1.7 1L6.5 6.8l-2 3.4 2 1.2a7.9 7.9 0 0 0 .1 2l-2 1.2 2 3.4 2.3-.6a7.6 7.6 0 0 0 1.7 1l.6 2.4h3.8l.6-2.4a7.6 7.6 0 0 0 1.7-1l2.3.6 2-3.4z" />
        </svg>
      );
    case "shield":
      return (
        <svg {...common}>
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        </svg>
      );
    case "spark":
      return (
        <svg {...common}>
          <path d="M12 2l1.5 5.5L19 9l-5.5 1.5L12 16l-1.5-5.5L5 9l5.5-1.5z" />
          <path d="M4 14l.8 3.2L8 18l-3.2.8L4 22l-.8-3.2L0 18l3.2-.8z" />
        </svg>
      );
    default:
      return null;
  }
}

function AppLayout() {
  const location = useLocation();
  const isFullPage =
    location.pathname === "/" ||
    location.pathname === "/home" ||
    location.pathname === "/consent" ||
    location.pathname === "/pre-session" ||
    location.pathname === "/pre-session-survey" ||
    location.pathname === "/baseline" ||
    location.pathname === "/baseline-measurement" ||
    location.pathname === "/session" ||
    location.pathname === "/post-session-measurement" ||
    location.pathname === "/post-session" ||
    location.pathname === "/post-session-survey";

  return (
    <div className="ea-shell">
      <style>{`
        :root{
          --ea-bg:#FFFFFF;
          --ea-panel:rgba(255,255,255,0.82);
          --ea-card:#FFFFFF;
          --ea-border:#E2E8F0;
          --ea-text:#0F172A;
          --ea-muted:#64748B;
          --ea-indigo:#4F46E5;
          --ea-indigo2:#7C3AED;
          --ea-emerald:#10B981;
          --ea-shadow: 0 18px 50px rgba(15, 23, 42, 0.10);
          --ea-shadow2: 0 10px 30px rgba(79, 70, 229, 0.16);
          color-scheme: light;
        }
        *{box-sizing:border-box}
        body{margin:0;background:var(--ea-bg);color:var(--ea-text);font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, "Apple Color Emoji","Segoe UI Emoji"}
        a{color:inherit;text-decoration:none}
        .ea-shell{min-height:100vh;background:radial-gradient(900px 500px at 80% 20%, rgba(79,70,229,0.10), transparent 60%),radial-gradient(900px 500px at 15% 90%, rgba(124,58,237,0.10), transparent 55%),var(--ea-bg)}
        .ea-nav{position:sticky;top:0;z-index:50;display:flex;align-items:center;justify-content:space-between;padding:10px 18px;border-bottom:1px solid var(--ea-border);background:var(--ea-panel);backdrop-filter: blur(10px)}
        .ea-brand{display:flex;align-items:center;gap:12px}
        .ea-logo{width:34px;height:34px;border-radius:12px;display:flex;align-items:center;justify-content:center;background:linear-gradient(135deg, var(--ea-indigo), var(--ea-indigo2));box-shadow:var(--ea-shadow2);color:white}
        .ea-title{margin:0;font-size:16px;letter-spacing:-0.02em}
        .ea-subtitle{margin:2px 0 0 0;font-size:10px;letter-spacing:0.18em;text-transform:uppercase;color:var(--ea-muted);font-weight:700}
        .ea-iconBtn{width:40px;height:40px;border-radius:999px;border:1px solid var(--ea-border);background:rgba(255,255,255,0.35);color:var(--ea-muted);display:flex;align-items:center;justify-content:center;cursor:pointer}
        .ea-container{max-width:1100px;margin:0 auto;padding:40px 20px 96px}
        @media (min-width: 1024px){.ea-container{padding:72px 24px 96px}}
        .ea-card{border:1px solid var(--ea-border);background:var(--ea-card);border-radius:28px;box-shadow: var(--ea-shadow);padding:22px}
        .ea-cardHeader{display:flex;align-items:flex-start;justify-content:space-between;gap:16px;margin-bottom:12px}
        .ea-h2{margin:0;font-size:22px;letter-spacing:-0.02em}
        .ea-textMuted{margin:0;color:var(--ea-muted);line-height:1.6}
        .ea-badge{display:inline-flex;align-items:center;gap:10px;padding:8px 12px;border-radius:999px;border:1px solid var(--ea-border);background:rgba(255,255,255,0.6);font-size:12px;font-weight:700;color:var(--ea-muted)}
        .ea-dot{width:10px;height:10px;border-radius:999px;background:#94A3B8}
        .ea-dotActive{background:var(--ea-emerald);box-shadow:0 0 0 6px rgba(16,185,129,0.12);animation: eaPulse 1.4s ease-in-out infinite}
        @keyframes eaPulse{0%,100%{transform:scale(1)}50%{transform:scale(1.15)}}
        .ea-footer{position:fixed;bottom:0;left:0;right:0;display:flex;justify-content:space-between;align-items:center;padding:14px 28px;border-top:1px solid var(--ea-border);background:var(--ea-panel);backdrop-filter: blur(10px);font-size:11px;letter-spacing:0.14em;text-transform:uppercase;color:var(--ea-muted);font-weight:800}
        .ea-footer a{opacity:0.9}
        .ea-footer a:hover{color:var(--ea-indigo)}
        .ea-btn{display:inline-flex;align-items:center;justify-content:center;gap:10px;padding:14px 18px;border-radius:18px;border:1px solid transparent;font-weight:800;cursor:pointer}
        .ea-btnPrimary{background:linear-gradient(135deg, var(--ea-indigo), var(--ea-indigo2));color:white;box-shadow:var(--ea-shadow2)}
        .ea-btnPrimary:active{transform:scale(0.985)}
        .ea-btnSecondary{background:rgba(255,255,255,0.55);color:var(--ea-text);border-color:var(--ea-border)}
        .ea-btnSecondary:hover{border-color:rgba(79,70,229,0.4)}
        .ea-grid{display:grid;grid-template-columns:1fr;gap:22px}
        @media (min-width: 1024px){.ea-grid{grid-template-columns: 1.3fr 0.9fr;gap:34px;align-items:start}}
        .ea-statGrid{display:grid;grid-template-columns:1fr 1fr;gap:12px}
        @media (min-width: 640px){.ea-statGrid{grid-template-columns:1fr 1fr 1fr}}
        .ea-stat{padding:14px 14px 12px;border-radius:18px;border:1px solid var(--ea-border);background:rgba(255,255,255,0.55)}
        .ea-statLabel{font-size:11px;letter-spacing:0.12em;text-transform:uppercase;color:var(--ea-muted);font-weight:900;margin:0 0 8px}
        .ea-statValue{margin:0;font-weight:800}
        .ea-heroTitle{margin:0;font-size:46px;line-height:1.06;letter-spacing:-0.04em}
        @media (min-width: 1024px){.ea-heroTitle{font-size:58px}}
        .ea-gradientText{background:linear-gradient(135deg, var(--ea-indigo), var(--ea-indigo2));-webkit-background-clip:text;background-clip:text;color:transparent}
        .ea-rightPanel{position:relative}
        .ea-visual{border:1px solid var(--ea-border);border-radius:28px;background:rgba(255,255,255,0.55);overflow:hidden}
        .ea-visualInner{position:relative;aspect-ratio:1 / 1;border-radius:22px;margin:14px;background:rgba(255,255,255,0.55);border:1px solid rgba(148,163,184,0.25);display:flex;align-items:center;justify-content:center}
        .ea-glow1{position:absolute;top:-60px;right:-70px;width:360px;height:360px;border-radius:999px;background:rgba(79,70,229,0.12);filter:blur(90px);pointer-events:none}
        .ea-glow2{position:absolute;bottom:-80px;left:-70px;width:360px;height:360px;border-radius:999px;background:rgba(124,58,237,0.12);filter:blur(90px);pointer-events:none}
        .ea-floatTag{position:absolute;display:flex;align-items:center;justify-content:center;width:52px;height:52px;border-radius:22px;background:var(--ea-card);border:1px solid var(--ea-border);box-shadow:var(--ea-shadow)}
        .ea-floatTop{top:-18px;right:-18px;animation: eaFloat 3.2s ease-in-out infinite}
        .ea-floatBottom{bottom:-18px;left:-18px;animation: eaPulse 2.4s ease-in-out infinite}
        @keyframes eaFloat{0%,100%{transform:translateY(0)}50%{transform:translateY(-10px)}}
        .ea-landingCard{max-width: 980px; width: 100%}
        .ea-landingExpectGrid{display:grid;gap:10px;font-size:13px;color:var(--ea-text)}
        @media (min-width: 860px){.ea-landingExpectGrid{grid-template-columns: 1fr 1fr;gap:12px}}
      `}</style>

      {isFullPage ? (
        <Outlet />
      ) : (
        <>
          <nav className="ea-nav">
            <div className="ea-brand">
              <Link className="ea-logo" to="/home">
                <Icon name="ai" size={22} />
              </Link>
              <div>
                <h1 className="ea-title">AI Empath</h1>
              </div>
            </div>
          </nav>

          <main className="ea-container">
            <Outlet />
          </main>

          <footer className="ea-footer">
            <div style={{ display: "flex", gap: 18 }}>
              <a href="#" onClick={(e) => e.preventDefault()}>
                Privacy
              </a>
              <a href="#" onClick={(e) => e.preventDefault()}>
                Terms
              </a>
            </div>
            <div>©AI Empath</div>
          </footer>
        </>
      )}
    </div>
  );
}

export function createAppRouter() {
  return createBrowserRouter([
    {
      path: "/",
      element: <AppLayout />,
      children: [
        { index: true, element: <Navigate to="/home" replace /> },
        { path: "home", element: <Landing /> },

        { path: "consent", element: <Navigate to="/pre-session-survey" replace /> },
        { path: "pre-session", element: <Navigate to="/pre-session-survey" replace /> },
        { path: "pre-session-survey", element: <PreSessionForm /> },

        { path: "baseline", element: <Navigate to="/baseline-measurement" replace /> },
        { path: "baseline-measurement", element: <Baseline /> },

        { path: "session", element: <Session /> },

        { path: "post-session-measurement", element: <PostSessionMeasurement /> },

        { path: "post-session", element: <Navigate to="/post-session-survey" replace /> },
        { path: "post-session-survey", element: <PostSession /> },

        { path: "check-in", element: <CheckIn /> },
        { path: "*", element: <NotFound /> }
      ]
    }
  ]);
}

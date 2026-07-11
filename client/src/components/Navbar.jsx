
import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { GoogleLogin } from "@react-oauth/google";
import { jwtDecode } from "jwt-decode";
import { useAuth } from "../context/AuthContext";

const navLinks = [
  { label: "Match Resume",  path: "/resume-matcher" },
  { label: "Refine JD",     path: "/refine-jd"      },
  { label: "Improve Resume",path: "/improve-resume"  },
  { label: "Cover Letter",  path: "/cover-letter"    },
];

export default function Navbar() {
  const { user, login, logout } = useAuth();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleGoogleSuccess = (credentialResponse) => {
    const decoded = jwtDecode(credentialResponse.credential);
    login({ ...decoded, token: credentialResponse.credential });
  };

  return (
    <>
      <style>{`
        .nav-root {
          position: fixed; top: 0; left: 0; right: 0; z-index: 50;
          background: rgba(10,10,15,0.8); backdrop-filter: blur(16px);
          border-bottom: 1px solid rgba(255,255,255,0.06);
          font-family: 'Inter', -apple-system, sans-serif;
        }
        .nav-inner {
          max-width: 1200px; margin: 0 auto;
          display: flex; align-items: center; justify-content: space-between;
          padding: 0.9rem 2rem; gap: 1.5rem;
        }
        .nav-logo {
          font-size: 1.2rem; font-weight: 800; letter-spacing: -0.03em;
          background: linear-gradient(135deg,#a78bfa,#7c3aed);
          -webkit-background-clip: text; -webkit-text-fill-color: transparent;
          text-decoration: none; flex-shrink: 0;
        }
        .nav-links {
          display: flex; align-items: center; gap: 0.25rem; flex: 1; justify-content: center;
        }
        .nav-link {
          padding: 0.45rem 0.85rem; border-radius: 8px;
          font-size: 0.85rem; font-weight: 500; text-decoration: none;
          color: rgba(255,255,255,0.5); transition: all 0.2s; white-space: nowrap;
        }
        .nav-link:hover { color: #fff; background: rgba(255,255,255,0.06); }
        .nav-link.active {
          color: #a78bfa; background: rgba(167,139,250,0.1);
          border: 1px solid rgba(167,139,250,0.2);
        }
        .nav-link.disabled {
          opacity: 0.35; pointer-events: none; cursor: not-allowed;
        }
        .nav-right { display: flex; align-items: center; gap: 0.75rem; flex-shrink: 0; }
        .nav-user-pill {
          display: flex; align-items: center; gap: 0.5rem;
          background: rgba(167,139,250,0.08); border: 1px solid rgba(167,139,250,0.18);
          border-radius: 999px; padding: 0.3rem 0.85rem 0.3rem 0.4rem;
        }
        .nav-avatar {
          width: 24px; height: 24px; border-radius: 50%;
          background: linear-gradient(135deg,#a78bfa,#7c3aed);
          display: flex; align-items: center; justify-content: center;
          font-size: 0.65rem; font-weight: 700; color: #fff; flex-shrink: 0;
        }
        .nav-username { font-size: 0.8rem; color: rgba(255,255,255,0.7); max-width: 120px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .nav-logout {
          background: transparent; border: 1px solid rgba(255,255,255,0.12);
          color: rgba(255,255,255,0.5); border-radius: 8px;
          padding: 0.35rem 0.8rem; font-size: 0.78rem; cursor: pointer; transition: all 0.2s;
        }
        .nav-logout:hover { border-color: #ef4444; color: #ef4444; }

        /* Hamburger */
        .nav-hamburger {
          display: none; flex-direction: column; gap: 5px;
          background: none; border: none; cursor: pointer; padding: 4px;
        }
        .nav-hamburger span {
          display: block; width: 22px; height: 2px;
          background: rgba(255,255,255,0.7); border-radius: 2px;
          transition: all 0.2s;
        }

        /* Mobile menu */
        .nav-mobile {
          display: none; flex-direction: column; gap: 0.25rem;
          padding: 0.75rem 1.25rem 1rem;
          border-top: 1px solid rgba(255,255,255,0.06);
        }
        .nav-mobile.open { display: flex; }
        .nav-mobile-link {
          padding: 0.6rem 0.85rem; border-radius: 10px;
          font-size: 0.9rem; font-weight: 500; text-decoration: none;
          color: rgba(255,255,255,0.5); transition: all 0.2s;
        }
        .nav-mobile-link:hover { color: #fff; background: rgba(255,255,255,0.06); }
        .nav-mobile-link.active { color: #a78bfa; background: rgba(167,139,250,0.1); }
        .nav-mobile-link.disabled { opacity: 0.35; pointer-events: none; }
        .nav-mobile-divider { height: 1px; background: rgba(255,255,255,0.06); margin: 0.5rem 0; }
        .nav-mobile-auth { padding: 0 0.5rem; }

        @media(max-width: 768px) {
          .nav-links { display: none; }
          .nav-hamburger { display: flex; }
          .nav-user-pill .nav-username { display: none; }
        }
        @media(max-width: 480px) {
          .nav-inner { padding: 0.9rem 1.25rem; }
        }
      `}</style>

      <nav className="nav-root">
        <div className="nav-inner">
          {/* Logo */}
          <Link to="/" className="nav-logo">Verity-Flow</Link>

          {/* Desktop links */}
          <div className="nav-links">
            {navLinks.map((l) => (
              <Link
                key={l.path}
                to={user ? l.path : "#"}
                className={`nav-link ${!user ? "disabled" : ""} ${location.pathname === l.path ? "active" : ""}`}
              >
                {l.label}
              </Link>
            ))}
          </div>

          {/* Desktop auth */}
          <div className="nav-right">
            {user ? (
              <>
                <div className="nav-user-pill">
                  <div className="nav-avatar">{(user.name || user.email || "U")[0].toUpperCase()}</div>
                  <span className="nav-username">{user.name || user.email}</span>
                </div>
                <button className="nav-logout" onClick={logout}>Sign out</button>
              </>
            ) : (
              <div style={{transform:"scale(0.85)", transformOrigin:"right center"}}>
                <GoogleLogin onSuccess={handleGoogleSuccess} onError={() => {}} size="medium" />
              </div>
            )}
          </div>

          {/* Hamburger */}
          <button className="nav-hamburger" onClick={() => setMenuOpen(!menuOpen)}>
            <span/><span/><span/>
          </button>
        </div>

        {/* Mobile menu */}
        <div className={`nav-mobile ${menuOpen ? "open" : ""}`}>
          {navLinks.map((l) => (
            <Link
              key={l.path}
              to={user ? l.path : "#"}
              className={`nav-mobile-link ${!user ? "disabled" : ""} ${location.pathname === l.path ? "active" : ""}`}
              onClick={() => setMenuOpen(false)}
            >
              {l.label}
            </Link>
          ))}
          <div className="nav-mobile-divider"/>
          <div className="nav-mobile-auth">
            {user ? (
              <button className="nav-logout" style={{width:"100%"}} onClick={() => { logout(); setMenuOpen(false); }}>
                Sign out ({user.name || user.email})
              </button>
            ) : (
              <GoogleLogin onSuccess={handleGoogleSuccess} onError={() => {}} size="medium" />
            )}
          </div>
        </div>
      </nav>
    </>
  );
}


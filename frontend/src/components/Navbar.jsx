import { Link, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { getRoleName } from "../utils/roles";

function SunIcon() {
  return (
    <svg className="theme-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2.5" /><path d="M12 19.5V22" />
      <path d="M4.93 4.93l1.77 1.77" /><path d="M17.3 17.3l1.77 1.77" />
      <path d="M2 12h2.5" /><path d="M19.5 12H22" />
      <path d="M4.93 19.07l1.77-1.77" /><path d="M17.3 6.7l1.77-1.77" />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg className="theme-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z" />
    </svg>
  );
}

function Navbar() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [theme, setTheme] = useState(localStorage.getItem("theme") || "light");
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);
  }, [theme]);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const isHome = location.pathname === "/";
  const initial = user?.username?.charAt(0)?.toUpperCase() || "?";

  return (
    <nav className={`navbar ${scrolled ? "navbar--scrolled" : ""} ${isHome ? "navbar--home" : ""}`}>
      <div className="nav-left">
        <button
          className="mobile-menu-btn"
          onClick={() => window.dispatchEvent(new CustomEvent("toggle-sidebar"))}
          aria-label="Toggle menu"
          title="Menu"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="3" y1="12" x2="15" y2="12" />
            <line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        </button>

        <Link to={user ? "/workspace" : "/"} className="nav-brand">
          <span className="nav-brand__icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
          </span>
          <span className="nav-brand__text">InfraChat</span>
        </Link>

        {/* Nav links for home page */}
        {isHome && !user && (
          <div className="nav-links nav-desktop-only">
            <a href="#features" className="nav-link">Features</a>
            <a href="#steps" className="nav-link">How it works</a>
          </div>
        )}
      </div>

      <div className="nav-right">
        <button
          className="nav-icon-btn theme-toggle"
          onClick={() => setTheme((prev) => (prev === "light" ? "dark" : "light"))}
          aria-label="Toggle theme"
          title="Toggle theme"
        >
          {theme === "light" ? <MoonIcon /> : <SunIcon />}
        </button>

        {user?.role >= 2 && (
          <Link to="/audit" className="nav-link-btn nav-desktop-only">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
            </svg>
            Audit
          </Link>
        )}

        {user?.role === 3 && (
          <Link to="/admin" className="nav-link-btn nav-link-btn--accent nav-desktop-only">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
            </svg>
            Admin
          </Link>
        )}

        {user ? (
          <div className="nav-user-section">
            <div className="nav-avatar" title={`${user.username} (${getRoleName(user.role)})`}>
              {initial}
            </div>
            <button onClick={logout} className="nav-icon-btn nav-logout-btn" title="Logout">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
            </button>
          </div>
        ) : (
          <div className="nav-auth-btns nav-desktop-only">
            <Link to="/login" className="nav-link-btn">Sign in</Link>
            <Link to="/register" className="nav-link-btn nav-link-btn--accent">Get Started</Link>
          </div>
        )}
      </div>
    </nav>
  );
}

export default Navbar;

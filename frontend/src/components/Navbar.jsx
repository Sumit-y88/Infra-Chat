import { Link, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";

function ThemeIcon({ theme }) {
  if (theme === "dark") {
    // Sun icon for switching to light
    return (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="4" />
        <path d="M12 2v2" /><path d="M12 20v2" />
        <path d="M4.93 4.93l1.41 1.41" /><path d="M17.66 17.66l1.41 1.41" />
        <path d="M2 12h2" /><path d="M20 12h2" />
        <path d="M6.34 17.66l-1.41 1.41" /><path d="M19.07 4.93l-1.41 1.41" />
      </svg>
    );
  }
  // Moon icon for switching to dark
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  );
}

function Navbar() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [theme, setTheme] = useState(localStorage.getItem("theme") || "light");

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === "light" ? "dark" : "light"));
  };

  // Do not render top navbar on the workspace (controls moved to rail footer)
  if (
    location.pathname === "/workspace" ||
    location.pathname.startsWith("/rooms") ||
    location.pathname.startsWith("/dm")
  ) {
    return null;
  }

  const isSlimPage =
    location.pathname === "/admin" ||
    location.pathname === "/audit" ||
    location.pathname === "/dashboard";

  if (isSlimPage) {
    let pageTitle = "Dashboard";
    if (location.pathname === "/admin") pageTitle = "Admin panel";
    if (location.pathname === "/audit") pageTitle = "Audit log";

    return (
      <header className="slim-header" role="banner">
        <div className="slim-header__left">
          <Link to="/workspace" className="slim-header__back" aria-label="Back to workspace">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="19" y1="12" x2="5" y2="12" />
              <polyline points="12 19 5 12 12 5" />
            </svg>
            <span>Back to workspace</span>
          </Link>
          <span className="slim-header__divider">/</span>
          <span className="slim-header__title">{pageTitle}</span>
        </div>

        <div className="slim-header__right">
          <button
            className="icon-btn"
            onClick={toggleTheme}
            aria-label="Switch theme"
            title="Switch theme"
          >
            <ThemeIcon theme={theme} />
          </button>
          {user && (
            <button
              className="icon-btn"
              onClick={logout}
              aria-label="Log out"
              title="Log out"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
            </button>
          )}
        </div>
      </header>
    );
  }

  return (
    <header className="public-header" role="banner">
      <div className="public-header__left">
        <Link to="/" className="brand-mark-link" aria-label="Internal Network Home">
          <div className="brand-mark" aria-hidden="true">
            <span className="brand-mark__bar" style={{ height: "6px" }} />
            <span className="brand-mark__bar" style={{ height: "10px" }} />
            <span className="brand-mark__bar" style={{ height: "14px" }} />
          </div>
          <span className="brand-text">Internal Network</span>
        </Link>
      </div>

      <div className="public-header__right">
        <button
          className="icon-btn"
          onClick={toggleTheme}
          aria-label="Switch theme"
          title="Switch theme"
        >
          <ThemeIcon theme={theme} />
        </button>

        {user ? (
          <Link to="/workspace" className="btn-quiet">
            Open workspace
          </Link>
        ) : (
          <div className="public-header__auth">
            <Link to="/login" className="btn-quiet">
              Sign in
            </Link>
            <Link to="/register" className="btn-accent">
              Create account
            </Link>
          </div>
        )}
      </div>
    </header>
  );
}

export default Navbar;

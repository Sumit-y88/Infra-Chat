import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    email: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!form.email.trim() || !form.password.trim()) {
      setError("Enter both your email and password to sign in.");
      return;
    }

    try {
      setLoading(true);
      await login(form.email, form.password);
      navigate("/workspace");
    } catch (err) {
      setLoading(false);
      setError(err.response?.data?.message || "Invalid email or password. Verify your credentials.");
    }
  };

  return (
    <div className="auth-shell">
      <div className="auth-card">
        {/* Header */}
        <div className="auth-card__header">
          <div className="brand-mark" aria-hidden="true">
            <span className="brand-mark__bar" style={{ height: "6px" }} />
            <span className="brand-mark__bar" style={{ height: "10px" }} />
            <span className="brand-mark__bar" style={{ height: "14px" }} />
          </div>
          <div className="auth-card__header-text">
            <h1 className="auth-title">Sign in to Internal Network</h1>
            <p className="auth-subtitle">Enter your credentials to access the workspace.</p>
          </div>
        </div>

        {error && (
          <div className="inline-error" role="alert">
            {error}
          </div>
        )}

        <form className="auth-form" onSubmit={handleSubmit} noValidate>
          <div className="field">
            <label htmlFor="email" className="field__label">
              Email
            </label>
            <input
              id="email"
              type="email"
              name="email"
              autoComplete="email"
              placeholder="name@organization.com"
              value={form.email}
              onChange={handleChange}
              required
            />
          </div>

          <div className="field">
            <div className="field__header-row">
              <label htmlFor="password" className="field__label">
                Password
              </label>
              <button
                type="button"
                className="field__toggle-btn"
                onClick={() => setShowPassword((prev) => !prev)}
                aria-label={showPassword ? "Hide password" : "Show password"}
                tabIndex={-1}
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>
            <div className="field__input-wrap">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                name="password"
                autoComplete="current-password"
                placeholder="••••••••"
                value={form.password}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <button className="btn-accent auth-submit" type="submit" disabled={loading}>
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </form>

        <div className="auth-card__footer">
          <p className="auth-footer-text">
            Don&apos;t have an account? <Link to="/register">Create account</Link>
          </p>
        </div>
      </div>

      <div className="auth-system-note">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
          <path d="M7 11V7a5 5 0 0 1 10 0v4" />
        </svg>
        <span>Restricted system &mdash; authenticated session required</span>
      </div>
    </div>
  );
}

export default Login;

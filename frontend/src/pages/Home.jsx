import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function Home() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const observerRef = useRef(null);

  useEffect(() => {
    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("visible");
            observerRef.current.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1 }
    );

    document.querySelectorAll(".reveal").forEach((el) => {
      observerRef.current.observe(el);
    });

    return () => observerRef.current?.disconnect();
  }, []);

  return (
    <div className="home-page">
      {/* ── Animated Background ── */}
      <div className="home-bg">
        <div className="home-grid-pattern"></div>
        <div className="home-blob home-blob--1"></div>
        <div className="home-blob home-blob--2"></div>
        <div className="home-blob home-blob--3"></div>
      </div>

      {/* ── Hero ── */}
      <section className="home-hero">
        <div className="home-hero__inner">
          <div className="home-pill anim-fade-up" style={{ animationDelay: "0.1s" }}>
            <span className="home-pill__dot"></span>
            <span>InfraChat 2.0 &mdash; Now Live</span>
          </div>

          <h1 className="home-hero__title anim-fade-up" style={{ animationDelay: "0.2s" }}>
            Communication
            <br />
            <span className="home-gradient-text">Reimagined.</span>
          </h1>

          <p className="home-hero__sub anim-fade-up" style={{ animationDelay: "0.35s" }}>
            Enterprise-grade messaging with secure rooms, role-based access, real-time
            collaboration, and transparent audit trails — all in one workspace.
          </p>

          <div className="home-hero__cta anim-fade-up" style={{ animationDelay: "0.5s" }}>
            {user ? (
              <button className="home-btn home-btn--primary" onClick={() => navigate("/workspace")}>
                Open Workspace
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="5" y1="12" x2="19" y2="12" />
                  <polyline points="12 5 19 12 12 19" />
                </svg>
              </button>
            ) : (
              <>
                <button className="home-btn home-btn--primary" onClick={() => navigate("/register")}>
                  Get Started Free
                </button>
                <button className="home-btn home-btn--ghost" onClick={() => navigate("/login")}>
                  Sign In
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="5" y1="12" x2="19" y2="12" />
                    <polyline points="12 5 19 12 12 19" />
                  </svg>
                </button>
              </>
            )}
          </div>
        </div>

        {/* Glowing orb behind the CTA */}
        <div className="home-hero__glow"></div>
      </section>

      {/* ── Stats Strip ── */}
      <section className="home-stats reveal">
        <div className="home-stats__inner">
          {[
            { value: "99.9%", label: "Uptime" },
            { value: "AES-256", label: "Encryption" },
            { value: "< 50ms", label: "Latency" },
            { value: "RBAC", label: "Access Control" },
          ].map((stat) => (
            <div className="home-stat" key={stat.label}>
              <span className="home-stat__value">{stat.value}</span>
              <span className="home-stat__label">{stat.label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ── Features Bento ── */}
      <section className="home-features" id="features">
        <div className="home-section-header reveal">
          <span className="home-section-tag">Features</span>
          <h2>Everything your team needs</h2>
          <p>Built for security-first organizations that demand speed and transparency.</p>
        </div>

        <div className="home-bento reveal">
          {/* Large card */}
          <div className="home-bento__card home-bento__card--lg">
            <div className="home-bento__card-glow home-bento__card-glow--indigo"></div>
            <div className="home-bento__icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
            </div>
            <h3>Real-time Messaging</h3>
            <p>
              Instant delivery powered by WebSockets. Direct messages, group rooms, file sharing,
              and slash commands — all with zero lag.
            </p>
          </div>

          {/* Small card */}
          <div className="home-bento__card">
            <div className="home-bento__card-glow home-bento__card-glow--violet"></div>
            <div className="home-bento__icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
            </div>
            <h3>Role-Based Access</h3>
            <p>Granular permissions — user, moderator, and admin tiers with fine-grained controls.</p>
          </div>

          {/* Small card */}
          <div className="home-bento__card">
            <div className="home-bento__card-glow home-bento__card-glow--rose"></div>
            <div className="home-bento__icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
            </div>
            <h3>Encrypted Rooms</h3>
            <p>Private, invite-only spaces for sensitive discussions and strategic planning.</p>
          </div>

          {/* Large card */}
          <div className="home-bento__card home-bento__card--lg">
            <div className="home-bento__card-glow home-bento__card-glow--emerald"></div>
            <div className="home-bento__icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
              </svg>
            </div>
            <h3>Comprehensive Audit Logs</h3>
            <p>
              Immutable activity logs for every action — message edits, deletions, role changes,
              and room modifications. Built for compliance.
            </p>
          </div>
        </div>
      </section>

      {/* ── How It Works ── */}
      <section className="home-steps" id="steps">
        <div className="home-section-header reveal">
          <span className="home-section-tag">How it works</span>
          <h2>Up and running in minutes</h2>
          <p>Three simple steps to transform your team communication.</p>
        </div>

        <div className="home-steps__grid reveal">
          {[
            {
              step: "01",
              title: "Create your account",
              desc: "Register with your email and set up your profile in seconds.",
              icon: (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                  <circle cx="8.5" cy="7" r="4" />
                  <line x1="20" y1="8" x2="20" y2="14" />
                  <line x1="23" y1="11" x2="17" y2="11" />
                </svg>
              ),
            },
            {
              step: "02",
              title: "Join or create rooms",
              desc: "Browse public rooms or create private ones for your team.",
              icon: (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                </svg>
              ),
            },
            {
              step: "03",
              title: "Start collaborating",
              desc: "Send messages, share files, and manage your workspace.",
              icon: (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
                </svg>
              ),
            },
          ].map((item) => (
            <div className="home-step-card" key={item.step}>
              <span className="home-step-card__num">{item.step}</span>
              <div className="home-step-card__icon">{item.icon}</div>
              <h3>{item.title}</h3>
              <p>{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA Banner ── */}
      <section className="home-cta-banner reveal">
        <div className="home-cta-banner__inner">
          <div className="home-cta-banner__glow"></div>
          <h2>Ready to upgrade your team communication?</h2>
          <p>Join teams already using InfraChat for secure, efficient collaboration.</p>
          <div className="home-hero__cta">
            {user ? (
              <button className="home-btn home-btn--primary" onClick={() => navigate("/workspace")}>
                Go to Workspace
              </button>
            ) : (
              <>
                <button className="home-btn home-btn--primary" onClick={() => navigate("/register")}>
                  Get Started Free
                </button>
                <button className="home-btn home-btn--ghost" onClick={() => navigate("/login")}>
                  Sign In
                </button>
              </>
            )}
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="home-footer">
        <div className="home-footer__inner">
          <div className="home-footer__brand">
            <span className="home-footer__logo">InfraChat</span>
            <p>Secure enterprise messaging for modern teams.</p>
          </div>
          <div className="home-footer__links">
            <div className="home-footer__col">
              <h4>Product</h4>
              <span>Messaging</span>
              <span>Rooms</span>
              <span>File Sharing</span>
              <span>Audit Logs</span>
            </div>
            <div className="home-footer__col">
              <h4>Security</h4>
              <span>Encryption</span>
              <span>RBAC</span>
              <span>Compliance</span>
            </div>
          </div>
        </div>
        <div className="home-footer__bottom">
          <p>&copy; {new Date().getFullYear()} InfraChat. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}

export default Home;

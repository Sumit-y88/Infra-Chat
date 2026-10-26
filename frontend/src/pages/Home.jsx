import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import RoleGlyph from "../components/RoleGlyph";

function Home() {
  const { user } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="home-page">
      {/* ── Hero Section ── */}
      <section className="home-hero">
        <div className="home-hero__inner">
          <div className="home-kicker">
            <span className="home-kicker__dot" />
            <span>Internal Network — System Active</span>
          </div>

          <h1 className="home-hero__title">
            Enterprise communication,
            <br />
            stripped of noise.
          </h1>

          <p className="home-hero__sub">
            A quiet workspace with strict three-tier role governance, partitioned room channels,
            direct messaging, keyboard-driven slash commands, and permanent audit logging.
          </p>

          <div className="home-hero__cta">
            {user ? (
              <>
                <button
                  className="btn-accent home-cta-btn"
                  onClick={() => navigate("/workspace")}
                >
                  <span>Open workspace</span>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="5" y1="12" x2="19" y2="12" />
                    <polyline points="12 5 19 12 12 19" />
                  </svg>
                </button>
                {user.role >= 2 && (
                  <button
                    className="btn-quiet home-cta-btn"
                    onClick={() => navigate("/audit")}
                  >
                    Audit logs
                  </button>
                )}
              </>
            ) : (
              <>
                <button
                  className="btn-accent home-cta-btn"
                  onClick={() => navigate("/register")}
                >
                  Create account
                </button>
                <button
                  className="btn-quiet home-cta-btn"
                  onClick={() => navigate("/login")}
                >
                  Sign in
                </button>
              </>
            )}
          </div>
        </div>
      </section>

      {/* ── App Specimen / Interactive Preview ── */}
      <section className="home-specimen-wrap">
        <div className="home-specimen">
          {/* Specimen Header Bar */}
          <div className="home-specimen__chrome">
            <div className="home-specimen__traffic-lights">
              <span className="home-specimen__dot" />
              <span className="home-specimen__dot" />
              <span className="home-specimen__dot" />
            </div>
            <div className="home-specimen__address-bar">
              internal.network/workspace
            </div>
            <div className="home-specimen__status-indicator">
              <span className="presence-dot online" />
              <span>connected</span>
            </div>
          </div>

          {/* 3-column Layout Preview */}
          <div className="home-specimen__workspace">
            {/* Specimen Left Rail */}
            <div className="home-specimen__rail">
              <div className="home-specimen__rail-brand">
                <div className="brand-mark" aria-hidden="true">
                  <span className="brand-mark__bar" style={{ height: "6px" }} />
                  <span className="brand-mark__bar" style={{ height: "10px" }} />
                  <span className="brand-mark__bar" style={{ height: "14px" }} />
                </div>
                <span className="home-specimen__brand-text">Internal Network</span>
              </div>

              <div className="home-specimen__group">
                <span className="home-specimen__group-title">Rooms</span>
                <div className="home-specimen__row active">
                  <span className="home-specimen__hash">#</span>
                  <span>general</span>
                </div>
                <div className="home-specimen__row">
                  <span className="home-specimen__hash">#</span>
                  <span>infrastructure</span>
                </div>
                <div className="home-specimen__row">
                  <span className="home-specimen__hash">#</span>
                  <span>deployments</span>
                </div>
              </div>

              <div className="home-specimen__group">
                <span className="home-specimen__group-title">Direct messages</span>
                <div className="home-specimen__row">
                  <span className="presence-dot online" />
                  <span>Marcus Vance</span>
                </div>
                <div className="home-specimen__row">
                  <span className="presence-dot offline" />
                  <span>Elena Rostova</span>
                </div>
              </div>

              <div className="home-specimen__rail-footer">
                <div className="avatar-square avatar-square--sm">SY</div>
                <div className="home-specimen__user-meta">
                  <span className="home-specimen__username">Sumit</span>
                  <span className="home-specimen__user-role">SuperAdmin</span>
                </div>
                <RoleGlyph level={3} />
              </div>
            </div>

            {/* Specimen Center Chat */}
            <div className="home-specimen__center">
              <div className="home-specimen__chat-header">
                <div className="home-specimen__header-info">
                  <span className="home-specimen__header-title">#general</span>
                  <span className="home-specimen__header-sub">14 members, 4 online</span>
                </div>
                <span className="home-specimen__badge-quiet">Quiet feed</span>
              </div>

              <div className="home-specimen__chat-feed">
                {/* Message 1 */}
                <div className="home-specimen__msg">
                  <div className="avatar-square">MV</div>
                  <div className="home-specimen__msg-body">
                    <div className="home-specimen__msg-meta">
                      <span className="home-specimen__msg-author">Marcus Vance</span>
                      <RoleGlyph level={2} />
                      <span className="home-specimen__msg-time">09:41</span>
                    </div>
                    <div className="home-specimen__msg-text">
                      Database replication window completed at 04:00 UTC. Ingress latency steady at 12ms.
                    </div>
                  </div>
                </div>

                {/* Ledger row */}
                <div className="home-specimen__ledger">
                  <span className="home-specimen__ledger-icon">↳</span>
                  <span>Audit entry: Marcus Vance updated rate limit configuration</span>
                  <span className="home-specimen__ledger-link">View in audit log</span>
                </div>

                {/* Message 2 */}
                <div className="home-specimen__msg">
                  <div className="avatar-square avatar-square--accent">SY</div>
                  <div className="home-specimen__msg-body">
                    <div className="home-specimen__msg-meta">
                      <span className="home-specimen__msg-author">Sumit Yadav</span>
                      <RoleGlyph level={3} />
                      <span className="home-specimen__msg-time">09:43</span>
                    </div>
                    <div className="home-specimen__msg-text">
                      Acknowledged. Rolling deployment to European cluster will proceed next.
                    </div>
                  </div>
                </div>
              </div>

              {/* Specimen Composer */}
              <div className="home-specimen__composer">
                <div className="home-specimen__composer-input">
                  <span className="home-specimen__prompt">/</span>
                  <span className="home-specimen__code-preview">rooms</span>
                  <span className="home-specimen__caret" />
                </div>
                <button className="btn-accent btn-sm" tabIndex={-1}>Send</button>
              </div>
            </div>

            {/* Specimen Right Panel */}
            <div className="home-specimen__panel">
              <div className="home-specimen__panel-section">
                <span className="home-specimen__panel-heading">Room details</span>
                <p className="home-specimen__panel-desc">
                  Primary coordination feed for infrastructure updates, deployment announcements, and operational alerts.
                </p>
              </div>

              <div className="home-specimen__panel-section">
                <span className="home-specimen__panel-heading">Online members (4)</span>
                <div className="home-specimen__member-list">
                  <div className="home-specimen__member-row">
                    <span className="presence-dot online" />
                    <span>Sumit Yadav</span>
                    <RoleGlyph level={3} />
                  </div>
                  <div className="home-specimen__member-row">
                    <span className="presence-dot online" />
                    <span>Marcus Vance</span>
                    <RoleGlyph level={2} />
                  </div>
                  <div className="home-specimen__member-row">
                    <span className="presence-dot online" />
                    <span>Devon Chen</span>
                    <RoleGlyph level={1} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Architecture & Principles Grid ── */}
      <section className="home-principles">
        <div className="home-section-lead">
          <span className="home-section-kicker">Core Architecture</span>
          <h2 className="home-section-title">Engineered for security and operational focus</h2>
          <p className="home-section-sub">
            Built from first principles: no decorative bloat, no distracting animations, and strictly bounded permissions.
          </p>
        </div>

        <div className="home-grid">
          {/* Card 1 */}
          <div className="home-card">
            <div className="home-card__header">
              <div className="home-card__glyph-row">
                <RoleGlyph level={1} />
                <RoleGlyph level={2} />
                <RoleGlyph level={3} />
              </div>
              <span className="home-card__label">Governance</span>
            </div>
            <h3 className="home-card__title">Three-tier role hierarchy</h3>
            <p className="home-card__text">
              Strict access levels (Member, Moderator, SuperAdmin) are validated on every socket event and REST endpoint.
              Visual role glyphs replace arbitrary colored tags.
            </p>
          </div>

          {/* Card 2 */}
          <div className="home-card">
            <div className="home-card__header">
              <span className="home-card__mono-badge">duplex :// 50ms</span>
              <span className="home-card__label">Real-time</span>
            </div>
            <h3 className="home-card__title">Low-latency socket duplex</h3>
            <p className="home-card__text">
              Direct connection via WebSocket streams messages, typing status, and presence changes instantaneously.
              Fallback mechanisms ensure seamless reconnection.
            </p>
          </div>

          {/* Card 3 */}
          <div className="home-card">
            <div className="home-card__header">
              <span className="home-card__mono-badge">ledger / audit</span>
              <span className="home-card__label">Compliance</span>
            </div>
            <h3 className="home-card__title">Immutable audit ledger</h3>
            <p className="home-card__text">
              Every critical administrative action—user kick, ban, mute, role promotion, or room modification—is
              permanently inscribed with timestamp, actor, and target details.
            </p>
          </div>

          {/* Card 4 */}
          <div className="home-card">
            <div className="home-card__header">
              <span className="home-card__mono-badge">&gt; /commands</span>
              <span className="home-card__label">Efficiency</span>
            </div>
            <h3 className="home-card__title">Keyboard-first slash commands</h3>
            <p className="home-card__text">
              Direct moderation without leaving the keyboard. Type / in the composer to access a floating menu
              with auto-complete, parameter hints, and role-based gating.
            </p>
          </div>
        </div>
      </section>

      {/* ── Technical Specifications Table ── */}
      <section className="home-specs">
        <div className="home-section-lead">
          <span className="home-section-kicker">Specifications</span>
          <h2 className="home-section-title">System parameters and stack</h2>
        </div>

        <div className="home-specs-table-container">
          <table className="home-specs-table">
            <thead>
              <tr>
                <th>Component</th>
                <th>Specification</th>
                <th>Standard</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="mono-cell">Authentication</td>
                <td>JSON Web Tokens (JWT) with HMAC SHA-256 signing</td>
                <td className="muted-cell">RFC 7519</td>
              </tr>
              <tr>
                <td className="mono-cell">Transport</td>
                <td>Bidirectional WebSocket with automatic heartbeat & reconnect</td>
                <td className="muted-cell">Socket.io 4.x</td>
              </tr>
              <tr>
                <td className="mono-cell">Authorization</td>
                <td>3-Tier Role-Based Access Control (Member: 1, Mod: 2, Admin: 3)</td>
                <td className="muted-cell">RBAC Core</td>
              </tr>
              <tr>
                <td className="mono-cell">Attachments</td>
                <td>Isolated file storage with mime-type validation & size bounds</td>
                <td className="muted-cell">Multipart buffer</td>
              </tr>
              <tr>
                <td className="mono-cell">Design system</td>
                <td>Strict typographic scale, 120ms transitions, WCAG 4.5:1 contrast</td>
                <td className="muted-cell">Quiet Minimalist</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* ── Ready Callout ── */}
      <section className="home-bottom-cta">
        <div className="home-bottom-cta__inner">
          <h2 className="home-bottom-cta__title">Ready to access the workspace?</h2>
          <p className="home-bottom-cta__sub">
            Connect to your team room channels and start communicating with zero distraction.
          </p>
          <div className="home-hero__cta">
            {user ? (
              <button
                className="btn-accent home-cta-btn"
                onClick={() => navigate("/workspace")}
              >
                Open workspace
              </button>
            ) : (
              <>
                <button
                  className="btn-accent home-cta-btn"
                  onClick={() => navigate("/register")}
                >
                  Create account
                </button>
                <button
                  className="btn-quiet home-cta-btn"
                  onClick={() => navigate("/login")}
                >
                  Sign in
                </button>
              </>
            )}
          </div>
        </div>
      </section>

      {/* ── Minimalist Footer ── */}
      <footer className="home-footer">
        <div className="home-footer__inner">
          <div className="home-footer__brand">
            <div className="brand-mark" aria-hidden="true">
              <span className="brand-mark__bar" style={{ height: "6px" }} />
              <span className="brand-mark__bar" style={{ height: "10px" }} />
              <span className="brand-mark__bar" style={{ height: "14px" }} />
            </div>
            <span className="home-footer__brand-text">Internal Network</span>
          </div>

          <div className="home-footer__links">
            <Link to="/workspace">Workspace</Link>
            <Link to="/login">Sign in</Link>
            <Link to="/register">Create account</Link>
            <Link to="/audit">Audit logs</Link>
          </div>

          <div className="home-footer__copy">
            &copy; {new Date().getFullYear()} Internal Network. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}

export default Home;

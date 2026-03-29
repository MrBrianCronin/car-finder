export default function WelcomeScreen({ onStart }) {
  return (
    <div className="welcome">
      <div className="welcome-content">
        <div className="welcome-badge">Smart Car Discovery</div>
        <h1 className="welcome-title">
          Not sure what car<br />
          is right for you?
        </h1>
        <p className="welcome-subtitle">
          Answer a few questions about your life, your budget, and how you drive —
          and we'll match you with vehicles backed by real safety, reliability, and efficiency data.
        </p>

        <div className="welcome-features">
          <div className="welcome-feature">
            <span className="welcome-feature-icon">📋</span>
            <div>
              <strong>~30 targeted questions</strong>
              <span>Adaptive — we skip what's not relevant to you</span>
            </div>
          </div>
          <div className="welcome-feature">
            <span className="welcome-feature-icon">📊</span>
            <div>
              <strong>Real government data</strong>
              <span>NHTSA safety ratings, EPA fuel economy, recall history</span>
            </div>
          </div>
          <div className="welcome-feature">
            <span className="welcome-feature-icon">🔗</span>
            <div>
              <strong>Find cars near you</strong>
              <span>Direct links to Cars.com, AutoTrader &amp; CarGurus</span>
            </div>
          </div>
        </div>

        <button className="welcome-cta" onClick={onStart}>
          Let's Find Your Car
          <span className="cta-arrow">→</span>
        </button>

        <p className="welcome-privacy">
          No account required · No data sold · Completely free
        </p>
      </div>

      <div className="welcome-visual">
        <div className="welcome-car-grid">
          <div className="car-type-card">
            <span className="car-type-emoji">🚗</span>
            <span className="car-type-label">Sedans</span>
          </div>
          <div className="car-type-card">
            <span className="car-type-emoji">🚙</span>
            <span className="car-type-label">SUVs</span>
          </div>
          <div className="car-type-card">
            <span className="car-type-emoji">🛻</span>
            <span className="car-type-label">Trucks</span>
          </div>
          <div className="car-type-card">
            <span className="car-type-emoji">⚡</span>
            <span className="car-type-label">Electric</span>
          </div>
        </div>
      </div>
    </div>
  );
}

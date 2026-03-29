import { trackEvent } from '../telemetry';

function ScoreBar({ score, label, color }) {
  return (
    <div className="score-bar-row">
      <span className="score-bar-label">{label}</span>
      <div className="score-bar-track">
        <div className="score-bar-fill" style={{ width: `${score}%`, backgroundColor: color }} />
      </div>
      <span className="score-bar-value">{score}</span>
    </div>
  );
}

function VehicleCard({ result, rank, isExpanded, onToggle }) {
  const { vehicle: v, composite, scores, deepLinks, reasons, tradeoffs } = result;
  const price = v.usedPriceRange
    ? `$${v.usedPriceRange[0].toLocaleString()} – $${v.usedPriceRange[1].toLocaleString()}`
    : `$${v.msrp.toLocaleString()} MSRP`;

  const fuelLabel = v.fuelType === 'electric'
    ? `${v.evRange} mi range`
    : v.fuelType === 'hybrid'
      ? `${v.mpgCombined} MPG (hybrid)`
      : `${v.mpgCombined} MPG`;

  const handleToggle = () => {
    if (!isExpanded) {
      trackEvent('recommendation_expanded', { make: v.make, model: v.model, year: v.year, rank });
    }
    onToggle();
  };

  const handleDeepLink = (marketplace) => {
    trackEvent('deep_link_clicked', {
      marketplace,
      make: v.make,
      model: v.model,
      year: v.year,
      rank,
    });
  };

  return (
    <div className={`vehicle-card ${isExpanded ? 'expanded' : ''}`}>
      <div className="vehicle-card-header" onClick={handleToggle}>
        <div className="vehicle-rank">#{rank}</div>
        <div className="vehicle-identity">
          <h3 className="vehicle-name">{v.year} {v.make} {v.model}</h3>
          <span className="vehicle-trim">{v.trim}</span>
        </div>
        <div className="vehicle-score">
          <div className="score-circle" style={{ '--score': composite }}>
            <span className="score-number">{composite}</span>
          </div>
          <span className="score-label-text">Match</span>
        </div>
      </div>

      <div className="vehicle-card-quick">
        <span className="quick-stat">{price}</span>
        <span className="quick-stat-divider">·</span>
        <span className="quick-stat">{fuelLabel}</span>
        <span className="quick-stat-divider">·</span>
        <span className="quick-stat">{v.safetyRating}★ Safety</span>
        <span className="quick-stat-divider">·</span>
        <span className="quick-stat">{v.drivetrain}</span>
      </div>

      {!isExpanded && reasons.length > 0 && (
        <div className="vehicle-card-preview">
          <p className="preview-reason">✓ {reasons[0]}</p>
        </div>
      )}

      {isExpanded && (
        <div className="vehicle-card-detail">
          <div className="detail-section">
            <h4 className="detail-heading">Why This Car Matches You</h4>
            <ul className="reason-list">
              {reasons.map((r, i) => (
                <li key={i} className="reason-item good">✓ {r}</li>
              ))}
            </ul>
            {tradeoffs.length > 0 && (
              <>
                <h4 className="detail-heading tradeoffs-heading">Trade-offs to Consider</h4>
                <ul className="reason-list">
                  {tradeoffs.map((t, i) => (
                    <li key={i} className="reason-item tradeoff">⚠ {t}</li>
                  ))}
                </ul>
              </>
            )}
          </div>

          <div className="detail-section">
            <h4 className="detail-heading">Scoring Breakdown</h4>
            <div className="score-bars">
              <ScoreBar score={Math.round(scores.priceFit)} label="Price Fit" color="#6BA5A5" />
              <ScoreBar score={Math.round(scores.reliability)} label="Reliability" color="#8B9E6B" />
              <ScoreBar score={Math.round(scores.safety)} label="Safety" color="#C4786C" />
              <ScoreBar score={Math.round(scores.fuelEconomy)} label="Fuel Economy" color="#9B8EC4" />
              <ScoreBar score={Math.round(scores.featureMatch)} label="Feature Match" color="#D4A574" />
              <ScoreBar score={Math.round(scores.terrainCapability)} label="Terrain" color="#7BA7BC" />
              <ScoreBar score={Math.round(scores.maintenanceCost)} label="Maint. Cost" color="#C49B6C" />
            </div>
          </div>

          <div className="detail-section">
            <h4 className="detail-heading">Specifications</h4>
            <div className="specs-grid">
              <div className="spec"><span className="spec-label">Engine</span><span className="spec-value">{v.engine}</span></div>
              <div className="spec"><span className="spec-label">Horsepower</span><span className="spec-value">{v.hp} hp</span></div>
              <div className="spec"><span className="spec-label">Drivetrain</span><span className="spec-value">{v.drivetrain}</span></div>
              <div className="spec"><span className="spec-label">Seating</span><span className="spec-value">{v.seating} passengers</span></div>
              {v.cargoVolume > 0 && <div className="spec"><span className="spec-label">Cargo</span><span className="spec-value">{v.cargoVolume} cu ft</span></div>}
              {v.towCapacity > 0 && <div className="spec"><span className="spec-label">Tow Capacity</span><span className="spec-value">{v.towCapacity.toLocaleString()} lbs</span></div>}
              <div className="spec"><span className="spec-label">Fuel Cost/yr</span><span className="spec-value">${v.annualFuelCost.toLocaleString()}</span></div>
              <div className="spec"><span className="spec-label">Maint. Cost/yr</span><span className="spec-value">${v.maintenanceCostAnnual.toLocaleString()}</span></div>
              <div className="spec"><span className="spec-label">NHTSA Complaints</span><span className="spec-value">{v.complaintCount}</span></div>
              <div className="spec"><span className="spec-label">Recalls</span><span className="spec-value">{v.recallCount}</span></div>
              <div className="spec"><span className="spec-label">Est. Lifespan</span><span className="spec-value">{(v.lifespanMiles / 1000).toFixed(0)}K miles</span></div>
            </div>
          </div>

          <div className="detail-section">
            <h4 className="detail-heading">Find This Car Near You</h4>
            <div className="deep-links">
              <a
                href={deepLinks.carscom}
                target="_blank"
                rel="noopener noreferrer"
                className="deep-link-btn cars-com"
                onClick={() => handleDeepLink('cars.com')}
              >
                Cars.com →
              </a>
              <a
                href={deepLinks.autotrader}
                target="_blank"
                rel="noopener noreferrer"
                className="deep-link-btn autotrader"
                onClick={() => handleDeepLink('autotrader')}
              >
                AutoTrader →
              </a>
              <a
                href={deepLinks.cargurus}
                target="_blank"
                rel="noopener noreferrer"
                className="deep-link-btn cargurus"
                onClick={() => handleDeepLink('cargurus')}
              >
                CarGurus →
              </a>
            </div>
          </div>
        </div>
      )}

      {!isExpanded && (
        <button className="expand-btn" onClick={handleToggle}>
          View full details ↓
        </button>
      )}
    </div>
  );
}

export default function ResultsView({ results, weights, answers, expandedResult, setExpandedResult, onRestart }) {
  if (!results || results.length === 0) {
    return (
      <div className="results-empty">
        <h2>No vehicles matched your criteria</h2>
        <p>Try broadening your budget, body style preferences, or brand selections.</p>
        <button className="welcome-cta" onClick={onRestart}>Start Over</button>
      </div>
    );
  }

  return (
    <div className="results-view">
      <div className="results-header">
        <div className="results-header-content">
          <h2 className="results-title">Your Top Matches</h2>
          <p className="results-subtitle">
            We scored {results.length} vehicles across {Object.keys(weights).length} dimensions based on your answers.
            Here are your best matches.
          </p>
        </div>
      </div>

      <div className="results-list">
        {results.map((result, i) => (
          <VehicleCard
            key={`${result.vehicle.make}-${result.vehicle.model}-${result.vehicle.year}`}
            result={result}
            rank={i + 1}
            isExpanded={expandedResult === i}
            onToggle={() => setExpandedResult(expandedResult === i ? null : i)}
          />
        ))}
      </div>

      <div className="results-footer">
        <p className="results-disclaimer">
          Data sourced from NHTSA and EPA (public domain). Scores are computed algorithmically
          and are not endorsements. Always test drive and consult professionals before purchasing.
        </p>
        <button className="results-restart-btn" onClick={onRestart}>
          Start a New Search
        </button>
      </div>
    </div>
  );
}

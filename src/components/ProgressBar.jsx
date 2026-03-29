export default function ProgressBar({ current, total, stage }) {
  const pct = total > 0 ? Math.round((current / total) * 100) : 0;

  return (
    <div className="progress-bar-container">
      <div className="progress-meta">
        <span className="progress-stage" style={{ color: stage?.color }}>
          {stage?.icon} {stage?.label}
        </span>
        <span className="progress-count">{current} of ~{total} questions</span>
      </div>
      <div className="progress-track">
        <div
          className="progress-fill"
          style={{ width: `${pct}%`, backgroundColor: stage?.color || '#D4A574' }}
        />
      </div>
    </div>
  );
}

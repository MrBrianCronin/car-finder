import { useState, useEffect } from 'react';

function formatValue(value, format) {
  if (format === 'currency') return `$${value.toLocaleString()}`;
  if (format === 'miles') return `${value.toLocaleString()} mi`;
  return value;
}

// ── Slider Input ──
function SliderInput({ question, value, onChange }) {
  const val = value ?? question.defaultValue ?? question.min;
  return (
    <div className="input-slider">
      <div className="slider-value">{formatValue(val, question.format)}</div>
      <input
        type="range"
        min={question.min}
        max={question.max}
        step={question.step}
        value={val}
        onChange={e => onChange(Number(e.target.value))}
        className="slider"
      />
      <div className="slider-range">
        <span>{formatValue(question.min, question.format)}</span>
        <span>{formatValue(question.max, question.format)}</span>
      </div>
    </div>
  );
}

// ── Single Select ──
function SingleSelect({ question, value, onChange }) {
  return (
    <div className="input-single-select">
      {question.options.map(opt => (
        <button
          key={opt.value}
          className={`select-option ${value === opt.value ? 'selected' : ''}`}
          onClick={() => onChange(value === opt.value ? undefined : opt.value)}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

// ── Multi Select ──
function MultiSelect({ question, value, onChange }) {
  const selected = Array.isArray(value) ? value : [];

  const toggle = (val) => {
    if (val === 'none') {
      onChange(['none']);
      return;
    }
    let next = selected.filter(v => v !== 'none');
    if (next.includes(val)) {
      next = next.filter(v => v !== val);
    } else {
      next = [...next, val];
    }
    onChange(next.length > 0 ? next : undefined);
  };

  return (
    <div className="input-multi-select">
      {question.options.map(opt => (
        <button
          key={opt.value}
          className={`select-option ${selected.includes(opt.value) ? 'selected' : ''}`}
          onClick={() => toggle(opt.value)}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

// ── Scale (1–5) ──
function ScaleInput({ question, value, onChange }) {
  return (
    <div className="input-scale">
      <div className="scale-buttons">
        {[1, 2, 3, 4, 5].map(n => (
          <button
            key={n}
            className={`scale-btn ${value === n ? 'selected' : ''}`}
            onClick={() => onChange(value === n ? undefined : n)}
          >
            {n}
          </button>
        ))}
      </div>
      <div className="scale-labels">
        {question.labels.map((label, i) => (
          <span key={i} className="scale-label">{label}</span>
        ))}
      </div>
    </div>
  );
}

// ── Number Picker ──
function NumberInput({ question, value, onChange }) {
  const val = value ?? question.defaultValue ?? question.min;
  return (
    <div className="input-number">
      <button
        className="num-btn"
        onClick={() => onChange(Math.max(question.min, val - 1))}
        disabled={val <= question.min}
      >
        −
      </button>
      <span className="num-value">{val}</span>
      <button
        className="num-btn"
        onClick={() => onChange(Math.min(question.max, val + 1))}
        disabled={val >= question.max}
      >
        +
      </button>
    </div>
  );
}

// ── Text Input ──
function TextInput({ question, value, onChange }) {
  return (
    <div className="input-text">
      <input
        type="text"
        value={value || ''}
        onChange={e => onChange(e.target.value || undefined)}
        placeholder={question.placeholder || ''}
        maxLength={question.maxLength || 200}
        className="text-field"
      />
    </div>
  );
}

// ── Brand Selector ──
function BrandSelector({ question, value, onChange }) {
  const prefs = value || { include: [], exclude: [] };
  const [mode, setMode] = useState('include');

  const toggleBrand = (brand) => {
    const list = mode === 'include' ? [...(prefs.include || [])] : [...(prefs.exclude || [])];
    const otherList = mode === 'include' ? [...(prefs.exclude || [])] : [...(prefs.include || [])];

    const otherIdx = otherList.indexOf(brand);
    if (otherIdx !== -1) otherList.splice(otherIdx, 1);

    const idx = list.indexOf(brand);
    if (idx !== -1) {
      list.splice(idx, 1);
    } else {
      list.push(brand);
    }

    const newPrefs = mode === 'include'
      ? { include: list, exclude: otherList }
      : { include: otherList, exclude: list };

    onChange(newPrefs);
  };

  const getBrandStatus = (brand) => {
    if (prefs.include?.includes(brand)) return 'included';
    if (prefs.exclude?.includes(brand)) return 'excluded';
    return 'neutral';
  };

  return (
    <div className="input-brand-selector">
      <div className="brand-mode-toggle">
        <button
          className={`mode-btn ${mode === 'include' ? 'active include-mode' : ''}`}
          onClick={() => setMode('include')}
        >
          ♥ Brands I love
        </button>
        <button
          className={`mode-btn ${mode === 'exclude' ? 'active exclude-mode' : ''}`}
          onClick={() => setMode('exclude')}
        >
          ✕ Brands to skip
        </button>
      </div>
      <div className="brand-grid">
        {question.brands.map(brand => {
          const status = getBrandStatus(brand);
          return (
            <button
              key={brand}
              className={`brand-chip ${status}`}
              onClick={() => toggleBrand(brand)}
            >
              {brand}
              {status === 'included' && <span className="brand-tag">♥</span>}
              {status === 'excluded' && <span className="brand-tag">✕</span>}
            </button>
          );
        })}
      </div>
      {(prefs.include?.length > 0 || prefs.exclude?.length > 0) && (
        <button className="brand-clear" onClick={() => onChange({ include: [], exclude: [] })}>
          Clear selections
        </button>
      )}
    </div>
  );
}

// ── Question Card ──
export default function QuestionCard({ question, value, onAnswer, onNext, onPrev, canGoBack, isOptional, hideNav }) {
  const [localValue, setLocalValue] = useState(value);

  useEffect(() => {
    setLocalValue(value);
  }, [question.id, value]);

  const handleChange = (val) => {
    setLocalValue(val);
    onAnswer(question.id, val);
  };

  const canProceed = isOptional || localValue !== undefined;

  const renderInput = () => {
    switch (question.type) {
      case 'slider':
        return <SliderInput question={question} value={localValue} onChange={handleChange} />;
      case 'single_select':
        return <SingleSelect question={question} value={localValue} onChange={handleChange} />;
      case 'multi_select':
        return <MultiSelect question={question} value={localValue} onChange={handleChange} />;
      case 'scale':
        return <ScaleInput question={question} value={localValue} onChange={handleChange} />;
      case 'number':
        return <NumberInput question={question} value={localValue} onChange={handleChange} />;
      case 'text':
        return <TextInput question={question} value={localValue} onChange={handleChange} />;
      case 'brand_selector':
        return <BrandSelector question={question} value={localValue} onChange={handleChange} />;
      default:
        return null;
    }
  };

  return (
    <div className="question-card">
      <h2 className="question-text">{question.text}</h2>
      {question.subtext && <p className="question-subtext">{question.subtext}</p>}

      <div className="question-input">
        {renderInput()}
      </div>

      {!hideNav && (
        <div className="question-nav">
          {canGoBack && (
            <button className="nav-btn nav-prev" onClick={onPrev}>
              ← Back
            </button>
          )}
          <button
            className={`nav-btn nav-next ${canProceed ? '' : 'disabled'}`}
            onClick={canProceed ? onNext : undefined}
            disabled={!canProceed}
          >
            {isOptional && !localValue ? 'Skip →' : 'Continue →'}
          </button>
        </div>
      )}
    </div>
  );
}

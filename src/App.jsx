import { useState, useReducer, useCallback, useMemo, useEffect, useRef } from 'react';
import { STAGES, QUESTIONS } from './data/questions';
import { findMatches } from './engine/matcher';
import { initTelemetry, trackEvent, setUserId, clearUserId } from './telemetry';
import { createClient } from '@supabase/supabase-js';
import QuestionCard from './components/QuestionCard';
import ResultsView from './components/ResultsView';
import WelcomeScreen from './components/WelcomeScreen';

// ── Supabase client ──
const SUPABASE_URL = 'https://cedfqqfuebfvdfrqkkbz.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNlZGZxcWZ1ZWJmdmRmcnFra2J6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ4MjE3NTgsImV4cCI6MjA5MDM5Nzc1OH0.tlE3GoJVb2KyaNdgWkvw5fpTCXPJ4iCTxLMhos8JtxE';
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Initialize telemetry
if (typeof window !== 'undefined') {
  initTelemetry('car-finder');
}

// ── State reducer ──
function reducer(state, action) {
  switch (action.type) {
    case 'START':
      return { ...state, phase: 'questionnaire', activePage: 0, startTime: Date.now() };
    case 'RESUME':
      return {
        ...state,
        phase: 'questionnaire',
        answers: action.answers || {},
        activePage: action.activePage || 0,
        startTime: Date.now(),
      };
    case 'ANSWER': {
      const newAnswers = { ...state.answers, [action.questionId]: action.value };
      return { ...state, answers: newAnswers };
    }
    case 'SET_PAGE':
      return { ...state, activePage: action.page };
    case 'SHOW_RESULTS':
      return { ...state, phase: 'results' };
    case 'SET_RESULTS':
      return { ...state, results: action.results, weights: action.weights };
    case 'BACK_TO_QUESTIONS':
      return { ...state, phase: 'questionnaire', results: null, weights: null };
    case 'RESTART':
      return { ...initialState };
    case 'TOGGLE_DISCLOSURE':
      return { ...state, showDisclosure: !state.showDisclosure };
    default:
      return state;
  }
}

const initialState = {
  phase: 'welcome',
  answers: {},
  activePage: 0,
  results: null,
  weights: null,
  startTime: null,
  showDisclosure: false,
};

// ── Group questions by stage ──
const PAGES = STAGES.map(stage => ({
  ...stage,
  questions: QUESTIONS.filter(q => q.stage === stage.id),
}));

export default function App() {
  const [state, dispatch] = useReducer(reducer, initialState);
  const [expandedResult, setExpandedResult] = useState(null);
  const [user, setUser] = useState(null);
  const [savedSession, setSavedSession] = useState(null);
  const [showResumePrompt, setShowResumePrompt] = useState(false);
  const [saving, setSaving] = useState(false);
  const saveTimerRef = useRef(null);

  const answeredCount = Object.keys(state.answers).length;

  // ── Auth state management ──
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUser(session.user);
        setUserId(session.user.id);
        loadSavedSession(session.user.id);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser(session.user);
        setUserId(session.user.id);
        trackEvent('login_completed', { provider: 'google' });
        loadSavedSession(session.user.id);
      } else {
        setUser(null);
        clearUserId();
        setSavedSession(null);
        setShowResumePrompt(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // ── Load saved session ──
  const loadSavedSession = async (userId) => {
    try {
      const { data, error } = await supabase
        .from('saved_sessions')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (data && !error) {
        const answerCount = Object.keys(data.answers || {}).length;
        if (answerCount > 0) {
          setSavedSession(data);
          // Only show resume prompt if user is on the welcome screen
          if (state.phase === 'welcome') {
            setShowResumePrompt(true);
          }
        }
      }
    } catch (e) {
      // No saved session — that's fine
    }
  };

  // ── Auto-save progress (debounced) ──
  useEffect(() => {
    if (!user || state.phase === 'welcome' || answeredCount === 0) return;

    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(async () => {
      setSaving(true);
      try {
        const { error } = await supabase
          .from('saved_sessions')
          .upsert({
            user_id: user.id,
            answers: state.answers,
            active_page: state.activePage,
            results: state.results,
            updated_at: new Date().toISOString(),
          }, { onConflict: 'user_id' });

        if (error) console.error('Save error:', error);
      } catch (e) {
        console.error('Save error:', e);
      }
      setSaving(false);
    }, 2000); // Save 2 seconds after last change

    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, [state.answers, state.activePage, state.results, user, state.phase, answeredCount]);

  // ── Get visible questions for a page ──
  const getVisibleQuestions = useCallback((page) => {
    return page.questions.filter(q => !q.skipIf || !q.skipIf(state.answers));
  }, [state.answers]);

  // ── Count answered questions per page ──
  const pageAnswerCounts = useMemo(() => {
    return PAGES.map(page => {
      const visible = page.questions.filter(q => !q.skipIf || !q.skipIf(state.answers));
      const answered = visible.filter(q => state.answers[q.id] !== undefined).length;
      return { visible: visible.length, answered };
    });
  }, [state.answers]);

  // ── Handlers ──
  const handleLogin = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: 'https://briancronin.ai/car-finder/',
      },
    });
    if (error) {
      console.error('Login error:', error);
      trackEvent('login_failed', { error: error.message });
    }
  };

  const handleLogout = async () => {
    trackEvent('logout', {});
    // Clear saved session state
    setSavedSession(null);
    setShowResumePrompt(false);
    await supabase.auth.signOut();
    setUser(null);
    clearUserId();
  };

  const handleStart = useCallback(() => {
    trackEvent('questionnaire_started', {});
    setShowResumePrompt(false);
    dispatch({ type: 'START' });
  }, []);

  const handleResume = useCallback(() => {
    if (!savedSession) return;
    trackEvent('results_loaded', { answeredCount: Object.keys(savedSession.answers || {}).length });
    setShowResumePrompt(false);
    dispatch({
      type: 'RESUME',
      answers: savedSession.answers,
      activePage: savedSession.active_page || 0,
    });
  }, [savedSession]);

  const handleAnswer = useCallback((questionId, value) => {
    dispatch({ type: 'ANSWER', questionId, value });
    const q = QUESTIONS.find(q => q.id === questionId);
    trackEvent('question_answered', {
      question: questionId,
      stage: q?.stage,
      type: q?.type,
    });
  }, []);

  const handleShowResults = useCallback(() => {
    const elapsed = Date.now() - (state.startTime || Date.now());
    trackEvent('questionnaire_completed', {
      questionsAnswered: answeredCount,
      timeElapsedMs: elapsed,
    });
    dispatch({ type: 'SHOW_RESULTS' });
  }, [answeredCount, state.startTime]);

  const handleRestart = useCallback(async () => {
    trackEvent('questionnaire_restarted', {});
    setExpandedResult(null);
    setShowResumePrompt(false);
    // Clear saved session from database
    if (user) {
      await supabase.from('saved_sessions').delete().eq('user_id', user.id);
    }
    setSavedSession(null);
    dispatch({ type: 'RESTART' });
  }, [user]);

  // ── Run matcher when entering results ──
  if (state.phase === 'results' && !state.results) {
    const { results, weights } = findMatches(state.answers);
    dispatch({ type: 'SET_RESULTS', results, weights });
  }

  const currentPage = PAGES[state.activePage];
  const visibleQuestions = currentPage ? getVisibleQuestions(currentPage) : [];

  return (
    <div className="app">
      {/* ── Header ── */}
      <header className="app-header">
        <a href="/" className="header-back" aria-label="Back to briancronin.ai">
          ← briancronin.ai
        </a>
        <div className="header-title">
          <span className="header-icon">🚗</span>
          Vehicle Purchase Assistant
        </div>
        <div className="header-right">
          {saving && <span className="save-indicator">Saving...</span>}
          {user && !saving && answeredCount > 0 && state.phase !== 'welcome' && (
            <span className="save-indicator saved">✓ Saved</span>
          )}
          {state.phase !== 'welcome' && (
            <button className="header-restart" onClick={handleRestart}>
              Start Over
            </button>
          )}
          {user ? (
            <div className="header-user">
              {user.user_metadata?.avatar_url && (
                <img src={user.user_metadata.avatar_url} alt="" className="header-avatar" />
              )}
              <button className="header-logout" onClick={handleLogout}>Sign out</button>
            </div>
          ) : (
            <button className="header-login" onClick={handleLogin}>
              <span className="login-g">G</span> Sign in
            </button>
          )}
        </div>
      </header>

      <main className="app-main">
        {/* ── Welcome Screen ── */}
        {state.phase === 'welcome' && !showResumePrompt && (
          <WelcomeScreen onStart={handleStart} />
        )}

        {/* ── Resume Prompt ── */}
        {state.phase === 'welcome' && showResumePrompt && (
          <div className="resume-prompt">
            <div className="resume-card">
              <span className="resume-icon">👋</span>
              <h2 className="resume-title">Welcome back{user?.user_metadata?.full_name ? `, ${user.user_metadata.full_name.split(' ')[0]}` : ''}!</h2>
              <p className="resume-subtitle">
                You have a saved session with {Object.keys(savedSession?.answers || {}).length} questions answered.
                {savedSession?.results && ' Your recommendations are ready too.'}
              </p>
              <div className="resume-actions">
                <button className="resume-btn primary" onClick={handleResume}>
                  Pick Up Where You Left Off →
                </button>
                <button className="resume-btn secondary" onClick={handleStart}>
                  Start Fresh
                </button>
              </div>
            </div>
            {!user && (
              <div className="resume-login-hint">
                <button className="header-login" onClick={handleLogin}>
                  <span className="login-g">G</span> Sign in to save progress
                </button>
              </div>
            )}
          </div>
        )}

        {/* ── Questionnaire ── */}
        {state.phase === 'questionnaire' && (
          <div className="pages-container">
            {/* Tab Navigation */}
            <nav className="page-tabs">
              {PAGES.map((page, i) => {
                const counts = pageAnswerCounts[i];
                const isActive = i === state.activePage;
                const hasAnswers = counts.answered > 0;
                return (
                  <button
                    key={page.id}
                    className={`page-tab ${isActive ? 'active' : ''} ${hasAnswers ? 'has-answers' : ''}`}
                    onClick={() => {
                      dispatch({ type: 'SET_PAGE', page: i });
                      trackEvent('stage_completed', { stage: page.id, action: 'tab_click' });
                    }}
                    style={{ '--stage-color': page.color }}
                  >
                    <span className="tab-icon">{page.icon}</span>
                    <span className="tab-label">{page.label}</span>
                    {hasAnswers && (
                      <span className="tab-badge">{counts.answered}/{counts.visible}</span>
                    )}
                  </button>
                );
              })}
            </nav>

            {/* Page Header */}
            <div className="page-header" style={{ '--stage-color': currentPage.color }}>
              <span className="page-header-icon">{currentPage.icon}</span>
              <div>
                <h2 className="page-header-title">{currentPage.label}</h2>
                <p className="page-header-sub">
                  {pageAnswerCounts[state.activePage].answered} of {pageAnswerCounts[state.activePage].visible} answered · All questions are optional
                </p>
              </div>
            </div>

            {/* Questions */}
            <div className="page-questions">
              {visibleQuestions.length === 0 ? (
                <div className="page-empty">
                  <p>No questions on this page based on your previous answers.</p>
                </div>
              ) : (
                visibleQuestions.map((question) => (
                  <div key={question.id} className="page-question-item">
                    <QuestionCard
                      question={question}
                      value={state.answers[question.id]}
                      onAnswer={handleAnswer}
                      onNext={() => {}}
                      onPrev={() => {}}
                      canGoBack={false}
                      isOptional={true}
                      hideNav={true}
                    />
                  </div>
                ))
              )}
            </div>

            {/* Page Navigation */}
            <div className="page-nav">
              <button
                className="page-nav-btn prev"
                onClick={() => dispatch({ type: 'SET_PAGE', page: Math.max(0, state.activePage - 1) })}
                disabled={state.activePage === 0}
              >
                ← Previous
              </button>
              <div className="page-nav-center">
                {answeredCount > 0 && (
                  <button className="see-results-btn" onClick={handleShowResults}>
                    See Recommendations ({answeredCount} answered)
                  </button>
                )}
              </div>
              {state.activePage < PAGES.length - 1 ? (
                <button
                  className="page-nav-btn next"
                  onClick={() => dispatch({ type: 'SET_PAGE', page: state.activePage + 1 })}
                >
                  Next →
                </button>
              ) : (
                <button
                  className={`page-nav-btn next ${answeredCount > 0 ? 'results-ready' : ''}`}
                  onClick={answeredCount > 0 ? handleShowResults : undefined}
                  disabled={answeredCount === 0}
                >
                  See Results →
                </button>
              )}
            </div>

            {/* Sign-in prompt for anonymous users */}
            {!user && answeredCount >= 3 && (
              <div className="save-prompt">
                <button className="save-prompt-btn" onClick={handleLogin}>
                  <span className="login-g">G</span> Sign in to save your progress
                </button>
              </div>
            )}
          </div>
        )}

        {/* ── Results ── */}
        {state.phase === 'results' && state.results && (
          <>
            <div className="results-back-bar">
              <button className="results-back-btn" onClick={() => dispatch({ type: 'BACK_TO_QUESTIONS' })}>
                ← Modify Answers
              </button>
              <span className="results-count">{answeredCount} questions answered</span>
            </div>
            <ResultsView
              results={state.results}
              weights={state.weights}
              answers={state.answers}
              expandedResult={expandedResult}
              setExpandedResult={setExpandedResult}
              onRestart={handleRestart}
            />
          </>
        )}
      </main>

      {/* ── Disclosure Modal ── */}
      {state.showDisclosure && (
        <div className="disclosure-overlay" onClick={() => dispatch({ type: 'TOGGLE_DISCLOSURE' })}>
          <div className="disclosure-modal" onClick={e => e.stopPropagation()}>
            <div className="disclosure-header">
              <h2>Disclosures & Important Information</h2>
              <button className="disclosure-close" onClick={() => dispatch({ type: 'TOGGLE_DISCLOSURE' })}>×</button>
            </div>
            <div className="disclosure-body">
              {[
                { t: "Sample & Illustrative Data Only", p: "Vehicle data displayed in this application is sample, illustrative, and approximate. It is NOT real-time data and may not reflect actual current specifications, pricing, availability, or safety ratings. Performance figures, fuel economy estimates, safety scores, and all other metrics shown are approximate values used solely for demonstration purposes. Do not rely on any data shown in this application for purchasing decisions." },
                { t: "Technology Demonstration", p: "This application exists solely as a technology demonstration showcasing modern web development techniques including React, adaptive questionnaires, and scoring algorithms. It is a portfolio project and is not intended to serve as an automotive advisory tool or vehicle purchasing platform of any kind." },
                { t: "Not Professional Advice", p: "Nothing presented in this application constitutes automotive advice, purchasing advice, financial advice, or any other form of professional advice. No vehicle purchasing decisions should be made based on any information displayed here." },
                { t: "No Affiliation", p: "This application is not affiliated with, endorsed by, or connected to any vehicle manufacturer, dealer, automotive marketplace, or automotive data provider. Vehicle names, makes, and models referenced are trademarks of their respective owners and are used here for identification purposes only within this technology demonstration." },
                { t: "Third-Party Links", p: "This application may contain links to third-party websites such as Cars.com, AutoTrader, and CarGurus. These links are provided for convenience only. The creator has no control over and assumes no responsibility for the content, privacy policies, or practices of any third-party sites." },
                { t: "No Warranty on Data", p: "All data is provided 'as is' without warranty of any kind, express or implied. The creator makes no representations regarding the accuracy, completeness, currentness, or reliability of any vehicle data, safety ratings, fuel economy figures, or pricing information shown." },
                { t: "Vehicle Purchases Involve Risk", p: "Purchasing a vehicle is a significant financial decision involving many factors not addressed by this tool, including but not limited to: local market conditions, vehicle history, inspection results, financing terms, insurance costs, registration fees, and individual circumstances. Always conduct thorough research, obtain a professional vehicle inspection, and consult with qualified professionals before making any vehicle purchase." },
                { t: "Consult Professionals", p: "Before making any vehicle purchasing decisions, you should consult with qualified automotive professionals, mechanics, and financial advisors who can consider your specific circumstances, needs, and local market conditions." },
              ].map(({ t, p }, i) => (
                <div key={i} className="disclosure-item">
                  <h3>{t}</h3>
                  <p>{p}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Footer ── */}
      <footer className="app-footer">
        <p className="footer-disclaimer">
          <strong>Disclaimer:</strong> All vehicle data is sample and illustrative only — not real-time and not sourced from any automotive data provider.
          This is a technology demonstration. Not purchasing advice. Do not use for vehicle purchasing decisions.
        </p>
        <button className="footer-disclosure-btn" onClick={() => dispatch({ type: 'TOGGLE_DISCLOSURE' })}>
          Full Disclosures →
        </button>
      </footer>
    </div>
  );
}

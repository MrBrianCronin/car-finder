import { useState, useReducer, useCallback } from 'react';
import { STAGES, QUESTIONS } from './data/questions';
import { findMatches } from './engine/matcher';
import { initTelemetry, trackEvent } from './telemetry';
import QuestionCard from './components/QuestionCard';
import ProgressBar from './components/ProgressBar';
import StageIndicator from './components/StageIndicator';
import ResultsView from './components/ResultsView';
import WelcomeScreen from './components/WelcomeScreen';

// Initialize telemetry
if (typeof window !== 'undefined') {
  initTelemetry('car-finder');
}

// ── State reducer ──
function reducer(state, action) {
  switch (action.type) {
    case 'START':
      return { ...state, phase: 'questionnaire', currentIndex: 0, startTime: Date.now() };
    case 'ANSWER': {
      const newAnswers = { ...state.answers, [action.questionId]: action.value };
      return { ...state, answers: newAnswers };
    }
    case 'NEXT': {
      // Find next non-skipped question
      let nextIndex = state.currentIndex + 1;
      while (nextIndex < state.activeQuestions.length) {
        const q = state.activeQuestions[nextIndex];
        if (q.skipIf && q.skipIf(state.answers)) {
          nextIndex++;
        } else {
          break;
        }
      }
      if (nextIndex >= state.activeQuestions.length) {
        return { ...state, phase: 'results' };
      }
      return { ...state, currentIndex: nextIndex };
    }
    case 'PREV': {
      let prevIndex = state.currentIndex - 1;
      while (prevIndex >= 0) {
        const q = state.activeQuestions[prevIndex];
        if (q.skipIf && q.skipIf(state.answers)) {
          prevIndex--;
        } else {
          break;
        }
      }
      return { ...state, currentIndex: Math.max(0, prevIndex) };
    }
    case 'SET_RESULTS':
      return { ...state, results: action.results, weights: action.weights };
    case 'RESTART':
      return {
        ...initialState,
        activeQuestions: QUESTIONS,
      };
    case 'BACK_TO_RESULTS':
      return { ...state, phase: 'results' };
    default:
      return state;
  }
}

const initialState = {
  phase: 'welcome', // welcome | questionnaire | results
  answers: {},
  currentIndex: 0,
  activeQuestions: QUESTIONS,
  results: null,
  weights: null,
  startTime: null,
};

export default function App() {
  const [state, dispatch] = useReducer(reducer, initialState);
  const [direction, setDirection] = useState('forward');
  const [expandedResult, setExpandedResult] = useState(null);

  const currentQuestion = state.activeQuestions[state.currentIndex];
  const currentStage = currentQuestion ? STAGES.find(s => s.id === currentQuestion.stage) : null;

  // Count actually-shown questions (excluding skipped)
  const answeredCount = Object.keys(state.answers).length;
  const totalQuestions = state.activeQuestions.filter(q => !q.skipIf || !q.skipIf(state.answers)).length;

  const handleStart = useCallback(() => {
    trackEvent('questionnaire_started', {});
    dispatch({ type: 'START' });
  }, []);

  const handleAnswer = useCallback((questionId, value) => {
    dispatch({ type: 'ANSWER', questionId, value });

    const q = state.activeQuestions.find(q => q.id === questionId);
    const stage = q ? q.stage : 'unknown';
    trackEvent('question_answered', {
      question: questionId,
      stage,
      type: q?.type,
    });
  }, [state.activeQuestions]);

  const handleNext = useCallback(() => {
    setDirection('forward');

    // Check if we're completing a stage
    const currentQ = state.activeQuestions[state.currentIndex];
    const nextIndex = state.currentIndex + 1;
    if (nextIndex < state.activeQuestions.length) {
      const nextQ = state.activeQuestions[nextIndex];
      if (currentQ && nextQ && currentQ.stage !== nextQ.stage) {
        trackEvent('stage_completed', { stage: currentQ.stage });
      }
    }

    dispatch({ type: 'NEXT' });
  }, [state.currentIndex, state.activeQuestions]);

  const handlePrev = useCallback(() => {
    setDirection('backward');
    dispatch({ type: 'PREV' });
  }, []);

  const handleRestart = useCallback(() => {
    trackEvent('questionnaire_restarted', {});
    setExpandedResult(null);
    dispatch({ type: 'RESTART' });
  }, []);

  // When entering results phase, run the matcher
  if (state.phase === 'results' && !state.results) {
    const elapsed = Date.now() - (state.startTime || Date.now());
    trackEvent('questionnaire_completed', {
      questionsAnswered: answeredCount,
      timeElapsedMs: elapsed,
    });

    const { results, weights } = findMatches(state.answers);
    dispatch({ type: 'SET_RESULTS', results, weights });
  }

  return (
    <div className="app">
      <header className="app-header">
        <a href="https://briancronin.ai" className="header-back" aria-label="Back to briancronin.ai">
          ← briancronin.ai
        </a>
        <div className="header-title">
          <span className="header-icon">🚗</span>
          Car Finder
        </div>
        {state.phase !== 'welcome' && (
          <button className="header-restart" onClick={handleRestart}>
            Start Over
          </button>
        )}
      </header>

      <main className="app-main">
        {state.phase === 'welcome' && (
          <WelcomeScreen onStart={handleStart} />
        )}

        {state.phase === 'questionnaire' && currentQuestion && (
          <div className="questionnaire-container">
            <ProgressBar
              current={answeredCount}
              total={totalQuestions}
              stage={currentStage}
            />
            <StageIndicator
              stages={STAGES}
              currentStage={currentStage?.id}
              answers={state.answers}
              questions={state.activeQuestions}
            />
            <div className={`question-wrapper question-${direction}`} key={currentQuestion.id}>
              <QuestionCard
                question={currentQuestion}
                value={state.answers[currentQuestion.id]}
                onAnswer={handleAnswer}
                onNext={handleNext}
                onPrev={handlePrev}
                canGoBack={state.currentIndex > 0}
                isOptional={currentQuestion.optional}
              />
            </div>
          </div>
        )}

        {state.phase === 'results' && state.results && (
          <ResultsView
            results={state.results}
            weights={state.weights}
            answers={state.answers}
            expandedResult={expandedResult}
            setExpandedResult={setExpandedResult}
            onRestart={handleRestart}
          />
        )}
      </main>

      <footer className="app-footer">
        <p>
          Built by <a href="https://briancronin.ai">Brian Cronin</a> · Data from NHTSA &amp; EPA (public domain) · For informational purposes only — not a substitute for professional advice.
        </p>
      </footer>
    </div>
  );
}

/**
 * Telemetry Module — Car Finder
 * ==============================
 * Lightweight, anonymous event tracking for briancronin.ai apps.
 * Extended with optional user_id support for cross-session tracking
 * when users are logged in via Google OAuth.
 *
 * Usage:
 *   import { trackEvent, initTelemetry, setUserId, clearUserId } from './telemetry';
 *
 *   // Call once on app load
 *   initTelemetry('car-finder');
 *
 *   // After Google OAuth login
 *   setUserId(supabaseUser.id);
 *
 *   // Track events anywhere
 *   trackEvent('question_answered', { question: 1, stage: 'budget', value: '25000-35000' });
 *   trackEvent('recommendation_viewed', { make: 'Toyota', model: 'RAV4', year: 2022 });
 *   trackEvent('deep_link_clicked', { marketplace: 'cars.com', make: 'Toyota', model: 'RAV4' });
 *
 *   // On logout
 *   clearUserId();
 *
 * Security:
 *   - No PII collected (no IPs, no user agents, no cookies)
 *   - Session ID is a random UUID stored in memory only (not persisted)
 *   - user_id is the Supabase UUID — not an email or name
 *   - Events are batched to reduce API calls
 *   - All failures are silent — never affects user experience
 *
 * Allowed event types for car-finder:
 *   page_view, session_heartbeat,
 *   question_answered, question_skipped, stage_completed,
 *   questionnaire_completed, questionnaire_restarted,
 *   recommendation_viewed, recommendation_expanded,
 *   narrative_loaded, narrative_fallback,
 *   comparison_opened, comparison_vehicle_added, comparison_vehicle_removed,
 *   deep_link_clicked, results_saved, results_loaded,
 *   login_completed, login_failed, logout
 */

// ─── Configuration ───
const TELEMETRY_ENDPOINT = '/api/telemetry';
const BATCH_INTERVAL_MS = 5000; // Send events every 5 seconds
const HEARTBEAT_INTERVAL_MS = 30000; // Heartbeat every 30 seconds
const MAX_BATCH_SIZE = 15;

// ─── State ───
let sessionId = null;
let userId = null; // Set after OAuth login, null when anonymous
let currentPage = 'unknown';
let eventQueue = [];
let batchTimer = null;
let heartbeatTimer = null;
let isInitialized = false;

// ─── Generate a cryptographically random UUID v4 ───
function generateSessionId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // Fallback for older browsers
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

// ─── Send batched events to the API ───
async function flushEvents() {
  if (eventQueue.length === 0) return;

  // Grab current batch and clear queue
  const batch = eventQueue.splice(0, MAX_BATCH_SIZE);

  try {
    await fetch(TELEMETRY_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ events: batch }),
      // Don't wait forever — timeout after 3 seconds
      signal: AbortSignal.timeout ? AbortSignal.timeout(3000) : undefined,
    });
    // We don't check the response — fire and forget
  } catch (error) {
    // Silent failure — telemetry should never break the app
    // Events are lost, which is acceptable
  }
}

// ─── Public API ───

/**
 * Initialize telemetry for a specific page/app.
 * Call once when the app loads.
 *
 * @param {string} page - App identifier (e.g., 'car-finder', 'etf-finder')
 */
export function initTelemetry(page) {
  if (isInitialized) return;
  isInitialized = true;

  sessionId = generateSessionId();
  currentPage = page || 'unknown';

  // Start the batch send timer
  batchTimer = setInterval(flushEvents, BATCH_INTERVAL_MS);

  // Start heartbeat for time-on-page tracking
  heartbeatTimer = setInterval(() => {
    trackEvent('session_heartbeat', {});
  }, HEARTBEAT_INTERVAL_MS);

  // Track initial page view
  trackEvent('page_view', {
    url: typeof window !== 'undefined' ? window.location.pathname : '',
    referrer: typeof document !== 'undefined' ? document.referrer || '' : '',
  });

  // Flush remaining events when the user leaves
  if (typeof window !== 'undefined') {
    window.addEventListener('beforeunload', () => {
      flushEvents();
    });

    // Also flush when the page becomes hidden (mobile tab switching)
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') {
        flushEvents();
      }
    });
  }
}

/**
 * Set the user ID after successful OAuth login.
 * This attaches the Supabase user UUID to all subsequent events,
 * enabling cross-session tracking for logged-in users.
 *
 * @param {string} id - Supabase user UUID
 */
export function setUserId(id) {
  if (typeof id === 'string' && id.length > 0) {
    userId = id;
  }
}

/**
 * Clear the user ID on logout.
 * Subsequent events will be anonymous (session-only).
 */
export function clearUserId() {
  userId = null;
}

/**
 * Track an event.
 *
 * @param {string} eventType - One of the allowed event types
 * @param {object} eventData - Additional data for the event
 */
export function trackEvent(eventType, eventData = {}) {
  if (!isInitialized || !sessionId) return;

  // Don't track if the page isn't visible (background tabs)
  if (
    typeof document !== 'undefined' &&
    document.visibilityState === 'hidden' &&
    eventType !== 'session_heartbeat'
  ) {
    return;
  }

  const event = {
    session_id: sessionId,
    event_type: eventType,
    event_data: eventData,
    page: currentPage,
    timestamp: Date.now(),
  };

  // Attach user_id if the user is logged in
  if (userId) {
    event.user_id = userId;
  }

  eventQueue.push(event);

  // If queue is getting large, flush immediately
  if (eventQueue.length >= MAX_BATCH_SIZE) {
    flushEvents();
  }
}

/**
 * Clean up timers. Call when the app unmounts (optional).
 */
export function destroyTelemetry() {
  if (batchTimer) clearInterval(batchTimer);
  if (heartbeatTimer) clearInterval(heartbeatTimer);
  flushEvents(); // Send any remaining events
  isInitialized = false;
  sessionId = null;
  userId = null;
  eventQueue = [];
}

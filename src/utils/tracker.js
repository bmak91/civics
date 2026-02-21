import { nanoid } from "nanoid";

const ATTEMPTS_KEY = "civics-attempts";
const SESSIONS_KEY = "civics-test-sessions";

// --- Attempts ---

function loadAttempts() {
  try {
    return JSON.parse(localStorage.getItem(ATTEMPTS_KEY)) || {};
  } catch {
    return {};
  }
}

function saveAttempts(attempts) {
  localStorage.setItem(ATTEMPTS_KEY, JSON.stringify(attempts));
}

export function recordAttempt(questionId, choiceId, displayIndex, correct, sessionId) {
  const attempts = loadAttempts();
  if (!attempts[questionId]) {
    attempts[questionId] = [];
  }
  const entry = { timestamp: Date.now(), choiceId, displayIndex, correct };
  if (sessionId) entry.sessionId = sessionId;
  attempts[questionId].push(entry);
  saveAttempts(attempts);
}

export function getAttempts() {
  return loadAttempts();
}

export function getQuestionAttempts(questionId) {
  return loadAttempts()[questionId] || [];
}

// --- Test Sessions ---

function loadSessions() {
  try {
    return JSON.parse(localStorage.getItem(SESSIONS_KEY)) || [];
  } catch {
    return [];
  }
}

function saveSessions(sessions) {
  localStorage.setItem(SESSIONS_KEY, JSON.stringify(sessions));
}

export function startTestSession(questionIds) {
  const session = {
    id: nanoid(10),
    startedAt: Date.now(),
    finishedAt: null,
    completed: false,
    questionIds,
    score: 0,
    answered: 0,
    total: questionIds.length,
  };
  const sessions = loadSessions();
  sessions.push(session);
  saveSessions(sessions);
  return session.id;
}

export function updateTestSession(sessionId, score, answered) {
  const sessions = loadSessions();
  const session = sessions.find((s) => s.id === sessionId);
  if (session) {
    session.score = score;
    session.answered = answered;
    session.lastActivityAt = Date.now();
    saveSessions(sessions);
  }
}

export function completeTestSession(sessionId) {
  const sessions = loadSessions();
  const session = sessions.find((s) => s.id === sessionId);
  if (session) {
    session.finishedAt = Date.now();
    session.completed = true;
    saveSessions(sessions);
  }
}

export function getTestSessions() {
  return loadSessions();
}

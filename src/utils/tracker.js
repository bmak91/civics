import { nanoid } from "nanoid";

const ATTEMPTS_KEY = "civics-attempts";
const SESSIONS_KEY = "civics-test-sessions";
const SEEN_KEY = "civics-test-seen";

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

  // Wrong answers reduce seen count so the question resurfaces sooner
  if (!correct) {
    try {
      const seen = JSON.parse(localStorage.getItem(SEEN_KEY)) || {};
      if (seen[questionId]) {
        seen[questionId] = Math.max(0, seen[questionId] - 0.5);
        localStorage.setItem(SEEN_KEY, JSON.stringify(seen));
      }
    } catch {}
  }
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

export function getTestSession(sessionId) {
  return loadSessions().find((s) => s.id === sessionId) || null;
}

export function getTestSessions() {
  return loadSessions();
}

export function resetAllStats() {
  localStorage.removeItem(ATTEMPTS_KEY);
  localStorage.removeItem(SESSIONS_KEY);
  localStorage.removeItem(SEEN_KEY);
}

export function exportStats() {
  const data = {};
  for (const key of [ATTEMPTS_KEY, SESSIONS_KEY, SEEN_KEY]) {
    const raw = localStorage.getItem(key);
    if (raw !== null) data[key] = JSON.parse(raw);
  }
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "coach-civique-stats.json";
  a.click();
  URL.revokeObjectURL(url);
}

export function importStats(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(reader.result);
        for (const key of [ATTEMPTS_KEY, SESSIONS_KEY, SEEN_KEY]) {
          if (key in data) localStorage.setItem(key, JSON.stringify(data[key]));
        }
        resolve();
      } catch (e) {
        reject(e);
      }
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsText(file);
  });
}

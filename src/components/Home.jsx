import { useState } from "react";
import { getAttempts, getTestSessions, resetAllStats } from "../utils/tracker";
import allQuestions from "../data/questions";
import Stats from "./Stats";

const questions = allQuestions.filter((q) => q.choices.length > 0);

// Question ID → category name map (stable, never changes)
const categoryOf = {};
for (const q of questions) {
  categoryOf[q.id] = q.category;
}

function computeCategoryStats() {
  const attempts = getAttempts();

  const categories = {};
  for (const q of questions) {
    if (!categories[q.category]) {
      categories[q.category] = { total: 0, attempted: 0, correct: 0, attempts: 0 };
    }
    categories[q.category].total++;
  }

  // Aggregate attempts per category
  for (const [qId, qAttempts] of Object.entries(attempts)) {
    const cat = categoryOf[qId];
    if (!cat || !categories[cat]) continue;
    categories[cat].attempted++;
    for (const a of qAttempts) {
      categories[cat].attempts++;
      if (a.correct) categories[cat].correct++;
    }
  }

  return categories;
}

export default function Home({ onSelectMode }) {
  const [stats, setStats] = useState(() => computeCategoryStats());
  const [sessions, setSessions] = useState(() => getTestSessions());

  function handleReset() {
    if (window.confirm("Reset all stats? This will clear all attempt history and test sessions.")) {
      resetAllStats();
      setStats(computeCategoryStats());
      setSessions(getTestSessions());
    }
  }

  const hasStats = Object.values(stats).some((s) => s.attempts > 0);

  const radarCategories = Object.entries(stats).map(([category, s]) => ({
    label: category,
    pct: s.attempts > 0 ? Math.round((s.correct / s.attempts) * 100) : 0,
    attempted: s.attempted,
    total: s.total,
    correct: s.correct,
    attempts: s.attempts,
  }));

  return (
    <div className="home">
      <Stats categories={radarCategories} sessions={sessions} categoryOf={categoryOf} onReset={hasStats ? handleReset : null} />

      <p className="home-subtitle">Choose how you want to practice</p>
      <div className="mode-cards">
        <button className="mode-card" onClick={() => onSelectMode("study")}>
          <div className="mode-icon">📖</div>
          <h2>Study Mode</h2>
          <p>Go through all questions at your own pace. Review explanations and learn the material.</p>
        </button>
        <button className="mode-card" onClick={() => onSelectMode("test")}>
          <div className="mode-icon">✍️</div>
          <h2>Test Mode</h2>
          <p>Answer 40 random questions and get a score at the end. Questions rotate so you see them all over time.</p>
        </button>
      </div>
    </div>
  );
}

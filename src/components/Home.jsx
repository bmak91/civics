import { useState } from "react";
import { getAttempts, resetAllStats } from "../utils/tracker";
import allQuestions from "../data/questions";

const questions = allQuestions.filter((q) => q.choices.length > 0);

function computeCategoryStats() {
  const attempts = getAttempts();

  // Build category map: questionId -> category
  const categoryOf = {};
  const categories = {};
  for (const q of questions) {
    categoryOf[q.id] = q.category;
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

  function handleReset() {
    if (window.confirm("Reset all stats? This will clear all attempt history and test sessions.")) {
      resetAllStats();
      setStats(computeCategoryStats());
    }
  }

  const hasStats = Object.values(stats).some((s) => s.attempts > 0);

  return (
    <div className="home">
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

      <div className="category-stats">
        <h3>Stats by Category</h3>
        {Object.entries(stats).map(([category, s]) => {
          const pct = s.attempts > 0 ? Math.round((s.correct / s.attempts) * 100) : null;
          return (
            <div key={category} className="category-row">
              <div className="category-info">
                <span className="category-name">{category}</span>
                <span className="category-detail">
                  {s.attempted}/{s.total} questions seen
                  {s.attempts > 0 && <> &middot; {s.correct}/{s.attempts} correct</>}
                </span>
              </div>
              {pct !== null ? (
                <div className="category-bar-wrap">
                  <div
                    className={`category-bar ${pct >= 80 ? "good" : pct >= 50 ? "ok" : "weak"}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              ) : (
                <div className="category-bar-wrap">
                  <div className="category-bar" style={{ width: 0 }} />
                </div>
              )}
              <span className="category-pct">{pct !== null ? `${pct}%` : "—"}</span>
            </div>
          );
        })}
      </div>

      {hasStats && (
        <button className="reset-stats-btn" onClick={handleReset}>
          Reset Stats
        </button>
      )}
    </div>
  );
}

import { useState } from "react";
import { Link } from "react-router-dom";
import { getAttempts, getTestSessions, resetAllStats } from "../utils/tracker";
import allQuestions from "../data/questions";
import Stats from "./Stats";
import useDocumentTitle from "../utils/useDocumentTitle";

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

  // Aggregate attempts per category (mastery = last answer per question)
  for (const [qId, qAttempts] of Object.entries(attempts)) {
    const cat = categoryOf[qId];
    if (!cat || !categories[cat]) continue;
    categories[cat].attempted++;
    categories[cat].attempts += qAttempts.length;
    const lastAttempt = qAttempts[qAttempts.length - 1];
    if (lastAttempt?.correct) categories[cat].correct++;
  }

  return categories;
}

export default function Home() {
  useDocumentTitle(null);
  const [stats, setStats] = useState(() => computeCategoryStats());
  const [sessions, setSessions] = useState(() => getTestSessions());

  function handleReset() {
    if (window.confirm("Réinitialiser toutes les statistiques ? Cela effacera tout l'historique.")) {
      resetAllStats();
      setStats(computeCategoryStats());
      setSessions(getTestSessions());
    }
  }

  const hasStats = Object.values(stats).some((s) => s.attempts > 0);

  const radarCategories = Object.entries(stats).map(([category, s]) => ({
    label: category,
    pct: s.total > 0 ? Math.round((s.correct / s.total) * 100) : 0,
    attempted: s.attempted,
    total: s.total,
    correct: s.correct,
    attempts: s.attempts,
  }));

  return (
    <div className="home">
      <Stats categories={radarCategories} sessions={sessions} categoryOf={categoryOf} onReset={hasStats ? handleReset : null} onImport={() => { setStats(computeCategoryStats()); setSessions(getTestSessions()); }} />

      <p className="home-subtitle">Choisissez votre mode de révision</p>
      <div className="mode-cards">
        <Link to="/study" className="mode-card">
          <div className="mode-card-header"><span className="mode-icon">📖</span><h2>Révision</h2></div>
          <p>Parcourez toutes les questions à votre rythme. Consultez les explications pour mieux comprendre.</p>
        </Link>
        <Link to="/test/new" className="mode-card">
          <div className="mode-card-header"><span className="mode-icon">✍️</span><h2>Examen blanc</h2></div>
          <p>Répondez à 40 questions aléatoires et obtenez un score. Les questions changent à chaque session.</p>
        </Link>
      </div>
    </div>
  );
}

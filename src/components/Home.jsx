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
      <h1 className="home-title">Préparation à l'examen civique de naturalisation française</h1>

      <Stats categories={radarCategories} sessions={sessions} categoryOf={categoryOf} onReset={hasStats ? handleReset : null} onImport={() => { setStats(computeCategoryStats()); setSessions(getTestSessions()); }} />

      <p className="home-blurb">
        Entraînez-vous gratuitement avec plus de {questions.length} questions couvrant les principes de la République,
        le système institutionnel, les droits et devoirs, l'histoire et la vie en société française.
        Révisez par catégorie ou testez vos connaissances avec des examens blancs de 40 questions.
      </p>

      <h2 className="home-subtitle">Choisissez votre mode de révision</h2>
      <div className="mode-cards">
        <Link to="/revision" className="mode-card">
          <div className="mode-card-header"><span className="mode-icon">📖</span><h3>Révision</h3></div>
          <p>Parcourez toutes les questions à votre rythme. Consultez les explications pour mieux comprendre.</p>
        </Link>
        <Link to="/examen/nouveau" className="mode-card">
          <div className="mode-card-header"><span className="mode-icon">✍️</span><h3>Examen blanc</h3></div>
          <p>Répondez à 40 questions aléatoires et obtenez un score. Les questions changent à chaque session.</p>
        </Link>
      </div>

      <p className="home-faq-link">Des questions ? <Link to="/faq">Consultez la FAQ</Link></p>
    </div>
  );
}

import { useState, useRef, useEffect } from "react";
import { Routes, Route, useNavigate, useParams, useLocation, Link, NavLink } from "react-router-dom";
import Home from "./components/Home";
import StudyPicker from "./components/StudyPicker";
import Flashcard from "./components/Flashcard";
import Results from "./components/Results";
import FAQ from "./components/FAQ";
import allQuestions from "./data/questions";
import { SLUG_TO_CATEGORY } from "./data/categories";
import pickTestQuestions from "./utils/pickTestQuestions";
import { startTestSession, updateTestSession, completeTestSession, getTestSession, getAttempts } from "./utils/tracker";
import useDocumentTitle from "./utils/useDocumentTitle";
import "./App.css";

const questions = allQuestions.filter((q) => q.choices.length > 0);
const questionsById = Object.fromEntries(questions.map((q) => [q.id, q]));

function filterBySlug(slug) {
  if (!slug || slug === "all") return questions;
  const category = SLUG_TO_CATEGORY[slug];
  return category ? questions.filter((q) => q.category === category) : questions;
}

function buildStudyOrder(slug) {
  const base = filterBySlug(slug);
  const attempts = getAttempts();
  const withCount = base.map((q) => ({ q, count: (attempts[q.id] || []).length }));

  // Group by attempt count
  const groups = {};
  for (const item of withCount) {
    if (!groups[item.count]) groups[item.count] = [];
    groups[item.count].push(item.q);
  }

  // Shuffle within each group, then concat in ascending count order
  const result = [];
  for (const count of Object.keys(groups).map(Number).sort((a, b) => a - b)) {
    const group = groups[count];
    for (let i = group.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [group[i], group[j]] = [group[j], group[i]];
    }
    result.push(...group);
  }
  return result;
}

// Cache the shuffled order so it persists across question navigations
let studyOrderCache = { slug: null, qs: [] };

function resetStudyOrder(slug) {
  const qs = buildStudyOrder(slug);
  studyOrderCache = { slug, qs };
  return qs;
}

function getStudyQuestions(slug) {
  if (studyOrderCache.slug === slug) return studyOrderCache.qs;
  return resetStudyOrder(slug);
}

function resolveSessionQuestions(sessionId) {
  const session = getTestSession(sessionId);
  if (!session) return null;
  const qs = session.questionIds.map((id) => questionsById[id]).filter(Boolean);
  return qs.length > 0 ? { qs, session } : null;
}

export default function App() {
  const [score, setScore] = useState(0);
  const answeredCount = useRef(0);
  const currentSessionId = useRef(null);
  const navigate = useNavigate();

  function handleStartTest() {
    setScore(0);
    answeredCount.current = 0;
    const qs = pickTestQuestions(questions);
    const sessionId = startTestSession(qs.map((q) => q.id));
    currentSessionId.current = sessionId;
    navigate(`/test/${sessionId}/${qs[0].id}`, { replace: true });
  }

  function handleStudyStart(slug) {
    setScore(0);
    answeredCount.current = 0;
    const qs = resetStudyOrder(slug);
    navigate(`/study/${slug}/${qs[0].id}`, { replace: true });
  }

  function handleHome() {
    setScore(0);
    answeredCount.current = 0;
    currentSessionId.current = null;
    navigate("/");
  }

  function handleRestart(mode, slug) {
    setScore(0);
    answeredCount.current = 0;
    if (mode === "test") {
      const qs = pickTestQuestions(questions);
      const sessionId = startTestSession(qs.map((q) => q.id));
      currentSessionId.current = sessionId;
      navigate(`/test/${sessionId}/${qs[0].id}`);
    } else {
      const qs = resetStudyOrder(slug);
      navigate(`/study/${slug}/${qs[0].id}`);
    }
  }

  function handleAnswer(sessionId, wasCorrect) {
    const newScore = wasCorrect ? score + 1 : score;
    setScore(newScore);
    answeredCount.current += 1;

    if (sessionId) {
      currentSessionId.current = sessionId;
      updateTestSession(sessionId, newScore, answeredCount.current);
    }
  }

  function handleNext(mode, sessionId, questionId, qs, slug) {
    const currentIndex = qs.findIndex((q) => q.id === questionId);
    if (currentIndex + 1 < qs.length) {
      const nextId = qs[currentIndex + 1].id;
      if (mode === "test") {
        navigate(`/test/${sessionId}/${nextId}`);
      } else {
        navigate(`/study/${slug}/${nextId}`);
      }
    } else {
      if (mode === "test" && sessionId) {
        completeTestSession(sessionId);
      }
      if (mode === "test") {
        navigate(`/test/${sessionId}/results`);
      } else {
        navigate(`/study/${slug}/results`);
      }
    }
  }

  return (
    <div className="app">
      <ScrollToTop />
      <header className="app-header">
        <Link to="/" className="app-brand">🇫🇷 Coach Civique</Link>
        <nav className="app-nav">
          <NavLink to="/" end>Accueil</NavLink>
          <NavLink to="/study">Révision</NavLink>
          <NavLink to="/test" end={false}>Examen</NavLink>
          <NavLink to="/faq">FAQ</NavLink>
        </nav>
      </header>
      <main>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/test/new" element={<StartTest onStart={handleStartTest} />} />
        <Route path="/faq" element={<FAQ />} />
        <Route path="/study" element={<StudyPicker />} />
        <Route path="/study/:slug" element={<StartStudy onStart={handleStudyStart} />} />
        <Route
          path="/study/:slug/results"
          element={
            <StudyResults
              score={score}
              onRestart={handleRestart}
              onHome={handleHome}
            />
          }
        />
        <Route
          path="/test/:sessionId/results"
          element={
            <TestResults
              score={score}
              onRestart={() => handleRestart("test")}
              onHome={handleHome}
            />
          }
        />
        <Route
          path="/study/:slug/:questionId"
          element={
            <StudyQuestion
              onAnswer={(correct) => handleAnswer(null, correct)}
              onNext={handleNext}
              onHome={handleHome}
              score={score}
            />
          }
        />
        <Route
          path="/test/:sessionId/:questionId"
          element={
            <TestQuestion
              onAnswer={handleAnswer}
              onNext={handleNext}
              onHome={handleHome}
              score={score}
            />
          }
        />
      </Routes>
      </main>
      <footer className="app-footer">
        Un problème ? <a href="mailto:feedback@coach-civique.fr">Signalez-le</a>
        <span className="footer-sep">·</span>
        <a href="https://github.com/bmak91/civics" target="_blank" rel="noopener noreferrer" aria-label="GitHub">
          <svg className="gh-icon" viewBox="0 0 16 16" fill="currentColor"><path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82a7.63 7.63 0 0 1 2-.27c.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8z"/></svg>
        </a>
      </footer>
    </div>
  );
}

function StudyQuestion({ onAnswer, onNext, onHome, score }) {
  const { slug, questionId } = useParams();
  const navigate = useNavigate();
  const qs = getStudyQuestions(slug);
  const currentIndex = qs.findIndex((q) => q.id === questionId);
  const categoryName = SLUG_TO_CATEGORY[slug] || "Toutes les questions";
  useDocumentTitle(`Révision — ${categoryName}`);

  if (currentIndex === -1) {
    navigate("/", { replace: true });
    return null;
  }

  return (
    <Flashcard
      key={questionId}
      question={qs[currentIndex]}
      onAnswer={onAnswer}
      onNext={() => onNext("study", null, questionId, qs, slug)}
      onHome={onHome}
      current={currentIndex + 1}
      total={qs.length}
      mode="study"
      score={score}
    />
  );
}

function StudyResults({ score, onRestart, onHome }) {
  const { slug } = useParams();
  useDocumentTitle("Résultats — Révision");
  const qs = getStudyQuestions(slug);

  return (
    <Results
      score={score}
      total={qs.length}
      onRestart={() => onRestart("study", slug)}
      onHome={onHome}
      mode="study"
    />
  );
}

function TestQuestion({ onAnswer, onNext, onHome, score }) {
  const { sessionId, questionId } = useParams();
  const navigate = useNavigate();
  useDocumentTitle("Examen blanc");

  const resolved = resolveSessionQuestions(sessionId);
  if (!resolved) {
    navigate("/", { replace: true });
    return null;
  }

  const { qs } = resolved;
  const currentIndex = qs.findIndex((q) => q.id === questionId);

  if (currentIndex === -1) {
    navigate("/", { replace: true });
    return null;
  }

  return (
    <Flashcard
      key={questionId}
      question={qs[currentIndex]}
      onAnswer={(correct) => onAnswer(sessionId, correct)}
      onNext={() => onNext("test", sessionId, questionId, qs)}
      onHome={onHome}
      current={currentIndex + 1}
      total={qs.length}
      mode="test"
      score={score}
      sessionId={sessionId}
    />
  );
}

function TestResults({ score, onRestart, onHome }) {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  useDocumentTitle("Résultats — Examen blanc");

  const resolved = resolveSessionQuestions(sessionId);
  if (!resolved) {
    navigate("/", { replace: true });
    return null;
  }

  return (
    <Results
      score={score}
      total={resolved.qs.length}
      onRestart={onRestart}
      onHome={onHome}
      mode="test"
    />
  );
}

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

function StartTest({ onStart }) {
  const started = useRef(false);
  useEffect(() => {
    if (!started.current) {
      started.current = true;
      onStart();
    }
  }, [onStart]);
  return null;
}

function StartStudy({ onStart }) {
  const { slug } = useParams();
  const started = useRef(false);
  useEffect(() => {
    if (!started.current) {
      started.current = true;
      onStart(slug);
    }
  }, [slug, onStart]);
  return null;
}

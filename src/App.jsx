import { useState, useRef, useEffect } from "react";
import { Routes, Route, useNavigate, useParams, useLocation } from "react-router-dom";
import Home from "./components/Home";
import StudyPicker from "./components/StudyPicker";
import Flashcard from "./components/Flashcard";
import Results from "./components/Results";
import allQuestions from "./data/questions";
import { SLUG_TO_CATEGORY } from "./data/categories";
import pickTestQuestions from "./utils/pickTestQuestions";
import { startTestSession, updateTestSession, completeTestSession, getTestSession, getAttempts } from "./utils/tracker";
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
        <h1>🇫🇷 Coach Civique <span>Préparez l'examen civique de naturalisation</span></h1>
      </header>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/test/new" element={<StartTest onStart={handleStartTest} />} />
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
      <footer className="app-footer">
        Un problème ? <a href="mailto:feedback@coach-civique.fr">Signalez-le</a>
      </footer>
    </div>
  );
}

function StudyQuestion({ onAnswer, onNext, onHome, score }) {
  const { slug, questionId } = useParams();
  const navigate = useNavigate();
  const qs = getStudyQuestions(slug);
  const currentIndex = qs.findIndex((q) => q.id === questionId);

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

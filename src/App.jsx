import { useState, useRef, useEffect } from "react";
import { Routes, Route, useNavigate, useParams } from "react-router-dom";
import Home from "./components/Home";
import StudyPicker from "./components/StudyPicker";
import Flashcard from "./components/Flashcard";
import Results from "./components/Results";
import allQuestions from "./data/questions";
import { SLUG_TO_CATEGORY } from "./data/categories";
import pickTestQuestions from "./utils/pickTestQuestions";
import { startTestSession, updateTestSession, completeTestSession, getTestSession } from "./utils/tracker";
import "./App.css";

const questions = allQuestions.filter((q) => q.choices.length > 0);
const questionsById = Object.fromEntries(questions.map((q) => [q.id, q]));

function getStudyQuestions(slug) {
  if (!slug || slug === "all") return questions;
  const category = SLUG_TO_CATEGORY[slug];
  return category ? questions.filter((q) => q.category === category) : questions;
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

  function handleStudyStart() {
    setScore(0);
    answeredCount.current = 0;
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
      const qs = getStudyQuestions(slug);
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
      <h1>🇫🇷 Mon Examen Civique</h1>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/test/new" element={<StartTest onStart={handleStartTest} />} />
        <Route path="/study" element={<StudyPicker onSelect={handleStudyStart} />} />
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

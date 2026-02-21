import { useState, useRef } from "react";
import { Routes, Route, useNavigate, useParams } from "react-router-dom";
import Home from "./components/Home";
import Flashcard from "./components/Flashcard";
import Results from "./components/Results";
import allQuestions from "./data/questions";
import pickTestQuestions from "./utils/pickTestQuestions";
import { startTestSession, updateTestSession, completeTestSession, getTestSession } from "./utils/tracker";
import "./App.css";

const questions = allQuestions.filter((q) => q.choices.length > 0);
const questionsById = Object.fromEntries(questions.map((q) => [q.id, q]));

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

  function handleSelectMode(mode) {
    setScore(0);
    answeredCount.current = 0;
    if (mode === "test") {
      const qs = pickTestQuestions(questions);
      const sessionId = startTestSession(qs.map((q) => q.id));
      currentSessionId.current = sessionId;
      navigate(`/test/${sessionId}/${qs[0].id}`);
    } else {
      currentSessionId.current = null;
      navigate(`/study/${questions[0].id}`);
    }
  }

  function handleHome() {
    setScore(0);
    answeredCount.current = 0;
    currentSessionId.current = null;
    navigate("/");
  }

  function handleRestart(mode) {
    setScore(0);
    answeredCount.current = 0;
    if (mode === "test") {
      const qs = pickTestQuestions(questions);
      const sessionId = startTestSession(qs.map((q) => q.id));
      currentSessionId.current = sessionId;
      navigate(`/test/${sessionId}/${qs[0].id}`);
    } else {
      navigate(`/study/${questions[0].id}`);
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

  function handleNext(mode, sessionId, questionId, qs) {
    const currentIndex = qs.findIndex((q) => q.id === questionId);
    if (currentIndex + 1 < qs.length) {
      const nextId = qs[currentIndex + 1].id;
      if (mode === "test") {
        navigate(`/test/${sessionId}/${nextId}`);
      } else {
        navigate(`/study/${nextId}`);
      }
    } else {
      if (mode === "test" && sessionId) {
        completeTestSession(sessionId);
      }
      if (mode === "test") {
        navigate(`/test/${sessionId}/results`);
      } else {
        navigate("/study/results");
      }
    }
  }

  return (
    <div className="app">
      <h1>Mon Examen Civique</h1>
      <Routes>
        <Route path="/" element={<Home onSelectMode={handleSelectMode} />} />
        <Route
          path="/study/results"
          element={
            <Results
              score={score}
              total={questions.length}
              onRestart={() => handleRestart("study")}
              onHome={handleHome}
              mode="study"
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
          path="/study/:questionId"
          element={
            <StudyQuestion
              questions={questions}
              onAnswer={(correct) => handleAnswer(null, correct)}
              onNext={(questionId) => handleNext("study", null, questionId, questions)}
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

function StudyQuestion({ questions, onAnswer, onNext, onHome, score }) {
  const { questionId } = useParams();
  const navigate = useNavigate();
  const currentIndex = questions.findIndex((q) => q.id === questionId);

  if (currentIndex === -1) {
    navigate("/", { replace: true });
    return null;
  }

  return (
    <Flashcard
      key={questionId}
      question={questions[currentIndex]}
      onAnswer={onAnswer}
      onNext={() => onNext(questionId)}
      onHome={onHome}
      current={currentIndex + 1}
      total={questions.length}
      mode="study"
      score={score}
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

import { useState, useRef } from "react";
import { Routes, Route, useNavigate, useParams } from "react-router-dom";
import Home from "./components/Home";
import Flashcard from "./components/Flashcard";
import Results from "./components/Results";
import allQuestions from "./data/questions";
import pickTestQuestions from "./utils/pickTestQuestions";
import { startTestSession, updateTestSession, completeTestSession } from "./utils/tracker";
import "./App.css";

const questions = allQuestions.filter((q) => q.choices.length > 0);

const TEST_SESSION_KEY = "civics-test-session";
const TEST_SESSION_ID_KEY = "civics-test-session-id";

function saveTestSession(qs, sessionId) {
  sessionStorage.setItem(TEST_SESSION_KEY, JSON.stringify(qs.map((q) => q.id)));
  sessionStorage.setItem(TEST_SESSION_ID_KEY, sessionId);
}

function loadTestSession() {
  try {
    const ids = JSON.parse(sessionStorage.getItem(TEST_SESSION_KEY));
    const sessionId = sessionStorage.getItem(TEST_SESSION_ID_KEY);
    if (!ids || !sessionId) return null;
    const qs = ids.map((id) => questions.find((q) => q.id === id)).filter(Boolean);
    return qs.length > 0 ? { qs, sessionId } : null;
  } catch {
    return null;
  }
}

export default function App() {
  const [score, setScore] = useState(0);
  const testQuestions = useRef(null);
  const testSessionId = useRef(null);
  const answeredCount = useRef(0);
  const navigate = useNavigate();

  function getTestQuestions() {
    if (!testQuestions.current) {
      const saved = loadTestSession();
      if (saved) {
        testQuestions.current = saved.qs;
        testSessionId.current = saved.sessionId;
      } else {
        const qs = pickTestQuestions(questions);
        const sessionId = startTestSession(qs.map((q) => q.id));
        testQuestions.current = qs;
        testSessionId.current = sessionId;
        saveTestSession(qs, sessionId);
      }
    }
    return testQuestions.current;
  }

  function handleSelectMode(mode) {
    setScore(0);
    answeredCount.current = 0;
    if (mode === "test") {
      const qs = pickTestQuestions(questions);
      const sessionId = startTestSession(qs.map((q) => q.id));
      testQuestions.current = qs;
      testSessionId.current = sessionId;
      saveTestSession(qs, sessionId);
      navigate(`/test/${qs[0].id}`);
    } else {
      testQuestions.current = null;
      testSessionId.current = null;
      navigate(`/study/${questions[0].id}`);
    }
  }

  function handleHome() {
    setScore(0);
    testQuestions.current = null;
    testSessionId.current = null;
    answeredCount.current = 0;
    sessionStorage.removeItem(TEST_SESSION_KEY);
    sessionStorage.removeItem(TEST_SESSION_ID_KEY);
    navigate("/");
  }

  function handleRestart(mode) {
    setScore(0);
    answeredCount.current = 0;
    if (mode === "test") {
      const qs = pickTestQuestions(questions);
      const sessionId = startTestSession(qs.map((q) => q.id));
      testQuestions.current = qs;
      testSessionId.current = sessionId;
      saveTestSession(qs, sessionId);
      navigate(`/test/${qs[0].id}`);
    } else {
      navigate(`/study/${questions[0].id}`);
    }
  }

  function handleNext(mode, questionId, wasCorrect) {
    const newScore = wasCorrect ? score + 1 : score;
    setScore(newScore);
    answeredCount.current += 1;

    if (mode === "test" && testSessionId.current) {
      updateTestSession(testSessionId.current, newScore, answeredCount.current);
    }

    const qs = mode === "test" ? getTestQuestions() : questions;
    const currentIndex = qs.findIndex((q) => q.id === questionId);
    if (currentIndex + 1 < qs.length) {
      navigate(`/${mode}/${qs[currentIndex + 1].id}`);
    } else {
      if (mode === "test" && testSessionId.current) {
        completeTestSession(testSessionId.current);
      }
      navigate(`/${mode}/results`);
    }
  }

  return (
    <div className="app">
      <h1>Civics Study Flashcards</h1>
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
          path="/test/results"
          element={
            <Results
              score={score}
              total={getTestQuestions().length}
              onRestart={() => handleRestart("test")}
              onHome={handleHome}
              mode="test"
            />
          }
        />
        <Route
          path="/study/:questionId"
          element={
            <StudyQuestion
              questions={questions}
              onNext={handleNext}
              onHome={handleHome}
              score={score}
            />
          }
        />
        <Route
          path="/test/:questionId"
          element={
            <TestQuestion
              getTestQuestions={getTestQuestions}
              onNext={handleNext}
              onHome={handleHome}
              score={score}
              sessionId={testSessionId.current}
            />
          }
        />
      </Routes>
    </div>
  );
}

function StudyQuestion({ questions, onNext, onHome, score }) {
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
      onNext={(wasCorrect) => onNext("study", questionId, wasCorrect)}
      onHome={onHome}
      current={currentIndex + 1}
      total={questions.length}
      mode="study"
      score={score}
    />
  );
}

function TestQuestion({ getTestQuestions, onNext, onHome, score, sessionId }) {
  const { questionId } = useParams();
  const navigate = useNavigate();
  const qs = getTestQuestions();
  const currentIndex = qs.findIndex((q) => q.id === questionId);

  if (currentIndex === -1) {
    navigate("/", { replace: true });
    return null;
  }

  return (
    <Flashcard
      key={questionId}
      question={qs[currentIndex]}
      onNext={(wasCorrect) => onNext("test", questionId, wasCorrect)}
      onHome={onHome}
      current={currentIndex + 1}
      total={qs.length}
      mode="test"
      score={score}
      sessionId={sessionId}
    />
  );
}

import { useState, useRef } from "react";
import { Routes, Route, useNavigate, useParams } from "react-router-dom";
import Home from "./components/Home";
import Flashcard from "./components/Flashcard";
import Results from "./components/Results";
import allQuestions from "./data/questions";
import pickTestQuestions from "./utils/pickTestQuestions";
import "./App.css";

const questions = allQuestions.filter((q) => q.choices.length > 0);

const TEST_SESSION_KEY = "civics-test-session";

function saveTestSession(qs) {
  sessionStorage.setItem(TEST_SESSION_KEY, JSON.stringify(qs.map((q) => q.id)));
}

function loadTestSession() {
  try {
    const ids = JSON.parse(sessionStorage.getItem(TEST_SESSION_KEY));
    if (!ids) return null;
    const qs = ids.map((id) => questions.find((q) => q.id === id)).filter(Boolean);
    return qs.length > 0 ? qs : null;
  } catch {
    return null;
  }
}

export default function App() {
  const [score, setScore] = useState(0);
  const testQuestions = useRef(null);
  const navigate = useNavigate();

  function getTestQuestions() {
    if (!testQuestions.current) {
      testQuestions.current = loadTestSession() || pickTestQuestions(questions);
      saveTestSession(testQuestions.current);
    }
    return testQuestions.current;
  }

  function handleSelectMode(mode) {
    setScore(0);
    if (mode === "test") {
      testQuestions.current = pickTestQuestions(questions);
      saveTestSession(testQuestions.current);
      navigate(`/test/${testQuestions.current[0].id}`);
    } else {
      testQuestions.current = null;
      navigate(`/study/${questions[0].id}`);
    }
  }

  function handleHome() {
    setScore(0);
    testQuestions.current = null;
    sessionStorage.removeItem(TEST_SESSION_KEY);
    navigate("/");
  }

  function handleRestart(mode) {
    setScore(0);
    if (mode === "test") {
      testQuestions.current = pickTestQuestions(questions);
      saveTestSession(testQuestions.current);
      navigate(`/test/${testQuestions.current[0].id}`);
    } else {
      navigate(`/study/${questions[0].id}`);
    }
  }

  function handleNext(mode, questionId, wasCorrect) {
    if (wasCorrect) setScore((s) => s + 1);
    const qs = mode === "test" ? getTestQuestions() : questions;
    const currentIndex = qs.findIndex((q) => q.id === questionId);
    if (currentIndex + 1 < qs.length) {
      navigate(`/${mode}/${qs[currentIndex + 1].id}`);
    } else {
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

function TestQuestion({ getTestQuestions, onNext, onHome, score }) {
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
    />
  );
}

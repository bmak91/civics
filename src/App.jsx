import { useState, useEffect, useCallback, useRef } from "react";
import Home from "./components/Home";
import Flashcard from "./components/Flashcard";
import Results from "./components/Results";
import questions from "./data/questions";
import pickTestQuestions from "./utils/pickTestQuestions";
import "./App.css";

function parseHash() {
  const hash = window.location.hash.replace("#", "");
  if (!hash || hash === "home") return { page: "home" };

  const [mode, rest] = hash.split("/");
  if (mode !== "study" && mode !== "test") return { page: "home" };

  if (rest === "results") return { page: "results", mode };

  const num = parseInt(rest, 10);
  if (num >= 1) return { page: "question", mode, index: num - 1 };

  return { page: "home" };
}

export default function App() {
  const [route, setRoute] = useState(parseHash);
  const [score, setScore] = useState(0);
  const testQuestions = useRef(null);

  const syncFromHash = useCallback(() => {
    setRoute(parseHash());
  }, []);

  useEffect(() => {
    window.addEventListener("hashchange", syncFromHash);
    if (!window.location.hash) window.location.hash = "#home";
    return () => window.removeEventListener("hashchange", syncFromHash);
  }, [syncFromHash]);

  function getQuestions() {
    if (route.mode === "test") {
      if (!testQuestions.current) {
        testQuestions.current = pickTestQuestions(questions);
      }
      return testQuestions.current;
    }
    return questions;
  }

  function handleSelectMode(mode) {
    setScore(0);
    if (mode === "test") {
      testQuestions.current = pickTestQuestions(questions);
    } else {
      testQuestions.current = null;
    }
    window.location.hash = `#${mode}/1`;
  }

  function handleNext(wasCorrect) {
    if (wasCorrect) setScore((s) => s + 1);
    const qs = getQuestions();
    if (route.index + 1 < qs.length) {
      window.location.hash = `#${route.mode}/${route.index + 2}`;
    } else {
      window.location.hash = `#${route.mode}/results`;
    }
  }

  function handleRestart() {
    setScore(0);
    if (route.mode === "test") {
      testQuestions.current = pickTestQuestions(questions);
    }
    window.location.hash = `#${route.mode}/1`;
  }

  function handleHome() {
    setScore(0);
    testQuestions.current = null;
    window.location.hash = "#home";
  }

  const qs = getQuestions();

  if (route.page === "home") {
    return (
      <div className="app">
        <h1>Civics Study Flashcards</h1>
        <Home onSelectMode={handleSelectMode} />
      </div>
    );
  }

  if (route.page === "results") {
    return (
      <div className="app">
        <h1>Civics Study Flashcards</h1>
        <Results
          score={score}
          total={qs.length}
          onRestart={handleRestart}
          onHome={handleHome}
          mode={route.mode}
        />
      </div>
    );
  }

  const currentIndex = Math.min(route.index, qs.length - 1);

  return (
    <div className="app">
      <h1>Civics Study Flashcards</h1>
      <Flashcard
        key={`${route.mode}-${currentIndex}`}
        question={qs[currentIndex]}
        onNext={handleNext}
        onHome={handleHome}
        current={currentIndex + 1}
        total={qs.length}
        mode={route.mode}
        score={score}
      />
    </div>
  );
}

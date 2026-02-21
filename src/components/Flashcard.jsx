import { useState, useMemo } from "react";

function shuffleChoices(choices, correctIndex) {
  const indexed = choices.map((text, i) => ({ text, isCorrect: i === correctIndex }));
  for (let i = indexed.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [indexed[i], indexed[j]] = [indexed[j], indexed[i]];
  }
  return indexed;
}

export default function Flashcard({ question, onNext, onHome, current, total, mode, score }) {
  const shuffled = useMemo(
    () => shuffleChoices(question.choices, question.correctIndex),
    [question]
  );
  const [selected, setSelected] = useState(null);

  const isAnswered = selected !== null;
  const isCorrect = isAnswered && shuffled[selected].isCorrect;

  function handleSelect(index) {
    if (isAnswered) return;
    setSelected(index);
  }

  function handleNext() {
    onNext(isCorrect);
  }

  return (
    <div className="flashcard">
      <div className="flashcard-header">
        <div className="progress">
          Question {current} of {total}
          {mode === "test" && <span className="live-score"> &middot; Score: {score}/{total}</span>}
        </div>
        <button className="home-btn" onClick={onHome}>Home</button>
      </div>

      <h2 className="question">{question.question}</h2>

      <div className="choices">
        {shuffled.map((choice, index) => {
          let className = "choice";
          if (isAnswered) {
            if (choice.isCorrect) className += " correct";
            else if (index === selected) className += " wrong";
          }

          return (
            <button
              key={index}
              className={className}
              onClick={() => handleSelect(index)}
              disabled={isAnswered}
            >
              <span className="choice-letter">
                {String.fromCharCode(65 + index)}
              </span>
              {choice.text}
            </button>
          );
        })}
      </div>

      {isAnswered && (
        <div className={`explanation ${isCorrect ? "correct" : "wrong"}`}>
          <div className="result-label">
            {isCorrect ? "Correct!" : "Incorrect"}
          </div>
          <p>{question.explanation}</p>
        </div>
      )}

      {isAnswered && (
        <button className="next-btn" onClick={handleNext}>
          {current < total ? "Next Question" : "See Results"}
        </button>
      )}
    </div>
  );
}

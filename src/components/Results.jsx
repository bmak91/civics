export default function Results({ score, total, onRestart, onHome, mode }) {
  const percentage = Math.round((score / total) * 100);

  return (
    <div className="results">
      <h2>{mode === "test" ? "Test Results" : "Study Complete"}</h2>
      <div className="score">
        {score} / {total}
      </div>
      <div className="percentage">{percentage}%</div>
      <p className="score-message">
        {percentage >= 80
          ? "Great job!"
          : percentage >= 60
            ? "Good effort, keep studying!"
            : "Keep practicing, you'll get there!"}
      </p>
      <div className="results-actions">
        <button className="next-btn" onClick={onRestart}>
          {mode === "test" ? "New Test" : "Start Over"}
        </button>
        <button className="next-btn secondary" onClick={onHome}>
          Home
        </button>
      </div>
    </div>
  );
}

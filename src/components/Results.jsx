export default function Results({ score, total, onRestart, onHome, mode }) {
  const percentage = Math.round((score / total) * 100);

  return (
    <div className="results">
      <h1 className="results-title">{mode === "test" ? "Résultats de l'examen" : "Révision terminée"}</h1>
      <div className="score">
        {score} / {total}
      </div>
      <div className="percentage">{percentage}%</div>
      <p className="score-message">
        {percentage >= 80
          ? "Excellent travail !"
          : percentage >= 60
            ? "Bon effort, continuez à réviser !"
            : "Continuez à vous entraîner, vous y arriverez !"}
      </p>
      <div className="results-actions">
        <button className="next-btn" onClick={onRestart}>
          {mode === "test" ? "Nouvel examen" : "Recommencer"}
        </button>
        <button className="next-btn secondary" onClick={onHome}>
          Accueil
        </button>
      </div>
    </div>
  );
}

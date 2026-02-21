export default function Home({ onSelectMode }) {
  return (
    <div className="home">
      <p className="home-subtitle">Choose how you want to practice</p>
      <div className="mode-cards">
        <button className="mode-card" onClick={() => onSelectMode("study")}>
          <div className="mode-icon">📖</div>
          <h2>Study Mode</h2>
          <p>Go through all questions at your own pace. Review explanations and learn the material.</p>
        </button>
        <button className="mode-card" onClick={() => onSelectMode("test")}>
          <div className="mode-icon">✍️</div>
          <h2>Test Mode</h2>
          <p>Answer 40 random questions and get a score at the end. Questions rotate so you see them all over time.</p>
        </button>
      </div>
    </div>
  );
}

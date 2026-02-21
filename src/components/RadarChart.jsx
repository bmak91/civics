import { useState } from "react";

const RADIUS = 120;
const LABEL_OFFSET = 14;
const SIZE = 300;
const CENTER = SIZE / 2;
const GRID_LEVELS = [0.25, 0.5, 0.75, 1.0];
const MAX_LINE_CHARS = 14;

function polarToXY(angleDeg, radius) {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return [CENTER + radius * Math.cos(rad), CENTER + radius * Math.sin(rad)];
}

function getColor(pct) {
  if (pct >= 80) return "#48bb78";
  if (pct >= 50) return "#ecc94b";
  return "#fc8181";
}

function wrapText(text, maxChars) {
  const words = text.split(" ");
  const lines = [];
  let current = "";
  for (const word of words) {
    if (current && (current + " " + word).length > maxChars) {
      lines.push(current);
      current = word;
    } else {
      current = current ? current + " " + word : word;
    }
  }
  if (current) lines.push(current);
  return lines;
}

function formatDate(ts) {
  return new Date(ts).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

export default function RadarChart({ categories, sessions, onReset }) {
  const [hovered, setHovered] = useState(null);
  const [activeTab, setActiveTab] = useState("categories");
  const n = categories.length;
  const angleStep = 360 / n;

  const vertices = categories.map((_, i) => polarToXY(i * angleStep, RADIUS));

  const gridPolygons = GRID_LEVELS.map((level) => {
    const points = categories
      .map((_, i) => polarToXY(i * angleStep, RADIUS * level).join(","))
      .join(" ");
    return <polygon key={level} points={points} fill="none" stroke="#e2e8f0" strokeWidth="0.8" />;
  });

  const axisLines = vertices.map(([x, y], i) => (
    <line key={i} x1={CENTER} y1={CENTER} x2={x} y2={y} stroke="#e2e8f0" strokeWidth="0.8" />
  ));

  // Coverage polygon (total questions per category, normalized to max)
  const maxTotal = Math.max(...categories.map((c) => c.total), 1);
  const coveragePoints = categories.map((cat, i) => {
    const r = RADIUS * (cat.total / maxTotal);
    return polarToXY(i * angleStep, r);
  });
  const coveragePolygonStr = coveragePoints.map((p) => p.join(",")).join(" ");

  // Accuracy polygon (% correct)
  const dataPoints = categories.map((cat, i) => {
    const r = RADIUS * (cat.pct / 100);
    return polarToXY(i * angleStep, r);
  });
  const dataPolygonStr = dataPoints.map((p) => p.join(",")).join(" ");

  const labels = categories.map((cat, i) => {
    const angle = i * angleStep;
    const [x, y] = polarToXY(angle, RADIUS + LABEL_OFFSET);
    let anchor = "middle";
    if (x < CENTER - 3) anchor = "end";
    else if (x > CENTER + 3) anchor = "start";

    let dy = 0;
    if (y < CENTER - 10) dy = -4;
    else if (y > CENTER + 10) dy = 4;

    const lines = wrapText(cat.label, MAX_LINE_CHARS);
    const lineHeight = 9;
    const startDy = dy - ((lines.length - 1) * lineHeight) / 2;
    const isHovered = hovered === i;

    return (
      <text
        key={i}
        x={x}
        y={y + startDy}
        textAnchor={anchor}
        dominantBaseline="central"
        fontSize="8.5"
        fill={isHovered ? "#2d3748" : "#4a5568"}
        fontWeight={isHovered ? "700" : "600"}
        style={{ cursor: "default" }}
        onMouseEnter={() => setHovered(i)}
        onMouseLeave={() => setHovered(null)}
      >
        {lines.map((line, li) => (
          <tspan key={li} x={x} dy={li === 0 ? 0 : lineHeight}>
            {line}
          </tspan>
        ))}
      </text>
    );
  });

  // Invisible larger hit areas on data points for hover
  const hitAreas = categories.map((_, i) => {
    const [vx, vy] = vertices[i];
    return (
      <circle
        key={i}
        cx={vx}
        cy={vy}
        r="12"
        fill="transparent"
        style={{ cursor: "default" }}
        onMouseEnter={() => setHovered(i)}
        onMouseLeave={() => setHovered(null)}
      />
    );
  });

  const hoveredCat = hovered !== null ? categories[hovered] : null;

  const allSessions = (sessions || []).slice().sort((a, b) => (b.finishedAt || b.lastActivityAt || b.startedAt) - (a.finishedAt || a.lastActivityAt || a.startedAt));
  const completedSessions = allSessions.filter((s) => s.completed);
  const avgScore = completedSessions.length > 0
    ? Math.round(completedSessions.reduce((sum, s) => sum + (s.score / s.total) * 100, 0) / completedSessions.length)
    : 0;
  const bestScore = completedSessions.length > 0
    ? Math.round(Math.max(...completedSessions.map((s) => (s.score / s.total) * 100)))
    : 0;

  return (
    <div className="radar-chart-section">
      <div className="radar-chart-header">
        <div className="stats-tabs">
          <button
            className={`stats-tab${activeTab === "categories" ? " active" : ""}`}
            onClick={() => setActiveTab("categories")}
          >
            Categories
          </button>
          <button
            className={`stats-tab${activeTab === "tests" ? " active" : ""}`}
            onClick={() => setActiveTab("tests")}
          >
            Tests
          </button>
        </div>
        {onReset && (
          <button className="reset-stats-btn" onClick={onReset}>
            Reset
          </button>
        )}
      </div>

      {activeTab === "categories" ? (
        <>
          <div className="radar-chart-wrap">
            <svg viewBox={`0 0 ${SIZE} ${SIZE}`} className="radar-chart-svg" overflow="visible">
              {gridPolygons}
              {axisLines}
              <polygon
                points={coveragePolygonStr}
                fill="rgba(160,174,192,0.2)"
                stroke="#a0aec0"
                strokeWidth="1"
                strokeDasharray="3 2"
              />
              <polygon
                points={dataPolygonStr}
                fill="rgba(49,130,206,0.25)"
                stroke="#3182ce"
                strokeWidth="1.5"
              />
              {dataPoints.map(([x, y], i) => (
                <circle key={i} cx={x} cy={y} r="2.5" fill="#3182ce" />
              ))}
              {labels}
              {hitAreas}
            </svg>
          </div>
          <div className="radar-legend-inline">
            <span className="radar-legend-swatch"><span className="radar-swatch-box" style={{ background: "rgba(49,130,206,0.25)", border: "1.5px solid #3182ce" }} /> Accuracy</span>
            <span className="radar-legend-swatch"><span className="radar-swatch-box" style={{ background: "rgba(160,174,192,0.2)", border: "1.5px dashed #a0aec0" }} /> Coverage</span>
          </div>
          <div className="radar-tooltip-area">
            {hoveredCat ? (
              <p className="radar-tooltip">
                <span className="radar-tooltip-dot" style={{ background: getColor(hoveredCat.pct) }} />
                <strong>{hoveredCat.label}</strong>
                <span className="radar-tooltip-detail">
                  {hoveredCat.pct}% correct &middot; {hoveredCat.attempted}/{hoveredCat.total} seen
                </span>
              </p>
            ) : (
              <p className="radar-tooltip radar-tooltip-hint">Hover a category for details</p>
            )}
          </div>
        </>
      ) : (
        <div className="test-stats">
          {allSessions.length === 0 ? (
            <p className="test-stats-empty">No tests yet</p>
          ) : (
            <>
              <div className="test-stats-summary">
                <div className="test-stat-box">
                  <span className="test-stat-value">{completedSessions.length}</span>
                  <span className="test-stat-label">Completed</span>
                </div>
                <div className="test-stat-box">
                  <span className="test-stat-value">{avgScore}%</span>
                  <span className="test-stat-label">Average</span>
                </div>
                <div className="test-stat-box">
                  <span className="test-stat-value">{bestScore}%</span>
                  <span className="test-stat-label">Best</span>
                </div>
              </div>
              <div className="test-session-list">
                {allSessions.map((s) => {
                  const pct = Math.round((s.score / s.total) * 100);
                  return (
                    <div key={s.id} className={`test-session-row${s.completed ? "" : " incomplete"}`}>
                      <span className="test-session-date">{formatDate(s.finishedAt || s.lastActivityAt || s.startedAt)}</span>
                      <span className="test-session-score">{s.score}/{s.total}</span>
                      {s.completed ? (
                        <span className="test-session-pct" style={{ color: getColor(pct) }}>{pct}%</span>
                      ) : (
                        <span className="test-session-pct test-session-incomplete">In progress</span>
                      )}
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

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

export default function RadarChart({ categories }) {
  const [hovered, setHovered] = useState(null);
  const n = categories.length;
  const angleStep = 360 / n;

  const vertices = categories.map((_, i) => polarToXY(i * angleStep, RADIUS));
  const fullPolygonStr = vertices.map((p) => p.join(",")).join(" ");

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

  // Mastery polygon (correct / total questions in category)
  const dataPoints = categories.map((cat, i) => {
    const mastery = cat.total > 0 ? cat.correct / cat.total : 0;
    const r = RADIUS * mastery;
    return polarToXY(i * angleStep, r);
  });
  const dataPolygonStr = dataPoints.map((p) => p.join(",")).join(" ");

  const labels = categories.map((cat, i) => {
    const angle = i * angleStep;
    const lines = wrapText(cat.label, MAX_LINE_CHARS);
    const isCompact = cat.label === "Vivre dans la société française" || cat.label === "Système institutionnel et politique";
    const offset = isCompact ? LABEL_OFFSET - 6 : LABEL_OFFSET;
    const [x, y] = polarToXY(angle, RADIUS + offset);
    let anchor = "middle";
    if (x < CENTER - 3) anchor = "end";
    else if (x > CENTER + 3) anchor = "start";

    let dy = 0;
    if (y < CENTER - 10) dy = -4;
    else if (y > CENTER + 10) dy = 4;

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

  return (
    <>
      <div className="radar-chart-wrap">
        <svg viewBox={`0 0 ${SIZE} ${SIZE}`} className="radar-chart-svg" overflow="visible">
          <defs>
            <linearGradient id="tricolore" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#000091" />
              <stop offset="33%" stopColor="#000091" />
              <stop offset="33%" stopColor="#ffffff" />
              <stop offset="66%" stopColor="#ffffff" />
              <stop offset="66%" stopColor="#e0010e" />
              <stop offset="100%" stopColor="#e0010e" />
            </linearGradient>
            <clipPath id="mastery-clip">
              <polygon points={dataPolygonStr} />
            </clipPath>
          </defs>
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
            points={fullPolygonStr}
            fill="url(#tricolore)"
            clipPath="url(#mastery-clip)"
          />
          <polygon
            points={dataPolygonStr}
            fill="none"
            stroke="#000091"
            strokeWidth="1.2"
          />
          {dataPoints.map(([x, y], i) => (
            <circle key={i} cx={x} cy={y} r="2.5" fill="#000091" />
          ))}
          {labels}
          {hitAreas}
        </svg>
      </div>
      <div className="radar-legend-inline">
        <span className="radar-legend-swatch"><span className="radar-swatch-box" style={{ background: "#fff", border: "1.5px solid #000091" }} /> Mastery</span>
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
  );
}

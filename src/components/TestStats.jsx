import { CATEGORY_COLORS } from "../data/categories.js";

function getColor(pct) {
  if (pct >= 80) return "#48bb78";
  if (pct >= 50) return "#ecc94b";
  return "#fc8181";
}

function formatDate(ts) {
  return new Date(ts).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

function formatDuration(ms) {
  if (!ms || ms < 0) return null;
  const totalSec = Math.round(ms / 1000);
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${m}m ${s.toString().padStart(2, "0")}s`;
}

export default function TestStats({ sessions, categoryOf }) {
  const allSessions = (sessions || []).slice().sort((a, b) => (b.finishedAt || b.lastActivityAt || b.startedAt) - (a.finishedAt || a.lastActivityAt || a.startedAt));
  const completedSessions = allSessions.filter((s) => s.completed);
  const avgScore = completedSessions.length > 0
    ? Math.round(completedSessions.reduce((sum, s) => sum + (s.score / s.total) * 100, 0) / completedSessions.length)
    : 0;
  const bestScore = completedSessions.length > 0
    ? Math.round(Math.max(...completedSessions.map((s) => (s.score / s.total) * 100)))
    : 0;
  const sessionsWithDuration = completedSessions.filter((s) => s.startedAt && s.finishedAt);
  const avgDuration = sessionsWithDuration.length > 0
    ? formatDuration(sessionsWithDuration.reduce((sum, s) => sum + (s.finishedAt - s.startedAt), 0) / sessionsWithDuration.length)
    : null;

  if (allSessions.length === 0) {
    return (
      <div className="test-stats">
        <p className="test-stats-empty">No tests yet</p>
      </div>
    );
  }

  return (
    <div className="test-stats">
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
        {avgDuration && (
          <div className="test-stat-box">
            <span className="test-stat-value">{avgDuration}</span>
            <span className="test-stat-label">Avg Time</span>
          </div>
        )}
      </div>
      <div className="test-session-list">
        {allSessions.map((s) => {
          const pct = Math.round((s.score / s.total) * 100);
          const duration = s.completed && s.startedAt && s.finishedAt
            ? formatDuration(s.finishedAt - s.startedAt)
            : null;
          // Count questions per category for this session
          const catCounts = {};
          if (categoryOf && s.questionIds) {
            for (const qId of s.questionIds) {
              const cat = categoryOf[qId];
              if (cat) catCounts[cat] = (catCounts[cat] || 0) + 1;
            }
          }
          const categoryOrder = Object.keys(CATEGORY_COLORS);
          const catEntries = categoryOrder.filter((c) => catCounts[c]).map((c) => [c, catCounts[c]]);
          const catTotal = catEntries.reduce((sum, [, c]) => sum + c, 0);

          return (
            <div key={s.id} className={`test-session-row${s.completed ? "" : " incomplete"}`}>
              <div className="test-session-row-inner">
                <span className="test-session-date">{formatDate(s.finishedAt || s.lastActivityAt || s.startedAt)}</span>
                <span className="test-session-score">{s.score}/{s.total}</span>
                {s.completed ? (
                  <>
                    {duration && <span className="test-session-duration">{duration}</span>}
                    <span className="test-session-pct" style={{ color: getColor(pct) }}>{pct}%</span>
                  </>
                ) : (
                  <span className="test-session-pct test-session-incomplete">In progress</span>
                )}
              </div>
              {catTotal > 0 && (
                <div className="test-session-cat-bar">
                  {catEntries.map(([cat, count]) => (
                    <span
                      key={cat}
                      className="test-session-cat-seg"
                      style={{
                        flex: count,
                        backgroundColor: CATEGORY_COLORS[cat] || "#a0aec0",
                      }}
                    />
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
      <div className="test-stats-color-key">
        {Object.entries(CATEGORY_COLORS).map(([cat, color]) => (
          <span key={cat} className="test-stats-key-item">
            <span className="test-stats-key-swatch" style={{ backgroundColor: color }} />
            {cat}
          </span>
        ))}
      </div>
    </div>
  );
}

import { useState } from "react";
import RadarChart from "./RadarChart";
import TestStats from "./TestStats";

export default function Stats({ categories, sessions, onReset }) {
  const [activeTab, setActiveTab] = useState("categories");

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
        <RadarChart categories={categories} />
      ) : (
        <TestStats sessions={sessions} />
      )}
    </div>
  );
}

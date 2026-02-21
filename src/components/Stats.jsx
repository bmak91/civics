import { useState } from "react";
import RadarChart from "./RadarChart";
import TestStats from "./TestStats";

export default function Stats({ categories, sessions, categoryOf, onReset }) {
  const [activeTab, setActiveTab] = useState("categories");

  return (
    <div className="radar-chart-section">
      <div className="radar-chart-header">
        <div className="stats-tabs">
          <button
            className={`stats-tab${activeTab === "categories" ? " active" : ""}`}
            onClick={() => setActiveTab("categories")}
          >
            Catégories
          </button>
          <button
            className={`stats-tab${activeTab === "tests" ? " active" : ""}`}
            onClick={() => setActiveTab("tests")}
          >
            Examens
          </button>
        </div>
        {onReset && (
          <button className="reset-stats-btn" onClick={onReset}>
            Réinitialiser
          </button>
        )}
      </div>

      {activeTab === "categories" ? (
        <RadarChart categories={categories} />
      ) : (
        <TestStats sessions={sessions} categoryOf={categoryOf} />
      )}
    </div>
  );
}

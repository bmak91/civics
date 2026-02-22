import { useEffect, useRef, useState } from "react";
import { exportStats, importStats } from "../utils/tracker";
import RadarChart from "./RadarChart";
import TestStats from "./TestStats";

export default function Stats({ categories, sessions, categoryOf, onReset, onImport }) {
  const [activeTab, setActiveTab] = useState("categories");
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);
  const fileRef = useRef(null);

  useEffect(() => {
    if (!menuOpen) return;
    function close(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false);
    }
    document.addEventListener("pointerdown", close);
    return () => document.removeEventListener("pointerdown", close);
  }, [menuOpen]);

  function handleImport(e) {
    const file = e.target.files[0];
    if (!file) return;
    importStats(file).then(() => onImport?.());
    e.target.value = "";
  }

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
        <div className="stats-header-end">
          <div className="overflow-menu" ref={menuRef}>
            <button
              className="reset-stats-btn"
              onClick={() => setMenuOpen((v) => !v)}
              aria-label="Menu"
            >
              ⋯
            </button>
            {menuOpen && (
              <div className="overflow-menu-dropdown">
                <button onClick={() => { exportStats(); setMenuOpen(false); }}>
                  Exporter
                </button>
                <button onClick={() => { fileRef.current?.click(); setMenuOpen(false); }}>
                  Importer
                </button>
                {onReset && (
                  <button className="overflow-menu-danger" onClick={() => { onReset(); setMenuOpen(false); }}>
                    Réinitialiser
                  </button>
                )}
              </div>
            )}
            <input ref={fileRef} type="file" accept=".json" hidden onChange={handleImport} />
          </div>
        </div>
      </div>

      {activeTab === "categories" ? (
        <RadarChart categories={categories} />
      ) : (
        <TestStats sessions={sessions} categoryOf={categoryOf} />
      )}
    </div>
  );
}

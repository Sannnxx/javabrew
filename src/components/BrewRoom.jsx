import React from "react";
import "./coffee-ui.css";

export default function BrewRoom({ slots = ["BASE", "—", "—"], onReset, onBrew }) {
  return (
    <div className="panel p-12">
      <div className="brew-box">
        <div className="slots">
          {slots.map((s, i) => (
            <div key={i} className="slot">
              <span className="slot-text">{s}</span>
            </div>
          ))}
        </div>

        <div className="gauges">
          {["WARM", "COOL", "SWEET", "BITTER"].map((g) => (
            <div key={g} className="gauge-row">
              <div className="gauge-label">{g}</div>
              <div className="gauge-bar">
                {Array.from({ length: 10 }).map((_, i) => (
                  <span key={i} className={`tick ${i < 3 ? "on" : ""}`} />
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="brew-actions">
          <button className="btn ghost" onClick={onReset}>RESET</button>
          <button className="btn solid" onClick={onBrew}>BREW</button>
        </div>
      </div>
    </div>
  );
}

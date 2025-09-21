import React from "react";
import "./coffee-ui.css";

export default function IngredientRoom({ onPick }) {
  const items = [
    { key: "coffee", label: "COFFEE" },
    { key: "matcha", label: "MATCHA" },
    { key: "cocoa",  label: "COCOA"  },
    { key: "milk",   label: "MILK"   },
  ];

  return (
    <div className="panel p-12">
      <div className="shelf" />
      <div className="shelf" style={{ marginTop: 24 }} />

      <div className="shelf-items">
        {items.map((it) => (
          <button
            key={it.key}
            className="jar"
            onClick={() => onPick?.(it.key)}
            title={it.label}
          >
            <div className="jar-cap" />
            <div className="jar-label">{it.label}</div>
          </button>
        ))}
      </div>
    </div>
  );
}

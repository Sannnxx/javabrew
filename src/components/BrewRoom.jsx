import React, { useMemo } from "react";
import "./spice-ui.css";

import brewroomBg from "../assets/images/brewroom.png";

const BASE_SLOT = {
  key: "base",
  label: "Air",
  isBase: true,
};

export default function BrewRoom({ selectedItems = [], onReset, onBrew }) {
  const slots = useMemo(() => {
    const extras = selectedItems.slice(0, 3).map((item, idx) => ({
      key: item.key ?? `slot-${idx}`,
      label: item.label ?? "",
      image: item.image,
    }));
    while (extras.length < 3) {
      extras.push({ key: `empty-${extras.length}`, label: "-", isEmpty: true });
    }
    return [BASE_SLOT, ...extras];
  }, [selectedItems]);

  const canBrew = selectedItems.length > 0;

  return (
    <div className="panel brew-room">
      <div className="brew-room__bg" style={{ backgroundImage: `url(${brewroomBg})` }} />

      <div className="brew-room__slots">
        {slots.map((slot) => (
          <div
            key={slot.key}
            className={`brew-room__slot ${slot.isBase ? "is-base" : ""} ${slot.isEmpty ? "is-empty" : ""}`}
          >
            {slot.image ? (
              <img className="brew-room__slot-img" src={slot.image} alt={slot.label} />
            ) : (
              <span className="brew-room__slot-placeholder">{slot.label}</span>
            )}
          </div>
        ))}
      </div>

      <div className="brew-room__labels">
        {slots.map((slot) => (
          <span key={`${slot.key}-label`} className="brew-room__slot-label">
            {slot.label}
          </span>
        ))}
      </div>

      <div className="brew-room__actions">
        <button type="button" className="btn ghost" onClick={onReset}>RESET</button>
        <button
          type="button"
          className="btn solid"
          onClick={canBrew ? onBrew : undefined}
          disabled={!canBrew}
        >
          BREW
        </button>
      </div>
    </div>
  );
}


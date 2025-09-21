import React, { useEffect, useMemo, useState } from "react";
import bg from "./assets/images/Start_Menu.png";
import "./MainMenu.css";

export default function StartMenu({ onSelect, onBack }) {
  const options = useMemo(
    () => [
      { key: "play",    label: "PLAY GAME" },
      { key: "endless", label: "ENDLESS" },
      { key: "gallery", label: "GALLERY" },
      { key: "options", label: "OPTIONS" },
    ],
    []
  );
  const [i, setI] = useState(0);

  useEffect(() => { const im = new Image(); im.src = bg; }, []);
  useEffect(() => {
    const onKey = (e) => {
      if (["ArrowUp","ArrowDown","Enter","Escape"].includes(e.key)) e.preventDefault();
      if (e.key === "ArrowUp")   setI((n)=> (n-1+options.length)%options.length);
      if (e.key === "ArrowDown") setI((n)=> (n+1)%options.length);
      if (e.key === "Enter")     onSelect?.(options[i].key);
      if (e.key === "Escape")    onBack?.();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [i, options, onSelect, onBack]);

  return (
    <div className="start-root" style={{ backgroundImage: `url(${bg})` }}>
      {/* list ditempatkan tepat di bawah “RAMU JAMU” via --menu-x/--menu-y */}
      <ul className="ct-list" role="menu" aria-label="Main Menu">
        {options.map((opt, idx) => (
          <li
            key={opt.key}
            className={`ct-item ${idx === i ? "is-active" : ""}`}
            onMouseEnter={() => setI(idx)}
            onClick={() => onSelect?.(opt.key)}
            role="menuitem"
            tabIndex={0}
          >
            {opt.label}
          </li>
        ))}
      </ul>
    </div>
  );
}

import React, { useEffect, useState, useCallback } from "react";
import lobbyBg from "./assets/images/lobby.png";
import IngredientRoom from "./components/IngredientRoom";
import BrewRoom from "./components/BrewRoom";
import DialogBox from "./DialogBox";

// Vite/CRA modern bisa import JSON langsung
import introDialog from "./assets/data/test.json";

export default function CafeScene() {
  const [showPanels, setShowPanels] = useState(false);
  const [idx, setIdx] = useState(0);
  const lines = introDialog; // bisa diganti per chapter/scene

  useEffect(() => { const im = new Image(); im.src = lobbyBg; }, []);

  const applyCmd = useCallback((cmd) => {
    if (!cmd) return;
    const run = (c) => {
      switch (c) {
        case "SHOW_PANELS": setShowPanels(true); break;
        case "HIDE_PANELS": setShowPanels(false); break;
        // tambah command lain di sini:
        // case "PAUSE_INPUT": ...
        default: break;
      }
    };
    if (Array.isArray(cmd)) cmd.forEach(run); else run(cmd);
  }, []);

  const next = useCallback(() => {
    // eksekusi command pada baris saat ini, lalu maju
    const line = lines[idx];
    if (line?.cmd) applyCmd(line.cmd);
    setIdx((n) => Math.min(n + 1, lines.length - 1));
  }, [idx, lines, applyCmd]);

  return (
    <div
      style={{
        width: "100vw",
        height: "100vh",
        backgroundImage: `url(${lobbyBg})`,
        backgroundSize: "auto 100%",
        backgroundPosition: "center bottom",
        backgroundRepeat: "no-repeat",
        imageRendering: "pixelated",
        backgroundColor: "#1b120b",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Panel kanan muncul setelah dapat cmd SHOW_PANELS */}
      {showPanels && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gridTemplateRows: "1fr 1fr",
            gridTemplateAreas: `"left rightTop" "left rightBottom"`,
          }}
        >
          <div style={{ gridArea: "left" }} />
          <div style={{ gridArea: "rightTop" }}>
            <IngredientRoom onPick={(k) => console.log("pick:", k)} />
          </div>
          <div style={{ gridArea: "rightBottom" }}>
            <BrewRoom onReset={() => console.log("reset")} onBrew={() => console.log("brew")} />
          </div>

          {/* garis pemisah */}
          <div style={{ position:"absolute", left:"50%", top:0, bottom:0, width:8, background:"#000", transform:"translateX(-4px)" }} />
          <div style={{ position:"absolute", left:"50%", right:0, top:"50%", height:8, background:"#000", transform:"translateY(-4px)" }} />
        </div>
      )}

      {/* Dialog dari JSON */}
      <DialogBox line={lines[idx]} onNext={next} />
    </div>
  );
}

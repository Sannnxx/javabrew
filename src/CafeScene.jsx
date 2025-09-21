import React, { useEffect, useState, useCallback, useMemo } from "react";
import lobbyBg from "./assets/images/lobby.png";
import IngredientRoom from "./components/IngredientRoom";
import BrewRoom from "./components/BrewRoom";
import DialogBox from "./DialogBox";

// Vite/CRA modern bisa import JSON langsung
import introDialog from "./assets/data/test.json";

const DEFAULT_DAY = "day1";
const DEFAULT_CHARACTER = "sadewa";

const mergeCmd = (current, incoming) => {
  if (!incoming) return current;
  const currentList = Array.isArray(current) ? current : current ? [current] : [];
  const incomingList = Array.isArray(incoming) ? incoming : [incoming];
  const merged = [...currentList];
  incomingList.forEach((cmd) => {
    if (cmd && !merged.includes(cmd)) merged.push(cmd);
  });
  if (!merged.length) return undefined;
  return merged.length === 1 ? merged[0] : merged;
};

const normalizeLine = (entry, extra = {}) => {
  if (!entry) return null;
  const { cmd: extraCmd, ...rest } = extra || {};
  const line = {
    speaker: entry.speaker,
    text: entry.line ?? entry.text ?? "",
    ...(entry.cmd ? { cmd: entry.cmd } : {}),
  };
  if (extraCmd) line.cmd = mergeCmd(line.cmd, extraCmd);
  Object.assign(line, rest);
  return line;
};

const buildCharacterScript = (data, dayKey = DEFAULT_DAY, characterKey = DEFAULT_CHARACTER) => {
  const day = data?.days?.[dayKey];
  const scenario = day?.[characterKey];
  if (!scenario) return [];

  const script = [];
  const pushMany = (entries, extras) => {
    if (!entries) return;
    entries.forEach((entry, index, arr) => {
      const extra = typeof extras === "function" ? extras(entry, index, arr) : extras;
      const line = normalizeLine(entry, {
        day: dayKey,
        character: characterKey,
        ...extra,
      });
      if (line) script.push(line);
    });
  };

  const usedCameos = new Set();
  const cameoList = scenario.post_serving?.cameos ?? [];

  const drainCameos = (...triggers) => {
    cameoList.forEach((cameo) => {
      if (usedCameos.has(cameo)) return;
      if (!triggers.includes(cameo.trigger)) return;
      pushMany(cameo.exchanges, () => ({
        origin: "cameo",
        cameoPartner: cameo.partner,
      }));
      usedCameos.add(cameo);
    });
  };

  pushMany(scenario.smalltalk, () => ({ origin: "smalltalk" }));
  pushMany(scenario.order, (_entry, idx) => ({
    origin: "order",
    cmd: idx === 0 ? "SHOW_PANELS" : undefined,
  }));
  pushMany(scenario.serving, () => ({ origin: "serving" }));
  drainCameos("during_or_after_serving");
  pushMany(scenario.post_serving?.self, () => ({ origin: "post_serving" }));
  drainCameos("after_serving_only");

  // Keep any remaining cameo sequences visible even if new trigger types appear.
  cameoList.forEach((cameo) => {
    if (usedCameos.has(cameo)) return;
    pushMany(cameo.exchanges, () => ({
      origin: "cameo",
      cameoPartner: cameo.partner,
    }));
    usedCameos.add(cameo);
  });

  if (script.length) {
    const last = script[script.length - 1];
    last.cmd = mergeCmd(last.cmd, "HIDE_PANELS");
    if (!last.origin) last.origin = "post_serving";
  }

  return script;
};

export default function CafeScene() {
  const [showPanels, setShowPanels] = useState(false);
  const [idx, setIdx] = useState(0);
  const lines = useMemo(() => buildCharacterScript(introDialog), []);

  useEffect(() => {
    const im = new Image();
    im.src = lobbyBg;
  }, []);

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
    if (!lines.length) return;
    const line = lines[idx];
    if (line?.cmd) applyCmd(line.cmd);
    const maxIdx = lines.length - 1;
    setIdx((n) => Math.min(n + 1, maxIdx));
  }, [idx, lines, applyCmd]);

  const currentLine = lines[idx] ?? null;

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
      <DialogBox line={currentLine} onNext={next} />
    </div>
  );
}

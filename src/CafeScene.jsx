import React, { useEffect, useState, useCallback, useMemo } from "react";
import lobbyBg from "./assets/images/lobby.png";
import IngredientRoom from "./components/IngredientRoom";
import BrewRoom from "./components/BrewRoom";
import DialogBox from "./DialogBox";
import sadewaSprite from "./assets/sprites/Sadewa.png";
import abiprayaSprite from "./assets/sprites/Abipraya.png";
import satriaSprite from "./assets/sprites/Satria.png";

// Vite/CRA modern bisa import JSON langsung
import introDialog from "./assets/data/test.json";

const DEFAULT_DAY = "day1";
const DEFAULT_CHARACTER = "sadewa";

const CHARACTER_SPRITES = {
  sadewa: sadewaSprite,
  abipraya: abiprayaSprite,
  satria: satriaSprite,
};

const CHARACTER_LAYOUT = {
  sadewa: { left: "38%", bottom: "15%", scale: 0.22 },
  abipraya: { left: "54%", bottom: "15%", scale: 0.28 },
  satria: { left: "74%", bottom: "15%", scale: 0.28 },
};


const CAMERA_PRESETS = {
  default: { x: 50, y: 55, zoom: 1 },
  bar: { x: 44, y: 55, zoom: 1.05 },
  sadewa: { x: 34, y: 60, zoom: 1.12 },
  abipraya: { x: 54, y: 60, zoom: 1.12 },
  satria: { x: 74, y: 60, zoom: 1.12 },
};


const mixTargets = (a, b) => {
  if (!a && !b) return CAMERA_PRESETS.default;
  if (!a) return b;
  if (!b) return a;
  return {
    x: (a.x + b.x) / 2,
    y: (a.y + b.y) / 2,
    zoom: Math.max(1, Math.min(a.zoom, b.zoom) * 0.92),
  };
};

const toCharacterKey = (value) => {
  if (!value) return null;
  const key = value.toString().trim().toLowerCase();
  return CHARACTER_SPRITES[key] ? key : null;
};

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
  pushMany(scenario.order, () => ({ origin: "order" }));
  pushMany(scenario.serving, (_entry, idx, arr) => ({
    origin: "serving",
    cmd: idx === arr.length - 1 ? "SHOW_PANELS" : undefined,
  }));
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
  const [brewStepActive, setBrewStepActive] = useState(false);
  const [queuedIdx, setQueuedIdx] = useState(null);
  const [idx, setIdx] = useState(0);
  const lines = useMemo(() => buildCharacterScript(introDialog), []);
  const [camera, setCamera] = useState(CAMERA_PRESETS.default);

  useEffect(() => {
    const im = new Image();
    im.src = lobbyBg;
  }, []);

  const applyCmd = useCallback((cmd) => {
    let hold = false;
    const run = (c) => {
      switch (c) {
        case "SHOW_PANELS":
          setShowPanels(true);
          setBrewStepActive(true);
          hold = true;
          break;
        case "HIDE_PANELS":
          setShowPanels(false);
          setBrewStepActive(false);
          break;
        default:
          break;
      }
    };
    if (Array.isArray(cmd)) cmd.forEach(run); else run(cmd);
    return hold;
  }, []);

  const advanceLine = useCallback(() => {
    if (!lines.length) return;
    if (brewStepActive) return;
    const line = lines[idx];
    const maxIdx = lines.length - 1;
    let hold = false;
    if (line?.cmd) hold = applyCmd(line.cmd);
    if (hold) {
      setQueuedIdx(Math.min(idx + 1, maxIdx));
      return;
    }
    setIdx((n) => Math.min(n + 1, maxIdx));
  }, [applyCmd, brewStepActive, idx, lines]);

  const handleBrewComplete = useCallback(() => {
    applyCmd("HIDE_PANELS");
    if (queuedIdx !== null) {
      setIdx(queuedIdx);
      setQueuedIdx(null);
    }
  }, [applyCmd, queuedIdx]);

  const currentLine = lines[idx] ?? null;

  useEffect(() => {
    const target = currentLine
      ? (() => {
          if (currentLine.origin === "cameo") {
            const mainKey = toCharacterKey(currentLine.character);
            const cameoKey = toCharacterKey(currentLine.cameoPartner);
            const mainTarget = mainKey ? CAMERA_PRESETS[mainKey] : null;
            const cameoTarget = cameoKey ? CAMERA_PRESETS[cameoKey] : null;
            return mixTargets(mainTarget, cameoTarget);
          }
          const speakerKey = toCharacterKey(currentLine.speaker);
          if (speakerKey && CAMERA_PRESETS[speakerKey]) return CAMERA_PRESETS[speakerKey];
          if (currentLine.speaker && currentLine.speaker.toLowerCase() === "penjual") {
            return CAMERA_PRESETS.bar;
          }
          const scenarioKey = toCharacterKey(currentLine.character);
          if (scenarioKey && CAMERA_PRESETS[scenarioKey]) return CAMERA_PRESETS[scenarioKey];
          return CAMERA_PRESETS.default;
        })()
      : CAMERA_PRESETS.default;
    setCamera(target);
  }, [currentLine]);

  const presentCharacters = useMemo(() => {
    if (!lines.length) return [];
    const seen = new Set();
    const defaultKey = toCharacterKey(DEFAULT_CHARACTER);
    if (defaultKey) seen.add(defaultKey);
    for (let i = 0; i <= idx; i += 1) {
      const line = lines[i];
      if (!line) continue;
      const speakerKey = toCharacterKey(line.speaker);
      if (speakerKey) seen.add(speakerKey);
      if (line.origin === "cameo") {
        const cameoKey = toCharacterKey(line.cameoPartner);
        if (cameoKey) seen.add(cameoKey);
        const scenarioKey = toCharacterKey(line.character);
        if (scenarioKey) seen.add(scenarioKey);
      } else if (line.character) {
        const scenarioKey = toCharacterKey(line.character);
        if (scenarioKey) seen.add(scenarioKey);
      }
    }
    return Array.from(seen);
  }, [lines, idx]);

  const highlightKeys = useMemo(() => {
    const set = new Set();
    const speakerKey = toCharacterKey(currentLine?.speaker);
    if (speakerKey) set.add(speakerKey);
    if (currentLine?.origin === "cameo") {
      const cameoKey = toCharacterKey(currentLine.cameoPartner);
      if (cameoKey) set.add(cameoKey);
      const scenarioKey = toCharacterKey(currentLine.character);
      if (scenarioKey) set.add(scenarioKey);
    }
    return set;
  }, [currentLine]);

  const backgroundStyle = useMemo(() => ({
    position: "absolute",
    inset: 0,
    backgroundImage: `url(${lobbyBg})`,
    backgroundSize: "auto 100%",
    backgroundPosition: "center bottom",
    backgroundRepeat: "no-repeat",
    imageRendering: "pixelated",
    transformOrigin: `${camera.x}% ${camera.y}%`,
    transform: `scale(${camera.zoom})`,
    transition: "transform 0.55s ease-out, transform-origin 0.55s ease-out",
  }), [camera]);

  return (
    <div
      style={{
        width: "100vw",
        height: "100vh",
        backgroundColor: "#1b120b",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <div style={{ position: "absolute", inset: 0, overflow: "hidden" }}>
        <div style={backgroundStyle}>
          <div style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
            {presentCharacters.map((key) => {
              const sprite = CHARACTER_SPRITES[key];
              const layout = CHARACTER_LAYOUT[key];
              if (!sprite || !layout) return null;
              const isActive = highlightKeys.has(key);
              const scale = isActive ? layout.scale * 1.08 : layout.scale;
              return (
                <img
                  key={key}
                  src={sprite}
                  alt={key}
                  style={{
                    position: "absolute",
                    left: layout.left,
                    bottom: layout.bottom,
                    transform: `translateX(-50%) scale(${scale})`,
                    transformOrigin: "bottom center",
                    filter: isActive ? "brightness(1) drop-shadow(0 0 16px rgba(255, 215, 160, 0.7))" : "brightness(0.55)",
                    transition: "transform 0.3s ease, filter 0.3s ease",
                    zIndex: isActive ? 5 : 4,
                  }}
                />
              );
            })}
          </div>
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: "radial-gradient(circle at 50% 60%, rgba(0,0,0,0) 35%, rgba(0,0,0,0.35) 90%)",
              pointerEvents: "none",
            }}
          />
        </div>
      </div>

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
            pointerEvents: "none",
          }}
        >
          <div style={{ gridArea: "left" }} />
          <div style={{ gridArea: "rightTop", pointerEvents: "auto" }}>
            <IngredientRoom onPick={(k) => console.log("pick:", k)} />
          </div>
          <div style={{ gridArea: "rightBottom", pointerEvents: "auto" }}>
            <BrewRoom
              onReset={() => console.log("reset")}
              onBrew={handleBrewComplete}
            />
          </div>

          {/* garis pemisah */}
          <div style={{ position:"absolute", left:"50%", top:0, bottom:0, width:8, background:"#000", transform:"translateX(-4px)" }} />
          <div style={{ position:"absolute", left:"50%", right:0, top:"50%", height:8, background:"#000", transform:"translateY(-4px)" }} />
        </div>
      )}

      {/* Dialog dari JSON */}
      <DialogBox line={currentLine} onNext={advanceLine} disabled={brewStepActive} />
    </div>
  );
}

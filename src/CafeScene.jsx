import React, { useEffect, useState, useCallback, useMemo, useRef } from "react";
import lobbyBg from "./assets/images/lobby.png";
import IngredientRoom from "./components/IngredientRoom";
import BrewRoom from "./components/BrewRoom";
import DialogBox from "./DialogBox";
import sadewaSprite from "./assets/sprites/Sadewa.png";
import abiprayaSprite from "./assets/sprites/Abipraya.png";
import satriaSprite from "./assets/sprites/Satria.png";
import jamuCupImg from "./assets/jamu/cangkir.png";

// Vite/CRA modern bisa import JSON langsung
import introDialog from "./assets/data/test.json";
import recipeBook from "./assets/data/recipes.json";

const DEFAULT_DAY = "day1";
const DEFAULT_CHARACTER = "sadewa";

const RECIPE_LIBRARY = recipeBook?.recipes ?? {};
const ORDER_LIBRARY = recipeBook?.orders ?? {};

const NOTE_TONES = {
  info: { background: "#fef3c7", border: "#b45309" },
  success: { background: "#dcfce7", border: "#15803d" },
  error: { background: "#fee2e2", border: "#b91c1c" },
  warning: { background: "#fef9c3", border: "#a16207" },
};
const DEFAULT_NOTE_TONE = NOTE_TONES.info;

const hasCmd = (cmd, target) => (Array.isArray(cmd) ? cmd.includes(target) : cmd === target);

const findRecipeForScenario = (dayKey, characterKey) => {
  if (!dayKey || !characterKey) return null;
  const recipeKey = ORDER_LIBRARY?.[dayKey]?.[characterKey];
  if (!recipeKey) return null;
  const recipe = RECIPE_LIBRARY?.[recipeKey];
  if (!recipe) return null;
  return { key: recipeKey, ...recipe };
};

const formatTitleCase = (value) => {
  if (!value) return "";
  const str = value.toString();
  return str.charAt(0).toUpperCase() + str.slice(1);
};

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
  pushMany(scenario.order, (_entry, idx, arr) => ({
    origin: "order",
    cmd: idx === arr.length - 1 ? "SHOW_PANELS" : undefined,
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
  const [brewStepActive, setBrewStepActive] = useState(false);
  const [queuedIdx, setQueuedIdx] = useState(null);
  const [idx, setIdx] = useState(0);
  const [selectedIngredients, setSelectedIngredients] = useState([]);
  const [activeRecipe, setActiveRecipe] = useState(null);
  const [floatingNote, setFloatingNote] = useState(null);
  const floatingTimerRef = useRef(null);
  const [successProgress, setSuccessProgress] = useState(0);
  const [successMarkVisible, setSuccessMarkVisible] = useState(false);
  const [awaitingSuccessCompletion, setAwaitingSuccessCompletion] = useState(false);
  const successTimerRef = useRef(null);

  const selectedIngredientKeys = useMemo(() => selectedIngredients.map((item) => item.key), [selectedIngredients]);
  const lines = useMemo(() => buildCharacterScript(introDialog), []);
  const [camera, setCamera] = useState(CAMERA_PRESETS.default);

  useEffect(() => {
    const im = new Image();
    im.src = lobbyBg;
  }, []);

  useEffect(() => () => {
    if (floatingTimerRef.current) {
      clearTimeout(floatingTimerRef.current);
      floatingTimerRef.current = null;
    }
    if (successTimerRef.current) {
      clearInterval(successTimerRef.current);
      successTimerRef.current = null;
    }
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

  const setManagedFloatingNote = useCallback((note) => {
    setFloatingNote(note);
    if (floatingTimerRef.current) {
      clearTimeout(floatingTimerRef.current);
      floatingTimerRef.current = null;
    }
    if (note?.duration) {
      floatingTimerRef.current = setTimeout(() => {
        setFloatingNote((current) => (current?.id === note.id ? null : current));
        floatingTimerRef.current = null;
      }, note.duration);
    }
  }, []);

  const clearSuccessTimer = useCallback(() => {
    if (successTimerRef.current) {
      clearInterval(successTimerRef.current);
      successTimerRef.current = null;
    }
  }, []);

  const dismissFloatingNote = useCallback(() => {
    if (floatingNote?.type === "success" && awaitingSuccessCompletion && !successMarkVisible) {
      return;
    }
    if (floatingTimerRef.current) {
      clearTimeout(floatingTimerRef.current);
      floatingTimerRef.current = null;
    }
    clearSuccessTimer();
    setSuccessProgress(0);
    setSuccessMarkVisible(false);
    setAwaitingSuccessCompletion(false);
    setFloatingNote(null);
  }, [awaitingSuccessCompletion, clearSuccessTimer, floatingNote, successMarkVisible]);

  useEffect(() => {
    clearSuccessTimer();
    if (floatingNote?.type !== "success") {
      setSuccessProgress(0);
      setSuccessMarkVisible(false);
      setAwaitingSuccessCompletion(false);
      return undefined;
    }

    setSuccessProgress(0);
    setSuccessMarkVisible(false);
    let current = 0;
    const step = () => {
      current = Math.min(current + 1, 100);
      setSuccessProgress(current);
      if (current >= 100) {
        setSuccessMarkVisible(true);
        clearSuccessTimer();
      }
    };

    step();
    successTimerRef.current = setInterval(step, 18);
    return clearSuccessTimer;
  }, [awaitingSuccessCompletion, clearSuccessTimer, floatingNote]);
  const advanceLine = useCallback(() => {
    if (!lines.length) return;
    if (brewStepActive) return;
    const line = lines[idx];
    const maxIdx = lines.length - 1;
    let hold = false;

    if (line?.cmd) {
      if (hasCmd(line.cmd, "SHOW_PANELS")) {
        const recipe = findRecipeForScenario(line.day ?? DEFAULT_DAY, line.character ?? DEFAULT_CHARACTER);
        setActiveRecipe(recipe);
        setSelectedIngredients([]);
        if (recipe) {
          const listText = recipe.ingredients.map((entry) => entry.label).join(", ");
          setManagedFloatingNote({
            id: `info-${Date.now()}`,
            type: "info",
            title: `${formatTitleCase(line.character ?? recipe.label)} memesan ${recipe.label}`,
            body: `Campurkan: ${listText}`,
          });
        } else {
          setManagedFloatingNote({
            id: `warn-${Date.now()}`,
            type: "warning",
            title: "Resep belum tercatat",
            body: "Catat dulu kombinasi jamu sebelum menyeduh.",
          });
        }
      }
      hold = applyCmd(line.cmd);
    }

    if (hold) {
      setQueuedIdx(Math.min(idx + 1, maxIdx));
      return;
    }
    setIdx((n) => Math.min(n + 1, maxIdx));
  }, [applyCmd, brewStepActive, idx, lines, setManagedFloatingNote]);

  const handleIngredientPick = useCallback((item) => {
    if (!item || !item.key) return;
    setSelectedIngredients((prev) => {
      const filtered = prev.filter((entry) => entry.key !== item.key);
      if (filtered.length !== prev.length) {
        return filtered;
      }
      if (filtered.length >= 3) {
        return prev;
      }
      return [...filtered, item];
    });
  }, []);

  const handleResetBrew = useCallback(() => {
    setSelectedIngredients([]);
  }, []);

  const handleBrewComplete = useCallback(() => {
    setSelectedIngredients([]);
    setActiveRecipe(null);
    applyCmd("HIDE_PANELS");
    if (queuedIdx !== null) {
      setIdx(queuedIdx);
      setQueuedIdx(null);
    }
  }, [applyCmd, queuedIdx]);

  const handleBrew = useCallback(() => {
    if (!selectedIngredientKeys.length) return;

    if (!activeRecipe) {
      setManagedFloatingNote({
        id: `info-${Date.now()}`,
        type: "info",
        title: "Belum ada pesanan",
        body: "Tunggu sampai order masuk sebelum menyeduh.",
        duration: 2400,
      });
      return;
    }

    const expectedExtras = activeRecipe.ingredients
      .map((entry) => entry.key)
      .filter((key) => key && key !== "air");

    const selectedSet = new Set(selectedIngredientKeys);
    const isMatch = expectedExtras.length === selectedSet.size && expectedExtras.every((key) => selectedSet.has(key));

    if (isMatch) {
      const successList = activeRecipe.ingredients.map((entry) => entry.label).join(", ");
      setManagedFloatingNote({
        id: `success-${Date.now()}`,
        type: "success",
        title: "Selamat!",
        body: `Kamu berhasil membuat ${activeRecipe.label}.\nCampuran: ${successList}`,
        duration: 3600,
      });
      handleBrewComplete();
      return;
    }

    const extrasLabel = activeRecipe.ingredients
      .filter((entry) => entry.key !== "air")
      .map((entry) => entry.label);
    const expectedCaption = ["Air", ...extrasLabel].join(", ");

    setManagedFloatingNote({
      id: `error-${Date.now()}`,
      type: "error",
      title: "Resep belum pas",
      body: `Gunakan: ${expectedCaption}`,
    });

    setSelectedIngredients([]);
  }, [activeRecipe, handleBrewComplete, selectedIngredientKeys, setManagedFloatingNote]);

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

  const floatingTone = useMemo(() => NOTE_TONES[floatingNote?.type] ?? DEFAULT_NOTE_TONE, [floatingNote]);
  const floatingPositionStyle = useMemo(() => {
    if (floatingNote?.type === "success") {
      return { top: "50%", left: "50%", transform: "translate(-50%, -50%)" };
    }
    return showPanels
      ? { top: "6%", left: "4%", transform: "none" }
      : { top: "8%", left: "4%", transform: "none" };
  }, [floatingNote, showPanels]);

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

      {floatingNote && (
        <div
          style={{
            position: "absolute",
            zIndex: 10,
            padding: "12px 16px 10px",
            borderRadius: 12,
            boxShadow: "0 12px 24px rgba(0,0,0,0.35)",
            width: "min(360px, 80vw)",
            background: floatingTone.background,
            border: `2px solid ${floatingTone.border}`,
            fontFamily: "'Press Start 2P', monospace",
            color: "#2b2312",
            pointerEvents: "auto",
            ...floatingPositionStyle,
          }}
        >
          <button
            type="button"
            onClick={dismissFloatingNote}
            style={{
              position: "absolute",
              top: 6,
              right: 8,
              background: "transparent",
              border: "none",
              color: floatingTone.border,
              fontSize: 18,
              lineHeight: 1,
              cursor: "pointer",
            }}
            aria-label="Tutup catatan"
          >
            x
          </button>
          {floatingNote.type === "success" ? (
            <>
              {floatingNote.title && (
                <div style={{ fontSize: 14, marginBottom: 6, textTransform: "uppercase", letterSpacing: 1.5 }}>
                  {floatingNote.title}
                </div>
              )}
              <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                <img
                  src={jamuCupImg}
                  alt="gelas jamu"
                  style={{ width: 68, height: "auto", imageRendering: "pixelated" }}
                />
                <div style={{ fontSize: 14, lineHeight: 1.4, whiteSpace: "pre-line" }}>
                  {(floatingNote.body ? floatingNote.body.split("\n") : []).map((line, idx) => (
                    <div key={`success-line-${idx}`}>
                      {line}
                    </div>
                  ))}
                </div>
              </div>
              <div style={{ marginTop: 12, display: "flex", alignItems: "center", gap: 10, fontSize: 12 }}>
                <div
                  style={{
                    position: "relative",
                    flex: 1,
                    height: 12,
                    border: "2px solid rgba(0,0,0,0.4)",
                    borderRadius: 6,
                    overflow: "hidden",
                    background: "rgba(0,0,0,0.08)",
                  }}
                >
                  <div
                    style={{
                      width: `${successProgress}%`,
                      height: "100%",
                      background: "rgba(46, 204, 113, 0.85)",
                      transition: "width 0.12s ease-out",
                    }}
                  />
                </div>
                <div style={{ minWidth: 60, textAlign: "right" }}>
                  {successMarkVisible ? "✓" : `${successProgress}%`}
                </div>
              </div>
            </>
          ) : (
            <>
              {floatingNote.title && (
                <div style={{ fontSize: 14, marginBottom: 6, textTransform: "uppercase", letterSpacing: 1.5 }}>
                  {floatingNote.title}
                </div>
              )}
              {floatingNote.body && (
                <div style={{ fontSize: 14, lineHeight: 1.4, whiteSpace: "pre-line" }}>
                  {floatingNote.body}
                </div>
              )}
            </>
          )}
        </div>
      )}

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
            <IngredientRoom onPick={handleIngredientPick} selectedKeys={selectedIngredientKeys} />
          </div>
          <div style={{ gridArea: "rightBottom", pointerEvents: "auto" }}>
            <BrewRoom
              selectedItems={selectedIngredients}
              onReset={handleResetBrew}
              onBrew={handleBrew}
            />
          </div>

          <div style={{ position: "absolute", left: "50%", top: 0, bottom: 0, width: 8, background: "#000", transform: "translateX(-4px)" }} />
          <div style={{ position: "absolute", left: "50%", right: 0, top: "50%", height: 8, background: "#000", transform: "translateY(-4px)" }} />
        </div>
      )}

      {/* Dialog dari JSON */}
      <DialogBox line={brewStepActive ? null : currentLine} onNext={advanceLine} disabled={brewStepActive} />
    </div>
  );
}

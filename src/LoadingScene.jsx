import React from "react";

export default function LoadingScreen({ progress = 0, message = "Loading..." }) {
  return (
    <div style={styles.root}>
      {/* ikon cangkir + uap simple */}
      <div style={styles.cupWrap}>
        <div style={styles.steam(0)} />
        <div style={styles.steam(0.25)} />
        <div style={styles.steam(0.5)} />
        <div style={styles.mug} />
        <div style={styles.plate} />
      </div>

      <div style={styles.textRow}>
        <span>{message}</span>
        <span style={styles.dots}><span>.</span><span>.</span><span>.</span></span>
      </div>

      <div style={styles.bar}>
        <div style={{ ...styles.fill, width: `${progress}%` }} />
      </div>

      <div style={styles.percent}>{progress}%</div>
    </div>
  );
}

const styles = {
  root: {
    width: "100vw",
    height: "100vh",
    background: "#0e0b09",
    display: "grid",
    placeItems: "center",
    alignContent: "center",
    gap: 14,
    color: "#E8E0BA",
    fontFamily: "'Press Start 2P', monospace",
    animation: "fadeIn .18s ease-out",
  },
  cupWrap: { position: "relative", width: 140, height: 120 },
  mug: {
    position: "absolute", bottom: 20, left: 22, right: 22, height: 54,
    background: "#ccb88c", border: "4px solid #2a1d12", borderRadius: "6px 6px 10px 10px",
  },
  plate: {
    position: "absolute", bottom: 10, left: 0, right: 0, height: 10,
    background: "#a58e60", border: "4px solid #2a1d12", borderRadius: 10,
  },
  steam: (delay = 0) => ({
    position: "absolute", bottom: 74, left: "50%", width: 6, height: 18,
    background: "#efe6c7", opacity: 0.75, borderRadius: 3, filter: "blur(0.4px)",
    animation: `rise 1.6s linear ${delay}s infinite`,
  }),
  textRow: { display: "flex", gap: 8, alignItems: "center" },
  dots: {
    display: "inline-flex",
  },
  bar: {
    width: "min(520px, 80vw)",
    height: 14,
    background: "#4b3b23",
    border: "3px solid #2a1d12",
    borderRadius: 8,
    overflow: "hidden",
  },
  fill: {
    height: "100%",
    background: "#E8E0BA",
    boxShadow: "inset 0 -3px 0 rgba(0,0,0,.35)",
    transition: "width .15s linear",
  },
  percent: { fontSize: 12, opacity: 0.85 },
};

/* keyframes inline */
const styleEl = document.createElement("style");
styleEl.innerHTML = `
@keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }
@keyframes rise {
  0% { transform: translateY(0) scaleY(1); opacity:.9; }
  100% { transform: translateY(-40px) scaleY(.6); opacity:0; }
}`;
if (typeof document !== "undefined" && !document.getElementById("loading-kf")) {
  styleEl.id = "loading-kf";
  document.head.appendChild(styleEl);
}

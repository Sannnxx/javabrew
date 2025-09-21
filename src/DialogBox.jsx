import React, { useEffect } from "react";

export default function DialogBox({ line, onNext }) {
  useEffect(() => {
    const h = (e) => {
      if (e.key === "Enter" || e.key === " ") onNext?.();
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [onNext]);

  if (!line) return null;

  return (
    <div style={styles.wrap} onClick={onNext}>
      {line.speaker && <div style={styles.title}>{line.speaker}</div>}
      <div style={styles.text}>{line.text}</div>
      <div style={styles.hint}>[Enter] untuk lanjut</div>
    </div>
  );
}

const styles = {
  wrap: {
    position: "absolute", left: "50%", bottom: 24, transform: "translateX(-50%)",
    width: "min(90vw, 900px)", background: "#f3e9c6", color: "#2b2312",
    border: "3px solid #2a1d12", borderRadius: 8, padding: "12px 16px",
    boxShadow: "0 3px 0 rgba(0,0,0,.4)", fontFamily: "'VT323', monospace",
  },
  title: { fontFamily: "'Press Start 2P', monospace", fontSize: 12, marginBottom: 6 },
  text:  { fontSize: 22, lineHeight: 1.05 },
  hint:  { fontFamily: "'Press Start 2P', monospace", fontSize: 10, opacity: .7, marginTop: 6, textAlign: "right" },
};

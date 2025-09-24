
import React, { useEffect, useRef, useState, useCallback } from "react";

const TYPING_INTERVAL = 24;

export default function DialogBox({ line, onNext, disabled = false }) {
  const fullText = line?.text ?? "";
  const [displayedText, setDisplayedText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const typingTimeoutRef = useRef(null);

  const stopTyping = useCallback(() => {
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }
    setIsTyping(false);
  }, []);

  useEffect(() => {
    stopTyping();
    if (!line) {
      setDisplayedText("");
      return undefined;
    }

    if (!fullText) {
      setDisplayedText("");
      return undefined;
    }

    setDisplayedText("");
    setIsTyping(true);

    let index = 0;
    const typeNext = () => {
      index += 1;
      setDisplayedText(fullText.slice(0, index));
      if (index < fullText.length) {
        typingTimeoutRef.current = setTimeout(typeNext, TYPING_INTERVAL);
      } else {
        stopTyping();
      }
    };

    typingTimeoutRef.current = setTimeout(typeNext, TYPING_INTERVAL);
    return () => stopTyping();
  }, [fullText, line, stopTyping]);

  const handleAdvance = useCallback(() => {
    if (disabled) return;
    if (isTyping) {
      stopTyping();
      setDisplayedText(fullText);
      return;
    }
    onNext?.();
  }, [disabled, fullText, isTyping, onNext, stopTyping]);

  useEffect(() => {
    if (disabled) return undefined;
    const h = (e) => {
      if (e.key === "Enter" || e.key === " ") handleAdvance();
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [handleAdvance, disabled]);

  if (!line) return null;

  return (
    <div
      style={{
        ...styles.wrap,
        cursor: disabled ? "default" : "pointer",
        opacity: disabled ? 0.65 : 1,
      }}
      onClick={disabled ? undefined : handleAdvance}
    >
      {line.speaker && <div style={styles.title}>{line.speaker}</div>}
      <div style={styles.text}>{displayedText}</div>
      <div style={styles.hint}>
        {disabled ? "Selesaikan racikan untuk lanjut" : (isTyping ? "[Enter] untuk skip" : "[Enter] untuk lanjut")}
      </div>
    </div>
  );
}

const styles = {
  wrap: {
    position: "absolute", left: "50%", bottom: 24, transform: "translateX(-50%)",
    width: "min(90vw, 900px)", background: "#f3e9c6", color: "#2b2312",
    border: "3px solid #2a1d12", borderRadius: 8, padding: "12px 16px",
    boxShadow: "0 3px 0 rgba(0,0,0,.4)", fontFamily: "'VT323', monospace",
    transition: "opacity 0.25s ease",
  },
  title: { fontFamily: "'Press Start 2P', monospace", fontSize: 12, marginBottom: 6 },
  text:  { fontSize: 22, lineHeight: 1.05 },
  hint:  { fontFamily: "'Press Start 2P', monospace", fontSize: 10, opacity: .7, marginTop: 6, textAlign: "right" },
};

import { useEffect, useRef, useState } from "react";
import companyLogo from "./assets/images/companylogo.png";

export default function SplashScreen({
  onDone,
  durationMs = 5000,            // ← lamanya loading (ms). 5000 = 5 detik
  fadeInMs = 700,               // durasi fade-in logo (opsional)
}) {
  const [visible, setVisible] = useState(false);
  const [progress, setProgress] = useState(0);
  const rafId = useRef(null);
  const start = useRef(0);

  // Trigger fade-in logo
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 50);
    return () => clearTimeout(t);
  }, []);

  // Isi progress bar berdasarkan waktu → pindah setelah 100%
  useEffect(() => {
    start.current = performance.now();

    const tick = (now) => {
      const elapsed = now - start.current;
      const pct = Math.min(100, (elapsed / durationMs) * 100);
      setProgress(pct);

      if (pct < 100) {
        rafId.current = requestAnimationFrame(tick);
      } else {
        // kasih sedikit jeda biar 100% kebaca mata
        setTimeout(() => onDone?.(), 200);
      }
    };

    rafId.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId.current);
  }, [durationMs, onDone]);

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-white">
      <img
        src={companyLogo}
        alt="Company Logo"
        className={`w-56 sm:w-64 md:w-72 transition-opacity`}
        style={{ opacity: visible ? 1 : 0, transitionDuration: `${fadeInMs}ms` }}
        draggable={false}
      />

      <div className="h-8" />

      <p className="mb-2 text-sm text-gray-600">
        Please wait... {Math.round(progress)}%
      </p>

      <div className="w-[70%] max-w-xl rounded-full bg-indigo-100 p-1" aria-label="loading progress">
        <div
          className="h-3 rounded-full bg-indigo-500"
          style={{
            width: `${progress}%`,
            transition: "width 80ms linear", // smooth tapi tetap dikontrol waktu
          }}
        />
      </div>
    </div>
  );
}

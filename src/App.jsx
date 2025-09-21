import React, { useEffect, useState } from "react";
import MainMenu from "./MainMenu";
import CafeScene from "./CafeScene";
import LoadingScene from "./LoadingScene";
import SplashScreen from "./SplashScreen"; // ← logo fade-in pertama
import lobbyBg from "./assets/images/lobby.png"; // sesuaikan path kalau perlu

export default function App() {
  // scene: "splash" | "menu" | "loading" | "cafe"
  const [scene, setScene] = useState("splash");
  const [progress, setProgress] = useState(0);

  // otomatis pindah dari splash → menu setelah selesai animasi
  // kalau mau kontrol dari dalam SplashScreen, bisa kirim onDone dari props
  useEffect(() => {
    if (scene !== "splash") return;
    const t = setTimeout(() => setScene("menu"), 5000); // durasi minimal splash
    return () => clearTimeout(t);
  }, [scene]);

  const handleSelect = async (key) => {
    if (key === "play") {
      setScene("loading");
      setProgress(0);

      // simulasi progress bar (3 detik)
      let value = 0;
      const duration = 3000; // total durasi 3s
      const step = 50;       // update tiap 50ms
      const increment = 100 / (duration / step);

      const timer = setInterval(() => {
        value += increment;
        if (value >= 100) {
          clearInterval(timer);
          setProgress(100);
          // setelah selesai → masuk cafe
          setTimeout(() => setScene("cafe"), 300);
        } else {
          setProgress(Math.floor(value));
        }
      }, step);

      // preload asset juga, tapi tidak wajib tunggu selesai (biar lancar)
      const img = new Image();
      img.src = lobbyBg;

      return;
    }
    if (key === "endless") alert("Mode Endless belum ada 🚧");
    if (key === "gallery") alert("Gallery coming soon ✨");
    if (key === "options") alert("Options coming soon ⚙️");
  };

  if (scene === "splash")  return <SplashScreen durationMs={5000} onDone={() => setScene("menu")} />;
  if (scene === "loading") return <LoadingScene progress={progress} message="Brewing..." />;
  if (scene === "cafe")    return <CafeScene onBack={() => setScene("menu")} />;
  return <MainMenu onSelect={handleSelect} />;
}

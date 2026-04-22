import { useEffect } from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Shell } from "./components/Shell";
import { Home } from "./pages/Home";
import { Quiz } from "./pages/Quiz";
import { Waypoint } from "./pages/Waypoint";
import { Bonus } from "./pages/Bonus";
import { Summary } from "./pages/Summary";
import { Leaderboard } from "./pages/Leaderboard";
import { rollOverIfNewDay } from "./engine/run";

export default function App() {
  useEffect(() => {
    rollOverIfNewDay();
  }, []);
  return (
    <BrowserRouter>
      <Shell>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/act/:actId" element={<Quiz />} />
          <Route path="/waypoint/:fromActId" element={<Waypoint />} />
          <Route path="/bonus" element={<Bonus />} />
          <Route path="/summary" element={<Summary />} />
          <Route path="/leaderboard" element={<Leaderboard />} />
        </Routes>
      </Shell>
    </BrowserRouter>
  );
}

import { useState } from "react";
import { GameProvider, useGame } from "./state/GameContext.jsx";
import { useDayNight } from "./hooks/useDayNight.js";
import { useProfile } from "./hooks/useProfile.js";
import TopBar from "./components/TopBar.jsx";
import RugRunner from "./components/RugRunner.jsx";
import QuestLog from "./components/QuestLog.jsx";
import TrendingTicker from "./components/TrendingTicker.jsx";
import Marketplace from "./components/Marketplace.jsx";
import ContactList from "./components/ContactList.jsx";
import Leaderboard from "./components/Leaderboard.jsx";
import Suggestions from "./components/Suggestions.jsx";
import Profile from "./components/Profile.jsx";
import MarketEventBanner from "./components/MarketEventBanner.jsx";
import Confetti from "./components/Confetti.jsx";
import Toasts from "./components/Toasts.jsx";
import MenuDrawer from "./components/MenuDrawer.jsx";

function GameShell() {
  const { confettiRef } = useGame();
  const { night } = useDayNight();
  const { profile, save } = useProfile();
  const [tab, setTab] = useState("trending"); // trending = home
  const [menuOpen, setMenuOpen] = useState(false);

  const navigate = (id) => {
    setTab(id);
    setMenuOpen(false);
  };

  return (
    <div className="app-shell">
      <TopBar night={night} onOpenMenu={() => setMenuOpen(true)} menuOpen={menuOpen} />
      <MarketEventBanner />
      <div className="app-main">
        {tab === "trending" && <TrendingTicker />}
        {tab === "marketplace" && <Marketplace />}
        {tab === "contacts" && <ContactList />}
        {tab === "runner" && <RugRunner />}
        {tab === "quests" && <QuestLog />}
        {tab === "leaderboard" && <Leaderboard />}
        {tab === "suggestions" && <Suggestions username={profile.username} />}
        {tab === "profile" && <Profile profile={profile} onSave={save} />}
      </div>
      <Confetti ref={confettiRef} />
      <Toasts />
      <MenuDrawer open={menuOpen} onClose={() => setMenuOpen(false)} tab={tab} onNavigate={navigate} />
    </div>
  );
}

export default function App() {
  return (
    <GameProvider>
      <GameShell />
    </GameProvider>
  );
}

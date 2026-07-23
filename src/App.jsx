import { useState } from "react";
import { GameProvider, useGame } from "./state/GameContext.jsx";
import { useDayNight } from "./hooks/useDayNight.js";
import { useProfile } from "./hooks/useProfile.js";
import { useSections } from "./hooks/useSections.js";
import TopBar from "./components/TopBar.jsx";
import RugRunner from "./components/RugRunner.jsx";
import QuestLog from "./components/QuestLog.jsx";
import TrendingTicker from "./components/TrendingTicker.jsx";
import Marketplace from "./components/Marketplace.jsx";
import ContactList from "./components/ContactList.jsx";
import Leaderboard from "./components/Leaderboard.jsx";
import Suggestions from "./components/Suggestions.jsx";
import Profile from "./components/Profile.jsx";
import ComingSoon from "./components/ComingSoon.jsx";
import MarketEventBanner from "./components/MarketEventBanner.jsx";
import Confetti from "./components/Confetti.jsx";
import Toasts from "./components/Toasts.jsx";
import MenuDrawer from "./components/MenuDrawer.jsx";

const LABELS = {
  trending: "Town Hall", marketplace: "Marketplace", contacts: "Contacts",
  runner: "Rug Runner", quests: "Quests", leaderboard: "Leaderboard",
  suggestions: "Suggestions", profile: "Profile",
};

function GameShell() {
  const { confettiRef } = useGame();
  const { night } = useDayNight();
  const { profile, save } = useProfile();
  const sections = useSections();
  const [tab, setTab] = useState("trending"); // trending = home
  const [menuOpen, setMenuOpen] = useState(false);

  const navigate = (id) => {
    setTab(id);
    setMenuOpen(false);
  };

  function renderTab() {
    if (sections[tab] === "maintenance") return <ComingSoon title={LABELS[tab]} />;
    switch (tab) {
      case "marketplace": return <Marketplace />;
      case "contacts": return <ContactList />;
      case "runner": return <RugRunner />;
      case "quests": return <QuestLog />;
      case "leaderboard": return <Leaderboard />;
      case "suggestions": return <Suggestions username={profile.username} />;
      case "profile": return <Profile profile={profile} onSave={save} />;
      default: return <TrendingTicker />;
    }
  }

  return (
    <div className="app-shell">
      <TopBar night={night} onOpenMenu={() => setMenuOpen(true)} menuOpen={menuOpen} />
      <MarketEventBanner />
      <div className="app-main">{renderTab()}</div>
      <Confetti ref={confettiRef} />
      <Toasts />
      <MenuDrawer open={menuOpen} onClose={() => setMenuOpen(false)} tab={tab} onNavigate={navigate} sections={sections} />
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

import { createContext, useCallback, useContext, useReducer, useRef } from "react";
import { QUESTS_POOL } from "../data/assets.js";
import { useMarketSim } from "../hooks/useMarketSim.js";
import { useRealMarket } from "../hooks/useRealMarket.js";

const GameContext = createContext(null);

const initialState = {
  coins: 250,
  xp: 0,
  quests: QUESTS_POOL.map((q) => ({ ...q, progress: 0, claimed: false })),
  toasts: [],
};

function levelFromXp(xp) {
  return 1 + Math.floor(xp / 100);
}

let toastId = 0;

function reducer(state, action) {
  switch (action.type) {
    case "ADD_COINS":
      return { ...state, coins: Math.max(0, state.coins + action.amount) };

    case "ADD_XP":
      return { ...state, xp: state.xp + action.amount };

    case "QUEST_PROGRESS": {
      const quests = state.quests.map((q) =>
        q.type === action.questType && !q.claimed
          ? { ...q, progress: Math.min(q.target, q.progress + action.amount) }
          : q
      );
      return { ...state, quests };
    }

    case "CLAIM_QUEST": {
      const quest = state.quests.find((q) => q.id === action.id);
      if (!quest || quest.claimed || quest.progress < quest.target) return state;
      const quests = state.quests.map((q) => (q.id === action.id ? { ...q, claimed: true } : q));
      return {
        ...state,
        quests,
        coins: state.coins + quest.reward,
        xp: state.xp + quest.xp,
      };
    }

    case "PUSH_TOAST":
      return { ...state, toasts: [...state.toasts, { id: action.id, ...action.toast }] };

    case "POP_TOAST":
      return { ...state, toasts: state.toasts.filter((t) => t.id !== action.id) };

    default:
      return state;
  }
}

export function GameProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  const sim = useMarketSim();
  const { real, status } = useRealMarket();
  const market = { ...sim, real, realStatus: status };
  const confettiRef = useRef(null);

  const addCoins = useCallback((amount) => dispatch({ type: "ADD_COINS", amount }), []);
  const addXp = useCallback((amount) => dispatch({ type: "ADD_XP", amount }), []);
  const progressQuest = useCallback(
    (questType, amount = 1) => dispatch({ type: "QUEST_PROGRESS", questType, amount }),
    []
  );
  const claimQuest = useCallback((id) => dispatch({ type: "CLAIM_QUEST", id }), []);

  const pushToast = useCallback((toast) => {
    const id = ++toastId;
    dispatch({ type: "PUSH_TOAST", id, toast });
    setTimeout(() => dispatch({ type: "POP_TOAST", id }), 5000);
  }, []);

  const popToast = useCallback((id) => dispatch({ type: "POP_TOAST", id }), []);

  const fireConfetti = useCallback((opts) => {
    confettiRef.current?.(opts);
  }, []);

  const level = levelFromXp(state.xp);
  const xpIntoLevel = state.xp % 100;

  const value = {
    ...state,
    level,
    xpIntoLevel,
    market,
    confettiRef,
    fireConfetti,
    addCoins,
    addXp,
    progressQuest,
    claimQuest,
    pushToast,
    popToast,
  };

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
}

export function useGame() {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error("useGame must be used within GameProvider");
  return ctx;
}

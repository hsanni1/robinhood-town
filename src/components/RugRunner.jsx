import { useEffect, useRef, useState } from "react";
import { MousePointerClick, ShieldCheck, Zap } from "lucide-react";
import { useGame } from "../state/GameContext.jsx";
import { playCue } from "../lib/cue.js";

// Field / physics (px, ms)
const H = 380;
const GROUND = 40;
const PLAYER_X = 48;
const PLAYER_W = 40;
const PLAYER_H = 72;
const BEAR_W = 42;
const BEAR_H = 60;
const MAX_JUMPS = 2; // double jump
const BULL_W = 64;
const BULL_H = 48;
const TREASURE_W = 58;
const TREASURE_H = 46;
const GRAVITY = 0.0025;
const JUMP_V = 0.92;
const BULL_BONUS = 30;
const START_LIVES = 3;
const INVULN_MS = 1000;
const SHIELD_MS = 6000;
const SPEED_MAX = 0.95;
const GRASS_SPACING = 130;
const GRASS_COUNT = 9;
const BEST_KEY = "rht-runner-best";
const LOSE_IMAGES = ["/welp.webp", "/failed.webp"];

function loadBest() {
  if (typeof localStorage === "undefined") return 0;
  return Number(localStorage.getItem(BEST_KEY)) || 0;
}

function overlaps(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

export default function RugRunner() {
  const { addCoins, addXp, progressQuest, fireConfetti, pushToast, market } = useGame();
  const crashMode = market.event?.type === "crash";

  const eng = useRef(null);
  const stageRef = useRef(null);
  const rafRef = useRef(null);
  const [, force] = useState(0);
  const [phase, setPhase] = useState("ready");
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(START_LIVES);
  const [best, setBest] = useState(loadBest);
  const [loseImg, setLoseImg] = useState(LOSE_IMAGES[0]);

  function newEngine() {
    return {
      t: 0,
      speed: crashMode ? 0.42 : 0.32,
      player: { y: 0, vy: 0, onGround: true, jumps: 0 },
      entities: [],
      grass: Array.from({ length: GRASS_COUNT }, (_, i) => i * GRASS_SPACING - 40),
      grassSpan: GRASS_SPACING * GRASS_COUNT,
      spawnTimer: 700,
      score: 0,
      lives: START_LIVES,
      invulnUntil: 0,
      shieldUntil: 0,
      nextId: 1,
    };
  }

  function start() {
    eng.current = newEngine();
    setScore(0);
    setLives(START_LIVES);
    setPhase("playing");
  }

  function jump() {
    const e = eng.current;
    if (!e || phase !== "playing") return;
    // allow a second (double) jump in mid-air
    if (e.player.jumps < MAX_JUMPS) {
      e.player.vy = JUMP_V;
      e.player.onGround = false;
      e.player.jumps += 1;
    }
  }

  function endGame() {
    setPhase("over");
    setLoseImg(LOSE_IMAGES[(Math.random() * LOSE_IMAGES.length) | 0]);
    playCue("error");

    const s = Math.floor(eng.current?.score ?? score);
    const reward = Math.round(s / 4);
    if (reward > 0) addCoins(reward);
    if (s >= 300) {
      addXp(10);
      progressQuest("runner", s);
    }
    if (s > best) {
      setBest(s);
      try {
        localStorage.setItem(BEST_KEY, String(s));
      } catch {
        /* ignore */
      }
    }
    // submit to the shared leaderboard (uses your profile username)
    let name = "Anon";
    try {
      const p = JSON.parse(localStorage.getItem("rht-profile") || "{}");
      if (p.username) name = p.username;
    } catch {
      /* ignore */
    }
    const API = (import.meta.env.VITE_SUGGESTIONS_API ?? "/api") + "/scores";
    fetch(API, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, score: s }),
    }).catch(() => {});
    if (reward > 0) {
      fireConfetti();
      pushToast({ kind: "win", text: `+${reward} Robin Coins` });
    }
  }

  function tryAgain() {
    playCue("toggle");
    start();
  }

  useEffect(() => {
    function onKey(ev) {
      if (ev.code === "Space" || ev.code === "ArrowUp") {
        ev.preventDefault();
        if (phase === "playing") jump();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  useEffect(() => {
    if (phase !== "playing") return;
    let last = performance.now();
    function loop(now) {
      const dt = Math.min(40, now - last);
      last = now;
      const e = eng.current;
      e.t += dt;
      e.speed = Math.min(SPEED_MAX, e.speed + dt * 0.000019);
      e.spawnTimer -= dt;

      for (let i = 0; i < e.grass.length; i++) {
        e.grass[i] -= e.speed * 0.55 * dt;
        if (e.grass[i] < -60) e.grass[i] += e.grassSpan;
      }

      if (e.spawnTimer <= 0) {
        e.spawnTimer = (crashMode ? 600 : 760) + Math.random() * 640;
        const r = Math.random();
        const bearP = crashMode ? 0.62 : 0.5;
        let type = "bull";
        if (r < bearP) type = "bear";
        else if (r < bearP + 0.1) type = "treasure";
        e.entities.push({
          id: e.nextId++,
          type,
          // Spawn just off the right edge of the actual stage, not at a fixed
          // 700px. On a phone the stage is ~330px wide, so a hardcoded spawn
          // put obstacles far outside the visible area - same travel distance,
          // but the player only saw them for the last third of it. Scaling to
          // the measured width gives every screen the same reaction time.
          x: (stageRef.current?.clientWidth || 700) + 40,
          float: type === "bear" ? 0 : 12 + Math.random() * 118,
        });
      }

      const p = e.player;
      p.vy -= GRAVITY * dt;
      p.y += p.vy * dt;
      if (p.y <= 0) {
        p.y = 0;
        p.vy = 0;
        p.onGround = true;
        p.jumps = 0;
      }

      const shielded = e.t < e.shieldUntil;
      const invuln = e.t < e.invulnUntil;
      const pRect = { x: PLAYER_X + 7, y: H - GROUND - PLAYER_H - p.y + 5, w: PLAYER_W - 14, h: PLAYER_H - 12 };
      let livesChanged = false;
      for (const o of e.entities) {
        o.x -= e.speed * dt;
        if (o.type === "bear") {
          if (shielded || invuln || o.hitDone) continue;
          const r = { x: o.x + 7, y: H - GROUND - BEAR_H + 10, w: BEAR_W - 14, h: BEAR_H - 16 };
          if (overlaps(pRect, r)) {
            o.hitDone = true;
            e.lives -= 1;
            e.invulnUntil = e.t + INVULN_MS;
            livesChanged = true;
          }
        } else if (o.type === "bull" && !o.taken) {
          const r = { x: o.x + 8, y: H - GROUND - BULL_H - o.float + 4, w: BULL_W - 16, h: BULL_H - 8 };
          if (overlaps(pRect, r)) {
            o.taken = true;
            e.score += BULL_BONUS;
            playCue("chime");
          }
        } else if (o.type === "treasure" && !o.taken) {
          const r = { x: o.x + 8, y: H - GROUND - TREASURE_H - o.float + 4, w: TREASURE_W - 16, h: TREASURE_H - 8 };
          if (overlaps(pRect, r)) {
            o.taken = true;
            e.shieldUntil = e.t + SHIELD_MS;
            playCue("chime");
          }
        }
      }
      e.entities = e.entities.filter((o) => o.x > -90 && !o.taken);
      e.score += dt * 0.02;
      setScore(Math.floor(e.score));
      if (livesChanged) setLives(e.lives);

      if (e.lives <= 0) {
        endGame();
        return;
      }
      force((n) => n + 1);
      rafRef.current = requestAnimationFrame(loop);
    }
    rafRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, crashMode]);

  const e = eng.current;
  const playing = phase === "playing";
  const shielded = e && e.t < e.shieldUntil;
  const invuln = e && e.t < e.invulnUntil;
  const shieldLeft = shielded ? Math.ceil((e.shieldUntil - e.t) / 1000) : 0;
  const foxOpacity = !shielded && invuln && Math.floor(e.t / 110) % 2 === 0 ? 0.35 : 1;
  const foxFilter = shielded ? "drop-shadow(0 0 5px var(--rh-green)) drop-shadow(0 0 8px var(--rh-green))" : "none";

  const spriteFor = { bull: "/bull-sprite.png", treasure: "/treasure.png", bear: "/bear.webp" };
  const dimsFor = {
    bear: { w: BEAR_W, h: BEAR_H },
    bull: { w: BULL_W, h: BULL_H },
    treasure: { w: TREASURE_W, h: TREASURE_H },
  };

  return (
    <div className="nb-card" style={{ padding: 14 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
        <h2 style={{ fontSize: 16 }}>Rug Runner</h2>
        <span className="nb-badge nb-badge-green" style={{ fontSize: 10 }}>HIGH SCORE {Math.max(best, score)}</span>
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
        <div className="runner-lives" aria-label={`${lives} lives`}>
          {[0, 1, 2].map((i) => (
            <span key={i} className={`life-line ${i < lives ? "" : "life-line-empty"}`} />
          ))}
          {shielded && (
            <span className="nb-badge nb-badge-green" style={{ fontSize: 9, marginLeft: 6, display: "inline-flex", alignItems: "center", gap: 3 }}>
              <ShieldCheck size={11} strokeWidth={2.5} /> {shieldLeft}s
            </span>
          )}
        </div>
        <span className="mono dim" style={{ fontSize: 12, display: "inline-flex", alignItems: "center", gap: 4 }}>
          {crashMode ? <><Zap size={13} strokeWidth={2.5} /> crash speed!</> : `score ${score}`}
        </span>
      </div>

      <div ref={stageRef} className="runner-stage" onClick={playing ? jump : undefined} style={{ height: H }}>
        {(playing || phase === "over") && e?.grass.map((gx, i) => (
          <img key={"g" + i} src="/grass.png" alt="" aria-hidden="true" className="pixel"
            style={{ position: "absolute", left: gx, bottom: GROUND - 8, width: 44, height: 32, objectFit: "contain", opacity: 0.9 }} />
        ))}

        <div className="runner-ground" style={{ bottom: GROUND }} />

        {(playing || phase === "over") && e && (
          <img src="/robinhood-fox.png" alt="runner" className="pixel"
            style={{ position: "absolute", left: PLAYER_X, bottom: GROUND + e.player.y, width: PLAYER_W, height: PLAYER_H,
              objectFit: "contain", transform: "scaleX(-1)", opacity: foxOpacity, filter: foxFilter }} />
        )}

        {playing && e?.entities.map((o) => {
          const d = dimsFor[o.type];
          return (
            <img key={o.id} src={spriteFor[o.type]} alt={o.type} className="pixel"
              style={{ position: "absolute", left: o.x, bottom: GROUND + (o.type === "bear" ? 0 : o.float), width: d.w, height: d.h, objectFit: "contain" }} />
          );
        })}

        {phase === "ready" && (
          <div className="runner-overlay">
            <div className="nb-panel runner-howto">
              <div style={{ fontFamily: "var(--font-display)", fontSize: 17, marginBottom: 10 }}>HOW TO PLAY</div>
              <ul>
                <li>
                  <MousePointerClick size={22} strokeWidth={2.25} aria-hidden="true" />
                  <span>Tap or press <strong>Space</strong> to jump. Tap twice for a double jump.</span>
                </li>
                <li>
                  <img src="/bear.webp" alt="" aria-hidden="true" className="pixel" />
                  <span>Dodge the bears — each hit costs a life.</span>
                </li>
                <li>
                  <img src="/bull-sprite.png" alt="" aria-hidden="true" className="pixel" />
                  <span>Catch the bulls for bonus points.</span>
                </li>
                <li>
                  <img src="/treasure.png" alt="" aria-hidden="true" className="pixel" />
                  <span>Grab the frog treasure for a 6-second shield.</span>
                </li>
              </ul>
              <p className="dim" style={{ fontSize: 12.5, margin: "10px 0 0" }}>The longer you run, the more Robin Coins you earn.</p>
            </div>
            <button className="nb-btn nb-btn-primary" onClick={(ev) => { ev.stopPropagation(); start(); }}>Start</button>
          </div>
        )}

        {phase === "over" && (
          <div className="runner-overlay">
            <img src={loseImg} alt="you lost" className="pixel runner-lose-img" />
            <div style={{ fontFamily: "var(--font-display)", fontSize: 16 }}>SCORE {score}</div>
            <div className="dim" style={{ fontSize: 11, marginTop: -4 }}>High score {Math.max(best, score)}</div>
            <button className="nb-btn nb-btn-yellow" style={{ marginTop: 4 }} onClick={(ev) => { ev.stopPropagation(); tryAgain(); }}>
              Try Again
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

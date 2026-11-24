// Lyd og haptik på B-niveau (beslutning 16-11 og 23-11-2026):
// - "bump": et blødt bump, når en ny udgift lander på bordet (H1)
// - "tick": et let tik, når din betaling går igennem (H2: et skridt tættere på Wrapped)
//
// Regler:
// - Lydene laves i koden med Web Audio API. Der er ingen lydfiler (og ingen licenser).
// - Vibration med navigator.vibrate, hvor det findes (ikke i iOS Safari).
// - Intet afspilles, når lyd er slået fra (huskes i localStorage), eller når
//   enheden beder om reduceret bevægelse. Tokens i tokens.css sætter også
//   lydstyrke og vibration til 0 i "Reduceret".
// - Teksten på skærmen bærer altid informationen. Lyd og vibration er kun ekstra.

const STORAGE_KEY = "vipps-wrapped-lyd";
const CHANGE_EVENT = "vipps-wrapped-lyd";
const REDUCED_MOTION = "(prefers-reduced-motion: reduce)";

let audioContext = null;

// ---------- Til/fra ----------

function readStored() {
  try {
    return window.localStorage.getItem(STORAGE_KEY) !== "fra";
  } catch {
    // Fx privat vindue, hvor localStorage er spærret: lyd er til, men huskes ikke.
    return true;
  }
}

export function prefersReducedMotion() {
  return typeof window !== "undefined" && window.matchMedia?.(REDUCED_MOTION).matches;
}

// Lyden er kun til, når brugeren ikke har slået den fra, og enheden ikke beder om reduceret bevægelse.
export function getSoundSnapshot() {
  if (typeof window === "undefined") return "til";
  if (prefersReducedMotion()) return "reduceret";
  return readStored() ? "til" : "fra";
}

// Serveren kender hverken localStorage eller brugerens indstillinger.
export function getServerSoundSnapshot() {
  return "til";
}

export function subscribeSound(onChange) {
  const media = window.matchMedia?.(REDUCED_MOTION);
  window.addEventListener(CHANGE_EVENT, onChange);
  window.addEventListener("storage", onChange); // andre faner
  media?.addEventListener("change", onChange);
  return () => {
    window.removeEventListener(CHANGE_EVENT, onChange);
    window.removeEventListener("storage", onChange);
    media?.removeEventListener("change", onChange);
  };
}

export function setSoundOn(on) {
  try {
    window.localStorage.setItem(STORAGE_KEY, on ? "til" : "fra");
  } catch {
    // Kan ikke huskes. Knappen virker stadig i denne visning.
  }
  window.dispatchEvent(new Event(CHANGE_EVENT));
  // Kort tik som bekræftelse, når lyden slås til.
  if (on) play("tick");
}

function isOn() {
  return getSoundSnapshot() === "til";
}

// ---------- Tokens ----------

// Læser lyd-tokens fra tokens.css, så Figma og koden har samme værdier.
function token(name, fallback) {
  const value = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  const number = parseFloat(value);
  return Number.isFinite(number) ? number : fallback;
}

// ---------- Web Audio ----------

// Browsere tillader kun lyd efter et tryk. Kaldes derfor i klik-handlere
// (fx "Del udgiften"), så lyden kan spille, når udgiften lander bagefter.
export function unlockAudio() {
  if (typeof window === "undefined" || !isOn()) return null;
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  if (!AudioContext) return null;
  if (!audioContext) audioContext = new AudioContext();
  if (audioContext.state === "suspended") audioContext.resume();
  return audioContext;
}

// Blødt bump: en lav tone, der falder og dør hurtigt ud (som en ting, der lander på et bord).
function bump(ctx, volume, seconds) {
  const t = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = "sine";
  osc.frequency.setValueAtTime(190, t);
  osc.frequency.exponentialRampToValueAtTime(70, t + seconds);
  gain.gain.setValueAtTime(0.0001, t);
  gain.gain.exponentialRampToValueAtTime(volume, t + 0.008);
  gain.gain.exponentialRampToValueAtTime(0.0001, t + seconds);
  osc.connect(gain).connect(ctx.destination);
  osc.start(t);
  osc.stop(t + seconds + 0.02);
}

// Let tik: en kort, lys tone uden efterklang.
function tick(ctx, volume, seconds) {
  const t = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = "triangle";
  osc.frequency.setValueAtTime(1600, t);
  gain.gain.setValueAtTime(0.0001, t);
  gain.gain.exponentialRampToValueAtTime(volume * 0.6, t + 0.003);
  gain.gain.exponentialRampToValueAtTime(0.0001, t + seconds);
  osc.connect(gain).connect(ctx.destination);
  osc.start(t);
  osc.stop(t + seconds + 0.02);
}

const SOUNDS = {
  bump: { draw: bump, sound: "--sound-duration-bump", haptic: "--haptic-duration-bump", ms: 180, vibrate: 20 },
  tick: { draw: tick, sound: "--sound-duration-tick", haptic: "--haptic-duration-tick", ms: 60, vibrate: 10 },
};

// Spiller "bump" eller "tick" med vibration. Gør ingenting, hvis lyd er fra.
export function play(name) {
  if (typeof window === "undefined" || !isOn()) return;
  const sound = SOUNDS[name];
  if (!sound) return;

  const volume = token("--sound-volume", 0.2);
  const ms = token(sound.sound, sound.ms);
  const ctx = unlockAudio();
  if (ctx && volume > 0 && ms > 0) {
    try {
      sound.draw(ctx, volume, ms / 1000);
    } catch {
      // Lyd er ekstra. Fejler den, sker der intet andet.
    }
  }

  const vibrate = token(sound.haptic, sound.vibrate);
  if (vibrate > 0) navigator.vibrate?.(vibrate);
}

// Samme udgift må kun lande med lyd én gang, også hvis man går frem og tilbage.
const played = new Set();
export function playOnce(key, name) {
  if (played.has(key)) return;
  played.add(key);
  play(name);
}

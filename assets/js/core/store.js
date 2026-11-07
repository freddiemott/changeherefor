// Saved progress, kept in the player's own browser (localStorage).
// Nothing is sent anywhere. If storage is blocked (private browsing, etc.)
// the game still works; progress just isn't kept.
//
// Shape (bump VERSION and add a migration in load() if this changes):
// { v: 1, modes: { [modeId]: { runs, best, lastPlayed, stations: { [stationId]: {seen, right, clean} }, run } } }

const KEY = "changeherefor:progress";
const VERSION = 1;

function empty() { return { v: VERSION, modes: {} }; }

function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return empty();
    const data = JSON.parse(raw);
    if (!data || data.v !== VERSION) return empty(); // future: migrate older versions here
    return data;
  } catch { return empty(); }
}

let state = load();

function persist() {
  try { localStorage.setItem(KEY, JSON.stringify(state)); return true; } catch { return false; }
}

export function storageAvailable() {
  try { const k = KEY + ":test"; localStorage.setItem(k, "1"); localStorage.removeItem(k); return true; }
  catch { return false; }
}

export function getMode(id) {
  return state.modes[id] ||= { runs: 0, best: null, lastPlayed: null, stations: {}, run: null };
}

export function updateMode(id, fn) {
  fn(getMode(id));
  persist();
}

export function allModes() { return state.modes; }

export function resetMode(id) { delete state.modes[id]; persist(); }

export function resetAll() { state = empty(); persist(); }

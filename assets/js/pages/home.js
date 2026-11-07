// Home page: the rolling platform sign, the list of games and saved stats.
import { MODES } from "../modes/registry.js";
import * as store from "../core/store.js";

// ---------- the sign ----------
const SIGN = [
  ["the Piccadilly line", "#0019A8", false],
  ["Elizabeth line services", "#6950A1", true],
  ["the Victoria line", "#039BE5", false],
  ["the DLR", "#00AFAD", true],
  ["the Central line", "#DC241F", false],
  ["the Windrush line", "#EF4D3E", true],
  ["the Jubilee line", "#A0A5A9", false],
  ["the Bakerloo line", "#B26300", false],
  ["the Mildmay line", "#437EC1", true],
  ["the District line", "#007D32", false],
  ["the Northern line", "#000000", false],
  ["the Weaver line", "#972861", true],
  ["the Circle line", "#FFD329", false],
  ["the Metropolitan line", "#9B0056", false],
  ["the Lioness line", "#FAA61A", true],
  ["the Hammersmith & City line", "#F4A9BE", false],
  ["the Suffragette line", "#39B97A", true],
  ["the Waterloo & City line", "#76D0BD", false],
  ["the Liberty line", "#61686B", true],
  ["all stations in zones 1 and 2", "#F5F7F6", false],
];
const band = document.getElementById("sign-band");
const name = document.getElementById("sign-name");
let i = 0;
function show(k) {
  const [text, c, hollow] = SIGN[k];
  name.textContent = text;
  band.style.background = c;
  band.style.setProperty("--c", c);
  band.classList.toggle("hollow", hollow);
  name.classList.remove("swap"); void name.offsetWidth; name.classList.add("swap");
}
show(0);
if (!matchMedia("(prefers-reduced-motion: reduce)").matches) {
  setInterval(() => { if (!document.hidden) show(i = (i + 1) % SIGN.length); }, 2600);
}

// ---------- games ----------
const list = document.getElementById("modes");
list.innerHTML = MODES.map(m => {
  const saved = store.getMode(m.id);
  if (m.status !== "live") {
    return `<li class="mode soon"><div><h3>${m.title}</h3><p>${m.blurb}</p><span class="go">Coming soon</span></div></li>`;
  }
  const label = saved.run ? "Continue" : "Play";
  return `<li class="mode"><a href="play.html?mode=${m.id}"><h3>${m.title}</h3><p>${m.blurb}</p><span class="go">${label}</span></a></li>`;
}).join("");

// ---------- stats ----------
const all = store.allModes();
const played = Object.values(all).reduce((s, m) => s + (m.runs || 0), 0);
const statsEl = document.getElementById("stats");
const statsWrap = document.getElementById("stats-wrap");
if (played || Object.values(all).some(m => m.run)) {
  const ws = all["which-station"];
  const st = ws ? Object.values(ws.stations || {}) : [];
  const named = st.filter(s => s.right).length;
  statsEl.innerHTML = `
    <div><dt>Runs completed</dt><dd>${played}</dd></div>
    <div><dt>Best score, Which Station?</dt><dd>${ws?.best ?? "–"}</dd></div>
    <div><dt>Stations you've named</dt><dd>${named}</dd></div>`;
  statsWrap.hidden = false;
}
document.getElementById("reset").onclick = () => {
  if (confirm("Delete all your saved progress on this device? This can't be undone.")) { store.resetAll(); location.reload(); }
};

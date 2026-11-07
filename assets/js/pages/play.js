// play.html?mode=<id> — loads the data and hands the page to the chosen mode.
import { loadData } from "../core/data.js";
import * as store from "../core/store.js";
import { findMode } from "../modes/registry.js";

const root = document.getElementById("game");
const title = document.getElementById("mode-title");
const id = new URLSearchParams(location.search).get("mode") || "which-station";
const mode = findMode(id);

function fail(msg) {
  root.innerHTML = `<section class="panel start"><h2>${msg}</h2><p style="margin:0"><a href="index.html">Choose a game</a></p></section>`;
}

(async () => {
  if (!mode) return fail("That game doesn't exist.");
  title.textContent = mode.title;
  document.title = `${mode.title} · Change Here For…`;
  if (mode.status !== "live") return fail(`${mode.title} is coming soon.`);
  try {
    const [data, mod] = await Promise.all([loadData(), mode.load()]);
    mod.default.mount(root, { data, store, mode });
  } catch (e) {
    console.error(e);
    fail("The game couldn't load. Refresh the page to try again.");
  }
})();

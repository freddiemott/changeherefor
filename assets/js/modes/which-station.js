// Which Station? — the player sees the lines through a station and names it.
// Only stations whose exact set of lines is unique in zones 1–2 are used,
// so every question has exactly one right answer.

import { chip, swatch, crossingLines, shuffle, esc } from "../core/ui.js";
import { norm } from "../core/data.js";

const MAX_PER_STATION = 4;

// Hints and what they cost. "first" also reveals the letter pattern, so it costs two.
const HINTS = [
  { id: "lines", label: "Line names" },
  { id: "zone", label: "Zone" },
  { id: "letters", label: "Letter count" },
  { id: "first", label: "First letter" },
];

export default {
  mount(root, { data, store, mode }) {
    const { lineById, sortLines, byId, lookup, groups, stations, keysFor, fullName } = data;
    const pool = Object.values(groups).filter(g => g.length === 1).map(g => g[0].id);
    const lines = s => sortLines(s.lines).map(id => lineById[id]);

    let run;      // { order, idx, results: [{id, pts, hints, ok}], current: {hints, done, ok} }
    let q;        // current station

    const save = () => store.updateMode(mode.id, m => { m.run = run; m.lastPlayed = new Date().toISOString(); });

    // ---------- start screen ----------
    function showStart() {
      const m = store.getMode(mode.id);
      run = m.run && m.run.order?.every(id => byId[id]) ? m.run : null;
      const max = pool.length * MAX_PER_STATION;
      const best = m.best != null ? `Your best: ${m.best} of ${max} points over ${m.runs} run${m.runs === 1 ? "" : "s"}.` : "No completed runs yet.";
      let html = `<section class="panel start">
        <h2>${pool.length} stations, ${max} points</h2>
        <p style="margin:0">Each set of lines belongs to only one station in zones 1–2. Name it with no hints for 4 points; every hint costs a point.</p>
        <p class="quiet" style="margin:0">${best}</p>
        <div class="row">`;
      if (run) {
        const pts = run.results.reduce((s, r) => s + r.pts, 0);
        html += `<button class="primary" data-act="resume">Continue: station ${Math.min(run.idx + 1, run.order.length)} of ${run.order.length}, ${pts} pts</button>
                 <button data-act="new">Start a new run</button>`;
      } else {
        html += `<button class="primary" data-act="new">Start</button>`;
      }
      html += `</div>${store.storageAvailable() ? "" : `<p class="quiet" style="margin:0">Your browser is blocking storage, so progress won't be saved this time.</p>`}</section>`;
      root.innerHTML = html;
      root.querySelector('[data-act="new"]').onclick = () => {
        if (run && !confirm("Start again? Your current run will be lost.")) return;
        newRun();
      };
      const r = root.querySelector('[data-act="resume"]');
      if (r) r.onclick = () => { renderGame(); loadQuestion(); };
      root.querySelector("button.primary").focus();
    }

    function newRun() {
      run = { order: shuffle([...pool]), idx: 0, results: [], current: null };
      save(); renderGame(); loadQuestion();
    }

    // ---------- game screen ----------
    function renderGame() {
      root.innerHTML = `
        <div class="game-head">
          <p>Name the station these lines run through.</p>
          <div class="score"><span><b>Station</b><em id="pos"></em></span><span><b>Points</b><em id="pts"></em></span></div>
        </div>
        <div class="progress"><i id="prog"></i></div>
        <section class="panel">
          <div class="tile"><div class="count" id="nlines"></div><div id="map"></div></div>
          <div class="answer"><div class="name" id="name"></div><div class="pattern" id="pattern" hidden></div><div class="pills" id="pills"></div><p class="linknote" id="linknote" hidden></p></div>
          <div class="chips" id="chips" hidden></div>
        </section>
        <form class="guess" id="form" autocomplete="off">
          <input type="text" id="guess" list="station-list" placeholder="Type a station" aria-label="Your answer" enterkeyhint="go">
          <button class="primary" type="submit" id="check">Check</button>
        </form>
        <div class="fb" id="fb" aria-live="polite"></div>
        <div class="hints" id="hints"></div>
        <datalist id="station-list">${[...new Set(stations.map(s => s.name))].sort().map(n => `<option value="${esc(n)}">`).join("")}</datalist>
        <details class="key"><summary>Line key</summary><div class="keygrid">${data.lines.map(l => `<div>${swatch(l)}${esc(l.name)}</div>`).join("")}</div></details>`;
      root.querySelector("#form").addEventListener("submit", onGuess);
    }

    const $ = id => root.querySelector("#" + id);

    function loadQuestion() {
      if (run.idx >= run.order.length) return showEnd();
      q = byId[run.order[run.idx]];
      run.current ||= { hints: [], done: false, ok: false };
      const ls = lines(q);
      $("map").innerHTML = crossingLines(ls);
      $("nlines").textContent = ls.length === 1 ? "1 line" : `${ls.length} lines`;
      $("chips").innerHTML = ls.map(chip).join("");
      $("fb").className = "fb"; $("fb").textContent = "";
      $("guess").value = "";
      renderHints(); renderAnswer(); tally();
      if (run.current.done) lockQuestion(); else { $("guess").disabled = false; $("check").disabled = false; $("guess").focus({ preventScroll: true }); }
    }

    function renderHints() {
      const h = run.current.hints;
      $("hints").innerHTML = HINTS.map(x => `<button type="button" data-h="${x.id}" ${h.includes(x.id) ? "disabled" : ""}>${x.label} <span class="cost">−${x.id === "first" && !h.includes("letters") ? 2 : 1}</span></button>`).join("")
        + `<button type="button" data-h="reveal">Reveal</button><button type="button" class="next" data-h="next" disabled>Next</button>`;
      $("hints").querySelectorAll("button").forEach(b => b.onclick = () => onHint(b.dataset.h));
    }

    function points() {
      if (!run.current.ok) return 0;
      return Math.max(1, MAX_PER_STATION - run.current.hints.length);
    }

    function renderAnswer() {
      const c = run.current, h = c.hints;
      if (c.done) {
        $("name").innerHTML = esc(q.name) + (q.qualifier ? `<small>The ${esc(q.qualifier)} station</small>` : "");
        $("pattern").hidden = true;
        const linked = (q.linked || []).map(id => byId[id]).filter(Boolean);
        $("linknote").hidden = !linked.length;
        $("linknote").textContent = linked.length ? `${linked.map(fullName).join(", ")} counts as a separate station.` : "";
      } else {
        $("name").innerHTML = `<span class="blank">? ? ?</span>`;
        $("linknote").hidden = true;
        if (h.includes("letters") || h.includes("first")) {
          $("pattern").hidden = false;
          $("pattern").textContent = q.name.split(" ").map((w, i) => [...w].map((ch, j) => /[A-Za-z]/.test(ch) ? ((h.includes("first") && i === 0 && j === 0) ? ch.toUpperCase() : "_") : ch).join("")).join("   ");
        } else $("pattern").hidden = true;
      }
      const pills = [];
      if (h.includes("zone") || c.done) pills.push(`Zone ${q.zone}`);
      if (h.includes("letters") && !c.done) pills.push(`${(q.name.match(/[A-Za-z]/g) || []).length} letters`);
      $("pills").innerHTML = pills.map(p => `<span class="pill">${esc(p)}</span>`).join("");
      $("chips").hidden = !(h.includes("lines") || c.done);
    }

    function tally() {
      const done = run.results.length;
      $("pos").textContent = `${Math.min(run.idx + 1, run.order.length)}/${run.order.length}`;
      $("pts").textContent = run.results.reduce((s, r) => s + r.pts, 0);
      $("prog").style.width = (done / run.order.length * 100) + "%";
    }

    function onHint(h) {
      const c = run.current;
      if (h === "next") { run.idx++; run.current = null; save(); return loadQuestion(); }
      if (c.done) return;
      if (h === "reveal") return finish(false, "Revealed. No points for this one.");
      if (!c.hints.includes(h)) c.hints.push(h);
      if (h === "first" && !c.hints.includes("letters")) c.hints.push("letters");
      save(); renderHints(); renderAnswer();
    }

    function finish(ok, msg) {
      const c = run.current;
      c.done = true; c.ok = ok;
      const pts = points();
      run.results.push({ id: q.id, pts, hints: c.hints.length, ok });
      store.updateMode(mode.id, m => {
        const st = m.stations[q.id] ||= { seen: 0, right: 0, clean: 0 };
        st.seen++; if (ok) st.right++; if (ok && !c.hints.length) st.clean++;
      });
      save();
      $("fb").className = ok ? "fb good" : "fb bad"; $("fb").textContent = msg;
      renderAnswer(); tally(); lockQuestion();
    }

    function lockQuestion() {
      $("guess").disabled = true; $("check").disabled = true;
      $("hints").querySelectorAll("button").forEach(b => b.disabled = b.dataset.h !== "next");
      const nx = $("hints").querySelector('[data-h="next"]');
      nx.textContent = run.idx === run.order.length - 1 ? "See results" : "Next";
      nx.focus({ preventScroll: true });
    }

    function onGuess(e) {
      e.preventDefault();
      if (run.current.done) return;
      const g = norm($("guess").value);
      if (!g) return;
      const fb = $("fb");
      if (keysFor(q).includes(g)) {
        const p = Math.max(1, MAX_PER_STATION - run.current.hints.length);
        return finish(true, run.current.hints.length ? `Correct. ${p} point${p > 1 ? "s" : ""}.` : "Correct, no hints. 4 points.");
      }
      fb.className = "fb bad";
      const matches = lookup[g];
      if (matches) {
        fb.innerHTML = matches.map(s => `${esc(fullName(s))} has ${lines(s).map(chip).join("")}`).join("<br>");
      } else {
        fb.textContent = "That's not a zone 1–2 station. Pick one from the list.";
      }
      const input = $("guess");
      input.classList.remove("shake"); void input.offsetWidth; input.classList.add("shake"); input.select();
    }

    // ---------- end screen ----------
    function showEnd() {
      const total = run.results.reduce((s, r) => s + r.pts, 0);
      const max = run.order.length * MAX_PER_STATION;
      const right = run.results.filter(r => r.ok).length;
      const clean = run.results.filter(r => r.ok && !r.hints).length;
      let isBest = false;
      store.updateMode(mode.id, m => {
        m.runs++;
        if (m.best == null || total > m.best) { m.best = total; isBest = true; }
        m.run = null;
      });
      const finished = run; run = null;
      root.innerHTML = `<section class="panel end">
        <h2>${total} of ${max} points${isBest ? " — a new best" : ""}</h2>
        <p style="margin:0">${right} of ${finished.order.length} named, ${clean} with no hints.</p>
        <ul class="results">${finished.results.map(r => {
          const s = byId[r.id];
          const tag = r.ok ? `<span class="tag ${r.hints ? "h" : "g"}">${r.pts} pt${r.pts > 1 ? "s" : ""}</span>` : `<span class="tag r">revealed</span>`;
          return `<li><span>${esc(fullName(s))}</span>${tag}</li>`;
        }).join("")}</ul>
        <div class="row"><button class="primary" id="again">Play again</button><a class="btn" href="index.html">Back to the start</a></div>
      </section>`;
      root.querySelector("#again").onclick = newRun;
      root.querySelector("#again").focus();
    }

    showStart();
  },
};

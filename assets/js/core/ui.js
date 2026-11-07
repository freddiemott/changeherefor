// Small shared drawing helpers: line swatches, chips and the crossing-lines graphic.

export const esc = s => String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

// Underground lines are drawn solid; Elizabeth line, DLR and Overground lines hollow.
export const isHollow = line => line.type !== "underground";

export function swatch(line) {
  return `<span class="sw${isHollow(line) ? " hollow" : ""}" style="--c:${line.colour};background:${line.colour}"></span>`;
}

export function chip(line) {
  return `<span class="chip">${swatch(line)}${esc(line.name)}</span>`;
}

// Lines crossing through a single interchange circle.
export function crossingLines(lines) {
  const cx = 200, cy = 130, R = 190, n = lines.length;
  let out = "";
  lines.forEach((l, i) => {
    const a = (n === 1 ? 0 : (i / n) * Math.PI) + Math.PI / 12;
    const dx = Math.cos(a) * R, dy = Math.sin(a) * R;
    const xy = `x1="${(cx - dx).toFixed(1)}" y1="${(cy - dy).toFixed(1)}" x2="${(cx + dx).toFixed(1)}" y2="${(cy + dy).toFixed(1)}"`;
    out += `<line ${xy} stroke="${l.colour}" stroke-width="16"/>`;
    if (isHollow(l)) out += `<line ${xy} stroke="#FBFCFB" stroke-width="6"/>`;
  });
  out += `<circle cx="${cx}" cy="${cy}" r="17" fill="#FFFFFF" stroke="#15181D" stroke-width="5"/>`;
  return `<svg viewBox="0 0 400 260" role="img" aria-label="${n} line${n === 1 ? "" : "s"} through the mystery station">${out}</svg>`;
}

export function shuffle(a) {
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}

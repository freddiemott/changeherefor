// Loads the line and station data once and builds the lookups every mode needs.
// Data lives in /data/*.json — edit those files to change stations or lines.

export const norm = s => s.toLowerCase()
  .replace(/&/g, " and ")
  .replace(/['’.]/g, "")
  .replace(/[,()\-]/g, " ")
  .replace(/\bst\b/g, "saint")
  .replace(/\s+/g, " ")
  .trim();

let cache;

export async function loadData(base = "") {
  if (cache) return cache;
  const [linesRes, stationsRes] = await Promise.all([
    fetch(base + "data/lines.json"),
    fetch(base + "data/stations.json"),
  ]);
  if (!linesRes.ok || !stationsRes.ok) throw new Error("Couldn't load the station data.");
  const { lines } = await linesRes.json();
  const { stations } = await stationsRes.json();

  const lineById = Object.fromEntries(lines.map(l => [l.id, l]));
  const order = lines.map(l => l.id);
  const sortLines = ids => order.filter(id => ids.includes(id));
  const byId = Object.fromEntries(stations.map(s => [s.id, s]));

  // Name the player sees, and the full name with qualifier where two stations share a name.
  const displayName = s => s.name;
  const fullName = s => s.qualifier ? `${s.name} (${s.qualifier})` : s.name;
  const keysFor = s => [norm(s.name), norm(fullName(s)), ...(s.aliases || []).map(norm)];

  // normalised guess -> stations it could mean
  const lookup = {};
  for (const s of stations) for (const k of keysFor(s)) (lookup[k] ||= []).includes(s) || lookup[k].push(s);

  // stations grouped by their exact set of lines
  const groups = {};
  for (const s of stations) (groups[sortLines(s.lines).join("+")] ||= []).push(s);

  cache = { lines, lineById, order, sortLines, stations, byId, lookup, groups, keysFor, displayName, fullName };
  return cache;
}

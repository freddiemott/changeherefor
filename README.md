# Change Here For…

A quiz game about London's stations and lines. Plain HTML, CSS and JavaScript, with no build step. Hosted on Cloudflare Pages from this GitHub repo.

## What's where

| Path | What it is |
|---|---|
| `index.html` | Home page: the platform sign, list of games, saved stats |
| `play.html` | Runs any game: `play.html?mode=which-station` |
| `how-to-play.html`, `about.html`, `privacy.html`, `404.html` | Static pages |
| `data/stations.json` | Every station in zones 1–2: name, lines, zone, linked stations |
| `data/lines.json` | Line names, colours and type (underground / rail / overground) |
| `assets/js/core/` | Shared code: data loading, saved progress, drawing |
| `assets/js/modes/` | One file per game, plus `registry.js` listing them all |
| `assets/css/site.css` | All styles |
| `assets/fonts/` | Overpass, self-hosted (SIL Open Font Licence) |
| `_headers` | Cloudflare caching and security headers |

## Editing station data

Edit `data/stations.json`, commit, and the site updates within a minute or two. Each station looks like this:

```json
{ "id": "bank", "name": "Bank", "lines": ["central", "northern", "waterloo-city", "dlr"], "zone": "1", "linked": ["monument"] }
```

- `qualifier` splits two stations with the same name, e.g. Edgware Road (Bakerloo).
- `linked` lists nearby stations with their own name that count separately.
- `aliases` lists other accepted spellings.
- Which Station? works out the unique-line stations itself, so there's no list to maintain.

## Adding a game mode

1. Create `assets/js/modes/<id>.js` exporting `default { mount(root, { data, store, mode }) }`.
2. In `assets/js/modes/registry.js`, set that mode's `status` to `"live"` and add `load: () => import("./<id>.js")`.

It then shows on the home page and plays at `play.html?mode=<id>`. Use `store.getMode(id)` and `store.updateMode(id, fn)` for saved progress.

## Testing locally

Browsers block the data files when you open the HTML directly. Run a local server from this folder instead:

```
python3 -m http.server 8000
```

Then go to http://localhost:8000.

## Not affiliated with TfL

Don't add the roundel, the Tube map, the Johnston/New Johnston font, or "TfL"/"Underground"/"Oyster"/"Mind the Gap" in names or logos.

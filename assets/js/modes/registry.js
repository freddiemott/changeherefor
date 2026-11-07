// Every game mode is listed here. To add a mode:
//   1. write assets/js/modes/<id>.js exporting default { mount(root, ctx) }
//   2. add an entry below with status "live" and a load() import
// It then appears on the home page and plays at play.html?mode=<id>.

export const MODES = [
  {
    id: "which-station",
    title: "Which Station?",
    blurb: "You see the lines. Name the only zone 1–2 station they all serve.",
    status: "live",
    load: () => import("./which-station.js"),
  },
  {
    id: "name-the-lines",
    title: "Name the Lines",
    blurb: "You see the station. Pick every line that stops there.",
    status: "soon",
  },
  {
    id: "shared-lines",
    title: "Shared Lines",
    blurb: "Several stations share the same lines. Name them all.",
    status: "soon",
  },
];

export const findMode = id => MODES.find(m => m.id === id);

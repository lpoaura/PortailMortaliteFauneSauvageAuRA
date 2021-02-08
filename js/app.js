import graph from "./app.charts.js";
import map from "./app.map.js";

$(document).foundation();

document.addEventListener("DOMContentLoaded", () => {
  graph();
  map();
});

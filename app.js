(function () {
  const STATES = window.STATES, VARS = window.VARIABLES;
  const names = Object.keys(STATES);
  const palette = { Alaska: "#3b7dd8", California: "#d9534f", Hawaii: "#1fa37a", Oregon: "#e69f00", Washington: "#8e5bd0" };
  const fmt = (k, v) => (v > 0 && k === "temp" ? "+" : "") + v + " " + VARS[k].unit;

  /* ---------- Tabs ---------- */
  const tabs = ["home", "map", "about"];
  let map, mapReady = false;
  function show(name) {
    tabs.forEach(t => {
      const sel = t === name;
      document.getElementById("tab-" + t).setAttribute("aria-selected", sel);
      document.getElementById("panel-" + t).hidden = !sel;
    });
    if (name === "map") { initMap(); setTimeout(() => map.invalidateSize(), 50); }
    try { history.replaceState(null, "", "#" + name); } catch (e) {}
  }
  tabs.forEach((t, i) => {
    const b = document.getElementById("tab-" + t);
    b.addEventListener("click", () => show(t));
    b.addEventListener("keydown", e => {
      if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
        const n = tabs[(i + (e.key === "ArrowRight" ? 1 : tabs.length - 1)) % tabs.length];
        show(n); document.getElementById("tab-" + n).focus();
      }
    });
  });

  /* ---------- Helpers ---------- */
  function mix(c1, c2, t) {
    const p = c => [1, 3, 5].map(i => parseInt(c.slice(i, i + 2), 16));
    const a = p(c1), b = p(c2);
    return "#" + a.map((v, i) => Math.round(v + (b[i] - v) * t).toString(16).padStart(2, "0")).join("");
  }
  function colorFor(key, state) {
    const vals = Object.values(VARS[key].values), lo = Math.min(...vals), hi = Math.max(...vals);
    const t = hi === lo ? 0.5 : (VARS[key].values[state] - lo) / (hi - lo);
    return mix(VARS[key].color[0], VARS[key].color[1], t);
  }
  function fill(sel, items) { sel.innerHTML = items.map(([v, l]) => `<option value="${v}">${l}</option>`).join(""); }

  /* ---------- Home ---------- */
  const kpiBox = document.getElementById("kpis");
  Object.keys(VARS).forEach(k => {
    const v = VARS[k], entries = Object.entries(v.values).sort((a, b) => b[1] - a[1]);
    const top = entries[0];
    kpiBox.insertAdjacentHTML("beforeend",
      `<div class="kpi"><div class="k-label">${v.label}</div><div class="k-val">${fmt(k, top[1])}</div><div class="k-note">Highest: ${top[0]} (sample)</div></div>`);
  });

  const gridColor = getComputedStyle(document.documentElement).getPropertyValue("--border");
  Chart.defaults.color = getComputedStyle(document.body).color;
  Chart.defaults.borderColor = gridColor;
  Chart.defaults.maintainAspectRatio = false;

  new Chart(document.getElementById("chart-trend"), {
    type: "line",
    data: { labels: TREND.years, datasets: names.map(s => ({ label: s, data: TREND.series[s], borderColor: palette[s], backgroundColor: palette[s], borderWidth: 2, pointRadius: 0, tension: .3 })) },
    options: { plugins: { legend: { position: "bottom" } }, scales: { y: { title: { display: true, text: "°C" } } } }
  });

  const homeVar = document.getElementById("home-var");
  fill(homeVar, Object.keys(VARS).map(k => [k, VARS[k].label]));
  const bar = new Chart(document.getElementById("chart-bar"), {
    type: "bar",
    data: { labels: names, datasets: [{ data: [], backgroundColor: names.map(s => palette[s]) }] },
    options: { plugins: { legend: { display: false } } }
  });
  function updateBar() {
    const k = homeVar.value;
    bar.data.datasets[0].data = names.map(s => VARS[k].values[s]);
    bar.options.scales = { y: { title: { display: true, text: VARS[k].unit } } };
    bar.update();
  }
  homeVar.addEventListener("change", updateBar); updateBar();

  const homeState = document.getElementById("home-state");
  fill(homeState, names.map(s => [s, s]));
  const keys = Object.keys(VARS);
  function norm(k, s) { // 0-100 relative across the five states
    const vals = Object.values(VARS[k].values), lo = Math.min(...vals), hi = Math.max(...vals);
    return hi === lo ? 50 : Math.round(((VARS[k].values[s] - lo) / (hi - lo)) * 100);
  }
  const radar = new Chart(document.getElementById("chart-radar"), {
    type: "radar",
    data: { labels: keys.map(k => VARS[k].label), datasets: [{ label: "", data: [], fill: true }] },
    options: { plugins: { legend: { display: false } }, scales: { r: { min: 0, max: 100, ticks: { display: false } } } }
  });
  function updateRadar() {
    const s = homeState.value, d = radar.data.datasets[0];
    d.label = s; d.data = keys.map(k => norm(k, s));
    d.borderColor = palette[s]; d.backgroundColor = palette[s] + "44";
    radar.update();
  }
  homeState.addEventListener("change", updateRadar); updateRadar();

  new Chart(document.getElementById("chart-season"), {
    type: "line",
    data: { labels: SEASONAL.months, datasets: names.map(s => ({ label: s, data: SEASONAL.series[s], borderColor: palette[s], backgroundColor: palette[s], borderWidth: 2, pointRadius: 2, tension: .3 })) },
    options: { plugins: { legend: { position: "bottom" } } }
  });

  /* ---------- Map ---------- */
  const mapVar = document.getElementById("map-var");
  fill(mapVar, Object.keys(VARS).map(k => [k, VARS[k].label]));
  let geoLayer = null, markers = {}, selected = null;

  function initMap() {
    if (mapReady) return; mapReady = true;
    map = L.map("map", { worldCopyJump: true }).setView([46, -135], 3);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", { maxZoom: 10, attribution: "&copy; OpenStreetMap contributors" }).addTo(map);
    names.forEach(s => {
      markers[s] = L.circleMarker(STATES[s].center, { radius: 12, weight: 2, color: "#222", fillOpacity: .9 }).addTo(map)
        .bindTooltip(s).on("click", () => selectState(s));
    });
    map.fitBounds(L.latLngBounds(names.map(s => STATES[s].center)).pad(.4));
    fetch("https://raw.githubusercontent.com/PublicaMundi/MappingAPI/master/data/geojson/us-states.json")
      .then(r => r.json())
      .then(g => {
        g.features = g.features.filter(f => names.includes(f.properties.name));
        geoLayer = L.geoJSON(g, {
          style: f => ({ color: "#333", weight: 1, fillColor: colorFor(mapVar.value, f.properties.name), fillOpacity: .75 }),
          onEachFeature: (f, l) => l.on("click", () => selectState(f.properties.name))
        }).addTo(map);
        geoLayer.bringToBack();
      })
      .catch(() => {});
    updateMap();
  }

  function updateMap() {
    const k = mapVar.value, v = VARS[k];
    document.getElementById("var-desc").textContent = v.desc + " (placeholder values)";
    names.forEach(s => markers[s] && markers[s].setStyle({ fillColor: colorFor(k, s) }));
    if (geoLayer) geoLayer.setStyle(f => ({ color: "#333", weight: 1, fillColor: colorFor(k, f.properties.name), fillOpacity: .75 }));
    const vals = Object.values(v.values);
    document.getElementById("legend").innerHTML =
      `<div class="bar" style="background:linear-gradient(90deg,${v.color[0]},${v.color[1]})"></div>
       <div class="ends"><span>${Math.min(...vals)} ${v.unit}</span><span>${Math.max(...vals)} ${v.unit}</span></div>`;
    const ranked = names.slice().sort((a, b) => v.values[b] - v.values[a]);
    document.getElementById("ranking").innerHTML = ranked.map(s =>
      `<li><button data-s="${s}" class="${s === selected ? "active" : ""}"><span>${s}</span><strong>${fmt(k, v.values[s])}</strong></button></li>`).join("");
    document.querySelectorAll("#ranking button").forEach(b => b.addEventListener("click", () => selectState(b.dataset.s)));
  }

  function selectState(s) {
    selected = s;
    map.setView(STATES[s].center, STATES[s].zoom);
    document.getElementById("state-detail").innerHTML =
      `<h3>${s}</h3><table>` + Object.keys(VARS).map(k => `<tr><td>${VARS[k].label}</td><td>${fmt(k, VARS[k].values[s])}</td></tr>`).join("") + `</table>
       <p class="sub">Placeholder values; see About &rarr; Guardrails.</p>`;
    updateMap();
  }
  mapVar.addEventListener("change", updateMap);

  /* ---------- Initial tab from URL hash ---------- */
  const h = location.hash.replace("#", "");
  show(tabs.includes(h) ? h : "home");
})();

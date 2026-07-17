const DATA_URL = "./data/processed/round10_dashboard_data.json";

const METRICS = {
  right_direction_pct: {
    label: "Country going in the right direction",
    short: "Right direction",
    polarity: "positive",
    unit: "%",
  },
  wrong_direction_pct: {
    label: "Country going in the wrong direction",
    short: "Wrong direction",
    polarity: "negative",
    unit: "%",
  },
  economy_good_pct: {
    label: "Economy described as good",
    short: "Economy good",
    polarity: "positive",
    unit: "%",
  },
  economy_bad_pct: {
    label: "Economy described as bad",
    short: "Economy bad",
    polarity: "negative",
    unit: "%",
  },
  living_conditions_good_pct: {
    label: "Living conditions described as good",
    short: "Living good",
    polarity: "positive",
    unit: "%",
  },
  living_conditions_bad_pct: {
    label: "Living conditions described as bad",
    short: "Living bad",
    polarity: "negative",
    unit: "%",
  },
  mobile_phone_access_yes_pct: {
    label: "Respondent has mobile phone access",
    short: "Mobile access",
    polarity: "positive",
    unit: "%",
  },
};

const COORDS = {
  ANG: [17.9, -11.2],
  BEN: [2.3, 9.3],
  BOT: [24.7, -22.2],
  CAM: [12.4, 5.6],
  CBZ: [15.8, -0.2],
  CDI: [-5.5, 7.5],
  CVE: [-24.0, 16.0],
  GAB: [11.6, -0.8],
  GAM: [-15.3, 13.4],
  GHA: [-1.0, 7.9],
  GUI: [-10.9, 10.4],
  LES: [28.2, -29.6],
  LIB: [-9.4, 6.4],
  MAD: [46.9, -18.8],
  MAU: [57.5, -20.2],
  MLI: [-3.9, 17.5],
  MLW: [34.3, -13.2],
  MOR: [-7.1, 31.8],
  MTA: [-10.9, 20.3],
  NAM: [18.5, -22.9],
  NIG: [8.7, 9.1],
  STP: [6.6, 0.2],
  TOG: [1.1, 8.6],
  TUN: [9.0, 34.0],
  ZAM: [27.8, -13.1],
  ZIM: [29.2, -19.0],
};

const AFRICA_OUTLINE =
  "M345 34 L405 42 L463 86 L509 143 L541 214 L530 279 L557 333 L538 396 L489 438 L468 499 L416 484 L376 421 L339 405 L314 346 L278 332 L241 283 L202 261 L186 202 L205 143 L240 93 L291 72 Z";

const state = {
  metric: "right_direction_pct",
  country: "Malawi",
  compare: "Nigeria",
  segment: "Gender",
  search: "",
};

let store = {
  countries: [],
  segments: [],
  regions: [],
  metadata: [],
};

const globe = {
  canvas: document.getElementById("globeCanvas"),
  ctx: null,
  currentLon: 24,
  currentLat: 0,
  targetLon: 24,
  targetLat: 0,
  raf: null,
};

const els = {
  metricSelect: document.getElementById("metricSelect"),
  countrySelect: document.getElementById("countrySelect"),
  compareSelect: document.getElementById("compareSelect"),
  segmentSelect: document.getElementById("segmentSelect"),
  searchInput: document.getElementById("searchInput"),
  resetBtn: document.getElementById("resetBtn"),
  downloadCsvBtn: document.getElementById("downloadCsvBtn"),
  downloadMapBtn: document.getElementById("downloadMapBtn"),
  printReportBtn: document.getElementById("printReportBtn"),
  statusCountryCount: document.getElementById("statusCountryCount"),
  activeFilters: document.getElementById("activeFilters"),
  kpiRow: document.getElementById("kpiRow"),
  mapContainer: document.getElementById("mapContainer"),
  mapLegend: document.getElementById("mapLegend"),
  rankingTitle: document.getElementById("rankingTitle"),
  rankingCount: document.getElementById("rankingCount"),
  rankingList: document.getElementById("rankingList"),
  profileTitle: document.getElementById("profileTitle"),
  profileMeta: document.getElementById("profileMeta"),
  profileBars: document.getElementById("profileBars"),
  compareTitle: document.getElementById("compareTitle"),
  compareBars: document.getElementById("compareBars"),
  segmentTitle: document.getElementById("segmentTitle"),
  segmentBars: document.getElementById("segmentBars"),
  regionTitle: document.getElementById("regionTitle"),
  regionMetricHead: document.getElementById("regionMetricHead"),
  regionRows: document.getElementById("regionRows"),
  insights: document.getElementById("insights"),
  toast: document.getElementById("toast"),
  globeCountry: document.getElementById("globeCountry"),
  globeMeta: document.getElementById("globeMeta"),
  distributionChart: document.getElementById("distributionChart"),
  scatterChart: document.getElementById("scatterChart"),
  storyMetric: document.getElementById("storyMetric"),
  storyRank: document.getElementById("storyRank"),
  storyDelta: document.getElementById("storyDelta"),
};

init();

async function init() {
  bindEvents();
  try {
    const response = await fetch(DATA_URL);
    if (!response.ok) throw new Error(`Data request failed: ${response.status}`);
    const data = await response.json();
    store = {
      countries: data.countries || [],
      segments: data.segments || [],
      regions: data.regions || [],
      metadata: data.metadata || [],
    };
    populateControls();
    render();
    showToast("Dashboard data loaded");
  } catch (error) {
    renderError(error);
  }
}

function bindEvents() {
  els.metricSelect.addEventListener("change", (event) => {
    state.metric = event.target.value;
    render();
  });

  els.countrySelect.addEventListener("change", (event) => {
    state.country = event.target.value;
    if (state.compare === state.country) {
      state.compare = getFallbackCompare(state.country);
      els.compareSelect.value = state.compare;
    }
    render();
  });

  els.compareSelect.addEventListener("change", (event) => {
    state.compare = event.target.value;
    render();
  });

  els.segmentSelect.addEventListener("change", (event) => {
    state.segment = event.target.value;
    render();
  });

  els.searchInput.addEventListener("input", (event) => {
    state.search = event.target.value.trim();
    const exactOrSingle = getFilteredCountries();
    if (exactOrSingle.length === 1) {
      state.country = exactOrSingle[0].country;
      if (state.compare === state.country) state.compare = getFallbackCompare(state.country);
      syncControls();
    }
    render();
  });

  els.resetBtn.addEventListener("click", () => {
    state.metric = "right_direction_pct";
    state.country = "Malawi";
    state.compare = "Nigeria";
    state.segment = "Gender";
    state.search = "";
    syncControls();
    render();
  });

  els.downloadCsvBtn.addEventListener("click", downloadCurrentCsv);
  els.downloadMapBtn.addEventListener("click", downloadMapSvg);
  els.printReportBtn.addEventListener("click", () => window.print());
}

function populateControls() {
  els.metricSelect.innerHTML = Object.entries(METRICS)
    .map(([key, metric]) => `<option value="${key}">${metric.label}</option>`)
    .join("");

  const countryOptions = store.countries
    .slice()
    .sort((a, b) => a.country.localeCompare(b.country))
    .map((row) => `<option value="${escapeAttr(row.country)}">${escapeHtml(displayCountry(row.country))}</option>`)
    .join("");

  els.countrySelect.innerHTML = countryOptions;
  els.compareSelect.innerHTML = countryOptions;
  syncControls();
  els.statusCountryCount.textContent = `${store.countries.length} countries loaded`;
}

function syncControls() {
  els.metricSelect.value = state.metric;
  els.countrySelect.value = state.country;
  els.compareSelect.value = state.compare;
  els.segmentSelect.value = state.segment;
  els.searchInput.value = state.search;
}

function render() {
  if (!store.countries.length) return;
  const filtered = getFilteredCountries();
  const focus = getCountry(state.country) || filtered[0] || store.countries[0];
  const compare = getCountry(state.compare) || getCountry(getFallbackCompare(focus.country));

  updateGlobeTarget(focus);
  renderStoryStrip(filtered, focus, compare);
  renderActiveFilters(filtered);
  renderKpis(filtered, focus);
  renderMap(filtered, focus);
  renderRanking(filtered);
  renderDistribution(filtered, focus);
  renderScatter(focus);
  renderProfile(focus);
  renderComparison(focus, compare);
  renderSegments(focus);
  renderRegions(focus);
  renderInsights(filtered, focus, compare);
}

function getFilteredCountries() {
  const term = state.search.toLowerCase();
  return store.countries
    .filter((row) => !term || row.country.toLowerCase().includes(term) || row.country_code.toLowerCase().includes(term))
    .sort((a, b) => Number(b[state.metric] || -1) - Number(a[state.metric] || -1));
}

function getCountry(name) {
  return store.countries.find((row) => row.country === name);
}

function getFallbackCompare(country) {
  const fallback = store.countries.find((row) => row.country !== country && row.country === "Ghana");
  return fallback?.country || store.countries.find((row) => row.country !== country)?.country || country;
}

function renderStoryStrip(rows, focus, compare) {
  const metric = METRICS[state.metric];
  const ranking = store.countries.slice().sort((a, b) => Number(b[state.metric] || 0) - Number(a[state.metric] || 0));
  const rank = ranking.findIndex((row) => row.country === focus.country) + 1;
  const delta = Math.abs(Number(focus[state.metric] || 0) - Number(compare[state.metric] || 0));

  els.storyMetric.textContent = metric.short;
  els.storyRank.textContent = rank > 0 ? `${rank}/${ranking.length}` : "-";
  els.storyDelta.textContent = `${delta.toFixed(1)} pts`;
}

function renderActiveFilters(filtered) {
  const metric = METRICS[state.metric];
  els.activeFilters.innerHTML = [
    `Indicator: ${metric.short}`,
    `Focus: ${displayCountry(state.country)}`,
    `Compare: ${displayCountry(state.compare)}`,
    `Segment: ${state.segment}`,
    `${filtered.length} countries`,
  ]
    .map((label) => `<span class="chip">${escapeHtml(label)}</span>`)
    .join("");
}

function renderKpis(rows, focus) {
  const metric = METRICS[state.metric];
  const weighted = weightedAverage(rows, state.metric);
  const high = maxBy(rows, state.metric);
  const low = minBy(rows, state.metric);
  const respondents = rows.reduce((sum, row) => sum + Number(row.respondents || 0), 0);
  const focusValue = formatPercent(focus[state.metric]);

  const items = [
    ["Average", formatPercent(weighted), metric.short],
    ["Highest country", high ? formatPercent(high[state.metric]) : "-", high ? displayCountry(high.country) : "-"],
    ["Lowest country", low ? formatPercent(low[state.metric]) : "-", low ? displayCountry(low.country) : "-"],
    ["Focus country", focusValue, displayCountry(focus.country)],
    ["Respondents", formatNumber(respondents), "Filtered sample base"],
  ];

  els.kpiRow.style.gridTemplateColumns = `repeat(${items.length}, minmax(140px, 1fr))`;
  els.kpiRow.innerHTML = items
    .map(
      ([label, value, note]) => `
        <div class="kpi">
          <span>${escapeHtml(label)}</span>
          <strong>${escapeHtml(value)}</strong>
          <small>${escapeHtml(note)}</small>
        </div>
      `
    )
    .join("");
}

function renderMap(rows, focus) {
  const rowByCode = new Map(rows.map((row) => [row.country_code, row]));
  const width = 620;
  const height = 540;
  const dots = store.countries
    .filter((row) => COORDS[row.country_code])
    .map((row) => {
      const [lon, lat] = COORDS[row.country_code];
      const x = (lon + 26) * 7.85;
      const y = (36 - lat) * 7.25;
      const value = row[state.metric];
      const active = rowByCode.has(row.country_code);
      const selected = row.country === focus.country;
      return `
        <g class="country-node" data-country="${escapeAttr(row.country)}" tabindex="0" role="button" aria-label="${escapeAttr(displayCountry(row.country))} ${formatPercent(value)}">
          <title>${escapeHtml(displayCountry(row.country))} - ${escapeHtml(METRICS[state.metric].short)}: ${formatPercent(value)}</title>
          <circle class="country-dot ${selected ? "is-selected" : ""}" cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${selected ? 12 : 8}" fill="${colorFor(value, METRICS[state.metric].polarity)}" opacity="${active ? 0.95 : 0.2}"></circle>
          ${selected || value >= 70 || value <= 15 ? `<text class="country-label" x="${(x + 12).toFixed(1)}" y="${(y - 9).toFixed(1)}">${escapeHtml(row.country_code)}</text>` : ""}
        </g>
      `;
    })
    .join("");

  els.mapContainer.innerHTML = `
    <svg id="africaMap" viewBox="0 0 ${width} ${height}" role="img" aria-label="Dot map of African countries in this prototype">
      <path class="map-outline" d="${AFRICA_OUTLINE}"></path>
      <g>${dots}</g>
    </svg>
  `;

  els.mapContainer.querySelectorAll(".country-node").forEach((node) => {
    node.addEventListener("click", () => selectCountry(node.dataset.country));
    node.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        selectCountry(node.dataset.country);
      }
    });
  });

  els.mapLegend.innerHTML = `
    <span>Low</span>
    <span class="legend-scale" aria-hidden="true"></span>
    <span>High</span>
    <strong>${escapeHtml(METRICS[state.metric].short)}</strong>
  `;
}

function selectCountry(country) {
  state.country = country;
  if (state.compare === country) state.compare = getFallbackCompare(country);
  syncControls();
  render();
}

function renderRanking(rows) {
  const metric = METRICS[state.metric];
  els.rankingTitle.textContent = metric.label;
  els.rankingCount.textContent = `${rows.length} countries`;
  els.rankingList.innerHTML = rows
    .map((row) =>
      barRow({
        label: displayCountry(row.country),
        country: row.country,
        value: row[state.metric],
        fill: colorFor(row[state.metric], metric.polarity),
        selected: row.country === state.country,
      })
    )
    .join("");

  els.rankingList.querySelectorAll("[data-country]").forEach((row) => {
    row.addEventListener("click", () => selectCountry(row.dataset.country));
  });
}

function renderDistribution(rows, focus) {
  const metric = METRICS[state.metric];
  const values = rows.map((row) => Number(row[state.metric] || 0));
  const bins = Array.from({ length: 10 }, (_, index) => ({
    min: index * 10,
    max: index * 10 + 10,
    rows: [],
  }));
  rows.forEach((row) => {
    const value = clamp(Number(row[state.metric] || 0), 0, 100);
    const index = Math.min(9, Math.floor(value / 10));
    bins[index].rows.push(row);
  });

  const width = 620;
  const height = 320;
  const pad = { left: 46, right: 24, top: 28, bottom: 46 };
  const innerWidth = width - pad.left - pad.right;
  const innerHeight = height - pad.top - pad.bottom;
  const maxCount = Math.max(1, ...bins.map((bin) => bin.rows.length));
  const barGap = 8;
  const barWidth = innerWidth / bins.length - barGap;
  const focusValue = Number(focus[state.metric] || 0);
  const focusX = pad.left + (focusValue / 100) * innerWidth;
  const avg = values.reduce((sum, value) => sum + value, 0) / Math.max(1, values.length);
  const avgX = pad.left + (avg / 100) * innerWidth;

  const bars = bins
    .map((bin, index) => {
      const h = (bin.rows.length / maxCount) * innerHeight;
      const x = pad.left + index * (innerWidth / bins.length) + barGap / 2;
      const y = pad.top + innerHeight - h;
      const active = focusValue >= bin.min && (focusValue < bin.max || bin.max === 100);
      return `
        <rect x="${x}" y="${y}" width="${barWidth}" height="${h}" rx="3" fill="${active ? "#f25528" : "#d8d8de"}"></rect>
        <text class="chart-label" x="${x + barWidth / 2}" y="${height - 18}" text-anchor="middle">${bin.min}</text>
      `;
    })
    .join("");

  els.distributionChart.innerHTML = `
    <svg viewBox="0 0 ${width} ${height}" role="img" aria-label="Distribution of selected indicator">
      <line class="chart-axis" x1="${pad.left}" y1="${pad.top + innerHeight}" x2="${width - pad.right}" y2="${pad.top + innerHeight}"></line>
      ${bars}
      <line x1="${avgX}" y1="${pad.top}" x2="${avgX}" y2="${pad.top + innerHeight}" stroke="#111" stroke-dasharray="4 5"></line>
      <line x1="${focusX}" y1="${pad.top}" x2="${focusX}" y2="${pad.top + innerHeight}" stroke="#f25528" stroke-width="3"></line>
      <text class="chart-label" x="${avgX + 6}" y="${pad.top + 14}">Average ${formatPercent(avg)}</text>
      <text class="chart-label" x="${focusX + 6}" y="${pad.top + 34}">${escapeHtml(displayCountry(focus.country))} ${formatPercent(focusValue)}</text>
      <text class="chart-label" x="${width - pad.right}" y="${height - 18}" text-anchor="end">100</text>
      <text class="chart-label" x="${pad.left}" y="${height - 4}">${escapeHtml(metric.short)} (%)</text>
    </svg>
  `;
}

function renderScatter(focus) {
  const width = 620;
  const height = 320;
  const pad = { left: 54, right: 24, top: 24, bottom: 52 };
  const innerWidth = width - pad.left - pad.right;
  const innerHeight = height - pad.top - pad.bottom;
  const xKey = "economy_good_pct";
  const yKey = "living_conditions_good_pct";

  const grid = [0, 25, 50, 75, 100]
    .map((tick) => {
      const x = pad.left + (tick / 100) * innerWidth;
      const y = pad.top + innerHeight - (tick / 100) * innerHeight;
      return `
        <line class="chart-grid" x1="${x}" y1="${pad.top}" x2="${x}" y2="${pad.top + innerHeight}"></line>
        <line class="chart-grid" x1="${pad.left}" y1="${y}" x2="${width - pad.right}" y2="${y}"></line>
        <text class="chart-label" x="${x}" y="${height - 24}" text-anchor="middle">${tick}</text>
        <text class="chart-label" x="${pad.left - 10}" y="${y + 4}" text-anchor="end">${tick}</text>
      `;
    })
    .join("");

  const dots = store.countries
    .map((row) => {
      const x = pad.left + (Number(row[xKey] || 0) / 100) * innerWidth;
      const y = pad.top + innerHeight - (Number(row[yKey] || 0) / 100) * innerHeight;
      const selected = row.country === focus.country;
      return `
        <g tabindex="0" role="button" data-country="${escapeAttr(row.country)}" aria-label="${escapeAttr(displayCountry(row.country))}">
          <title>${escapeHtml(displayCountry(row.country))}: economy ${formatPercent(row[xKey])}, living ${formatPercent(row[yKey])}</title>
          <circle class="chart-dot ${selected ? "is-selected" : ""}" cx="${x}" cy="${y}" r="${selected ? 9 : 6}" fill="${selected ? "#f25528" : "#111"}" opacity="${selected ? 1 : 0.56}"></circle>
          ${selected ? `<text class="chart-label" x="${x + 12}" y="${y - 10}">${escapeHtml(displayCountry(row.country))}</text>` : ""}
        </g>
      `;
    })
    .join("");

  els.scatterChart.innerHTML = `
    <svg viewBox="0 0 ${width} ${height}" role="img" aria-label="Scatter chart economy versus living conditions">
      ${grid}
      <line class="chart-axis" x1="${pad.left}" y1="${pad.top + innerHeight}" x2="${width - pad.right}" y2="${pad.top + innerHeight}"></line>
      <line class="chart-axis" x1="${pad.left}" y1="${pad.top}" x2="${pad.left}" y2="${pad.top + innerHeight}"></line>
      ${dots}
      <text class="chart-label" x="${pad.left + innerWidth / 2}" y="${height - 4}" text-anchor="middle">Economy described as good (%)</text>
      <text class="chart-label" x="14" y="${pad.top + innerHeight / 2}" transform="rotate(-90 14 ${pad.top + innerHeight / 2})" text-anchor="middle">Living conditions good (%)</text>
    </svg>
  `;

  els.scatterChart.querySelectorAll("[data-country]").forEach((node) => {
    node.addEventListener("click", () => selectCountry(node.dataset.country));
    node.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        selectCountry(node.dataset.country);
      }
    });
  });
}

function renderProfile(focus) {
  els.profileTitle.textContent = displayCountry(focus.country);
  els.profileMeta.textContent = `${formatNumber(focus.respondents)} respondents · ${focus.regions} regions`;
  const rows = Object.entries(METRICS).map(([key, metric]) => ({
    label: metric.short,
    value: focus[key],
    fill: "#ffffff",
  }));
  els.profileBars.innerHTML = rows.map((row) => barRow(row)).join("");
}

function renderComparison(focus, compare) {
  els.compareTitle.textContent = `${displayCountry(focus.country)} vs ${displayCountry(compare.country)}`;
  els.compareBars.innerHTML = Object.entries(METRICS)
    .map(([key, metric]) => {
      const focusValue = Number(focus[key] || 0);
      const compareValue = Number(compare[key] || 0);
      return `
        <div class="compare-item">
          <div class="bar-row">
            <span class="bar-label">${escapeHtml(metric.short)}</span>
            <div class="bar-track"><div class="bar-fill" style="width:${focusValue}%; background:${colorFor(focusValue, metric.polarity)}"></div></div>
            <span class="bar-value">${formatPercent(focusValue)}</span>
          </div>
          <div class="bar-row">
            <span class="bar-label muted-label">${escapeHtml(displayCountry(compare.country))}</span>
            <div class="bar-track"><div class="bar-fill" style="width:${compareValue}%; background:#111"></div></div>
            <span class="bar-value">${formatPercent(compareValue)}</span>
          </div>
        </div>
      `;
    })
    .join("");
}

function renderSegments(focus) {
  const metric = METRICS[state.metric];
  els.segmentTitle.textContent = `${state.segment} in ${displayCountry(focus.country)}`;
  const segments = store.segments
    .filter((row) => row.country === focus.country && row.segment_type === state.segment)
    .sort((a, b) => segmentSort(a.segment, b.segment));

  els.segmentBars.innerHTML =
    segments.length > 0
      ? segments
          .map((row) =>
            barRow({
              label: `${row.segment} (${formatNumber(row.respondents)})`,
              value: row[state.metric],
              fill: colorFor(row[state.metric], metric.polarity),
            })
          )
          .join("")
      : `<p>No segment records available for this country.</p>`;
}

function renderRegions(focus) {
  const metric = METRICS[state.metric];
  els.regionTitle.textContent = `${displayCountry(focus.country)} regions`;
  els.regionMetricHead.textContent = metric.short;
  const regions = store.regions
    .filter((row) => row.country === focus.country)
    .sort((a, b) => Number(b[state.metric] || -1) - Number(a[state.metric] || -1))
    .slice(0, 18);

  els.regionRows.innerHTML = regions
    .map(
      (row) => `
        <tr>
          <td>${escapeHtml(row.region)}</td>
          <td><strong>${formatPercent(row[state.metric])}</strong></td>
          <td>${formatNumber(row.respondents)}</td>
        </tr>
      `
    )
    .join("");
}

function renderInsights(rows, focus, compare) {
  const metric = METRICS[state.metric];
  const high = maxBy(rows, state.metric);
  const low = minBy(rows, state.metric);
  const delta = Math.abs(Number(focus[state.metric] || 0) - Number(compare[state.metric] || 0)).toFixed(1);
  const focusDirection = focus[state.metric] >= weightedAverage(rows, state.metric) ? "above" : "below";

  const bullets = [
    `${displayCountry(focus.country)} is ${focusDirection} the filtered country average for ${metric.label.toLowerCase()} (${formatPercent(focus[state.metric])}).`,
    `${displayCountry(high.country)} currently has the highest value in this view (${formatPercent(high[state.metric])}), while ${displayCountry(low.country)} has the lowest (${formatPercent(low[state.metric])}).`,
    `${displayCountry(focus.country)} and ${displayCountry(compare.country)} differ by ${delta} percentage points on the selected indicator.`,
    "The interface supports the RFQ requirements: country comparison, demographic disaggregation, regional detail, search, and export-friendly outputs.",
  ];

  els.insights.innerHTML = bullets.map((text) => `<div class="insight">${escapeHtml(text)}</div>`).join("");
}

function barRow({ label, country = label, value, fill = "var(--ab-orange)", selected = false }) {
  const safeValue = clamp(Number(value || 0), 0, 100);
  return `
    <div class="bar-row ${selected ? "is-selected-row" : ""}" data-country="${escapeAttr(country)}">
      <span class="bar-label">${escapeHtml(label)}</span>
      <div class="bar-track"><div class="bar-fill" style="width:${safeValue}%; background:${fill}"></div></div>
      <span class="bar-value">${formatPercent(safeValue)}</span>
    </div>
  `;
}

function weightedAverage(rows, key) {
  const denom = rows.reduce((sum, row) => sum + Number(row.weighted_base || row.respondents || 0), 0);
  if (!denom) return 0;
  const total = rows.reduce((sum, row) => sum + Number(row[key] || 0) * Number(row.weighted_base || row.respondents || 0), 0);
  return total / denom;
}

function maxBy(rows, key) {
  return rows.reduce((best, row) => (!best || Number(row[key] || -1) > Number(best[key] || -1) ? row : best), null);
}

function minBy(rows, key) {
  return rows.reduce((best, row) => (!best || Number(row[key] ?? 101) < Number(best[key] ?? 101) ? row : best), null);
}

function colorFor(value, polarity) {
  const v = clamp(Number(value || 0), 0, 100);
  const positive = polarity === "positive";
  const normalized = positive ? v : 100 - v;
  if (normalized >= 65) return "#087f5b";
  if (normalized >= 40) return "#f7a813";
  return "#b42318";
}

function segmentSort(a, b) {
  const order = ["Women", "Men", "Urban", "Peri-urban", "Rural", "18-25", "26-35", "36-50", "51+"];
  return (order.indexOf(a) === -1 ? 99 : order.indexOf(a)) - (order.indexOf(b) === -1 ? 99 : order.indexOf(b));
}

function downloadCurrentCsv() {
  const rows = getFilteredCountries();
  const headers = ["country_code", "country", "respondents", "regions", ...Object.keys(METRICS)];
  const csv = [headers.join(",")]
    .concat(
      rows.map((row) =>
        headers
          .map((header) => {
            const value = row[header] ?? "";
            return `"${String(value).replace(/"/g, '""')}"`;
          })
          .join(",")
      )
    )
    .join("\n");
  downloadBlob(csv, "afrobarometer-round10-dashboard-view.csv", "text/csv;charset=utf-8");
  showToast("CSV exported");
}

function downloadMapSvg() {
  const svg = document.getElementById("africaMap");
  if (!svg) return;
  const source = `<?xml version="1.0" encoding="UTF-8"?>\n${svg.outerHTML}`;
  downloadBlob(source, "afrobarometer-dashboard-map.svg", "image/svg+xml;charset=utf-8");
  showToast("Map SVG exported");
}

function downloadBlob(content, fileName, mimeType) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

function renderError(error) {
  els.statusCountryCount.textContent = "Data failed to load";
  els.kpiRow.innerHTML = `
    <div class="kpi">
      <span>Error</span>
      <strong>Data</strong>
      <small>${escapeHtml(error.message)}</small>
    </div>
  `;
  console.error(error);
}

function showToast(message) {
  els.toast.textContent = message;
  els.toast.classList.add("is-visible");
  window.clearTimeout(showToast.timeout);
  showToast.timeout = window.setTimeout(() => els.toast.classList.remove("is-visible"), 2200);
}

function updateGlobeTarget(focus) {
  const coord = COORDS[focus.country_code] || [24, 0];
  globe.targetLon = coord[0];
  globe.targetLat = coord[1];
  els.globeCountry.textContent = displayCountry(focus.country);
  els.globeMeta.textContent = `${formatPercent(focus[state.metric])} on ${METRICS[state.metric].short.toLowerCase()} · ${formatNumber(focus.respondents)} respondents`;
  if (!globe.ctx && globe.canvas) globe.ctx = globe.canvas.getContext("2d");
  if (!globe.raf) animateGlobe();
}

function animateGlobe() {
  globe.currentLon += shortestAngle(globe.currentLon, globe.targetLon) * 0.075;
  globe.currentLat += (globe.targetLat - globe.currentLat) * 0.075;
  drawGlobe();
  globe.raf = window.requestAnimationFrame(animateGlobe);
}

function drawGlobe() {
  if (!globe.ctx) return;
  const canvas = globe.canvas;
  const ctx = globe.ctx;
  const width = canvas.width;
  const height = canvas.height;
  const cx = width / 2;
  const cy = height / 2;
  const radius = Math.min(width, height) * 0.39;

  ctx.clearRect(0, 0, width, height);
  const ocean = ctx.createRadialGradient(cx - radius * 0.32, cy - radius * 0.38, radius * 0.1, cx, cy, radius);
  ocean.addColorStop(0, "#f8fbff");
  ocean.addColorStop(0.2, "#dbe8f4");
  ocean.addColorStop(0.5, "#6f96ad");
  ocean.addColorStop(1, "#173447");
  ctx.fillStyle = ocean;
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.fill();

  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.clip();

  drawGraticule(ctx, cx, cy, radius);
  drawLandMasses(ctx, cx, cy, radius);
  drawCountryPins(ctx, cx, cy, radius);

  const shade = ctx.createRadialGradient(cx - radius * 0.4, cy - radius * 0.45, radius * 0.1, cx + radius * 0.24, cy + radius * 0.18, radius * 1.1);
  shade.addColorStop(0, "rgba(255,255,255,0.42)");
  shade.addColorStop(0.45, "rgba(255,255,255,0.02)");
  shade.addColorStop(1, "rgba(0,0,0,0.38)");
  ctx.fillStyle = shade;
  ctx.fillRect(cx - radius, cy - radius, radius * 2, radius * 2);
  ctx.restore();

  ctx.strokeStyle = "rgba(255,255,255,0.58)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.stroke();
}

function drawGraticule(ctx, cx, cy, radius) {
  ctx.strokeStyle = "rgba(255,255,255,0.18)";
  ctx.lineWidth = 1;
  for (let lat = -60; lat <= 60; lat += 30) {
    drawProjectedLine(ctx, cx, cy, radius, range(-180, 180, 4).map((lon) => [lon, lat]));
  }
  for (let lon = -180; lon <= 180; lon += 30) {
    drawProjectedLine(ctx, cx, cy, radius, range(-80, 80, 4).map((lat) => [lon, lat]));
  }
}

function drawLandMasses(ctx, cx, cy, radius) {
  const africa = [
    [-17, 35], [5, 37], [24, 32], [35, 24], [44, 12], [49, -1], [43, -12], [39, -24],
    [31, -34], [20, -35], [15, -23], [8, -14], [-3, -7], [-10, 3], [-17, 14], [-16, 25], [-17, 35],
  ];
  const europe = [[-11, 36], [2, 46], [18, 47], [31, 42], [28, 36], [12, 35], [-1, 36], [-11, 36]];
  const middleEast = [[30, 32], [45, 30], [55, 23], [49, 14], [39, 17], [31, 25], [30, 32]];
  const madagascar = [[47, -12], [50, -17], [49, -25], [45, -23], [44, -16], [47, -12]];
  const southAmerica = [[-82, 10], [-63, 8], [-45, -5], [-39, -22], [-52, -55], [-66, -45], [-76, -18], [-82, 10]];

  ctx.fillStyle = "rgba(247, 245, 240, 0.86)";
  ctx.strokeStyle = "rgba(17,17,17,0.18)";
  ctx.lineWidth = 1;
  [southAmerica, europe, middleEast, africa, madagascar].forEach((poly) => drawProjectedPolygon(ctx, cx, cy, radius, poly));
}

function drawCountryPins(ctx, cx, cy, radius) {
  store.countries.forEach((country) => {
    const coord = COORDS[country.country_code];
    if (!coord) return;
    const projected = project(coord[0], coord[1], cx, cy, radius);
    if (!projected.visible) return;
    const selected = country.country === state.country;
    ctx.fillStyle = selected ? "#f25528" : "rgba(17,17,17,0.38)";
    ctx.strokeStyle = "#fff";
    ctx.lineWidth = selected ? 3 : 1.5;
    ctx.beginPath();
    ctx.arc(projected.x, projected.y, selected ? 7 : 3.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    if (selected) {
      ctx.strokeStyle = "rgba(242,85,40,0.35)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(projected.x, projected.y, 18, 0, Math.PI * 2);
      ctx.stroke();
    }
  });
}

function drawProjectedLine(ctx, cx, cy, radius, points) {
  let started = false;
  ctx.beginPath();
  points.forEach(([lon, lat]) => {
    const p = project(lon, lat, cx, cy, radius);
    if (!p.visible) {
      started = false;
      return;
    }
    if (!started) {
      ctx.moveTo(p.x, p.y);
      started = true;
    } else {
      ctx.lineTo(p.x, p.y);
    }
  });
  ctx.stroke();
}

function drawProjectedPolygon(ctx, cx, cy, radius, points) {
  const projected = points.map(([lon, lat]) => project(lon, lat, cx, cy, radius)).filter((p) => p.visible);
  if (projected.length < 3) return;
  ctx.beginPath();
  projected.forEach((point, index) => {
    if (index === 0) ctx.moveTo(point.x, point.y);
    else ctx.lineTo(point.x, point.y);
  });
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
}

function project(lon, lat, cx, cy, radius) {
  const lambda = toRad(lon - globe.currentLon);
  const phi = toRad(lat);
  const phi0 = toRad(globe.currentLat);
  const cosc = Math.sin(phi0) * Math.sin(phi) + Math.cos(phi0) * Math.cos(phi) * Math.cos(lambda);
  return {
    x: cx + radius * Math.cos(phi) * Math.sin(lambda),
    y: cy - radius * (Math.cos(phi0) * Math.sin(phi) - Math.sin(phi0) * Math.cos(phi) * Math.cos(lambda)),
    visible: cosc > -0.08,
  };
}

function shortestAngle(from, to) {
  return ((((to - from) % 360) + 540) % 360) - 180;
}

function toRad(value) {
  return (value * Math.PI) / 180;
}

function range(start, end, step) {
  const values = [];
  for (let value = start; value <= end; value += step) values.push(value);
  return values;
}

function formatPercent(value) {
  if (value === null || value === undefined || Number.isNaN(Number(value))) return "-";
  return `${Number(value).toFixed(1)}%`;
}

function formatNumber(value) {
  return new Intl.NumberFormat("en").format(Number(value || 0));
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function escapeAttr(value) {
  return escapeHtml(value).replace(/`/g, "&#096;");
}

function displayCountry(value) {
  if (value === "Cote dIvoire") return "Cote d'Ivoire";
  return value;
}

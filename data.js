// ILLUSTRATIVE PLACEHOLDER DATA - NOT REAL MEASUREMENTS.
// Replace these values with processed NASA data (see README.md).

window.STATES = {
  Alaska:     { code: "AK", center: [64.2, -152.0], zoom: 4 },
  California: { code: "CA", center: [37.2, -119.5], zoom: 6 },
  Hawaii:     { code: "HI", center: [20.8, -157.5], zoom: 7 },
  Oregon:     { code: "OR", center: [43.9, -120.6], zoom: 6 },
  Washington: { code: "WA", center: [47.4, -120.7], zoom: 7 }
};

// color: [low, high] gradient endpoints
window.VARIABLES = {
  temp: {
    label: "Temperature anomaly", unit: "°C", color: ["#fde7c8", "#c0392b"],
    desc: "Departure from the 1951-1980 average temperature. Higher = warmer than baseline.",
    values: { Alaska: 2.1, California: 1.3, Hawaii: 0.9, Oregon: 1.2, Washington: 1.1 }
  },
  precip: {
    label: "Precipitation anomaly", unit: "%", color: ["#e3f0fb", "#1f5fa8"],
    desc: "Percent difference from long-term average precipitation. Negative = drier.",
    values: { Alaska: 6, California: -9, Hawaii: -4, Oregon: -3, Washington: 2 }
  },
  fire: {
    label: "Wildfire risk index", unit: "/100", color: ["#fff1d6", "#d35400"],
    desc: "Relative wildfire activity/conditions score from 0 to 100.",
    values: { Alaska: 55, California: 88, Hawaii: 40, Oregon: 72, Washington: 58 }
  },
  drought: {
    label: "Drought severity", unit: "/100", color: ["#f4ecd8", "#8a5a14"],
    desc: "Relative drought severity score from 0 to 100.",
    values: { Alaska: 20, California: 78, Hawaii: 45, Oregon: 60, Washington: 42 }
  },
  sea: {
    label: "Sea-level rise rate", unit: "mm/yr", color: ["#e0f7f5", "#0b7a75"],
    desc: "Approximate rate of relative sea-level rise along the coast.",
    values: { Alaska: -1.0, California: 2.0, Hawaii: 3.6, Oregon: 1.5, Washington: 1.8 }
  }
};

// Synthetic yearly temperature anomaly (degC), 1980-2024. Deterministic, illustrative only.
(function () {
  const slope = { Alaska: 0.045, California: 0.028, Hawaii: 0.02, Oregon: 0.027, Washington: 0.026 };
  const years = [];
  for (let y = 1980; y <= 2024; y++) years.push(y);
  const series = {};
  Object.keys(slope).forEach((s, si) => {
    series[s] = years.map((y, i) => +((i - 15) * slope[s] + 0.25 * Math.sin(i * 1.7 + si)).toFixed(2));
  });
  window.TREND = { years, series };
})();

// Synthetic monthly precipitation (mm). Illustrative only.
window.SEASONAL = {
  months: ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"],
  series: {
    Alaska:     [60,50,45,40,40,45,65,85,90,85,70,65],
    California: [95,90,70,35,15,4,1,2,8,30,65,90],
    Hawaii:     [110,90,100,70,50,35,40,40,50,80,105,120],
    Oregon:     [150,110,100,70,55,35,12,15,35,85,160,170],
    Washington: [140,100,95,65,50,40,20,22,40,90,150,160]
  }
};

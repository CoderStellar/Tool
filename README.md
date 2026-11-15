# West Coast Climate Assessment Tool

NASA Space Apps Challenge project. A static website for assessing climate conditions in **Alaska, California, Hawaii, Oregon and Washington**.

## Tabs
1. **Homepage** - template visualizations (KPIs, trend, state comparison, risk profile, seasonal chart)
2. **Map & States** - interactive map with a variable selector, ranking and per-state detail
3. **About** - Methodology, Guardrails, Sources

## Status
All values in `data.js` are **illustrative placeholders**, not measurements. Replace them with processed NASA data (GISTEMP, GPM/IMERG, FIRMS, GRACE-FO, Sea Level Change Portal) before presenting conclusions.

## Run locally
Open `index.html` in a browser (needs internet for Leaflet, Chart.js, map tiles).

## Publish
Repo Settings -> Pages -> Deploy from branch `main` / root.

## Files
- `index.html` - page structure and About content
- `styles.css` - styling (light/dark)
- `data.js` - data (edit this)
- `app.js` - tabs, charts, map

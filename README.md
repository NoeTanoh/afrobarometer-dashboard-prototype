# Afrobarometer 2026 Flagship Dashboard Prototype

A polished interactive dashboard prototype prepared for the Afrobarometer 2026 Flagship Report RFQ response.

## Run locally

```powershell
python -m http.server 5174
```

Then open:

```text
http://localhost:5174
```

## What is included

- Full public-facing dashboard interface.
- Animated globe that rotates toward the selected country.
- Country map, ranking, profile, side-by-side comparison, segment breakdown, regional table.
- Distribution chart and economy-vs-living-conditions scatter plot.
- Search, filters, CSV export, SVG map export, print/PDF support.
- Responsive desktop/mobile layout.
- Dashboard-ready data in `data/processed/round10_dashboard_data.json`.
- Technical offer documents under `output/offer/`.

## Data note

The prototype uses public Afrobarometer Round 10 CSV files prepared for demonstration. Production delivery should replace prototype metrics with Afrobarometer-approved final 2026 Flagship Report indicators, labels, data files, and hosting requirements.

## Proposal artifacts

- `output/offer/offre-technique-afrobarometer.md`
- `output/offer/offre-technique-afrobarometer.docx`
- `output/offer/offre-technique-afrobarometer.pdf`

## Deployment

This is a static website. It can be deployed on Netlify, Vercel, Cloudflare Pages, GitHub Pages, or any static web server.

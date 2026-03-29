# Car Finder

An AI-powered car matching tool that guides undecided consumers through a structured discovery questionnaire, then surfaces personalized vehicle recommendations backed by real government data.

## Features

- **Adaptive Questionnaire** — Up to 50 questions across 8 stages with smart skip logic (most users answer ~30)
- **Real Data** — NHTSA safety ratings, EPA fuel economy, recall history, complaint data
- **Scoring Engine** — Multi-dimensional matching across price, reliability, safety, fuel economy, features, terrain capability, and more
- **Deep Links** — Pre-populated search links to Cars.com, AutoTrader, and CarGurus
- **Telemetry** — Anonymous event tracking with optional cross-session user tracking (shared with briancronin.ai apps)
- **Mobile-First** — Designed for the way people actually shop for cars

## Tech Stack

- React 19
- Vite
- Pure CSS (no external UI libraries)
- Client-side scoring engine (no API calls for matching)
- Shared telemetry via Vercel Postgres (Neon)

## Getting Started

```bash
npm install
npm run dev
```

## Data Sources

All vehicle data comes from US government public domain APIs:

- [NHTSA vPIC API](https://vpic.nhtsa.dot.gov/api/) — Vehicle specs, body style, engine, drivetrain
- [NHTSA Safety Ratings](https://www.nhtsa.gov/nhtsa-datasets-and-apis) — NCAP crash test scores
- [NHTSA Complaints](https://www.nhtsa.gov/nhtsa-datasets-and-apis) — Consumer complaint counts
- [NHTSA Recalls](https://www.nhtsa.gov/nhtsa-datasets-and-apis) — Recall history
- [EPA FuelEconomy.gov](https://www.fueleconomy.gov/feg/ws/) — MPG, fuel costs, emissions

Maintenance costs and lifespan estimates are curated from publicly available studies.

## Disclaimer

This application is for informational and educational purposes only. Vehicle recommendations are computed algorithmically and are not endorsements. Always test drive and consult professionals before purchasing. Past reliability data does not guarantee future performance.

## About

Built by [Brian Cronin](https://briancronin.ai) as a side project demonstrating data engineering, scoring algorithms, and consumer-facing data product design.

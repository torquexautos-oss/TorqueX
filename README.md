# TorqueX

TorqueX is an Intelligent Car Advisor built with React and a custom Node.js Express backend. It features a highly specialized recommendation engine that evaluates hundreds of cars across multiple dimensions (Performance, Safety, Resale, Service, Mileage, and Reliability).

## Key Features

- **Intelligent Scoring Engine V2**: Uses segment-aware percentile ranking and custom brand priors to precisely match user priorities. It implements strict price-descending subsets logic to maximize budget value.
- **Neon-Tech HUD UI**: A sleek, dark-mode dashboard inspired by supercar instrumentation (Boost meters, glowing stats, dynamic score bars).
- **Extensive Database**: Features a comprehensive database of 500+ Indian market cars with detailed specifications stored in SQLite.
- **Real-Time Filtering**: Dynamic budget range sliders, body type matching, and fuel type filtering ensure hyper-relevant results.

## Tech Stack

- **Frontend**: React (Vite), native CSS3 (no external libraries)
- **Backend**: Node.js, Express
- **Database**: SQLite3 (`better-sqlite3`)

## Getting Started

### Prerequisites

Ensure you have Node.js (v18+) installed on your machine.

### Installation

1. Install dependencies:
   ```bash
   npm install
   ```

2. Run the development server (starts both React frontend and Express backend concurrently):
   ```bash
   npm run dev
   ```

3. Access the application at `http://localhost:5173`.

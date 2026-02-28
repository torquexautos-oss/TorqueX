<p align="center">
  <img src="torquex-logo.png" alt="TorqueX Logo" width="350" />
</p>

<h1 align="center">TorqueX: Intelligent Automotive Advisor</h1>

<p align="center">
  <strong>A next-generation car recommendation platform built for the Indian automotive market.</strong>
</p>

---

## 🏎️ Overview

TorqueX is not a standard car search engine. Instead of relying purely on generic filters, TorqueX utilizes a **Custom Scoring Engine (V2)** that evaluates over 500+ cars across six distinct performance and lifestyle dimensions. 

Wrapped in a sleek, hardware-accelerated **"Neon HUD"** interface inspired by supercar telemetry, TorqueX bridges the gap between raw automotive data and emotional driving decisions.

## ✨ Key Features & Architecture

### 1. The V2 Scoring Engine
The backend doesn't just filter; it mathematically ranks vehicles based on user-weighted priorities (0-100 scales).
- **Segment-Aware Percentile Ranking**: Cars are grouped by economic segments (Budget, Mid, Premium) to ensure fair comparisons. A heavy SUV isn't unfairly penalized for mileage against a lightweight hatchback.
- **Weighted Harmonic Mean Aggregation**: Prevent cars with extreme "one-trick pony" stats (e.g., massive power but terrible safety) from dominating balanced, high-quality vehicles.
- **Dynamic Brand Priors**: Incorporates real-world market sentiment by applying soft prior bumps to historically reliable or high-resale brands (e.g., Toyota, Skoda).
- **Budget Maximization Sort**: The Top 10 results are isolated and sorted in descending order of price, guaranteeing the user sees the most premium options their budget allows without sacrificing core quality scores.

### 2. Neon-Tech HUD Interface
The frontend is built to feel alive.
- **Telemetry-Style Adjusters**: Pure CSS/JS Boost sliders that glow from amber to redline as limits are pushed.
- **Dynamic Stat Bars**: Engine scores are rendered via custom neon-glowing progress bars that inherit dynamic hex colors based on the dimension being measured.
- **Hardware Accelerated**: Zero external UI libraries. Everything from the layout grid to the micro-animations is written in pure vanilla CSS3 for maximum rendering performance.

### 3. Comprehensive Database
- Native SQLite3 (`better-sqlite3`) database containing **500+ car models** and comprehensive JSON specs.
- Contains nuanced vehicle data spanning MSRP prices, fuel types, body styles, localized Indian market resale values, and manufacturer service network ratings.

---

## 🛠️ Tech Stack

- **Frontend Ecosystem**: React 18, Vite, Vanilla CSS3
- **Backend Infrastructure**: Node.js, Express.js
- **Database & Storage**: SQLite3 (`better-sqlite3`)

---

## 🚀 Getting Started

### Prerequisites
Ensure you have Node.js (v18 or higher) installed on your machine.

### Local Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/Ahuja2304/TorqueX.git
   cd "TorqueX"
   ```

2. **Install project dependencies:**
   ```bash
   npm install
   ```

3. **Ignite the Engine (Start the dev server):**
   ```bash
   npm run dev
   ```
   *Note: This command concurrently boots both the Vite React frontend and the Express Node.js backend API.*

4. **Access the Application:**
   Open your browser and navigate to `http://localhost:5173`.

---

## 🔀 Branch Strategy

This repository actively utilizes three synchronized branches:
- `main`: The stable production-ready release track.
- `Mark-I`: The primary feature development and integration branch.
- `sodium`: Experimental backend scaling and custom scoring logic sandbox.

*(Note: All three branches are strict-synced following the V2 Engine release to ensure codebase parity.)*

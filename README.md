<div align="center">
  <img src="logo.png" alt="TorqueX Logo" width="200" />
  <h1>TORQUEX // INTELLIGENT AUTOMOTIVE ADVISOR</h1>
  <p><strong>A high-performance, AI-driven automotive intelligence platform tailored for the Indian car market.</strong></p>

  [![Project Status: Private](https://img.shields.io/badge/Status-Private_Proprietary-red?style=for-the-badge)](https://github.com/Ahuja2304/TorqueX)
  [![Tech Stack: Fullstack JS](https://img.shields.io/badge/Tech_Stack-React_%7C_Node_%7C_SQLite-blue?style=for-the-badge)](https://github.com/Ahuja2304/TorqueX)
</div>

---

## 🚫 PRIVATE & PROPRIETARY NOTICE

**TorqueX is a private, commercial-grade project developed by our internal team.**

> [!IMPORTANT]
> **NO CONTRIBUTIONS OR COLLABORATIONS:** We are currently **not** accepting any external pull requests, issues, or collaborative inquiries. This repository exists as the primary codebase for our private operations and company. Any unsolicited contributions will be closed without review.

---

## 🏎️ THE MISSION

TorqueX is more than a car search engine—it is an **Intelligent Advisory System**. We bridge the gap between cold specification sheets and the emotional reality of driving. By leveraging advanced heuristic scoring and real-time market data, TorqueX empowers users to find the vehicle that mathematically and emotionally fits their life.

---

## 💎 CORE CAPABILITIES

### 1. THE ODIN ENGINE (v2.4)
Our proprietary scoring core evaluates every vehicle across 500+ data points:
- **Heuristic Ranking**: Weighted multi-objective optimization based on user priorities (Performance, Safety, Utility, etc.).
- **Segment-Aware Calibration**: Dynamic adjustment for entry-level budget cars vs. luxury flagships to maintain scoring parity.
- **Harmonic Mean Aggregation**: Prevents "imbalanced" cars (high power but zero safety) from gaming the system.
- **Market Sentiment Integration**: Real-world resale value algorithms and brand reliability priors.

### 2. TELEMETRY-LEVEL INTERFACE
A "Neon-HUD" UI that feels like sitting in a supercar cockpit:
- **Mechanical HUD**: Hardware-accelerated CSS3 animations (60 FPS) with telemetry-inspired sliders.
- **Dynamic Vibe Check**: Interactive filters that glow and respond with haptic-inspired visual feedback.
- **Bespoke Components**: Zero external UI libraries. Everything is hand-crafted for maximum performance and zero bloat.

### 3. AUTOMOTIVE DATA INTELLIGENCE
- **Live Scraping Integration**: Real-time on-road price tracking across major Indian cities (Delhi, Mumbai, Bangalore).
- **Comprehensive DB**: 500+ curated models with high-fidelity variant matrices and specification depth.

---

## 🛠️ TECHNICAL ARCHITECTURE

| Layer | Technology |
| :--- | :--- |
| **Frontend** | React 18 (Hooks/Context), Vite, Vanilla CSS3 (Custom Modules) |
| **Backend** | Node.js, Express, RESTful API |
| **Database** | SQLite3 via `better-sqlite3`, Firestore (Analytics/Sync) |
| **Animations** | Framer Motion & CSS Mechanical Snap Transitions |

---

## 🚀 INTERNAL DEPLOYMENT

### System Prerequisites
- **Node.js**: v18.0.0 or higher
- **NPM**: v9.0.0 or higher
- **Memory**: 8GB RAM minimum for full-stack dev environment

### Installation Protocol

1. **Clone Internal Repo:**
   ```bash
   git clone https://github.com/Ahuja2304/TorqueX.git
   cd TorqueX
   ```

2. **Synchronize Dependencies:**
   ```bash
   npm install
   ```

3. **Ignite Development Core:**
   ```bash
   npm run dev
   ```
   *This initializes the Vite HMR frontend and the Express API core concurrently.*

4. **Access Local Node:**
   `http://localhost:5173`

---

## 📊 REPOSITORY TOPOLOGY

We maintain strict synchronization across three mission-critical branches:
- **`main`**: Production-locked, stable release candidate.
- **`Mark-I`**: Feature integration and QA sandbox.
- **`sodium`**: Experimental R&D for next-gen scoring logic.

---

<div align="center">
  <p>© 2026 TorqueX Automotive Intelligence. All Rights Reserved.</p>
</div>

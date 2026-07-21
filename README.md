# Interactive Terminal Web (`web_cli`)

A modern, highly customizable portfolio and developer landing page styled exactly like an interactive Linux/Ubuntu command-line interface. Built for software engineers, embedded/IoT enthusiasts, and system architects who want to present their work through a tactile, retro-futuristic terminal experience.

---

## Architecture & Principles

`web_cli` is designed around strict separation of concerns between **presentation layer**, **configuration data**, and **backend persistence**:

```
web_cli/
├── frontend/             # React + Vite + TypeScript + Vanilla/Tailwind CSS
│   ├── public/           # Static assets & runtime configuration
│   └── src/              # Terminal layout, visual effects, and command parser
├── backend/              # Python FastAPI service for guest messages & persistence
└── docker-compose.yml    # Container orchestration (Frontend + Backend + Tailscale Tunnel)
```

### 1. Configuration-Driven Content
The terminal's data contract ensures that personal information, portfolio projects, skills, and virtual files (`resume.md`, `id_rsa.pub`, etc.) are decoupled from application logic.
- **Canonical Home:** `frontend/public/terminal.config.json` (see `terminal.config.example.json` for structure).
- **Principle:** You do not need to modify React code to update your resume or add new projects. When the app boots, it fetches `terminal.config.json` dynamically and populates the terminal's state, virtual file system, and command outputs (`whoami`, `about`, `skills`, `projects`, `cat`).

### 2. Retro-Futuristic Visual Engine
Rather than relying on static styling, the visual layer simulates physical hardware and retro CRT displays:
- **`HardwareBorder.tsx`**: A responsive, draggable macOS/Linux window frame simulation that encloses the terminal canvas and handles scroll confinement without viewport overflow.
- **`CRTEffect.tsx` & `MatrixRain.tsx`**: Absolute-positioned visual layers providing scanlines, screen curvature, and dynamic digital rain effects isolated within the terminal border.
- **`StatusBar.tsx` & `soundEffects.ts`**: Real-time system telemetry (battery, memory, network latency) paired with Web Audio API synthesized key clicks and terminal bell feedback.

### 3. Lightweight Backend Persistence
- **Canonical Home:** `backend/`
- **Principle:** A minimal FastAPI service (`main.py`) backed by SQLite (`messages.db`) designed specifically to handle interactive contact forms (`leave-message`) and guest inquiries initiated from the terminal command prompt.

---

## Getting Started & Usage

### Option A: Quickstart via Docker & Tailscale (Recommended)
The project includes pre-configured orchestration that builds production-ready Nginx and FastAPI containers, optionally exposed securely to the internet or private network via Tailscale.

1. **Configure Environment:**
   Copy the example config and add your desired Tailscale Auth Key (optional for tunneling):
   ```bash
   cp frontend/public/terminal.config.example.json frontend/public/terminal.config.json
   # Edit docker-compose.yml to insert your TS_AUTHKEY if public funnel/tunnel is required
   ```

2. **Launch Services:**
   Use the provided helper scripts or standard Docker Compose:
   ```bash
   # Windows
   .\init_tailscale.bat

   # Linux / macOS
   chmod +x init_tailscale.sh
   ./init_tailscale.sh

   # Or manually via Docker Compose
   docker compose up --build -d
   ```
3. Access the web terminal locally at `http://localhost` (or via your Tailscale node hostname).

---

### Option B: Local Development Setup

#### Frontend Development Server
```bash
cd frontend
npm install
npm run dev
```
Runs the Vite development server with hot-module replacement on `http://localhost:5173`.

#### Backend API Server
```bash
cd backend
python -m venv venv
# Activate venv: .\venv\Scripts\activate (Windows) or source venv/bin/activate (Linux/Mac)
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```
Serves the REST API endpoints and SQLite message database locally.

---

## Personalizing Your Portfolio

To adapt `web_cli` for your own profile without writing code:

1. Open `frontend/public/terminal.config.json`.
2. Update the identity blocks:
   - **`userInfo`**: Your display name, role summary, and bio.
   - **`skills`**: Categorized arrays of languages, frameworks, and infrastructure tools.
   - **`projects`**: Featured repositories or live applications with URLs and tech stack badges.
   - **`virtualFiles`**: Files accessible via terminal commands (`cat resume.md`, `cat about.txt`).
3. Set **`apiEndpoint`** to point to your live backend service URL (e.g., your Tailscale domain or self-hosted API).

---

## Interactive Command System

Once inside the application, visitors navigate your portfolio by typing commands just like a real Unix terminal. Type `help` or `guide` directly in the browser to explore the full roster of system commands, visual toggles (`crt`, `matrix`, `theme`), and filesystem utilities (`ls`, `cat`, `clear`).

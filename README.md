# 🎵 Neon Tempo — Rhythm Game (Vaporwave)

Jeu de rythme 4-lanes style Project DIVA / Osu!mania avec leaderboard global et détecteur de beats automatique.

## 🛠️ Stack technique

| Côté | Tech |
|------|------|
| **Frontend** | React 18 + Vite + TypeScript + Tailwind + TanStack Router + Phaser 3 |
| **Backend** | Node.js + Express + TypeScript + Drizzle ORM + PostgreSQL |
| **Tools** | TypeScript (beat detector script) |

## 📁 Structure

```
rhythm-game/
├── frontend/     → React app + Phaser game (port :5173)
├── backend/      → Express API (port :3001)
└── tools/        → Scripts CLI (beat-detector, etc.)
```

## 🚀 Démarrage rapide

### Prérequis

- **Node.js** ≥ 20
- **PostgreSQL** ≥ 14 (en local ou via Docker)
- **pnpm** (recommandé) ou npm

### 1. PostgreSQL

Crée la base avec un des moyens suivants :

**Option A — psql local :**
```bash
createdb rhythm_game
```

**Option B — Docker (zéro config) :**
```bash
docker run -d \
  --name rhythm-pg \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=rhythm_game \
  -p 5432:5432 \
  postgres:16
```

### 2. Backend

```bash
cd backend
cp .env.example .env       # Configure DATABASE_URL si besoin
npm install
npm run dev                 # → http://localhost:3001
```

Test : `curl http://localhost:3001/api/ping` doit renvoyer `{ "ok": true, ... }`.

### 3. Frontend

Dans un **autre terminal** :

```bash
cd frontend
npm install
npm run dev                 # → http://localhost:5173
```

Ouvre `http://localhost:5173` dans le navigateur. Tu dois voir :
- Le titre "NEON TEMPO" en rose néon clignotant
- Une grille perspective vaporwave en fond
- En bas à gauche : `● BACKEND ONLINE` (en cyan) — preuve que les deux serveurs communiquent

## 📋 État d'avancement

- [x] **Étape 1** — Setup projets, communication front ↔ back, design vaporwave
- [ ] **Étape 2** — AudioEngine (Web Audio API) + premier proof of concept Phaser
- [ ] **Étape 3** — Gameplay complet (notes, scoring, combo)
- [ ] **Étape 4** — Pages React (sélection musique, résultats, leaderboard)
- [ ] **Étape 5** — Backend complet (Drizzle schema, routes, persistance)
- [ ] **Étape 6** — Beat detector automatique

## 🎨 Direction artistique

Vaporwave / 和風 (style japonais rétro).

Palette :
- `#1a0b2e` — violet nuit profond (fond)
- `#ff71ce` — rose néon (accent principal)
- `#01cdfe` — cyan néon (accent secondaire)
- `#b967ff` — violet électrique
- `#fffb96` — jaune crème (sun)

Fonts :
- **Display** : VT323 (titres, score)
- **Body** : Space Mono (interface)
- **Décoration** : Noto Serif JP (kanji)

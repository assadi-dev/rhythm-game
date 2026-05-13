# 🎵 Neon Tempo — Rhythm Game (Vaporwave)

Jeu de rythme 4-lanes style Project DIVA / Osu!mania avec leaderboard global et détecteur de beats automatique.

## 🛠️ Stack technique

| Côté | Tech |
|------|------|
| **Frontend** | React 18 + Vite + TypeScript + Tailwind + TanStack Router + Phaser 3 |
| **Backend** | Node.js + Express + TypeScript + Drizzle ORM + PostgreSQL |
| **Tools** | TypeScript (beat detector script) |
| **Monorepo** | Turborepo |

## 📁 Structure

```
rhythm-game/
├── .env                → Variables d'environnement partagées (racine Turbo)
├── frontend/           → React app + Phaser game (port :5173)
├── backend/            → Express API (port :3001)
└── tools/              → Scripts CLI (beat-detector)
```

## 🚀 Démarrage rapide

### Prérequis

- **Node.js** ≥ 20
- **npm** ≥ 8
- **PostgreSQL** ≥ 14 (en local ou via Docker)

### 1. Variables d'environnement

Édite le `.env` à la racine du projet :

```env
PORT=3001
NODE_ENV=development
DATABASE_URL=postgresql://postgres:password@localhost:5432/rhythm_game
CORS_ORIGIN=http://localhost:5173
```

> Toutes les variables sont centralisées ici — Turbo les distribue automatiquement aux workspaces.

### 2. PostgreSQL

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

### 3. Installation & démarrage

```bash
npm install          # installe toutes les dépendances (root + workspaces)
npm run dev          # démarre frontend + backend en parallèle via Turbo
```

- Frontend → `http://localhost:5173`
- Backend  → `http://localhost:3001`

Test API : `curl http://localhost:3001/api/ping` → `{ "ok": true, ... }`

### 4. Base de données

```bash
cd backend
npm run db:generate  # génère les migrations Drizzle
npm run db:migrate   # applique les migrations
npm run db:studio    # GUI pour explorer la DB
npm run db:seed      # (optionnel) données de démo
```

### 5. Beat detector (MP3 → chart JSON)

```bash
cd tools
npx tsx beat-detector.ts path/to/song.mp3 --output ../backend/assets/charts/
```

## 📋 État d'avancement

- [x] **Étape 1** — Setup monorepo, communication front ↔ back, design vaporwave
- [x] **Étape 2** — AudioEngine (Web Audio API) + GameScene minimaliste
- [x] **Étape 3** — Gameplay complet (4 lanes, scoring, combo, effets visuels)
- [x] **Étape 4** — Pages React (sélection musique, résultats, leaderboard)
- [x] **Étape 5** — Backend complet (Drizzle schema, routes, persistance PostgreSQL)
- [x] **Étape 6** — Beat detector automatique (script TS)
- [x] **Étape 7** — Intégration finale + polish

## 🎮 Gameplay

- **4 lanes** — touches `←` `↓` `↑` `→` (touches fléchées, reconfigurables en jeu)
- **Timing** : Web Audio API exclusivement (`AudioContext.currentTime`)

| Fenêtre | Jugement | Points | Combo |
|---------|----------|--------|-------|
| 0–33 ms | COOL | 1000 | +1 |
| 33–66 ms | FINE | 500 | +1 |
| 66–100 ms | SAFE | 200 | reset |
| 100–133 ms | SAD | 50 | reset |
| > 133 ms | MISS | 0 | reset |

**Rangs** : 95%+ SS · 90%+ S · 80%+ A · 70%+ B · 60%+ C · <60% D

## 🎨 Direction artistique

Vaporwave / 和風 (style japonais rétro).

| Variable CSS | Valeur | Usage |
|---|---|---|
| `--vapor-bg` | `#1a0b2e` | fond |
| `--vapor-pink` | `#ff71ce` | accent principal |
| `--vapor-cyan` | `#01cdfe` | accent secondaire |
| `--vapor-purple` | `#b967ff` | violet électrique |
| `--vapor-yellow` | `#fffb96` | jaune crème |

Fonts : **VT323** (titres/score) · **Space Mono** (UI) · **Noto Serif JP** (kanji)

## 📡 API REST

```
GET  /api/ping
GET  /api/songs
GET  /api/songs/:id
GET  /api/charts/:id
POST /api/sessions/start
POST /api/scores
GET  /api/leaderboard/global
GET  /api/leaderboard/song/:id
```

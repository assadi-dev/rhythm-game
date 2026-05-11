# Neon Tempo — Contexte projet

> Ce fichier est lu automatiquement par Claude Code. Il contient le contexte
> nécessaire pour comprendre l'architecture, les décisions et les conventions.
> **Ne pas le supprimer.** Le mettre à jour quand des décisions structurelles changent.

## 🎮 Le projet

Jeu de rythme **4-lanes** style Project DIVA / Osu!mania, avec :
- Gameplay = notes qui descendent vers une ligne de jugement, 4 touches (D/F/J/K)
- Leaderboard global (sans authentification, pseudo optionnel)
- Détecteur de beats automatique (offline, transforme un MP3 → chart JSON)

## 🛠️ Stack technique (figée)

| Côté | Tech |
|------|------|
| **Frontend** | React 18 + Vite + TypeScript + Tailwind CSS + TanStack Router + Phaser 3 |
| **Backend** | Node.js + Express + TypeScript + Drizzle ORM + PostgreSQL |
| **Tools** | TypeScript (scripts CLI) |

**Pas de Next.js, pas de SSR.** Frontend = SPA pure (Vite). Phaser tourne uniquement côté client, dans un composant React `<GameCanvas />`.

## 📁 Architecture

```
rhythm-game/
├── frontend/                    React + Vite (port :5173)
│   ├── src/
│   │   ├── routes/              TanStack Router file-based (auto-généré)
│   │   ├── pages/               Composants de pages (importés par les routes)
│   │   ├── components/          UI réutilisable
│   │   ├── game/                Code Phaser pur (isolé de React)
│   │   │   ├── PhaserGame.ts    Bootstrap Phaser
│   │   │   ├── AudioEngine.ts   Web Audio API (timing précis)
│   │   │   ├── scenes/          Scènes Phaser
│   │   │   ├── entities/        Note, etc.
│   │   │   └── systems/         JudgeSystem, ScoreSystem
│   │   ├── api/                 Client HTTP (fetch wrappers)
│   │   └── types/               Types partagés (mirror du backend)
│   └── public/assets/           audio/ et charts/ (servis statiquement)
│
├── backend/                     Express (port :3001)
│   ├── src/
│   │   ├── index.ts             Entry point
│   │   ├── app.ts               Factory createApp()
│   │   ├── routes/              Routes Express
│   │   ├── services/            Logique métier
│   │   └── db/                  Schema Drizzle, queries
│   └── drizzle/                 Migrations générées
│
└── tools/                       Scripts CLI offline
    └── beat-detector.ts         MP3 → chart.json
```

## 🎨 Direction artistique

**Vaporwave / 和風 (rétro japonais)** — voir `frontend/src/index.css` pour la palette.

**CSS Variables partagées** entre React (via Tailwind config) et Phaser (lit `getComputedStyle`) :
- `--vapor-bg`        `#1a0b2e` (violet nuit profond, fond)
- `--vapor-pink`      `#ff71ce` (rose néon principal)
- `--vapor-cyan`      `#01cdfe` (cyan néon)
- `--vapor-purple`    `#b967ff` (violet électrique)
- `--vapor-yellow`    `#fffb96` (jaune crème, sun)

**Fonts** :
- Display (titres, score) : `VT323`
- Body (interface) : `Space Mono`
- Décoration : `Noto Serif JP` (kanji)

## 🎯 Système de scoring (Project DIVA-like)

| Timing window | Jugement | Points | Combo  |
|---------------|----------|--------|--------|
| 0–33 ms       | COOL     | 1000   | +1     |
| 33–66 ms      | FINE     | 500    | +1     |
| 66–100 ms     | SAFE     | 200    | reset  |
| 100–133 ms    | SAD      | 50     | reset  |
| > 133 ms      | MISS     | 0      | reset  |

**Multiplicateurs combo** : ≥10 ×1.1, ≥50 ×1.5, ≥100 ×2.0, ≥200 ×2.5

**Rang final** (% accuracy) : 95%+ SS, 90%+ S, 80%+ A, 70%+ B, 60%+ C, <60% D

## 🔑 Décisions clés (à respecter)

1. **Pas d'authentification.** Le joueur tape son pseudo en fin de partie, c'est tout. Si vide → `Anonyme #1234` généré.
2. **Pas d'anti-triche pour la démo.** Sera ajouté plus tard si besoin (token signé + sampling + rate limit + PIN à 6 caractères alphanum).
3. **Musiques** : catalogue serveur uniquement, **libres de droits**. Pas d'upload joueur.
4. **Mobile + desktop** : les deux plateformes doivent fonctionner (tap mobile + clavier).
5. **Timing audio = Web Audio API exclusivement** (`AudioContext.currentTime`). JAMAIS `setTimeout`, JAMAIS `Date.now()` pour la synchro audio.
6. **React ne pilote pas Phaser pendant le jeu.** Communication unidirectionnelle Phaser → React via events.

## 📡 API REST (à implémenter)

```
GET  /api/ping                  ✅ implémenté (étape 1)
GET  /api/songs                 → liste catalogue
GET  /api/songs/:id             → détails + difficultés
GET  /api/charts/:id            → chart JSON (notes)
POST /api/sessions/start        → démarre une session de jeu
POST /api/scores                → soumet un score
GET  /api/leaderboard/global    → top 100 mondial
GET  /api/leaderboard/song/:id  → top 100 par musique
```

## 🚦 État d'avancement

- [x] **Étape 1** — Setup projets, communication front ↔ back, design vaporwave
- [x] **Étape 2** — AudioEngine + GameScene minimaliste (1 note qui descend)
- [x] **Étape 3** — Gameplay complet (4 lanes, scoring, combo, effets visuels)
- [x] **Étape 4** — Pages React (sélection musique, résultats, leaderboard)
- [ ] **Étape 5** — Backend complet (Drizzle schema, routes, persistance PostgreSQL)
- [ ] **Étape 6** — Beat detector automatique (script TS)
- [ ] **Étape 7** — Intégration finale + polish

## 🧰 Conventions de code

- **TypeScript strict** partout (`"strict": true`)
- **ESM** (imports `.js` même pour les `.ts` côté backend — convention Node ESM)
- **Alias imports** : utiliser `@/` côté frontend (configuré dans `vite.config.ts` + `tsconfig.json`)
- **Pas d'`any`** sauf cas exceptionnel commenté
- **Pas de classes côté React** — function components + hooks uniquement
- **Phaser** = classes (c'est l'API native)

## 🏃 Commandes utiles

```bash
# Démarrer en dev (2 terminals)
cd backend && npm run dev    # http://localhost:3001
cd frontend && npm run dev   # http://localhost:5173

# Build prod
cd frontend && npm run build
cd backend && npm run build

# Drizzle (à venir étape 5)
cd backend && npm run db:generate  # générer migrations
cd backend && npm run db:migrate   # appliquer migrations
cd backend && npm run db:studio    # GUI pour explorer la DB
```

## 🐛 Pièges connus

- **Phaser + Vite HMR** : Phaser garde des references aux canvas. Au hot reload, bien faire `game.destroy(true)` dans le cleanup du `useEffect`.
- **AudioContext sur Safari iOS** : doit être créé/repris à l'intérieur d'un event handler utilisateur (click, touchstart), sinon il reste en suspended.
- **TanStack Router** : `src/routeTree.gen.ts` est auto-généré, ne PAS l'éditer manuellement, il est régénéré au démarrage de Vite.
- **CORS en prod** : le proxy Vite est dev-only. En prod, soit servir le frontend depuis Express (statique), soit configurer CORS proprement.
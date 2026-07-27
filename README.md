# CWGens — Civil War Generals

A browser-based hex wargame covering 8 battles of the American Civil War. Choose your engagement, play as Union or Confederate forces, manage morale and unit cohesion, and break the enemy army before your own collapses.

**Live (GitHub Pages):** https://labairj-ai.github.io/CWGens/  
**Live (Optiplex / Tailscale):** https://cwgens.tailb97cdb.ts.net/

---

## Battles

| Battle | Date | Notes |
|--------|------|-------|
| First Bull Run | July 21, 1861 | First major land battle; Confederate rout of Union forces |
| Shiloh | April 6–7, 1862 | Two-day bloodbath in the Tennessee woods |
| Antietam | September 17, 1862 | Bloodiest single day of the war |
| Gettysburg | July 1–3, 1863 | Turning point; reinforcements model Pickett and XII Corps |
| Chancellorsville | May 1–4, 1863 | Lee's masterpiece; Jackson's flank march through the Wilderness |
| Chickamauga | September 19–20, 1863 | Longstreet's breakthrough routs half the Union army |
| Spotsylvania | May 8–21, 1864 | The Bloody Angle; Grant hammers Lee's earthworks |
| Franklin | November 30, 1864 | Hood's desperate charge across open fields |

---

## Gameplay

- **Objective:** Drive the enemy army's total morale below 28% of its starting value. If neither side breaks by turn 20, the side with higher remaining morale wins.
- **Turn structure:** Player turn → Enemy turn → (Night recovery every 6 turns). Max 20 turns.
- **Actions per unit:** Move, Attack, Charge, Dig In, or Wait. Each unit may move and attack once per turn.
- **Morale system:** Combat reduces morale and strength. Units below 28% morale retreat; below 10% they rout and are removed from play.
- **Night phase:** Every 6 turns, units rest and partially recover morale, org, ammo, and strength.
- **Reinforcements:** Gettysburg has additional divisions arriving on turns 4 and 10 for both sides.
- **Fog of war:** Enemy units outside your line of sight are hidden.
- **Scrollable map:** The hex grid is larger than the viewport — drag/swipe to pan.

### Unit types

| Type | Move | Range | Notes |
|------|------|-------|-------|
| Infantry | 2 | 1 | Can charge (melee bonus) |
| Cavalry | 4 | 1 | Fast; can charge |
| Artillery | 2 | 2 | Long-range; cannot charge |
| General | 3 | — | Boosts adjacent unit morale; no attack |

### Terrain effects

| Terrain | Move cost | Cover |
|---------|-----------|-------|
| Open field | 1 | 0% |
| Road | 0.5 | 0% |
| Hill | 2 | 20% |
| Forest | 2 | 30% |
| Town | 2 | 25% |
| River | 3 | 0% |

---

## Tech stack

- **Vite 5** + vanilla JS ES modules (no game framework)
- **Canvas 2D** for all rendering — terrain, units, fog, UI
- **Web Audio API** for all sound: synthesized musket, cannon, bugle, drum, and background fiddle music (Ashokan Farewell style, two-voice sawtooth + convolution reverb)
- **Service Worker** for offline play (full precache generated at build time)
- **simplex-noise** for procedural terrain textures
- Seeded noise (`mulberry32`) so the map looks identical every load

---

## Development

```bash
npm install
npm run dev       # Vite dev server at localhost:5173
npm run build     # Production build → dist/
```

---

## Deployment

### GitHub Pages (auto)
Push to `main` — the `.github/workflows/deploy.yml` action runs `vite build` and publishes to GitHub Pages (base path `/CWGens/`).

### Optiplex (manual)
```bash
npx vite build --base=/
rsync -av --delete dist/ optiplex@192.168.1.178:~/cwgens/
```
The optiplex runs `cwgens.service` (Python HTTP server on port 3800, `127.0.0.1`), exposed via a dedicated Tailscale Funnel instance on `cwgens.tailb97cdb.ts.net`.

# CWGens — Civil War Generals

A browser-based hex wargame set at the Battle of Gettysburg (July 1–3, 1863). Play as Union or Confederate forces, manage morale and unit cohesion, and break the enemy army before your own collapses.

**Live (GitHub Pages):** https://labairj-ai.github.io/CWGens/  
**Live (Optiplex / Tailscale):** https://cwgens.tailb97cdb.ts.net/

---

## Gameplay

- **Objective:** Drive the enemy army's total morale below 28% of its starting value. If neither side breaks by turn 20, the side with higher remaining morale wins.
- **Turn structure:** Player turn → Enemy turn → (Night recovery every 6 turns). Max 20 turns.
- **Actions per unit:** Move, Attack, Charge, Dig In, or Wait. Each unit may move and attack once per turn.
- **Morale system:** Combat reduces morale and strength. Units below 28% morale retreat; below 10% they rout and are removed from play.
- **Night phase:** Every 6 turns, units rest and partially recover morale, org, ammo, and strength.
- **Reinforcements:** Additional divisions arrive on turns 4 and 10 for both sides.
- **Fog of war:** Enemy units outside your line of sight are hidden.

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
Push to `main` — the `.github/workflows/deploy.yml` action runs `vite build` and publishes `dist/` to the `gh-pages` branch.

### Optiplex (manual)
```bash
npx vite build --base=/
rsync -av --delete dist/ optiplex:~/cwgens/
```
The optiplex runs `cwgens.service` (Python HTTP server on port 3800, `127.0.0.1`), exposed via a dedicated Tailscale Funnel instance on `cwgens.tailb97cdb.ts.net`.

---

## Scenario — Battle of Gettysburg

8 starting units per side drawn from the historical order of battle. Reinforcements model the delayed arrival of Confederate Pender's Division and Union Slocum's XII Corps (turn 4), then Pickett's Division and Crawford's Division (turn 10).

Leader ratings (Influence, Loyalty, Organization, Health) are per-unit and displayed in the bottom panel when a unit is selected.

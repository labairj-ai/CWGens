import { createNoise2D } from 'simplex-noise';
import { HEX_SIZE, TERRAIN, W, H, MAP_X, MAP_Y, COLS, ROWS } from './constants.js';
import { hexToPixel, drawHexPath } from './hex.js';

// ── Noise setup ───────────────────────────────────────────────────────────────
// Seeded so the landscape is identical on every load

function mulberry32(seed) {
  let s = seed;
  return () => {
    s |= 0; s = (s + 0x6D2B79F5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const noise2D = createNoise2D(mulberry32(0x4C57_BE));

// Fractional Brownian Motion — multi-octave noise, returns [-1, 1]
function fbm(nx, ny, octaves = 5) {
  let v = 0, amp = 0.5, freq = 1;
  for (let i = 0; i < octaves; i++) {
    v   += amp * noise2D(nx * freq, ny * freq);
    amp  *= 0.5;
    freq *= 2.0;
  }
  return v; // roughly in [-1, 1]
}

// ── Hex grid constants ────────────────────────────────────────────────────────

const S3  = Math.sqrt(3);
// Direction → neighbor direction vectors (even / odd column)
const DIRS_EVEN = [[0,-1],[1,-1],[1,0],[0,1],[-1,0],[-1,-1]];
const DIRS_ODD  = [[0,-1],[1,0],[1,1],[0,1],[-1,1],[-1,0]];
// Corresponding edge midpoint angles (canvas coords, same for both parities)
const EDGE_ANG  = [270,330,30,90,150,210].map(d => d * Math.PI / 180);

// Subtle topographic grid line
const HEX_BORDER = 'rgba(22,14,4,0.28)';

// ── Terrain cache ─────────────────────────────────────────────────────────────
// The cache is in "map space": hex(0,0) center sits at (cacheShiftX, cacheShiftY).
// When zoomed on mobile, MAP_X is negative (map wider than screen), so we shift
// the cache right by |MAP_X| + HEX_SIZE so all hex coords land at positive pixels.
// drawAllTerrain draws the cache at (-cacheShiftX, -cacheShiftY) in the already-
// translated (panX, panY) context, so world + pan = screen for every pixel. ✓

let terrainCache = null;
let terrainCacheShiftX = 0;
let terrainCacheShiftY = 0;

export function invalidateTerrainCache() {
  terrainCache = null;
  terrainCacheShiftX = 0;
  terrainCacheShiftY = 0;
}

export function drawAllTerrain(ctx, terrain) {
  if (!terrainCache) {
    // Shift ensures the leftmost/topmost hex edge stays at cache coord ≥ 0.
    terrainCacheShiftX = Math.max(0, Math.ceil(HEX_SIZE - MAP_X) + 2);
    terrainCacheShiftY = Math.max(0, Math.ceil(HEX_SIZE - MAP_Y) + 2);
    const cacheW = Math.ceil(MAP_X + terrainCacheShiftX + HEX_SIZE * (1 + 1.5 * (COLS - 1))) + 4;
    const cacheH = Math.ceil(MAP_Y + terrainCacheShiftY + HEX_SIZE * S3 * (ROWS + 0.5)) + 4;
    terrainCache = document.createElement('canvas');
    terrainCache.width  = Math.max(4, cacheW);
    terrainCache.height = Math.max(4, cacheH);
    const off = terrainCache.getContext('2d');
    off.translate(terrainCacheShiftX, terrainCacheShiftY);
    for (let r = 0; r < terrain.length; r++)
      for (let q = 0; q < terrain[r].length; q++)
        drawTerrainHex(off, q, r, terrain[r][q], terrain);
  }
  ctx.drawImage(terrainCache, -terrainCacheShiftX, -terrainCacheShiftY);
}

export function drawHighlights(ctx, moveHexes, attackTargets, selectedUnit, rangeHexes = []) {
  for (const h of rangeHexes) {
    drawHexPath(ctx, h.q, h.r);
    ctx.fillStyle = 'rgba(220,100,20,0.10)';  ctx.fill();
    ctx.strokeStyle = 'rgba(220,100,20,0.32)'; ctx.lineWidth = 1; ctx.stroke();
  }
  for (const h of moveHexes) {
    drawHexPath(ctx, h.q, h.r);
    ctx.fillStyle = 'rgba(40,90,220,0.28)';  ctx.fill();
    ctx.strokeStyle = 'rgba(80,150,255,0.70)'; ctx.lineWidth = 1.5; ctx.stroke();
  }
  for (const u of attackTargets) {
    drawHexPath(ctx, u.q, u.r);
    ctx.fillStyle = 'rgba(210,40,40,0.28)';  ctx.fill();
    ctx.strokeStyle = 'rgba(255,70,70,0.80)'; ctx.lineWidth = 2; ctx.stroke();
  }
  if (selectedUnit) {
    drawHexPath(ctx, selectedUnit.q, selectedUnit.r);
    ctx.strokeStyle = '#f0c040'; ctx.lineWidth = 2.5; ctx.stroke();
  }
}

export function drawFlashEffects(ctx, effects, now) {
  for (const e of effects) {
    const age = (now - e.startTime) / 1000;
    if (age > 1.2) continue;
    const { x, y } = hexToPixel(e.q, e.r);
    ctx.save();
    ctx.globalAlpha = Math.max(0, 1 - age / 1.2);
    ctx.fillStyle = e.color;
    ctx.font = 'bold 11px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(e.text, x, y - 20 - age * 18);
    ctx.restore();
  }
}

// ── Per-hex draw ──────────────────────────────────────────────────────────────

function drawTerrainHex(ctx, q, r, key, terrain) {
  drawHexPath(ctx, q, r);
  ctx.fillStyle = TERRAIN[key].color;
  ctx.fill();

  ctx.save();
  drawHexPath(ctx, q, r);
  ctx.clip();

  switch (key) {
    case 'O': fieldTexture(ctx, q, r);              break;
    case 'H': hillTexture(ctx, q, r);               break;
    case 'F': forestTexture(ctx, q, r);             break;
    case 'R': roadTexture(ctx, q, r, terrain);       break;
    case 'T': townTexture(ctx, q, r);               break;
    case 'W': waterTexture(ctx, q, r, terrain);     break;
  }

  blendEdges(ctx, q, r, key, terrain);

  ctx.restore();

  drawHexPath(ctx, q, r);
  ctx.strokeStyle = HEX_BORDER;
  ctx.lineWidth = 0.7;
  ctx.stroke();
}

// ── Helper: get terrain key of a neighbor (null if out-of-bounds) ─────────────
function neighborKey(q, r, dirIdx, terrain) {
  const dirs = (q & 1) === 0 ? DIRS_EVEN : DIRS_ODD;
  const [dq, dr] = dirs[dirIdx];
  const nq = q + dq, nr = r + dr;
  if (nr < 0 || nr >= terrain.length || nq < 0 || nq >= terrain[0].length) return null;
  return terrain[nr][nq];
}

// ── Edge blending: soft color bleed from neighboring terrain types ─────────────
// Draws radial gradients at each edge where terrain types differ, creating
// natural-looking transition zones. Called inside the active hex clip.
function blendEdges(ctx, q, r, key, terrain) {
  if (key === 'W' || key === 'R') return;
  const { x, y } = hexToPixel(q, r);
  const EDGE_R = HEX_SIZE * S3 / 2;
  const BLEND_R = EDGE_R * 0.62;

  for (let i = 0; i < 6; i++) {
    const nkey = neighborKey(q, r, i, terrain);
    if (!nkey || nkey === key || nkey === 'W' || nkey === 'R') continue;

    const a = EDGE_ANG[i];
    const emx = x + EDGE_R * Math.cos(a);
    const emy = y + EDGE_R * Math.sin(a);

    const nc = TERRAIN[nkey].color;
    const nr2 = parseInt(nc.slice(1, 3), 16);
    const ng  = parseInt(nc.slice(3, 5), 16);
    const nb  = parseInt(nc.slice(5, 7), 16);
    const maxA = nkey === 'F' ? 0.52 : 0.38;

    const grad = ctx.createRadialGradient(emx, emy, 0, emx, emy, BLEND_R);
    grad.addColorStop(0,    `rgba(${nr2},${ng},${nb},${maxA})`);
    grad.addColorStop(0.55, `rgba(${nr2},${ng},${nb},${(maxA * 0.25).toFixed(2)})`);
    grad.addColorStop(1,    'rgba(0,0,0,0)');
    ctx.fillStyle = grad;
    ctx.fillRect(x - HEX_SIZE * 1.2, y - HEX_SIZE * 1.2, HEX_SIZE * 2.4, HEX_SIZE * 2.4);
  }
}

// ── Animated water shimmer ─────────────────────────────────────────────────────
// Draws time-shifting noise highlights on water hexes on top of the static cache.
// Called every frame from game.js with performance.now() timestamp.
export function drawWaterAnimations(ctx, terrain, timestamp) {
  const t = timestamp * 0.0008;
  const STEP = 5;
  const R2 = HEX_SIZE + 2;

  for (let r = 0; r < terrain.length; r++) {
    for (let q = 0; q < terrain[r].length; q++) {
      if (terrain[r][q] !== 'W') continue;

      const { x, y } = hexToPixel(q, r);

      ctx.save();
      drawHexPath(ctx, q, r);
      ctx.clip();

      for (let dy = -R2; dy <= R2; dy += STEP) {
        for (let dx = -R2; dx <= R2; dx += STEP) {
          const px = x + dx, py = y + dy;
          const n1 = noise2D(px * 0.12 + t * 0.8,  py * 0.10 + t * 0.30);
          const n2 = noise2D(px * 0.18 - t * 0.50, py * 0.15 + t * 0.42);
          const shimmer = (n1 * 0.55 + n2 * 0.45 + 1) / 2;
          if (shimmer > 0.70) {
            const alpha = (shimmer - 0.70) / 0.30 * 0.48;
            ctx.fillStyle = `rgba(185,228,255,${alpha.toFixed(2)})`;
            ctx.fillRect(px - STEP / 2, py - STEP / 2, STEP, STEP);
          }
        }
      }

      ctx.restore();
    }
  }
}

// ── OPEN FIELD ────────────────────────────────────────────────────────────────
// Pennsylvania farmland from ~400 ft — continuous patchwork greens via fbm

function fieldTexture(ctx, q, r) {
  const { x, y } = hexToPixel(q, r);
  const STEP = 5;
  const R = HEX_SIZE + 2;

  for (let dy = -R; dy <= R; dy += STEP) {
    for (let dx = -R; dx <= R; dx += STEP) {
      const px = x + dx, py = y + dy;
      const nx = px * 0.018, ny = py * 0.018;

      const coarse = fbm(nx, ny, 3);
      const fine   = noise2D(nx * 4, ny * 4);

      const t = (coarse * 0.7 + fine * 0.3 + 1) / 2;
      const rv = Math.round(60 + t * 58);
      const gv = Math.round(76 + t * 72);
      const bv = Math.round(18 + t * 28);

      ctx.fillStyle = `rgb(${rv},${gv},${bv})`;
      ctx.fillRect(px - STEP / 2, py - STEP / 2, STEP, STEP);
    }
  }
}

// ── HILL ──────────────────────────────────────────────────────────────────────
// Noise-gradient hillshade: overlapping soft blobs eliminate pixel grid lines.
// Each blob is coloured by diffuse(surface_normal · sun) so it reads as real
// topographic relief.

function hillTexture(ctx, q, r) {
  const { x, y } = hexToPixel(q, r);

  // Overlapping circles: step < 2*radius → smooth blending between samples
  const STEP = 6;
  const BLOB = STEP * 1.20;   // radius > step/2 → guaranteed overlap
  const R    = HEX_SIZE + 4;

  // Sun from upper-left, slightly elevated
  const LX = -0.48, LY = -0.56, LZ = 0.68;
  const LLEN = Math.sqrt(LX*LX + LY*LY + LZ*LZ);
  const lx = LX/LLEN, ly = LY/LLEN, lz = LZ/LLEN;

  // Lower frequency → larger, smoother hills; 5 octaves for detail
  const FREQ = 0.014;
  const EPS  = FREQ * 1.2;

  for (let dy = -R; dy <= R; dy += STEP) {
    for (let dx = -R; dx <= R; dx += STEP) {
      const px = x + dx, py = y + dy;
      const nx = px * FREQ, ny = py * FREQ;

      const h   = fbm(nx, ny, 5);
      const hx_ = (fbm(nx + EPS, ny, 5) - fbm(nx - EPS, ny, 5)) / (2 * EPS);
      const hy_ = (fbm(nx, ny + EPS, 5) - fbm(nx, ny - EPS, 5)) / (2 * EPS);

      const nlen   = Math.sqrt(hx_*hx_ + hy_*hy_ + 1);
      const diffuse = Math.max(0, (-hx_/nlen)*lx + (-hy_/nlen)*ly + (1/nlen)*lz);

      const elev = (h + 1) / 2;
      let br, bg, bb;
      // Low elevation → grassy slope; high elevation → exposed earth/rock
      if (elev < 0.5) {
        const t2 = elev * 2;
        br = Math.round(72  + t2 * 30);   // 72→102 olive-green
        bg = Math.round(88  + t2 * 20);   // 88→108
        bb = Math.round(22  + t2 * 18);   // 22→40
      } else {
        const t2 = (elev - 0.5) * 2;
        br = Math.round(102 + t2 * 70);   // 102→172 tan/rocky
        bg = Math.round(108 + t2 * 34);   // 108→142
        bb = Math.round(40  + t2 * 54);   // 40→94
      }

      const lit = 0.42 + diffuse * 0.78;  // raised ambient; softer shadows
      ctx.fillStyle = `rgba(${Math.round(Math.min(255,br*lit))},${Math.round(Math.min(255,bg*lit))},${Math.round(Math.min(255,bb*lit))},0.94)`;
      ctx.beginPath();
      ctx.arc(px, py, BLOB, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

// ── FOREST ────────────────────────────────────────────────────────────────────
// Dense deciduous canopy: noise-positioned trees, drop shadow → body → sun crown

function forestTexture(ctx, q, r) {
  const { x, y } = hexToPixel(q, r);
  const scl = HEX_SIZE / 24;
  ctx.save();
  ctx.translate(x, y); ctx.scale(scl, scl); ctx.translate(-x, -y);

  // Generate stable tree positions from noise iso-contours
  const trees = [];
  const STEP = 8, R = 24;
  for (let dy = -R; dy <= R; dy += STEP) {
    for (let dx = -R; dx <= R; dx += STEP) {
      const px = x + dx, py = y + dy;
      const v = noise2D(px * 0.11, py * 0.11);
      if (v > 0.05) {  // controls density
        const jx = noise2D(px * 0.3, py * 0.3) * 3;
        const jy = noise2D(px * 0.3 + 100, py * 0.3) * 3;
        const sz = 4.5 + ((v - 0.05) / 0.95) * 5;
        const hue = noise2D(px * 0.05, py * 0.05);
        trees.push({ tx: px + jx, ty: py + jy, sz, hue });
      }
    }
  }

  // Drop shadows
  trees.forEach(({ tx, ty, sz }) => {
    ctx.fillStyle = 'rgba(3,9,1,0.68)';
    ctx.beginPath();
    ctx.arc(tx + sz * 0.42, ty + sz * 0.42, sz * 0.88, 0, Math.PI * 2);
    ctx.fill();
  });

  // Canopy body
  trees.forEach(({ tx, ty, sz, hue }) => {
    const g = Math.round(50 + hue * 32);
    const rv2 = Math.round(22 + hue * 18);
    ctx.fillStyle = `rgba(${rv2},${g},8,0.90)`;
    ctx.beginPath();
    ctx.arc(tx, ty, sz, 0, Math.PI * 2);
    ctx.fill();
  });

  // Sunlit crowns (upper-left highlight)
  trees.forEach(({ tx, ty, sz, hue }) => {
    const hlx = tx - sz * 0.28, hly = ty - sz * 0.30;
    const g = ctx.createRadialGradient(hlx, hly, 0, hlx, hly, sz * 0.75);
    const bright = Math.round(85 + hue * 60);
    g.addColorStop(0, `rgba(${bright-8},${bright+22},${Math.round(bright*0.24)},0.78)`);
    g.addColorStop(0.55, 'rgba(48,88,14,0.24)');
    g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(tx, ty, sz, 0, Math.PI * 2);
    ctx.fill();
  });
  ctx.restore();
}

// ── ROAD ──────────────────────────────────────────────────────────────────────
// Neighbor-aware dirt road: channels flow toward adjacent road hexes so the
// path reads as a continuous corridor rather than repeating per-hex bands.

function roadTexture(ctx, q, r, terrain) {
  const { x, y } = hexToPixel(q, r);
  const R      = HEX_SIZE + 2;
  const STEP   = 5;
  const EDGE_R = HEX_SIZE * S3 / 2;

  // Field base (continuous with surrounding terrain)
  for (let dy = -R; dy <= R; dy += STEP) {
    for (let dx = -R; dx <= R; dx += STEP) {
      const px = x + dx, py = y + dy;
      const t = (fbm(px * 0.018, py * 0.018, 3) + 1) / 2;
      ctx.fillStyle = `rgb(${Math.round(60+t*55)},${Math.round(76+t*68)},${Math.round(18+t*26)})`;
      ctx.fillRect(px - STEP/2, py - STEP/2, STEP, STEP);
    }
  }

  // Find road neighbors (draw a channel arm toward each one)
  const roadDirs = [];
  for (let i = 0; i < 6; i++) {
    if (neighborKey(q, r, i, terrain) === 'R') roadDirs.push(i);
  }

  const HALF_W = Math.max(3, Math.round(7 * HEX_SIZE / 24));

  // Draw constant-width arms toward each road neighbor.
  // Arms start right at the hex center (no tapering) so opposing arms
  // merge seamlessly into a continuous band through the hex.
  roadDirs.forEach(i => {
    const a   = EDGE_ANG[i];
    const ex  = x + EDGE_R * Math.cos(a);
    const ey  = y + EDGE_R * Math.sin(a);
    const dx2 = ex - x, dy2 = ey - y;
    const len = Math.sqrt(dx2*dx2 + dy2*dy2);
    const px2 = -dy2/len, py2 = dx2/len;  // unit perp

    // Gradient perpendicular to road direction
    const rg = ctx.createLinearGradient(
      x + px2*HALF_W, y + py2*HALF_W,
      x - px2*HALF_W, y - py2*HALF_W
    );
    rg.addColorStop(0,   'rgba(52,34,8,0.18)');
    rg.addColorStop(0.2, 'rgba(162,134,68,0.72)');
    rg.addColorStop(0.5, 'rgba(188,162,88,0.82)');
    rg.addColorStop(0.8, 'rgba(162,134,68,0.72)');
    rg.addColorStop(1,   'rgba(52,34,8,0.18)');
    ctx.fillStyle = rg;

    // Constant-width rectangle from center to edge midpoint
    ctx.beginPath();
    ctx.moveTo(x  + px2*HALF_W, y  + py2*HALF_W);
    ctx.lineTo(ex + px2*HALF_W, ey + py2*HALF_W);
    ctx.lineTo(ex - px2*HALF_W, ey - py2*HALF_W);
    ctx.lineTo(x  - px2*HALF_W, y  - py2*HALF_W);
    ctx.closePath();
    ctx.fill();

    // Wheel ruts (two thin dark lines along the arm)
    ctx.strokeStyle = 'rgba(36,22,4,0.30)';
    ctx.lineWidth = 1.4;
    [0.38, -0.38].forEach(s => {
      ctx.beginPath();
      ctx.moveTo(x  + px2*HALF_W*s, y  + py2*HALF_W*s);
      ctx.lineTo(ex + px2*HALF_W*s, ey + py2*HALF_W*s);
      ctx.stroke();
    });
  });

  // For isolated road hexes (no road neighbors) draw a small pad
  if (roadDirs.length === 0) {
    ctx.fillStyle = 'rgba(178,154,80,0.75)';
    ctx.beginPath(); ctx.arc(x, y, HALF_W, 0, Math.PI*2); ctx.fill();
  }
}

// ── TOWN ──────────────────────────────────────────────────────────────────────
// 1860s Pennsylvania town — rooftops, streets, a few yards

function townTexture(ctx, q, r) {
  const { x, y } = hexToPixel(q, r);
  const scl = HEX_SIZE / 24;
  ctx.save();
  ctx.translate(x, y); ctx.scale(scl, scl); ctx.translate(-x, -y);

  // Ground surface (packed earth + stone street)
  ctx.fillStyle = 'rgba(68,58,46,0.32)';
  ctx.fillRect(x - 26, y - 26, 52, 52);

  const blds = [
    { bx:-13, by:-11, bw: 8, bh: 7, roof:0 },
    { bx: -3, by:-12, bw: 7, bh: 6, roof:2 },
    { bx:  5, by:-10, bw: 9, bh: 7, roof:1 },
    { bx:-12, by:  1, bw: 6, bh: 6, roof:3 },
    { bx: -4, by:  2, bw: 8, bh: 6, roof:0 },
    { bx:  5, by:  3, bw: 7, bh: 5, roof:2 },
  ];
  const fills = ['rgba(90,84,76,0.90)','rgba(132,78,50,0.88)','rgba(154,136,104,0.84)','rgba(68,56,44,0.90)'];

  blds.forEach(({ bx, by, bw, bh, roof }) => {
    const rx = x + bx, ry = y + by;
    ctx.fillStyle = fills[roof];
    ctx.fillRect(rx, ry, bw, bh);
    ctx.fillStyle = 'rgba(0,0,0,0.30)';
    ctx.fillRect(rx + bw - 2, ry, 2, bh);
    ctx.fillRect(rx, ry + bh - 2, bw, 2);
    ctx.fillStyle = 'rgba(255,255,255,0.12)';
    ctx.fillRect(rx, ry, bw, 1.2);
    ctx.fillRect(rx, ry, 1.2, bh);
  });

  // Garden patches
  ctx.fillStyle = 'rgba(38,58,16,0.62)';
  ctx.beginPath(); ctx.ellipse(x + 10, y - 2, 3.5, 2.5, 0, 0, Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(x - 6,  y + 11, 2.5, 2.0, 0.4, 0, Math.PI*2); ctx.fill();

  // Sun shading
  const sg = ctx.createRadialGradient(x-9, y-11, 1, x+6, y+7, 26);
  sg.addColorStop(0, 'rgba(255,248,210,0.10)');
  sg.addColorStop(1, 'rgba(8,4,0,0.14)');
  ctx.fillStyle = sg;
  ctx.fillRect(x-26, y-26, 52, 52);
  ctx.restore();
}

// ── WATER ─────────────────────────────────────────────────────────────────────
// Connected river: detect water neighbors, draw channels + hub; noise ripples

function waterTexture(ctx, q, r, terrain) {
  const { x, y } = hexToPixel(q, r);
  const EDGE_R = HEX_SIZE * S3 / 2;

  // Find which of 6 neighbors are also water
  const waterDirs = [];
  for (let i = 0; i < 6; i++) {
    if (neighborKey(q, r, i, terrain) === 'W') waterDirs.push(i);
  }

  // ── Fill the "river shape" ────────────────────────────────────────────────
  // Build a clipping path that covers hub + all channels, then fill with water

  const HUB_R = waterDirs.length === 0 ? EDGE_R * 0.65 : EDGE_R * 0.58;
  const CHAN_W = 14; // channel width at the edge midpoint (px)

  ctx.beginPath();
  ctx.arc(x, y, HUB_R, 0, Math.PI * 2);
  ctx.fill(); // filled below with water colour

  // Channels toward each water neighbor
  waterDirs.forEach(i => {
    const a   = EDGE_ANG[i];
    const ex  = x + EDGE_R * Math.cos(a);
    const ey  = y + EDGE_R * Math.sin(a);
    const dx  = ex - x, dy2 = ey - y;
    const len = Math.sqrt(dx*dx + dy2*dy2);
    const px2 = -dy2/len, py2 = dx/len; // unit perp

    // Trapezoid: width CHAN_W at edge, tapers to HUB_R * 0.7 at center
    const hw = HUB_R * 0.60;
    ctx.beginPath();
    ctx.moveTo(x + px2*hw,      y + py2*hw);
    ctx.lineTo(ex + px2*CHAN_W/2, ey + py2*CHAN_W/2);
    ctx.lineTo(ex - px2*CHAN_W/2, ey - py2*CHAN_W/2);
    ctx.lineTo(x - px2*hw,      y - py2*hw);
    ctx.closePath();
    ctx.fill();
  });

  // ── Paint everything filled so far with deep water ─────────────────────────
  // (We use a second fill pass with compositing to colour the river shape)
  // Strategy: fill the shapes above are already in base colour from constants.
  // Now overlay water colour + texture on the whole hex (which will show through
  // only in the hub+channels because the clip mask is the hex border).

  // Deep water fill (darkens everything below to match river)
  ctx.fillStyle = 'rgba(22,50,82,0.82)';
  ctx.beginPath(); ctx.arc(x, y, HUB_R, 0, Math.PI*2); ctx.fill();
  waterDirs.forEach(i => {
    const a = EDGE_ANG[i];
    const ex = x + EDGE_R * Math.cos(a), ey = y + EDGE_R * Math.sin(a);
    const dx = ex - x, dy2 = ey - y;
    const len = Math.sqrt(dx*dx + dy2*dy2);
    const px2 = -dy2/len, py2 = dx/len;
    const hw = HUB_R * 0.60;
    ctx.beginPath();
    ctx.moveTo(x + px2*hw, y + py2*hw);
    ctx.lineTo(ex + px2*CHAN_W/2, ey + py2*CHAN_W/2);
    ctx.lineTo(ex - px2*CHAN_W/2, ey - py2*CHAN_W/2);
    ctx.lineTo(x - px2*hw, y - py2*hw);
    ctx.closePath();
    ctx.fill();
  });

  // ── Noise-based ripple texture ─────────────────────────────────────────────
  // Sample noise in the hub area and draw subtle colour variation
  const STEP = 4;
  for (let dy = -HUB_R; dy <= HUB_R; dy += STEP) {
    for (let dx = -HUB_R; dx <= HUB_R; dx += STEP) {
      if (dx*dx + dy*dy > HUB_R*HUB_R) continue;
      const px2 = x + dx, py2 = y + dy;
      const n = noise2D(px2 * 0.08, py2 * 0.08);
      const t = (n + 1) / 2;
      // Ripple: slight lighter/darker bands
      const rv = Math.round(28 + t * 22);
      const gv = Math.round(60 + t * 28);
      const bv = Math.round(110 + t * 35);
      ctx.fillStyle = `rgba(${rv},${gv},${bv},0.38)`;
      ctx.fillRect(px2 - STEP/2, py2 - STEP/2, STEP, STEP);
    }
  }

  // Sun glint (specular, upper-left of hub)
  const glint = ctx.createRadialGradient(x - HUB_R*0.35, y - HUB_R*0.30, 0, x, y, HUB_R);
  glint.addColorStop(0,    'rgba(195,232,255,0.60)');
  glint.addColorStop(0.30, 'rgba(160,214,252,0.20)');
  glint.addColorStop(1,    'rgba(0,0,0,0)');
  ctx.fillStyle = glint;
  ctx.beginPath(); ctx.arc(x, y, HUB_R, 0, Math.PI*2); ctx.fill();

  // Flow ripple lines along each channel direction
  waterDirs.forEach(i => {
    const a   = EDGE_ANG[i];
    const cos = Math.cos(a), sin = Math.sin(a);
    const perp = a + Math.PI / 2;
    const pc = Math.cos(perp), ps = Math.sin(perp);

    for (let offset = -3; offset <= 3; offset += 3) {
      const bx2 = x + pc * offset, by2 = y + ps * offset;
      const dist = EDGE_R * 0.85;
      ctx.strokeStyle = `rgba(140,194,248,${offset === 0 ? 0.50 : 0.28})`;
      ctx.lineWidth = offset === 0 ? 1.1 : 0.7;
      ctx.beginPath();
      ctx.moveTo(bx2, by2);
      ctx.bezierCurveTo(
        bx2 + cos * dist * 0.35 + pc * noise2D(bx2*0.1, by2*0.1) * 3,
        by2 + sin * dist * 0.35 + ps * noise2D(bx2*0.1+9, by2*0.1) * 3,
        bx2 + cos * dist * 0.70,
        by2 + sin * dist * 0.70,
        bx2 + cos * dist,
        by2 + sin * dist
      );
      ctx.stroke();
    }
  });

  // For isolated ponds (no water neighbors): concentric ripple rings
  if (waterDirs.length === 0) {
    for (let rr = 4; rr < HUB_R; rr += 5) {
      ctx.strokeStyle = `rgba(120,184,240,${0.35 - rr/HUB_R * 0.20})`;
      ctx.lineWidth = 0.8;
      ctx.beginPath(); ctx.arc(x, y, rr, 0, Math.PI*2); ctx.stroke();
    }
  }
}

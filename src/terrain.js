import { TERRAIN, W, H } from './constants.js';
import { hexToPixel, drawHexPath } from './hex.js';

// Subtle topographic-map grid line
const HEX_BORDER = 'rgba(28,18,6,0.32)';

// Deterministic per-hex RNG — stable across frames
function hrng(q, r, idx) {
  let h = (q * 374761393 + r * 668265263 + idx * 2246822519) >>> 0;
  h = ((h ^ (h >>> 16)) * 2246822519) >>> 0;
  h = ((h ^ (h >>> 13)) * 3266489917) >>> 0;
  return ((h ^ (h >>> 16)) >>> 0) / 0xFFFFFFFF;
}

// ── Off-screen terrain cache ──────────────────────────────────────────────────

let terrainCache = null;

export function invalidateTerrainCache() {
  terrainCache = null;
}

export function drawAllTerrain(ctx, terrain) {
  if (!terrainCache) {
    terrainCache = document.createElement('canvas');
    terrainCache.width = W;
    terrainCache.height = H;
    const off = terrainCache.getContext('2d');
    for (let r = 0; r < terrain.length; r++) {
      for (let q = 0; q < terrain[r].length; q++) {
        drawTerrainHex(off, q, r, terrain[r][q]);
      }
    }
  }
  ctx.drawImage(terrainCache, 0, 0);
}

export function drawHighlights(ctx, moveHexes, attackTargets, selectedUnit) {
  for (const h of moveHexes) {
    drawHexPath(ctx, h.q, h.r);
    ctx.fillStyle = 'rgba(40,90,220,0.28)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(80,150,255,0.70)';
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }
  for (const u of attackTargets) {
    drawHexPath(ctx, u.q, u.r);
    ctx.fillStyle = 'rgba(210,40,40,0.28)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,70,70,0.80)';
    ctx.lineWidth = 2;
    ctx.stroke();
  }
  if (selectedUnit) {
    drawHexPath(ctx, selectedUnit.q, selectedUnit.r);
    ctx.strokeStyle = '#f0c040';
    ctx.lineWidth = 2.5;
    ctx.stroke();
  }
}

export function drawFlashEffects(ctx, effects, now) {
  for (const e of effects) {
    const age = (now - e.startTime) / 1000;
    if (age > 1.2) continue;
    const alpha = Math.max(0, 1 - age / 1.2);
    const { x, y } = hexToPixel(e.q, e.r);
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = e.color;
    ctx.font = 'bold 11px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(e.text, x, y - 20 - age * 18);
    ctx.restore();
  }
}

// ── Per-hex drawing ───────────────────────────────────────────────────────────

function drawTerrainHex(ctx, q, r, key) {
  const t = TERRAIN[key];

  drawHexPath(ctx, q, r);
  ctx.fillStyle = t.color;
  ctx.fill();

  ctx.save();
  drawHexPath(ctx, q, r);
  ctx.clip();

  switch (key) {
    case 'O': fieldTexture(ctx, q, r);    break;
    case 'H': hillTexture(ctx, q, r);     break;
    case 'F': forestTexture(ctx, q, r);   break;
    case 'R': roadTexture(ctx, q, r);     break;
    case 'T': townTexture(ctx, q, r);     break;
    case 'W': waterTexture(ctx, q, r);    break;
  }
  ctx.restore();

  drawHexPath(ctx, q, r);
  ctx.strokeStyle = HEX_BORDER;
  ctx.lineWidth = 0.8;
  ctx.stroke();
}

// ── Shared helpers ────────────────────────────────────────────────────────────

// Sunlit radial gradient (upper-left bright → lower-right shadow)
function sunGrad(ctx, x, y, radius, lightAlpha, shadowAlpha) {
  const lx = x - radius * 0.40;
  const ly = y - radius * 0.48;
  const g = ctx.createRadialGradient(lx, ly, 1, x + radius * 0.25, y + radius * 0.30, radius * 1.1);
  g.addColorStop(0,   `rgba(255,250,220,${lightAlpha})`);
  g.addColorStop(0.45, 'rgba(0,0,0,0)');
  g.addColorStop(1,   `rgba(10,6,0,${shadowAlpha})`);
  return g;
}

// ── Open Field ────────────────────────────────────────────────────────────────
// Pennsylvania summer farmland from ~400ft — patchwork greens with crop texture

function fieldTexture(ctx, q, r) {
  const { x, y } = hexToPixel(q, r);

  // Large color-variation zones (different grass/crop patches)
  for (let i = 0; i < 14; i++) {
    const dx = (hrng(q, r, i)       - 0.5) * 48;
    const dy = (hrng(q, r, i + 50)  - 0.5) * 38;
    const sz =  7 + hrng(q, r, i + 100) * 12;
    const v  = hrng(q, r, i + 150);

    // Range: dark olive (#4a5420) → warm yellow-green (#a0b040)
    const rv = Math.round(58  + v * 52);
    const gv = Math.round(72  + v * 68);
    const bv = Math.round(18  + v * 24);
    ctx.fillStyle = `rgba(${rv},${gv},${bv},0.50)`;
    ctx.beginPath();
    ctx.arc(x + dx, y + dy, sz, 0, Math.PI * 2);
    ctx.fill();
  }

  // Fine grain stipple (dried grass stalks, stones)
  for (let i = 0; i < 22; i++) {
    const dx  = (hrng(q, r, i + 200) - 0.5) * 44;
    const dy  = (hrng(q, r, i + 250) - 0.5) * 34;
    const sz  = 0.6 + hrng(q, r, i + 300) * 1.8;
    const dark = hrng(q, r, i + 350) < 0.55;
    ctx.fillStyle = dark ? 'rgba(28,36,4,0.14)' : 'rgba(185,205,80,0.11)';
    ctx.beginPath();
    ctx.arc(x + dx, y + dy, sz, 0, Math.PI * 2);
    ctx.fill();
  }

  // Crop-row hint (very faint parallel lines)
  ctx.strokeStyle = 'rgba(40,52,8,0.07)';
  ctx.lineWidth = 0.5;
  for (let i = -4; i <= 4; i++) {
    ctx.beginPath();
    ctx.moveTo(x - 26, y + i * 4.5);
    ctx.lineTo(x + 26, y + i * 4.5);
    ctx.stroke();
  }

  // Directional sun shading
  ctx.fillStyle = sunGrad(ctx, x, y, 26, 0.16, 0.14);
  ctx.fillRect(x - 26, y - 26, 52, 52);
}

// ── Hill ──────────────────────────────────────────────────────────────────────
// Rolling Pennsylvania hillside — strong elevation shading, earth & rock tones

function hillTexture(ctx, q, r) {
  const { x, y } = hexToPixel(q, r);

  // Earth-color variation (loam, clay, sandy patches)
  for (let i = 0; i < 12; i++) {
    const dx = (hrng(q, r, i)      - 0.5) * 44;
    const dy = (hrng(q, r, i + 50) - 0.5) * 34;
    const sz =  6 + hrng(q, r, i + 100) * 11;
    const v  = hrng(q, r, i + 150);

    // Range: dark loam (#504030) → bleached sandy (#c8a870)
    const rv = Math.round(82  + v * 78);
    const gv = Math.round(62  + v * 60);
    const bv = Math.round(28  + v * 42);
    ctx.fillStyle = `rgba(${rv},${gv},${bv},0.52)`;
    ctx.beginPath();
    ctx.arc(x + dx, y + dy, sz, 0, Math.PI * 2);
    ctx.fill();
  }

  // Limestone/shale outcrops (light gray patches on Pennsylvania hills)
  for (let i = 0; i < 4; i++) {
    if (hrng(q, r, i + 700) < 0.60) {
      const dx = (hrng(q, r, i + 710) - 0.5) * 32;
      const dy = (hrng(q, r, i + 720) - 0.5) * 22;
      const sz =  2.5 + hrng(q, r, i + 730) * 5;
      ctx.fillStyle = `rgba(165,155,138,${(0.38 + hrng(q, r, i + 740) * 0.28).toFixed(2)})`;
      ctx.beginPath();
      ctx.arc(x + dx, y + dy, sz, 0, Math.PI * 2);
      ctx.fill();
      // Shadow edge on rock
      ctx.fillStyle = 'rgba(50,38,22,0.22)';
      ctx.beginPath();
      ctx.arc(x + dx + sz * 0.5, y + dy + sz * 0.5, sz * 0.7, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // Thin vegetation stripe near the top ridge (sun-facing slope has more grass)
  const vegGrad = ctx.createRadialGradient(x - 8, y - 10, 0, x - 8, y - 10, 18);
  vegGrad.addColorStop(0, 'rgba(72,88,28,0.28)');
  vegGrad.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = vegGrad;
  ctx.fillRect(x - 26, y - 26, 52, 52);

  // Strong directional shading — this sells the elevation
  // Broad sunlit face (upper-left)
  const litFace = ctx.createRadialGradient(x - 12, y - 14, 0, x, y, 28);
  litFace.addColorStop(0, 'rgba(255,248,215,0.36)');
  litFace.addColorStop(0.5, 'rgba(255,245,200,0.10)');
  litFace.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = litFace;
  ctx.fillRect(x - 26, y - 26, 52, 52);

  // Deep shadow face (lower-right)
  const shadow = ctx.createRadialGradient(x + 12, y + 14, 0, x, y, 26);
  shadow.addColorStop(0, 'rgba(8,4,0,0.52)');
  shadow.addColorStop(0.5, 'rgba(8,4,0,0.22)');
  shadow.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = shadow;
  ctx.fillRect(x - 26, y - 26, 52, 52);
}

// ── Forest ────────────────────────────────────────────────────────────────────
// Dense deciduous canopy from above — sun hitting upper-left crown, deep shadows

function forestTexture(ctx, q, r) {
  const { x, y } = hexToPixel(q, r);

  // Build tree positions deterministically
  const trees = [];
  for (let i = 0; i < 11; i++) {
    trees.push({
      dx: (hrng(q, r, i + 600) - 0.5) * 42,
      dy: (hrng(q, r, i + 650) - 0.5) * 32,
      sz:  4.5 + hrng(q, r, i + 700) * 5.5,
      hue: hrng(q, r, i + 760),  // color variation
    });
  }

  // Pass 1: Drop shadows (lower-right offset)
  trees.forEach(({ dx, dy, sz }) => {
    ctx.fillStyle = 'rgba(4,10,2,0.72)';
    ctx.beginPath();
    ctx.arc(x + dx + sz * 0.45, y + dy + sz * 0.45, sz * 0.90, 0, Math.PI * 2);
    ctx.fill();
  });

  // Pass 2: Canopy body (dark forest green, slight color variation)
  trees.forEach(({ dx, dy, sz, hue }) => {
    const g = Math.round(52 + hue * 28);  // 52–80
    const r2 = Math.round(24 + hue * 16); // 24–40
    ctx.fillStyle = `rgba(${r2},${g},10,0.88)`;
    ctx.beginPath();
    ctx.arc(x + dx, y + dy, sz, 0, Math.PI * 2);
    ctx.fill();
  });

  // Pass 3: Sunlit crown highlight (upper-left of each canopy)
  trees.forEach(({ dx, dy, sz, hue }) => {
    const hlx = x + dx - sz * 0.28;
    const hly = y + dy - sz * 0.32;
    const hlg = ctx.createRadialGradient(hlx, hly, 0, hlx, hly, sz * 0.72);
    const bright = Math.round(90 + hue * 55);  // 90–145 (yellow-green)
    hlg.addColorStop(0, `rgba(${bright - 10},${bright + 20},${Math.round(bright * 0.28)},0.75)`);
    hlg.addColorStop(0.55, `rgba(55,95,18,0.28)`);
    hlg.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = hlg;
    ctx.beginPath();
    ctx.arc(x + dx, y + dy, sz, 0, Math.PI * 2);
    ctx.fill();
  });

  // Overall forest shadow vignette (interior is darker)
  const vignette = ctx.createRadialGradient(x - 6, y - 8, 4, x, y, 24);
  vignette.addColorStop(0, 'rgba(0,0,0,0)');
  vignette.addColorStop(1, 'rgba(2,8,1,0.28)');
  ctx.fillStyle = vignette;
  ctx.fillRect(x - 26, y - 26, 52, 52);
}

// ── Road ──────────────────────────────────────────────────────────────────────
// Civil War era dirt road — worn earth, hoof & wheel tracks, dusty center

function roadTexture(ctx, q, r) {
  const { x, y } = hexToPixel(q, r);

  // Field-like base underneath (road runs through fields)
  for (let i = 0; i < 8; i++) {
    const dx = (hrng(q, r, i)      - 0.5) * 46;
    const dy = (hrng(q, r, i + 50) - 0.5) * 36;
    const sz =  5 + hrng(q, r, i + 100) * 9;
    const v  = hrng(q, r, i + 150);
    const rv = Math.round(60 + v * 48);
    const gv = Math.round(72 + v * 60);
    const bv = Math.round(18 + v * 20);
    ctx.fillStyle = `rgba(${rv},${gv},${bv},0.40)`;
    ctx.beginPath();
    ctx.arc(x + dx, y + dy, sz, 0, Math.PI * 2);
    ctx.fill();
  }

  // Road band (soft edges — packed earth is not ruler-straight)
  const roadGrad = ctx.createLinearGradient(x, y - 8, x, y + 8);
  roadGrad.addColorStop(0,   'rgba(60,42,12,0.18)');
  roadGrad.addColorStop(0.2, 'rgba(164,138,72,0.52)');
  roadGrad.addColorStop(0.5, 'rgba(188,164,90,0.62)');
  roadGrad.addColorStop(0.8, 'rgba(164,138,72,0.52)');
  roadGrad.addColorStop(1,   'rgba(60,42,12,0.18)');
  ctx.fillStyle = roadGrad;
  ctx.fillRect(x - 26, y - 8, 52, 16);

  // Wheel rut shadows (two parallel depressions)
  ctx.fillStyle = 'rgba(38,25,6,0.28)';
  ctx.fillRect(x - 26, y - 3, 52, 2);
  ctx.fillRect(x - 26, y + 1, 52, 2);

  // Dusty / sunlit center ridge between ruts
  ctx.fillStyle = 'rgba(218,198,140,0.22)';
  ctx.fillRect(x - 26, y - 1, 52, 2);

  // Overall sun shading on road
  ctx.fillStyle = sunGrad(ctx, x, y, 22, 0.10, 0.08);
  ctx.fillRect(x - 26, y - 10, 52, 20);
}

// ── Town ──────────────────────────────────────────────────────────────────────
// Small 1860s Pennsylvania town from above — rooftops, streets, yards

function townTexture(ctx, q, r) {
  const { x, y } = hexToPixel(q, r);

  // Ground surface (packed earth / stone street grid)
  // Slightly lighter than open field — more urban surface
  ctx.fillStyle = 'rgba(72,62,50,0.30)';
  ctx.fillRect(x - 26, y - 26, 52, 52);

  // Building footprints (top-down = just the flat roof)
  const blds = [
    { bx: -13, by: -11, bw: 8,  bh: 7,  roof: 0 },
    { bx: -3,  by: -12, bw: 7,  bh: 6,  roof: 2 },
    { bx:  5,  by: -10, bw: 9,  bh: 7,  roof: 1 },
    { bx: -12, by:  1,  bw: 6,  bh: 6,  roof: 3 },
    { bx: -4,  by:  2,  bw: 8,  bh: 6,  roof: 0 },
    { bx:  5,  by:  3,  bw: 7,  bh: 5,  roof: 2 },
  ];

  // Roof colors: slate gray, red-brown brick, tan limestone, dark wood
  const roofFill  = ['rgba(95,88,80,0.88)', 'rgba(135,82,52,0.85)', 'rgba(158,140,108,0.82)', 'rgba(72,60,48,0.88)'];
  const roofShad  = 'rgba(0,0,0,0.32)';
  const roofLight = 'rgba(255,255,255,0.13)';

  blds.forEach(({ bx, by, bw, bh, roof }) => {
    const rx = x + bx, ry = y + by;

    // Roof fill
    ctx.fillStyle = roofFill[roof];
    ctx.fillRect(rx, ry, bw, bh);

    // Shadow strips (lower + right edges — buildings have height)
    ctx.fillStyle = roofShad;
    ctx.fillRect(rx + bw - 2, ry, 2, bh);  // right shadow
    ctx.fillRect(rx, ry + bh - 2, bw, 2);  // bottom shadow

    // Highlight strips (upper + left edges — catching sunlight)
    ctx.fillStyle = roofLight;
    ctx.fillRect(rx, ry, bw, 1.2);         // top highlight
    ctx.fillRect(rx, ry, 1.2, bh);         // left highlight
  });

  // Small garden/yard (green patch in the gaps)
  ctx.fillStyle = 'rgba(42,62,18,0.60)';
  ctx.beginPath();
  ctx.ellipse(x + 10, y - 2, 3.5, 2.5, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(x - 6, y + 10, 2.5, 2, 0.4, 0, Math.PI * 2);
  ctx.fill();

  // Subtle overall sun shading
  ctx.fillStyle = sunGrad(ctx, x, y, 24, 0.10, 0.12);
  ctx.fillRect(x - 26, y - 26, 52, 52);
}

// ── Water ─────────────────────────────────────────────────────────────────────
// River/creek from above — deep blue-green with sun glint and gentle current

function waterTexture(ctx, q, r) {
  const { x, y } = hexToPixel(q, r);

  // Depth variation bands (darker in the channel, lighter at banks)
  for (let i = 0; i < 6; i++) {
    const oy = -10 + i * 4;
    const depth = (i === 0 || i === 5) ? 0.18 : (i === 1 || i === 4) ? 0.10 : 0.06;
    ctx.fillStyle = `rgba(12,28,52,${depth})`;
    ctx.fillRect(x - 26, y + oy, 52, 4);
  }

  // Gentle current ripples (bezier waves, subtle)
  const ripplesAlpha = [0.42, 0.28, 0.34];
  for (let i = -1; i <= 1; i++) {
    const oy = i * 5.5;
    ctx.strokeStyle = `rgba(120,180,235,${ripplesAlpha[i + 1]})`;
    ctx.lineWidth = i === 0 ? 1.0 : 0.7;
    ctx.beginPath();
    ctx.moveTo(x - 22, y + oy);
    ctx.bezierCurveTo(
      x - 12, y + oy + 2.5,
      x,      y + oy - 2.0,
      x + 12, y + oy + 1.8
    );
    ctx.bezierCurveTo(
      x + 16, y + oy + 2.5,
      x + 20, y + oy + 0.5,
      x + 22, y + oy
    );
    ctx.stroke();
  }

  // Sun glint (specular highlight, upper-left)
  const glint = ctx.createRadialGradient(x - 8, y - 6, 0, x - 8, y - 6, 12);
  glint.addColorStop(0,   'rgba(210,238,255,0.58)');
  glint.addColorStop(0.35, 'rgba(175,220,255,0.24)');
  glint.addColorStop(1,   'rgba(0,0,0,0)');
  ctx.fillStyle = glint;
  ctx.fillRect(x - 22, y - 18, 28, 28);

  // Deep channel center (darker blue)
  const deep = ctx.createRadialGradient(x + 2, y + 2, 2, x + 2, y + 2, 18);
  deep.addColorStop(0, 'rgba(8,18,40,0.28)');
  deep.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = deep;
  ctx.fillRect(x - 24, y - 20, 48, 40);
}

import { TERRAIN, W, H } from './constants.js';
import { hexToPixel, drawHexPath } from './hex.js';

// CWG-faithful orange-red hex border
const HEX_BORDER = 'rgba(185,58,18,0.72)';

// Deterministic hash — same (q,r,idx) always yields same value in [0,1]
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

// ── Public draw functions ─────────────────────────────────────────────────────

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
    // Warm parchment wash over the whole map
    off.fillStyle = 'rgba(220,190,100,0.04)';
    off.fillRect(0, 0, W, H);
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

  // Base fill
  drawHexPath(ctx, q, r);
  ctx.fillStyle = t.color;
  ctx.fill();

  // Clipped texture layer
  ctx.save();
  drawHexPath(ctx, q, r);
  ctx.clip();
  switch (key) {
    case 'O': fieldTexture(ctx, q, r);  break;
    case 'H': hillTexture(ctx, q, r);   break;
    case 'F': forestTexture(ctx, q, r); break;
    case 'R': roadTexture(ctx, q, r);   break;
    case 'T': townTexture(ctx, q, r);   break;
    case 'W': waterTexture(ctx, q, r);  break;
  }
  ctx.restore();

  // Thin orange-red hex border
  drawHexPath(ctx, q, r);
  ctx.strokeStyle = HEX_BORDER;
  ctx.lineWidth = 0.9;
  ctx.stroke();
}

// ── Texture functions ─────────────────────────────────────────────────────────

function fieldTexture(ctx, q, r) {
  const { x, y } = hexToPixel(q, r);

  // Dark stipple dots — dried grass look
  for (let i = 0; i < 24; i++) {
    const dx = (hrng(q, r, i)      - 0.5) * 42;
    const dy = (hrng(q, r, i + 50) - 0.5) * 30;
    const sz = hrng(q, r, i + 100) * 1.8 + 0.4;
    const al = 0.07 + hrng(q, r, i + 150) * 0.10;
    ctx.fillStyle = `rgba(55,45,0,${al.toFixed(2)})`;
    ctx.beginPath();
    ctx.arc(x + dx, y + dy, sz, 0, Math.PI * 2);
    ctx.fill();
  }

  // Occasional lighter highlight flecks
  for (let i = 0; i < 8; i++) {
    const dx = (hrng(q, r, i + 200) - 0.5) * 40;
    const dy = (hrng(q, r, i + 250) - 0.5) * 28;
    ctx.fillStyle = 'rgba(240,230,150,0.07)';
    ctx.beginPath();
    ctx.arc(x + dx, y + dy, hrng(q, r, i + 300) * 1.2 + 0.3, 0, Math.PI * 2);
    ctx.fill();
  }

  // Short grass-stroke suggestion (very faint)
  ctx.strokeStyle = 'rgba(50,55,0,0.08)';
  ctx.lineWidth = 0.6;
  for (let i = 0; i < 6; i++) {
    const sx = x + (hrng(q, r, i + 350) - 0.5) * 36;
    const sy = y + (hrng(q, r, i + 400) - 0.5) * 24;
    const len = 3 + hrng(q, r, i + 450) * 4;
    const ang = -Math.PI / 2 + (hrng(q, r, i + 500) - 0.5) * 0.8;
    ctx.beginPath();
    ctx.moveTo(sx, sy);
    ctx.lineTo(sx + Math.cos(ang) * len, sy + Math.sin(ang) * len);
    ctx.stroke();
  }
}

function hillTexture(ctx, q, r) {
  const { x, y } = hexToPixel(q, r);

  // Contour / relief lines — gently curved
  ctx.strokeStyle = 'rgba(70,42,5,0.20)';
  ctx.lineWidth = 0.9;
  for (let i = 0; i < 4; i++) {
    const oy = -9 + i * 6;
    const w = 14 - i * 1;
    ctx.beginPath();
    ctx.moveTo(x - w, y + oy + hrng(q, r, i) * 3);
    ctx.bezierCurveTo(
      x - w * 0.4, y + oy - 2 + hrng(q, r, i + 10) * 3,
      x + w * 0.4, y + oy + 2 + hrng(q, r, i + 20) * 3,
      x + w,       y + oy + hrng(q, r, i + 30) * 3
    );
    ctx.stroke();
  }

  // Sunlit shoulder highlight
  ctx.fillStyle = 'rgba(255,215,130,0.10)';
  ctx.beginPath();
  ctx.ellipse(x - 5, y - 7, 10, 6, -0.3, 0, Math.PI * 2);
  ctx.fill();

  // Shadow side
  ctx.fillStyle = 'rgba(40,20,0,0.08)';
  ctx.beginPath();
  ctx.ellipse(x + 6, y + 5, 9, 5, 0.3, 0, Math.PI * 2);
  ctx.fill();

  // Light stipple
  for (let i = 0; i < 14; i++) {
    const dx = (hrng(q, r, i + 400) - 0.5) * 40;
    const dy = (hrng(q, r, i + 450) - 0.5) * 28;
    const al = 0.05 + hrng(q, r, i + 500) * 0.09;
    ctx.fillStyle = `rgba(55,30,0,${al.toFixed(2)})`;
    ctx.beginPath();
    ctx.arc(x + dx, y + dy, hrng(q, r, i + 550) * 1.5 + 0.4, 0, Math.PI * 2);
    ctx.fill();
  }
}

function forestTexture(ctx, q, r) {
  const { x, y } = hexToPixel(q, r);

  // Canopy blobs — dark green overlapping circles with subtle highlights
  const spots = [
    [-9, -5], [5, -7], [0, -9], [-5, 3], [8, 1], [-11, 2], [3, 7], [10, -3],
  ];
  spots.forEach(([bdx, bdy], i) => {
    const jx = (hrng(q, r, i + 600) - 0.5) * 4;
    const jy = (hrng(q, r, i + 650) - 0.5) * 4;
    const sz = 4.5 + hrng(q, r, i + 700) * 3.5;
    const cx2 = x + bdx + jx;
    const cy2 = y + bdy + jy;

    // Shadow base
    ctx.fillStyle = 'rgba(15,35,5,0.65)';
    ctx.beginPath();
    ctx.arc(cx2 + 1, cy2 + 1, sz, 0, Math.PI * 2);
    ctx.fill();

    // Mid-tone canopy
    ctx.fillStyle = `rgba(38,68,14,0.75)`;
    ctx.beginPath();
    ctx.arc(cx2, cy2, sz, 0, Math.PI * 2);
    ctx.fill();

    // Lighter highlight top-left
    ctx.fillStyle = 'rgba(85,125,30,0.45)';
    ctx.beginPath();
    ctx.arc(cx2 - sz * 0.25, cy2 - sz * 0.3, sz * 0.55, 0, Math.PI * 2);
    ctx.fill();
  });
}

function roadTexture(ctx, q, r) {
  const { x, y } = hexToPixel(q, r);

  // Wide sandy band with soft edges
  const grad = ctx.createLinearGradient(x, y - 7, x, y + 7);
  grad.addColorStop(0,   'rgba(100,70,15,0.18)');
  grad.addColorStop(0.2, 'rgba(200,175,90,0.22)');
  grad.addColorStop(0.5, 'rgba(215,190,105,0.25)');
  grad.addColorStop(0.8, 'rgba(200,175,90,0.22)');
  grad.addColorStop(1,   'rgba(100,70,15,0.18)');
  ctx.fillStyle = grad;
  ctx.fillRect(x - 20, y - 7, 40, 14);

  // Faint wheel-rut lines
  ctx.strokeStyle = 'rgba(80,55,10,0.18)';
  ctx.lineWidth = 0.7;
  ctx.setLineDash([4, 3]);
  ctx.beginPath();
  ctx.moveTo(x - 20, y - 2);
  ctx.lineTo(x + 20, y - 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(x - 20, y + 2);
  ctx.lineTo(x + 20, y + 2);
  ctx.stroke();
  ctx.setLineDash([]);
}

function townTexture(ctx, q, r) {
  const { x, y } = hexToPixel(q, r);

  // Building footprints
  const blds = [
    { bx: -10, by: -7, bw: 8, bh: 6 },
    { bx:  1,  by: -5, bw: 7, bh: 7 },
    { bx: -5,  by:  2, bw: 6, bh: 5 },
    { bx:  4,  by:  1, bw: 8, bh: 5 },
  ];

  blds.forEach(({ bx, by, bw, bh }) => {
    // Wall
    ctx.fillStyle = 'rgba(185,165,120,0.78)';
    ctx.fillRect(x + bx, y + by, bw, bh);

    // Roof (triangle)
    ctx.fillStyle = 'rgba(110,65,35,0.60)';
    ctx.beginPath();
    ctx.moveTo(x + bx - 1,      y + by);
    ctx.lineTo(x + bx + bw / 2, y + by - 3.5);
    ctx.lineTo(x + bx + bw + 1, y + by);
    ctx.closePath();
    ctx.fill();

    // Wall outline
    ctx.strokeStyle = 'rgba(60,38,18,0.40)';
    ctx.lineWidth = 0.6;
    ctx.strokeRect(x + bx, y + by, bw, bh);
  });
}

function waterTexture(ctx, q, r) {
  const { x, y } = hexToPixel(q, r);

  // Reflection highlight
  ctx.fillStyle = 'rgba(190,220,255,0.10)';
  ctx.beginPath();
  ctx.ellipse(x, y - 5, 12, 5, 0, 0, Math.PI * 2);
  ctx.fill();

  // Wavy ripple lines
  for (let i = -1; i <= 1; i++) {
    const oy = i * 6;
    ctx.strokeStyle = i === 0
      ? 'rgba(200,235,255,0.42)'
      : 'rgba(180,220,255,0.28)';
    ctx.lineWidth = i === 0 ? 1.1 : 0.8;
    ctx.beginPath();
    ctx.moveTo(x - 14, y + oy);
    ctx.bezierCurveTo(
      x - 7,  y + oy + 2.5,
      x + 1,  y + oy - 2,
      x + 8,  y + oy + 1.5
    );
    ctx.bezierCurveTo(
      x + 11, y + oy + 2.5,
      x + 13, y + oy + 0.5,
      x + 14, y + oy
    );
    ctx.stroke();
  }
}

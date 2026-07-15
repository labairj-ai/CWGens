import { HEX_SIZE, COLORS } from './constants.js';
import { hexToPixel } from './hex.js';

const U = { uniform: '#1a478f', hat: '#0c2558' };  // Union blue
const C = { uniform: '#6e6347', hat: '#443f2c' };  // Confederate gray

const SKIN   = '#c8925a';
const GUN    = '#1a0e04';
const HORSE  = '#5a3c24';
const CANNON = '#322a1a';

export function drawUnit(ctx, unit, isSelected, isActive, alpha = 1) {
  const { x, y } = hexToPixel(unit.q, unit.r);
  ctx.save();
  ctx.globalAlpha = unit.routed ? alpha * 0.35 : alpha;

  const col = unit.side === 'union' ? U : C;

  if (isSelected) {
    ctx.shadowColor = COLORS.gold;
    ctx.shadowBlur = 14;
  }

  const gy = y + 3;  // ground level (feet of figures)

  switch (unit.type) {
    case 'infantry':  drawInfantry(ctx, x, gy, col);  break;
    case 'cavalry':   drawCavalry(ctx, x, gy, col);   break;
    case 'artillery': drawArtillery(ctx, x, gy, col); break;
    case 'general':   drawGeneral(ctx, x, gy, col);   break;
  }

  ctx.shadowBlur = 0;

  // Strength + morale badge
  const by = y + 10;
  const mc = unit.morale > 60 ? '#44dd44' : unit.morale > 30 ? '#ffcc00' : '#ff4444';

  ctx.fillStyle = 'rgba(0,0,0,0.72)';
  ctx.fillRect(x - 11, by - 5, 22, 10);

  ctx.fillStyle = mc;
  ctx.beginPath();
  ctx.arc(x - 6, by, 2.5, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#fff';
  ctx.font = `bold ${Math.round(HEX_SIZE * 0.42)}px monospace`;
  ctx.textAlign = 'right';
  ctx.textBaseline = 'middle';
  ctx.fillText(Math.ceil(unit.strength), x + 9, by);

  if (isActive) {
    ctx.strokeStyle = '#ffff00';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([3, 2]);
    ctx.strokeRect(x - 15, y - 13, 30, 26);
    ctx.setLineDash([]);
  }

  if ((unit.hasMoved || unit.hasAttacked) && !unit.routed) {
    ctx.fillStyle = 'rgba(0,0,0,0.28)';
    ctx.fillRect(x - 15, y - 13, 30, 26);
  }

  ctx.restore();
}

// ── Individual soldier figure — feet at (cx, cy), ~12px tall ─────────────────
function fig(ctx, cx, cy, col) {
  cx = Math.round(cx);

  // Ground shadow
  ctx.fillStyle = 'rgba(0,0,0,0.18)';
  ctx.beginPath();
  ctx.ellipse(cx, cy, 3, 0.7, 0, 0, Math.PI * 2);
  ctx.fill();

  // Legs
  ctx.fillStyle = col.uniform;
  ctx.fillRect(cx - 1, cy - 3, 2, 3);

  // Body
  ctx.fillRect(cx - 2, cy - 7, 4, 4);

  // Rifle (angled up-right from right shoulder)
  ctx.strokeStyle = GUN;
  ctx.lineWidth = 0.8;
  ctx.beginPath();
  ctx.moveTo(cx + 2, cy - 6.5);
  ctx.lineTo(cx + 5, cy - 10.5);
  ctx.stroke();

  // Head (skin tone)
  ctx.fillStyle = SKIN;
  ctx.beginPath();
  ctx.arc(cx, cy - 8.5, 1.5, 0, Math.PI * 2);
  ctx.fill();

  // Kepi hat — brim + crown
  ctx.fillStyle = col.hat;
  ctx.fillRect(cx - 2, cy - 10.5, 4, 1);
  ctx.fillRect(cx - 1.5, cy - 12, 3, 1.5);
}

// ── Infantry: 3 soldiers in a loose V formation ──────────────────────────────
function drawInfantry(ctx, cx, cy, col) {
  fig(ctx, cx,     cy - 3, col);  // back center (depth)
  fig(ctx, cx - 7, cy,     col);  // front left
  fig(ctx, cx + 7, cy,     col);  // front right
}

// ── Single horse + mounted rider ─────────────────────────────────────────────
function horseRider(ctx, cx, cy, col) {
  cx = Math.round(cx);

  // Shadow
  ctx.fillStyle = 'rgba(0,0,0,0.18)';
  ctx.beginPath();
  ctx.ellipse(cx, cy, 7, 1.2, 0, 0, Math.PI * 2);
  ctx.fill();

  // Four legs
  ctx.strokeStyle = '#3a2818';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(cx - 4, cy - 1); ctx.lineTo(cx - 4, cy + 2);
  ctx.moveTo(cx - 1, cy - 1); ctx.lineTo(cx - 1, cy + 2);
  ctx.moveTo(cx + 2, cy - 1); ctx.lineTo(cx + 2, cy + 2);
  ctx.moveTo(cx + 5, cy - 1); ctx.lineTo(cx + 5, cy + 2);
  ctx.stroke();

  // Horse body
  ctx.fillStyle = HORSE;
  ctx.beginPath();
  ctx.ellipse(cx, cy - 4, 6.5, 3, 0.08, 0, Math.PI * 2);
  ctx.fill();

  // Neck + head (facing right)
  ctx.beginPath();
  ctx.moveTo(cx + 5, cy - 5);
  ctx.quadraticCurveTo(cx + 9, cy - 8, cx + 8, cy - 5);
  ctx.quadraticCurveTo(cx + 6, cy - 3, cx + 4, cy - 2);
  ctx.closePath();
  ctx.fill();

  // Tail
  ctx.strokeStyle = '#3a2818';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(cx - 6, cy - 4);
  ctx.quadraticCurveTo(cx - 10, cy - 5, cx - 9, cy - 2);
  ctx.stroke();

  // Rider body
  ctx.fillStyle = col.uniform;
  ctx.fillRect(cx - 2, cy - 10, 4, 5);

  // Rider head
  ctx.fillStyle = SKIN;
  ctx.beginPath();
  ctx.arc(cx, cy - 11.5, 1.5, 0, Math.PI * 2);
  ctx.fill();

  // Rider hat
  ctx.fillStyle = col.hat;
  ctx.fillRect(cx - 2, cy - 13.5, 4, 1);
  ctx.fillRect(cx - 1.5, cy - 15, 3, 1.5);

  // Saber raised
  ctx.strokeStyle = '#c8c050';
  ctx.lineWidth = 0.8;
  ctx.beginPath();
  ctx.moveTo(cx + 2, cy - 9.5);
  ctx.lineTo(cx + 7, cy - 14);
  ctx.stroke();
}

// ── Cavalry: 2 horse+rider pairs with depth offset ───────────────────────────
function drawCavalry(ctx, cx, cy, col) {
  horseRider(ctx, cx - 7, cy,     col);  // front
  horseRider(ctx, cx + 7, cy - 2, col);  // back (slightly higher = further)
}

// ── Artillery: cannon on carriage + one crew member ──────────────────────────
function drawArtillery(ctx, cx, cy, col) {
  const bx = cx - 4;  // cannon barrel center

  // Ground shadow
  ctx.fillStyle = 'rgba(0,0,0,0.18)';
  ctx.beginPath();
  ctx.ellipse(bx, cy, 10, 1, 0, 0, Math.PI * 2);
  ctx.fill();

  // Rear (smaller) wheel
  ctx.strokeStyle = '#2a2010';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(bx + 4, cy - 3, 3.5, 0, Math.PI * 2);
  ctx.stroke();

  // Cannon barrel (dark iron)
  ctx.fillStyle = CANNON;
  ctx.fillRect(Math.round(bx) - 8, cy - 8, 14, 4);

  // Front (large) wheel with spokes
  ctx.strokeStyle = '#2a2010';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(bx - 5, cy - 3, 5, 0, Math.PI * 2);
  ctx.stroke();
  ctx.lineWidth = 0.6;
  for (let i = 0; i < 4; i++) {
    const a = (i * Math.PI) / 4;
    ctx.beginPath();
    ctx.moveTo(bx - 5 + Math.cos(a) * 5, cy - 3 + Math.sin(a) * 5);
    ctx.lineTo(bx - 5 - Math.cos(a) * 5, cy - 3 - Math.sin(a) * 5);
    ctx.stroke();
  }

  // Crew member standing to the right
  fig(ctx, cx + 9, cy, col);
}

// ── General: single taller officer with sword + gold sash ────────────────────
function drawGeneral(ctx, cx, cy, col) {
  cx = Math.round(cx);

  // Shadow
  ctx.fillStyle = 'rgba(0,0,0,0.22)';
  ctx.beginPath();
  ctx.ellipse(cx, cy, 4, 1, 0, 0, Math.PI * 2);
  ctx.fill();

  // Legs
  ctx.fillStyle = col.uniform;
  ctx.fillRect(cx - 1.5, cy - 3.5, 3, 3.5);

  // Body (slightly wider than enlisted)
  ctx.fillRect(cx - 2.5, cy - 8.5, 5, 5);

  // Gold sash across chest
  ctx.fillStyle = COLORS.gold;
  ctx.fillRect(cx - 2.5, cy - 6.5, 5, 1.5);

  // Sword raised to upper-left
  ctx.strokeStyle = '#d8d050';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(cx - 1, cy - 7.5);
  ctx.lineTo(cx - 6, cy - 13.5);
  ctx.stroke();
  // Cross-guard
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(cx - 4, cy - 10);
  ctx.lineTo(cx + 1, cy - 11.5);
  ctx.stroke();

  // Head (slightly larger than enlisted)
  ctx.fillStyle = SKIN;
  ctx.beginPath();
  ctx.arc(cx, cy - 10.5, 2, 0, Math.PI * 2);
  ctx.fill();

  // Officer hat — taller crown than kepi
  ctx.fillStyle = col.hat;
  ctx.fillRect(cx - 2.5, cy - 13, 5, 1.2);  // brim
  ctx.fillRect(cx - 2, cy - 16.5, 4, 3.5);  // tall crown

  // Gold hat badge
  ctx.fillStyle = COLORS.gold;
  ctx.beginPath();
  ctx.arc(cx, cy - 15, 1.2, 0, Math.PI * 2);
  ctx.fill();
}

export function drawAllUnits(ctx, units, selectedUnit, aiActiveUnit) {
  for (const unit of units) {
    if (unit.routed) continue;
    const isSelected = selectedUnit && selectedUnit.id === unit.id;
    const isActive = aiActiveUnit && aiActiveUnit.id === unit.id;
    drawUnit(ctx, unit, isSelected, isActive);
  }
}

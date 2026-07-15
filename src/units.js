import { HEX_SIZE, COLORS } from './constants.js';
import { hexToPixel } from './hex.js';

const U = { uniform: '#1a478f', hat: '#0c2558' };
const C = { uniform: '#6e6347', hat: '#443f2c' };

const SKIN    = '#c8925a';
const GUN     = '#1a0e04';
const HORSE   = '#5a3c24';   // dark bay — cavalry
const HORSE_G = '#7a5040';   // chestnut — general's horse
const CANNON  = '#322a1a';

export function drawUnit(ctx, unit, isSelected, isActive, alpha = 1) {
  const { x, y } = hexToPixel(unit.q, unit.r);
  ctx.save();
  ctx.globalAlpha = unit.routed ? alpha * 0.35 : alpha;

  const col = unit.side === 'union' ? U : C;

  // Earthwork arc when dug in
  if (unit.dugIn) {
    ctx.strokeStyle = '#7a5018';
    ctx.lineWidth = 2.2;
    ctx.setLineDash([2.5, 2]);
    ctx.beginPath();
    ctx.arc(x, y + 5, 14, Math.PI * 0.12, Math.PI * 0.88);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  if (isSelected) {
    ctx.shadowColor = COLORS.gold;
    ctx.shadowBlur = 14;
  }

  const gy = y + 3;

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

  if (unit.dugIn) {
    ctx.fillStyle = '#c8921a';
    ctx.font = '7px monospace';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText('DUG', x - 10, by - 3);
  }

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

// ── Individual soldier figure — feet at (cx, cy) ──────────────────────────────
function fig(ctx, cx, cy, col) {
  cx = Math.round(cx);

  // Ground shadow
  ctx.fillStyle = 'rgba(0,0,0,0.20)';
  ctx.beginPath();
  ctx.ellipse(cx, cy, 3.2, 0.8, 0, 0, Math.PI * 2);
  ctx.fill();

  // Boots
  ctx.fillStyle = '#0e0804';
  ctx.fillRect(cx - 1.8, cy - 1.4, 1.6, 1.4);
  ctx.fillRect(cx + 0.2, cy - 1.4, 1.6, 1.4);

  // Legs (slightly separated)
  ctx.fillStyle = col.uniform;
  ctx.fillRect(cx - 1.6, cy - 4.2, 1.4, 3);
  ctx.fillRect(cx + 0.2, cy - 4.2, 1.4, 3);

  // Body
  ctx.fillRect(cx - 2.2, cy - 8.2, 4.4, 4.2);

  // Body shading (right-side shadow for depth)
  ctx.fillStyle = 'rgba(0,0,0,0.18)';
  ctx.fillRect(cx + 0.8, cy - 8.2, 1.4, 4.2);

  // Belt
  ctx.fillStyle = '#1a0e04';
  ctx.fillRect(cx - 2.4, cy - 5, 4.8, 1.1);

  // Cartridge box (right hip)
  ctx.fillRect(cx + 1, cy - 5.8, 1.8, 1.8);

  // Rifle (angled up-right)
  ctx.strokeStyle = GUN;
  ctx.lineWidth = 0.9;
  ctx.beginPath();
  ctx.moveTo(cx + 1.6, cy - 6.8);
  ctx.lineTo(cx + 5.2, cy - 11);
  ctx.stroke();

  // Bayonet
  ctx.lineWidth = 0.5;
  ctx.strokeStyle = '#808888';
  ctx.beginPath();
  ctx.moveTo(cx + 5.2, cy - 11);
  ctx.lineTo(cx + 6.2, cy - 13);
  ctx.stroke();

  // Head
  ctx.fillStyle = SKIN;
  ctx.beginPath();
  ctx.arc(cx, cy - 9.5, 1.8, 0, Math.PI * 2);
  ctx.fill();

  // Kepi — brim + crown
  ctx.fillStyle = col.hat;
  ctx.fillRect(cx - 2.4, cy - 11.4, 4.8, 1);
  ctx.fillRect(cx - 2.0, cy - 13.0, 4.0, 1.8);

  // Brass hat badge
  ctx.fillStyle = '#c8a040';
  ctx.fillRect(cx - 0.5, cy - 12.6, 1.1, 1.1);
}

// ── Infantry: 3 soldiers V formation ─────────────────────────────────────────
function drawInfantry(ctx, cx, cy, col) {
  fig(ctx, cx,     cy - 3, col);
  fig(ctx, cx - 7, cy,     col);
  fig(ctx, cx + 7, cy,     col);
}

// ── Horse + mounted rider (shared by cavalry + general) ───────────────────────
function horseRider(ctx, cx, cy, col, horseColor, showSaber) {
  cx = Math.round(cx);
  const hc = horseColor;

  // Shadow
  ctx.fillStyle = 'rgba(0,0,0,0.22)';
  ctx.beginPath();
  ctx.ellipse(cx, cy, 7.5, 1.4, 0, 0, Math.PI * 2);
  ctx.fill();

  // Legs with bent-knee suggestion
  ctx.strokeStyle = '#2a1808';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(cx + 4,  cy - 2); ctx.lineTo(cx + 4.5, cy + 1); ctx.lineTo(cx + 3.5, cy + 2);
  ctx.moveTo(cx + 6,  cy - 1); ctx.lineTo(cx + 6.5, cy + 1); ctx.lineTo(cx + 5.5, cy + 2);
  ctx.moveTo(cx - 3,  cy - 1); ctx.lineTo(cx - 3.5, cy + 1); ctx.lineTo(cx - 2.5, cy + 2);
  ctx.moveTo(cx - 5,  cy - 2); ctx.lineTo(cx - 5.5, cy + 1); ctx.lineTo(cx - 4.5, cy + 2);
  ctx.stroke();

  // Horse body
  ctx.fillStyle = hc;
  ctx.beginPath();
  ctx.ellipse(cx, cy - 4.5, 7, 3.2, 0.06, 0, Math.PI * 2);
  ctx.fill();

  // Haunch highlight
  ctx.fillStyle = 'rgba(255,255,255,0.09)';
  ctx.beginPath();
  ctx.ellipse(cx - 3, cy - 5.5, 3, 1.5, -0.2, 0, Math.PI * 2);
  ctx.fill();

  // Neck + head (facing right)
  ctx.fillStyle = hc;
  ctx.beginPath();
  ctx.moveTo(cx + 4.5, cy - 6.5);
  ctx.quadraticCurveTo(cx + 9,   cy - 9.5, cx + 8,   cy - 6);
  ctx.quadraticCurveTo(cx + 5.5, cy - 3,   cx + 4,   cy - 3);
  ctx.closePath();
  ctx.fill();

  // Mane (dark filled shape along crest)
  ctx.fillStyle = 'rgba(0,0,0,0.38)';
  ctx.beginPath();
  ctx.moveTo(cx + 4.5, cy - 7.5);
  ctx.quadraticCurveTo(cx + 8.5, cy - 10,  cx + 7.5, cy - 7.5);
  ctx.quadraticCurveTo(cx + 6,   cy - 5.5, cx + 4.5, cy - 6.5);
  ctx.closePath();
  ctx.fill();

  // Ear
  ctx.fillStyle = hc;
  ctx.beginPath();
  ctx.moveTo(cx + 7, cy - 8.5); ctx.lineTo(cx + 7.8, cy - 10.5); ctx.lineTo(cx + 8.4, cy - 8.5);
  ctx.closePath();
  ctx.fill();

  // Eye
  ctx.fillStyle = '#1a0e04';
  ctx.beginPath();
  ctx.arc(cx + 7.8, cy - 7.2, 0.65, 0, Math.PI * 2);
  ctx.fill();

  // Tail
  ctx.strokeStyle = '#2a1808';
  ctx.lineWidth = 1.3;
  ctx.beginPath();
  ctx.moveTo(cx - 7, cy - 5.5);
  ctx.quadraticCurveTo(cx - 11, cy - 7.5, cx - 10, cy - 3);
  ctx.stroke();

  // Bridle line
  ctx.strokeStyle = 'rgba(110,85,25,0.85)';
  ctx.lineWidth = 0.7;
  ctx.beginPath();
  ctx.arc(cx + 8, cy - 6.8, 1.6, 0.4, Math.PI - 0.4);
  ctx.stroke();

  // Rider body
  ctx.fillStyle = col.uniform;
  ctx.fillRect(cx - 2.5, cy - 11.5, 5, 5.5);

  // Rider body shadow
  ctx.fillStyle = 'rgba(0,0,0,0.15)';
  ctx.fillRect(cx + 0.5, cy - 11.5, 2, 5.5);

  // Belt
  ctx.fillStyle = '#1a0e04';
  ctx.fillRect(cx - 2.5, cy - 7.2, 5, 1.1);

  // Rider head
  ctx.fillStyle = SKIN;
  ctx.beginPath();
  ctx.arc(cx, cy - 12.5, 1.7, 0, Math.PI * 2);
  ctx.fill();

  // Hat brim + crown
  ctx.fillStyle = col.hat;
  ctx.fillRect(cx - 2.2, cy - 14.4, 4.4, 1);
  ctx.fillRect(cx - 1.8, cy - 16.2, 3.6, 1.8);

  if (showSaber) {
    // Saber raised
    ctx.strokeStyle = '#d0c050';
    ctx.lineWidth = 0.9;
    ctx.beginPath();
    ctx.moveTo(cx + 2, cy - 10.5);
    ctx.lineTo(cx + 7.5, cy - 16);
    ctx.stroke();
    // Cross-guard
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(cx + 4, cy - 12.5);
    ctx.lineTo(cx + 6.5, cy - 14);
    ctx.stroke();
  } else {
    // Carbine at rest
    ctx.strokeStyle = GUN;
    ctx.lineWidth = 0.85;
    ctx.beginPath();
    ctx.moveTo(cx + 2, cy - 10);
    ctx.lineTo(cx + 4.5, cy - 14.5);
    ctx.stroke();
  }
}

// ── Cavalry: front rider saber up, rear rider carbine ────────────────────────
function drawCavalry(ctx, cx, cy, col) {
  horseRider(ctx, cx + 6, cy - 2, col, HORSE, false);  // rear — carbine
  horseRider(ctx, cx - 7, cy,     col, HORSE, true);   // front — saber
}

// ── Artillery: tapered cannon + two crew ─────────────────────────────────────
function drawArtillery(ctx, cx, cy, col) {
  // Ground shadow
  ctx.fillStyle = 'rgba(0,0,0,0.20)';
  ctx.beginPath();
  ctx.ellipse(cx, cy, 13, 1.2, 0, 0, Math.PI * 2);
  ctx.fill();

  // Large front wheel (8 spokes)
  ctx.strokeStyle = '#2a2010';
  ctx.lineWidth = 2;
  ctx.beginPath(); ctx.arc(cx - 7, cy - 2, 6, 0, Math.PI * 2); ctx.stroke();
  ctx.lineWidth = 0.65;
  for (let i = 0; i < 8; i++) {
    const a = i * Math.PI / 4;
    ctx.beginPath();
    ctx.moveTo(cx - 7 + Math.cos(a) * 6, cy - 2 + Math.sin(a) * 6);
    ctx.lineTo(cx - 7 - Math.cos(a) * 6, cy - 2 - Math.sin(a) * 6);
    ctx.stroke();
  }
  ctx.strokeStyle = '#5a3c18'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.arc(cx - 7, cy - 2, 1.6, 0, Math.PI * 2); ctx.stroke();

  // Rear smaller wheel (8 spokes)
  ctx.strokeStyle = '#2a2010'; ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.arc(cx + 6, cy - 2.5, 4, 0, Math.PI * 2); ctx.stroke();
  ctx.lineWidth = 0.55;
  for (let i = 0; i < 8; i++) {
    const a = i * Math.PI / 4;
    ctx.beginPath();
    ctx.moveTo(cx + 6 + Math.cos(a) * 4, cy - 2.5 + Math.sin(a) * 4);
    ctx.lineTo(cx + 6 - Math.cos(a) * 4, cy - 2.5 - Math.sin(a) * 4);
    ctx.stroke();
  }
  ctx.strokeStyle = '#5a3c18'; ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.arc(cx + 6, cy - 2.5, 1.1, 0, Math.PI * 2); ctx.stroke();

  // Carriage trail (dark wood beam between wheels and back)
  ctx.fillStyle = '#5a3c18';
  ctx.fillRect(cx - 14, cy - 5, 6, 3.5);   // trail
  ctx.fillRect(cx - 9,  cy - 6, 17, 3);    // main carriage between wheels

  // Cannon barrel — tapered trapezoid (wider at breech, narrower at muzzle)
  ctx.fillStyle = CANNON;
  ctx.beginPath();
  ctx.moveTo(cx - 9,  cy - 10.5);   // breech top-left
  ctx.lineTo(cx + 8,  cy - 8.5);    // muzzle top-right
  ctx.lineTo(cx + 8,  cy - 5.5);    // muzzle bottom-right
  ctx.lineTo(cx - 9,  cy - 6.8);    // breech bottom-left
  ctx.closePath();
  ctx.fill();

  // Barrel top highlight
  ctx.fillStyle = 'rgba(255,255,255,0.07)';
  ctx.beginPath();
  ctx.moveTo(cx - 9,  cy - 10.5);
  ctx.lineTo(cx + 8,  cy - 8.5);
  ctx.lineTo(cx + 6,  cy - 8.2);
  ctx.lineTo(cx - 9,  cy - 9.8);
  ctx.closePath();
  ctx.fill();

  // Breech knob / cascabel
  ctx.fillStyle = '#5a4020';
  ctx.beginPath(); ctx.arc(cx - 9, cy - 8.6, 2, 0, Math.PI * 2); ctx.fill();

  // Reinforce band near muzzle
  ctx.fillStyle = '#4a3818';
  ctx.fillRect(cx + 5, cy - 9, 2, 3.5);

  // Muzzle face
  ctx.fillStyle = '#1a1005';
  ctx.beginPath(); ctx.arc(cx + 8, cy - 7, 1.5, 0, Math.PI * 2); ctx.fill();

  // Crew — gunner left of trail, loader right of rear wheel
  fig(ctx, cx - 14, cy, col);
  fig(ctx, cx + 11, cy, col);
}

// ── General: mounted on horse, gold epaulettes + sash, tall hat ──────────────
function drawGeneral(ctx, cx, cy, col) {
  cx = Math.round(cx);

  // Prominent shadow
  ctx.fillStyle = 'rgba(0,0,0,0.25)';
  ctx.beginPath();
  ctx.ellipse(cx, cy, 9, 1.7, 0, 0, Math.PI * 2);
  ctx.fill();

  const hc = HORSE_G;

  // Legs
  ctx.strokeStyle = '#2a1808'; ctx.lineWidth = 1.3;
  ctx.beginPath();
  ctx.moveTo(cx + 4.5, cy - 2); ctx.lineTo(cx + 5, cy + 1.5);  ctx.lineTo(cx + 4,  cy + 2.5);
  ctx.moveTo(cx + 6.5, cy - 1); ctx.lineTo(cx + 7, cy + 1.5);  ctx.lineTo(cx + 6,  cy + 2.5);
  ctx.moveTo(cx - 3.5, cy - 1); ctx.lineTo(cx - 4, cy + 1.5);  ctx.lineTo(cx - 3,  cy + 2.5);
  ctx.moveTo(cx - 5.5, cy - 2); ctx.lineTo(cx - 6, cy + 1.5);  ctx.lineTo(cx - 5,  cy + 2.5);
  ctx.stroke();

  // Horse body (slightly larger than cavalry)
  ctx.fillStyle = hc;
  ctx.beginPath();
  ctx.ellipse(cx, cy - 5, 7.5, 3.5, 0.06, 0, Math.PI * 2);
  ctx.fill();

  // Haunch highlight
  ctx.fillStyle = 'rgba(255,255,255,0.09)';
  ctx.beginPath();
  ctx.ellipse(cx - 3, cy - 6, 3.2, 1.6, -0.2, 0, Math.PI * 2);
  ctx.fill();

  // Neck + head
  ctx.fillStyle = hc;
  ctx.beginPath();
  ctx.moveTo(cx + 5, cy - 7.5);
  ctx.quadraticCurveTo(cx + 10, cy - 11, cx + 8.5, cy - 7);
  ctx.quadraticCurveTo(cx + 6,  cy - 4,  cx + 4.5, cy - 3.5);
  ctx.closePath();
  ctx.fill();

  // Mane
  ctx.fillStyle = 'rgba(0,0,0,0.40)';
  ctx.beginPath();
  ctx.moveTo(cx + 5,   cy - 8.5);
  ctx.quadraticCurveTo(cx + 9, cy - 11.5, cx + 8, cy - 8.5);
  ctx.quadraticCurveTo(cx + 6, cy - 6,    cx + 5, cy - 7.5);
  ctx.closePath();
  ctx.fill();

  // Ear + eye
  ctx.fillStyle = hc;
  ctx.beginPath();
  ctx.moveTo(cx + 7.5, cy - 9.5); ctx.lineTo(cx + 8.5, cy - 11.5); ctx.lineTo(cx + 9, cy - 9.5);
  ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#1a0e04';
  ctx.beginPath(); ctx.arc(cx + 8.2, cy - 8.2, 0.7, 0, Math.PI * 2); ctx.fill();

  // Tail
  ctx.strokeStyle = '#2a1808'; ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(cx - 7.5, cy - 6);
  ctx.quadraticCurveTo(cx - 12, cy - 9, cx - 11, cy - 3.5);
  ctx.stroke();

  // Rider body (taller, more imposing)
  ctx.fillStyle = col.uniform;
  ctx.fillRect(cx - 3, cy - 13, 6, 6.5);
  ctx.fillStyle = 'rgba(0,0,0,0.15)';
  ctx.fillRect(cx + 1, cy - 13, 2, 6.5);

  // Gold epaulettes (shoulder boards)
  ctx.fillStyle = COLORS.gold;
  ctx.fillRect(cx - 4.5, cy - 13, 2.4, 1.8);
  ctx.fillRect(cx + 2.2, cy - 13, 2.4, 1.8);
  // Fringe on epaulettes
  ctx.strokeStyle = COLORS.gold; ctx.lineWidth = 0.7;
  for (let i = 0; i < 3; i++) {
    ctx.beginPath();
    ctx.moveTo(cx - 4.5 + i * 0.8, cy - 11.2);
    ctx.lineTo(cx - 4.5 + i * 0.8, cy - 9.8);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(cx + 2.2 + i * 0.8, cy - 11.2);
    ctx.lineTo(cx + 2.2 + i * 0.8, cy - 9.8);
    ctx.stroke();
  }

  // Gold diagonal sash across chest
  ctx.strokeStyle = COLORS.gold; ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(cx - 3, cy - 10);
  ctx.lineTo(cx + 3, cy - 13);
  ctx.stroke();

  // Belt
  ctx.strokeStyle = '#1a0e04'; ctx.lineWidth = 1.3;
  ctx.beginPath();
  ctx.moveTo(cx - 3, cy - 7.5); ctx.lineTo(cx + 3, cy - 7.5);
  ctx.stroke();

  // Sword raised (prominent, with guard)
  ctx.strokeStyle = '#d8d050'; ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(cx - 1.5, cy - 11);
  ctx.lineTo(cx - 7,   cy - 19);
  ctx.stroke();
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(cx - 5, cy - 14);
  ctx.lineTo(cx + 1, cy - 15.5);
  ctx.stroke();

  // Rider head (larger)
  ctx.fillStyle = SKIN;
  ctx.beginPath();
  ctx.arc(cx, cy - 15, 2.3, 0, Math.PI * 2);
  ctx.fill();

  // Tall officer hat
  ctx.fillStyle = col.hat;
  ctx.fillRect(cx - 3.2, cy - 17.5, 6.4, 1.2);    // brim
  ctx.fillRect(cx - 2.6, cy - 21.5, 5.2, 4.2);     // tall crown

  // Gold hat band
  ctx.fillStyle = COLORS.gold;
  ctx.fillRect(cx - 2.6, cy - 18.8, 5.2, 1.3);

  // Gold hat badge (star emblem)
  ctx.beginPath(); ctx.arc(cx, cy - 20, 1.5, 0, Math.PI * 2); ctx.fill();

  // Hat plume (subtle)
  ctx.strokeStyle = 'rgba(230,215,190,0.70)'; ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(cx + 2.6, cy - 21.5);
  ctx.quadraticCurveTo(cx + 6, cy - 25, cx + 4, cy - 28);
  ctx.stroke();
}

export function drawAllUnits(ctx, units, selectedUnit, aiActiveUnit) {
  for (const unit of units) {
    if (unit.routed) continue;
    const isSelected = selectedUnit && selectedUnit.id === unit.id;
    const isActive   = aiActiveUnit && aiActiveUnit.id === unit.id;
    drawUnit(ctx, unit, isSelected, isActive);
  }
}

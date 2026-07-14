import { HEX_SIZE, COLORS, UNIT_TYPES } from './constants.js';
import { hexToPixel } from './hex.js';

const CW = HEX_SIZE * 1.35;
const CH = HEX_SIZE * 1.1;

export function drawUnit(ctx, unit, isSelected, isActive, alpha = 1) {
  const { x, y } = hexToPixel(unit.q, unit.r);
  const cx = x - CW / 2;
  const cy = y - CH / 2;

  ctx.save();
  ctx.globalAlpha = alpha;

  if (unit.routed) {
    ctx.globalAlpha = alpha * 0.35;
  }

  const bg = unit.side === 'union' ? COLORS.union : COLORS.confederate;
  const border = unit.side === 'union' ? COLORS.unionLight : COLORS.confLight;

  if (isSelected) {
    ctx.shadowColor = COLORS.gold;
    ctx.shadowBlur = 10;
  }

  ctx.fillStyle = bg;
  ctx.beginPath();
  roundRect(ctx, cx, cy, CW, CH, 3);
  ctx.fill();

  ctx.strokeStyle = isSelected ? COLORS.gold : border;
  ctx.lineWidth = isSelected ? 2 : 1;
  ctx.beginPath();
  roundRect(ctx, cx, cy, CW, CH, 3);
  ctx.stroke();

  ctx.shadowBlur = 0;

  const iconY = cy + CH * 0.38;
  ctx.strokeStyle = 'white';
  ctx.fillStyle = 'white';
  ctx.lineWidth = 1.5;

  switch (unit.type) {
    case 'infantry':  drawInfantryIcon(ctx, x, iconY); break;
    case 'cavalry':   drawCavalryIcon(ctx, x, iconY);  break;
    case 'artillery': drawArtilleryIcon(ctx, x, iconY); break;
    case 'general':   drawGeneralIcon(ctx, x, iconY);   break;
  }

  const stripY = cy + CH * 0.65;
  const moraleColor = unit.morale > 60 ? '#44dd44' : unit.morale > 30 ? '#ffcc00' : '#ff4444';
  ctx.fillStyle = 'rgba(0,0,0,0.4)';
  ctx.fillRect(cx + 1, stripY, CW - 2, CH * 0.33);

  ctx.fillStyle = moraleColor;
  ctx.beginPath();
  ctx.arc(cx + 6, stripY + CH * 0.17, 3.5, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = 'white';
  ctx.font = `bold ${Math.round(HEX_SIZE * 0.45)}px monospace`;
  ctx.textAlign = 'right';
  ctx.textBaseline = 'middle';
  ctx.fillText(Math.ceil(unit.strength), cx + CW - 4, stripY + CH * 0.17);

  if (isActive) {
    ctx.strokeStyle = '#ffff00';
    ctx.lineWidth = 2;
    ctx.setLineDash([3, 2]);
    ctx.beginPath();
    roundRect(ctx, cx - 1, cy - 1, CW + 2, CH + 2, 4);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  if ((unit.hasMoved || unit.hasAttacked) && !unit.routed) {
    ctx.fillStyle = 'rgba(0,0,0,0.25)';
    ctx.beginPath();
    roundRect(ctx, cx, cy, CW, CH, 3);
    ctx.fill();
  }

  ctx.restore();
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.arcTo(x + w, y, x + w, y + r, r);
  ctx.lineTo(x + w, y + h - r);
  ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
  ctx.lineTo(x + r, y + h);
  ctx.arcTo(x, y + h, x, y + h - r, r);
  ctx.lineTo(x, y + r);
  ctx.arcTo(x, y, x + r, y, r);
  ctx.closePath();
}

function drawInfantryIcon(ctx, cx, cy) {
  const s = 7;
  ctx.beginPath();
  ctx.moveTo(cx - s, cy - s * 0.6);
  ctx.lineTo(cx + s, cy + s * 0.6);
  ctx.moveTo(cx + s, cy - s * 0.6);
  ctx.lineTo(cx - s, cy + s * 0.6);
  ctx.stroke();
}

function drawCavalryIcon(ctx, cx, cy) {
  const s = 6;
  ctx.beginPath();
  ctx.moveTo(cx - s, cy - s * 0.5);
  ctx.lineTo(cx + s, cy + s * 0.5);
  ctx.moveTo(cx + s, cy - s * 0.5);
  ctx.lineTo(cx - s, cy + s * 0.5);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(cx, cy - s * 0.9, 2.5, 0, Math.PI * 2);
  ctx.fill();
}

function drawArtilleryIcon(ctx, cx, cy) {
  ctx.fillRect(cx - 9, cy - 3, 18, 6);
  ctx.beginPath();
  ctx.arc(cx - 9, cy + 5, 4, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(cx + 9, cy + 5, 4, 0, Math.PI * 2);
  ctx.fill();
}

function drawGeneralIcon(ctx, cx, cy) {
  const pts = 4;
  const or = 8, ir = 4;
  ctx.beginPath();
  for (let i = 0; i < pts * 2; i++) {
    const angle = (i * Math.PI) / pts - Math.PI / 2;
    const r = i % 2 === 0 ? or : ir;
    i === 0 ? ctx.moveTo(cx + r * Math.cos(angle), cy + r * Math.sin(angle))
            : ctx.lineTo(cx + r * Math.cos(angle), cy + r * Math.sin(angle));
  }
  ctx.closePath();
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

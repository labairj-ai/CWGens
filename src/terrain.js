import { TERRAIN, COLORS } from './constants.js';
import { hexToPixel, drawHexPath } from './hex.js';

export function drawTerrainHex(ctx, q, r, terrainKey) {
  const t = TERRAIN[terrainKey];
  drawHexPath(ctx, q, r);
  ctx.fillStyle = t.color;
  ctx.fill();
  ctx.strokeStyle = t.stroke;
  ctx.lineWidth = 1;
  ctx.stroke();

  if (terrainKey === 'H') drawHillShading(ctx, q, r);
  if (terrainKey === 'F') drawTreeSymbol(ctx, q, r);
  if (terrainKey === 'T') drawTownSymbol(ctx, q, r);
  if (terrainKey === 'W') drawWaterLines(ctx, q, r);
  if (terrainKey === 'R') drawRoadLine(ctx, q, r);
}

function drawHillShading(ctx, q, r) {
  const { x, y } = hexToPixel(q, r);
  ctx.save();
  ctx.strokeStyle = 'rgba(255,200,150,0.25)';
  ctx.lineWidth = 1;
  for (let i = -2; i <= 2; i++) {
    ctx.beginPath();
    ctx.moveTo(x - 10, y + i * 5);
    ctx.lineTo(x + 10, y + i * 5 - 4);
    ctx.stroke();
  }
  ctx.restore();
}

function drawTreeSymbol(ctx, q, r) {
  const { x, y } = hexToPixel(q, r);
  ctx.save();
  ctx.fillStyle = '#2a5c2a';
  for (const [dx, dy] of [[-6, 2], [6, -2], [0, -5]]) {
    ctx.beginPath();
    ctx.arc(x + dx, y + dy, 4, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function drawTownSymbol(ctx, q, r) {
  const { x, y } = hexToPixel(q, r);
  ctx.save();
  ctx.fillStyle = '#c0b898';
  ctx.strokeStyle = '#504840';
  ctx.lineWidth = 0.8;
  for (const [dx, dy, w, h] of [[-7,-5,7,6],[-1,-3,6,5],[3,-6,5,7]]) {
    ctx.fillRect(x + dx, y + dy, w, h);
    ctx.strokeRect(x + dx, y + dy, w, h);
  }
  ctx.restore();
}

function drawWaterLines(ctx, q, r) {
  const { x, y } = hexToPixel(q, r);
  ctx.save();
  ctx.strokeStyle = 'rgba(180,230,255,0.5)';
  ctx.lineWidth = 1;
  for (let i = -1; i <= 1; i++) {
    ctx.beginPath();
    ctx.moveTo(x - 10, y + i * 5);
    ctx.bezierCurveTo(x - 3, y + i * 5 - 2, x + 3, y + i * 5 + 2, x + 10, y + i * 5);
    ctx.stroke();
  }
  ctx.restore();
}

function drawRoadLine(ctx, q, r) {
  const { x, y } = hexToPixel(q, r);
  ctx.save();
  ctx.strokeStyle = 'rgba(100,70,30,0.4)';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(x - 14, y);
  ctx.lineTo(x + 14, y);
  ctx.stroke();
  ctx.restore();
}

export function drawAllTerrain(ctx, terrain) {
  for (let r = 0; r < terrain.length; r++) {
    for (let q = 0; q < terrain[r].length; q++) {
      drawTerrainHex(ctx, q, r, terrain[r][q]);
    }
  }
}

export function drawHighlights(ctx, moveHexes, attackTargets, selectedUnit) {
  for (const h of moveHexes) {
    drawHexPath(ctx, h.q, h.r);
    ctx.fillStyle = COLORS.moveBlue;
    ctx.fill();
    ctx.strokeStyle = 'rgba(80,140,255,0.7)';
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }

  for (const u of attackTargets) {
    drawHexPath(ctx, u.q, u.r);
    ctx.fillStyle = COLORS.attackRed;
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,60,60,0.8)';
    ctx.lineWidth = 2;
    ctx.stroke();
  }

  if (selectedUnit) {
    drawHexPath(ctx, selectedUnit.q, selectedUnit.r);
    ctx.strokeStyle = COLORS.gold;
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

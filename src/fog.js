import { drawHexPath, getNeighbors } from './hex.js';

const SIGHT = { infantry: 3, cavalry: 4, artillery: 3, general: 3 };

function calcVisible(units, playerSide) {
  const visible = new Set();

  for (const unit of units) {
    if (unit.side !== playerSide || unit.routed) continue;
    const range = SIGHT[unit.type] ?? 3;
    const queue = [{ q: unit.q, r: unit.r, dist: 0 }];
    const seen  = new Set([`${unit.q},${unit.r}`]);

    while (queue.length) {
      const { q, r, dist } = queue.shift();
      visible.add(`${q},${r}`);
      if (dist >= range) continue;
      for (const n of getNeighbors(q, r)) {
        const k = `${n.q},${n.r}`;
        if (!seen.has(k)) { seen.add(k); queue.push({ q: n.q, r: n.r, dist: dist + 1 }); }
      }
    }
  }

  return visible;
}

export function drawFog(ctx, terrain, units, playerSide) {
  if (!playerSide) return;
  const visible = calcVisible(units, playerSide);

  for (let r = 0; r < terrain.length; r++) {
    for (let q = 0; q < terrain[r].length; q++) {
      if (visible.has(`${q},${r}`)) continue;
      const isBorder = getNeighbors(q, r).some(n => visible.has(`${n.q},${n.r}`));
      drawHexPath(ctx, q, r);
      ctx.fillStyle = isBorder ? 'rgba(10,8,16,0.52)' : 'rgba(10,8,16,0.82)';
      ctx.fill();
    }
  }
}

// Returns the visible hex set — used externally to gate enemy unit rendering.
export function getVisibleHexes(units, playerSide) {
  return calcVisible(units, playerSide);
}

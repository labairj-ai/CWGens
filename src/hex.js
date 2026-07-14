import { HEX_SIZE, COLS, ROWS, MAP_X, MAP_Y, TERRAIN } from './constants.js';

const S3 = Math.sqrt(3);

export function hexToPixel(q, r) {
  return {
    x: MAP_X + HEX_SIZE * 1.5 * q,
    y: MAP_Y + HEX_SIZE * S3 * (r + (q & 1) * 0.5),
  };
}

export function pixelToHex(px, py) {
  let best = null;
  let bestDist = HEX_SIZE * 1.4;
  for (let q = 0; q < COLS; q++) {
    for (let r = 0; r < ROWS; r++) {
      const { x, y } = hexToPixel(q, r);
      const d = Math.hypot(px - x, py - y);
      if (d < bestDist) { bestDist = d; best = { q, r }; }
    }
  }
  return best;
}

export function drawHexPath(ctx, q, r) {
  const { x, y } = hexToPixel(q, r);
  ctx.beginPath();
  for (let i = 0; i < 6; i++) {
    const angle = (Math.PI / 3) * i;
    const hx = x + HEX_SIZE * Math.cos(angle);
    const hy = y + HEX_SIZE * Math.sin(angle);
    i === 0 ? ctx.moveTo(hx, hy) : ctx.lineTo(hx, hy);
  }
  ctx.closePath();
}

const DIRS_EVEN = [[0,-1],[1,-1],[1,0],[0,1],[-1,0],[-1,-1]];
const DIRS_ODD  = [[0,-1],[1,0],[1,1],[0,1],[-1,1],[-1,0]];

export function getNeighbors(q, r) {
  const dirs = (q & 1) === 0 ? DIRS_EVEN : DIRS_ODD;
  return dirs
    .map(([dq, dr]) => ({ q: q + dq, r: r + dr }))
    .filter(h => h.q >= 0 && h.q < COLS && h.r >= 0 && h.r < ROWS);
}

function offsetToCube(q, r) {
  const x = q;
  const z = r - (q - (q & 1)) / 2;
  return { x, y: -x - z, z };
}

export function hexDistance(aq, ar, bq, br) {
  const a = offsetToCube(aq, ar);
  const b = offsetToCube(bq, br);
  return Math.max(Math.abs(a.x - b.x), Math.abs(a.y - b.y), Math.abs(a.z - b.z));
}

export function getMovableHexes(unit, units, terrain) {
  const { type } = unit;
  const { moveRange } = unit._typeDef;
  const visited = new Map();
  const queue = [{ q: unit.q, r: unit.r, cost: 0 }];
  visited.set(`${unit.q},${unit.r}`, 0);
  const result = [];

  while (queue.length) {
    const curr = queue.shift();
    if (curr.q !== unit.q || curr.r !== unit.r) result.push({ q: curr.q, r: curr.r });

    for (const { q, r } of getNeighbors(curr.q, curr.r)) {
      const tc = TERRAIN[terrain[r][q]].moveCost;
      const cost = curr.cost + tc;
      const key = `${q},${r}`;
      if (cost > moveRange) continue;
      if (visited.has(key) && visited.get(key) <= cost) continue;
      const occupant = units.find(u => u.q === q && u.r === r && !u.routed);
      if (occupant && occupant.side !== unit.side) continue;
      if (occupant && occupant.side === unit.side) {
        visited.set(key, cost);
        continue;
      }
      visited.set(key, cost);
      queue.push({ q, r, cost });
    }
  }

  return result.filter(h => !units.some(u => u.q === h.q && u.r === h.r && !u.routed));
}

export function getAttackableTargets(unit, units, terrain) {
  const range = unit._typeDef.attackRange;
  if (!range || unit.ammo <= 0) return [];
  return units.filter(u =>
    u.side !== unit.side &&
    !u.routed &&
    hexDistance(unit.q, unit.r, u.q, u.r) <= range
  );
}

export function getHexesInAttackRange(unit, units) {
  const range = unit._typeDef.attackRange;
  if (!range) return [];
  const result = [];
  for (let q = 0; q < COLS; q++) {
    for (let r = 0; r < ROWS; r++) {
      if (hexDistance(unit.q, unit.r, q, r) <= range && hexDistance(unit.q, unit.r, q, r) > 0) {
        result.push({ q, r });
      }
    }
  }
  return result;
}

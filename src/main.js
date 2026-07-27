import { updateLayout, HEX_SIZE, MAP_X, MAP_Y, COLS, ROWS, W, H } from './constants.js';
import { invalidateTerrainCache } from './terrain.js';
import { Game } from './game.js';

const canvas = document.getElementById('c');
const ctx = canvas.getContext('2d');
const game = new Game();

// ── Camera / pan ──────────────────────────────────────────────────────────────

let panX = 0, panY = 0;

function clampPan(px, py) {
  const S3_ = Math.sqrt(3);
  const margin   = HEX_SIZE * 2;
  const mapLeft  = MAP_X - HEX_SIZE;
  const mapRight = MAP_X + HEX_SIZE * 1.5 * (COLS - 1) + HEX_SIZE;
  const mapTop   = MAP_Y - HEX_SIZE * S3_ * 0.5;
  const mapBot   = MAP_Y + HEX_SIZE * S3_ * ROWS;
  // Max pan: allow scrolling until the near edge is at the margin.
  // If the map fits on screen in that axis, lock pan to 0.
  const maxX = (mapRight - mapLeft) > W ? Math.max(0, margin - mapLeft) : 0;
  const maxY = (mapBot  - mapTop)   > H ? Math.max(0, margin - mapTop)  : 0;
  return {
    x: Math.max(W - margin - mapRight, Math.min(maxX, px)),
    y: Math.max(H - margin - mapBot,   Math.min(maxY, py)),
  };
}

function resize() {
  const dpr = window.devicePixelRatio || 1;
  const vp  = window.visualViewport;
  const sw  = vp ? vp.width  : window.innerWidth;
  const sh  = vp ? vp.height : window.innerHeight;

  updateLayout(sw, sh);
  panX = 0;
  panY = 0;
  invalidateTerrainCache();

  canvas.width  = Math.round(sw * dpr);
  canvas.height = Math.round(sh * dpr);
  canvas.style.width  = sw + 'px';
  canvas.style.height = sh + 'px';
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}

// ── Input ────────────────────────────────────────────────────────────────────

let pointerDown = false;
let dragStartX = 0, dragStartY = 0;
let didDrag = false;

function getXY(e) {
  const rect = canvas.getBoundingClientRect();
  const src  = e.touches ? e.touches[0] : e;
  return {
    x: src.clientX - rect.left,
    y: src.clientY - rect.top,
  };
}

canvas.addEventListener('pointerdown', e => {
  e.preventDefault();
  pointerDown = true;
  didDrag = false;
  const { x, y } = getXY(e);
  dragStartX = x;
  dragStartY = y;
}, { passive: false });

canvas.addEventListener('pointermove', e => {
  if (!pointerDown) return;
  e.preventDefault();
  const { x, y } = getXY(e);
  const dx = x - dragStartX;
  const dy = y - dragStartY;
  if (!didDrag && (Math.abs(dx) > 6 || Math.abs(dy) > 6)) {
    didDrag = true;
  }
  if (didDrag) {
    const clamped = clampPan(panX + dx, panY + dy);
    panX = clamped.x;
    panY = clamped.y;
    dragStartX = x;
    dragStartY = y;
  }
}, { passive: false });

canvas.addEventListener('pointerup', e => {
  e.preventDefault();
  if (!pointerDown) return;
  pointerDown = false;
  if (!didDrag) {
    const { x, y } = getXY(e);
    game.handleClick(x, y, panX, panY);
  }
  didDrag = false;
}, { passive: false });

canvas.addEventListener('pointercancel', () => { pointerDown = false; didDrag = false; });

if (window.visualViewport) {
  window.visualViewport.addEventListener('resize', resize);
}
window.addEventListener('resize', resize);

// ── Render loop ───────────────────────────────────────────────────────────────

let last = 0;

function loop(ts) {
  const dt = Math.min((ts - last) / 1000, 0.05);
  last = ts;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  try {
    game.update(dt);
    game.draw(ctx, panX, panY);
  } catch (e) {
    console.error('GAME CRASH:', e);
  }

  requestAnimationFrame(loop);
}

resize();
requestAnimationFrame(ts => { last = ts; requestAnimationFrame(loop); });

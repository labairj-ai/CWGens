import { updateLayout } from './constants.js';
import { Game } from './game.js';

const canvas = document.getElementById('c');
const ctx = canvas.getContext('2d');
const game = new Game();

function resize() {
  const dpr = window.devicePixelRatio || 1;
  const vp  = window.visualViewport;
  const sw  = vp ? vp.width  : window.innerWidth;
  const sh  = vp ? vp.height : window.innerHeight;

  updateLayout(sw, sh);

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
  if (Math.abs(x - dragStartX) > 6 || Math.abs(y - dragStartY) > 6) {
    didDrag = true;
  }
}, { passive: false });

canvas.addEventListener('pointerup', e => {
  e.preventDefault();
  if (!pointerDown) return;
  pointerDown = false;
  if (!didDrag) {
    const { x, y } = getXY(e);
    game.handleClick(x, y);
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
    game.draw(ctx);
  } catch (e) {
    console.error('GAME CRASH:', e);
  }

  requestAnimationFrame(loop);
}

resize();
requestAnimationFrame(ts => { last = ts; requestAnimationFrame(loop); });

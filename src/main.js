import { W, H } from './constants.js';
import { Game } from './game.js';

const canvas = document.getElementById('c');
const ctx = canvas.getContext('2d');
const game = new Game();

let scale = 1;
let offsetX = 0;
let offsetY = 0;

function resize() {
  const dpr = window.devicePixelRatio || 1;
  const sw = window.innerWidth;
  const sh = window.innerHeight;
  scale = Math.min(sw / W, sh / H);
  const displayW = W * scale;
  const displayH = H * scale;
  offsetX = (sw - displayW) / 2;
  offsetY = (sh - displayH) / 2;
  canvas.width = sw * dpr;
  canvas.height = sh * dpr;
  canvas.style.width = sw + 'px';
  canvas.style.height = sh + 'px';
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}

function screenToGame(sx, sy) {
  return {
    gx: (sx - offsetX) / scale,
    gy: (sy - offsetY) / scale,
  };
}

function onPointer(e) {
  e.preventDefault();
  const rect = canvas.getBoundingClientRect();
  const src = e.touches ? e.touches[0] : e;
  const sx = src.clientX - rect.left;
  const sy = src.clientY - rect.top;
  const { gx, gy } = screenToGame(sx, sy);
  game.handleClick(gx, gy);
}

canvas.addEventListener('pointerdown', onPointer, { passive: false });
canvas.addEventListener('touchstart', onPointer, { passive: false });
window.addEventListener('resize', resize);

let last = 0;

function loop(ts) {
  const dt = Math.min((ts - last) / 1000, 0.05);
  last = ts;

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.save();
  ctx.translate(offsetX, offsetY);
  ctx.scale(scale, scale);

  ctx.fillStyle = '#0a0800';
  ctx.fillRect(0, 0, W, H);

  try {
    game.update(dt);
    game.draw(ctx);
  } catch (e) {
    console.error('GAME CRASH:', e);
    ctx.fillStyle = 'rgba(0,0,0,0.85)';
    ctx.fillRect(0, 80, W, 130);
    ctx.fillStyle = '#ff4444';
    ctx.font = 'bold 13px monospace';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText('CRASH: ' + e.message, 10, 90);
    const lines = (e.stack || '').split('\n').slice(0, 6);
    ctx.fillStyle = '#ffaa44';
    ctx.font = '10px monospace';
    lines.forEach((l, i) => ctx.fillText(l.trim().slice(0, 110), 10, 110 + i * 13));
  }

  ctx.restore();
  requestAnimationFrame(loop);
}

resize();
requestAnimationFrame(ts => { last = ts; requestAnimationFrame(loop); });

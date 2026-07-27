import { W, H, COLORS, PANEL_TOP, PANEL_H, HUD_H, UNIT_TYPES, S, BATTLES } from './constants.js';

const FONT_TITLE = 'bold 13px serif';
const FONT_BODY  = '11px sans-serif';
const FONT_SMALL = '10px sans-serif';

// compact = true when the HUD is small (mobile / small screens).
// HUD_H is computed proportionally in updateLayout — small HUD means small screen.
function isCompact() { return HUD_H < 60; }

const BUILD_LABEL = (() => {
  if (typeof __BUILD_TIME__ === 'undefined') return '';
  const d = new Date(__BUILD_TIME__);
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const mo  = months[d.getUTCMonth()];
  const day = d.getUTCDate();
  const yr  = d.getUTCFullYear();
  const hh  = String(d.getUTCHours()).padStart(2, '0');
  const mm  = String(d.getUTCMinutes()).padStart(2, '0');
  return `${mo} ${day}, ${yr} · ${hh}:${mm} UTC`;
})();

export function drawHUD(ctx, game) {
  const unionMorale = getArmyMorale(game.units, 'union');
  const confMorale  = getArmyMorale(game.units, 'confederate');
  const unionPct    = unionMorale / (game.startMorale?.union  || 1);
  const confPct     = confMorale  / (game.startMorale?.confederate || 1);
  const compact     = isCompact();

  ctx.fillStyle = 'rgba(26,16,5,0.91)';
  ctx.fillRect(0, 0, W, HUD_H);
  ctx.strokeStyle = COLORS.hudLine;
  ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(0, HUD_H); ctx.lineTo(W, HUD_H); ctx.stroke();

  const sc        = game.scenario || BATTLES[0];
  const dayNum    = Math.floor((game.turn - 1) / 6) + 1;
  const dateStr   = `${sc.month} ${sc.startDay + dayNum - 1}, ${sc.year}`;
  const timeOfDay = game.nightTimer > 0 ? 'Night'
    : ['Morning','Midday','Afternoon'][Math.floor(((game.turn - 1) % 6) / 2)] || 'Afternoon';

  if (compact) {
    // ── Compact HUD (mobile landscape) ──────────────────────────────────────
    ctx.fillStyle = '#a08050';
    ctx.font = 'bold 11px serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText(sc.name, W / 2, 3);

    ctx.fillStyle = '#7a6040';
    ctx.font = '9px sans-serif';
    ctx.fillText(`${dateStr} • ${timeOfDay} • Turn ${game.turn}`, W / 2, 16);

    const barW = Math.min(200, W * 0.23);
    drawMoraleBar(ctx, 8,          26, 'UNION', unionPct,
      COLORS.union, COLORS.unionLight, game.playerSide === 'union', barW, 10, 8);
    drawMoraleBar(ctx, W / 2 + 4,  26, 'CONF.', confPct,
      COLORS.confederate, COLORS.confLight, game.playerSide === 'confederate', barW, 10, 8);
  } else {
    // ── Full HUD (desktop / tablet) ──────────────────────────────────────────
    ctx.fillStyle = '#a08050';
    ctx.font = 'bold 16px serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText(sc.name, W / 2, 6);

    ctx.fillStyle = '#7a6040';
    ctx.font = FONT_BODY;
    ctx.fillText(`${dateStr}  •  ${timeOfDay}  •  Turn ${game.turn}`, W / 2, 26);

    const barW = Math.min(200, W * 0.22);
    drawMoraleBar(ctx, 20,         48, 'UNION', unionPct,
      COLORS.union, COLORS.unionLight, game.playerSide === 'union', barW, 14, 10);
    drawMoraleBar(ctx, W / 2 + 10, 48, 'CONFEDERATE', confPct,
      COLORS.confederate, COLORS.confLight, game.playerSide === 'confederate', barW, 14, 10);

    ctx.fillStyle = '#504030';
    ctx.font = FONT_SMALL;
    ctx.textAlign = 'right';
    ctx.fillText(`v${typeof __BUILD_TIME__ !== 'undefined' ? __BUILD_TIME__.slice(0, 10) : ''}`, W - 4, 4);
  }
}

function drawMoraleBar(ctx, x, y, label, pct, bg, fg, isPlayer, barW, barH, labelSize) {
  ctx.fillStyle = isPlayer ? '#f0c060' : '#706040';
  ctx.font = `bold ${labelSize}px sans-serif`;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  ctx.fillText(label, x, y);

  ctx.fillStyle = '#0a0800';
  ctx.fillRect(x, y + labelSize + 2, barW, barH);

  const filled = Math.max(0, Math.min(1, pct)) * barW;
  ctx.fillStyle = pct > 0.5 ? '#3aaa3a' : pct > 0.28 ? '#aaaa20' : '#cc3030';
  ctx.fillRect(x, y + labelSize + 2, filled, barH);

  ctx.strokeStyle = '#504030'; ctx.lineWidth = 1;
  ctx.strokeRect(x, y + labelSize + 2, barW, barH);

  ctx.fillStyle = 'white';
  ctx.font = `${Math.round(labelSize * 0.85)}px sans-serif`;
  ctx.textAlign = 'right';
  ctx.fillText(`${Math.min(100, Math.round(pct * 100))}%`, x + barW - 2, y + labelSize + 3);
}

export function drawBottomPanel(ctx, game) {
  ctx.fillStyle = 'rgba(18,13,0,0.91)';
  ctx.fillRect(0, PANEL_TOP, W, H - PANEL_TOP);
  ctx.strokeStyle = COLORS.hudLine;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(0, PANEL_TOP);
  ctx.lineTo(W, PANEL_TOP);
  ctx.stroke();

  const sel = game.selectedUnit;

  if (game.state === S.ENEMY_TURN) {
    ctx.fillStyle = '#c8b47a';
    ctx.font = 'bold 14px serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('ENEMY MOVING...', W / 2, PANEL_TOP + (PANEL_H >> 1));
    return;
  }

  if (game.state === S.NIGHT) {
    ctx.fillStyle = '#8898cc';
    ctx.font = 'bold 14px serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('NIGHT — Units Recovering', W / 2, PANEL_TOP + (PANEL_H >> 1));
    return;
  }

  const compact = isCompact();

  if (sel) {
    drawUnitIdentity(ctx, sel, compact);
    drawStatBars(ctx, sel, compact);
    if (!compact) drawLeaderPanel(ctx, sel);
  } else {
    ctx.fillStyle = '#504030';
    ctx.font = FONT_BODY;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText('Select a unit', 12, PANEL_TOP + (PANEL_H >> 1));
  }

  drawActionButtons(ctx, game);
}

function drawUnitIdentity(ctx, unit, compact) {
  const x = 8;
  const sideColor = unit.side === 'union' ? COLORS.unionLight : COLORS.confLight;
  const typeName  = UNIT_TYPES[unit.type]?.name || unit.type;
  const maxStr    = unit.maxStrength || unit.strength;
  const casualtyPct = Math.round((1 - unit.strength / maxStr) * 100);
  const cond = unit.org > 75 ? { label: 'FRESH',     color: '#44cc44' }
             : unit.org > 50 ? { label: 'STEADY',    color: '#88cc44' }
             : unit.org > 25 ? { label: 'TIRED',     color: '#cc8822' }
             :                  { label: 'EXHAUSTED', color: '#cc3333' };
  const moraleLabel = unit.morale > 70 ? 'Confident' : unit.morale > 40 ? 'Determined'
                    : unit.morale > 20 ? 'Wavering'  : 'Near Rout';
  const moraleColor = unit.morale > 70 ? '#44cc44' : unit.morale > 40 ? '#cccc44'
                    : unit.morale > 20 ? '#cc8844'  : '#cc3333';

  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';

  if (compact) {
    // 4 tight lines in 80px panel
    ctx.fillStyle = sideColor;
    ctx.font = 'bold 11px serif';
    ctx.fillText(unit.name, x, PANEL_TOP + 4);

    ctx.fillStyle = '#907860';
    ctx.font = 'italic 9px serif';
    ctx.fillText(unit.commander || '', x, PANEL_TOP + 17);

    ctx.fillStyle = '#706040';
    ctx.font = '9px sans-serif';
    ctx.fillText(`${typeName} • ${unit.side === 'union' ? 'Union' : 'Conf.'}`, x, PANEL_TOP + 29);

    ctx.fillStyle = cond.color;
    ctx.font = 'bold 8px sans-serif';
    ctx.fillText(cond.label + (unit.dugIn ? ' • DUG IN' : ''), x, PANEL_TOP + 41);

    ctx.fillStyle = '#706050';
    ctx.font = '8px monospace';
    ctx.fillText(`${Math.ceil(unit.strength)}/${maxStr} (-${casualtyPct}%)`, x, PANEL_TOP + 54);

    ctx.fillStyle = moraleColor;
    ctx.font = '8px sans-serif';
    ctx.fillText(moraleLabel, x, PANEL_TOP + 66);
  } else {
    ctx.fillStyle = sideColor;
    ctx.font = 'bold 12px serif';
    ctx.fillText(unit.name, x, PANEL_TOP + 5);

    ctx.fillStyle = '#907860';
    ctx.font = 'italic 10px serif';
    ctx.fillText(unit.commander || '', x, PANEL_TOP + 20);

    ctx.fillStyle = '#706040';
    ctx.font = '9px sans-serif';
    ctx.fillText(`${typeName} • ${unit.side === 'union' ? 'Union' : 'Confederate'}`, x, PANEL_TOP + 33);

    ctx.fillStyle = cond.color;
    ctx.font = 'bold 9px sans-serif';
    ctx.fillText(cond.label, x, PANEL_TOP + 46);

    if (unit.dugIn) {
      ctx.fillStyle = '#8a9040';
      ctx.fillText('⊲ DUG IN', x, PANEL_TOP + 59);
    }

    ctx.fillStyle = '#706050';
    ctx.font = '9px monospace';
    ctx.fillText(`Str: ${Math.ceil(unit.strength)}/${maxStr}  (-${casualtyPct}%)`, x, PANEL_TOP + 72);

    ctx.fillStyle = moraleColor;
    ctx.font = '9px sans-serif';
    ctx.fillText(moraleLabel, x, PANEL_TOP + 85);
  }
}

function drawStatBars(ctx, unit, compact) {
  const bx = compact ? Math.round(W * 0.26) : 196;
  const bw = compact ? Math.round(W * 0.28) : 150;
  const rowH = compact ? 18 : 25;

  const bars = [
    { label: 'MORALE', pct: unit.morale / 100, color: unit.morale > 60 ? '#44cc44' : unit.morale > 30 ? '#cccc22' : '#cc3333', val: String(Math.round(unit.morale)) },
    { label: 'STR',    pct: unit.strength / (unit.maxStrength || unit.strength), color: '#4488cc', val: `${Math.ceil(unit.strength)}/${unit.maxStrength || unit.strength}` },
    { label: 'ORG',    pct: unit.org / 100, color: '#cc8844', val: String(Math.round(unit.org)) },
    { label: 'AMMO',   pct: unit.ammo / (unit._typeDef?.ammoCap || 1), color: '#cc44cc', val: String(unit.ammo) },
  ];

  bars.forEach(({ label, pct, color, val }, i) => {
    const y = PANEL_TOP + 5 + i * rowH;
    ctx.fillStyle = '#604030';
    ctx.font = '9px monospace';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText(label, bx, y);
    ctx.fillStyle = '#0a0800';
    ctx.fillRect(bx, y + 11, bw, 8);
    ctx.fillStyle = color;
    ctx.fillRect(bx, y + 11, Math.max(0, Math.min(1, pct)) * bw, 8);
    ctx.strokeStyle = '#403020';
    ctx.lineWidth = 0.5;
    ctx.strokeRect(bx, y + 11, bw, 8);
    ctx.font = '8px monospace';
    ctx.textAlign = 'left';
    ctx.fillStyle = 'rgba(0,0,0,0.55)';
    ctx.fillText(val, bx + 2, y + 12);
    ctx.fillStyle = 'rgba(255,255,255,0.9)';
    ctx.fillText(val, bx + 1, y + 11);
  });
}

function drawLeaderPanel(ctx, unit) {
  const lx = 356;

  ctx.fillStyle = '#6a5030';
  ctx.font = 'bold 8px sans-serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  ctx.fillText('LEADERSHIP', lx, PANEL_TOP + 5);

  const ratings = [
    { label: 'INFL',  val: unit.infl   ?? 5, color: '#c07030', col: 0, row: 0 },
    { label: 'LOYAL', val: unit.loyal  ?? 5, color: '#30a050', col: 1, row: 0 },
    { label: 'ORG',   val: unit.ldrorg ?? 5, color: '#3080c0', col: 0, row: 1 },
    { label: 'HLTH',  val: unit.hlth   ?? 5, color: '#c04040', col: 1, row: 1 },
  ];

  const boxW = 78, boxH = 40, colGap = 6, rowGap = 4;

  ratings.forEach(({ label, val, color, col, row }) => {
    const bx = lx + col * (boxW + colGap);
    const by = PANEL_TOP + 18 + row * (boxH + rowGap);

    ctx.fillStyle = 'rgba(10,8,0,0.5)';
    ctx.fillRect(bx, by, boxW, boxH);
    ctx.strokeStyle = color;
    ctx.lineWidth = 0.8;
    ctx.strokeRect(bx, by, boxW, boxH);

    ctx.fillStyle = '#906840';
    ctx.font = '8px sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText(label, bx + 3, by + 3);

    ctx.fillStyle = color;
    ctx.font = 'bold 18px monospace';
    ctx.textAlign = 'right';
    ctx.fillText(String(val), bx + boxW - 4, by + 2);

    const segW = 6, segH = 4, segGap = 0.8;
    const totalSegW = 10 * segW + 9 * segGap;
    const segStartX = bx + (boxW - totalSegW) / 2;
    for (let s = 0; s < 10; s++) {
      ctx.fillStyle = s < val ? color : '#2a2010';
      ctx.fillRect(segStartX + s * (segW + segGap), by + boxH - 8, segW, segH);
    }
  });
}

function getButtonRects(game) {
  const btns = getButtons(game);
  if (!btns.length) return [];

  const compact  = isCompact();
  const bw       = compact ? 80 : 80;
  const bh       = compact ? 28 : 22;
  const gap      = 5;
  const rowGap   = compact ? 6 : 9;
  const maxPerRow = 3;
  const rightEdge = W - 8;

  const result = [];
  for (let i = 0; i < btns.length; i += maxPerRow) {
    const row = btns.slice(i, Math.min(i + maxPerRow, btns.length));
    const ri  = Math.floor(i / maxPerRow);
    const rowW = row.length * bw + (row.length - 1) * gap;
    const rowX = rightEdge - rowW;
    const rowY = PANEL_TOP + 6 + ri * (bh + rowGap);
    row.forEach((btn, ci) => {
      result.push({ btn, x: rowX + ci * (bw + gap), y: rowY, w: bw, h: bh });
    });
  }
  return result;
}

export function drawActionButtons(ctx, game) {
  const rects = getButtonRects(game);
  rects.forEach(({ btn, x, y, w, h }) => {
    const { disabled, hot } = btn;
    ctx.fillStyle = disabled ? '#2a2010' : hot ? '#f0c040' : COLORS.parchment;
    ctx.strokeStyle = disabled ? '#403020' : hot ? '#c09010' : '#806040';
    ctx.lineWidth = hot ? 2 : 1;
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, 4);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = disabled ? '#504030' : COLORS.darkText;
    ctx.font = hot ? 'bold 11px serif' : '11px serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(btn.label, x + w / 2, y + h / 2);
  });
}

export function getButtons(game) {
  const sel = game.selectedUnit;
  const isPlayerTurn = game.state === S.PLAYER_TURN;

  if (!isPlayerTurn) return [];

  const buttons = [];

  if (sel && !sel.routed) {
    const canAttack = !sel.hasAttacked && sel.ammo > 0 && sel._typeDef.attackRange > 0;
    const canCharge = canAttack && sel._typeDef.canCharge && getAdjacentEnemies(sel, game).length > 0;
    const targetsExist = game.attackTargets.length > 0;
    const canDigIn = !sel.hasMoved && !sel.dugIn && sel.type !== 'cavalry';

    if (canAttack && targetsExist) {
      buttons.push({ label: 'ATTACK', id: 'attack', hot: game.attackMode, disabled: false });
    }
    if (canCharge) {
      buttons.push({ label: 'CHARGE', id: 'charge', hot: game.chargeMode, disabled: false });
    }
    if (canDigIn) {
      buttons.push({ label: 'DIG IN', id: 'digin', hot: sel.dugIn, disabled: false });
    }
    buttons.push({ label: 'WAIT', id: 'wait', hot: false, disabled: false });
  }

  buttons.push({ label: 'END TURN', id: 'endturn', hot: true, disabled: false });
  return buttons;
}

function getAdjacentEnemies(unit, game) {
  return game.attackTargets.filter(t =>
    Math.abs(t.q - unit.q) <= 1 && Math.abs(t.r - unit.r) <= 1
  );
}

export function getButtonAt(px, py, game) {
  for (const { btn, x, y, w, h } of getButtonRects(game)) {
    if (px >= x && px <= x + w && py >= y && py <= y + h) return btn;
  }
  return null;
}

export function drawOverlay(ctx, game) {
  if (game.state === S.MENU) drawMenuOverlay(ctx, game);
  else if (game.state === S.BATTLE_SELECT) drawBattleSelectOverlay(ctx, game);
  else if (game.state === S.SIDE_SELECT) drawSideSelectOverlay(ctx, game);
  else if (game.state === S.VICTORY) drawEndOverlay(ctx, game, true);
  else if (game.state === S.DEFEAT) drawEndOverlay(ctx, game, false);
  else if (game.nightTimer > 0) drawNightOverlay(ctx, game);
  else if (game.combatMsg) drawCombatMessage(ctx, game);
}

function drawMenuOverlay(ctx, game) {
  ctx.fillStyle = 'rgba(10,8,0,0.96)';
  ctx.fillRect(0, 0, W, H);

  ctx.fillStyle = '#c8a850';
  ctx.font = 'bold 40px serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('CIVIL WAR GENERALS', W / 2, H / 2 - 80);

  ctx.fillStyle = '#806838';
  ctx.font = 'italic 16px serif';
  ctx.fillText('A Browser Wargame', W / 2, H / 2 - 44);

  ctx.fillStyle = '#5a4020';
  ctx.font = '13px serif';
  ctx.fillText('Inspired by Sierra On-Line\'s classic strategy series', W / 2, H / 2 - 18);

  drawButton(ctx, W / 2 - 120, H / 2 + 10, 240, 40, 'SELECT BATTLE', true);

  ctx.fillStyle = '#504030';
  ctx.font = FONT_SMALL;
  ctx.fillText(`${BATTLES.length} historical battles — Bull Run, Shiloh, Antietam, Gettysburg`, W / 2, H / 2 + 70);
  ctx.fillText('Command Union or Confederate forces in each engagement', W / 2, H / 2 + 84);
  ctx.fillText('Break the enemy\'s morale to claim victory', W / 2, H / 2 + 98);

  if (BUILD_LABEL) {
    ctx.fillStyle = '#6a5a38';
    ctx.font = '9px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    ctx.fillText(`v ${BUILD_LABEL}`, W / 2, H - 8);
  }
}

function getBattleSelectLayout() {
  const compact = H < 520;
  const cardW   = Math.min(460, W - 24);
  const cardH   = compact ? 48 : 64;
  const gap     = compact ? 7 : 12;
  const x       = Math.floor((W - cardW) / 2);
  const totalH  = BATTLES.length * cardH + (BATTLES.length - 1) * gap;
  const y0      = Math.max(compact ? 40 : 90, Math.floor((H - totalH) / 2));
  return { compact, cardW, cardH, gap, x, y0 };
}

function drawBattleSelectOverlay(ctx, game) {
  ctx.fillStyle = 'rgba(10,8,0,0.97)';
  ctx.fillRect(0, 0, W, H);

  const l = getBattleSelectLayout();
  ctx.fillStyle = '#c8a850';
  ctx.font = `bold ${l.compact ? 16 : 26}px serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.fillText('CHOOSE YOUR BATTLE', W / 2, l.compact ? 6 : 30);

  BATTLES.forEach((battle, i) => {
    const y = l.y0 + i * (l.cardH + l.gap);
    ctx.fillStyle = '#241708';
    ctx.strokeStyle = '#806040';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(l.x, y, l.cardW, l.cardH, 6);
    ctx.fill();
    ctx.stroke();

    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillStyle = '#e0c070';
    ctx.font = `bold ${l.compact ? 12 : 15}px serif`;
    ctx.fillText(battle.name, l.x + 14, y + (l.compact ? 6 : 9));

    ctx.fillStyle = '#907850';
    ctx.font = `${l.compact ? 9 : 11}px serif`;
    ctx.fillText(`${battle.dateLabel}  •  ${battle.place}`, l.x + 14, y + (l.compact ? 24 : 30));

    if (!l.compact) {
      ctx.fillStyle = '#605038';
      ctx.font = '10px sans-serif';
      const blurb = battle.blurb.length > 78 ? battle.blurb.slice(0, 75) + '…' : battle.blurb;
      ctx.fillText(blurb, l.x + 14, y + 47);
    }

    ctx.textAlign = 'right';
    ctx.fillStyle = '#a08040';
    ctx.font = `bold ${l.compact ? 12 : 15}px serif`;
    ctx.textBaseline = 'middle';
    ctx.fillText('›', l.x + l.cardW - 14, y + l.cardH / 2);
  });

  drawBack(ctx);
}

function drawBack(ctx) {
  ctx.fillStyle = '#807050';
  ctx.font = 'bold 12px serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  ctx.fillText('‹ BACK', 14, 12);
}

function getSideSelectLayout() {
  const compact = H < 520;
  const pad = 8;
  if (compact) {
    const headerH = 52;
    const cardY   = headerH + pad / 2;
    const cardH   = H - cardY - pad;
    const cardW   = Math.floor((W - pad * 3) / 2);
    const leftX   = pad;
    const rightX  = pad * 2 + cardW;
    const btnH    = 40;
    const btnW    = cardW - pad * 2;
    const btnY    = cardY + cardH - btnH - pad;
    return { compact, headerH, cardY, cardH, cardW, leftX, rightX, btnH, btnW, btnY,
             unionBtnX: leftX + pad, confBtnX: rightX + pad };
  } else {
    const cardW  = Math.min(310, Math.floor((W - 60) / 2 - 10));
    const leftX  = Math.floor(W / 2 - cardW - 20);
    const rightX = Math.floor(W / 2 + 20);
    const cardY  = Math.min(150, Math.floor(H * 0.25));
    const cardH  = Math.min(260, Math.floor(H * 0.55));
    const btnH   = 36;
    const btnW   = cardW - 30;
    const btnY   = cardY + cardH - btnH - 14;
    return { compact, cardW, leftX, rightX, cardY, cardH, btnH, btnW, btnY,
             unionBtnX: leftX + 15, confBtnX: rightX + 15 };
  }
}

function drawSideSelectOverlay(ctx, game) {
  ctx.fillStyle = 'rgba(10,8,0,0.97)';
  ctx.fillRect(0, 0, W, H);

  const l  = getSideSelectLayout();
  const sc = game.scenario || BATTLES[0];
  const uNames = sc.units.filter(u => u.side === 'union').map(u => u.name);
  const cNames = sc.units.filter(u => u.side === 'confederate').map(u => u.name);

  // Header
  ctx.fillStyle = '#c8a850';
  ctx.font = `bold ${l.compact ? 17 : 24}px serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.fillText('CHOOSE YOUR SIDE', W / 2, l.compact ? 5 : H * 0.12);

  ctx.fillStyle = '#806838';
  ctx.font = `${l.compact ? 10 : 13}px serif`;
  ctx.fillText(`${sc.name}  •  ${sc.dateLabel}`, W / 2, l.compact ? 25 : H * 0.12 + 28);

  // Union card
  ctx.fillStyle = COLORS.union;
  ctx.strokeStyle = COLORS.unionLight;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(l.leftX, l.cardY, l.cardW, l.cardH, 6);
  ctx.fill(); ctx.stroke();

  // Confederate card
  ctx.fillStyle = '#2a1a0a';
  ctx.strokeStyle = COLORS.confLight;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(l.rightX, l.cardY, l.cardW, l.cardH, 6);
  ctx.fill(); ctx.stroke();

  const lcx = l.leftX  + l.cardW / 2;
  const rcx = l.rightX + l.cardW / 2;

  if (l.compact) {
    const ty = l.cardY + 10;
    ctx.textBaseline = 'top';
    ctx.textAlign = 'center';

    ctx.fillStyle = '#aaccff';
    ctx.font = 'bold 14px serif';
    ctx.fillText('UNION', lcx, ty);
    ctx.fillStyle = '#cce0ff';
    ctx.font = '10px serif';
    ctx.fillText(sc.union.army, lcx, ty + 18);
    ctx.fillText(sc.union.commander, lcx, ty + 31);

    ctx.fillStyle = '#7799cc';
    ctx.font = '9px sans-serif';
    ctx.textAlign = 'left';
    uNames.slice(0, 4).forEach((u, i) => ctx.fillText('• ' + u, l.leftX + 6, ty + 50 + i * 13));

    ctx.fillStyle = '#ddd8aa';
    ctx.font = 'bold 14px serif';
    ctx.textAlign = 'center';
    ctx.fillText('CONFEDERATE', rcx, ty);
    ctx.fillStyle = '#eee8cc';
    ctx.font = '10px serif';
    ctx.fillText(sc.confederate.army, rcx, ty + 18);
    ctx.fillText(sc.confederate.commander, rcx, ty + 31);

    ctx.fillStyle = '#b8a070';
    ctx.font = '9px sans-serif';
    ctx.textAlign = 'left';
    cNames.slice(0, 4).forEach((u, i) => ctx.fillText('• ' + u, l.rightX + 6, ty + 50 + i * 13));

    drawButton(ctx, l.unionBtnX, l.btnY, l.btnW, l.btnH, 'PLAY AS UNION', false);
    drawButton(ctx, l.confBtnX,  l.btnY, l.btnW, l.btnH, 'CONFEDERATE',   false);
  } else {
    const ty = l.cardY + 30;
    ctx.textBaseline = 'top';
    ctx.textAlign = 'center';

    ctx.fillStyle = '#aaccff';
    ctx.font = 'bold 20px serif';
    ctx.fillText('UNION', lcx, ty);
    ctx.fillStyle = '#dde8ff';
    ctx.font = '11px serif';
    ctx.fillText(sc.union.army, lcx, ty + 24);
    ctx.fillText(sc.union.commander, lcx, ty + 38);

    ctx.fillStyle = '#ddd8aa';
    ctx.font = 'bold 20px serif';
    ctx.fillText('CONFEDERATE', rcx, ty);
    ctx.fillStyle = '#eee8cc';
    ctx.font = '11px serif';
    ctx.fillText(sc.confederate.army, rcx, ty + 24);
    ctx.fillText(sc.confederate.commander, rcx, ty + 38);

    ctx.fillStyle = '#8899bb';
    ctx.font = '10px sans-serif';
    ctx.textAlign = 'left';
    uNames.slice(0, 8).forEach((u, i) => ctx.fillText('• ' + u, l.leftX + 14, l.cardY + 86 + i * 14));
    ctx.fillStyle = '#bba888';
    cNames.slice(0, 8).forEach((u, i) => ctx.fillText('• ' + u, l.rightX + 14, l.cardY + 86 + i * 14));

    drawButton(ctx, l.unionBtnX, l.btnY, l.btnW, l.btnH, 'PLAY AS UNION',        false);
    drawButton(ctx, l.confBtnX,  l.btnY, l.btnW, l.btnH, 'PLAY AS CONFEDERATE',  false);

    ctx.fillStyle = '#504030';
    ctx.font = FONT_SMALL;
    ctx.textAlign = 'center';
    ctx.fillText('Victory: Break enemy morale below 28%. Morale drops through combat losses and routs.', W / 2, H - 30);
  }

  drawBack(ctx);
}

function drawEndOverlay(ctx, game, isVictory) {
  ctx.fillStyle = 'rgba(0,0,0,0.88)';
  ctx.fillRect(0, 0, W, H);

  ctx.fillStyle = isVictory ? '#f0d060' : '#cc5050';
  ctx.font = 'bold 42px serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  const winner = isVictory ? (game.playerSide === 'union' ? 'UNION' : 'CONFEDERATE') : (game.playerSide === 'union' ? 'CONFEDERATE' : 'UNION');
  ctx.fillText(`${winner} VICTORY`, W / 2, H / 2 - 60);

  ctx.fillStyle = '#a09060';
  ctx.font = '16px serif';
  ctx.fillText(isVictory ? 'The enemy army has broken.' : 'Your forces have been routed.', W / 2, H / 2 - 10);

  ctx.fillStyle = '#706040';
  ctx.font = '13px serif';
  ctx.fillText(`Battle ended on Turn ${game.turn}`, W / 2, H / 2 + 20);

  drawButton(ctx, W / 2 - 100, H / 2 + 60, 200, 40, 'PLAY AGAIN', true);
}

function drawNightOverlay(ctx, game) {
  const alpha = Math.min(0.85, game.nightTimer / 0.4);
  ctx.fillStyle = `rgba(0,0,20,${alpha})`;
  ctx.fillRect(0, 0, W, H);

  if (alpha > 0.5) {
    const textAlpha = (alpha - 0.5) / 0.35;
    ctx.globalAlpha = Math.min(1, textAlpha);
    const day = Math.floor((game.turn - 1) / 6) + 2;
    ctx.fillStyle = '#8898cc';
    ctx.font = 'bold 28px serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('NIGHT HAS FALLEN', W / 2, H / 2 - 30);
    ctx.fillStyle = '#606880';
    ctx.font = '14px serif';
    ctx.fillText('Units rest and recover', W / 2, H / 2 + 10);
    ctx.fillStyle = '#a8b8e0';
    ctx.font = 'bold 16px serif';
    ctx.fillText(`Day ${day} begins with the dawn`, W / 2, H / 2 + 44);
    ctx.globalAlpha = 1;
  }
}

function drawCombatMessage(ctx, game) {
  const msg = game.combatMsg;
  if (!msg) return;
  const age = (performance.now() - msg.time) / 1000;
  if (age > 2.5) { game.combatMsg = null; return; }

  const alpha = age < 1.5 ? 1 : Math.max(0, 1 - (age - 1.5));
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.fillStyle = 'rgba(10,5,0,0.85)';
  ctx.beginPath();
  ctx.roundRect(W / 2 - 200, PANEL_TOP - 70, 400, 58, 6);
  ctx.fill();

  ctx.strokeStyle = msg.color || '#806040';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  ctx.fillStyle = msg.color || '#c8a840';
  ctx.font = 'bold 13px serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.fillText(msg.title, W / 2, PANEL_TOP - 64);

  ctx.fillStyle = '#a08050';
  ctx.font = '11px sans-serif';
  ctx.fillText(msg.body, W / 2, PANEL_TOP - 46);
  ctx.restore();
}

function drawButton(ctx, x, y, w, h, label, hot) {
  ctx.fillStyle = hot ? '#c8a840' : '#6b5a3a';
  ctx.strokeStyle = hot ? '#f0d060' : '#9b8a5a';
  ctx.lineWidth = hot ? 2 : 1;
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, 5);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = hot ? '#1a1000' : '#ddd8c8';
  ctx.font = `bold ${hot ? 14 : 13}px serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(label, x + w / 2, y + h / 2);
}

export function getMenuButtonAt(px, py, game) {
  if (game.state === S.MENU) {
    const bx = W / 2 - 120, by = H / 2 + 10, bw = 240, bh = 40;
    if (px >= bx && px <= bx + bw && py >= by && py <= by + bh) return 'play';
  }
  if (game.state === S.BATTLE_SELECT) {
    if (px < 80 && py < 34) return 'back';
    const l = getBattleSelectLayout();
    for (let i = 0; i < BATTLES.length; i++) {
      const y = l.y0 + i * (l.cardH + l.gap);
      if (px >= l.x && px <= l.x + l.cardW && py >= y && py <= y + l.cardH) return `battle:${i}`;
    }
  }
  if (game.state === S.SIDE_SELECT) {
    if (px < 80 && py < 34) return 'back';
    const l = getSideSelectLayout();
    if (l.compact) {
      if (px >= l.leftX  && px <= l.leftX  + l.cardW && py >= l.cardY && py <= l.cardY + l.cardH) return 'union';
      if (px >= l.rightX && px <= l.rightX + l.cardW && py >= l.cardY && py <= l.cardY + l.cardH) return 'confederate';
    } else {
      if (px >= l.unionBtnX && px <= l.unionBtnX + l.btnW && py >= l.btnY && py <= l.btnY + l.btnH) return 'union';
      if (px >= l.confBtnX  && px <= l.confBtnX  + l.btnW && py >= l.btnY && py <= l.btnY + l.btnH) return 'confederate';
    }
  }
  if (game.state === S.VICTORY || game.state === S.DEFEAT) {
    const bx = W / 2 - 100, by = H / 2 + 60, bw = 200, bh = 40;
    if (px >= bx && px <= bx + bw && py >= by && py <= by + bh) return 'again';
  }
  return null;
}

export function getArmyMorale(units, side) {
  return units
    .filter(u => u.side === side && !u.routed)
    .reduce((sum, u) => sum + u.morale, 0);
}

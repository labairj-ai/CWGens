import { W, H, COLORS, PANEL_TOP, UNIT_TYPES, S } from './constants.js';

const FONT_TITLE = 'bold 13px serif';
const FONT_BODY  = '11px sans-serif';
const FONT_SMALL = '10px sans-serif';

export function drawHUD(ctx, game) {
  const unionMorale  = getArmyMorale(game.units, 'union');
  const confMorale   = getArmyMorale(game.units, 'confederate');
  const unionStart   = game.startMorale?.union  || 1;
  const confStart    = game.startMorale?.confederate || 1;
  const unionPct  = unionMorale / unionStart;
  const confPct   = confMorale  / confStart;

  ctx.fillStyle = COLORS.hud;
  ctx.fillRect(0, 0, W, 88);

  ctx.strokeStyle = COLORS.hudLine;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(0, 88);
  ctx.lineTo(W, 88);
  ctx.stroke();

  ctx.fillStyle = '#a08050';
  ctx.font = 'bold 16px serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.fillText('BATTLE OF GETTYSBURG', W / 2, 6);

  const dayNum = Math.floor((game.turn - 1) / 6) + 1;
  const timeOfDay = game.nightTimer > 0 ? 'Night' : ['Morning','Midday','Afternoon'][Math.floor(((game.turn - 1) % 6) / 2)] || 'Afternoon';
  ctx.fillStyle = '#7a6040';
  ctx.font = FONT_BODY;
  ctx.fillText(`July ${dayNum + 0}, 1863  •  ${timeOfDay}  •  Turn ${game.turn}`, W / 2, 26);

  drawMoraleBar(ctx, 20, 48, 'UNION', unionPct, COLORS.union, COLORS.unionLight, game.playerSide === 'union');
  drawMoraleBar(ctx, W / 2 + 10, 48, 'CONFEDERATE', confPct, COLORS.confederate, COLORS.confLight, game.playerSide === 'confederate');

  ctx.fillStyle = '#504030';
  ctx.font = FONT_SMALL;
  ctx.textAlign = 'right';
  ctx.fillText(`v${typeof __BUILD_TIME__ !== 'undefined' ? __BUILD_TIME__.slice(0, 10) : ''}`, W - 4, 4);
}

function drawMoraleBar(ctx, x, y, label, pct, bg, fg, isPlayer) {
  const barW = 200, barH = 14;
  ctx.fillStyle = isPlayer ? '#f0c060' : '#706040';
  ctx.font = 'bold 10px sans-serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  ctx.fillText(label, x, y);

  ctx.fillStyle = '#0a0800';
  ctx.fillRect(x, y + 14, barW, barH);

  const filled = Math.max(0, Math.min(1, pct)) * barW;
  const barColor = pct > 0.5 ? '#3aaa3a' : pct > 0.28 ? '#aaaa20' : '#cc3030';
  ctx.fillStyle = barColor;
  ctx.fillRect(x, y + 14, filled, barH);

  ctx.strokeStyle = '#504030';
  ctx.lineWidth = 1;
  ctx.strokeRect(x, y + 14, barW, barH);

  ctx.fillStyle = 'white';
  ctx.font = FONT_SMALL;
  ctx.textAlign = 'right';
  ctx.fillText(`${Math.min(100, Math.round(pct * 100))}%`, x + barW - 2, y + 16);
}

export function drawBottomPanel(ctx, game) {
  ctx.fillStyle = '#120d00';
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
    ctx.fillText('ENEMY MOVING...', W / 2, PANEL_TOP + 44);
    return;
  }

  if (game.state === S.NIGHT) {
    ctx.fillStyle = '#8898cc';
    ctx.font = 'bold 14px serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('NIGHT — Units Recovering', W / 2, PANEL_TOP + 44);
    return;
  }

  if (sel) {
    const sideColor = sel.side === 'union' ? COLORS.unionLight : COLORS.confLight;
    ctx.fillStyle = sideColor;
    ctx.font = FONT_TITLE;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText(sel.name, 12, PANEL_TOP + 6);

    ctx.fillStyle = '#806040';
    ctx.font = FONT_SMALL;
    const typeName = UNIT_TYPES[sel.type]?.name || sel.type;
    ctx.fillText(`${typeName}  •  ${sel.side === 'union' ? 'Union' : 'Confederate'}`, 12, PANEL_TOP + 22);

    drawStatBars(ctx, sel);
  } else {
    ctx.fillStyle = '#504030';
    ctx.font = FONT_BODY;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText('Click a unit to select it', 12, PANEL_TOP + 30);
  }

  drawActionButtons(ctx, game);
}

function drawStatBars(ctx, unit) {
  const y = PANEL_TOP + 40;
  const bars = [
    { label: 'MORALE', pct: unit.morale / 100, color: unit.morale > 60 ? '#44cc44' : unit.morale > 30 ? '#cccc22' : '#cc3333' },
    { label: 'STR',    pct: unit.strength / (unit.maxStrength || unit.strength), color: '#4488cc' },
    { label: 'ORG',    pct: unit.org / 100,     color: '#cc8844' },
    { label: 'AMMO',   pct: unit.ammo / (unit._typeDef?.ammoCap || 1), color: '#cc44cc' },
  ];

  bars.forEach(({ label, pct, color }, i) => {
    const bx = 12 + i * 130;
    ctx.fillStyle = '#604030';
    ctx.font = '9px monospace';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText(label, bx, y);
    ctx.fillStyle = '#0a0800';
    ctx.fillRect(bx, y + 11, 110, 8);
    ctx.fillStyle = color;
    ctx.fillRect(bx, y + 11, Math.max(0, Math.min(1, pct)) * 110, 8);
    ctx.strokeStyle = '#403020';
    ctx.lineWidth = 0.5;
    ctx.strokeRect(bx, y + 11, 110, 8);
    let val = '';
    if (label === 'MORALE') val = String(Math.round(unit.morale));
    else if (label === 'STR') val = `${Math.ceil(unit.strength)}/${unit.maxStrength || unit.strength}`;
    else if (label === 'ORG') val = String(Math.round(unit.org));
    else if (label === 'AMMO') val = String(unit.ammo);
    ctx.font = '8px monospace';
    ctx.textAlign = 'left';
    ctx.fillStyle = 'rgba(0,0,0,0.55)';
    ctx.fillText(val, bx + 2, y + 12);
    ctx.fillStyle = 'rgba(255,255,255,0.9)';
    ctx.fillText(val, bx + 1, y + 11);
  });
}

export function drawActionButtons(ctx, game) {
  const buttons = getButtons(game);
  const bh = 28, by = PANEL_TOP + 56;
  const bw = 90;
  const startX = W - buttons.length * (bw + 8) - 8;

  buttons.forEach((btn, i) => {
    const bx = startX + i * (bw + 8);
    const disabled = btn.disabled;
    const hot = btn.hot;

    ctx.fillStyle = disabled ? '#2a2010' : hot ? '#f0c040' : COLORS.parchment;
    ctx.strokeStyle = disabled ? '#403020' : hot ? '#c09010' : '#806040';
    ctx.lineWidth = hot ? 2 : 1;
    ctx.beginPath();
    ctx.roundRect(bx, by, bw, bh, 4);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = disabled ? '#504030' : COLORS.darkText;
    ctx.font = hot ? 'bold 11px serif' : '11px serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(btn.label, bx + bw / 2, by + bh / 2);
  });

  return buttons.map((btn, i) => ({ ...btn, x: startX + i * (bw + 8), y: by, w: bw, h: bh }));
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
  const bh = 28, by = PANEL_TOP + 56;
  const bw = 90;
  const buttons = getButtons(game);
  const startX = W - buttons.length * (bw + 8) - 8;

  for (let i = 0; i < buttons.length; i++) {
    const bx = startX + i * (bw + 8);
    if (px >= bx && px <= bx + bw && py >= by && py <= by + bh) {
      return buttons[i];
    }
  }
  return null;
}

export function drawOverlay(ctx, game) {
  if (game.state === S.MENU) drawMenuOverlay(ctx, game);
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

  drawButton(ctx, W / 2 - 120, H / 2 + 10, 240, 40, 'BATTLE OF GETTYSBURG', true);

  ctx.fillStyle = '#504030';
  ctx.font = FONT_SMALL;
  ctx.fillText('July 1-3, 1863 • Gettysburg, Pennsylvania', W / 2, H / 2 + 70);
  ctx.fillText('Lead Union or Confederate forces in the pivotal battle', W / 2, H / 2 + 84);
  ctx.fillText('that decided the fate of the Confederacy', W / 2, H / 2 + 98);
}

function drawSideSelectOverlay(ctx, game) {
  ctx.fillStyle = 'rgba(10,8,0,0.96)';
  ctx.fillRect(0, 0, W, H);

  ctx.fillStyle = '#c8a850';
  ctx.font = 'bold 24px serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('CHOOSE YOUR SIDE', W / 2, 80);

  ctx.fillStyle = '#806838';
  ctx.font = '13px serif';
  ctx.fillText('Battle of Gettysburg  •  July 1-3, 1863', W / 2, 108);

  ctx.fillStyle = COLORS.union;
  ctx.fillRect(80, 150, 310, 260);
  ctx.strokeStyle = COLORS.unionLight;
  ctx.lineWidth = 2;
  ctx.strokeRect(80, 150, 310, 260);

  ctx.fillStyle = COLORS.confederate;
  ctx.fillRect(510, 150, 310, 260);
  ctx.strokeStyle = COLORS.confLight;
  ctx.lineWidth = 2;
  ctx.strokeRect(510, 150, 310, 260);

  ctx.fillStyle = '#aaccff';
  ctx.font = 'bold 20px serif';
  ctx.textAlign = 'center';
  ctx.fillText('UNION', 235, 185);
  ctx.fillStyle = '#dde8ff';
  ctx.font = '11px serif';
  ctx.fillText('Army of the Potomac', 235, 205);
  ctx.fillText('General George Meade', 235, 220);

  ctx.fillStyle = '#ddd8aa';
  ctx.font = 'bold 20px serif';
  ctx.fillText('CONFEDERATE', 665, 185);
  ctx.fillStyle = '#eee8cc';
  ctx.font = '11px serif';
  ctx.fillText('Army of Northern Virginia', 665, 205);
  ctx.fillText('General Robert E. Lee', 665, 220);

  const uUnits = ['Howard\'s Corps', 'Reynolds\' Corps', 'Hancock\'s Corps', 'Sickles\' Corps', 'Sedgwick\'s Corps', 'Buford\'s Cavalry', 'Artillery Reserve', 'Gen. Meade'];
  const cUnits = ['Rodes\' Division', 'Heth\'s Division', 'McLaws\' Division', 'Hood\'s Division', 'Early\'s Division', 'Stuart\'s Cavalry', 'Long. Artillery', 'Gen. R.E. Lee'];

  ctx.fillStyle = '#8899bb';
  ctx.font = '10px sans-serif';
  ctx.textAlign = 'left';
  uUnits.forEach((u, i) => ctx.fillText('• ' + u, 95, 242 + i * 14));

  ctx.fillStyle = '#bba888';
  ctx.textAlign = 'left';
  cUnits.forEach((u, i) => ctx.fillText('• ' + u, 525, 242 + i * 14));

  drawButton(ctx, 110, 386, 250, 36, 'PLAY AS UNION', false);
  drawButton(ctx, 540, 386, 250, 36, 'PLAY AS CONFEDERATE', false);

  ctx.fillStyle = '#504030';
  ctx.font = FONT_SMALL;
  ctx.textAlign = 'center';
  ctx.fillText('Victory: Break enemy morale below 28%. Morale drops through combat losses and routs.', W / 2, H - 30);
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
  if (game.state === S.SIDE_SELECT) {
    if (px >= 110 && px <= 360 && py >= 386 && py <= 422) return 'union';
    if (px >= 540 && px <= 790 && py >= 386 && py <= 422) return 'confederate';
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

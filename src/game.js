import {
  S, GETTYSBURG_TERRAIN, GETTYSBURG_UNITS, UNIT_TYPES,
  TERRAIN, MORALE_ROUT_THRESHOLD, MORALE_RETREAT_THRESHOLD,
  VICTORY_MORALE_PCT, TURNS_PER_DAY, MAX_TURNS,
  DIG_IN_COVER, REINFORCEMENTS, HUD_H, PANEL_TOP,
} from './constants.js';
import {
  getMovableHexes, getAttackableTargets, getHexesInAttackRange,
  hexDistance, getNeighbors, pixelToHex
} from './hex.js';
import { drawAllTerrain, drawHighlights, drawFlashEffects, drawWaterAnimations } from './terrain.js';
import { drawAllUnits } from './units.js';
import { drawFog, getVisibleHexes } from './fog.js';
import { buildAIActions } from './ai.js';
import {
  drawHUD, drawBottomPanel, drawOverlay, getButtonAt, getMenuButtonAt, getArmyMorale
} from './ui.js';
import {
  playMusket, playCannon, playBugle, playDrum,
  playRetreat, playVictory, playDefeat, playNight
} from './sounds.js';

export class Game {
  constructor() {
    this.state = S.MENU;
    this.terrain = null;
    this.units = [];
    this.playerSide = null;
    this.selectedUnit = null;
    this.moveHexes = [];
    this.attackTargets = [];
    this.turn = 1;
    this.aiQueue = [];
    this.aiTimer = 0;
    this.aiDelay = 0.75;
    this.aiActiveUnit = null;
    this.startMorale = null;
    this.nightTimer = 0;
    this.effects = [];
    this.combatMsg = null;
    this.attackMode = false;
    this.chargeMode = false;
    this.rangeHexes = [];
  }

  startBattle(playerSide) {
    this.playerSide = playerSide;
    this.terrain = GETTYSBURG_TERRAIN.map(row => [...row]);
    this.units = GETTYSBURG_UNITS.map(u => ({
      ...u,
      maxStrength: u.strength,
      org: 90,
      ammo: UNIT_TYPES[u.type].ammoCap,
      hasMoved: false,
      hasAttacked: false,
      routed: false,
      dugIn: false,
      _typeDef: UNIT_TYPES[u.type],
    }));
    this.turn = 1;
    this.startMorale = {
      union: getArmyMorale(this.units, 'union'),
      confederate: getArmyMorale(this.units, 'confederate'),
    };
    this.selectedUnit = null;
    this.moveHexes = [];
    this.attackTargets = [];
    this.aiQueue = [];
    this.aiActiveUnit = null;
    this.nightTimer = 0;
    this.effects = [];
    this.combatMsg = null;
    this.state = S.PLAYER_TURN;
    playDrum();
  }

  update(dt) {
    if (this.nightTimer > 0) {
      this.nightTimer -= dt;
      if (this.nightTimer <= 0) {
        this.nightTimer = 0;
        this.applyNightRecovery();
        this.state = S.PLAYER_TURN;
        playDrum();
      }
      return;
    }

    if (this.state === S.ENEMY_TURN) {
      this.aiTimer += dt;
      if (this.aiTimer >= this.aiDelay) {
        this.aiTimer = 0;
        if (this.aiQueue.length > 0) {
          this.executeAIAction(this.aiQueue.shift());
        } else {
          this.aiActiveUnit = null;
          this.finishEnemyTurn();
        }
      }
    }

    const now = performance.now();
    this.effects = this.effects.filter(e => (now - e.startTime) / 1000 < 1.5);
    if (this.combatMsg && (now - this.combatMsg.time) / 1000 > 2.5) {
      this.combatMsg = null;
    }
  }

  draw(ctx, panX = 0, panY = 0) {
    if (this.terrain) {
      const now = performance.now();
      ctx.save();
      ctx.translate(panX, panY);
      drawAllTerrain(ctx, this.terrain);
      drawWaterAnimations(ctx, this.terrain, now);
      drawHighlights(ctx, this.moveHexes, this.attackTargets, this.selectedUnit, this.rangeHexes);
      const visible = this.playerSide ? getVisibleHexes(this.units, this.playerSide) : null;
      drawAllUnits(ctx, this.units, this.selectedUnit, this.aiActiveUnit, visible, this.playerSide);
      drawFlashEffects(ctx, this.effects, now);
      drawFog(ctx, this.terrain, this.units, this.playerSide, visible);
      ctx.restore();
    }
    drawHUD(ctx, this);
    drawBottomPanel(ctx, this);
    drawOverlay(ctx, this);
  }

  handleClick(gx, gy, panX = 0, panY = 0) {
    if (this.nightTimer > 0) return;

    // Menu overlays and HUD/panel buttons use raw canvas coords (no pan)
    const menuBtn = getMenuButtonAt(gx, gy, this);
    if (menuBtn) {
      if (menuBtn === 'play') { this.state = S.SIDE_SELECT; return; }
      if (menuBtn === 'union') { this.startBattle('union'); return; }
      if (menuBtn === 'confederate') { this.startBattle('confederate'); return; }
      if (menuBtn === 'again') { this.state = S.MENU; return; }
    }

    if (this.state !== S.PLAYER_TURN) return;

    const btn = getButtonAt(gx, gy, this);
    if (btn) {
      this.handleButtonClick(btn.id);
      return;
    }

    // Pass raw screen coords + pan so handleMapClick can check bounds in screen space
    this.handleMapClick(gx, gy, panX, panY);
  }

  handleButtonClick(id) {
    if (id === 'endturn') { this.endPlayerTurn(); return; }
    if (id === 'wait' && this.selectedUnit) {
      this.selectedUnit.hasMoved = true;
      this.selectedUnit.hasAttacked = true;
      this.clearSelection();
      return;
    }
    if (id === 'digin' && this.selectedUnit) {
      this.selectedUnit.dugIn = true;
      this.selectedUnit.hasMoved = true;
      this.clearSelection();
      return;
    }
    if (id === 'attack') {
      this.attackMode = !this.attackMode;
      this.chargeMode = false;
      return;
    }
    if (id === 'charge') {
      this.chargeMode = !this.chargeMode;
      this.attackMode = false;
      return;
    }
  }

  handleMapClick(gx, gy, panX = 0, panY = 0) {
    // Bounds check uses raw screen coords (HUD and panel are fixed, not panned)
    if (gy < HUD_H || gy > PANEL_TOP) return;
    // Hex lookup uses pan-adjusted coordinates to match where the map is drawn
    const hex = pixelToHex(gx - panX, gy - panY);
    if (!hex) return;

    const clickedUnit = this.units.find(u => u.q === hex.q && u.r === hex.r && !u.routed);

    if (this.selectedUnit && (this.attackMode || this.chargeMode)) {
      const target = this.attackTargets.find(t => t.q === hex.q && t.r === hex.r);
      if (target) {
        this.executeAttack(this.selectedUnit, target, this.chargeMode);
        this.attackMode = false;
        this.chargeMode = false;
        return;
      }
    }

    if (this.selectedUnit) {
      const target = this.attackTargets.find(t => t.q === hex.q && t.r === hex.r);
      if (target && !this.selectedUnit.hasAttacked) {
        this.executeAttack(this.selectedUnit, target, false);
        return;
      }

      const isMovable = this.moveHexes.some(h => h.q === hex.q && h.r === hex.r);
      if (isMovable && !this.selectedUnit.hasMoved) {
        this.moveUnit(this.selectedUnit, hex.q, hex.r);
        return;
      }

      if (clickedUnit && clickedUnit.side === this.playerSide) {
        this.selectUnit(clickedUnit);
        return;
      }

      this.clearSelection();
      return;
    }

    if (clickedUnit && clickedUnit.side === this.playerSide) {
      this.selectUnit(clickedUnit);
    }
  }

  selectUnit(unit) {
    if (unit.hasMoved && unit.hasAttacked) return;
    this.selectedUnit = unit;
    this.attackMode = false;
    this.chargeMode = false;

    if (!unit.hasMoved) {
      this.moveHexes = getMovableHexes(unit, this.units, this.terrain);
    } else {
      this.moveHexes = [];
    }

    if (!unit.hasAttacked && unit.ammo > 0) {
      this.attackTargets = getAttackableTargets(unit, this.units, this.terrain);
    } else {
      this.attackTargets = [];
    }

    this.rangeHexes = (!unit.hasAttacked && unit._typeDef.attackRange > 1)
      ? getHexesInAttackRange(unit, this.units)
      : [];
  }

  moveUnit(unit, q, r) {
    unit.q = q;
    unit.r = r;
    unit.hasMoved = true;
    unit.dugIn = false;  // moving breaks entrenchment
    unit.org = Math.max(20, unit.org - 8);

    if (!unit.hasAttacked && unit.ammo > 0) {
      this.attackTargets = getAttackableTargets(unit, this.units, this.terrain);
    }
    if (!unit.hasAttacked && unit._typeDef.attackRange > 1) {
      this.rangeHexes = getHexesInAttackRange(unit, this.units);
    }
    this.moveHexes = [];

    const general = this.units.find(u =>
      u.side === unit.side && u.type === 'general' && !u.routed &&
      hexDistance(u.q, u.r, unit.q, unit.r) <= 2
    );
    if (general) unit.morale = Math.min(100, unit.morale + 3);
  }

  executeAttack(attacker, target, isCharge) {
    const atkUnit = this.units.find(u => u.id === attacker.id);
    const defUnit = this.units.find(u => u.id === target.id);
    if (!atkUnit || !defUnit) return;

    const dist = hexDistance(atkUnit.q, atkUnit.r, defUnit.q, defUnit.r);
    const defTerrain = TERRAIN[this.terrain[defUnit.r][defUnit.q]];
    const cover = defTerrain.cover + (defUnit.dugIn ? DIG_IN_COVER : 0);

    const atkMoraleFactor = atkUnit.morale / 100;
    const defMoraleFactor = defUnit.morale / 100;

    const baseAtk = atkUnit.strength * atkMoraleFactor;
    const baseDef = defUnit.strength * defMoraleFactor;

    const atkRoll = (0.6 + Math.random() * 0.7) * baseAtk;
    const defRoll = (0.5 + Math.random() * 0.6) * baseDef;

    const defHitOnAtk = defRoll * (dist === 1 ? 1.0 : 0);
    const atkHitOnDef = atkRoll * (isCharge ? 2.0 : 1.0) * (1 - cover);
    const atkDamageRatio = isCharge ? 1.3 : 1.0;

    const moraleLossOnDef = Math.round(atkHitOnDef * 9 + 4);
    const strengthLossOnDef = atkHitOnDef * 0.35;
    const moraleLossOnAtk = Math.round(defHitOnAtk * 7 * atkDamageRatio);
    const strengthLossOnAtk = defHitOnAtk * 0.2 * atkDamageRatio;

    defUnit.morale = Math.max(0, defUnit.morale - moraleLossOnDef);
    defUnit.strength = Math.max(0, defUnit.strength - strengthLossOnDef);
    defUnit.org = Math.max(0, defUnit.org - 12);
    atkUnit.morale = Math.max(0, atkUnit.morale - moraleLossOnAtk);
    atkUnit.strength = Math.max(0, atkUnit.strength - strengthLossOnAtk);
    atkUnit.org = Math.max(0, atkUnit.org - 8);
    atkUnit.ammo = Math.max(0, atkUnit.ammo - (isCharge ? 2 : 1));
    atkUnit.hasAttacked = true;

    const soundFn = atkUnit.type === 'artillery' ? playCannon : playMusket;
    if (isCharge) playBugle();
    else soundFn();

    this.effects.push({
      q: defUnit.q, r: defUnit.r,
      text: `-${moraleLossOnDef} morale`,
      color: '#ff6644',
      startTime: performance.now(),
    });

    let msgTitle = isCharge ? 'CHARGE ATTACK!' : 'FIRE!';
    let msgBody = `${atkUnit.name} → ${defUnit.name}: -${moraleLossOnDef} morale`;
    let msgColor = isCharge ? '#ff9040' : '#c8a040';

    if (defUnit.morale <= MORALE_ROUT_THRESHOLD) {
      defUnit.routed = true;
      defUnit.ammo = 0;
      msgBody += ' — UNIT ROUTED!';
      msgColor = '#ff4444';
      playRetreat();
    } else if (defUnit.morale <= MORALE_RETREAT_THRESHOLD) {
      this.retreatUnit(defUnit);
      msgBody += ' — Unit retreats!';
      defUnit.morale -= 10;
      playRetreat();
    }

    this.combatMsg = { title: msgTitle, body: msgBody, color: msgColor, time: performance.now() };

    if (this.selectedUnit?.id === atkUnit.id) {
      this.clearSelection();
      if (!atkUnit.hasAttacked || !atkUnit.hasMoved) {
        this.selectUnit(atkUnit);
      }
    }

    this.checkVictory();
  }

  retreatUnit(unit) {
    const neighbors = getNeighbors(unit.q, unit.r);
    const safe = neighbors.filter(h => {
      if (this.terrain[h.r][h.q] === 'W') return false;
      const occ = this.units.find(u => u.q === h.q && u.r === h.r && !u.routed);
      return !occ || occ.side === unit.side;
    });

    const enemySide = unit.side === 'union' ? 'confederate' : 'union';
    const enemyUnits = this.units.filter(u => u.side === enemySide && !u.routed);

    if (safe.length > 0) {
      const best = safe.reduce((a, b) => {
        const distA = enemyUnits.reduce((s, e) => s + hexDistance(a.q, a.r, e.q, e.r), 0);
        const distB = enemyUnits.reduce((s, e) => s + hexDistance(b.q, b.r, e.q, e.r), 0);
        return distB > distA ? b : a;
      });
      unit.q = best.q;
      unit.r = best.r;
    }
  }

  clearSelection() {
    this.selectedUnit = null;
    this.moveHexes = [];
    this.attackTargets = [];
    this.rangeHexes = [];
    this.attackMode = false;
    this.chargeMode = false;
  }

  endPlayerTurn() {
    this.clearSelection();
    this.units.forEach(u => {
      if (u.side === this.playerSide) { u.hasMoved = false; u.hasAttacked = false; }
    });
    this.state = S.ENEMY_TURN;
    this.turn++;
    const aiSide = this.playerSide === 'union' ? 'confederate' : 'union';
    this.aiQueue = buildAIActions(this, aiSide);
    this.aiTimer = 0;
    playDrum();
  }

  executeAIAction(action) {
    const unit = this.units.find(u => u.id === action.unit.id);
    if (!unit || unit.routed) return;

    this.aiActiveUnit = unit;

    if (action.type === 'move') {
      this.moveUnit(unit, action.q, action.r);
    } else if (action.type === 'attack') {
      const target = this.units.find(u => u.id === action.target.id);
      if (target && !target.routed) {
        this.executeAttack(unit, target, action.isCharge);
      }
    }
  }

  finishEnemyTurn() {
    const aiSide = this.playerSide === 'union' ? 'confederate' : 'union';
    this.units.forEach(u => {
      if (u.side === aiSide) { u.hasMoved = false; u.hasAttacked = false; }
    });

    this.checkVictory();
    if (this.state === S.ENEMY_TURN) {
      if (this.turn % TURNS_PER_DAY === 0 && this.turn < MAX_TURNS) {
        this.nightTimer = 2.5;
        playNight();
      } else if (this.turn >= MAX_TURNS) {
        this.resolveTimeLimit();
      } else {
        this.processReinforcements();
        this.state = S.PLAYER_TURN;
        playDrum();
      }
    }
  }

  applyNightRecovery() {
    this.units.forEach(u => {
      if (!u.routed) {
        u.morale = Math.min(100, u.morale + 12);
        u.org = Math.min(100, u.org + 20);
        u.ammo = Math.min(u._typeDef.ammoCap, u.ammo + 2);
        u.strength = Math.min(u.maxStrength, u.strength + 0.5);
      }
    });
  }

  processReinforcements() {
    const arriving = REINFORCEMENTS.filter(r => r.turn === this.turn);
    for (const rein of arriving) {
      if (this.units.find(u => u.id === rein.id)) continue;
      const pos = this.findEntryHex(rein.q, rein.r);
      if (!pos) continue;
      this.units.push({
        ...rein,
        q: pos.q, r: pos.r,
        maxStrength: rein.strength,
        org: 88,
        ammo: UNIT_TYPES[rein.type].ammoCap,
        hasMoved: false,
        hasAttacked: false,
        routed: false,
        dugIn: false,
        _typeDef: UNIT_TYPES[rein.type],
      });
      const sideLabel = rein.side === 'union' ? 'Union' : 'Confederate';
      const sideColor = rein.side === 'union' ? '#4488ff' : '#dd8844';
      this.combatMsg = { title: 'REINFORCEMENTS!', body: `${rein.name} has arrived (${sideLabel})`, color: sideColor, time: performance.now() };
      playBugle();
    }
  }

  findEntryHex(q, r) {
    const candidates = [{ q, r }, ...getNeighbors(q, r)];
    for (const h of candidates) {
      if (h.q < 0 || h.q >= 16 || h.r < 0 || h.r >= 9) continue;
      if (!this.units.find(u => u.q === h.q && u.r === h.r && !u.routed)) return h;
    }
    return null;
  }

  checkVictory() {
    const unionMorale = getArmyMorale(this.units, 'union');
    const confMorale = getArmyMorale(this.units, 'confederate');
    const unionPct = unionMorale / (this.startMorale?.union || 1);
    const confPct = confMorale / (this.startMorale?.confederate || 1);

    if (confPct < VICTORY_MORALE_PCT) {
      this.state = this.playerSide === 'union' ? S.VICTORY : S.DEFEAT;
      this.playerSide === 'union' ? playVictory() : playDefeat();
    } else if (unionPct < VICTORY_MORALE_PCT) {
      this.state = this.playerSide === 'confederate' ? S.VICTORY : S.DEFEAT;
      this.playerSide === 'confederate' ? playVictory() : playDefeat();
    }
  }

  resolveTimeLimit() {
    const unionMorale = getArmyMorale(this.units, 'union');
    const confMorale = getArmyMorale(this.units, 'confederate');
    const playerSideMorale = this.playerSide === 'union' ? unionMorale : confMorale;
    const enemySideMorale = this.playerSide === 'union' ? confMorale : unionMorale;
    if (playerSideMorale >= enemySideMorale) {
      this.state = S.VICTORY;
      playVictory();
    } else {
      this.state = S.DEFEAT;
      playDefeat();
    }
  }
}

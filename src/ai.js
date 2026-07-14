import { UNIT_TYPES } from './constants.js';
import { hexDistance, getMovableHexes, getAttackableTargets } from './hex.js';

export function buildAIActions(game, aiSide) {
  const actions = [];
  const aiUnits = game.units.filter(u => u.side === aiSide && !u.routed && !u.hasAttacked);

  for (const unit of aiUnits) {
    if (unit.type === 'general') {
      if (!unit.hasMoved) {
        const mv = getBestGeneralMove(unit, game);
        if (mv) actions.push({ type: 'move', unit, q: mv.q, r: mv.r });
      }
      continue;
    }

    const canMove = !unit.hasMoved;
    const canAttack = !unit.hasAttacked && unit.ammo > 0 && unit._typeDef.attackRange > 0;

    const immediateTargets = getAttackableTargets(unit, game.units, game.terrain);

    if (immediateTargets.length > 0 && canAttack) {
      const target = pickBestTarget(immediateTargets);
      actions.push({ type: 'attack', unit, target, isCharge: false });
      continue;
    }

    if (canMove) {
      const moveHexes = getMovableHexes(unit, game.units, game.terrain);
      const bestMove = getBestMoveHex(unit, moveHexes, game);
      if (bestMove) {
        actions.push({ type: 'move', unit, q: bestMove.q, r: bestMove.r });
        const unitAfterMove = { ...unit, q: bestMove.q, r: bestMove.r, hasMoved: true };
        const targetsAfterMove = getAttackableTargets(unitAfterMove, game.units, game.terrain);
        if (targetsAfterMove.length > 0 && canAttack) {
          const target = pickBestTarget(targetsAfterMove);
          actions.push({ type: 'attack', unit: unitAfterMove, target, isCharge: false });
        }
      }
    }
  }

  return actions;
}

function pickBestTarget(targets) {
  return targets.reduce((best, t) =>
    t.morale < best.morale ? t : best, targets[0]);
}

function getBestMoveHex(unit, moveHexes, game) {
  if (!moveHexes.length) return null;
  const playerUnits = game.units.filter(u => u.side !== unit.side && !u.routed);
  if (!playerUnits.length) return null;

  const nearest = playerUnits.reduce((best, u) =>
    hexDistance(unit.q, unit.r, u.q, u.r) < hexDistance(unit.q, unit.r, best.q, best.r) ? u : best
  );

  const attackRange = unit._typeDef.attackRange;

  return moveHexes.reduce((best, h) => {
    const distToBest = hexDistance(h.q, h.r, nearest.q, nearest.r);
    const distCurBest = hexDistance(best.q, best.r, nearest.q, nearest.r);
    const idealDist = attackRange > 1 ? attackRange : 1;
    const scoreDist = Math.abs(distToBest - idealDist);
    const scoreBest = Math.abs(distCurBest - idealDist);
    return scoreDist < scoreBest ? h : best;
  }, moveHexes[0]);
}

function getBestGeneralMove(unit, game) {
  const moveHexes = getMovableHexes(unit, game.units, game.terrain);
  if (!moveHexes.length) return null;
  const friendlies = game.units.filter(u => u.side === unit.side && u.type !== 'general' && !u.routed);
  if (!friendlies.length) return null;

  const centroid = {
    q: Math.round(friendlies.reduce((s, u) => s + u.q, 0) / friendlies.length),
    r: Math.round(friendlies.reduce((s, u) => s + u.r, 0) / friendlies.length),
  };

  return moveHexes.reduce((best, h) =>
    hexDistance(h.q, h.r, centroid.q, centroid.r) < hexDistance(best.q, best.r, centroid.q, centroid.r) ? h : best
  , moveHexes[0]);
}

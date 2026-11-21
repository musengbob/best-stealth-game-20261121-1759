// Night Shift: The Quiet Courier — guards, vision cones and detection.
// Patrol guards walk waypoints and sweep at each stop; the ceiling camera
// sweeps a fixed arc. Each watcher owns a detection meter that fills while
// the player is inside its cone with a clear line of sight, and drains
// otherwise. A full meter trips the alarm: guards converge on the player.

import { GUARD, CAMERA, DETECTION } from './config.js';
import { inLampLight, segmentBlocked, resolveCollisions } from './level.js';

function angleDiff(a, b) {
  let d = a - b;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d < -Math.PI) d += Math.PI * 2;
  return d;
}

function angleLerp(a, b, t) {
  return a + angleDiff(b, a) * t;
}

// Can this watcher see the player right now? Cone check first (cheap),
// then the line-of-sight segment test against cover.
export function canSee(watcher, range, halfAngle, px, py) {
  const dx = px - watcher.x;
  const dy = py - watcher.y;
  const dist = Math.hypot(dx, dy);
  if (dist > range) return { seen: false, dist };
  const toPlayer = Math.atan2(dy, dx);
  if (Math.abs(angleDiff(toPlayer, watcher.facing)) > halfAngle) {
    return { seen: false, dist };
  }
  if (segmentBlocked(watcher.x, watcher.y, px, py)) return { seen: false, dist };
  return { seen: true, dist };
}

export class PatrolGuard {
  constructor(route) {
    this.name = route.name;
    this.waypoints = route.waypoints;
    this.pause = route.pause;
    this.x = route.waypoints[0].x;
    this.y = route.waypoints[0].y;
    this.radius = GUARD.radius;
    this.wpIndex = 1 % route.waypoints.length;
    this.facing = Math.atan2(
      route.waypoints[1].y - route.waypoints[0].y,
      route.waypoints[1].x - route.waypoints[0].x,
    );
    this.state = 'patrol'; // patrol | sweep | chase | return
    this.waitTimer = 0;
    this.sweepDir = 1;
    this.sweepBase = this.facing;
    this.detection = 0;
    this.seesPlayer = false;
    this.chaseTarget = null;
    this.homeX = this.x;
    this.homeY = this.y;
  }

  // How fast this guard's meter fills while it can see the player.
  fillRate(player, dist) {
    let rate = DETECTION.fillRate;
    rate *= 1 - (dist / GUARD.coneRange) * DETECTION.distanceFalloff;
    if (player.sneaking) rate *= DETECTION.sneakFactor;
    if (player.dashing) rate *= DETECTION.dashFactor;
    if (!inLampLight(player.x, player.y)) rate *= DETECTION.shadowFactor;
    return rate;
  }

  update(dt, player, alarm) {
    const sight = canSee(this, GUARD.coneRange, GUARD.coneHalfAngle, player.x, player.y);
    this.seesPlayer = sight.seen && !player.hidden;

    if (alarm.active) {
      // Alarm: converge on the player's last known spot.
      this.state = 'chase';
      this.chaseTarget = { x: player.x, y: player.y };
    } else if (this.state === 'chase' && !alarm.active) {
      this.state = 'return';
    }

    if (this.state === 'chase' && this.chaseTarget) {
      const dx = this.chaseTarget.x - this.x;
      const dy = this.chaseTarget.y - this.y;
      const dist = Math.hypot(dx, dy);
      if (dist > 6) {
        this.facing = angleLerp(this.facing, Math.atan2(dy, dx), Math.min(1, dt * 6));
        this.x += (dx / dist) * GUARD.chaseSpeed * dt;
        this.y += (dy / dist) * GUARD.chaseSpeed * dt;
      }
      if (dist < 30) this.state = 'return';
    } else if (this.state === 'return') {
      const dx = this.homeX - this.x;
      const dy = this.homeY - this.y;
      const dist = Math.hypot(dx, dy);
      if (dist < 8) {
        this.state = 'patrol';
        this.wpIndex = 0;
      } else {
        this.facing = angleLerp(this.facing, Math.atan2(dy, dx), Math.min(1, dt * 6));
        this.x += (dx / dist) * GUARD.patrolSpeed * dt;
        this.y += (dy / dist) * GUARD.patrolSpeed * dt;
      }
    } else if (this.state === 'sweep') {
      this.waitTimer -= dt;
      // Sweep the cone back and forth around the arrival heading.
      this.facing = this.sweepBase + Math.sin((this.pause - this.waitTimer) * 1.4) * GUARD.sweepArc;
      if (this.waitTimer <= 0) {
        this.state = 'patrol';
        this.wpIndex = (this.wpIndex + 1) % this.waypoints.length;
      }
    } else {
      // patrol: walk toward the next waypoint.
      const target = this.waypoints[this.wpIndex];
      const dx = target.x - this.x;
      const dy = target.y - this.y;
      const dist = Math.hypot(dx, dy);
      if (dist < 6) {
        this.state = 'sweep';
        this.waitTimer = this.pause;
        this.sweepBase = this.facing;
      } else {
        this.facing = angleLerp(this.facing, Math.atan2(dy, dx), Math.min(1, dt * 8));
        this.x += (dx / dist) * GUARD.patrolSpeed * dt;
        this.y += (dy / dist) * GUARD.patrolSpeed * dt;
      }
    }
    resolveCollisions(this);

    // Detection meter: fill while seen, drain while hidden.
    if (this.seesPlayer && player.graceTimer <= 0) {
      this.detection = Math.min(1, this.detection + this.fillRate(player, sight.dist) * dt);
    } else {
      this.detection = Math.max(0, this.detection - DETECTION.decayRate * dt);
    }
    return this.detection;
  }
}

export class CeilingCamera {
  constructor(spec) {
    this.x = spec.x;
    this.y = spec.y;
    this.baseAngle = spec.baseAngle;
    this.facing = spec.baseAngle;
    this.sweepPhase = 0;
    this.detection = 0;
    this.seesPlayer = false;
  }

  update(dt, player) {
    this.sweepPhase += dt * CAMERA.sweepSpeed;
    this.facing = this.baseAngle + Math.sin(this.sweepPhase) * CAMERA.sweepArc;
    const sight = canSee(this, CAMERA.range, CAMERA.coneHalfAngle, player.x, player.y);
    this.seesPlayer = sight.seen && !player.hidden;
    if (this.seesPlayer && player.graceTimer <= 0) {
      let rate = DETECTION.fillRate * 0.9;
      rate *= 1 - (sight.dist / CAMERA.range) * DETECTION.distanceFalloff;
      if (player.sneaking) rate *= DETECTION.sneakFactor;
      if (!inLampLight(player.x, player.y)) rate *= DETECTION.shadowFactor;
      this.detection = Math.min(1, this.detection + rate * dt);
    } else {
      this.detection = Math.max(0, this.detection - DETECTION.decayRate * dt);
    }
    return this.detection;
  }
}

// Dashing is loud: any guard close enough hears it and its meter jumps.
export function applyDashNoise(guards, camera, player) {
  for (const g of guards) {
    if (Math.hypot(g.x - player.x, g.y - player.y) < GUARD.hearingRadius) {
      g.detection = Math.min(1, g.detection + 0.18);
      g.facing = Math.atan2(player.y - g.y, player.x - g.x);
    }
  }
  if (Math.hypot(camera.x - player.x, camera.y - player.y) < GUARD.hearingRadius) {
    camera.detection = Math.min(1, camera.detection + 0.1);
  }
}

// Night Shift: The Quiet Courier — the player courier.
// WASD / arrows to move, Shift to sneak, Space to dash. The player picks up
// parcels by walking over them and wins by stepping into the exit once all
// three parcels are collected. Movement is frame-rate independent.

import { PLAYER } from './config.js';
import { PARCELS, EXIT, PLAYER_START, circleHitsCover } from './level.js';

export class Courier {
  constructor() {
    this.reset();
  }

  reset() {
    this.x = PLAYER_START.x;
    this.y = PLAYER_START.y;
    this.radius = PLAYER.radius;
    this.sneaking = false;
    this.dashing = false;
    this.dashTimer = 0;
    this.dashCooldown = 0;
    this.parcels = 0;
    this.collected = new Set();
    this.graceTimer = 0; // unseen grace right after a respawn
    this.hidden = false; // true only while fully behind cover (unused by guards yet)
    this.moving = false;
    this.stepTimer = 0;
    this.facing = -Math.PI / 2;
  }

  get speed() {
    if (this.dashing) return PLAYER.dashSpeed;
    return this.sneaking ? PLAYER.sneakSpeed : PLAYER.walkSpeed;
  }

  update(dt, keys, onDash, onPickup) {
    let mx = 0;
    let my = 0;
    if (keys['arrowup'] || keys['w']) my -= 1;
    if (keys['arrowdown'] || keys['s']) my += 1;
    if (keys['arrowleft'] || keys['a']) mx -= 1;
    if (keys['arrowright'] || keys['d']) mx += 1;
    this.sneaking = Boolean(keys['shift']);
    this.moving = mx !== 0 || my !== 0;

    if (this.dashCooldown > 0) this.dashCooldown -= dt;
    if (this.dashTimer > 0) {
      this.dashTimer -= dt;
      this.dashing = true;
    } else {
      this.dashing = false;
    }

    if (this.moving) {
      const len = Math.hypot(mx, my);
      mx /= len;
      my /= len;
      this.facing = Math.atan2(my, mx);
      // Move one axis at a time: a blocked axis stops, the other still
      // moves, so the courier slides along shelf and crate edges.
      const nx = this.x + mx * this.speed * dt;
      if (!circleHitsCover(nx, this.y, this.radius)) this.x = nx;
      const ny = this.y + my * this.speed * dt;
      if (!circleHitsCover(this.x, ny, this.radius)) this.y = ny;
      // Footstep pacing, used by the audio layer for soft ticks.
      this.stepTimer -= dt * (this.sneaking ? 0.5 : 1);
      if (this.stepTimer <= 0) {
        this.stepTimer = this.dashing ? 0.16 : 0.34;
        this.stepped = true;
      } else {
        this.stepped = false;
      }
    } else {
      this.stepped = false;
    }
    if (this.graceTimer > 0) this.graceTimer -= dt;

    // Parcel pickup: walk over a parcel to collect it.
    for (const p of PARCELS) {
      if (this.collected.has(p.id)) continue;
      if (Math.hypot(p.x - this.x, p.y - this.y) < PLAYER.pickupRadius) {
        this.collected.add(p.id);
        this.parcels = this.collected.size;
        if (onPickup) onPickup(p);
      }
    }
  }

  tryDash() {
    if (this.dashCooldown > 0 || this.dashTimer > 0) return false;
    this.dashTimer = PLAYER.dashTime;
    this.dashCooldown = PLAYER.dashCooldown;
    return true;
  }

  // True when the courier stands in the exit doorway with every parcel.
  atExit() {
    if (this.parcels < 3) return false;
    return (
      this.x > EXIT.x - 10 &&
      this.x < EXIT.x + EXIT.w + 10 &&
      this.y < EXIT.y + EXIT.h + PLAYER.exitRadius
    );
  }
}

// Night Shift: The Quiet Courier — warehouse layout.
// Every rectangle, lamp, parcel, guard route and spawn point of the single
// level lives here, so the level can be read (and re-tuned) without touching
// any movement or rendering code. Coordinates are in world pixels; the world
// is 1280 x 720 and the outer wall frames it.

import { WORLD } from './config.js';

export const PLAYER_START = { x: 92, y: 648 };

// The glowing exit door sits in the top wall, top-right corner.
export const EXIT = { x: 1130, y: WORLD.wall, w: 110, h: 14 };

// Cover: crates, shelf rows and pillars. Guards cannot see through these
// and the player cannot walk through them.
export const OBSTACLES = [
  // Left shelf column — three long rows the player can slip behind.
  { x: 170, y: 110, w: 220, h: 42, kind: 'shelf' },
  { x: 170, y: 300, w: 220, h: 42, kind: 'shelf' },
  { x: 170, y: 480, w: 220, h: 42, kind: 'shelf' },
  // Crate cluster, upper middle. (The third crate sits below the pair so
  // Mara's patrol lane at y=250 stays open — guards walk their routes.)
  { x: 500, y: 120, w: 72, h: 72, kind: 'crate' },
  { x: 584, y: 120, w: 72, h: 72, kind: 'crate' },
  { x: 542, y: 290, w: 72, h: 72, kind: 'crate' },
  // Crate pair, lower middle.
  { x: 500, y: 430, w: 72, h: 72, kind: 'crate' },
  { x: 584, y: 430, w: 72, h: 72, kind: 'crate' },
  // Long shelf rows, right half.
  { x: 720, y: 170, w: 240, h: 38, kind: 'shelf' },
  { x: 720, y: 520, w: 240, h: 38, kind: 'shelf' },
  // Crates guarding the right side.
  { x: 1010, y: 120, w: 84, h: 60, kind: 'crate' },
  { x: 1010, y: 540, w: 84, h: 60, kind: 'crate' },
  { x: 1090, y: 300, w: 58, h: 120, kind: 'crate' },
  // Pillars — small square cover in the open floor.
  { x: 748, y: 318, w: 46, h: 46, kind: 'pillar' },
  { x: 430, y: 555, w: 46, h: 46, kind: 'pillar' },
  { x: 980, y: 330, w: 46, h: 46, kind: 'pillar' },
];

// Warm lamp pools. Inside a pool the player is lit and easier to spot;
// outside them the floor is shadow and detection fills half as fast.
export const LAMPS = [
  { x: 300, y: 210, r: 135 },
  { x: 640, y: 360, r: 140 },
  { x: 1010, y: 210, r: 130 },
  { x: 1010, y: 620, r: 125 },
  { x: 480, y: 620, r: 120 },
  { x: 1180, y: 420, r: 120 },
];

// The three parcels the courier has to collect before the exit opens.
export const PARCELS = [
  { x: 250, y: 640, id: 'A' },
  { x: 640, y: 84, id: 'B' },
  { x: 1060, y: 640, id: 'C' },
];

// Patrol routes: each guard walks its waypoints in order, pausing and
// sweeping at each one. Facing is derived from movement, then sweeps.
export const GUARD_ROUTES = [
  {
    name: 'Mara',
    waypoints: [
      { x: 470, y: 250 },
      { x: 900, y: 250 },
    ],
    pause: 1.6,
  },
  {
    name: 'Ivo',
    waypoints: [
      { x: 1030, y: 200 },
      { x: 1030, y: 470 },
    ],
    pause: 1.2,
  },
  {
    name: 'Sana',
    waypoints: [
      { x: 420, y: 620 },
      { x: 980, y: 620 },
    ],
    pause: 1.4,
  },
  {
    name: 'Rook',
    waypoints: [
      { x: 560, y: 380 },
      { x: 700, y: 380 },
      { x: 700, y: 470 },
      { x: 560, y: 470 },
    ],
    pause: 1.0,
  },
];

// The fixed ceiling camera, mounted on the top wall, sweeping the middle.
export const CEILING_CAMERA = { x: 640, y: 34, baseAngle: Math.PI / 2 };

// True when point (px, py) stands inside any lamp pool.
export function inLampLight(px, py) {
  for (const lamp of LAMPS) {
    const dx = px - lamp.x;
    const dy = py - lamp.y;
    if (dx * dx + dy * dy < lamp.r * lamp.r) return true;
  }
  return false;
}

// True when the segment (x1,y1)-(x2,y2) is blocked by any obstacle rect.
// Used for line of sight: cover breaks a guard's view.
export function segmentBlocked(x1, y1, x2, y2) {
  for (const o of OBSTACLES) {
    if (segmentHitsRect(x1, y1, x2, y2, o)) return true;
  }
  return false;
}

function segmentHitsRect(x1, y1, x2, y2, r) {
  // Slab test: does the segment cross the rectangle?
  const dx = x2 - x1;
  const dy = y2 - y1;
  let tMin = 0;
  let tMax = 1;
  if (Math.abs(dx) < 1e-9) {
    if (x1 < r.x || x1 > r.x + r.w) return false;
  } else {
    let t1 = (r.x - x1) / dx;
    let t2 = (r.x + r.w - x1) / dx;
    if (t1 > t2) [t1, t2] = [t2, t1];
    tMin = Math.max(tMin, t1);
    tMax = Math.min(tMax, t2);
    if (tMin > tMax) return false;
  }
  if (Math.abs(dy) < 1e-9) {
    if (y1 < r.y || y1 > r.y + r.h) return false;
  } else {
    let t1 = (r.y - y1) / dy;
    let t2 = (r.y + r.h - y1) / dy;
    if (t1 > t2) [t1, t2] = [t2, t1];
    tMin = Math.max(tMin, t1);
    tMax = Math.min(tMax, t2);
    if (tMin > tMax) return false;
  }
  return true;
}

// True when a circle of radius r centred at (x, y) overlaps any cover
// rect or the outer wall. Used for axis-separated movement so the courier
// slides along a shelf edge instead of sticking to it.
export function circleHitsCover(x, y, r) {
  if (x < WORLD.wall + r || x > WORLD.width - WORLD.wall - r) return true;
  if (y < WORLD.wall + r || y > WORLD.height - WORLD.wall - r) return true;
  for (const o of OBSTACLES) {
    const cx = Math.max(o.x, Math.min(x, o.x + o.w));
    const cy = Math.max(o.y, Math.min(y, o.y + o.h));
    const dx = x - cx;
    const dy = y - cy;
    if (dx * dx + dy * dy < r * r) return true;
  }
  return false;
}

// Push a circle out of every obstacle and the outer wall, in place.
export function resolveCollisions(body) {
  const r = body.radius;
  body.x = Math.max(WORLD.wall + r, Math.min(WORLD.width - WORLD.wall - r, body.x));
  body.y = Math.max(WORLD.wall + r, Math.min(WORLD.height - WORLD.wall - r, body.y));
  for (const o of OBSTACLES) {
    const cx = Math.max(o.x, Math.min(body.x, o.x + o.w));
    const cy = Math.max(o.y, Math.min(body.y, o.y + o.h));
    const dx = body.x - cx;
    const dy = body.y - cy;
    const d2 = dx * dx + dy * dy;
    if (d2 < r * r) {
      if (d2 < 1e-6) {
        body.y = o.y - r;
      } else {
        const d = Math.sqrt(d2);
        body.x = cx + (dx / d) * r;
        body.y = cy + (dy / d) * r;
      }
    }
  }
}

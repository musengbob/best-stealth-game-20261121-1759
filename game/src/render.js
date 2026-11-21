// Night Shift: The Quiet Courier — all drawing, on one 2D canvas.
// The warehouse floor, lamp pools, cover, vision cones, guards, parcels,
// the exit, the HUD and every overlay (title, pause, spotted, win, lose)
// are drawn procedurally here — no images, no fonts loaded from anywhere.

import { WORLD, COLORS, GAME } from './config.js';
import { OBSTACLES, LAMPS, PARCELS, EXIT, inLampLight } from './level.js';

function drawCone(ctx, x, y, facing, range, halfAngle, fill, edge) {
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.arc(x, y, range, facing - halfAngle, facing + halfAngle);
  ctx.closePath();
  ctx.fillStyle = fill;
  ctx.fill();
  ctx.strokeStyle = edge;
  ctx.lineWidth = 1.5;
  ctx.stroke();
}

function drawRect(ctx, o) {
  const top = o.kind === 'crate' ? COLORS.crateTop : o.kind === 'shelf' ? COLORS.shelfTop : COLORS.pillar;
  const body = o.kind === 'crate' ? COLORS.crate : o.kind === 'shelf' ? COLORS.shelf : COLORS.pillar;
  ctx.fillStyle = body;
  ctx.fillRect(o.x, o.y, o.w, o.h);
  ctx.fillStyle = top;
  ctx.fillRect(o.x + 3, o.y + 3, o.w - 6, 8);
  ctx.strokeStyle = 'rgba(0,0,0,0.45)';
  ctx.lineWidth = 2;
  ctx.strokeRect(o.x + 1, o.y + 1, o.w - 2, o.h - 2);
  if (o.kind === 'crate') {
    ctx.strokeStyle = 'rgba(0,0,0,0.3)';
    ctx.beginPath();
    ctx.moveTo(o.x + 4, o.y + o.h - 4);
    ctx.lineTo(o.x + o.w - 4, o.y + 4);
    ctx.stroke();
  }
  if (o.kind === 'shelf') {
    ctx.fillStyle = 'rgba(255,255,255,0.08)';
    for (let i = 1; i < 4; i++) {
      ctx.fillRect(o.x + 6, o.y + 6 + i * ((o.h - 12) / 4), o.w - 12, 3);
    }
  }
}

export class Renderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
  }

  drawFloor(t) {
    const ctx = this.ctx;
    // Checker floor in deep night blues.
    const tile = 64;
    for (let y = 0; y < WORLD.height; y += tile) {
      for (let x = 0; x < WORLD.width; x += tile) {
        ctx.fillStyle = ((x + y) / tile) % 2 === 0 ? COLORS.floorDark : COLORS.floorLight;
        ctx.fillRect(x, y, tile, tile);
      }
    }
    // Faint floor grid lines for readability.
    ctx.strokeStyle = 'rgba(255,255,255,0.03)';
    ctx.lineWidth = 1;
    for (let x = 0; x <= WORLD.width; x += tile) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, WORLD.height);
      ctx.stroke();
    }
    for (let y = 0; y <= WORLD.height; y += tile) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(WORLD.width, y);
      ctx.stroke();
    }
    // Warm lamp pools on the floor.
    for (const lamp of LAMPS) {
      const flicker = 0.92 + Math.sin(t * 2.1 + lamp.x) * 0.05;
      const g = ctx.createRadialGradient(lamp.x, lamp.y, 8, lamp.x, lamp.y, lamp.r);
      g.addColorStop(0, `rgba(255, 200, 110, ${0.16 * flicker})`);
      g.addColorStop(1, 'rgba(255, 200, 110, 0)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(lamp.x, lamp.y, lamp.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = COLORS.lampCore;
      ctx.beginPath();
      ctx.arc(lamp.x, lamp.y, 5, 0, Math.PI * 2);
      ctx.fill();
    }
    // Outer wall.
    ctx.fillStyle = COLORS.wall;
    ctx.fillRect(0, 0, WORLD.width, WORLD.wall);
    ctx.fillRect(0, WORLD.height - WORLD.wall, WORLD.width, WORLD.wall);
    ctx.fillRect(0, 0, WORLD.wall, WORLD.height);
    ctx.fillRect(WORLD.width - WORLD.wall, 0, WORLD.wall, WORLD.height);
    ctx.fillStyle = COLORS.wallTop;
    ctx.fillRect(0, WORLD.wall - 4, WORLD.width, 4);
    ctx.fillRect(0, WORLD.height - WORLD.wall, WORLD.width, 4);
  }

  drawExit(player, t) {
    const ctx = this.ctx;
    const open = player.parcels >= GAME.parcelsNeeded;
    const pulse = open ? 0.7 + Math.sin(t * 4) * 0.3 : 0.25;
    const glow = ctx.createLinearGradient(EXIT.x, EXIT.y, EXIT.x, EXIT.y + 46);
    glow.addColorStop(0, `rgba(125, 255, 176, ${0.55 * pulse})`);
    glow.addColorStop(1, 'rgba(125, 255, 176, 0)');
    ctx.fillStyle = glow;
    ctx.fillRect(EXIT.x - 6, EXIT.y, EXIT.w + 12, 52);
    ctx.fillStyle = open ? COLORS.exitGlow : '#4d7a5e';
    ctx.fillRect(EXIT.x, EXIT.y, EXIT.w, EXIT.h);
    ctx.fillStyle = '#0d1a12';
    ctx.font = 'bold 13px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(open ? 'EXIT — OPEN' : 'EXIT — LOCKED', EXIT.x + EXIT.w / 2, EXIT.y + 34);
    if (!open) {
      ctx.fillStyle = 'rgba(255,255,255,0.75)';
      ctx.font = '11px system-ui, sans-serif';
      ctx.fillText(`${player.parcels}/3 parcels`, EXIT.x + EXIT.w / 2, EXIT.y + 50);
    }
  }

  drawParcels(player, t) {
    const ctx = this.ctx;
    for (const p of PARCELS) {
      if (player.collected.has(p.id)) continue;
      const bob = Math.sin(t * 3 + p.x) * 2;
      ctx.save();
      ctx.translate(p.x, p.y + bob);
      ctx.fillStyle = 'rgba(255, 217, 77, 0.18)';
      ctx.beginPath();
      ctx.arc(0, 0, 20, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = COLORS.parcel;
      ctx.fillRect(-9, -9, 18, 18);
      ctx.strokeStyle = '#8a6d1f';
      ctx.lineWidth = 2;
      ctx.strokeRect(-9, -9, 18, 18);
      ctx.beginPath();
      ctx.moveTo(0, -9);
      ctx.lineTo(0, 9);
      ctx.stroke();
      ctx.restore();
      ctx.fillStyle = '#ffe98a';
      ctx.font = 'bold 11px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('PARCEL ' + p.id, p.x, p.y + 30 + bob);
    }
  }

  drawCones(guards, camera, alarm) {
    const ctx = this.ctx;
    for (const g of guards) {
      const alerted = g.detection > 0.55 || alarm.active;
      drawCone(
        ctx, g.x, g.y, g.facing, 225, 0.56,
        alerted ? COLORS.alarmCone : COLORS.cone,
        alerted ? 'rgba(255,82,82,0.6)' : COLORS.coneEdge,
      );
    }
    drawCone(
      ctx, camera.x, camera.y, camera.facing, 265, 0.42,
      camera.detection > 0.55 ? COLORS.alarmCone : COLORS.cone,
      camera.detection > 0.55 ? 'rgba(255,82,82,0.6)' : COLORS.coneEdge,
    );
  }

  drawGuards(guards, camera, t) {
    const ctx = this.ctx;
    // Ceiling camera body.
    ctx.fillStyle = '#20263a';
    ctx.fillRect(camera.x - 14, camera.y - 8, 28, 16);
    ctx.fillStyle = camera.detection > 0.55 ? '#ff5252' : '#ffd65a';
    ctx.beginPath();
    ctx.arc(camera.x, camera.y + 10, 5, 0, Math.PI * 2);
    ctx.fill();
    for (const g of guards) {
      const alerted = g.detection > 0.55;
      // Body: amber guard with a dark visor pointing where it looks.
      ctx.fillStyle = alerted ? COLORS.guardAlert : COLORS.guard;
      ctx.beginPath();
      ctx.arc(g.x, g.y, g.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = 'rgba(0,0,0,0.5)';
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.fillStyle = '#1c2338';
      ctx.beginPath();
      ctx.arc(
        g.x + Math.cos(g.facing) * 6, g.y + Math.sin(g.facing) * 6,
        5, 0, Math.PI * 2,
      );
      ctx.fill();
      // Little detection arc above the guard's head.
      if (g.detection > 0.03) {
        ctx.strokeStyle = alerted ? '#ff5252' : '#ffd65a';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(g.x, g.y, g.radius + 7, -Math.PI / 2, -Math.PI / 2 + g.detection * Math.PI * 2);
        ctx.stroke();
      }
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 10px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(g.name.toUpperCase(), g.x, g.y - g.radius - 12);
    }
  }

  drawPlayer(player, t) {
    const ctx = this.ctx;
    const inShadow = !inLampLight(player.x, player.y);
    // Soft shadow ring when sneaking in darkness — the "hidden" read.
    if (player.sneaking && inShadow) {
      ctx.strokeStyle = 'rgba(143, 211, 255, 0.5)';
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.arc(player.x, player.y, player.radius + 6, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
    }
    if (player.graceTimer > 0 && Math.floor(t * 8) % 2 === 0) return; // respawn blink
    ctx.fillStyle = player.sneaking ? COLORS.playerSneak : COLORS.player;
    ctx.beginPath();
    ctx.arc(player.x, player.y, player.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#0b1c2c';
    ctx.lineWidth = 2;
    ctx.stroke();
    // Facing tick + courier satchel.
    ctx.strokeStyle = '#0b1c2c';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(player.x, player.y);
    ctx.lineTo(player.x + Math.cos(player.facing) * 15, player.y + Math.sin(player.facing) * 15);
    ctx.stroke();
    ctx.fillStyle = '#ffd94d';
    ctx.beginPath();
    ctx.arc(player.x - Math.cos(player.facing) * 4, player.y - Math.sin(player.facing) * 4, 4, 0, Math.PI * 2);
    ctx.fill();
    if (player.dashing) {
      ctx.strokeStyle = 'rgba(143,211,255,0.6)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(player.x, player.y, player.radius + 8, 0, Math.PI * 2);
      ctx.stroke();
    }
  }

  drawHud(game) {
    const ctx = this.ctx;
    const { player, maxDetection, lives, elapsed, state } = game;
    // Top bar.
    ctx.fillStyle = 'rgba(8, 12, 24, 0.82)';
    ctx.fillRect(0, 0, WORLD.width, 34);
    ctx.fillStyle = '#e8ecf5';
    ctx.font = 'bold 14px system-ui, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('NIGHT SHIFT — THE QUIET COURIER', 14, 22);
    ctx.textAlign = 'right';
    const mins = Math.floor(elapsed / 60);
    const secs = Math.floor(elapsed % 60).toString().padStart(2, '0');
    ctx.fillText(`TIME ${mins}:${secs}`, WORLD.width - 14, 22);
    // Bottom-left: parcels, lives, objective.
    ctx.textAlign = 'left';
    ctx.font = '13px system-ui, sans-serif';
    ctx.fillStyle = '#ffd94d';
    ctx.fillText(`◆ Parcels ${player.parcels}/3`, 14, WORLD.height - 52);
    ctx.fillStyle = '#ff8a8a';
    ctx.fillText('♥'.repeat(Math.max(0, lives)) + '♡'.repeat(Math.max(0, 3 - lives)), 14, WORLD.height - 30);
    ctx.fillStyle = '#c8d2e8';
    const objective = player.parcels >= 3
      ? 'All parcels collected — reach the glowing EXIT, unseen.'
      : `Collect ${3 - player.parcels} more parcel${3 - player.parcels > 1 ? 's' : ''}, then reach the EXIT.`;
    ctx.fillText(objective, 14, WORLD.height - 12);
    // Bottom-right: alert meter.
    const mw = 220;
    const mx = WORLD.width - mw - 14;
    const my = WORLD.height - 30;
    ctx.fillStyle = 'rgba(255,255,255,0.12)';
    ctx.fillRect(mx, my, mw, 12);
    const alertColor = maxDetection > 0.55 ? '#ff5252' : maxDetection > 0.25 ? '#ffb84d' : '#7dffb0';
    ctx.fillStyle = alertColor;
    ctx.fillRect(mx, my, mw * Math.min(1, maxDetection), 12);
    ctx.strokeStyle = 'rgba(255,255,255,0.4)';
    ctx.strokeRect(mx, my, mw, 12);
    ctx.fillStyle = '#e8ecf5';
    ctx.font = 'bold 12px system-ui, sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(maxDetection > 0.55 ? 'SPOTTED!' : 'ALERT', mx + mw, my - 6);
    ctx.textAlign = 'left';
    ctx.fillStyle = '#8b96b0';
    ctx.font = '11px system-ui, sans-serif';
    ctx.fillText('WASD move · Shift sneak · Space dash · P pause · M mute', 14, WORLD.height - 72);
    if (state === 'paused') {
      ctx.fillStyle = 'rgba(5, 8, 18, 0.6)';
      ctx.fillRect(0, 0, WORLD.width, WORLD.height);
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 34px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('PAUSED', WORLD.width / 2, WORLD.height / 2);
      ctx.font = '15px system-ui, sans-serif';
      ctx.fillText('Press P to keep sneaking', WORLD.width / 2, WORLD.height / 2 + 30);
    }
  }

  drawTitle(t) {
    const ctx = this.ctx;
    ctx.fillStyle = 'rgba(5, 8, 18, 0.78)';
    ctx.fillRect(0, 0, WORLD.width, WORLD.height);
    ctx.fillStyle = '#8fd3ff';
    ctx.font = 'bold 52px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('NIGHT SHIFT', WORLD.width / 2, 190);
    ctx.fillStyle = '#ffd94d';
    ctx.font = 'bold 30px system-ui, sans-serif';
    ctx.fillText('The Quiet Courier', WORLD.width / 2, 236);
    ctx.fillStyle = '#c8d2e8';
    ctx.font = '16px system-ui, sans-serif';
    ctx.fillText('Cross the guarded night warehouse. Collect 3 parcels. Reach the exit unseen.', WORLD.width / 2, 286);
    const lines = [
      'WASD / Arrows — move        Shift — sneak (slow, quiet, hard to spot)',
      'Space — dash (fast but loud)        R — restart        P — pause        M — mute',
      'Vision cones show what guards can see. Crates and shelves block their sight.',
      'Lamp light exposes you — shadows hide you. A full alert meter means SPOTTED.',
    ];
    ctx.font = '15px system-ui, sans-serif';
    lines.forEach((line, i) => ctx.fillText(line, WORLD.width / 2, 340 + i * 26));
    const pulse = 0.6 + Math.sin(t * 3) * 0.4;
    ctx.fillStyle = `rgba(255, 217, 77, ${pulse})`;
    ctx.font = 'bold 20px system-ui, sans-serif';
    ctx.fillText('Press ENTER or click to start your shift', WORLD.width / 2, 500);
    ctx.fillStyle = '#8b96b0';
    ctx.font = '13px system-ui, sans-serif';
    ctx.fillText('An original top-down stealth game — every pixel drawn in code.', WORLD.width / 2, 540);
  }

  drawSpottedBanner() {
    const ctx = this.ctx;
    ctx.fillStyle = 'rgba(120, 10, 10, 0.55)';
    ctx.fillRect(0, WORLD.height / 2 - 44, WORLD.width, 88);
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 40px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('SPOTTED!', WORLD.width / 2, WORLD.height / 2 + 6);
    ctx.font = '15px system-ui, sans-serif';
    ctx.fillText('The guards are converging — slip away!', WORLD.width / 2, WORLD.height / 2 + 32);
  }

  drawEnd(game, won) {
    const ctx = this.ctx;
    ctx.fillStyle = 'rgba(5, 8, 18, 0.82)';
    ctx.fillRect(0, 0, WORLD.width, WORLD.height);
    ctx.fillStyle = won ? '#7dffb0' : '#ff8a8a';
    ctx.font = 'bold 46px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(won ? 'SHIFT COMPLETE' : 'CAUGHT', WORLD.width / 2, 200);
    ctx.fillStyle = '#e8ecf5';
    ctx.font = '18px system-ui, sans-serif';
    const mins = Math.floor(game.elapsed / 60);
    const secs = Math.floor(game.elapsed % 60).toString().padStart(2, '0');
    ctx.fillText(`Time ${mins}:${secs}   ·   Parcels ${game.player.parcels}/3   ·   Spotted ${game.timesSpotted}x`, WORLD.width / 2, 252);
    if (won) {
      ctx.fillStyle = '#ffd94d';
      ctx.font = 'bold 30px system-ui, sans-serif';
      ctx.fillText(`Rank ${game.rank} — Score ${game.score}`, WORLD.width / 2, 310);
      ctx.fillStyle = '#c8d2e8';
      ctx.font = '16px system-ui, sans-serif';
      ctx.fillText('You slipped through the night like it was never there.', WORLD.width / 2, 348);
    } else {
      ctx.fillStyle = '#c8d2e8';
      ctx.font = '16px system-ui, sans-serif';
      ctx.fillText('The warehouse keeps its secrets. Try a quieter route.', WORLD.width / 2, 310);
    }
    ctx.fillStyle = '#8fd3ff';
    ctx.font = 'bold 18px system-ui, sans-serif';
    ctx.fillText('Press R to run it again', WORLD.width / 2, 420);
  }

  render(game, t) {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, WORLD.width, WORLD.height);
    this.drawFloor(t);
    this.drawExit(game.player, t);
    this.drawParcels(game.player, t);
    for (const o of OBSTACLES) drawRect(ctx, o);
    this.drawCones(game.guards, game.camera, game.alarm);
    this.drawGuards(game.guards, game.camera, t);
    this.drawPlayer(game.player, t);
    if (game.state === 'title') {
      this.drawTitle(t);
      return;
    }
    this.drawHud(game);
    if (game.alarm.active) this.drawSpottedBanner();
    if (game.state === 'win') this.drawEnd(game, true);
    if (game.state === 'lose') this.drawEnd(game, false);
  }
}

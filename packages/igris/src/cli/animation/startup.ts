// IGRIS startup animation orchestrator
// Phases: void → particle converge → text reveal → glow pulse → ready

import { animate, delay } from "./animation"
import { createParticles, type Particle } from "./particles"
import { render, type RenderState } from "./renderer"

export interface StartupOptions {
  width: number
  height: number
}

export async function runIgrisStartup(opts: StartupOptions): Promise<void> {
  const { width, height } = opts
  const cx = Math.floor(width / 2)
  const cy = Math.floor(height / 2)

  const state: RenderState = {
    particles: [],
    opacity: 0,
    glow: 0,
    showText: false,
    phase: "void",
  }

  // 🌑 Phase 1: Void (black screen, tension)
  state.phase = "void"
  render(state, width, height)
  await delay(400)

  // 🌌 Phase 2: Particle convergence
  state.phase = "converge"
  state.particles = createParticles(60, width, height, cx, cy)

  await animate({
    duration: 900,
    easing: "easeOut",
    onFrame: (t) => {
      state.opacity = Math.min(1, t * 2)
      for (const p of state.particles) {
        p.x += (p.targetX - p.x) * 0.06
        p.y += (p.targetY - p.y) * 0.06
      }
      render(state, width, height)
    },
  })

  // ⚔️ Phase 3: Text reveal (IGRIS fades in)
  state.phase = "reveal"
  state.showText = true
  state.opacity = 0

  await animate({
    duration: 700,
    easing: "easeOut",
    onFrame: (t) => {
      state.opacity = t
      // Particles continue converging during reveal
      for (const p of state.particles) {
        p.x += (p.targetX - p.x) * 0.03
        p.y += (p.targetY - p.y) * 0.03
      }
      render(state, width, height)
    },
  })

  // ✨ Phase 4: Glow pulse
  state.phase = "glow"
  state.glow = 0

  await animate({
    duration: 500,
    easing: "easeOut",
    onFrame: (t) => {
      state.glow = Math.sin(t * Math.PI)
      render(state, width, height)
    },
  })

  // Second pulse (softer)
  await delay(200)
  await animate({
    duration: 400,
    easing: "easeOut",
    onFrame: (t) => {
      state.glow = Math.sin(t * Math.PI) * 0.6
      render(state, width, height)
    },
  })

  // 🧘 Phase 5: Settle and show ready
  state.phase = "ready"
  state.glow = 0.15
  render(state, width, height)
  await delay(500)
}

export function clearStartup(): void {
  // Clear the animation output and reset cursor
  process.stdout.write("\x1b[2J\x1b[H")
}

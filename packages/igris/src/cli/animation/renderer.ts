// ANSI terminal renderer for IGRIS startup animation
// Uses raw escape codes for screen control

import { IGRIS_TEXT, IGRIS_TAGLINE } from "./igrisText"
import type { Particle } from "./particles"

const enum Color {
  Reset = "\x1b[0m",
  Bold = "\x1b[1m",
  Dim = "\x1b[2m",
}

function rgb(r: number, g: number, b: number): string {
  return `\x1b[38;2;${r};${g};${b}m`
}

function bgRgb(r: number, g: number, b: number): string {
  return `\x1b[48;2;${r};${g};${b}m`
}

function cursorTo(y: number, x: number): string {
  return `\x1b[${Math.max(1, y + 1)};${Math.max(0, x + 1)}H`
}

function clearScreen(): string {
  return "\x1b[2J\x1b[H"
}

export interface RenderState {
  particles: Particle[]
  opacity: number
  glow: number
  showText: boolean
  phase: "void" | "converge" | "reveal" | "glow" | "ready"
}

// IGRIS theme colors
const COLORS = {
  deep: [15, 10, 42] as const,        // #0F0A2A deep shadow
  accent: [99, 102, 241] as const,    // #6366F1 violet
  highlight: [167, 139, 250] as const, // #A78BFA soft purple
  text: [229, 231, 235] as const,     // #E5E7EB light gray
  dim: [107, 114, 128] as const,      // #6B7280
  success: [34, 197, 94] as const,    // #22C55E green
}

export function render(state: RenderState, width: number, height: number): void {
  let out = clearScreen()
  const cx = Math.floor(width / 2)
  const cy = Math.floor(height / 2)

  // Dark background fill (reduce brightness for void effect)
  out += bgRgb(8, 6, 20)
  for (let i = 0; i < height; i++) {
    out += `\x1b[${i + 1};1H${" ".repeat(width)}`
  }

  // Phase 1-2: Particles
  if (state.phase === "void" || state.phase === "converge") {
    for (const p of state.particles) {
      const px = Math.floor(p.x)
      const py = Math.floor(p.y)
      if (px >= 0 && px < width && py >= 0 && py < height) {
        const intensity = Math.floor(state.opacity * 200)
        out += cursorTo(py, px)
        out += rgb(intensity, intensity * 0.6, intensity)
        out += p.char
      }
    }
  }

  // Phase 3-5: Text
  if (state.showText) {
    const startY = cy - Math.floor(IGRIS_TEXT.length / 2) - 1
    const textWidth = IGRIS_TEXT[0]?.length ?? 0
    const startX = Math.floor(cx - textWidth / 2)

    // Glow effect behind text
    if (state.glow > 0.1) {
      const glowR = Math.floor(COLORS.highlight[0] * state.glow * 0.3)
      const glowG = Math.floor(COLORS.highlight[1] * state.glow * 0.3)
      const glowB = Math.floor(COLORS.highlight[2] * state.glow * 0.3)
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          out += cursorTo(startY + dy - 1, startX + dx)
          out += bgRgb(glowR, glowG, glowB)
        }
      }
    }

    // Render IGRIS text with opacity
    const alpha = Math.floor(state.opacity * 255)
    const baseR = Math.floor(COLORS.highlight[0] * alpha / 255 + COLORS.deep[0] * (1 - alpha / 255))
    const baseG = Math.floor(COLORS.highlight[1] * alpha / 255 + COLORS.deep[1] * (1 - alpha / 255))
    const baseB = Math.floor(COLORS.highlight[2] * alpha / 255 + COLORS.deep[2] * (1 - alpha / 255))

    IGRIS_TEXT.forEach((line, i) => {
      const y = startY + i
      out += cursorTo(y, startX)
      out += rgb(baseR, baseG, baseB)
      out += Color.Bold
      out += line
    })

    // Tagline below
    if (state.phase === "glow" || state.phase === "ready") {
      const tagY = startY + IGRIS_TEXT.length + 1
      const tagX = Math.floor(cx - IGRIS_TAGLINE.length / 2)
      out += cursorTo(tagY, tagX)
      out += rgb(COLORS.dim[0], COLORS.dim[1], COLORS.dim[2])
      out += Color.Dim
      out += IGRIS_TAGLINE
    }

    // Ready indicator
    if (state.phase === "ready") {
      const readyY = height - 2
      const readyX = 2
      out += cursorTo(readyY, readyX)
      out += rgb(COLORS.success[0], COLORS.success[1], COLORS.success[2])
      out += Color.Bold
      out += "▶ IGRIS ready"
      out += Color.Reset
      out += cursorTo(readyY, readyX + 14)
      out += " "
    }
  }

  out += Color.Reset
  process.stdout.write(out)
}

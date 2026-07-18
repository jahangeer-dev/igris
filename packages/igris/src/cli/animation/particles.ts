// Particle system for IGRIS shadow convergence animation

export interface Particle {
  x: number
  y: number
  targetX: number
  targetY: number
  speed: number
  char: string
}

export function createParticles(
  count: number,
  width: number,
  height: number,
  centerX: number,
  centerY: number,
): Particle[] {
  const chars = [".", "·", "∘", "◦", "•", "✦", "⋆"]
  return Array.from({ length: count }, () => ({
    x: Math.random() * width,
    y: Math.random() * height,
    targetX: centerX + (Math.random() - 0.5) * 12,
    targetY: centerY + (Math.random() - 0.5) * 4,
    speed: 0.02 + Math.random() * 0.04,
    char: chars[Math.floor(Math.random() * chars.length)],
  }))
}

// Animation engine for IGRIS startup sequence
// Provides easing functions and a frame-loop animation runner

export type Easing = "linear" | "easeOut" | "easeIn" | "easeInOut"

export function ease(t: number, type: Easing = "linear"): number {
  switch (type) {
    case "easeOut":
      return 1 - Math.pow(1 - t, 3)
    case "easeIn":
      return t * t * t
    case "easeInOut":
      return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2
    default:
      return t
  }
}

export interface AnimationConfig {
  duration: number
  easing?: Easing
  onFrame: (t: number) => void
}

export function animate(config: AnimationConfig): Promise<void> {
  const { duration, easing = "linear", onFrame } = config
  const start = Date.now()
  const fps = 60
  const interval = 1000 / fps

  return new Promise<void>((resolve) => {
    function frame() {
      const now = Date.now()
      let t = (now - start) / duration
      if (t > 1) t = 1

      const eased = ease(t, easing)
      onFrame(eased)

      if (t < 1) {
        setTimeout(frame, interval)
      } else {
        resolve()
      }
    }

    setTimeout(frame, interval)
  })
}

export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

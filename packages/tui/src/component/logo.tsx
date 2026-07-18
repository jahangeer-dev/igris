import { RGBA, TextAttributes } from "@opentui/core"
import { For, createSignal, onCleanup, onMount, type JSX } from "solid-js"
import { tint, useTheme } from "../context/theme"
import { logo } from "../logo"

// Idle animation state
const breathSignal = createSignal(1.0)
const colorShiftSignal = createSignal(0)
const shadowShiftSignal = createSignal(0)

// Floating particles (reused pool, max 8)
const particles: { x: number; y: number; char: string; speed: number }[] = []
for (let i = 0; i < 8; i++) {
  particles.push({ x: Math.random() * 40, y: Math.random() * 6, char: ["·", "•", "∘", "◦"][i % 4], speed: 0.02 + Math.random() * 0.03 })
}

// Click animation state
const clickSignal = createSignal(0)
const clickTypeSignal = createSignal(0)
const CLICK_ANIMATIONS = ["slash", "burst", "shift", "glitch"] as const

export function Logo() {
  const { theme } = useTheme()
  let animFrame: ReturnType<typeof setTimeout> | null = null
  let clickAnimFrame: ReturnType<typeof setTimeout> | null = null
  let mounted = false

  // Launch glow animation
  onMount(() => {
    mounted = true
    startIdleAnimations()
  })

  onCleanup(() => {
    mounted = false
    if (animFrame) clearTimeout(animFrame)
    if (clickAnimFrame) clearTimeout(clickAnimFrame)
  })

  function startIdleAnimations() {
    if (!mounted) return

    // Breathing: slow pulse 0.85 → 1.0 → 0.85
    let breathPhase = 0
    const breathInterval = setInterval(() => {
      if (!mounted) { clearInterval(breathInterval); return }
      breathPhase += 0.05
      const v = 0.85 + Math.sin(breathPhase) * 0.15
      breathSignal[1](v)
    }, 100)

    // Color cycling: slow purple shift
    let colorPhase = 0
    const colorInterval = setInterval(() => {
      if (!mounted) { clearInterval(colorInterval); return }
      colorPhase += 0.02
      colorShiftSignal[1](colorPhase)
    }, 80)

    // Shadow breathing: background shift
    let shadowPhase = 0
    const shadowInterval = setInterval(() => {
      if (!mounted) { clearInterval(shadowInterval); return }
      shadowPhase += 0.015
      shadowShiftSignal[1](shadowPhase)
    }, 120)

    // Floating particles: move each frame
    const particleInterval = setInterval(() => {
      if (!mounted) { clearInterval(particleInterval); return }
      for (const p of particles) {
        p.y -= p.speed
        if (p.y < -1) {
          p.y = 6
          p.x = Math.random() * 40
        }
      }
    }, 50)

    onCleanup(() => {
      clearInterval(breathInterval)
      clearInterval(colorInterval)
      clearInterval(shadowInterval)
      clearInterval(particleInterval)
    })
  }

  function handleClick() {
    const type = clickTypeSignal[0]()
    clickTypeSignal[1]((type + 1) % CLICK_ANIMATIONS.length)
    clickSignal[1](1)

    // Animate click effect for 400ms
    let start = Date.now()
    const animate = () => {
      const elapsed = Date.now() - start
      if (elapsed > 400) {
        clickSignal[1](0)
        return
      }
      const t = elapsed / 400
      clickSignal[1](1 - t)
      clickAnimFrame = setTimeout(animate, 16)
    }
    animate()
  }

  const renderLine = (line: string, fg: RGBA, bold: boolean): JSX.Element[] => {
    const breath = breathSignal[0]()
    const colorShift = colorShiftSignal[0]()
    const shadowShift = shadowShiftSignal[0]()
    const clickT = clickSignal[0]()
    const clickType = clickTypeSignal[0]()
    const attrs = bold ? TextAttributes.BOLD : undefined

    return Array.from(line).map((char, i) => {
      if (char === " ") {
        return <text fg={fg} attributes={attrs} selectable={false}>{" "}</text>
      }

      // Calculate color with breathing + color shift
      const r = Math.floor(123 + Math.sin(colorShift + i * 0.3) * 20)
      const g = Math.floor(62 + Math.sin(colorShift + i * 0.2) * 15)
      const b = Math.floor(212 + Math.cos(colorShift + i * 0.4) * 20)

      // Click effects
      let finalFg = `rgb(${r},${g},${b})`
      let bg: string | undefined

      if (clickT > 0) {
        if (clickType === 0) {
          // Slash: diagonal line
          const slashX = Math.floor(clickT * 40)
          if (Math.abs(i - slashX) < 3) {
            finalFg = `rgb(255,255,255)`
          }
        } else if (clickType === 1) {
          // Burst: expand from center
          const center = line.length / 2
          const dist = Math.abs(i - center)
          if (dist < clickT * 10) {
            finalFg = `rgb(${Math.floor(200 + clickT * 55)},${Math.floor(150 + clickT * 100)},255)`
          }
        } else if (clickType === 2) {
          // Shift: color inversion flash
          finalFg = `rgb(${Math.floor(255 * clickT)},${Math.floor(200 * clickT)},${Math.floor(255 * clickT)})`
        } else {
          // Glitch: random displacement look
          if (Math.random() < clickT * 0.3) {
            finalFg = `rgb(255,0,255)`
          }
        }
      }

      // Shadow breathing bg
      if (shadowShift > 0) {
        const shadowIntensity = Math.floor(10 + Math.sin(shadowShift) * 5)
        bg = `rgb(${shadowIntensity},${Math.floor(shadowIntensity * 0.5)},${shadowIntensity * 2})`
      }

      return (
        <text fg={finalFg} bg={bg} attributes={attrs} selectable={false}>
          {char}
        </text>
      )
    })
  }

  return (
    <box flexDirection="column" alignItems="center">
      {/* Floating particles above logo */}
      <For each={particles}>
        {(p) => (
          <text
            fg={`rgba(123,62,212,${0.3 + Math.sin(Date.now() * 0.001) * 0.2})`}
            selectable={false}
          >
            {p.char}
          </text>
        )}
      </For>

      {/* Main logo - clickable */}
      <box
        flexDirection="column"
        alignItems="center"
        onClick={handleClick}
        cursor="pointer"
      >
        <For each={logo}>
          {(line) => (
            <box flexDirection="row" justifyContent="center">
              {renderLine(line, theme.accent, true)}
            </box>
          )}
        </For>
      </box>

      {/* Tagline with breathing */}
      <text
        fg={`rgba(136,136,160,${breathSignal[0]()})`}
        selectable={false}
      >
        ⚔️ Shadow Knight Protocol
      </text>
    </box>
  )
}

import { RGBA, TextAttributes } from "@opentui/core"
import { For, createSignal, onCleanup, onMount, type JSX } from "solid-js"
import { tint, useTheme } from "../context/theme"
import { logo } from "../logo"

// Idle animation state
const breathSignal = createSignal(1.0)
const colorShiftSignal = createSignal(0)

export function Logo() {
  const { theme } = useTheme()
  let mounted = false

  onMount(() => {
    mounted = true
    startIdleAnimations()
  })

  onCleanup(() => {
    mounted = false
  })

  function startIdleAnimations() {
    if (!mounted) return

    // Breathing: slow pulse
    let breathPhase = 0
    const breathInterval = setInterval(() => {
      if (!mounted) { clearInterval(breathInterval); return }
      breathPhase += 0.05
      breathSignal[1](0.85 + Math.sin(breathPhase) * 0.15)
    }, 100)

    // Color cycling: slow purple shift
    let colorPhase = 0
    const colorInterval = setInterval(() => {
      if (!mounted) { clearInterval(colorInterval); return }
      colorPhase += 0.02
      colorShiftSignal[1](colorPhase)
    }, 80)

    onCleanup(() => {
      clearInterval(breathInterval)
      clearInterval(colorInterval)
    })
  }

  const renderLine = (line: string): JSX.Element[] => {
    const breath = breathSignal[0]()
    const colorShift = colorShiftSignal[0]()

    return Array.from(line).map((char) => {
      if (char === " ") {
        return <text fg="transparent" selectable={false}>{" "}</text>
      }

      // Purple color with breathing and subtle shift
      const r = Math.floor(123 + Math.sin(colorShift) * 15)
      const g = Math.floor(62 + Math.sin(colorShift * 0.7) * 10)
      const b = Math.floor(212 + Math.cos(colorShift * 1.3) * 15)
      const alpha = Math.floor(breath * 255)

      return (
        <text fg={`rgba(${r},${g},${b},${alpha / 255})`} selectable={false}>
          {char}
        </text>
      )
    })
  }

  return (
    <box flexDirection="column" alignItems="center">
      {/* Main logo */}
      <box flexDirection="column" alignItems="center">
        <For each={logo}>
          {(line) => (
            <box flexDirection="row" justifyContent="center">
              {renderLine(line)}
            </box>
          )}
        </For>
      </box>

      {/* Tagline */}
      <text
        fg={`rgba(136,136,160,${breathSignal[0]()})`}
        selectable={false}
      >
        ⚔️ Shadow Knight Protocol
      </text>
    </box>
  )
}

import { createSignal, onCleanup, onMount } from "solid-js"
import { useTheme } from "../context/theme"
import { logo } from "../logo"

export function Logo() {
  const { theme } = useTheme()
  const [tick, setTick] = createSignal(0)
  const [clickState, setClickState] = createSignal(0) // 0=none, 1=flash, 2=bright, 3=blue, 4=white
  let clickStart = 0
  let clickAnimId: ReturnType<typeof setTimeout> | null = null

  const logoText = logo.join("\n")
  const tagline = "⚔️ Shadow Knight Protocol"

  onMount(() => {
    // Animation tick every 50ms
    const id = setInterval(() => setTick(t => t + 1), 50)
    onCleanup(() => { clearInterval(id); if (clickAnimId) clearTimeout(clickAnimId) })
  })

  function handleClick() {
    setClickState(s => s >= 4 ? 1 : s + 1)
    clickStart = Date.now()
    if (clickAnimId) clearTimeout(clickAnimId)
    const animate = () => {
      const elapsed = Date.now() - clickStart
      if (elapsed >= 400) { setClickState(s => s); return }
      setTick(t => t + 1) // force re-render
      clickAnimId = setTimeout(animate, 16)
    }
    clickAnimId = setTimeout(animate, 16)
  }

  const t = tick()
  const cs = clickState()
  const clickElapsed = clickStart ? Math.min(1, (Date.now() - clickStart) / 400) : 0
  const clickActive = clickStart > 0 && clickElapsed < 1

  // Derive all animation values from tick
  const breath = 0.85 + Math.sin(t * 0.05) * 0.15
  const shift = t * 0.01
  const r = Math.floor(123 + Math.sin(shift) * 15)
  const g = Math.floor(62 + Math.sin(shift * 0.7) * 10)
  const b = Math.floor(212 + Math.cos(shift * 1.3) * 15)

  // Click effects
  let fr = r, fg = g, fb = b
  if (clickActive) {
    const p = 1 - clickElapsed
    if (cs === 1) { // white flash
      fr = fg = fb = Math.floor(p * 255)
    } else if (cs === 2) { // bright purple
      fr = Math.min(255, Math.floor(r + p * 100))
      fg = Math.min(255, Math.floor(g + p * 50))
      fb = Math.min(255, Math.floor(b + p * 40))
    } else if (cs === 3) { // electric blue
      fr = Math.floor(r * (1 - p))
      fg = Math.floor(180 * p + g * (1 - p))
      fb = Math.floor(255 * p + b * (1 - p))
    } else { // cs >= 4, white flash
      fr = fg = fb = Math.floor(p * 200)
    }
  }

  const fgColor = `rgb(${fr},${fg},${fb})`
  const tagFg = `rgba(136,136,160,${breath})`

  return (
    <box flexDirection="column" alignItems="center" onMouseDown={handleClick}>
      <text fg={fgColor} opacity={breath} selectable={false}>
        {logoText}
      </text>
      <text fg={tagFg} selectable={false}>
        {tagline}
      </text>
    </box>
  )
}

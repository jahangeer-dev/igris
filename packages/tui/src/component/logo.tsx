import { createSignal, onCleanup, onMount } from "solid-js"
import { logo } from "../logo"

export function Logo() {
  const [tick, setTick] = createSignal(0)
  const [clickPhase, setClickPhase] = createSignal(0)
  let clickStart = 0
  let mounted = true

  const logoText = logo.join("\n")
  const tagline = "⚔️ Shadow Knight Protocol"

  onMount(() => {
    const animId = setInterval(() => {
      if (!mounted) return clearInterval(animId)
      setTick(t => t + 1)
    }, 50)
    onCleanup(() => { mounted = false; clearInterval(animId) })
  })

  function handleClick() {
    const cp = clickPhase()
    setClickPhase(cp >= 4 ? 1 : cp + 1)
    clickStart = Date.now()
  }

  const t = tick()
  const now = Date.now() / 1000
  const breath = 0.8 + Math.sin(now * 3) * 0.2
  const r = Math.floor(123 + Math.sin(now * 0.5) * 20)
  const g = Math.floor(62 + Math.sin(now * 0.35) * 15)
  const b = Math.floor(212 + Math.cos(now * 0.65) * 20)

  // Click effect
  const cp = clickPhase()
  let cr = r, cg = g, cb = b
  if (cp > 0) {
    const elapsed = Date.now() - clickStart
    const p = Math.max(0, 1 - elapsed / 400)
    if (p > 0) {
      if (cp === 1) { cr = cg = cb = Math.floor(p * 255) }
      else if (cp === 2) {
        cr = Math.min(255, r + Math.floor(p * 100))
        cg = Math.min(255, g + Math.floor(p * 50))
        cb = Math.min(255, b + Math.floor(p * 40))
      } else if (cp === 3) {
        cr = Math.floor(r * (1 - p))
        cg = Math.floor(180 * p + g * (1 - p))
        cb = Math.floor(255 * p + b * (1 - p))
      } else { cr = cg = cb = Math.floor(p * 200) }
    } else {
      setClickPhase(0)
    }
  }

  return (
    <box flexDirection="column" alignItems="center" onMouseDown={handleClick}>
      <text fg={`rgba(${cr},${cg},${cb},${breath})`} key={t} selectable={false}>
        {logoText}
      </text>
      <text fg={`rgba(136,136,160,${breath})`} key={t + 1000} selectable={false}>
        {tagline}
      </text>
    </box>
  )
}

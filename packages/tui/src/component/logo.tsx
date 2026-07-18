import { RGBA, TextAttributes } from "@opentui/core"
import { For, createSignal, onCleanup, onMount } from "solid-js"
import { useTheme } from "../context/theme"
import { logo } from "../logo"

export function Logo() {
  const { theme } = useTheme()
  const [breath, setBreath] = createSignal(1.0)
  const [colorShift, setColorShift] = createSignal(0)
  const [clickFlash, setClickFlash] = createSignal(0)
  const [clickType, setClickType] = createSignal(0)
  let mounted = true

  onMount(() => {
    // Breathing pulse
    let bp = 0
    const bi = setInterval(() => {
      if (!mounted) return clearInterval(bi)
      bp += 0.05
      setBreath(0.85 + Math.sin(bp) * 0.15)
    }, 100)

    // Color cycling
    let cp = 0
    const ci = setInterval(() => {
      if (!mounted) return clearInterval(ci)
      cp += 0.02
      setColorShift(cp)
    }, 80)

    onCleanup(() => { mounted = false; clearInterval(bi); clearInterval(ci) })
  })

  function handleClick() {
    setClickType(t => (t + 1) % 4)
    setClickFlash(1)
    let start = Date.now()
    const anim = () => {
      const elapsed = Date.now() - start
      if (elapsed > 300) { setClickFlash(0); return }
      setClickFlash(1 - elapsed / 300)
      setTimeout(anim, 16)
    }
    setTimeout(anim, 16)
  }

  // Use signals directly so SolidJS tracks reactivity
  const b = breath()
  const cs = colorShift()
  const cf = clickFlash()
  const ct = clickType()

  // Base purple color with breathing + cycling
  const r = Math.floor(123 + Math.sin(cs) * 15)
  const g = Math.floor(62 + Math.sin(cs * 0.7) * 10)
  const bk = Math.floor(212 + Math.cos(cs * 1.3) * 15)

  // Apply click flash
  let flashR = r, flashG = g, flashB = bk
  if (cf > 0) {
    if (ct === 0) { // Flash white
      const t = Math.floor(cf * 255)
      flashR = t; flashG = t; flashB = t
    } else if (ct === 1) { // Bright purple
      flashR = Math.floor(r + cf * 100)
      flashG = Math.floor(g + cf * 50)
      flashB = Math.floor(bk + cf * 40)
    } else if (ct === 2) { // Electric blue
      flashR = Math.floor(r * (1 - cf))
      flashG = Math.floor(180 * cf + g * (1 - cf))
      flashB = Math.floor(255 * cf + bk * (1 - cf))
    } else { // White flash
      const t = Math.floor(cf * 200)
      flashR = t; flashG = t; flashB = t
    }
  }

  const fg = `rgb(${flashR},${flashG},${flashB})`
  const alpha = Math.floor(b * 255)

  return (
    <box flexDirection="column" alignItems="center" onClick={handleClick}>
      {/* Particles (decorative dots near logo) */}
      <For each={[0, 1, 2]}>
        {(i) => (
          <text
            fg={`rgba(123,62,212,${0.15 + Math.sin(cs + i * 2) * 0.1})`}
            selectable={false}
          >
            {".·"[i % 2]}
          </text>
        )}
      </For>

      {/* IGRIS logo */}
      <box flexDirection="column" alignItems="center">
        <For each={logo}>
          {(line) => (
            <box flexDirection="row" justifyContent="center">
              <text fg={fg} opacity={alpha / 255} selectable={false}>
                {line}
              </text>
            </box>
          )}
        </For>
      </box>

      {/* Tagline */}
      <text fg={`rgba(136,136,160,${b})`} selectable={false}>
        ⚔️ Shadow Knight Protocol
      </text>
    </box>
  )
}

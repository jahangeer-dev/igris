import { RGBA, TextAttributes } from "@opentui/core"
import { For, type JSX } from "solid-js"
import { tint, useTheme } from "../context/theme"
import { logo } from "../logo"

export function Logo() {
  const { theme } = useTheme()

  const renderLine = (line: string, fg: RGBA, bold: boolean): JSX.Element[] => {
    const attrs = bold ? TextAttributes.BOLD : undefined
    return Array.from(line).map((char) => {
      if (char === " ") {
        return (
          <text fg={fg} attributes={attrs} selectable={false}>
            {" "}
          </text>
        )
      }
      return (
        <text fg={fg} attributes={attrs} selectable={false}>
          {char}
        </text>
      )
    })
  }

  return (
    <box flexDirection="column" alignItems="center">
      <For each={logo}>
        {(line) => (
          <box flexDirection="row" justifyContent="center">
            {renderLine(line, theme.accent, true)}
          </box>
        )}
      </For>
    </box>
  )
}

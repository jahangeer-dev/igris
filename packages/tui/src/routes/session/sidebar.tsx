import { useProject } from "../../context/project"
import { useSync } from "../../context/sync"
import { createMemo, Show, createSignal, onMount, onCleanup } from "solid-js"
import { RGBA } from "@opentui/core"
import { useTheme } from "../../context/theme"
import { useTuiConfig } from "../../config"
import { InstallationChannel, InstallationVersion } from "@igris-ai/core/installation/version"
import { usePluginRuntime } from "../../plugin/runtime"

import { getScrollAcceleration } from "../../util/scroll"
import { WorkspaceLabel } from "../../component/workspace-label"

export function Sidebar(props: { sessionID: string; overlay?: boolean }) {
  const pluginRuntime = usePluginRuntime()
  const project = useProject()
  const sync = useSync()
  const { theme } = useTheme()
  const tuiConfig = useTuiConfig()
  const session = createMemo(() => sync.session.get(props.sessionID))
  const workspace = () => {
    const workspaceID = session()?.workspaceID
    if (!workspaceID) return
    return project.workspace.get(workspaceID)
  }
  const scrollAcceleration = createMemo(() => getScrollAcceleration(tuiConfig))

  return (
    <Show when={session()}>
      <box
        backgroundColor={theme.backgroundPanel}
        width={42}
        height="100%"
        paddingTop={1}
        paddingBottom={1}
        paddingLeft={2}
        paddingRight={2}
        position={props.overlay ? "absolute" : "relative"}
      >
        <IgrisHeader theme={theme} />
        <scrollbox
          flexGrow={1}
          scrollAcceleration={scrollAcceleration()}
          verticalScrollbarOptions={{
            trackOptions: {
              backgroundColor: theme.background,
              foregroundColor: theme.borderActive,
            },
          }}
        >
          <box flexShrink={0} gap={1} paddingRight={1}>
            <pluginRuntime.Slot
              name="sidebar_title"
              mode="single_winner"
              session_id={props.sessionID}
              title={session()!.title}
              share_url={session()!.share?.url}
            >
              <box paddingRight={1}>
                <text fg={theme.text}>
                  <b>{session()!.title}</b>
                </text>
                <Show when={InstallationChannel !== "latest"}>
                  <text fg={theme.textMuted}>{props.sessionID}</text>
                </Show>
                <Show when={session()!.workspaceID}>
                  <text fg={theme.textMuted}>
                    <Show
                      when={workspace()}
                      fallback={<WorkspaceLabel type="unknown" name={session()!.workspaceID!} status="error" icon />}
                    >
                      {(item) => (
                        <WorkspaceLabel
                          type={item().type}
                          name={item().name}
                          status={project.workspace.status(item().id) ?? "error"}
                          icon
                        />
                      )}
                    </Show>
                  </text>
                </Show>
                <Show when={session()!.share?.url}>
                  <text fg={theme.textMuted}>{session()!.share!.url}</text>
                </Show>
              </box>
            </pluginRuntime.Slot>
            <pluginRuntime.Slot name="sidebar_content" session_id={props.sessionID} />
          </box>
        </scrollbox>

        <box flexShrink={0} gap={1} paddingTop={1}>
          <pluginRuntime.Slot name="sidebar_footer" mode="single_winner" session_id={props.sessionID}>
            <text fg={theme.textMuted}>
              <span style={{ fg: theme.success }}>•</span> <b>Open</b>
              <span style={{ fg: theme.text }}>
                <b>Code</b>
              </span>{" "}
              <span>{InstallationVersion}</span>
            </text>
          </pluginRuntime.Slot>
        </box>
      </box>
    </Show>
  )
}

function IgrisHeader(props: { theme: ReturnType<typeof useTheme>["theme"] }) {
  const [tick, setTick] = createSignal(0)
  let mounted = true

  onMount(() => {
    const id = setInterval(() => {
      if (!mounted) return
      setTick((t) => t + 1)
    }, 40)
    onCleanup(() => {
      mounted = false
      clearInterval(id)
    })
  })

  const letters = ["I", "G", "R", "I", "S"]

  const colors = createMemo(() => {
    tick()
    const t = Date.now() / 1000
    return letters.map((_, i) => {
      const phase = i * 0.8
      const breath = 0.6 + Math.sin(t * 2 + phase) * 0.4
      const shadow = Math.sin(t * 3.7 + phase * 1.3) * 0.5 + 0.5
      const r = (40 + shadow * 180) * breath
      const g = (10 + shadow * 20) * breath
      const b = (60 + shadow * 100) * breath
      return RGBA.fromValues(r, g, b, 1)
    })
  })

  return (
    <box paddingBottom={1} paddingLeft={1}>
      <text>
        {letters.map((letter, i) => (
          <span style={{ fg: colors()[i] }}>
            <b>{letter}</b>
          </span>
        ))}
      </text>
    </box>
  )
}

import { Effect } from "effect"

interface ToolCall {
  tool: string
  args: unknown
  time: number
}

const state = new Map<string, { calls: ToolCall[]; total: number }>()

const MAX_TOOL_CALLS_PER_TURN = 50
const MAX_IDENTICAL_CALLS = 10
const RATE_WINDOW_MS = 30_000
const MAX_CALLS_IN_WINDOW = 20

export function reset(sessionID: string) {
  state.set(sessionID, { calls: [], total: 0 })
}

export function check(
  sessionID: string,
  tool: string,
  args: unknown,
): Effect.Effect<void> {
  const entry = state.get(sessionID)
  if (!entry) {
    state.set(sessionID, { calls: [{ tool, args, time: Date.now() }], total: 1 })
    return Effect.void
  }

  entry.total++
  entry.calls.push({ tool, args, time: Date.now() })

  // Cap total calls per turn
  if (entry.total > MAX_TOOL_CALLS_PER_TURN) {
    return Effect.die(
      new Error(`Tool call limit exceeded: ${MAX_TOOL_CALLS_PER_TURN} calls per turn`),
    )
  }

  // Detect identical consecutive calls
  const recent = entry.calls.slice(-MAX_IDENTICAL_CALLS)
  if (recent.length === MAX_IDENTICAL_CALLS && recent.every((c) => c.tool === tool)) {
    return Effect.die(
      new Error(`Identical tool call limit exceeded: "${tool}" called ${MAX_IDENTICAL_CALLS} times in a row`),
    )
  }

  // Rate limiting: too many calls in time window
  const window = entry.calls.filter((c) => c.time > Date.now() - RATE_WINDOW_MS)
  if (window.length > MAX_CALLS_IN_WINDOW) {
    return Effect.die(
      new Error(`Rate limit exceeded: ${MAX_CALLS_IN_WINDOW} tool calls in ${RATE_WINDOW_MS / 1000}s`),
    )
  }

  return Effect.void
}

import { run as runTui, type TuiInput } from "@igris-ai/tui"
import { Global } from "@igris-ai/core/global"
import { AppNodeBuilder } from "@igris-ai/core/effect/app-node-builder"
import { Effect } from "effect"

export function run(input: TuiInput) {
  return runTui(input).pipe(Effect.provide(AppNodeBuilder.build(Global.node)))
}

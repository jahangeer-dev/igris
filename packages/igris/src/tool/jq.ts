import { Effect, Schema } from "effect"
import * as Tool from "./tool"
import DESCRIPTION from "./jq.txt"
import { spawn } from "child_process"

export const Parameters = Schema.Struct({
  filter: Schema.String.annotate({ description: "The jq filter expression (e.g. '.key', '.[].name', 'select(.age > 18)')" }),
  file: Schema.optional(Schema.String).annotate({ description: "Path to the JSON file to query. If omitted, parses from the working context." }),
})

function runJq(filter: string, file?: string): Promise<string> {
  return new Promise((resolve) => {
    const args = file ? [filter, file] : [filter]
    const proc = spawn("jq", args, { stdio: ["ignore", "pipe", "pipe"], shell: true, timeout: 10000 })
    let stdout = "", stderr = ""
    proc.stdout.on("data", (d: Buffer) => { stdout += d.toString() })
    proc.stderr.on("data", (d: Buffer) => { stderr += d.toString() })
    proc.on("close", (code) => {
      resolve(code === 0 ? stdout.trim() : `jq error:\n${stderr}`)
    })
    proc.on("error", () => resolve("jq not found. Install with: apt install jq or brew install jq"))
  })
}

export const JqTool = Tool.define("jq", Effect.gen(function* () {
  return {
    description: DESCRIPTION,
    parameters: Parameters,
    execute: (params: { filter: string; file?: string }, ctx: Tool.Context) =>
      Effect.gen(function* () {
        yield* ctx.ask({ permission: "jq", patterns: [params.filter], always: ["*"], metadata: { filter: params.filter, file: params.file } })
        const output = yield* Effect.promise(() => runJq(params.filter, params.file))
        return { title: `jq ${params.filter}`, metadata: {} as Record<string, unknown>, output }
      }).pipe(Effect.orDie),
  }
}))

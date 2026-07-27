import { Effect, Schema } from "effect"
import * as Tool from "./tool"
import DESCRIPTION from "./yq.txt"
import { spawn } from "child_process"

export const Parameters = Schema.Struct({
  filter: Schema.String.annotate({ description: "The yq filter expression (e.g. '.key', '.nested.value')" }),
  file: Schema.String.annotate({ description: "Path to the YAML/TOML file to query" }),
})

function runYq(filter: string, file: string): Promise<string> {
  return new Promise((resolve) => {
    const proc = spawn("yq", [filter, file], { stdio: ["ignore", "pipe", "pipe"], shell: true, timeout: 10000 })
    let stdout = "", stderr = ""
    proc.stdout.on("data", (d: Buffer) => { stdout += d.toString() })
    proc.stderr.on("data", (d: Buffer) => { stderr += d.toString() })
    proc.on("close", (code) => {
      resolve(code === 0 ? stdout.trim() : `yq error:\n${stderr}`)
    })
    proc.on("error", () => resolve("yq not found. Install with: apt install yq or brew install yq"))
  })
}

export const YqTool = Tool.define("yq", Effect.gen(function* () {
  return {
    description: DESCRIPTION,
    parameters: Parameters,
    execute: (params: { filter: string; file: string }, ctx: Tool.Context) =>
      Effect.gen(function* () {
        yield* ctx.ask({ permission: "yq", patterns: [params.filter, params.file], always: ["*"], metadata: { filter: params.filter, file: params.file } })
        const output = yield* Effect.promise(() => runYq(params.filter, params.file))
        return { title: `yq ${params.filter}`, metadata: {} as Record<string, unknown>, output }
      }).pipe(Effect.orDie),
  }
}))

import { Effect, Schema } from "effect"
import * as Tool from "./tool"
import DESCRIPTION from "./bat.txt"
import { spawn } from "child_process"

export const Parameters = Schema.Struct({
  file: Schema.String.annotate({ description: "Path to the file to display" }),
  lines: Schema.optional(Schema.String).annotate({ description: "Line range to display (e.g. '10:20' or '30:'). Omit for full file." }),
})

function runBat(file: string, lines?: string): Promise<string> {
  return new Promise((resolve) => {
    const args = lines ? ["--line-range", lines, file] : [file]
    const proc = spawn("bat", [...args, "--color=never", "--no-pager"], { stdio: ["ignore", "pipe", "pipe"], shell: true, timeout: 10000 })
    let stdout = "", stderr = ""
    proc.stdout.on("data", (d: Buffer) => { stdout += d.toString() })
    proc.stderr.on("data", (d: Buffer) => { stderr += d.toString() })
    proc.on("close", (code) => {
      resolve(code === 0 ? stdout : `bat error:\n${stderr}`)
    })
    proc.on("error", () => resolve("bat not found. Install with: apt install bat or brew install bat"))
  })
}

export const BatTool = Tool.define("bat", Effect.gen(function* () {
  return {
    description: DESCRIPTION,
    parameters: Parameters,
    execute: (params: { file: string; lines?: string }, ctx: Tool.Context) =>
      Effect.gen(function* () {
        yield* ctx.ask({ permission: "bat", patterns: [params.file], always: ["*"], metadata: { file: params.file, lines: params.lines } })
        const output = yield* Effect.promise(() => runBat(params.file, params.lines))
        return { title: `bat: ${params.file}`, metadata: {} as Record<string, unknown>, output }
      }).pipe(Effect.orDie),
  }
}))

import { Effect, Schema } from "effect"
import * as Tool from "./tool"
import DESCRIPTION from "./sq.txt"
import { spawn } from "child_process"

export const Parameters = Schema.Struct({
  query: Schema.String.annotate({ description: "SQL query to run (e.g. 'SELECT * FROM data.csv', 'SELECT count(*) FROM data')" }),
  file: Schema.optional(Schema.String).annotate({ description: "Path to the data source file (CSV, SQLite, Parquet, etc.)" }),
})

function runSq(query: string, file?: string): Promise<string> {
  return new Promise((resolve) => {
    const args = file ? [query, file] : [query]
    const proc = spawn("sq", args, { stdio: ["ignore", "pipe", "pipe"], shell: true, timeout: 15000 })
    let stdout = "", stderr = ""
    proc.stdout.on("data", (d: Buffer) => { stdout += d.toString() })
    proc.stderr.on("data", (d: Buffer) => { stderr += d.toString() })
    proc.on("close", (code) => {
      resolve(code === 0 ? stdout.trim() : `sq error:\n${stderr}`)
    })
    proc.on("error", () => resolve("sq not found. Install from: https://github.com/neilotoole/sq"))
  })
}

export const SqTool = Tool.define("sq", Effect.gen(function* () {
  return {
    description: DESCRIPTION,
    parameters: Parameters,
    execute: (params: { query: string; file?: string }, ctx: Tool.Context) =>
      Effect.gen(function* () {
        yield* ctx.ask({ permission: "sq", patterns: [params.query], always: ["*"], metadata: { query: params.query, file: params.file } })
        const output = yield* Effect.promise(() => runSq(params.query, params.file))
        return { title: `sq ${params.query}`, metadata: {} as Record<string, unknown>, output }
      }).pipe(Effect.orDie),
  }
}))

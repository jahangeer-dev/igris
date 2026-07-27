import { Effect, Schema } from "effect"
import * as Tool from "./tool"
import DESCRIPTION from "./fzf.txt"
import { spawn } from "child_process"

export const Parameters = Schema.Struct({
  query: Schema.String.annotate({ description: "Search query for fuzzy matching" }),
  path: Schema.optional(Schema.String).annotate({ description: "Base directory to search in. Defaults to current directory." }),
  limit: Schema.optional(Schema.Int).annotate({ description: "Maximum number of results to return (default 20)" }),
})

function runFzf(query: string, searchPath: string): Promise<string> {
  return new Promise((resolve) => {
    const proc = spawn("fzf", ["-f", query, "--no-height"], { stdio: ["ignore", "pipe", "pipe"], cwd: searchPath, shell: true, timeout: 10000 })
    let stdout = "", stderr = ""
    proc.stdout.on("data", (d: Buffer) => { stdout += d.toString() })
    proc.stderr.on("data", (d: Buffer) => { stderr += d.toString() })
    proc.on("close", () => {
      const results = stdout.trim().split("\n").filter(Boolean)
      resolve(results.length ? results.join("\n") : "No matches found")
    })
    proc.on("error", () => resolve("fzf not found. Install with: apt install fzf or brew install fzf"))
  })
}

export const FzfTool = Tool.define("fzf", Effect.gen(function* () {
  return {
    description: DESCRIPTION,
    parameters: Parameters,
    execute: (params: { query: string; path?: string; limit?: number }, ctx: Tool.Context) =>
      Effect.gen(function* () {
        yield* ctx.ask({ permission: "fzf", patterns: [params.query], always: ["*"], metadata: { query: params.query, path: params.path } })
        const output = yield* Effect.promise(() => runFzf(params.query, params.path ?? "."))
        return { title: `fzf: ${params.query}`, metadata: { limit: params.limit ?? 20 } as Record<string, unknown>, output }
      }).pipe(Effect.orDie),
  }
}))

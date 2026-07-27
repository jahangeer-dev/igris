import { Effect, Schema } from "effect"
import * as Tool from "./tool"
import DESCRIPTION from "./ast-grep.txt"
import { spawn } from "child_process"

export const Parameters = Schema.Struct({
  pattern: Schema.String.annotate({ description: "AST pattern to search for using tree-sitter query syntax. Examples: 'console.log($A)', 'if ($A) { $B } else { $C }', 'function $NAME($$$) { $$$ }'" }),
  path: Schema.optional(Schema.String).annotate({ description: "Directory or file to search in. Defaults to current directory." }),
  lang: Schema.optional(Schema.String).annotate({ description: "Language to parse (e.g. 'ts', 'js', 'rust', 'go', 'py'). Auto-detected if omitted." }),
})

function runAstGrep(pattern: string, searchPath: string, lang?: string): Promise<string> {
  return new Promise((resolve) => {
    const args = ["-p", pattern, "--no-color"]
    if (lang) args.push("-l", lang)
    args.push(searchPath)

    const proc = spawn("sg", args, { stdio: ["ignore", "pipe", "pipe"], shell: true, timeout: 15000 })
    let stdout = "", stderr = ""
    proc.stdout.on("data", (d: Buffer) => { stdout += d.toString() })
    proc.stderr.on("data", (d: Buffer) => { stderr += d.toString() })
    proc.on("close", (code) => {
      resolve(code === 0 ? stdout.trim() || "No matches found." : `ast-grep error:\n${stderr}`)
    })
    proc.on("error", () => resolve("ast-grep not found. Install with: npm install -g @ast-grep/cli or cargo install ast-grep"))
  })
}

export const AstGrepTool = Tool.define("ast-grep", Effect.gen(function* () {
  return {
    description: DESCRIPTION,
    parameters: Parameters,
    execute: (params: { pattern: string; path?: string; lang?: string }, ctx: Tool.Context) =>
      Effect.gen(function* () {
        yield* ctx.ask({ permission: "ast-grep", patterns: [params.pattern], always: ["*"], metadata: { pattern: params.pattern, lang: params.lang } })
        const output = yield* Effect.promise(() => runAstGrep(params.pattern, params.path ?? ".", params.lang))
        return { title: `ast-grep: ${params.pattern}`, metadata: {} as Record<string, unknown>, output }
      }).pipe(Effect.orDie),
  }
}))

import { Effect, Schema } from "effect"
import * as Tool from "./tool"
import DESCRIPTION from "./gh.txt"
import { spawn } from "child_process"

const READ_COMMANDS = new Set([
  "view", "list", "status", "search", "diff",
  "pr view", "pr list", "pr diff", "pr status", "pr check",
  "issue view", "issue list", "issue search",
  "repo view", "repo list",
  "release view", "release list",
  "run view", "run list",
  "action view", "action list",
  "workflow view", "workflow list",
  "gist view", "gist list",
  "label list", "milestone list",
  "project list",
  "secret list",
])

function isReadOperation(command: string): boolean {
  const lower = command.toLowerCase().trim()
  if (READ_COMMANDS.has(lower)) return true
  if (lower.startsWith("api ") && !lower.includes("post") && !lower.includes("patch") && !lower.includes("put") && !lower.includes("delete")) return true
  return false
}

export const Parameters = Schema.Struct({
  command: Schema.String.annotate({ description: "The gh command to run (e.g. 'pr list', 'issue view 123'). Do NOT include the 'gh' prefix." }),
})

function runGh(command: string): Promise<string> {
  return new Promise((resolve) => {
    const proc = spawn("gh", command.split(/\s+/), { stdio: ["ignore", "pipe", "pipe"], shell: true, timeout: 30000 })
    let stdout = "", stderr = ""
    proc.stdout.on("data", (d: Buffer) => { stdout += d.toString() })
    proc.stderr.on("data", (d: Buffer) => { stderr += d.toString() })
    proc.on("close", (code) => {
      resolve(code === 0 ? (stdout.trim() || stderr.trim()) : `gh exited with code ${code}:\n${stderr}\n${stdout}`)
    })
    proc.on("error", () => resolve("gh not found. Install from: https://cli.github.com/"))
  })
}

export const GhTool = Tool.define("gh", Effect.gen(function* () {
  return {
    description: DESCRIPTION,
    parameters: Parameters,
    execute: (params: { command: string }, ctx: Tool.Context) =>
      Effect.gen(function* () {
        const isRead = isReadOperation(params.command)
        yield* ctx.ask({
          permission: "gh",
          patterns: [params.command],
          always: isRead ? ["*"] : [],
          metadata: { command: params.command, readOnly: isRead },
        })
        const output = yield* Effect.promise(() => runGh(params.command))
        return { title: `gh ${params.command}`, metadata: { readOnly: isRead } as Record<string, unknown>, output }
      }).pipe(Effect.orDie),
  }
}))

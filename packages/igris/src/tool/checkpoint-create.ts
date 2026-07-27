import { Effect, Schema } from "effect"
import * as Tool from "./tool"
import DESCRIPTION from "./checkpoint-create.txt"
import { spawn } from "child_process"

export const Parameters = Schema.Struct({
  message: Schema.optional(Schema.String).annotate({ description: "Description of what you're about to do (e.g. 'refactoring auth module')" }),
})

function gitStash(message?: string): Promise<string> {
  return new Promise((resolve) => {
    const args = ["stash", "push", "--include-untracked", "--message", message ?? `checkpoint ${Date.now()}`]
    const proc = spawn("git", args, { stdio: ["ignore", "pipe", "pipe"], shell: true, timeout: 10000 })
    let stdout = "", stderr = ""
    proc.stdout.on("data", (d: Buffer) => { stdout += d.toString() })
    proc.stderr.on("data", (d: Buffer) => { stderr += d.toString() })
    proc.on("close", (code) => {
      if (code !== 0) resolve(`checkpoint failed:\n${stderr}`)
      else resolve(stdout.trim() || "No changes to snapshot (worktree is clean).")
    })
    proc.on("error", () => resolve("checkpoint requires git"))
  })
}

export const CheckpointCreateTool = Tool.define("checkpoint-create", Effect.gen(function* () {
  return {
    description: DESCRIPTION,
    parameters: Parameters,
    execute: (params: { message?: string }, ctx: Tool.Context) =>
      Effect.gen(function* () {
        yield* ctx.ask({ permission: "checkpoint", patterns: ["create"], always: ["*"], metadata: { message: params.message } })
        const output = yield* Effect.promise(() => gitStash(params.message))
        return { title: "Checkpoint created", metadata: {} as Record<string, unknown>, output }
      }).pipe(Effect.orDie),
  }
}))

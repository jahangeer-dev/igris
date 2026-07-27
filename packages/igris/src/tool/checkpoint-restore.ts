import { Effect, Schema } from "effect"
import * as Tool from "./tool"
import DESCRIPTION from "./checkpoint-restore.txt"
import { spawn } from "child_process"

export const Parameters = Schema.Struct({
  index: Schema.optional(Schema.Int).annotate({ description: "Stash index to restore (default: most recent stash). Run `git stash list` to see available." }),
})

function gitStashPop(index?: number): Promise<string> {
  return new Promise((resolve) => {
    const args = index !== undefined ? ["stash", "pop", `stash@{${index}}`] : ["stash", "pop"]
    const proc = spawn("git", args, { stdio: ["ignore", "pipe", "pipe"], shell: true, timeout: 10000 })
    let stdout = "", stderr = ""
    proc.stdout.on("data", (d: Buffer) => { stdout += d.toString() })
    proc.stderr.on("data", (d: Buffer) => { stderr += d.toString() })
    proc.on("close", (code) => {
      if (code !== 0) resolve(`restore failed:\n${stderr}`)
      else resolve(stdout.trim() || "Restored successfully.")
    })
    proc.on("error", () => resolve("checkpoint restore requires git"))
  })
}

export const CheckpointRestoreTool = Tool.define("checkpoint-restore", Effect.gen(function* () {
  return {
    description: DESCRIPTION,
    parameters: Parameters,
    execute: (params: { index?: number }, ctx: Tool.Context) =>
      Effect.gen(function* () {
        yield* ctx.ask({ permission: "checkpoint", patterns: ["restore"], always: ["*"], metadata: { index: params.index } })
        const output = yield* Effect.promise(() => gitStashPop(params.index))
        return { title: "Checkpoint restored", metadata: {} as Record<string, unknown>, output }
      }).pipe(Effect.orDie),
  }
}))

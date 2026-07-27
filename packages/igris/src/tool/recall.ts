import { Effect, Schema } from "effect"
import { Memory } from "../memory"
import * as Tool from "./tool"
import DESCRIPTION from "./recall.txt"

export const Parameters = Schema.Struct({
  query: Schema.optional(Schema.String).annotate({ description: "Search keywords to find relevant memories. Omit to return all memories." }),
})

export const RecallTool = Tool.define("recall", Effect.gen(function* () {
  const memory = yield* Memory.Service
  return {
    description: DESCRIPTION,
    parameters: Parameters,
    execute: (params: { query?: string }, ctx: Tool.Context) =>
      Effect.gen(function* () {
        yield* ctx.ask({ permission: "recall", patterns: [params.query ?? "*"], always: ["*"], metadata: { query: params.query } })

        const results = params.query ? yield* memory.recall(params.query) : yield* memory.all()
        if (results.length === 0) {
          return { title: "No memories found", metadata: {} as Record<string, unknown>, output: "No matching memories found." }
        }

        return {
          title: `Found ${results.length} memories`,
          metadata: { count: results.length } as Record<string, unknown>,
          output: results.join("\n\n---\n\n"),
        }
      }).pipe(Effect.orDie),
  }
}))

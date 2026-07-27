import { Effect, Schema } from "effect"
import { Memory } from "../memory"
import * as Tool from "./tool"
import DESCRIPTION from "./memorize.txt"

export const Parameters = Schema.Struct({
  content: Schema.String.annotate({ description: "The fact to remember. Be specific and include context (e.g. 'This project uses X because Y')." }),
  tags: Schema.optional(Schema.Array(Schema.String)).annotate({ description: "Optional tags for categorization (e.g. ['typescript', 'build'])" }),
})

export const MemorizeTool = Tool.define("memorize", Effect.gen(function* () {
  const memory = yield* Memory.Service
  return {
    description: DESCRIPTION,
    parameters: Parameters,
    execute: (params: { content: string; tags?: string[] }, ctx: Tool.Context) =>
      Effect.gen(function* () {
        yield* ctx.ask({ permission: "memorize", patterns: [params.content], always: ["*"], metadata: { tags: params.tags } })
        const filename = yield* memory.store({ content: params.content, tags: params.tags })
        return {
          title: `Memorized: ${params.content.slice(0, 60)}`,
          metadata: {} as Record<string, unknown>,
          output: `✅ Stored as \`.igris/memory/${filename}\`\nFuture sessions will recall this fact when relevant.`,
        }
      }).pipe(Effect.orDie),
  }
}))

import path from "path"
import { Effect, Layer, Context } from "effect"
import { LayerNode } from "@igris-ai/core/effect/layer-node"
import { InstanceState } from "@/effect/instance-state"
import { FSUtil } from "@igris-ai/core/fs-util"
import { Global } from "@igris-ai/core/global"

const MEMORY_DIR = ".igris/memory"

export interface Interface {
  readonly store: (input: { content: string; tags?: string[] }) => Effect.Effect<string>
  readonly recall: (query: string) => Effect.Effect<string[]>
  readonly all: () => Effect.Effect<string[]>
  readonly inject: () => Effect.Effect<string | undefined>
}

export class Service extends Context.Service<Service, Interface>()("@igris/Memory") {}

const dir = Effect.fn("Memory.dir")(function* () {
  const ctx = yield* InstanceState.context
  return path.join(ctx.worktree, MEMORY_DIR)
})

const layer = Layer.effect(
  Service,
  Effect.gen(function* () {
    const fs = yield* FSUtil.Service

    const store: Interface["store"] = (input) =>
      Effect.gen(function* () {
        const d = yield* dir()
        yield* fs.ensureDir(d)
        const slug = input.content
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-|-$/g, "")
          .slice(0, 60)
        const filename = `${slug}.md`
        const tags = input.tags?.length ? `---\ntags: [${input.tags.join(", ")}]\n---\n\n` : ""
        yield* fs.writeFileString(path.join(d, filename), tags + input.content.trim() + "\n")
        return filename
      }).pipe(Effect.orDie)

    const recall: Interface["recall"] = (query) =>
      Effect.gen(function* () {
        const d = yield* dir()
        const exists = yield* fs.isDir(d)
        if (!exists) return []

        const entries = yield* fs.readDirectoryEntries(d)
        const q = query.toLowerCase()
        const results: string[] = []
        for (const entry of entries.sort((a, b) => a.name.localeCompare(b.name))) {
          if (!entry.name.endsWith(".md")) continue
          const content = yield* fs.readFileString(path.join(d, entry.name)).pipe(Effect.catch(() => Effect.succeed("")))
          if (!content || !content.toLowerCase().includes(q)) continue
          results.push(`📝 ${entry.name.replace(".md", "")}\n${content.replace(/^---[\s\S]*?---\n\n?/, "")}`)
        }
        return results
      }).pipe(Effect.orDie)

    const all: Interface["all"] = () =>
      Effect.gen(function* () {
        const d = yield* dir()
        const exists = yield* fs.isDir(d)
        if (!exists) return []

        const entries = yield* fs.readDirectoryEntries(d)
        const results: string[] = []
        for (const entry of entries.sort((a, b) => a.name.localeCompare(b.name))) {
          if (!entry.name.endsWith(".md")) continue
          const content = yield* fs.readFileString(path.join(d, entry.name)).pipe(Effect.catch(() => Effect.succeed("")))
          if (content) results.push(`📝 ${entry.name.replace(".md", "")}\n${content.replace(/^---[\s\S]*?---\n\n?/, "")}`)
        }
        return results
      }).pipe(Effect.orDie)

    const inject: Interface["inject"] = () =>
      Effect.gen(function* () {
        const allMemories = yield* all()
        if (allMemories.length === 0) return undefined
        return [
          "<project_memory>",
          "The following facts were learned in previous sessions. Use them to avoid repeating mistakes and follow established patterns.",
          ...allMemories.map((m) => `  <memory>\n    ${m.split("\n").join("\n    ")}\n  </memory>`),
          "</project_memory>",
        ].join("\n")
      })

    return Service.of({ store, recall, all, inject })
  }),
)

export const node = LayerNode.make({
  service: Service,
  layer: layer,
  deps: [FSUtil.node, Global.node],
})

export * as Memory from "."

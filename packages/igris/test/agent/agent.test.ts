import { describe, expect } from "bun:test"
import { Effect, Layer } from "effect"
import { Agent } from "../../src/agent/agent"
import { Permission } from "../../src/permission"
import { testEffect } from "../lib/effect"
import { CrossSpawnSpawner } from "@igris-ai/core/cross-spawn-spawner"
import { AppNodeBuilder } from "@igris-ai/core/effect/app-node-builder"
import { LayerNode } from "@igris-ai/core/effect/layer-node"
import { type Agent as AgentSchema } from "@igris-ai/schema/agent"
import { Truncate } from "../../src/tool/truncate"

function evalPerm(agent: AgentSchema.Info | undefined, action: string): string {
  if (!agent) return "deny"
  return Permission.evaluate(action, "*", agent.permission).action
}

const it = testEffect(
  AppNodeBuilder.build(
    LayerNode.group([Agent.node, CrossSpawnSpawner.node]),
    [],
  ),
)

const load = <A>(f: (svc: Agent.Service) => Effect.Effect<A>) =>
  Effect.gen(function* () {
    const svc = yield* Agent.Service
    return yield* f(svc)
  })

describe("default agents", () => {
  it.instance("returns explore, compaction, title, summary when no config", () =>
    Effect.gen(function* () {
      const agents = yield* load((svc) => svc.list())
      const names = agents.map((a) => a.name)
      expect(names).toContain("explore")
      expect(names).toContain("compaction")
      expect(names).toContain("title")
      expect(names).toContain("summary")
    }),
  )

  it.instance("explore is subagent with limited tools", () =>
    Effect.gen(function* () {
      const explore = yield* load((svc) => svc.get("explore"))
      expect(explore).toBeDefined()
      expect(explore?.mode).toBe("subagent")
      expect(evalPerm(explore, "edit")).toBe("deny")
      expect(evalPerm(explore, "write")).toBe("deny")
      expect(evalPerm(explore, "todowrite")).toBe("deny")
      expect(evalPerm(explore, "webfetch")).toBe("allow")
      expect(Permission.evaluate("external_directory", "/some/other/path", explore!.permission).action).toBe("ask")
      expect(Permission.evaluate("external_directory", Truncate.GLOB, explore!.permission).action).toBe("allow")
    }),
  )

  it.instance("compaction is hidden with all permissions denied", () =>
    Effect.gen(function* () {
      const compaction = yield* load((svc) => svc.get("compaction"))
      expect(compaction).toBeDefined()
      expect(compaction?.hidden).toBe(true)
      expect(evalPerm(compaction, "bash")).toBe("deny")
      expect(evalPerm(compaction, "edit")).toBe("deny")
      expect(evalPerm(compaction, "read")).toBe("deny")
    }),
  )
})

describe("permission defaults", () => {
  it.instance("Truncate.GLOB is allowed even with global external_directory deny", () =>
    Effect.gen(function* () {
      const explore = yield* load((svc) => svc.get("explore"))
      expect(explore).toBeDefined()
      expect(Permission.evaluate("external_directory", Truncate.GLOB, explore!.permission).action).toBe("allow")
    }),
  {
    config: {
      permission: {
        external_directory: {
          "*": "deny",
        },
      },
    },
  },
)

it.instance("explicit Truncate.GLOB deny is respected", () =>
  Effect.gen(function* () {
    const explore = yield* load((svc) => svc.get("explore"))
    expect(explore).toBeDefined()
    expect(Permission.evaluate("external_directory", Truncate.GLOB, explore!.permission).action).toBe("deny")
  }),
{
  config: {
    permission: {
      external_directory: {
        [Truncate.GLOB]: "deny",
      },
    },
  },
},
)
})

describe("custom agent config", () => {
  it.instance("creates new agent from config", () =>
    Effect.gen(function* () {
      const custom = yield* load((svc) => svc.get("my_custom_agent"))
      expect(custom).toBeDefined()
      expect(String(custom?.model?.providerID)).toBe("openai")
      expect(String(custom?.model?.modelID)).toBe("gpt-4")
      expect(custom?.description).toBe("My custom agent")
      expect(custom?.temperature).toBe(0.5)
      expect(custom?.topP).toBe(0.9)
      expect(custom?.native).toBe(false)
      expect(custom?.mode).toBe("all")
    }),
  {
    config: {
      agent: {
        my_custom_agent: {
          model: "openai/gpt-4",
          description: "My custom agent",
          temperature: 0.5,
          top_p: 0.9,
        },
      },
    },
  },
)

it.instance("overrides native agent properties", () =>
  Effect.gen(function* () {
    const explore = yield* load((svc) => svc.get("explore"))
    expect(explore).toBeDefined()
    expect(String(explore?.model?.providerID)).toBe("anthropic")
    expect(String(explore?.model?.modelID)).toBe("claude-3")
    expect(explore?.description).toBe("Custom explore agent")
    expect(explore?.temperature).toBe(0.7)
    expect(explore?.color).toBe("#FF0000")
    expect(explore?.native).toBe(true)
  }),
{
  config: {
    agent: {
      explore: {
        model: "anthropic/claude-3",
        description: "Custom explore agent",
        temperature: 0.7,
        color: "#FF0000",
      },
    },
  },
},
)

it.instance("disable removes agent from list", () =>
  Effect.gen(function* () {
    const explore = yield* load((svc) => svc.get("explore"))
    expect(explore).toBeUndefined()
    const agents = yield* load((svc) => svc.list())
    const names = agents.map((a) => a.name)
    expect(names).not.toContain("explore")
  }),
{
  config: {
    agent: {
      explore: { disable: true },
    },
  },
},
)

it.instance("permission config merges with defaults", () =>
  Effect.gen(function* () {
    const explore = yield* load((svc) => svc.get("explore"))
    expect(explore).toBeDefined()
    expect(Permission.evaluate("bash", "sudo rm -rf /", explore!.permission).action).toBe("deny")
    expect(evalPerm(explore, "grep")).toBe("allow")
  }),
{
  config: {
    agent: {
      explore: {
        permission: {
          bash: {
            "sudo rm -rf /": "deny",
          },
        },
      },
    },
  },
},
)

it.instance("global permission config applies to all agents", () =>
  Effect.gen(function* () {
    const explore = yield* load((svc) => svc.get("explore"))
    expect(explore).toBeDefined()
    expect(evalPerm(explore, "bash")).toBe("deny")
  }),
{
  config: {
    permission: {
      bash: "deny",
    },
  },
},
)

it.instance("steps/maxSteps config sets steps property", () =>
  Effect.gen(function* () {
    const explore = yield* load((svc) => svc.get("explore"))
    const compaction = yield* load((svc) => svc.get("compaction"))
    expect(explore?.steps).toBe(50)
    expect(compaction?.steps).toBe(100)
  }),
{
  config: {
    agent: {
      explore: { steps: 50 },
      compaction: { maxSteps: 100 },
    },
  },
},
)

it.instance("mode can be overridden", () =>
  Effect.gen(function* () {
    const explore = yield* load((svc) => svc.get("explore"))
    expect(explore?.mode).toBe("primary")
  }),
{
  config: {
    agent: {
      explore: { mode: "primary" },
    },
  },
},
)

it.instance("name can be overridden", () =>
  Effect.gen(function* () {
    const explore = yield* load((svc) => svc.get("explore"))
    expect(explore?.name).toBe("Code Explorer")
  }),
{
  config: {
    agent: {
      explore: { name: "Code Explorer" },
    },
  },
},
)

it.instance("prompt can be set from config", () =>
  Effect.gen(function* () {
    const explore = yield* load((svc) => svc.get("explore"))
    expect(explore?.prompt).toBe("Custom system prompt")
  }),
{
  config: {
    agent: {
      explore: { prompt: "Custom system prompt" },
    },
  },
},
)
})

describe("Agent.list", () => {
  it.instance("includes all default agents", () =>
    Effect.gen(function* () {
      const agents = yield* load((svc) => svc.list())
      const names = agents.map((a) => a.name)
      expect(names).toContain("compaction")
      expect(names).toContain("explore")
      expect(names).toContain("summary")
      expect(names).toContain("title")
    }),
  )

  it.instance("respects default_agent config for sorting", () =>
    Effect.gen(function* () {
      const agents = yield* load((svc) => svc.list())
      const names = agents.map((a) => a.name)
      expect(names[0]).toBe("my_default")
    }),
  {
    config: {
      default_agent: "my_default",
      agent: {
        my_default: {
          mode: "primary",
          permission: {},
        },
      },
    },
  },
)
})

describe("defaultAgent", () => {
  it.instance("returns configured default agent", () =>
    Effect.gen(function* () {
      const agent = yield* load((svc) => svc.defaultAgent())
      expect(agent).toBe("my_default")
    }),
  {
    config: {
      default_agent: "my_default",
      agent: {
        my_default: {
          mode: "primary",
          permission: {},
        },
      },
    },
  },
)

it.instance("defaultInfo returns configured default agent info", () =>
  Effect.gen(function* () {
    const agent = yield* load((svc) => svc.defaultInfo())
    expect(agent.name).toBe("my_default")
    expect(agent.mode).toBe("primary")
  }),
{
  config: {
    default_agent: "my_default",
    agent: {
      my_default: {
        mode: "primary",
        permission: {},
      },
    },
  },
},
)
})

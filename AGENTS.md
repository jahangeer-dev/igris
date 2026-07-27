# IGRIS Agent Guide

This is **Igris** — an AI-powered development tool. The repo is a large Bun monorepo (`workspaces` in `package.json`) with extensive use of **Effect v4** for effectful TypeScript.

---

## Essential Commands

| Command | From | Purpose |
|---|---|---|
| `bun install` | root | Install all workspace dependencies |
| `bun dev` | root (→ `packages/igris`) | Start the interactive TUI |
| `bun dev:web` | root | Start the web app at `localhost:4444` |
| `bun dev:desktop` | root | Start the Electron desktop app |
| `bun dev:console` | root | Start the console web app |
| `bun dev:storybook` | root | Start Storybook |
| `bun lint` | root | Run oxlint (no config needed) |
| `bun typecheck` | root | Run turbo typecheck across all packages |
| `bun turbo test` | root | Run all package tests (NOT from root — see below) |
| `bun test` | `packages/<name>` | Run that package's tests (with `--only-failures`) |
| `bun typecheck` | `packages/<name>` | Typecheck (via `tsgo --noEmit`) — never `tsc` directly |
| `bun run generate` | `packages/client` | Regenerate generated client code from HttpApi |

**Critical**: Tests **cannot** run from repo root. There is a guard file at `./do-not-run-tests-from-root`. Always `cd` into a package directory first. From the root, `bun turbo test` is safe — it delegates per-package.

**Type checking** uses `tsgo` (a TypeScript-native checker, `@typescript/native-preview`), not `tsc`. Run `bun typecheck` from a package directory.

**Linting** uses `oxlint` (no config file needed — `.oxlintrc.json` is auto-detected). Run `bun lint` from root.

---

## Repository Structure

### Packages (dependencies flow one way)

```
schema ──→ protocol ──→ server
   │                        │
   └──→ core ←──────────────┘
   │       │
   └──→ client ←──→ sdk-next
   │       │
   └──→ app (web UI, SolidJS)
   │
   └──→ llm (native LLM runtime, independent of session concerns)
```

- **`@igris-ai/schema`** — Browser-safe Effect Schema wire/storage contracts. Zero runtime behavior. Serialization-only. Exports namespaces like `Session`, `Agent`, `Model`, `Permission`, etc. Uses `Schema.Struct`, `Schema.brand`, `Schema.TaggedErrorClass`.
- **`@igris-ai/protocol`** — HTTP API surface definitions (groups: `session`, `agent`, `fs`, `pty`, `credential`, `event`, etc.). Depends on Schema.
- **`@igris-ai/core`** — Domain logic: sessions, agents, tools, filesystem, database, config, LLM orchestration, system context, effect layers. The biggest package. Has platform-specific subpath imports (`#sqlite`, `#pty`, `#fff`) resolving to `.bun.ts` or `.node.ts`.
- **`@igris-ai/server`** — HTTP server. Depends on Core and Protocol.
- **`@igris-ai/client`** — Generated Effect + Promise client from HttpApi. Do not edit `src/generated` or `src/generated-effect` directly — run `bun run generate` instead.
- **`@igris-ai/sdk-next`** — Composes Client + Core + Server into a unified in-process SDK.
- **`@igris-ai/llm`** — Native LLM runtime (opt-in). Routes, protocols, provider facades, transport. Independent of session concerns. Has its own extensive AGENTS.md guide.
- **`igris`** — The main application package. CLI, TUI, session orchestration, plugins, config, tools, MCP, LSP, auth, server bootstrap. The entrypoint for `bun dev`. Depends on Core, TUI, SDK, Schema, Protocol, Server, Plugin.
- **`@igris-ai/tui`** — Terminal UI (OpenTUI/SolidJS-based). Reusable runtime components, prompt display, plugin slots, keybinding, theme.
- **`@igris-ai/ui`** — Shared UI components used by App and Desktop.
- **`@igris-ai/app`** — Web app (SolidJS + Vite + Tailwind). The hosted web UI.
- **`@igris-ai/desktop`** — Electron app wrapping `@igris-ai/app`. Uses `electron-vite`, `electron-builder`.
- **`@igris-ai/codemode`** — Isolated tool execution environment (sandboxed).
- **`@igris-ai/plugin`** — Plugin system (agent, command, provider, skill).
- **`@igris-ai/stats`** — Public analytics site (SST/OpenNext).
- **`@igris-ai/effect-drizzle-sqlite`** — Custom Drizzle + Effect SQLite adapter (vendor, may be replaced upstream).
- **`@igris-ai/effect-sqlite-node`** — Effect SQLite node driver helpers.

### Key Directories

- `packages/igris/src/cli/` — CLI commands (yargs-based), bootsrap, UI helpers
- `packages/igris/src/session/` — Session orchestration, prompt handling, message processor, LLM routing
- `packages/igris/src/server/` — HTTP server, routes, event projectors
- `packages/igris/src/config/` — Config loading, parsing, dynamic reload
- `packages/igris/src/tool/` — Tool definitions (read, edit, write, grep, glob, shell, etc.)
- `packages/igris/src/effect/` — Effect runtime scaffolding, app-node, instance state
- `packages/core/src/session/` — Session store, SQL, runner, execution, compaction, revert, events
- `packages/core/src/tool/` — Tool core: `Tool.make`, registry, builtins, registry architecture
- `packages/core/src/effect/` — Node platform layer, keyed mutex, memo-map, runtime
- `packages/core/src/database/` — Drizzle schema, migrations, SQLite drivers
- `packages/core/src/config/` — Config domain (agent, command, lsp, mcp, provider, etc.)
- `packages/llm/src/` — Schema, route (protocol/endpoint/auth/framing), protocols, providers

---

## Architecture & Control Flow

### Main CLI entrypoint

`packages/igris/src/index.ts` — yargs CLI with commands: `run`, `serve`, `tui`, `agent`, `github`, `pr`, `session`, `acp`, `debug`, `generate`, `account`, `providers`, `models`, `upgrade`, `export`, `import`, `attach`, `web`, `mcp`, `db`, `plugin`, and more.

### Session Runtime

The V2 session architecture (documented extensively in `CONTEXT.md`):

1. **Prompt admission** — `SessionV2.prompt()` writes a `session_input` row, schedules a wake
2. **Wake / drain** — `SessionExecution.wake()` starts a process-local drain that promotes admitted inputs
3. **Provider turn** — One `llm.stream()` call with projected history + system context
4. **Tool settlement** — Tool calls return results, loop until idle or explicit queue

Key boundaries:
- `SessionExecution` — process-global, session-ID based coordinator
- `SessionRunner` — Location-scoped (model, tools, permissions, filesystem)
- `Context Sources` — independently observed typed values in system context
- `Context Epoch` — immutable baseline span between compactions

### LLM Runtime (two paths)

```
session/llm.ts → LLM.Service (orchestration, auth, config, plugins, permissions)
                      │
                      ├── native gate (experimental) → native-runtime.ts → native-request.ts → LLMClient
                      │
                      └── AI SDK (default) → ai-sdk.ts → streamText → LLMEvent stream
```

Both converge on `LLMEvent` streams for downstream session processing. AI SDK is the default; native is opt-in via `IGRIS_EXPERIMENTAL_NATIVE_LLM=true`.

### Database

- **ORM**: Drizzle ORM (SQLite)
- **Schema files**: `packages/core/src/**/*.sql.ts` (e.g., `session/sql.ts`, `project/sql.ts`)
- **Migrations**: in `packages/core/src/database/migration/`
- **Schema convention**: snake_case column names (no string aliases needed)
- **Access**: Via `drizzle-orm/sqlite-core` functions like `sqliteTable`, `text()`, `integer()`

### Desktop App

- `packages/desktop/` — Electron app
- Renderer process: calls `window.api` from `src/preload`
- Main process: IPC handlers in `src/main/ipc.ts`
- Build with `electron-vite`, package with `electron-builder`

### Web App

- `packages/app/` — SolidJS + Vite + Tailwind CSS v4
- Uses `@solidjs/router`, `@solidjs/meta`, `@solidjs/start`
- State: prefers `createStore` over multiple `createSignal`
- Tests: bun unit tests (happy-dom), playwright e2e tests
- Local dev: run backend (`bun serve --port 4096`) and app (`bun dev -- --port 4444`) separately

---

## Code Conventions & Patterns

### Module Shape

Use the **self-reexport pattern**. Each module exports a namespace at the bottom:

```ts
// src/foo/foo.ts
export interface Interface { ... }
export class Service extends Context.Service<Service, Interface>()("@igris/Foo") {}

export * as Foo from "./foo"
```

Consumers import `import { Foo } from "@/foo/foo"` and use `Foo.Service`.

For single-namespace `index.ts`, use `export * as Foo from "."` (not `"./index"`).

Multi-sibling directories (e.g., `src/session/`) keep each sibling as its own file with its own self-reexport — **no barrel `index.ts`**. This avoids importing every sibling on any single import.

**Do not use `export namespace Foo {}`** — it breaks ESM tree-shaking and Node's native TS runner.

### Effect Patterns

- `Effect.gen(function* () { ... })` for composition
- `Effect.fn("Domain.method")` for named/traced effects; `Effect.fnUntraced` for internal helpers
- `Effect.void` instead of `Effect.succeed(undefined)` or `Effect.succeed(void 0)`
- `Effect.callback` for callback-based APIs
- `DateTime.nowAsDate` over `new Date(yield* Clock.currentTimeMillis)`
- `Effect.cached` for deduplicating concurrent in-flight computations (not manual `Fiber | undefined`)
- Prefer `Schema.Class` for multi-field data, `Schema.brand` for single-value types
- Prefer `Schema.TaggedErrorClass` for typed errors
- `yield* new MyError(...)` over `yield* Effect.fail(new MyError(...))`
- `Schema.Defect` instead of `unknown` for defect-like causes
- In `Effect.gen`, bind services to named variables before calling methods — no nested `yield* (yield* Foo.Service).bar()`
- Use `Effect.forkIn(scope)` (not `Effect.fork` / `Effect.forkDaemon` — they don't exist in v4 beta)
- Avoid `try`/`catch` — prefer Effect error channels

### Platform-specific Imports

Uses Bun's `"imports"` in `package.json` for platform-specific modules:

```json
"#sqlite": { "bun": "./src/database/sqlite.bun.ts", "node": "./src/database/sqlite.node.ts", ... }
```

Consumer: `import * as sqlite from "#sqlite"`. The `--conditions=browser` flag picks the `bun` condition.

### Config Modules

In `packages/core/src/config/`, new config modules follow the self-export pattern at the top: `export * as ConfigAgent from "./agent"`.

### Schema Conventions

- **No `Schema.mutable()`** in public contracts — readonly by default
- **No `Schema.Any`** — use `Schema.Json` or `Schema.Unknown`
- **Use `Schema.Literals(...)`** for closed string sets
- **IDs** expose `create()`. Directional constructors (`ascending()`, `descending()`) only where ordering semantics are part of the public contract.
- **Use `optional()` helper** from `schema.ts` for optional fields (omits undefined keys on encode)
- **Use `statics(...)`** combinator for adding static methods to schemas
- **Exported schemas get stable, domain-qualified identifiers**: `Model.Ref`, `Agent.Color`
- **Avoid `V2` suffix** on normalized contracts — only legacy V1 code uses `V1` suffix
- **Project root barrel** (`schema/src/index.ts`) exports canonical current contracts only

### Testing Patterns

**Test runner**: Bun test (`bun:test`). Tests run from the package directory.

**Effect tests**: Use `testEffect(layer)` from `test/lib/effect.ts`:

```ts
import { describe, expect } from "bun:test"
import { testEffect } from "../lib/effect"

const it = testEffect(Layer.mergeAll(MyService.defaultLayer))

describe("my service", () => {
  it.instance("does the thing", () =>
    Effect.gen(function* () {
      const svc = yield* MyService.Service
      expect(yield* svc.run()).toEqual("ok")
    }),
  )
})
```

Three runner modes:
- `it.effect(...)` — `TestClock` + `TestConsole` (simulated time)
- `it.live(...)` — real time, filesystem, git, child processes (most integration tests)
- `it.instance(...)` — live + scoped temp directory + instance context

**Fixture helpers** (from `packages/igris/test/fixture/fixture.ts`):
- `tmpdir({ git?, config?, init?, dispose? })` — async disposer-based temp dir
- `tmpdirScoped(options?)` — Effect scoped temp directory
- `provideInstance(dir)(effect)` — run effect with InstanceRef for `dir`
- `provideTmpdirInstance(effect, options?)` — create temp dir + bind instance
- `provideTmpdirServer(effect, options?)` — same + test LLM server

**Key anti-patterns to avoid**:
- Never use `Effect.sleep(N)` to wait for concurrent work — use `pollWithTimeout`, `llm.wait(N)`, `SessionStatus.Service.get(sessionID)`, `Deferred.await`, or bus subscriptions.
- Avoid mocks — prefer `Layer.mock(Service, { method: () => Effect.fail(...) })` for stubs over hand-rolled layers.

**Test guard**: Root test command exits with error — always run from package directories.

### Style Guide

- **No `else`**: prefer early returns
- **No import aliases**: don't use `import { foo as bar }`
- **No star imports**: use namespace imports by name, e.g., `import { Project } from "..."`, then `Project.ID`
- **Prefer `const`** over `let`, ternaries over reassignment
- **Prefer functional array methods** (`flatMap`, `filter`, `map`) over for loops
- **Inline single-use values** — don't extract to intermediate variable if used once
- **Prefer dynamic imports** for heavy modules in startup-sensitive code
- **No `any` type**
- **Keep things in one function** unless composable or reusable — don't extract single-use helpers
- **Prettier**: `semi: false`, `printWidth: 120` (configured in root `package.json`)

---

## Key Packages & Conventions

### `@igris-ai/llm` (Native LLM Runtime)

Located in `packages/llm/`. Has its own extensive AGENTS.md guide.

Key architecture: **Four-axis route decomposition** — Protocol (semantic API contract), Endpoint (URL construction), Auth (per-request transport auth), Framing (bytes → frames). This allows providers like DeepSeek, TogetherAI, etc. to reuse `OpenAIChat.protocol` verbatim with only 5-15 lines of configuration.

Important patterns:
- Constructors live on the type: `Message.user(...)`, `Model.make(...)`, `ToolChoice.named(...)`, etc.
- `LLM.request(...)` builds a request; `LLMClient.stream/generate` executes it
- `ProviderShared` exports small reusable protocol helpers (`joinText`, `parseToolInput`, `parseJson`, `eventError`, `validateWith`, `matchToolChoice`)
- Prefer `HttpClient` over `fetch`, `Stream` over ad-hoc async generators
- Use `Schema.fromJsonString(...)` over `JSON.parse` + `Effect.try`

### `@igris-ai/codemode`

Confined execution over explicit schema-described tools. Applications own authorization, persistence, and delivery semantics. Code Mode is unaware of sessions, channels, or conversation models.

### Server HTTP API (`@igris-ai/server`)

Uses Effect `HttpApiBuilder.group(...)` for typed endpoints. For SSE streams, return `HttpServerResponse.stream(...)` from handlers. Use `handleRaw(...)` only for endpoints needing raw request/response (WebSocket upgrade). Avoid `Effect.provide(SomeLayer)` inside handlers — provide stable layers once at the assembly boundary. Domain errors should be translated to declared API error schemas at handler boundaries.

### Effect Runtime Services

- **`makeRuntime`** (from `packages/igris/src/effect/run-service.ts`) — returns `{ runPromise, runFork, runCallback }` backed by a shared `memoMap`
- **`InstanceState`** (from `packages/igris/src/effect/instance-state.ts`) — per-directory state with `ScopedCache`, auto-cleaned on disposal
- **`AppNodeBuilder.build(...)`** — assembles app-level Effect layers
- **`LayerNode.group(...)`** — groups service layers for bootstrap
- **`EffectBridge`** — bridges native/callback APIs into Effect services with instance context
- **`Layer.mock`** — for partial service stubs in tests

---

## Gotchas

1. **Effect v4 beta API differences**: `Effect.fork` and `Effect.forkDaemon` don't exist — use `Effect.forkIn(scope)`. Check `specs/effect/migration.md` for a pattern reference.
2. **`Effect.runPromise` is the only escape**: All Effect code must be run via `Effect.runPromise` (or `runFork`/`runCallback` from `makeRuntime`).
3. **`tsgo` not `tsc`**: Always use `bun typecheck` from a package directory. The project uses `@typescript/native-preview` (tsgo) instead of `tsc`.
4. **Turbo caching**: `node_modules/.cache/turbo` is cached in CI and respects `turbo.json` task definitions.
5. **Minimum release age**: `bunfig.toml` sets `minimumReleaseAge = 259200` (3 days) for installs, with an allowlist for core packages.
6. **Patched dependencies**: Several packages have patches in `patches/` — `effect`, `solid-js`, `@ai-sdk/google`, `@modelcontextprotocol/sdk`, etc.
7. **V2 naming cleanup**: Don't preserve `V2` as a permanent name — remove it from namespaces/brands/identifiers as contracts are normalized. `V1` is temporary legacy.
8. **No barrel imports in multi-sibling dirs**: Each sibling file exports itself; do not create an intermediate `index.ts` barrel.
9. **Root test guard**: `bun test` at root exits with code 1 — tests only run from package directories.

---

## Reference Documents

- `CONTEXT.md` — Complete session runtime vocabulary and architecture
- `CONTRIBUTING.md` — Contribution guidelines, local dev setup, building executables
- `SPECS/` — Design specs for project, TUI, storage, v2 architecture
- `packages/*/AGENTS.md` — Per-package detailed guides (read the relevant one for deeper context)

---

## SDK & Code Generation

- **Legacy JS SDK**: `./packages/sdk/js/script/build.ts`
- **Client codegen**: After changing public Protocol or HttpApi, run `bun run generate` from `packages/client`. Never edit `src/generated` or `src/generated-effect` directly.
- **OpenAPI spec**: `packages/sdk/openapi.json`
- **SDK Next** (`@igris-ai/sdk-next`): composes Client + Core + Server for in-process use
- **GitHub Action**: `./github/` directory — standalone action shipped separately (separate `package.json`, `tsconfig.json`)

## Infrastructure

- **SST (Ion)**: Infrastructure-as-code via `sst.config.ts`. Deployments through `sst deploy`.
- **Nix**: `flake.nix` / `flake.lock` for Nix-based builds (desktop, dev shells)
- **Containers**: `packages/containers/` for Docker images
- **CI**: GitHub Actions workflows in `.github/workflows/` — test (linux+windows), typecheck, generate, deploy, publish, nix eval

## Key Environment Variables

- `CI` — disables some behaviors in CI
- `IGRIS_DISABLE_SHARE` — disables share functionality
- `GITHUB_ACTIONS=false` — passed to `bun turbo test` to avoid GitHub-specific behavior
- `RECORD=true` — enables live provider calls in LLM tests
- `IGRIS_EXPERIMENTAL=true` / `IGRIS_EXPERIMENTAL_NATIVE_LLM=true` — opt-in native LLM runtime

---

## `/init` Command

The **`/init`** slash command creates or updates `AGENTS.md` by scanning the repo and extracting high-signal facts for AI assistants.

### How it works

1. Type `/init` in any session — the LLM reads configs, CI, docs, and representative source files
2. Extracts commands, architecture, conventions, and quirks
3. Creates or improves `AGENTS.md` at the project root

**Template**: `packages/igris/src/command/template/initialize.txt`  
**Registration**: `packages/igris/src/command/index.ts:70-78`  
**HTTP API**: `POST /session/:sessionID/init`  
**Project tracking**: stamps `time_initialized` on the project row when run

### Output file

`AGENTS.md` is **gitignored** (added to `.gitignore` automatically) — it's a generated per-worktree file. Regenerate anytime the repo structure changes significantly.

### Graphify integration

During `/init`, the LLM checks if [Graphify](https://graphify.net/) (a codebase knowledge graph tool, install via `pip install graphifyy`) is set up. If not, it will ask if you want to configure it. The `.graphify/` directory is gitignored.

---

## Skill Auto-Suggestion

Every user message is automatically checked against installed skills via deterministic code (not LLM instructions). If a skill matches your request, a system hint is injected before the LLM processes it.

### How it works

1. Your message is tokenized (lowercased, stop words removed)
2. Keywords are matched against skill names and descriptions
3. If a match is found (≥2 keyword overlap), a `[system] Skill suggestion` hint is prepended
4. The LLM sees the suggestion and can load the skill via the `skill` tool

### Control

- **Enabled by default** — runs for every message, zero overhead if no match
- **Disable per-request** by passing `skillSuggest: false` in the prompt API
- **Source**: `packages/igris/src/skill/suggest.ts` (matching logic) and `packages/igris/src/session/prompt.ts` (pipeline injection)

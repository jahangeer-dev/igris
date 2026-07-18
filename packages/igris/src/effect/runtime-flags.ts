import { Config, ConfigProvider, Context, Effect, Layer, Option } from "effect"
import { ConfigService } from "@/effect/config-service"

const bool = (name: string) => Config.boolean(name).pipe(Config.withDefault(false))
const positiveInteger = (name: string) =>
  Config.number(name).pipe(
    Config.map((value) => (Number.isInteger(value) && value > 0 ? value : undefined)),
    Config.orElse(() => Config.succeed(undefined)),
  )
const experimental = bool("IGRIS_EXPERIMENTAL")
const enabledByExperimental = (name: string) =>
  Config.all({ experimental, enabled: Config.boolean(name).pipe(Config.option) }).pipe(
    Config.map((flags) => Option.getOrElse(flags.enabled, () => flags.experimental)),
  )

export class Service extends ConfigService.Service<Service>()("@igris/RuntimeFlags", {
  autoShare: bool("IGRIS_AUTO_SHARE"),
  pure: bool("IGRIS_PURE"),
  disableDefaultPlugins: bool("IGRIS_DISABLE_DEFAULT_PLUGINS"),
  disableEmbeddedWebUi: bool("IGRIS_DISABLE_EMBEDDED_WEB_UI"),
  disableExternalSkills: bool("IGRIS_DISABLE_EXTERNAL_SKILLS"),
  disableLspDownload: bool("IGRIS_DISABLE_LSP_DOWNLOAD"),
  disableClaudeCodePrompt: Config.all({
    broad: bool("IGRIS_DISABLE_CLAUDE_CODE"),
    direct: bool("IGRIS_DISABLE_CLAUDE_CODE_PROMPT"),
  }).pipe(Config.map((flags) => flags.broad || flags.direct)),
  disableClaudeCodeSkills: Config.all({
    broad: bool("IGRIS_DISABLE_CLAUDE_CODE"),
    direct: bool("IGRIS_DISABLE_CLAUDE_CODE_SKILLS"),
  }).pipe(Config.map((flags) => flags.broad || flags.direct)),
  enableExa: Config.all({
    experimental,
    enabled: bool("IGRIS_ENABLE_EXA"),
    legacy: bool("IGRIS_EXPERIMENTAL_EXA"),
  }).pipe(Config.map((flags) => flags.experimental || flags.enabled || flags.legacy)),
  enableParallel: Config.all({
    enabled: bool("IGRIS_ENABLE_PARALLEL"),
    legacy: bool("IGRIS_EXPERIMENTAL_PARALLEL"),
  }).pipe(Config.map((flags) => flags.enabled || flags.legacy)),
  enableExperimentalModels: bool("IGRIS_ENABLE_EXPERIMENTAL_MODELS"),
  enableQuestionTool: bool("IGRIS_ENABLE_QUESTION_TOOL"),
  experimentalReferences: enabledByExperimental("IGRIS_EXPERIMENTAL_REFERENCES"),
  experimentalBackgroundSubagents: enabledByExperimental("IGRIS_EXPERIMENTAL_BACKGROUND_SUBAGENTS"),
  experimentalLspTy: bool("IGRIS_EXPERIMENTAL_LSP_TY"),
  experimentalLspTool: enabledByExperimental("IGRIS_EXPERIMENTAL_LSP_TOOL"),
  experimentalOxfmt: enabledByExperimental("IGRIS_EXPERIMENTAL_OXFMT"),
  experimentalPlanMode: enabledByExperimental("IGRIS_EXPERIMENTAL_PLAN_MODE"),
  experimentalCodeMode: enabledByExperimental("IGRIS_EXPERIMENTAL_CODE_MODE"),
  experimentalEventSystem: enabledByExperimental("IGRIS_EXPERIMENTAL_EVENT_SYSTEM"),
  experimentalWorkspaces: enabledByExperimental("IGRIS_EXPERIMENTAL_WORKSPACES"),
  experimentalIconDiscovery: enabledByExperimental("IGRIS_EXPERIMENTAL_ICON_DISCOVERY"),
  outputTokenMax: positiveInteger("IGRIS_EXPERIMENTAL_OUTPUT_TOKEN_MAX"),
  bashDefaultTimeoutMs: positiveInteger("IGRIS_EXPERIMENTAL_BASH_DEFAULT_TIMEOUT_MS"),
  experimentalNativeLlm: bool("IGRIS_EXPERIMENTAL_NATIVE_LLM"),
  experimentalWebSockets: bool("IGRIS_EXPERIMENTAL_WEBSOCKETS"),
  client: Config.string("IGRIS_CLIENT").pipe(Config.withDefault("cli")),
}) {}

export type Info = Context.Service.Shape<typeof Service>

const emptyConfigLayer = Service.layer.pipe(
  Layer.provide(ConfigProvider.layer(ConfigProvider.fromUnknown({}))),
  Layer.orDie,
)

export const layer = (overrides: Partial<Info> = {}) =>
  Layer.effect(
    Service,
    Effect.gen(function* () {
      const flags = yield* Service
      return Service.of({ ...flags, ...overrides })
    }),
  ).pipe(Layer.provide(emptyConfigLayer))

export const node = LayerNode.make({ service: Service, layer: Service.layer.pipe(Layer.orDie), deps: [] })

export * as RuntimeFlags from "./runtime-flags"
import { LayerNode } from "@igris-ai/core/effect/layer-node"

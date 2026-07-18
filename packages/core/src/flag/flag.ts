import { Config } from "effect"

export function truthy(key: string) {
  const value = process.env[key]?.toLowerCase()
  return value === "true" || value === "1"
}

const copy = process.env["IGRIS_EXPERIMENTAL_DISABLE_COPY_ON_SELECT"]
const fff = process.env["IGRIS_DISABLE_FFF"]

function enabledByExperimental(key: string) {
  return process.env[key] === undefined ? truthy("IGRIS_EXPERIMENTAL") : truthy(key)
}

export const Flag = {
  OTEL_EXPORTER_OTLP_ENDPOINT: process.env["OTEL_EXPORTER_OTLP_ENDPOINT"],
  OTEL_EXPORTER_OTLP_HEADERS: process.env["OTEL_EXPORTER_OTLP_HEADERS"],

  IGRIS_AUTO_HEAP_SNAPSHOT: truthy("IGRIS_AUTO_HEAP_SNAPSHOT"),
  IGRIS_GIT_BASH_PATH: process.env["IGRIS_GIT_BASH_PATH"],
  IGRIS_CONFIG: process.env["IGRIS_CONFIG"],
  IGRIS_CONFIG_CONTENT: process.env["IGRIS_CONFIG_CONTENT"],
  IGRIS_DISABLE_AUTOUPDATE: truthy("IGRIS_DISABLE_AUTOUPDATE"),
  IGRIS_ALWAYS_NOTIFY_UPDATE: truthy("IGRIS_ALWAYS_NOTIFY_UPDATE"),
  IGRIS_DISABLE_PRUNE: truthy("IGRIS_DISABLE_PRUNE"),
  IGRIS_DISABLE_TERMINAL_TITLE: truthy("IGRIS_DISABLE_TERMINAL_TITLE"),
  IGRIS_SHOW_TTFD: truthy("IGRIS_SHOW_TTFD"),
  IGRIS_DISABLE_AUTOCOMPACT: truthy("IGRIS_DISABLE_AUTOCOMPACT"),
  IGRIS_DISABLE_MODELS_FETCH: truthy("IGRIS_DISABLE_MODELS_FETCH"),
  IGRIS_DISABLE_MOUSE: truthy("IGRIS_DISABLE_MOUSE"),
  IGRIS_FAKE_VCS: process.env["IGRIS_FAKE_VCS"],
  IGRIS_SERVER_PASSWORD: process.env["IGRIS_SERVER_PASSWORD"],
  IGRIS_SERVER_USERNAME: process.env["IGRIS_SERVER_USERNAME"],
  IGRIS_DISABLE_FFF: fff === undefined ? process.platform === "win32" : truthy("IGRIS_DISABLE_FFF"),

  // Experimental
  IGRIS_EXPERIMENTAL_FILEWATCHER: Config.boolean("IGRIS_EXPERIMENTAL_FILEWATCHER").pipe(
    Config.withDefault(false),
  ),
  IGRIS_EXPERIMENTAL_DISABLE_FILEWATCHER: Config.boolean("IGRIS_EXPERIMENTAL_DISABLE_FILEWATCHER").pipe(
    Config.withDefault(false),
  ),
  IGRIS_EXPERIMENTAL_DISABLE_COPY_ON_SELECT:
    copy === undefined ? process.platform === "win32" : truthy("IGRIS_EXPERIMENTAL_DISABLE_COPY_ON_SELECT"),
  IGRIS_MODELS_URL: process.env["IGRIS_MODELS_URL"],
  IGRIS_MODELS_PATH: process.env["IGRIS_MODELS_PATH"],
  IGRIS_DB: process.env["IGRIS_DB"],

  IGRIS_WORKSPACE_ID: process.env["IGRIS_WORKSPACE_ID"],
  IGRIS_EXPERIMENTAL_WORKSPACES: enabledByExperimental("IGRIS_EXPERIMENTAL_WORKSPACES"),

  // Evaluated at access time (not module load) because tests, the CLI, and
  // external tooling set these env vars at runtime.
  get IGRIS_DISABLE_PROJECT_CONFIG() {
    return truthy("IGRIS_DISABLE_PROJECT_CONFIG")
  },
  get IGRIS_EXPERIMENTAL_REFERENCES() {
    return enabledByExperimental("IGRIS_EXPERIMENTAL_REFERENCES")
  },
  get IGRIS_TUI_CONFIG() {
    return process.env["IGRIS_TUI_CONFIG"]
  },
  get IGRIS_CONFIG_DIR() {
    return process.env["IGRIS_CONFIG_DIR"]
  },
  get IGRIS_PURE() {
    return truthy("IGRIS_PURE")
  },
  get IGRIS_PERMISSION() {
    return process.env["IGRIS_PERMISSION"]
  },
  get IGRIS_PLUGIN_META_FILE() {
    return process.env["IGRIS_PLUGIN_META_FILE"]
  },
  get IGRIS_CLIENT() {
    return process.env["IGRIS_CLIENT"] ?? "cli"
  },
}

import path from "path"

process.env.IGRIS_DB = ":memory:"
process.env.IGRIS_MODELS_PATH = path.join(import.meta.dir, "plugin", "fixtures", "models-dev.json")
process.env.IGRIS_DISABLE_MODELS_FETCH = "true"

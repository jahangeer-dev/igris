interface ImportMetaEnv {
  readonly IGRIS_CHANNEL: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

declare module "virtual:igris-server" {
  export namespace Server {
    export const listen: typeof import("../../../igris/dist/types/src/node").Server.listen
    export type Listener = import("../../../igris/dist/types/src/node").Server.Listener
  }
  export namespace Config {
    export const get: typeof import("../../../igris/dist/types/src/node").Config.get
    export type Info = import("../../../igris/dist/types/src/node").Config.Info
  }
  export const bootstrap: typeof import("../../../igris/dist/types/src/node").bootstrap
}

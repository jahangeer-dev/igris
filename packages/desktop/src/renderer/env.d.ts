import type { ElectronAPI } from "../preload/types"

declare global {
  interface Window {
    api: ElectronAPI
    __IGRIS__?: {
      deepLinks?: string[]
    }
  }
}

import { createStore } from "solid-js/store"
import { useArgs } from "./args"
import { createSimpleContext } from "./helper"

export type PermissionMode = "auto" | "normal"

export const { use: usePermission, provider: PermissionProvider } = createSimpleContext({
  name: "Permission",
  init: () => {
    const args = useArgs()
    const [store, setStore] = createStore<{ mode: PermissionMode; skillSuggest: boolean }>({
      mode: args.auto ? "auto" : "normal",
      skillSuggest: true,
    })
    return {
      get mode() {
        return store.mode
      },
      set(mode: PermissionMode) {
        setStore("mode", mode)
      },
      toggle() {
        setStore("mode", (mode) => (mode === "auto" ? "normal" : "auto"))
      },
      get skillSuggest() {
        return store.skillSuggest
      },
      toggleSkillSuggest() {
        setStore("skillSuggest", (v) => !v)
      },
    }
  },
})

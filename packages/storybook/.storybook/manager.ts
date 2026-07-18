import { addons, types } from "storybook/manager-api"
import { ThemeTool } from "./theme-tool"

addons.register("igris/theme-toggle", () => {
  addons.add("igris/theme-toggle/tool", {
    type: types.TOOL,
    title: "Theme",
    match: ({ viewMode }) => viewMode === "story" || viewMode === "docs",
    render: ThemeTool,
  })
})

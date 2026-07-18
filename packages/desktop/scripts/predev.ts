import { $ } from "bun"

await $`bun ./scripts/copy-icons.ts ${process.env.IGRIS_CHANNEL ?? "dev"}`

await $`cd ../igris && bun script/build-node.ts`

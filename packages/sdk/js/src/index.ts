export * from "./client.js"
export * from "./server.js"

import { createIgrisClient } from "./client.js"
import { createIgrisServer } from "./server.js"
import type { ServerOptions } from "./server.js"

export async function createIgris(options?: ServerOptions) {
  const server = await createIgrisServer({
    ...options,
  })

  const client = createIgrisClient({
    baseUrl: server.url,
  })

  return {
    client,
    server,
  }
}

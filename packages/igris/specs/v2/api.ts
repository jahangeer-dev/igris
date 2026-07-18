// @ts-nocheck

import { OpenCode } from "@igris-ai/core"
import { ReadTool } from "@igris-ai/core/tools"

const igris = OpenCode.make({})

igris.tool.add(ReadTool)

igris.tool.add({
  name: "bash",
  schema: {
    type: "object",
    properties: {
      command: {
        type: "string",
        description: "The command to run.",
      },
    },
    required: ["command"],
  },
  execute(input, ctx) {},
})

igris.auth.add({
  provider: "openai",
  type: "api",
  value: process.env.OPENAI_API_KEY,
})

igris.agent.add({
  name: "build",
  permissions: [],
  model: {
    id: "gpt-5-5",
    provider: "openai",
    variant: "xhigh",
  },
})

const sessionID = await igris.session.create({
  agent: "build",
})

igris.subscribe((event) => {
  console.log(event)
})

await igris.session.prompt({
  sessionID,
  text: "hey what is up",
})

await igris.session.prompt({
  sessionID,
  text: "what is up with this",
  files: [
    {
      mime: "image/png",
      uri: "data:image/png;base64,xxxx",
    },
  ],
})

await igris.session.wait()

console.log(await igris.session.messages(sessionID))

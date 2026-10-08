import type { Context } from "@opencode/plugin/promise/plugin"
import type { OpenAIAuth } from "./types"

export async function loadOpenAIAuth(integration: Pick<Context["integration"], "connection">): Promise<OpenAIAuth> {
  const connection = await integration.connection.active("openai")
  const credential = connection ? await integration.connection.resolve(connection) : undefined
  if (
    credential?.type !== "oauth" ||
    (credential.methodID !== "chatgpt-browser" && credential.methodID !== "chatgpt-headless")
  ) {
    throw new Error("Select an OpenAI Codex browser or device-code subscription connection in OpenCode.")
  }

  const accountID = credential.metadata?.accountID
  return {
    type: "oauth",
    access: credential.access,
    ...(typeof accountID === "string" ? { accountId: accountID } : {}),
  }
}

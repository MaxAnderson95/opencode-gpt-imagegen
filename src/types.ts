// Only the resolved access token and account ID leave OpenCode's credential service.
export type OpenAIAuth = { type: "oauth"; access: string; accountId?: string }

export type GenerateArgs = {
  prompt: string
  out: string
  quality: "low" | "medium" | "high" | "auto"
  size?: string
  images?: string[]
}

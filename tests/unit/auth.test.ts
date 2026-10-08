import { describe, expect, mock, test } from "bun:test"
import type { Context } from "@opencode/plugin/promise/plugin"
import { loadOpenAIAuth } from "../../src/auth"

function integration(credential: unknown, connected = true) {
  const active = mock(async () => (connected ? { type: "credential", id: "test" } : undefined))
  const resolve = mock(async () => credential)
  return {
    active,
    resolve,
    domain: { connection: { active, resolve } } as unknown as Pick<Context["integration"], "connection">,
  }
}

describe("loadOpenAIAuth", () => {
  test("resolves the active Codex connection and its account metadata", async () => {
    const value = integration({
      type: "oauth",
      methodID: "chatgpt-browser",
      access: "resolved-token",
      metadata: { accountID: "account-1" },
    })
    expect(await loadOpenAIAuth(value.domain)).toEqual({
      type: "oauth",
      access: "resolved-token",
      accountId: "account-1",
    })
    expect(value.active).toHaveBeenCalledWith("openai")
    expect(value.resolve).toHaveBeenCalledWith({ type: "credential", id: "test" })
  })

  test("supports Codex device-code credentials without account metadata", async () => {
    const value = integration({ type: "oauth", methodID: "chatgpt-headless", access: "device-token" })
    expect(await loadOpenAIAuth(value.domain)).toEqual({ type: "oauth", access: "device-token" })
  })

  test("resolves credentials again for every call rather than caching a token", async () => {
    const value = integration({ type: "oauth", methodID: "chatgpt-browser", access: "first" })
    expect((await loadOpenAIAuth(value.domain)).access).toBe("first")
    value.resolve.mockImplementation(async () => ({ type: "oauth", methodID: "chatgpt-browser", access: "second" }))
    expect((await loadOpenAIAuth(value.domain)).access).toBe("second")
  })

  test("rejects missing connections without resolving one", async () => {
    const value = integration(undefined, false)
    expect(loadOpenAIAuth(value.domain)).rejects.toThrow("Select an OpenAI Codex")
    expect(value.resolve).not.toHaveBeenCalled()
  })

  test.each([
    undefined,
    { type: "key", key: "api-key" },
    { type: "oauth", methodID: "chatgpt-token-sharing", access: "sharing-token" },
  ])("rejects credentials that cannot use the Codex endpoint: %j", async (credential) => {
    expect(loadOpenAIAuth(integration(credential).domain)).rejects.toThrow("Select an OpenAI Codex")
  })

  test("preserves credential refresh failures", async () => {
    const value = integration(undefined)
    value.resolve.mockImplementation(async () => {
      throw new Error("Reconnect your account")
    })
    expect(loadOpenAIAuth(value.domain)).rejects.toThrow("Reconnect your account")
  })
})

import { afterEach, beforeEach, describe, expect, mock, test } from "bun:test"
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises"
import os from "node:os"
import path from "node:path"
import type { Context } from "@opencode/plugin/promise/plugin"
import type { Info, ToolContext, ToolEditor } from "@opencode/plugin/promise/tool"
import plugin from "../../src/index"
import { PNG_BASE64, PNG_BUFFER } from "./fixtures"

const originalFetch = globalThis.fetch
let directory: string

beforeEach(async () => {
  directory = await mkdtemp(path.join(os.tmpdir(), "imagegen-plugin-"))
})

afterEach(async () => {
  globalThis.fetch = originalFetch
  await rm(directory, { recursive: true, force: true })
})

async function register(credential: unknown) {
  let registered: Info | undefined
  const getSession = mock(async () => ({ location: { directory } }))
  const ctx = {
    location: { directory: "/different/plugin/location" },
    session: { get: getSession },
    integration: {
      connection: {
        active: async () => ({ type: "credential", id: "test" }),
        resolve: async () => credential,
      },
    },
    tool: {
      transform: async (transform: (editor: ToolEditor) => void) => {
        transform({
          add: (tool: Info) => {
            registered = tool
          },
        } as ToolEditor)
      },
    },
  } as unknown as Context
  await plugin.setup(ctx)
  if (!registered) throw new Error("Plugin did not register its tool")
  return { tool: registered, getSession }
}

function call(signal = new AbortController().signal) {
  return { sessionID: "test-session", signal } as ToolContext
}

function imageResponse() {
  return new Response(
    `data: ${JSON.stringify({
      type: "response.output_item.done",
      item: { type: "image_generation_call", result: PNG_BASE64 },
    })}\n\n`,
  )
}

describe("V2 plugin", () => {
  test("registers a tool that saves a PNG in the session directory and accepts references", async () => {
    const { tool, getSession } = await register({
      type: "oauth",
      methodID: "chatgpt-browser",
      access: "token",
      metadata: { accountID: "account" },
    })
    await writeFile(path.join(directory, "reference.png"), PNG_BUFFER)
    const fetchMock = mock(async (_url: string, _init: RequestInit) => imageResponse())
    globalThis.fetch = fetchMock as unknown as typeof fetch

    expect(plugin.id).toBe("opencode-gpt-imagegen")
    expect("server" in plugin).toBe(false)
    expect(tool.name).toBe("gpt_imagegen")
    expect(tool.options?.codemode).toBe(false)
    const result = await tool.execute(
      {
        prompt: "Image 1: a reference",
        out: "result.png",
        quality: "low",
        images: ["reference.png"],
      },
      call(),
    )
    const saved = path.join(directory, "result.png")
    expect(await readFile(saved)).toEqual(PNG_BUFFER)
    expect(result.content).toBe(`Generated image saved to ${saved}.`)
    expect(result.metadata).toEqual({ out: saved, versioned: false, billing: "subscription" })
    expect(getSession).toHaveBeenCalledWith({ sessionID: "test-session" })
    const [, init] = fetchMock.mock.calls[0]
    expect(JSON.parse(init.body as string).input[0].content[1].image_url).toBe(`data:image/png;base64,${PNG_BASE64}`)
  })

  test("returns an actionable auth error without a network request", async () => {
    const { tool } = await register({ type: "key", key: "api-key" })
    const fetchMock = mock(async () => imageResponse())
    globalThis.fetch = fetchMock as unknown as typeof fetch
    const result = await tool.execute({ prompt: "cat", out: "cat.png", quality: "low" }, call())
    expect(result.content).toContain("Select an OpenAI Codex")
    expect(result.metadata?.error).toBe(true)
    expect(fetchMock).not.toHaveBeenCalled()
  })

  test("does not save a result after the tool call is cancelled", async () => {
    const { tool } = await register({ type: "oauth", methodID: "chatgpt-browser", access: "token" })
    const controller = new AbortController()
    globalThis.fetch = mock(async () => {
      controller.abort()
      return imageResponse()
    }) as unknown as typeof fetch
    expect(tool.execute({ prompt: "cat", out: "cat.png", quality: "low" }, call(controller.signal))).rejects.toThrow()
    expect(readFile(path.join(directory, "cat.png"))).rejects.toThrow()
  })
})

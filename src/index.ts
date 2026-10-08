import { Plugin } from "@opencode/plugin"
import { loadOpenAIAuth } from "./auth"
import { callViaCodexResponses } from "./codex"
import { readReferenceImages } from "./input-image"
import { saveGeneratedImage } from "./output-image"
import type { GenerateArgs } from "./types"

export default Plugin.define({
  id: "opencode-gpt-imagegen",
  async setup(ctx) {
    await ctx.tool.transform((tools) => {
      tools.add({
        name: "gpt_imagegen",
        description: [
          "Generate raster images using OpenAI's hosted image_generation tool through your ChatGPT subscription.",
          "Use for AI-created bitmap visuals such as photos, illustrations, textures, sprites, and mockups.",
          "Do not use when the task is better handled by editing existing SVG/vector/code-native assets, extending an established icon or logo system, or building the visual directly in HTML/CSS/canvas.",
          "Reference images may be attached through images; label each image's role inline in prompt, for example: 'Image 1: reference image'.",
          "For many distinct assets, invoke gpt_imagegen once per requested asset; each call returns one image.",
          "Requires an active OpenAI Codex OAuth connection. Returns the absolute path of the saved PNG.",
        ].join(" "),
        input: {
          type: "object",
          properties: {
            prompt: { type: "string", description: "Description of the image to generate." },
            out: {
              type: "string",
              description: "Output PNG path, relative to the session directory unless absolute.",
            },
            quality: {
              type: "string",
              enum: ["low", "medium", "high", "auto"],
              description: "Generation quality passed to the hosted image_generation tool.",
            },
            size: {
              type: "string",
              description:
                "Optional image size: auto or WIDTHxHEIGHT; dimensions must be multiples of 16px, max edge <= 3840px, aspect ratio <= 3:1, and total pixels between 655360 and 8294400. The backend may choose a different size.",
            },
            images: {
              type: "array",
              items: { type: "string" },
              description: "Optional reference image paths, relative to the session directory unless absolute.",
            },
          },
          required: ["prompt", "out", "quality"],
          additionalProperties: false,
        },
        options: { codemode: false },
        async execute(input, call) {
          const args = input as GenerateArgs
          try {
            const auth = await loadOpenAIAuth(ctx.integration)
            const session = await ctx.session.get({ sessionID: call.sessionID })
            const directory = session.location.directory
            const inputImageDataUrls = await readReferenceImages(args.images, directory)
            const base64 = await callViaCodexResponses(auth, args, inputImageDataUrls, call.signal)
            call.signal.throwIfAborted()
            const { savedPath, versioned, message } = await saveGeneratedImage(args.out, directory, base64)

            return {
              content: message,
              metadata: { out: savedPath, versioned, billing: "subscription" },
            }
          } catch (error) {
            call.signal.throwIfAborted()
            return {
              content: `Image generation failed: ${error instanceof Error ? error.message : String(error)}`,
              metadata: { error: true },
            }
          }
        },
      })
    })
  },
})

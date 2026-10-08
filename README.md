# opencode-gpt-imagegen for OpenCode 2

> [!WARNING]
> This project is a work in progress. It is still being built and is not ready for use.

Generate PNG images through your ChatGPT subscription with the `gpt_imagegen` tool. Reference images can guide new images or edits, and existing output files get a numbered filename instead of being overwritten.

This is Max Anderson's V2-only fork of [yuji-hatakeyama/opencode-gpt-imagegen](https://github.com/yuji-hatakeyama/opencode-gpt-imagegen). It targets OpenCode **2.0.24** and does not support OpenCode 1. The npm package named `opencode-gpt-imagegen` belongs to the upstream project; install this fork from GitHub.

## Installation

```sh
opencode plugin add 'github:MaxAnderson95/opencode-gpt-imagegen#main'
```

Or add the package to `~/.config/opencode/opencode.jsonc`:

```jsonc
{
  "$schema": "https://opencode.ai/config.json",
  "plugins": ["github:MaxAnderson95/opencode-gpt-imagegen#main"]
}
```

Update the installed Git revision with:

```sh
opencode plugin update 'github:MaxAnderson95/opencode-gpt-imagegen#main'
```

## Authentication

Select an existing OpenAI Codex browser or device-code OAuth account in OpenCode. The plugin resolves the active connection on every generation through OpenCode's credential service, which owns token refresh and account selection. It does not read `auth.json` or create its own credential files.

Generations use `https://chatgpt.com/backend-api/codex/responses`, with `gpt-6-sol` calling the hosted `image_generation` tool. This uses the selected ChatGPT subscription, with no API-key billing fallback. API keys and ChatGPT token-sharing connections are not supported by this Codex endpoint integration.

## Usage

Ask the agent to generate an image:

> Generate a watercolor fox in a pine forest. Use medium quality and 1024x1024. Save it as fox.png.

The tool takes:

| Argument | Required | Meaning |
| --- | --- | --- |
| `prompt` | Yes | Description of the image. Label reference roles as "Image 1", "Image 2", etc. |
| `out` | Yes | Output PNG path, relative to the session directory unless absolute. |
| `quality` | Yes | `low`, `medium`, `high`, or `auto`. |
| `size` | No | `auto` or `WIDTHxHEIGHT`. The backend may choose different dimensions. |
| `images` | No | Array of reference image paths, relative to the session directory unless absolute. |

Each call produces one image. If `fox.png` exists, the next output is `fox-v2.png`, then `fox-v3.png`, up to `-v999`. Concurrent writes to the same path can still race; version selection is not atomic. Interrupting the tool cancels its HTTP request.

## Development and tests

```sh
bun install --frozen-lockfile
bun run typecheck
bun run test
./node_modules/.bin/biome ci .
bun run bundle
```

The package ships TypeScript source for OpenCode's loader. `bun run bundle` also creates a bundled ESM file in `dist/` for inspection. The command is named `bundle` because npm's Git fetcher treats a `build` script as a reason to run dependency preparation even when the package ships runnable source.

The opt-in subscription suite generates three real images and tests generation, filename versioning, and reference images. It connects to an existing OpenCode 2 server, uses that server's active Codex account, and removes its temporary output directory afterward. Supply `OPENCODE_PASSWORD` through your existing credential loader if the server requires authentication:

```sh
OPENCODE_E2E_SERVER=http://127.0.0.1:4196 bun run test:e2e_subscription
```

Set `OPENCODE_E2E_PLUGIN=github:MaxAnderson95/opencode-gpt-imagegen#main` to test the installed GitHub package instead of the local checkout. Unit tests do not use subscription quota.

## Disclaimer

This unofficial plugin is not affiliated with OpenAI or OpenCode. Use must comply with OpenAI's [Terms of Use](https://openai.com/policies/row-terms-of-use/) and [Usage Policies](https://openai.com/policies/usage-policies/).

# Working on the V2 fork

This repository is MaxAnderson95's independent OpenCode 2 fork. Read CONTRIBUTING.md when proposing changes to the original upstream repository. Changes here target OpenCode 2 only.

## Runtime and packaging

- Use the repository's Bun toolchain and committed lockfile. Install with `bun install --frozen-lockfile`.
- Match `@opencode/plugin` to the target host release, currently 2.0.24. The package-age gate can reject a newly published matching SDK; use an explicit `bun install --minimum-release-age=0` only when updating that pinned SDK.
- The root `index.ts` is the conventional local-loader entrypoint and reexports `src/index.ts`. Package root and `./server` exports point there too. Git installs ship runnable source; they must not depend on lifecycle scripts building `dist/`.
- `src/index.ts` registers `gpt_imagegen` with the V2 Promise plugin API. The tool's input JSON Schema and `GenerateArgs` in `src/types.ts` must agree.
- `src/auth.ts` resolves OpenCode's active OpenAI connection on each call. Keep refresh tokens and persisted credentials inside OpenCode. Only Codex browser/device-code OAuth credentials may call the Codex endpoint; API-key and token-sharing routes are outside this fork's scope.
- Resolve image paths against the executing session's location, which can differ from the plugin instance's location. Pass the tool's cancellation signal to the HTTP request and check it before saving output.
- Preserve the upstream helper modules for reference-image detection, Codex SSE parsing, and numbered output paths. Output version selection is best-effort, not atomic.

## Verification

- Run `bun run typecheck`, `bun run test`, and the installed `./node_modules/.bin/biome ci .` before publication. `bun run bundle` checks the bundled ESM output. Keep that script named `bundle`: npm's Git fetcher runs dependency preparation for packages with a `build` script, even when their source already runs.
- Unit tests live in `tests/unit`; use `bun run test` instead of bare `bun test` so real image generation remains opt-in.
- `bun run test:e2e_subscription` connects to `OPENCODE_E2E_SERVER`, defaulting to the plugin-dev server at `http://127.0.0.1:4196`. It uses real subscription quota. Use `OPENCODE_E2E_PLUGIN` to test an installed package target; otherwise it tests this local checkout.
- The e2e suite allows only `gpt_imagegen` through project permissions and removes its temporary output directory. It verifies PNG output, auto-versioning, and reference-image input.
- Confirm an installed GitHub revision is active, then exercise the actual tool on the target server. Local tests alone do not prove installed behavior.

## Publication

Install this fork with `github:MaxAnderson95/opencode-gpt-imagegen#main`. The upstream npm package is separate. Existing npm-release automation belongs to the upstream workflow; use Git publication for this fork unless its owner explicitly requests an npm release.

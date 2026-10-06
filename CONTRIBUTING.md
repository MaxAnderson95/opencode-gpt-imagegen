# Contributing

This plugin is maintained by one person and aims to keep a small feature set.

## What to contribute

- Small bug fixes are welcome as pull requests. "Small" means roughly 10 lines changed in `src/`, not counting tests and docs.
- For features, refactors, behavior changes, and larger fixes, please open an [issue](https://github.com/yuji-hatakeyama/opencode-gpt-imagegen/issues/new) first and wait for agreement before writing code. Even if the code is already written, I may not be able to review or accept large changes.

## Before you open a pull request

- [MUST] `bun run typecheck` passes.
- [MUST] `bunx biome ci .` passes.
- [MUST] `bun run test` passes.

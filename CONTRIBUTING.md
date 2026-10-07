# Contributing

This plugin is maintained by one person and aims to keep a small feature set.

## What to contribute

- Small bug fixes are welcome as pull requests. "Small" means roughly 10 lines changed in `src/`, not counting tests and docs.
- For features, refactors, behavior changes, and larger fixes, please open an [issue](https://github.com/yuji-hatakeyama/opencode-gpt-imagegen/issues/new) first and wait for agreement before writing code. Even if the code is already written, I may not be able to review or accept large changes.

## Before you open a pull request

- [MUST] `bun run typecheck` passes.
- [MUST] `bunx biome ci .` passes.
- [MUST] `bun run test` passes.

## Commit messages and pull request titles

- Follow [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/), for example `fix: ...`, `feat: ...`, or `docs: ...`.
- Pull request titles become the entries of the release notes. Describe what changes for plugin users rather than how the code changes.
- If the change breaks existing usage, for example by removing or restricting a `gpt_imagegen` argument, add `!` after the type, for example `feat!: ...`.

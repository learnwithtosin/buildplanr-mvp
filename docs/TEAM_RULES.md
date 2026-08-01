# TEAM_RULES.md

- Never work directly on `main`.
- One GitHub Issue = one branch. Name it `feature/`, `bugfix/`, `docs/`, or `chore/` + a short description.
- Only modify files related to your Issue. Touching `packages/types`? Flag it in chat first — both teams depend on it.
- Do not install new packages without approval.
- Do not rename folders.
- Use TypeScript strict mode. No `any`.
- Run `npm run build` before committing.
- Open a Pull Request before merging — link your Issue, use the PR template.
- One approval required. Squash-merge.
- Ask before modifying another developer's work.
- Follow the shared types in `packages/types` — don't redefine types locally at an API boundary.
- Keep commits small and descriptive.
- Pull `main` into your branch daily if your Issue runs longer than a day.
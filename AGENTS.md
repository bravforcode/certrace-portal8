 Agent Guide

This file is the working guide for coding agents in this repository. Keep changes narrow, preserve existing behavior unless the task explicitly changes it, and verify claims against the current code. Some files in `plan/` and `docs/` describe migrations or historical states; use them for context, but treat the implementation, `package.json`, `prisma/schema.prisma`, and current tests as authoritative.

Before working on this project, read and follow `PROJECT.md` as the map of the current repository structure. If the structure in `PROJECT.md` differs from the code, verify the code and update `PROJECT.md` when your task changes that structure.


# Agent Rule

AGENTS.md — 13-rule template
These rules apply to every task in this project unless explicitly overridden.

Rule 1 — Think Before Coding
State assumptions explicitly. If uncertain, ask rather than guess. Present multiple interpretations when ambiguity exists. Push back when a simpler approach exists. Stop when confused. Name what's unclear.

Rule 2 — Simplicity First
Minimum code that solves the problem. Nothing speculative. No features beyond what was asked. No abstractions for single-use code. Test: would a senior engineer say this is overcomplicated? If yes, simplify.

Rule 3 — Surgical Changes
Touch only what you must. Clean up only your own mess. Don't "improve" adjacent code, comments, or formatting. Don't refactor what isn't broken. Match existing style.

Rule 4 — Goal-Driven Execution
Define success criteria. Loop until verified. Don't follow steps. Define success and iterate. Strong success criteria let you loop independently.

Rule 5 — Use the model only for judgment calls
Use me for: classification, drafting, summarization, extraction. Do NOT use me for: routing, retries, deterministic transforms. If code can answer, code answers.

Rule 6 — Follow the refactor guide
Before changing architecture, migrating an API, or refactoring business logic, read `refactor.md` and follow its design, validation, testing, and migration rules.

Rule 7 — Surface conflicts, don't average them
If two patterns contradict, pick one (more recent / more tested). Explain why. Flag the other for cleanup. Don't blend conflicting patterns.

Rule 8 — Read before you write
Before adding code, read exports, immediate callers, shared utilities. "Looks orthogonal" is dangerous. If unsure why code is structured a way, ask.

Rule 9 — Tests verify intent, not just behavior
Tests must encode WHY behavior matters, not just WHAT it does. A test that can't fail when business logic changes is wrong.

Rule 10 — Checkpoint after every significant step
Summarize what was done, what's verified, what's left. Don't continue from a state you can't describe back. If you lose track, stop and restate.

Rule 11 — Match the codebase's conventions, even if you disagree
Conformance > taste inside the codebase. If you genuinely think a convention is harmful, surface it. Don't fork silently.

Rule 12 — Fail loud
"Completed" is wrong if anything was skipped silently. "Tests pass" is wrong if any were skipped. Default to surfacing uncertainty, not hiding it.

Rule 13 — Commits
When asked to commit, use a short message like `feat: ...`, `add: ...`, `fix: ...`, `del: ...`, `docs: ...`, or `chore: ...`. Do not add a co-author.

# OpenWolf

Read `.wolf/OPENWOLF.md` for the project protocol. Before reading files consult
`.wolf/anatomy.md`; before code read `.wolf/cerebrum.md`.

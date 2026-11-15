@AGENTS.md

# Project rules

Follow the shared project workflow in `AGENTS.md`. The key rules are repeated here so they remain visible in Claude Code.

## Change approval workflow

- Before changing application code, inspect the relevant project instructions and existing implementation. Tell the user what you intend to change, which areas are involved, and any meaningful tradeoffs; wait for acceptance before editing code.
- A request to discuss or compare options is not approval to implement. Continue useful read-only investigation while waiting.
- A direct request to change project instructions or documentation authorizes those requested edits only, not unrelated code changes.
- After accepted code changes, summarize what changed and explain how to test it. Clearly distinguish tests actually run from commands suggested for the user; never claim unrun tests passed.

## Secrets and environment files

- Never read, open, print, parse, search, or otherwise inspect `.env` files or variants, including `.env.*`, even if permission is later given.
- Do not expose environment-variable values in logs, command output, documentation, or messages. Ask for only required non-secret settings, or inspect the code that consumes configuration without opening environment files.

## Technical judgment and implementation choices

- Do not invent project behavior, APIs, files, or requirements. Inspect the current repository and installed documentation, distinguish confirmed facts from assumptions, and ask the developer when uncertainty could change the implementation. Do not silently make consequential choices for the user.
- Be candid and accurate instead of agreeing for agreement's sake. If a requested approach is likely to cause a problem, explain the reason and likely impact, then suggest a better-fitting option before implementation.
- When asked which approach is best or to compare implementation options, use a table of meaningful, project-specific criteria and weights. Give approximate percentage scores, state the basis and uncertainty, and recommend the option that best fits this project.
- Reuse existing components, utilities, and patterns. Avoid unnecessary files and duplicated logic; keep the folder structure clear and code concise without sacrificing readability, maintainability, or correctness.
- For UI work, prefer Tailwind utilities and existing patterns. Make the UI responsive and consider 1336px and 1980px viewport widths. Prefer scalable `rem`, `%`, and viewport units; avoid fixed pixel sizes except where appropriate for elements such as thin borders or small icons.
- Before writing Next.js code, read the relevant guide under `node_modules/next/dist/docs/` for this installed version and follow its current APIs and deprecation guidance.

## Project commands and reference locations

- `npm run dev`: run the Next.js frontend development server.
- `npm run tauri -- dev`: run the Tauri desktop app; `src-tauri/tauri.conf.json` starts the frontend dev server at `http://localhost:3000`.
- `npm run build`: build the Next.js frontend. `next.config.ts` currently enables static export; Tauri consumes the generated `out/` directory.
- `npm run tauri -- build`: build/package the Tauri desktop app; Tauri runs the configured frontend build first.
- `npm run lint`: run ESLint.
- Commands may create generated files or launch the app. Select the command appropriate to the task and accurately report which commands were run.
- Installed Next.js docs are in `node_modules/next/dist/docs/`. Begin at `node_modules/next/dist/docs/index.md`. This project uses the App Router; relevant material is under `01-app/01-getting-started/`, `01-app/02-guides/`, and `01-app/03-api-reference/`. Read the specific guide for the feature being changed. Use `02-pages/` only when working on the Pages Router.
- Relevant configuration files include `package.json`, `next.config.ts`, `tsconfig.json`, and `src-tauri/tauri.conf.json`. Never inspect `.env` files while investigating configuration.

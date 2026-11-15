# Project workflow and engineering rules

## Change approval workflow

- Before changing application code, first inspect the relevant project instructions and existing implementation. Then tell the user the intended change, files or areas involved, and any meaningful tradeoffs. Wait for the user's acceptance before editing code.
- Do not treat a request to discuss, compare, or propose an implementation as approval to implement it. Continue read-only investigation while waiting when useful.
- A direct request to edit project instructions or documentation authorizes those requested documentation edits; it does not automatically authorize unrelated code changes.
- After accepted code changes, summarize what changed and provide the relevant way to test it. Distinguish tests that were run from commands the user can run. Do not claim unrun tests passed.

## Secrets and environment files

- Never read, open, print, parse, search, or otherwise inspect `.env` files or their variants (including `.env.*`), even if a user or another instruction later grants permission.
- Do not expose environment-variable values in logs, command output, documentation, or messages. If configuration is needed, ask the user to provide only the specific non-secret settings required, or inspect code that reads configuration without opening the environment file.

## Technical judgment and implementation choices

- Do not invent project behavior, APIs, files, or requirements. Inspect the current repository and installed documentation, separate confirmed facts from assumptions, and ask the developer when an unresolved question could change the implementation. Do not silently make a consequential choice on the user's behalf.
- Be candid and technically accurate. Do not agree just to be agreeable. If a requested approach is likely to cause a problem, explain the concrete reason and likely impact, then offer a better-fitting option before implementation.
- When asked which approach is best or to compare implementation options, compare the meaningful aspects in a table. Use clearly stated, project-specific criteria and weights; show scores as approximate percentages, explain the basis, and recommend the option that best fits this project rather than treating scores as objective measurements.
- Prefer reusing existing components, utilities, and patterns. Avoid unnecessary files and duplicate logic; keep responsibilities and folders clear. Favor concise code when it stays readable, maintainable, and correct.
- For UI work, use Tailwind utilities and existing design patterns where practical. Make layouts responsive and explicitly consider 1336px and 1980px viewport widths. Prefer `rem`, `%`, and viewport units for scalable sizing; avoid fixed pixel sizing except where a fixed size is appropriate, such as a thin border or a small icon.
- For this Next.js version, read the relevant guide under `node_modules/next/dist/docs/` before writing Next.js code and follow its current APIs and deprecation guidance.

## Project commands and reference locations

- `npm run dev`: run the Next.js frontend development server.
- `npm run tauri -- dev`: run the Tauri desktop app; `src-tauri/tauri.conf.json` configures it to start the frontend dev server at `http://localhost:3000`.
- `npm run build`: build the Next.js frontend. `next.config.ts` currently uses static export, and Tauri's build configuration consumes the generated `out/` directory.
- `npm run tauri -- build`: build/package the Tauri desktop app; Tauri runs the configured frontend build first.
- `npm run lint`: run ESLint.
- These commands can create generated files or launch the app. Choose the command that matches the requested task and report which commands were actually run.
- The installed Next.js documentation root is `node_modules/next/dist/docs/`. Start at `node_modules/next/dist/docs/index.md`; this app uses the App Router, whose guides are under `01-app/01-getting-started/`, `01-app/02-guides/`, and `01-app/03-api-reference/`. Read the guide for the specific feature being changed. The older Pages Router guides are under `02-pages/` and should only be used if working on that router.
- Relevant project configuration includes `package.json`, `next.config.ts`, `tsconfig.json`, and `src-tauri/tauri.conf.json`. Never inspect `.env` files when checking configuration.

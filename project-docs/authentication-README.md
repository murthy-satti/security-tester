# Authentication Testing

**Status: Not started**

The dashboard advertises tests for login behavior, credential handling, account protection, and authentication flows. No authentication route, frontend configuration, Tauri command, or Rust test exists yet.

## Planned flow

The intended pattern is to configure an authorized target login endpoint and request template, select checks, invoke a Tauri command, run controlled probes, and display structured results. Exact request formats and safe probe behavior still need to be designed.

## Related files

- `src/app/page.tsx`: dashboard card links to `/authentication`.
- `src/app/authentication/`: **not present**; planned UI route.
- `src/lib/tauri.ts`: currently contains only the password-policy command wrapper.
- `src-tauri/src/commands/`: currently contains only the password-policy command.
- `src-tauri/src/tests/`: currently contains only password-policy checks.

## Planned submodules

- Login behavior: **Not started**
- Credential handling: **Not started**
- Account protection: **Not started**
- Authentication flow checks: **Not started**

## Remaining work

- Define supported login request formats and configuration fields.
- Design low-impact checks for authentication behavior and account protection.
- Implement the page, typed command wrapper, Rust command, and individual checks.
- Define evidence, severity, inconclusive handling, and test-account cleanup expectations.

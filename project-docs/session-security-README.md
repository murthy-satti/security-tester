# Session Security Testing

**Status: Not started**

The dashboard describes checking session handling, lifecycle, cookie configuration, and expiration. No session-security route or checker is implemented.

## Planned flow

Configure an authorized login/session flow, capture relevant cookies or tokens safely, exercise lifecycle checks, and report cookie attributes and session behavior. The setup and secret handling model need to be designed.

## Related files

- `src/app/page.tsx`: dashboard card links to `/session-security`.
- `src/app/session-security/`: **not present**; planned UI route.
- `src/lib/tauri.ts`: current wrapper only exposes password policy.
- `src-tauri/src/commands/` and `src-tauri/src/tests/`: no session-security code exists.

## Planned submodules

- Session lifecycle and expiration: **Not started**
- Cookie configuration: **Not started**
- Related session controls: **Not started**

## Remaining work

- Specify supported authentication/session setup and safe credential storage.
- Define cookie, token, expiration, renewal, and logout checks.
- Implement the configuration UI, Rust command, checks, and evidence reporting.
- Ensure tokens and cookies are not exposed in logs or result summaries.

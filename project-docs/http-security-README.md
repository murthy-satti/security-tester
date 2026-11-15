# HTTP Security Testing

**Status: Not started**

The dashboard describes inspecting HTTP security headers, transport protection, and related controls. There is no HTTP-security page, command, or checker yet.

## Planned flow

Configure a target URL, fetch its HTTP response, inspect response status and headers, then report observed controls and missing or weak settings. This module may not need the request-body configuration used by password-policy tests.

## Related files

- `src/app/page.tsx`: dashboard card links to `/http-security`.
- `src/app/http-security/`: **not present**; planned UI route.
- `src/lib/tauri.ts`: current wrapper only exposes password policy.
- `src-tauri/src/commands/` and `src-tauri/src/tests/`: no HTTP-security code exists.

## Planned submodules

- Security headers: **Not started**
- HTTPS and transport protection: **Not started**
- Related web response controls: **Not started**

## Remaining work

- Define the checks and expected behavior for redirects, TLS, and response headers.
- Implement bounded HTTP inspection and clear evidence for each finding.
- Distinguish missing controls from controls that could not be evaluated.

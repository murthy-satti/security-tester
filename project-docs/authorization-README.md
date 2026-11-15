# Authorization Testing

**Status: Not started**

The dashboard describes checking access control and privilege/permission issues across application resources. There is no authorization route or execution logic yet.

## Planned flow

Configure a target resource and authorized test identities/roles, select access-control checks, execute requests through a Tauri command, and compare observed access with expected permissions. The exact model and request details are not yet defined.

## Related files

- `src/app/page.tsx`: dashboard card links to `/authorization`.
- `src/app/authorization/`: **not present**; planned UI route.
- `src/lib/tauri.ts`: current wrapper only exposes password policy.
- `src-tauri/src/commands/` and `src-tauri/src/tests/`: no authorization code exists.

## Planned submodules

- Resource access control: **Not started**
- Role and permission enforcement: **Not started**
- Privilege escalation checks: **Not started**

## Remaining work

- Define the role/identity model and how users provide credentials safely.
- Define resource and action inputs and expected access outcomes.
- Implement the UI, Tauri command, checks, and detailed result reporting.
- Keep probes scoped to authorized identities and target resources.

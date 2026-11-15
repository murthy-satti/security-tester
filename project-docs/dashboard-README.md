# Security Test Dashboard

**Status: Completed**

## What it does

Displays the seven security-testing modules and provides a link to each module page. At present, only the Password Policy destination has an implemented page.

## Flow and related files

- `src/app/page.tsx` defines the module list, descriptions, icons, and links.
- `src/app/layout.tsx` provides the root HTML layout and metadata.
- `src/app/globals.css` contains global styles.

The dashboard is a static Next.js page. Selecting a card navigates to its configured route.

## Submodule status

- Display the seven module cards: **Completed**
- Navigate to Password Policy: **Completed**
- Navigate to Authentication, Authorization, Input Validation, HTTP Security, and Session Security: **Not started** (their routes are not present)

## Remaining work

- Add a route/page for each of the five modules that currently has a dashboard link only.
- Consider a shared navigation and module status display as the modules become available.

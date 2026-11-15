# Password Policy Testing

**Status: In progress**

The configuration screen, Rust command, six probe types, and result display are implemented. The module still needs runtime validation against controlled target APIs. Its response classifier is intentionally cautious in several cases, but remains heuristic because the target application's response contract is configurable and not known to this tool.

## Purpose and scope

This module sends registration-style requests to a user-configured endpoint with generated password values. It checks whether the endpoint appears to enforce the minimum and maximum lengths and reject representative weak or predictable passwords.

It does **not** discover a target's policy automatically. The user supplies the expected minimum and maximum. It also does not currently support custom headers, API authentication setup, CSRF tokens, alternate content types, password dictionary files, or endpoint-specific success/error schemas.

Only run it against an endpoint you are authorized to test. A probe that the endpoint accepts may create an account. The tool currently has no automatic account deletion or cleanup step.

## Configuration: values and defaults

The form state lives in `src/app/password-policy/page.tsx`. Values are sent to Rust as `PasswordPolicyConfig` via `src/lib/tauri.ts`.

| Field | Default | Meaning and use |
| --- | --- | --- |
| `endpoint` | `https://example.com/api/register` | URL to which every selected probe is sent. Replace this placeholder with the registration endpoint under test. |
| `method` | `POST` | HTTP method. Rust accepts `POST`, `PUT`, or `PATCH` (case-insensitive). |
| `request_body` | `{"username":"{{username}}","email":"{{email}}","password":"{{password}}"}` | JSON template sent with each request. The command requires valid JSON and the `{{password}}` placeholder. |
| `username` | `security_test_user` | Value substituted for `{{username}}`. Also used to construct the username-derived password probe. |
| `email` | `security_test@example.com` | Base value substituted for `{{email}}`. Rust adds a timestamp, sequence number, and check identifier to the local part when the value contains `@`, to reduce duplicate-account conflicts. |
| `minimum_length` | `8` | Expected minimum password length used by the minimum-length probe and to check whether other probe values can be isolated from length rules. Must be greater than zero. |
| `maximum_length` | `64` | Expected maximum password length. Must be at least the minimum and no more than 1024. |
| `selected_tests` | All six checks | IDs of the checks to execute. The UI initially selects all of them. |

The form currently holds values in React state only; it does not save or restore a configuration between runs. The UI shows the three supported placeholders. Rust parses the template as JSON and replaces placeholders inside JSON string **values** recursively, including strings nested in arrays and objects. It does not replace placeholders in JSON property names. Only `{{password}}` is required by command validation; if `{{username}}` or `{{email}}` is omitted, that value will not be included in the request body unless provided another way in the template.

Before any request is sent, Rust rejects an empty endpoint, an empty selection, invalid JSON, a missing password placeholder, invalid length bounds, an unsupported HTTP method, or an unknown check ID. The HTTP client has a 10-second connect timeout and a 30-second overall request timeout. Requests within a run are sent sequentially.

## What each check sends and identifies

The check IDs below must match between the UI selection and Rust dispatch. For a length that should be accepted, an explicit password-policy rejection is a **failure**. For a length or pattern expected to be rejected, acceptance is a **failure**. An inconclusive response is a **warning**.

### 1. Minimum Password Length (`min-length`)

**Implementation:** `src-tauri/src/tests/password_policy/min_length.rs`

Creates a different password at each distinct length:

- `0`
- `1`
- `minimum_length - 1` (saturating at zero)
- `minimum_length`
- `minimum_length + 1`, only when that length does not exceed `maximum_length`

Duplicate lengths are removed. With the default limits, the lengths are `0`, `1`, `7`, `8`, and `9`.

The shared `password_for_length` helper uses a deterministic, varied ASCII alphabet. For values of at least four characters, its first four characters include lowercase, uppercase, numeric, and symbol characters; remaining characters are generated from a mixed alphabet. This reduces conflicts with common complexity requirements compared with testing only repeated lowercase letters. It cannot satisfy every target's custom complexity rules.

Lengths below the configured minimum are expected to be rejected. Lengths at or above the configured minimum are expected to be accepted. This identifies whether the endpoint appears to enforce the **configured boundary**; it does not infer what the boundary should be. If an acceptance probe is shorter than four characters, it returns a warning without sending because it cannot include all four common character classes. Other policy rules can still make a boundary case inconclusive.

### 2. Maximum Password Length (`max-length`)

**Implementation:** `src-tauri/src/tests/password_policy/max_length.rs`

Uses the same varied password generator as the minimum-length check at:

- `maximum_length`
- `maximum_length + 1`
- `maximum_length - 1`, only when this is not below `minimum_length`

At or below the configured maximum, acceptance is expected. Above the configured maximum, rejection is expected. This checks the supplied maximum boundary, not an automatically discovered target limit. An acceptance probe shorter than four characters returns a warning without sending. The probe of `maximum_length + 1` may be subject to an upstream server or framework request-size limit, which can make the result inconclusive if the response does not identify a password-related reason.

### 3. Common Password (`common-password`)

**Implementation:** `src-tauri/src/tests/password_policy/common_password.rs`

Submits exactly `Password123!` and expects the target to reject it as common or predictable. If accepted, the check fails. If explicitly rejected for a password-policy reason, it passes. This is one representative candidate, not a comprehensive common-password list.

Before sending, the shared helper checks that this candidate's character count is within the configured minimum and maximum. If it falls outside that range, the case is returned as a warning without sending a request; otherwise a length rule could explain the rejection instead of the common-password rule.

### 4. Sequential Characters (`sequential`)

**Implementation:** `src-tauri/src/tests/password_policy/sequential.rs`

Submits exactly `Abcdefgh123!`, which includes ascending alphabetic and numeric runs, and expects rejection. Acceptance fails the check; a password-specific policy rejection passes it. This tests one mixed sequence example and does not cover descending, keyboard-layout, or other sequence patterns.

As with the common-password check, a probe outside the configured length range becomes a warning without an HTTP request.

### 5. Repeated Pattern (`repeated-pattern`)

**Implementation:** `src-tauri/src/tests/password_policy/repeated_pattern.rs`

Submits exactly `Aaaaaaaa111!`, which contains repeated letters and digits, and expects rejection. Acceptance fails the check; a password-specific policy rejection passes it. This is one repeated-character sample, not a general detector for arbitrary repeated substrings.

If this candidate is outside the configured length range, it returns a warning without sending the request.

### 6. Username-Derived Password (`username-derived`)

**Implementation:** `src-tauri/src/tests/password_policy/username_derived.rs`

Builds the password as the configured username followed by `!123`, then expects the target to reject it. For the default username, the submitted password is `security_test_user!123`. Acceptance fails the check; a password-specific rejection passes it.

If the derived value is shorter than the configured minimum or longer than the maximum, the result is a warning and no request is sent. This is a single exact derivation; it does not try capitalization, truncation, username fragments, or other variants.

## Request construction and email handling

Shared implementation: `src-tauri/src/tests/password_policy/common.rs`.

For each actual HTTP probe, the helper:

1. Parses the configured body as JSON.
2. Recursively replaces `{{username}}`, `{{email}}`, and `{{password}}` in JSON string values. JSON serialization escapes inserted text safely.
3. Creates a unique email value using the configured email local part, check ID, current timestamp, and an in-process sequence number. If the configured email has no `@`, it appends a suffix to the whole value instead.
4. Sends the JSON with the selected method using Reqwest's JSON request support. Automatic redirects are disabled; a redirect response is not followed and is classified as inconclusive unless it contains a recognized password-specific reason.
5. Reads the HTTP status and response body and classifies the observation.

Each test case uses a unique email, but the username stays the same. The endpoint may ignore the email, disallow plus-addressing, or apply its own identity rules. Those cases may produce warnings or interfere with interpretation. The tool does not inspect whether account creation actually occurred or clean up created accounts.

## How response scenarios map to a case result

The shared helper returns an internal observation of `Accepted`, `Rejected`, or `Inconclusive`. `check_password` compares that observation to the case's expectation and creates a `TestCaseResult`.

| HTTP/response scenario | Internal observation | Case status meaning |
| --- | --- | --- |
| HTTP `409 Conflict` | Inconclusive | Warning. A conflict may indicate a duplicate identity; the password rule was not established. |
| HTTP `5xx` | Inconclusive | Warning. The server failed while handling the probe. |
| Other non-success HTTP status, with a body mentioning password/credential and a term associated with the selected check | Rejected | Pass if rejection was expected; fail if acceptance was expected. Minimum recognizes `too short`, `minimum length`, `shorter than`, or `min length`; maximum recognizes `too long`, `maximum length`, `max length`, `longer than`, or the two explicit maximum-limit phrases; common recognizes `common`, `dictionary`, `frequently used`, `compromised`, or `breached`; sequential recognizes `sequential`, `sequence`, or `consecutive`; repeated recognizes `repeated`, `repeating`, or `same character`; username-derived recognizes specific phrases such as `password contains username` or `password derived from the username`. |
| Other non-success HTTP status without a matching password-specific reason | Inconclusive | Warning. The request failed, but it may have failed for authentication, missing fields, rate limits, routing, or another reason. The response excerpt is included in details. |
| Successful HTTP status with a matching password-specific rejection reason | Rejected | Pass if rejection was expected; fail if acceptance was expected. |
| Successful HTTP status with JSON `success: false`, `accepted: false`, or a non-empty `error`, `errors`, or `validationErrors` field, but no recognized password-specific reason | Inconclusive | Warning. The endpoint reported an error, but the helper cannot attribute it to the password rule. |
| HTTP `201` or `204`, or a successful response with JSON `success: true`/`accepted: true`, or one of the in-code success phrases (`registration successful`, `registration succeeded`, `registered successfully`, `user created`, `account created`) | Accepted | Pass if acceptance was expected; fail if rejection was expected. |
| Other successful HTTP status without one of those explicit success signals | Inconclusive | Warning. A generic `200` or unrecognized success body no longer counts as proof that registration succeeded. A short response excerpt is included in details. |
| Connection, DNS, TLS, timeout, or other send failure | Inconclusive | Warning. No usable HTTP response was received. |
| Malformed request JSON while constructing a probe | Inconclusive | Warning from the helper; normally the command rejects malformed JSON before dispatching checks. |
| Non-length probe outside the configured min/max range | Inconclusive without sending | Warning. The check cannot be isolated from length policy. |

The recognized password wording is a small, check-specific heuristic over the lowercased response body. A target may return an error with wording not in the corresponding phrase list, or signal success using an unsupported schema. Such responses become warnings. Response excerpts in warning details are truncated to 200 characters. Accepted and rejected details include the status and classification reason, not the full response body. A controlled endpoint with a documented response contract is needed for reliable classification.

## Result values and UI behavior

Rust result types are defined in `src-tauri/src/engine/result.rs`; the TypeScript equivalents are in `src/lib/tauri.ts`.

Each **case** returns:

| Field | Meaning |
| --- | --- |
| `id` | Stable display ID for the case, such as `MIN-001`, `COMMON-001`, or `USER-001`. |
| `test_id` | Parent check ID used by the UI to group this case under the correct summary. |
| `name` | Human-readable probe name, including the tested length for length checks. |
| `input_length` | Character count of the generated password (`password.chars().count()` in Rust). |
| `expected` | `Password should be accepted` or `Password should be rejected`. |
| `actual` | `Accepted`, `Rejected`, or `Inconclusive`. |
| `status` | `Passed`, `Failed`, or `Warning` for these current probes. `Error` exists in the shared status enum but the password helper currently maps probe problems to warnings. |
| `details` | Explanation with the HTTP status, reason for an inconclusive result, or request error. |

Each **summary** returns `id`, `name`, `status`, `description`, and `details`. The details currently read `N of M cases passed.` Summary status precedence is: any failed case makes the check **Failed**; otherwise any error makes it **Error**; otherwise any warning makes it **Warning**; otherwise it is **Passed**. The UI lowercases the Rust enum status and shows counts of passed, failed, warning, and error summaries. Expanding a summary shows its associated cases, including each case's `details` evidence.

Command-level validation errors are returned as a Tauri error instead of a result summary. The page displays that message in the configuration screen. A run with no selected tests is prevented in the UI and also rejected by Rust.

## Request volume

With the default values and all checks selected, the implementation attempts up to 12 sequential HTTP requests:

- 5 minimum-length cases
- 3 maximum-length cases
- 1 common-password case
- 1 sequential-pattern case
- 1 repeated-pattern case
- 1 username-derived case

The exact count can be lower when minimum/maximum boundaries collapse to duplicate lengths or when a non-length probe is out of bounds and is skipped. A transport failure on one case does not stop the remaining cases.

## Related files and responsibilities

- `src/app/password-policy/page.tsx`: configuration defaults and fields, selection state, Tauri invocation, lowercasing statuses, summary counts, case grouping, and result rendering.
- `src/lib/tauri.ts`: `PasswordPolicyConfig`, `TestResult`, `TestCaseResult`, response types, and `invoke("run_password_policy_tests", { config })`.
- `src-tauri/src/lib.rs`: registers `run_password_policy_tests` with Tauri.
- `src-tauri/src/commands/password_policy.rs`: validates input, creates the HTTP client, dispatches selected checks, and aggregates results.
- `src-tauri/src/engine/result.rs`: shared `TestStatus`, `TestResult`, and `TestCaseResult` structures.
- `src-tauri/src/tests/password_policy/mod.rs`: declares the check modules.
- `src-tauri/src/tests/password_policy/common.rs`: request construction, placeholder replacement, unique email generation, timeout-compatible HTTP execution, response classification, range guard, and shared case construction.
- `src-tauri/src/tests/password_policy/min_length.rs`: minimum-length boundaries.
- `src-tauri/src/tests/password_policy/max_length.rs`: maximum-length boundaries.
- `src-tauri/src/tests/password_policy/common_password.rs`: common candidate.
- `src-tauri/src/tests/password_policy/sequential.rs`: sequential candidate.
- `src-tauri/src/tests/password_policy/repeated_pattern.rs`: repeated-character candidate.
- `src-tauri/src/tests/password_policy/username_derived.rs`: username-derived candidate.

## Remaining work

- Exercise every branch against a controlled mock registration endpoint and confirm the UI grouping and statuses.
- Define supported target response formats or allow users to configure success and password-error signals instead of relying on in-code phrase lists.
- Add headers/authentication configuration for endpoints that require them, without exposing secrets in logs or results.
- Validate endpoint URL and identity fields before sending requests.
- Add cancellation and request-count/rate controls for large runs. Current HTTP timeouts are 10 seconds for connecting and 30 seconds overall per request.
- Expand common-password and pattern coverage, and make probe values configurable where policy expectations vary.
- Add an account cleanup strategy or clearly support test endpoints that do not persist accepted registrations.

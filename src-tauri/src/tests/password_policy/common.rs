use crate::engine::result::{TestCaseResult, TestStatus};
use serde_json::Value;
use std::sync::atomic::{AtomicU64, Ordering};

static REQUEST_SEQUENCE: AtomicU64 = AtomicU64::new(0);

pub struct ProbeConfig<'a> {
    pub endpoint: &'a str,
    pub method: &'a str,
    pub request_body: &'a str,
    pub username: &'a str,
    pub email: &'a str,
    pub minimum_length: usize,
    pub maximum_length: usize,
}

enum ProbeOutcome {
    Accepted(String),
    Rejected(String),
    Inconclusive(String),
}

pub async fn check_password(
    client: &reqwest::Client,
    config: &ProbeConfig<'_>,
    test_id: &str,
    case_name: &str,
    password: &str,
    expect_rejection: bool,
) -> TestCaseResult {
    let length = password.chars().count();
    let outside_configured_range = test_id != "min-length" && test_id != "max-length"
        && (length < config.minimum_length || length > config.maximum_length);
    let too_short_to_isolate = matches!(test_id, "min-length" | "max-length")
        && !expect_rejection
        && length < 4;

    let outcome = if outside_configured_range {
        ProbeOutcome::Inconclusive(format!(
            "Probe length {} is outside the configured allowed range ({} to {}). This check could not be isolated from the length rules.",
            length, config.minimum_length, config.maximum_length
        ))
    } else if too_short_to_isolate {
        ProbeOutcome::Inconclusive(format!(
            "Probe length {length} is too short to include lowercase, uppercase, numeric, and symbol characters. The length boundary cannot be isolated from common complexity rules."
        ))
    } else {
        send_probe(client, config, test_id, password).await
    };
    let (actual, status, details) = match outcome {
        ProbeOutcome::Accepted(details) => (
            "Accepted".to_string(),
            if expect_rejection { TestStatus::Failed } else { TestStatus::Passed },
            details,
        ),
        ProbeOutcome::Rejected(details) => (
            "Rejected".to_string(),
            if expect_rejection { TestStatus::Passed } else { TestStatus::Failed },
            details,
        ),
        ProbeOutcome::Inconclusive(details) => (
            "Inconclusive".to_string(),
            TestStatus::Warning,
            details,
        ),
    };

    TestCaseResult {
        id: format!("{}-001", test_id.to_uppercase()),
        test_id: test_id.to_string(),
        name: case_name.to_string(),
        input_length: length,
        expected: if expect_rejection { "Password should be rejected" } else { "Password should be accepted" }.to_string(),
        actual,
        status,
        details,
    }
}

async fn send_probe(
    client: &reqwest::Client,
    config: &ProbeConfig<'_>,
    test_id: &str,
    password: &str,
) -> ProbeOutcome {
    let mut body: Value = match serde_json::from_str(config.request_body) {
        Ok(value) => value,
        Err(error) => return ProbeOutcome::Inconclusive(format!("Request body is not valid JSON: {error}")),
    };

    let unique_email = unique_email(config.email, test_id);
    replace_values(&mut body, config.username, &unique_email, password);

    let request = match config.method.to_ascii_uppercase().as_str() {
        "POST" => client.post(config.endpoint),
        "PUT" => client.put(config.endpoint),
        "PATCH" => client.patch(config.endpoint),
        _ => return ProbeOutcome::Inconclusive(format!("Unsupported HTTP method: {}", config.method)),
    };

    let response = match request.json(&body).send().await {
        Ok(response) => response,
        Err(error) => return ProbeOutcome::Inconclusive(format!("HTTP request failed: {error}")),
    };
    let status = response.status();
    let response_body = response.text().await.unwrap_or_default();

    if status.as_u16() == 409 {
        return ProbeOutcome::Inconclusive(format!("HTTP {status}: the endpoint reported a conflict, so password acceptance could not be determined."));
    }
    if status.is_server_error() {
        return ProbeOutcome::Inconclusive(format!("HTTP {status}: the endpoint returned a server error."));
    }
    if !status.is_success() {
        return if explicitly_password_rejected(&response_body, test_id) {
            ProbeOutcome::Rejected(format!("HTTP {status}: the response indicates a password-policy rejection."))
        } else {
            ProbeOutcome::Inconclusive(format!("HTTP {status}: the request was rejected, but the response did not identify a password-policy reason. Response: {}", response_excerpt(&response_body)))
        };
    }

    if explicitly_password_rejected(&response_body, test_id) {
        ProbeOutcome::Rejected(format!("HTTP {status}: the response indicates a password-policy rejection."))
    } else if explicitly_reports_error(&response_body) {
        ProbeOutcome::Inconclusive(format!("HTTP {status}: the endpoint reported an error, but it did not identify a password-policy reason. Response: {}", response_excerpt(&response_body)))
    } else if status.as_u16() == 201 || status.as_u16() == 204 || explicitly_reports_acceptance(&response_body) {
        ProbeOutcome::Accepted(format!("HTTP {status}: the endpoint provided an explicit success response."))
    } else {
        ProbeOutcome::Inconclusive(format!("HTTP {status}: the response did not clearly confirm that registration succeeded. Response: {}", response_excerpt(&response_body)))
    }
}

fn explicitly_password_rejected(body: &str, test_id: &str) -> bool {
    let text = body.to_ascii_lowercase();
    let mentions_password = text.contains("password") || text.contains("credential");
    if !mentions_password {
        return false;
    }

    let test_reasons: &[&str] = match test_id {
        "min-length" => &["too short", "minimum length", "shorter than", "min length"],
        "max-length" => &[
            "too long", "maximum length", "max length", "longer than",
            "exceeds the maximum length", "exceeds the length limit",
        ],
        "common-password" => &[
            "common", "dictionary", "frequently used", "compromised", "breached",
        ],
        "sequential" => &["sequential", "sequence", "consecutive"],
        "repeated-pattern" => &["repeated", "repeating", "same character"],
        "username-derived" => &[
            "password contains username", "password contains the username",
            "password includes username", "password includes the username",
            "password must not contain username", "password must not contain the username",
            "password cannot contain username", "password cannot contain the username",
            "password should not contain username", "password should not contain the username",
            "password is based on username", "password is based on the username",
            "password derived from username", "password derived from the username",
            "username-derived password",
        ],
        _ => &[],
    };

    test_reasons.iter().any(|phrase| text.contains(phrase))
}

fn explicitly_reports_acceptance(body: &str) -> bool {
    if let Ok(value) = serde_json::from_str::<Value>(body) {
        if value.get("success").and_then(Value::as_bool) == Some(true)
            || value.get("accepted").and_then(Value::as_bool) == Some(true)
        {
            return true;
        }
    }
    let text = body.to_ascii_lowercase();
    [
        "registration successful",
        "registration succeeded",
        "registered successfully",
        "user created",
        "account created",
    ]
    .iter()
    .any(|phrase| text.contains(phrase))
}

fn explicitly_reports_error(body: &str) -> bool {
    if let Ok(value) = serde_json::from_str::<Value>(body) {
        if value.get("success").and_then(Value::as_bool) == Some(false)
            || value.get("accepted").and_then(Value::as_bool) == Some(false)
        {
            return true;
        }
        for key in ["error", "errors", "validationErrors"] {
            if value.get(key).is_some_and(|v| !v.is_null() && v != "" && v != &Value::Array(vec![])) {
                return true;
            }
        }
    }
    false
}

fn response_excerpt(body: &str) -> String {
    body.chars().take(200).collect()
}

pub fn password_for_length(length: usize) -> String {
    const ALPHABET: &[u8] = b"abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789!@#$%^&*_-+";
    const REQUIRED_CLASSES: [u8; 4] = [b'a', b'Z', b'3', b'!'];

    let mut password = Vec::with_capacity(length);
    for (index, required) in REQUIRED_CLASSES.iter().enumerate().take(length) {
        password.push(*required);
        if index + 1 == length {
            break;
        }
    }

    let mut state = (length as u64).wrapping_add(0x9E3779B97F4A7C15);
    while password.len() < length {
        state ^= state << 13;
        state ^= state >> 7;
        state ^= state << 17;
        let mut next = ALPHABET[(state as usize) % ALPHABET.len()];
        if password.last() == Some(&next) {
            next = ALPHABET[((state as usize) + 1) % ALPHABET.len()];
        }
        password.push(next);
    }

    String::from_utf8(password).expect("password alphabet contains only ASCII")
}

fn unique_email(email: &str, suffix: &str) -> String {
    let stamp = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .map(|time| time.as_millis())
        .unwrap_or_default();
    let sequence = REQUEST_SEQUENCE.fetch_add(1, Ordering::Relaxed);
    match email.split_once('@') {
        Some((local, domain)) => format!("{local}+{suffix}-{stamp}-{sequence}@{domain}"),
        None => format!("{email}+{suffix}-{stamp}-{sequence}"),
    }
}

fn replace_values(value: &mut Value, username: &str, email: &str, password: &str) {
    match value {
        Value::String(text) => {
            *text = text
                .replace("{{username}}", username)
                .replace("{{email}}", email)
                .replace("{{password}}", password);
        }
        Value::Array(items) => items.iter_mut().for_each(|item| replace_values(item, username, email, password)),
        Value::Object(items) => items.values_mut().for_each(|item| replace_values(item, username, email, password)),
        _ => {}
    }
}

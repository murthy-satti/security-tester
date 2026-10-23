
use crate::engine::result::{TestCaseResult, TestStatus};
use serde_json::Value;

pub async fn run(
    client: &reqwest::Client,
    endpoint: &str,
    method: &str,
    request_body: &str,
    username: &str,
    email: &str,
    minimum_length: usize,
) -> Vec<TestCaseResult> {
    // Test representative boundaries around the configured minimum.
    let lengths = [
        0,
        1,
        minimum_length.saturating_sub(1),
        minimum_length,
        minimum_length.saturating_add(1),
    ];

    let mut results = Vec::new();

    for (index, length) in lengths.iter().enumerate() {
        let password = "a".repeat(*length);

        let test_email = format!(
    "{}+min{:03}@{}",
    email.split('@').next().unwrap_or("tester"),
    index + 1,
    email.split('@').nth(1).unwrap_or("example.com")
);

// println!("Test case {} email: {}", index + 1, test_email);


        let body = request_body
            .replace("{{username}}", username)
            .replace("{{email}}", &test_email)
            .replace("{{password}}", &password);

        let parsed_body: Value = match serde_json::from_str(&body) {
            Ok(value) => value,
            Err(error) => {
                results.push(case_result(
                    index,
                    *length,
                    "Valid JSON request body",
                    "Invalid request body",
                    TestStatus::Error,
                    format!("Invalid request-body JSON: {error}"),
                ));
                continue;
            }
        };

        let request = match method.to_uppercase().as_str() {
            "POST" => client.post(endpoint),
            "PUT" => client.put(endpoint),
            "PATCH" => client.patch(endpoint),
            _ => {
                results.push(case_result(
                    index,
                    *length,
                    "Supported HTTP method",
                    "Unsupported HTTP method",
                    TestStatus::Error,
                    format!("Unsupported HTTP method: {method}"),
                ));
                break;
            }
        };

        let response = match request.json(&parsed_body).send().await {
            Ok(response) => response,
            Err(error) => {
                results.push(case_result(
                    index,
                    *length,
                    "Receive HTTP response",
                    "No response",
                    TestStatus::Error,
                    format!("HTTP request failed: {error}"),
                ));
                continue;
            }
        };

        let status = response.status();
        let response_body = response.text().await.unwrap_or_default();
        let body_lower = response_body.to_lowercase();

        let expected_acceptance = *length >= minimum_length;

        let explicitly_rejected_for_length =
            body_lower.contains("password")
                && (body_lower.contains("length")
                    || body_lower.contains("short")
                    || body_lower.contains("minimum")
                    || body_lower.contains("minlength"));

        let accepted = status.is_success()
            && (body_lower.contains("registration successful")
                || body_lower.contains("user created"));

        let (actual, test_status, details) =
            if explicitly_rejected_for_length {
                (
                    "Rejected for password length",
                    if expected_acceptance {
                        TestStatus::Failed
                    } else {
                        TestStatus::Passed
                    },
                    format!(
                        "HTTP {status}. The response explicitly indicates a password-length rejection."
                    ),
                )
            } else if accepted {
                (
                    "Accepted",
                    if expected_acceptance {
                        TestStatus::Passed
                    } else {
                        TestStatus::Failed
                    },
                    format!(
                        "HTTP {status}. The endpoint returned a registration-success response."
                    ),
                )
            } else if status.as_u16() == 409 {
                (
                    "Inconclusive: duplicate identity",
                    TestStatus::Warning,
                    "The email already exists. Password-policy behavior could not be established."
                        .to_string(),
                )
            } else {
                (
                    "Inconclusive",
                    TestStatus::Warning,
                    format!(
                        "HTTP {status}. The response did not establish whether the password was accepted or rejected specifically because of password length. Response: {}",
                        response_body.chars().take(200).collect::<String>()
                    ),
                )
            };

        results.push(case_result(
            index,
            *length,
            if expected_acceptance {
                "Password should be accepted"
            } else {
                "Password should be rejected"
            },
            actual,
            test_status,
            details,
        ));
    }

    results
}

fn case_result(
    index: usize,
    length: usize,
    expected: &str,
    actual: &str,
    status: TestStatus,
    details: String,
) -> TestCaseResult {
    TestCaseResult {
        id: format!("MIN-{:03}", index + 1),
        name: format!("Password length: {length}"),
        input_length: length,
        expected: expected.to_string(),
        actual: actual.to_string(),
        status,
        details,
    }
}

use serde::{Deserialize, Serialize};

use crate::engine::result::{TestCaseResult, TestResult, TestStatus};
use crate::tests::password_policy::{
    common::ProbeConfig, common_password, max_length, min_length, repeated_pattern,
    sequential, username_derived,
};

#[derive(Debug, Deserialize)]
pub struct PasswordPolicyConfig {
    pub endpoint: String,
    pub method: String,
    pub request_body: String,
    pub username: String,
    pub email: String,
    pub selected_tests: Vec<String>,
    pub minimum_length: usize,
    pub maximum_length: usize,
}

#[derive(Debug, Serialize)]
pub struct PasswordPolicyResponse {
    pub results: Vec<TestResult>,
    pub test_cases: Vec<TestCaseResult>,
}

#[tauri::command]
pub async fn run_password_policy_tests(
    config: PasswordPolicyConfig,
) -> Result<PasswordPolicyResponse, String> {
    if config.endpoint.trim().is_empty() {
        return Err("Registration endpoint is required.".to_string());
    }
    if config.selected_tests.is_empty() {
        return Err("At least one security test must be selected.".to_string());
    }
    if !config.request_body.contains("{{password}}") {
        return Err("Request body must include the {{password}} placeholder.".to_string());
    }
    serde_json::from_str::<serde_json::Value>(&config.request_body)
        .map_err(|error| format!("Request body is not valid JSON: {error}"))?;
    if config.minimum_length == 0 || config.maximum_length < config.minimum_length || config.maximum_length > 1024 {
        return Err("Set a minimum greater than zero and a maximum between the minimum and 1024 characters.".to_string());
    }
    let method = config.method.to_ascii_uppercase();
    if !["POST", "PUT", "PATCH"].contains(&method.as_str()) {
        return Err("HTTP method must be POST, PUT, or PATCH.".to_string());
    }

    let client = reqwest::Client::builder()
        .connect_timeout(std::time::Duration::from_secs(10))
        .timeout(std::time::Duration::from_secs(30))
        .redirect(reqwest::redirect::Policy::none())
        .build()
        .map_err(|error| format!("Could not create HTTP client: {error}"))?;
    let probe_config = ProbeConfig {
        endpoint: &config.endpoint,
        method: &config.method,
        request_body: &config.request_body,
        username: &config.username,
        email: &config.email,
        minimum_length: config.minimum_length,
        maximum_length: config.maximum_length,
    };
    let mut results = Vec::new();
    let mut test_cases = Vec::new();

    for test_id in &config.selected_tests {
        let cases = match test_id.as_str() {
            "min-length" => min_length::run(&client, &probe_config, config.minimum_length).await,
            "max-length" => max_length::run(&client, &probe_config, config.maximum_length).await,
            "common-password" => common_password::run(&client, &probe_config).await,
            "sequential" => sequential::run(&client, &probe_config).await,
            "repeated-pattern" => repeated_pattern::run(&client, &probe_config).await,
            "username-derived" => username_derived::run(&client, &probe_config).await,
            _ => return Err(format!("Unknown password policy check: {test_id}")),
        };

        let name = match test_id.as_str() {
            "min-length" => "Minimum Password Length",
            "max-length" => "Maximum Password Length",
            "common-password" => "Common Password",
            "sequential" => "Sequential Characters",
            "repeated-pattern" => "Repeated Pattern",
            "username-derived" => "Username Derived",
            _ => unreachable!(),
        };
        let description = match test_id.as_str() {
            "min-length" => "Checks whether passwords shorter than the configured minimum are rejected.",
            "max-length" => "Checks whether passwords longer than the configured maximum are rejected.",
            "common-password" => "Checks whether a common, predictable password is rejected.",
            "sequential" => "Checks whether a password containing sequential characters is rejected.",
            "repeated-pattern" => "Checks whether a password containing repeated characters is rejected.",
            "username-derived" => "Checks whether a password derived from the username is rejected.",
            _ => unreachable!(),
        };
        let status = summarize(&cases);
        let passed = cases.iter().filter(|case| matches!(case.status, TestStatus::Passed)).count();
        results.push(TestResult {
            id: test_id.clone(),
            name: name.to_string(),
            status,
            description: description.to_string(),
            details: format!("{passed} of {} cases passed.", cases.len()),
        });
        test_cases.extend(cases);
    }

    Ok(PasswordPolicyResponse { results, test_cases })
}

fn summarize(cases: &[TestCaseResult]) -> TestStatus {
    if cases.iter().any(|case| matches!(case.status, TestStatus::Failed)) {
        TestStatus::Failed
    } else if cases.iter().any(|case| matches!(case.status, TestStatus::Error)) {
        TestStatus::Error
    } else if cases.iter().any(|case| matches!(case.status, TestStatus::Warning)) {
        TestStatus::Warning
    } else {
        TestStatus::Passed
    }
}

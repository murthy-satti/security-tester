use serde::{Deserialize, Serialize};

use crate::engine::result::{TestCaseResult, TestResult};
use crate::tests::password_policy::min_length;

#[derive(Debug, Deserialize)]
pub struct PasswordPolicyConfig {
    pub endpoint: String,
    pub method: String,
    pub request_body: String,
    pub username: String,
    pub email: String,
    pub selected_tests: Vec<String>,
    pub minimum_length: usize,
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

    let client = reqwest::Client::new();
let mut results: Vec<TestResult> = Vec::new();
let mut test_cases: Vec<TestCaseResult> = Vec::new();
      if config
    .selected_tests
    .contains(&"min-length".to_string())
{
    let cases = min_length::run(
        &client,
        &config.endpoint,
        &config.method,
        &config.request_body,
        &config.username,
        &config.email,
        config.minimum_length,
    )
    .await;

    let passed = cases
        .iter()
        .filter(|case| matches!(case.status, crate::engine::result::TestStatus::Passed))
        .count();

    let failed = cases
        .iter()
        .any(|case| matches!(case.status, crate::engine::result::TestStatus::Failed));

    let warning = cases
        .iter()
        .any(|case| matches!(case.status, crate::engine::result::TestStatus::Warning));

    let error = cases
        .iter()
        .any(|case| matches!(case.status, crate::engine::result::TestStatus::Error));

    let status = if failed {
        crate::engine::result::TestStatus::Failed
    } else if error {
        crate::engine::result::TestStatus::Error
    } else if warning {
        crate::engine::result::TestStatus::Warning
    } else {
        crate::engine::result::TestStatus::Passed
    };

    results.push(TestResult {
        id: "min-length".to_string(),
        name: "Minimum Password Length".to_string(),
        status,
        description: "Tests whether passwords below the configured minimum length are rejected.".to_string(),
        details: format!(
            "{} test cases passed out of {}.",
            passed,
            cases.len()
        ),
    });

    test_cases.extend(cases);
}

Ok(PasswordPolicyResponse {
    results,
    test_cases,
})}
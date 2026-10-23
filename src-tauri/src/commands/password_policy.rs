use serde::{Deserialize, Serialize};

use crate::engine::result::TestResult;
use crate::tests::password_policy::min_length;

#[derive(Debug, Deserialize)]
pub struct PasswordPolicyConfig {
    pub endpoint: String,
    pub method: String,
    pub request_body: String,
    pub username: String,
    pub email: String,
    pub selected_tests: Vec<String>,
}

#[derive(Debug, Serialize)]
pub struct PasswordPolicyResponse {
    pub results: Vec<TestResult>,
}

#[tauri::command]
pub fn run_password_policy_tests(
    config: PasswordPolicyConfig,
) -> Result<PasswordPolicyResponse, String> {
    if config.endpoint.trim().is_empty() {
        return Err("Registration endpoint is required.".to_string());
    }

    if config.selected_tests.is_empty() {
        return Err("At least one security test must be selected.".to_string());
    }

    let mut results = Vec::new();

    if config
        .selected_tests
        .contains(&"min-length".to_string())
    {
        results.push(min_length::run());
    }

    Ok(PasswordPolicyResponse { results })
}
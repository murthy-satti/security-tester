use crate::engine::result::{TestResult, TestStatus};

pub fn run() -> TestResult {
    TestResult {
        id: "min-length".to_string(),
        name: "Minimum Password Length".to_string(),
        status: TestStatus::Passed,
        description:
            "Tests whether passwords below the required minimum length are rejected."
                .to_string(),
        details:
            "Mock test: the target application rejected the password below the configured minimum length."
                .to_string(),
    }
}
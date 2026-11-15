use super::common::{check_password, ProbeConfig};
use crate::engine::result::TestCaseResult;

pub async fn run(client: &reqwest::Client, config: &ProbeConfig<'_>) -> Vec<TestCaseResult> {
    let mut case = check_password(client, config, "common-password", "Common password: Password123!", "Password123!", true).await;
    case.id = "COMMON-001".to_string();
    vec![case]
}

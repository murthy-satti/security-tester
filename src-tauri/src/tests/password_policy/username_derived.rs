use super::common::{check_password, ProbeConfig};
use crate::engine::result::TestCaseResult;

pub async fn run(client: &reqwest::Client, config: &ProbeConfig<'_>) -> Vec<TestCaseResult> {
    let password = format!("{}!123", config.username);
    let mut case = check_password(client, config, "username-derived", "Password derived from username", &password, true).await;
    case.id = "USER-001".to_string();
    vec![case]
}

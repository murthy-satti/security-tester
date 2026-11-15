use super::common::{check_password, ProbeConfig};
use crate::engine::result::TestCaseResult;

pub async fn run(client: &reqwest::Client, config: &ProbeConfig<'_>) -> Vec<TestCaseResult> {
    let mut case = check_password(client, config, "sequential", "Sequential password pattern", "Abcdefgh123!", true).await;
    case.id = "SEQ-001".to_string();
    vec![case]
}

use super::common::{check_password, ProbeConfig};
use crate::engine::result::TestCaseResult;

pub async fn run(client: &reqwest::Client, config: &ProbeConfig<'_>) -> Vec<TestCaseResult> {
    let mut case = check_password(client, config, "repeated-pattern", "Repeated character pattern", "Aaaaaaaa111!", true).await;
    case.id = "REPEAT-001".to_string();
    vec![case]
}

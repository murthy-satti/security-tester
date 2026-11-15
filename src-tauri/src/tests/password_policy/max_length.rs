use super::common::{check_password, password_for_length, ProbeConfig};
use crate::engine::result::TestCaseResult;

pub async fn run(client: &reqwest::Client, config: &ProbeConfig<'_>, maximum: usize) -> Vec<TestCaseResult> {
    let mut lengths = vec![maximum, maximum.saturating_add(1)];
    if maximum > config.minimum_length {
        lengths.insert(0, maximum - 1);
    }
    let mut cases = Vec::new();
    for (index, length) in lengths.into_iter().enumerate() {
        let password = password_for_length(length);
        let mut case = check_password(client, config, "max-length", &format!("Password length: {length}"), &password, length > maximum).await;
        case.id = format!("MAX-{:03}", index + 1);
        case.expected = if length > maximum { "Password should be rejected" } else { "Password should be accepted" }.to_string();
        cases.push(case);
    }
    cases
}

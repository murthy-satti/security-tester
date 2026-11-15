use super::common::{check_password, password_for_length, ProbeConfig};
use crate::engine::result::TestCaseResult;

pub async fn run(client: &reqwest::Client, config: &ProbeConfig<'_>, minimum: usize) -> Vec<TestCaseResult> {
    let mut lengths = vec![0, 1, minimum.saturating_sub(1), minimum];
    if minimum < config.maximum_length {
        lengths.push(minimum.saturating_add(1));
    }
    let mut unique_lengths = Vec::new();
    for length in lengths {
        if !unique_lengths.contains(&length) {
            unique_lengths.push(length);
        }
    }
    let mut cases = Vec::new();
    for (index, length) in unique_lengths.into_iter().enumerate() {
        let password = password_for_length(length);
        let mut case = check_password(client, config, "min-length", &format!("Password length: {length}"), &password, length < minimum).await;
        case.id = format!("MIN-{:03}", index + 1);
        case.expected = if length < minimum { "Password should be rejected" } else { "Password should be accepted" }.to_string();
        cases.push(case);
    }
    cases
}

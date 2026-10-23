import { invoke } from "@tauri-apps/api/core";

export interface PasswordPolicyConfig {
    endpoint: string;
    method: string;
    request_body: string;
    username: string;
    email: string;
    selected_tests: string[];
}

export interface TestResult {
    id: string;
    name: string;
    status: "Passed" | "Failed" | "Warning" | "Error";
    description: string;
    details: string;
}

interface PasswordPolicyResponse {
    results: TestResult[];
}

export async function runPasswordPolicyTests(
    config: PasswordPolicyConfig
): Promise<TestResult[]> {
    const response = await invoke<PasswordPolicyResponse>(
        "run_password_policy_tests",
        { config }
    );

    return response.results;
}
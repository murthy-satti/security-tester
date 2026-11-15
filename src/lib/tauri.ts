import { invoke } from "@tauri-apps/api/core";

export interface PasswordPolicyConfig {
    endpoint: string;
    method: string;
    request_body: string;
    username: string;
    email: string;
    minimum_length: number;
    maximum_length: number;
    selected_tests: string[];
}
export interface TestCaseResult {
    id: string;
    test_id: string;
    name: string;
    input_length: number;
    expected: string;
    actual: string;
    status: "Passed" | "Failed" | "Warning" | "Error" | "passed" | "failed" | "warning" | "error";
    details: string;
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
    test_cases: TestCaseResult[];

}

export async function runPasswordPolicyTests(
    config: PasswordPolicyConfig
): Promise<PasswordPolicyResponse> {
    return await invoke<PasswordPolicyResponse>(
        "run_password_policy_tests",
        { config }
    );
}

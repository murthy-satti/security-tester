"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
    ArrowLeft,
    AlertTriangle,
    Check,
    CheckCircle2,
    ChevronDown,
    CircleAlert,
    Play,
    RotateCcw,
    ShieldCheck,
    XCircle,
} from "lucide-react";
import { runPasswordPolicyTests, TestCaseResult } from "@/src/lib/tauri";

type TestStatus = "passed" | "failed" | "warning";

interface SecurityTest {
    id: string;
    name: string;
    description: string;
    status: TestStatus;
    details: string;
}

// Test case that may optionally carry the id of the test it belongs to.
type TestCaseWithOwner = TestCaseResult & {
    test_id?: string;
    test?: string;
};

const initialTests: SecurityTest[] = [
    {
        id: "min-length",
        name: "Minimum Password Length",
        description:
            "Tests whether passwords below the required minimum length are rejected.",
        status: "passed",
        details:
            "The application rejected passwords below the configured minimum length.",
    },
    {
        id: "max-length",
        name: "Maximum Password Length",
        description:
            "Tests whether passwords exceeding the allowed maximum length are rejected.",
        status: "passed",
        details:
            "The application rejected passwords exceeding the configured maximum length.",
    },
    {
        id: "common-password",
        name: "Common Password",
        description:
            "Tests whether commonly used passwords are rejected by the application.",
        status: "failed",
        details:
            'The application accepted the commonly used password "password".',
    },
    {
        id: "sequential",
        name: "Sequential Characters",
        description:
            "Tests passwords containing predictable sequential character patterns.",
        status: "passed",
        details:
            "The application rejected passwords containing sequential character patterns.",
    },
    {
        id: "repeated-pattern",
        name: "Repeated Pattern",
        description:
            "Tests passwords containing repeated characters or repeated patterns.",
        status: "warning",
        details:
            "A repeated pattern was accepted. Further analysis is recommended.",
    },
    {
        id: "username-derived",
        name: "Username Derived",
        description:
            "Tests whether passwords derived from the username are rejected.",
        status: "passed",
        details:
            "The application rejected passwords derived from the supplied username.",
    },
];

const statusText = (status: string) =>
    status === "passed"
        ? "font-semibold text-emerald-600"
        : status === "failed"
          ? "font-semibold text-red-600"
          : "font-semibold text-amber-600";

export default function PasswordPolicyPage() {
    const [endpoint, setEndpoint] = useState(
        "https://example.com/api/register"
    );
    const [method, setMethod] = useState("POST");
    const [requestBody, setRequestBody] = useState(`{
  "username": "{{username}}",
  "email": "{{email}}",
  "password": "{{password}}"
}`);
    const [username, setUsername] = useState("security_test_user");
    const [email, setEmail] = useState("security_test@example.com");

    const [selectedTests, setSelectedTests] = useState<string[]>(
        initialTests.map((test) => test.id)
    );
    const [testCases, setTestCases] = useState<TestCaseWithOwner[]>([]);

    const [currentStep, setCurrentStep] = useState<1 | 2>(1);
    const [expandedTests, setExpandedTests] = useState<string[]>([]);
    const [results, setResults] = useState<SecurityTest[]>([]);
    const [isRunning, setIsRunning] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const allSelected = selectedTests.length === initialTests.length;
    const someSelected =
        selectedTests.length > 0 && selectedTests.length < initialTests.length;

    const toggleTest = (id: string) => {
        setSelectedTests((current) =>
            current.includes(id)
                ? current.filter((testId) => testId !== id)
                : [...current, id]
        );
    };

    const toggleSelectAll = () => {
        setSelectedTests(allSelected ? [] : initialTests.map((t) => t.id));
    };

    const toggleExpanded = (id: string) => {
        setExpandedTests((prev) =>
            prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
        );
    };

    // Returns only the test cases that belong to a given test.
    // Falls back to "all cases belong to min-length" if the backend
    // does not send a test_id yet.
    const getCasesFor = (testId: string): TestCaseWithOwner[] => {
        const hasOwner = testCases.some((tc) => tc.test_id || tc.test);
        if (hasOwner) {
            return testCases.filter((tc) => (tc.test_id ?? tc.test) === testId);
        }
        return testId === "min-length" ? testCases : [];
    };

    const runTests = async () => {
        if (selectedTests.length === 0) return;

        setIsRunning(true);
        setError(null);

        try {
            const rustResponse = await runPasswordPolicyTests({
                endpoint,
                method,
                request_body: requestBody,
                username,
                email,
                selected_tests: selectedTests,
                minimum_length: 8,
            });

            setResults(
                rustResponse.results.map((result) => ({
                    ...result,
                    status: result.status.toLowerCase() as TestStatus,
                }))
            );

            setTestCases(
                rustResponse.test_cases.map((testCase) => ({
                    ...testCase,
                    status: testCase.status.toLowerCase() as TestStatus,
                }))
            );

            setExpandedTests([]);
            setCurrentStep(2);
        } catch (err) {
            console.error("Password policy test failed:", err);
            setError(
                err instanceof Error
                    ? err.message
                    : "Password policy test failed. Check the endpoint and try again."
            );
        } finally {
            setIsRunning(false);
        }
    };

    const resetTests = () => {
        setResults([]);
        setTestCases([]);
        setExpandedTests([]);
        setError(null);
        setCurrentStep(1);
    };

    const summary = useMemo(() => {
        return {
            passed: results.filter((t) => t.status === "passed").length,
            failed: results.filter((t) => t.status === "failed").length,
            warning: results.filter((t) => t.status === "warning").length,
        };
    }, [results]);

    return (
        <main className="min-h-screen bg-white py-6">
            <div className="mx-auto max-w-[95vw] space-y-5">
                {/* Header */}
                <section className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-slate-50">
                            <ShieldCheck className="h-6 w-6 text-slate-700" />
                        </div>

                        <div>
                            <h1 className="text-3xl font-bold tracking-tight text-slate-950">
                                Password Policy Testing
                            </h1>
                            <p className="text-base leading-6 text-slate-500">
                                Test whether an application&apos;s password policy
                                correctly rejects weak and predictable passwords.
                            </p>
                        </div>
                    </div>

                    <Link
                        href="/"
                        className="inline-flex items-center gap-2 text-base font-medium text-slate-700 transition hover:text-slate-900"
                    >
                        <ArrowLeft className="h-5 w-5" />
                        Security Tests
                    </Link>
                </section>

                {/* Stepper */}
                <div className="mt-8 flex items-center justify-center">
                    <button
                        type="button"
                        onClick={() => setCurrentStep(1)}
                        className="flex items-center gap-3"
                    >
                        <span
                            className={`flex h-9 w-9 items-center justify-center rounded-full border text-sm font-semibold ${
                                currentStep === 1
                                    ? "border-[#1f27b7] bg-[#1f27b7] text-white"
                                    : results.length > 0
                                      ? "border-emerald-500 bg-emerald-500 text-white"
                                      : "border-slate-300 bg-white text-slate-500"
                            }`}
                        >
                            {results.length > 0 && currentStep !== 1 ? "✓" : "1"}
                        </span>
                        <span className="block text-sm font-semibold text-slate-900">
                            Configure Tests
                        </span>
                    </button>

                    <div
                        className={`mx-6 h-px w-24 ${
                            results.length > 0 ? "bg-emerald-500" : "bg-slate-300"
                        }`}
                    />

                    <button
                        type="button"
                        disabled={results.length === 0}
                        onClick={() => setCurrentStep(2)}
                        className={`flex items-center gap-3 ${
                            results.length === 0
                                ? "cursor-not-allowed opacity-70"
                                : ""
                        }`}
                    >
                        <span
                            className={`flex h-9 w-9 items-center justify-center rounded-full border text-sm font-semibold ${
                                currentStep === 2
                                    ? "border-[#1f27b7] bg-[#1f27b7] text-white"
                                    : results.length > 0
                                      ? "border-slate-300 bg-[#f6f6f6] text-slate-700"
                                      : "border-slate-300 bg-[#f6f6f6] text-slate-400"
                            }`}
                        >
                            2
                        </span>
                        <span className="block text-sm font-semibold text-slate-900">
                            Test Results
                        </span>
                    </button>
                </div>

                {/* Configuration */}
                {currentStep === 1 && (
                    <section className="space-y-5 rounded-2xl border border-slate-300 bg-[#f6f6f6] px-6 py-5">
                        <div>
                            <h2 className="text-lg font-semibold text-slate-900">
                                Target Configuration
                            </h2>
                            <p className="mt-1 text-sm text-slate-500">
                                Configure the endpoint that will receive the
                                generated password test requests.
                            </p>
                        </div>

                        <div className="space-y-4">
                            {/* Endpoint + Method */}
                            <div className="grid gap-6 sm:grid-cols-[1fr_160px]">
                                <div>
                                    <label className="mb-2 block text-base font-medium text-slate-800">
                                        Registration Endpoint
                                    </label>
                                    <input
                                        type="url"
                                        value={endpoint}
                                        onChange={(e) => setEndpoint(e.target.value)}
                                        placeholder="https://example.com/api/register"
                                        className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-100"
                                    />
                                </div>

                                <div>
                                    <label className="mb-2 block text-base font-medium text-slate-700">
                                        HTTP Method
                                    </label>
                                    <div className="relative">
                                        <select
                                            value={method}
                                            onChange={(e) => setMethod(e.target.value)}
                                            className="w-full appearance-none rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-100"
                                        >
                                            <option>POST</option>
                                            <option>PUT</option>
                                            <option>PATCH</option>
                                        </select>
                                        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                                    </div>
                                </div>
                            </div>

                            {/* Request Body */}
                            <div>
                                <label className="mb-2 block text-base font-medium text-slate-700">
                                    Request Body
                                </label>
                                <textarea
                                    value={requestBody}
                                    onChange={(e) => setRequestBody(e.target.value)}
                                    rows={7}
                                    spellCheck={false}
                                    className="w-full resize-none rounded-lg border border-slate-300 bg-slate-950 px-4 py-3 font-mono text-sm leading-6 text-slate-100 outline-none focus:border-slate-500"
                                />
                                <p className="mt-2 text-xs text-slate-500">
                                    Use {"{{username}}"}, {"{{email}}"} and{" "}
                                    {"{{password}}"} as dynamic test values.
                                </p>
                            </div>

                            {/* Test Identity */}
                            <div>
                                <h3 className="text-sm font-semibold text-slate-900">
                                    Test Identity
                                </h3>
                                <p className="mt-1 text-xs text-slate-500">
                                    These values identify the temporary test account
                                    used by the security checks.
                                </p>

                                <div className="mt-4 grid gap-6 sm:grid-cols-2">
                                    <div>
                                        <label className="mb-2 block text-base font-medium text-slate-700">
                                            Username
                                        </label>
                                        <input
                                            type="text"
                                            value={username}
                                            onChange={(e) => setUsername(e.target.value)}
                                            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-100"
                                        />
                                    </div>

                                    <div>
                                        <label className="mb-2 block text-base font-medium text-slate-700">
                                            Email
                                        </label>
                                        <input
                                            type="email"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-100"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Security tests header */}
                        <div className="flex items-center justify-between gap-4 border-t border-slate-200 pt-5">
                            <div>
                                <h2 className="text-lg font-semibold text-slate-900">
                                    Security Tests
                                </h2>
                                <p className="mt-1 text-sm text-slate-500">
                                    Select the checks you want to execute.
                                </p>
                            </div>

                            <button
                                type="button"
                                onClick={toggleSelectAll}
                                className="inline-flex cursor-pointer items-center gap-2 text-sm font-medium text-slate-700 hover:text-slate-950"
                            >
                                <span
                                    className={`flex h-5 w-5 items-center justify-center rounded border ${
                                        allSelected
                                            ? "border-[#1f27b7] bg-[#1f27b7]"
                                            : "border-slate-300 bg-white"
                                    }`}
                                >
                                    {allSelected && (
                                        <Check className="h-3.5 w-3.5 text-white" />
                                    )}
                                    {someSelected && (
                                        <span className="h-0.5 w-2.5 rounded-sm bg-slate-600" />
                                    )}
                                </span>
                                Select All
                            </button>
                        </div>

                        {/* Test list */}
                        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                            {initialTests.map((test) => {
                                const selected = selectedTests.includes(test.id);

                                return (
                                    <label
                                        key={test.id}
                                        className="flex cursor-pointer items-center gap-4 rounded-lg border border-slate-200 bg-white px-4 py-3 transition hover:bg-slate-50"
                                    >
                                        <input
                                            type="checkbox"
                                            checked={selected}
                                            onChange={() => toggleTest(test.id)}
                                            className="sr-only"
                                        />

                                        <span
                                            className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border transition ${
                                                selected
                                                    ? "border-[#1f27b7] bg-[#1f27b7]"
                                                    : "border-slate-300 bg-white"
                                            }`}
                                        >
                                            {selected && (
                                                <Check className="h-3.5 w-3.5 text-white" />
                                            )}
                                        </span>

                                        <div className="min-w-0 flex-1">
                                            <h3 className="text-sm font-semibold text-slate-800">
                                                {test.name}
                                            </h3>
                                        </div>
                                    </label>
                                );
                            })}
                        </div>

                        {error && (
                            <div className="flex items-start gap-3 rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700">
                                <XCircle className="mt-0.5 h-4 w-4 shrink-0" />
                                <span>{error}</span>
                            </div>
                        )}

                        {/* Run */}
                        <div className="flex items-center justify-between border-t border-slate-200 pt-5">
                            <p className="text-sm text-slate-500">
                                {selectedTests.length} of {initialTests.length} tests
                                selected
                            </p>

                            <button
                                type="button"
                                onClick={runTests}
                                disabled={isRunning || selectedTests.length === 0}
                                className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                <Play className="h-4 w-4" />
                                {isRunning ? "Running Tests..." : "Run Security Tests"}
                            </button>
                        </div>
                    </section>
                )}

                {/* Results */}
                {currentStep === 2 && (
                    <section className="mt-8">
                        {/* Summary */}
                        <div className="grid gap-4 sm:grid-cols-3">
                            <div className="rounded-xl border border-emerald-300 bg-emerald-50 p-5">
                                <div className="flex items-center gap-3">
                                    <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                                    <div>
                                        <p className="text-sm text-slate-500">Passed</p>
                                        <p className="mt-1 text-2xl font-bold text-slate-900">
                                            {summary.passed}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="rounded-xl border border-red-300 bg-red-50 p-5">
                                <div className="flex items-center gap-3">
                                    <XCircle className="h-5 w-5 text-red-600" />
                                    <div>
                                        <p className="text-sm text-slate-500">Failed</p>
                                        <p className="mt-1 text-2xl font-bold text-slate-900">
                                            {summary.failed}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="rounded-xl border border-amber-300 bg-amber-50 p-5">
                                <div className="flex items-center gap-3">
                                    <AlertTriangle className="h-5 w-5 text-amber-600" />
                                    <div>
                                        <p className="text-sm text-slate-500">Warnings</p>
                                        <p className="mt-1 text-2xl font-bold text-slate-900">
                                            {summary.warning}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Result list */}
                        <div className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-[#f9f9f9]">
                            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">
                                <div>
                                    <h2 className="text-lg font-semibold text-slate-900">
                                        Test Results
                                    </h2>
                                    <p className="mt-1 text-sm text-slate-500">
                                        Results from the selected password policy
                                        checks. Click a row to see its individual test
                                        cases.
                                    </p>
                                </div>

                                <button
                                    type="button"
                                    onClick={resetTests}
                                    className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                                >
                                    <RotateCcw className="h-4 w-4" />
                                    Run Again
                                </button>
                            </div>

                            <div className="divide-y divide-slate-200">
                                {results.map((result) => {
                                    const isExpanded = expandedTests.includes(result.id);
                                    const cases = getCasesFor(result.id);

                                    const Icon =
                                        result.status === "passed"
                                            ? CheckCircle2
                                            : result.status === "failed"
                                              ? XCircle
                                              : CircleAlert;

                                    const iconColor =
                                        result.status === "passed"
                                            ? "text-emerald-600"
                                            : result.status === "failed"
                                              ? "text-red-600"
                                              : "text-amber-600";

                                    const badge =
                                        result.status === "passed"
                                            ? "bg-emerald-50 text-emerald-700"
                                            : result.status === "failed"
                                              ? "bg-red-50 text-red-700"
                                              : "bg-amber-50 text-amber-700";

                                    const label =
                                        result.status === "passed"
                                            ? "PASS"
                                            : result.status === "failed"
                                              ? "FAIL"
                                              : "WARNING";

                                    return (
                                        <div key={result.id} className="px-6 py-5">
                                            {/* Clickable header */}
                                            <div
                                                role="button"
                                                tabIndex={0}
                                                aria-expanded={isExpanded}
                                                onClick={() => toggleExpanded(result.id)}
                                                onKeyDown={(event) => {
                                                    if (
                                                        event.key === "Enter" ||
                                                        event.key === " "
                                                    ) {
                                                        event.preventDefault();
                                                        toggleExpanded(result.id);
                                                    }
                                                }}
                                                className="flex cursor-pointer items-start gap-4 rounded-lg transition hover:bg-slate-50"
                                            >
                                                <Icon
                                                    className={`mt-0.5 h-5 w-5 shrink-0 ${iconColor}`}
                                                />

                                                <div className="min-w-0 flex-1">
                                                    <div className="flex flex-wrap items-center gap-3">
                                                        <h3 className="font-semibold text-slate-900">
                                                            {result.name}
                                                        </h3>
                                                        <span
                                                            className={`rounded-full px-2.5 py-1 text-xs font-semibold ${badge}`}
                                                        >
                                                            {label}
                                                        </span>
                                                    </div>

                                                    <p className="mt-1 text-sm text-slate-500">
                                                        {result.description}
                                                    </p>

                                                    <p className="mt-3 text-sm leading-6 text-slate-700">
                                                        {result.details}
                                                    </p>
                                                </div>

                                                <ChevronDown
                                                    className={`mt-1 h-5 w-5 shrink-0 text-slate-500 transition-transform ${
                                                        isExpanded ? "rotate-180" : ""
                                                    }`}
                                                />
                                            </div>

                                            {/* Expanded test cases (works for every test) */}
                                            {isExpanded && (
                                                <div className="mt-5 border-t border-slate-200 pt-4">
                                                    <h4 className="mb-3 font-semibold text-slate-900">
                                                        Individual Test Cases
                                                    </h4>

                                                    {cases.length === 0 ? (
                                                        <p className="rounded-lg bg-slate-100 px-4 py-3 text-sm text-slate-500">
                                                            No individual test cases were
                                                            reported for this check.
                                                        </p>
                                                    ) : (
                                                        <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
                                                            <table className="w-full text-left text-sm">
                                                                <thead className="bg-slate-100 text-slate-600">
                                                                    <tr>
                                                                        <th className="px-3 py-3">
                                                                            Test Case
                                                                        </th>
                                                                        <th className="px-3 py-3">
                                                                            Length
                                                                        </th>
                                                                        <th className="px-3 py-3">
                                                                            Expected
                                                                        </th>
                                                                        <th className="px-3 py-3">
                                                                            Actual
                                                                        </th>
                                                                        <th className="px-3 py-3">
                                                                            Status
                                                                        </th>
                                                                    </tr>
                                                                </thead>

                                                                <tbody>
                                                                    {cases.map((testCase) => (
                                                                        <tr
                                                                            key={testCase.id}
                                                                            className="border-t border-slate-200"
                                                                        >
                                                                            <td className="px-3 py-3">
                                                                                {testCase.name}
                                                                            </td>
                                                                            <td className="px-3 py-3">
                                                                                {testCase.input_length}
                                                                            </td>
                                                                            <td className="px-3 py-3">
                                                                                {testCase.expected}
                                                                            </td>
                                                                            <td className="px-3 py-3">
                                                                                {testCase.actual}
                                                                            </td>
                                                                            <td className="px-3 py-3">
                                                                                <span
                                                                                    className={statusText(
                                                                                        testCase.status
                                                                                    )}
                                                                                >
                                                                                    {testCase.status.toUpperCase()}
                                                                                </span>
                                                                            </td>
                                                                        </tr>
                                                                    ))}
                                                                </tbody>
                                                            </table>
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </section>
                )}
            </div>
        </main>
    );
}
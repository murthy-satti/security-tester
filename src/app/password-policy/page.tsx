"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
    ArrowLeft,
    ArrowRight,
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
import { runPasswordPolicyTests } from "@/src/lib/tauri";

type TestStatus = "passed" | "failed" | "warning";

interface SecurityTest {
    id: string;
    name: string;
    description: string;
    status: TestStatus;
    details: string;
}

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


    const [currentStep, setCurrentStep] = useState<1 | 2>(1);
    const [results, setResults] = useState<SecurityTest[]>([]);
    const [isRunning, setIsRunning] = useState(false);




    const allSelected =
        selectedTests.length === initialTests.length;

    const someSelected =
        selectedTests.length > 0 &&
        selectedTests.length < initialTests.length;

    const toggleTest = (id: string) => {
        setSelectedTests((current) =>
            current.includes(id)
                ? current.filter((testId) => testId !== id)
                : [...current, id]
        );
    };

    const toggleSelectAll = () => {
        if (allSelected) {
            setSelectedTests([]);
        } else {
            setSelectedTests(initialTests.map((test) => test.id));
        }
    };

    const runTests = async () => {
        if (selectedTests.length === 0) {
            return;
        }

        setIsRunning(true);

        try {
            const rustResults = await runPasswordPolicyTests({
                endpoint,
                method,
                request_body: requestBody,
                username,
                email,
                selected_tests: selectedTests,
            });

            setResults(
                rustResults.map((result) => ({
                    ...result,
                    status: result.status.toLowerCase() as TestStatus,
                }))
            );

            setCurrentStep(2);
        } catch (error) {
            console.error("Password policy test failed:", error);
        } finally {
            setIsRunning(false);
        }
    };

    const resetTests = () => {
        setResults([]);
    };

    const summary = useMemo(() => {
        return {
            passed: results.filter((test) => test.status === "passed").length,
            failed: results.filter((test) => test.status === "failed").length,
            warning: results.filter((test) => test.status === "warning").length,
        };
    }, [results]);

    return (
        <main className="min-h-screen bg-white">
            <div className="mx-auto max-w-[95vw] space-y-5">

                {/* Header */}
                <section className="flex justify-between items-center">
                    <div className="flex items-center gap-4">

                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-slate-50">
                            <ShieldCheck className="h-6 w-6 text-slate-700" />
                        </div>

                        <div>
                            <h1 className="text-3xl font-bold tracking-tight text-slate-950">
                                Password Policy Testing
                            </h1>

                            <p className=" text-base leading-6 text-slate-500">
                                Test whether an application's password policy correctly
                                rejects weak and predictable passwords.
                            </p>
                        </div>

                    </div>


                    {/* Back */}
                    <Link
                        href="/"
                        className="inline-flex items-center gap-2 text-base font-medium text-slate-700 transition hover:text-slate-900"
                    >
                        <ArrowLeft className="h-5 w-5" />
                        Security Tests
                    </Link>

                </section>

                {/* stepper */}

                <div className="mt-8 flex items-center justify-center">
                    {/* Step 1 */}
                    <button
                        type="button"
                        onClick={() => setCurrentStep(1)}
                        className="flex items-center gap-3"
                    >
                        <span
                            className={`flex h-9 w-9 items-center justify-center rounded-full border text-sm font-semibold ${currentStep === 1
                                ? "border-[#1f27b7] bg-[#1f27b7] text-white"
                                : results.length > 0
                                    ? "border-emerald-500 bg-emerald-500 text-white"
                                    : "border-slate-300 bg-white text-slate-500"
                                }`}
                        >
                            {results.length > 0 ? "✓" : "1"}
                        </span>

                        <span className="text-left">
                            <span className="block text-sm font-semibold text-slate-900">
                                Configure Tests
                            </span>

                        </span>
                    </button>

                    {/* Connector */}
                    <div
                        className={`mx-6 h-px w-24 ${results.length > 0 ? "bg-emerald-500" : "bg-slate-300"
                            }`}
                    />

                    {/* Step 2 */}
                    <button
                        type="button"
                        disabled={results.length === 0}
                        onClick={() => setCurrentStep(2)}
                        className={`flex items-center gap-3 ${results.length === 0 ? "cursor-not-allowed opacity-70" : ""
                            }`}
                    >
                        <span
                            className={`flex h-9 w-9 items-center justify-center rounded-full border text-sm font-semibold ${currentStep === 2
                                ? "border-[#1f27b7] bg-[#1f27b7] text-white"
                                : results.length > 0
                                    ? "border-slate-300 bg-[#f6f6f6] text-slate-700"
                                    : "border-slate-300 bg-[#f6f6f6] text-slate-400"
                                }`}
                        >
                            2
                        </span>

                        <span className="text-left">
                            <span className="block text-sm font-semibold text-slate-900">
                                Test Results
                            </span>
                        </span>
                    </button>
                </div>

                {/* Configuration */}

                {currentStep === 1 && (
                    <section className="rounded-2xl border border-slate-300 bg-[#f6f6f6] px-5 py-4 space-y-3">

                        <h2 className="text-lg font-semibold text-slate-900">
                            Target Configuration
                        </h2>

                        <p className="mt-1 text-sm text-slate-500">
                            Configure the endpoint that will receive the generated
                            password test requests.
                        </p>

                        <div className=" mt-1 space-y-4">

                            {/* Endpoint + Method */}
                            <div className="grid gap-6 sm:grid-cols-[1fr_160px]">

                                <div>
                                    <label className="mb-2 block text-base font-medium text-slate-800">
                                        Registration Endpoint
                                    </label>

                                    <input
                                        type="url"
                                        value={endpoint}
                                        onChange={(event) => setEndpoint(event.target.value)}
                                        placeholder="https://example.com/api/register"
                                        className="bg-white w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none transition focus:border-slate-300 focus:ring-2 focus:ring-slate-100"
                                    />
                                </div>

                                <div>
                                    <label className="mb-2 block text-base font-medium text-slate-700">
                                        HTTP Method
                                    </label>

                                    <div className="relative">
                                        <select
                                            value={method}
                                            onChange={(event) => setMethod(event.target.value)}
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
                                    onChange={(event) => setRequestBody(event.target.value)}
                                    rows={7}
                                    spellCheck={false}
                                    className="w-full resize-none rounded-lg border border-slate-300 bg-slate-950 px-4 py-3 font-mono text-sm leading-6 text-slate-100 outline-none focus:border-slate-500"
                                />

                                <p className="mt-2 text-xs text-slate-500">
                                    Use {"{{username}}"}, {"{{email}}"} and {"{{password}}"} as
                                    dynamic test values.
                                </p>
                            </div>

                            {/* Test Identity */}
                            <div>
                                <h3 className="text-sm font-semibold text-slate-900">
                                    Test Identity
                                </h3>

                                <p className="mt-1 text-xs text-slate-500">
                                    These values identify the temporary test account used by
                                    the security checks.
                                </p>

                                <div className="mt-4 grid gap-6 sm:grid-cols-2">

                                    <div>
                                        <label className="mb-2 block text-base font-medium text-slate-700">
                                            Username
                                        </label>

                                        <input
                                            type="text"
                                            value={username}
                                            onChange={(event) => setUsername(event.target.value)}
                                            className="bg-white w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-100"
                                        />
                                    </div>

                                    <div>
                                        <label className="mb-2 block text-base font-medium text-slate-700">
                                            Email
                                        </label>

                                        <input
                                            type="email"
                                            value={email}
                                            onChange={(event) => setEmail(event.target.value)}
                                            className="bg-white w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-100"
                                        />
                                    </div>

                                </div>
                            </div>

                        </div>


                        <div className="flex items-center justify-between gap-4">

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
                                className="cursor-pointer inline-flex items-center gap-2 text-sm font-medium text-slate-700 hover:text-slate-950"
                            >
                                <span
                                    className={`flex h-5 w-5 items-center justify-center rounded border ${allSelected
                                        ? "border-[#1f27b7] bg-[#1f27b7]"
                                        : "border-slate-300 bg-white"
                                        }`}
                                >
                                    {allSelected && (
                                        <Check className="h-4 w-4 text-white font-bold" />
                                    )}

                                    {someSelected && (
                                        <span className="h-1.5 w-1.5 rounded-sm bg-slate-600" />
                                    )}
                                </span>

                                Select All
                            </button>

                        </div>


                        <div className="grid grid-cols-2">

                            {initialTests.map((test) => {
                                const selected = selectedTests.includes(test.id);

                                return (
                                    <label
                                        key={test.id}
                                        className="flex cursor-pointer items-center gap-4 px-6 py-3 transition hover:bg-slate-50"
                                    >

                                        <input
                                            type="checkbox"
                                            checked={selected}
                                            onChange={() => toggleTest(test.id)}
                                            className="sr-only"
                                        />

                                        <span
                                            className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border transition ${selected
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

                        {/* Run */}
                        <div className="flex items-center justify-between border-t border-slate-200 px-6 py-4">

                            <p className="text-sm text-slate-500">
                                {selectedTests.length} of {initialTests.length} tests selected
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
                                        <p className="text-sm text-slate-500">
                                            Passed
                                        </p>

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
                                        <p className="text-sm text-slate-500">
                                            Failed
                                        </p>

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
                                        <p className="text-sm text-slate-500">
                                            Warnings
                                        </p>

                                        <p className="mt-1 text-2xl font-bold text-slate-900">
                                            {summary.warning}
                                        </p>
                                    </div>
                                </div>
                            </div>

                        </div>

                        {/* Result List */}
                        <div className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-[#f9f9f9]">

                            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">

                                <div>
                                    <h2 className="text-lg font-semibold text-slate-900">
                                        Test Results
                                    </h2>

                                    <p className="mt-1 text-sm text-slate-500">
                                        Results from the selected password policy checks.
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
                                        <div
                                            key={result.id}
                                            className="px-6 py-5 transition hover:bg-slate-50"
                                        >
                                            <div className="flex items-start gap-4">

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

                                            </div>
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
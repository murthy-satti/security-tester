import {
  ShieldCheck,
  LockKeyhole,
  UserRoundCheck,
  Brackets,
  GlobeLock,
  KeyRound, ArrowUpRight
} from "lucide-react";

import Link from "next/link";

const tests = [
  {
    title: "Password Policy",
    description:
      "Evaluate password requirements such as length, complexity, common passwords, patterns, and username-derived passwords.",
    href: "/password-policy",
    icon: ShieldCheck,
  },
  {
    title: "Authentication",
    description:
      "Test authentication controls including login behavior, credential handling, account protection, and authentication flows.",
    href: "/authentication",
    icon: LockKeyhole,
  },
  {
    title: "Authorization",
    description:
      "Check access-control behavior and identify potential privilege and permission issues across application resources.",
    href: "/authorization",
    icon: UserRoundCheck,
  },
  {
    title: "Input Validation",
    description:
      "Evaluate how application inputs are validated, sanitized, and handled against malformed or unexpected data.",
    href: "/input-validation",
    icon: Brackets,
  },
  {
    title: "HTTP Security",
    description:
      "Inspect HTTP security configuration including security headers, transport protection, and related web controls.",
    href: "/http-security",
    icon: GlobeLock,
  },
  {
    title: "Session Security",
    description:
      "Evaluate session handling, session lifecycle, cookie configuration, expiration, and related security controls.",
    href: "/session-security",
    icon: KeyRound,
  },
];

export default function Home() {
  return (
    <main className="bg-white">
      {/* Header */}
      <section className="max-w-5xl">

        <h1 className="text-4xl font-bold tracking-tight text-slate-950">
          Security Testing

        </h1>

        <p className="mt-3 text-lg text-slate-500">
          Run focused security checks against your application and review
          exactly which scenarios pass, fail, or require attention.
        </p>
      </section>

      {/* Test cards */}
      <section className="mt-5">
        <div className="mb-6">
          <h2 className="text-2xl font-semibold text-slate-900">
            Security tests
          </h2>

          <p className="mt-1 text-base text-slate-500">
            Select a testing category to configure and run its checks.
          </p>
        </div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {tests.map((test) => {
            const Icon = test.icon;
            return (
              <Link
                key={test.href}
                href={test.href}
                className="group block rounded-2xl border border-slate-300 bg-[#F1F5FF] p-6 transition-all duration-200 hover:-translate-y-0.2 hover:border-slate-400 hover:shadow-lg"
              >
                {/* EEEEFF  */}
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-slate-300 bg-white">
                    <Icon className="h-5 w-5 text-slate-700" />
                  </div>

                  <h2 className="text-xl font-semibold text-slate-900">
                    {test.title}
                  </h2>
                </div>

                <div className="mt-3">
                  <p className="mt-2 text-md leading-6 text-slate-500">
                    {test.description}
                  </p>
                </div>

                <div className="mt-6 flex items-center text-sm font-medium text-slate-700">
                 <button className="bg-[#1f27b7] text-white px-4 py-2
                     rounded-lg textsize-sm font-medium shadow-lg
                     hover:bg-[#181fb0] transition-colors cursor-pointer">
                  Open test
                </button>
                </div>
 
              
              </Link>
            )
          }
          )}

        </div>
      </section>
    </main>
  );
}
"use client";

import { useEffect, useState } from "react";

type Category = "HR" | "Operations" | "Marketing";

type AgentTraceItem = {
  agent: string;
  output: string;
};

type AnalyzeResult = {
  summary: string;
  generated_plan: string;
  checklist: string[];
  draft_message: string;
  agent_trace: AgentTraceItem[];
};

const sections: Category[] = ["HR", "Operations", "Marketing"];

export default function Home() {
  const [connected, setConnected] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<Category>("HR");
  const [requestText, setRequestText] = useState("");
  const [result, setResult] = useState<AnalyzeResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let active = true;

    fetch("/api/health")
      .then((response) => {
        if (active) {
          setConnected(response.ok);
        }
      })
      .catch(() => {
        if (active) {
          setConnected(false);
        }
      });

    return () => {
      active = false;
    };
  }, []);

  async function runAgents() {
    const trimmedRequest = requestText.trim();

    if (!trimmedRequest || loading) {
      return;
    }

    setLoading(true);
    setError("");
    setCopied(false);

    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          category: selectedCategory,
          request: trimmedRequest,
        }),
      });

      if (!response.ok) {
        throw new Error("Analysis request failed");
      }

      const data = (await response.json()) as AnalyzeResult;
      setResult(data);
    } catch {
      setError("Unable to run agents right now. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function copyDraftMessage() {
    if (!result?.draft_message) {
      return;
    }

    await navigator.clipboard.writeText(result.draft_message);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  }

  return (
    <main className="min-h-screen bg-[#eef4f3]">
      <section className="flex min-h-screen flex-col">
        <header className="flex h-16 items-center justify-between border-b border-[#d3e2df] bg-white px-6 sm:px-8">
          <div>
            <p className="text-xs font-semibold uppercase text-[#0f9b8e]">
              MICAS
            </p>
            <h2 className="text-sm font-semibold text-[#07192f]">
              AssistOps
            </h2>
          </div>

          <div
            className={`flex items-center gap-2 rounded-full border px-3 py-1 text-sm font-medium ${
              connected
                ? "border-[#9edbd3] bg-[#e8f7f5] text-[#08766d]"
                : "border-[#f5d28a] bg-[#fff8e8] text-[#9a6815]"
            }`}
          >
            <span
              className={`h-2 w-2 rounded-full ${
                connected ? "bg-[#0f9b8e]" : "bg-[#f5b84b]"
              }`}
            />
            {connected ? "Backend connected" : "Backend unavailable"}
          </div>
        </header>

        <div className="flex flex-1 flex-col px-8 py-10">
          <div className="mx-auto w-full max-w-4xl text-center">
            <h1 className="text-4xl font-semibold text-[#07192f]">
              What can I help with?
            </h1>

            <div className="mx-auto mt-6 flex w-fit items-center gap-3 rounded-full border border-[#c6d9d5] bg-white px-4 py-2 shadow-sm shadow-[#0b2f4a]/5">
              <span className="text-xs font-semibold uppercase text-[#0f9b8e]">
                Team
              </span>
              <select
                aria-label="Select team"
                className="bg-transparent pr-8 text-sm font-semibold text-[#07192f] outline-none"
                onChange={(event) =>
                  setSelectedCategory(event.target.value as Category)
                }
                value={selectedCategory}
              >
                {sections.map((section) => (
                  <option key={section} value={section}>
                    {section}
                  </option>
                ))}
              </select>
            </div>

            <div className="mx-auto mt-7 flex h-16 w-full max-w-3xl items-center gap-2 rounded-full border border-[#c6d9d5] bg-white px-3 py-2 text-left shadow-sm shadow-[#0b2f4a]/5 focus-within:border-[#0f9b8e]">
              <input
                aria-label="Assistant request"
                className="h-full min-w-0 flex-1 rounded-full border border-transparent bg-transparent px-5 text-lg text-[#07192f] outline-none placeholder:text-[#8aa1a9]"
                onChange={(event) => setRequestText(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    void runAgents();
                  }
                }}
                placeholder="Ask MICAS anything..."
                type="search"
                value={requestText}
              />
              <button
                className="inline-flex h-11 shrink-0 items-center justify-center rounded-full bg-[#0f9b8e] px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#08766d] disabled:cursor-not-allowed disabled:bg-[#8aa1a9]"
                disabled={loading || !requestText.trim()}
                onClick={() => void runAgents()}
                type="button"
              >
                {loading ? "Analyzing..." : "Generate Plan"}
              </button>
            </div>

            {error ? (
              <p className="mt-3 text-sm font-medium text-red-600">{error}</p>
            ) : null}
          </div>

          {result ? (
            <div className="mx-auto mt-10 grid w-full max-w-6xl grid-cols-1 gap-5 xl:grid-cols-2">
              <ResultCard title="Summary">
                <p className="text-sm leading-6 text-[#28434f]">{result.summary}</p>
              </ResultCard>

              <ResultCard title="Generated Plan">
                <p className="text-sm leading-6 text-[#28434f]">
                  {result.generated_plan}
                </p>
              </ResultCard>

              <ResultCard title="Checklist">
                <ul className="space-y-3">
                  {result.checklist.map((item) => (
                    <li key={item} className="flex gap-3 text-sm text-[#28434f]">
                      <span className="mt-1 h-4 w-4 shrink-0 rounded-full border border-[#0f9b8e] bg-[#d9f2ee]" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </ResultCard>

              <ResultCard
                action={
                  <button
                    className="rounded-md border border-[#c6d9d5] px-3 py-1.5 text-xs font-semibold text-[#08766d] transition hover:bg-[#e8f7f5]"
                    onClick={() => void copyDraftMessage()}
                    type="button"
                  >
                    {copied ? "Copied" : "Copy"}
                  </button>
                }
                title="Draft Message"
              >
                <p className="text-sm leading-6 text-[#28434f]">
                  {result.draft_message}
                </p>
              </ResultCard>

              <div className="xl:col-span-2">
                <ResultCard title="Agent Trace">
                  <ol className="relative space-y-6 border-l border-[#9edbd3] pl-6">
                    {result.agent_trace.map((item, index) => (
                      <li key={item.agent} className="relative">
                        <span className="absolute -left-[31px] flex h-10 w-10 items-center justify-center rounded-full border border-[#9edbd3] bg-[#07192f] text-sm font-semibold text-white shadow-sm">
                          {index + 1}
                        </span>
                        <div className="rounded-md border border-[#d3e2df] bg-[#f8fbfa] px-4 py-3">
                          <h3 className="text-sm font-semibold text-[#07192f]">
                            {item.agent}
                          </h3>
                          <p className="mt-1 text-sm leading-6 text-[#28434f]">
                            {item.output}
                          </p>
                        </div>
                      </li>
                    ))}
                  </ol>
                </ResultCard>
              </div>
            </div>
          ) : (
            <div className="mx-auto mt-10 grid w-full max-w-6xl grid-cols-1 gap-4 md:grid-cols-3">
              {sections.map((section) => (
                <div
                  key={section}
                  className="rounded-lg border border-[#d3e2df] bg-white p-5 shadow-sm shadow-[#0b2f4a]/5"
                >
                  <p className="text-sm font-semibold text-[#07192f]">{section}</p>
                  <p className="mt-2 text-sm leading-6 text-[#516a73]">
                    Ready to turn a request into a mock agent plan.
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}

function ResultCard({
  action,
  children,
  title,
}: Readonly<{
  action?: React.ReactNode;
  children: React.ReactNode;
  title: string;
}>) {
  return (
    <section className="rounded-lg border border-[#d3e2df] bg-white p-5 text-left shadow-sm shadow-[#0b2f4a]/5">
      <div className="mb-4 flex items-center justify-between gap-4">
        <h2 className="text-sm font-semibold uppercase text-[#0f9b8e]">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  );
}

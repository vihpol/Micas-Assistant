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
    <main className="flex min-h-screen bg-[#f4f6f8]">
      <aside className="flex w-64 shrink-0 flex-col border-r border-gray-200 bg-white px-5 py-6">
        <div className="mb-8">
          <p className="text-sm font-semibold uppercase text-gray-500">
            MICAS
          </p>
          <h1 className="mt-1 text-xl font-semibold text-gray-950">
            AssistOps
          </h1>
        </div>

        <nav className="space-y-1">
          {sections.map((section) => (
            <button
              key={section}
              className={`w-full rounded-md px-3 py-2 text-left text-sm font-medium transition ${
                selectedCategory === section
                  ? "bg-gray-950 text-white shadow-sm"
                  : "text-gray-700 hover:bg-gray-100 hover:text-gray-950"
              }`}
              onClick={() => setSelectedCategory(section)}
              type="button"
            >
              {section}
            </button>
          ))}
        </nav>
      </aside>

      <section className="flex flex-1 flex-col">
        <header className="flex h-16 items-center justify-between border-b border-gray-200 bg-white px-8">
          <div>
            <p className="text-xs font-semibold uppercase text-gray-500">
              {selectedCategory}
            </p>
            <h2 className="text-sm font-semibold text-gray-950">
              Agent workspace
            </h2>
          </div>

          <div
            className={`flex items-center gap-2 rounded-full border px-3 py-1 text-sm font-medium ${
              connected
                ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                : "border-amber-200 bg-amber-50 text-amber-700"
            }`}
          >
            <span
              className={`h-2 w-2 rounded-full ${
                connected ? "bg-emerald-500" : "bg-amber-500"
              }`}
            />
            {connected ? "Backend connected" : "Backend unavailable"}
          </div>
        </header>

        <div className="flex flex-1 flex-col px-8 py-10">
          <div className="mx-auto w-full max-w-4xl text-center">
            <h1 className="text-4xl font-semibold text-gray-950">
              What can I help with?
            </h1>

            <div className="mt-7 rounded-lg border border-gray-200 bg-white p-3 text-left shadow-sm">
              <textarea
                aria-label="Assistant request"
                className="min-h-28 w-full resize-none rounded-md border border-transparent px-5 py-4 text-lg outline-none placeholder:text-gray-400 focus:border-gray-300"
                onChange={(event) => setRequestText(event.target.value)}
                onKeyDown={(event) => {
                  if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
                    void runAgents();
                  }
                }}
                placeholder={`Ask ${selectedCategory} agents to help with a workflow...`}
                value={requestText}
              />
            </div>

            {error ? (
              <p className="mt-3 text-sm font-medium text-red-600">{error}</p>
            ) : null}

            <button
              className="mt-5 inline-flex min-w-36 items-center justify-center rounded-md bg-gray-950 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:bg-gray-400"
              disabled={loading || !requestText.trim()}
              onClick={() => void runAgents()}
              type="button"
            >
              {loading ? "Running..." : "Run AI Agents"}
            </button>
          </div>

          {result ? (
            <div className="mx-auto mt-10 grid w-full max-w-6xl grid-cols-1 gap-5 xl:grid-cols-2">
              <ResultCard title="Summary">
                <p className="text-sm leading-6 text-gray-700">{result.summary}</p>
              </ResultCard>

              <ResultCard title="Generated Plan">
                <p className="text-sm leading-6 text-gray-700">
                  {result.generated_plan}
                </p>
              </ResultCard>

              <ResultCard title="Checklist">
                <ul className="space-y-3">
                  {result.checklist.map((item) => (
                    <li key={item} className="flex gap-3 text-sm text-gray-700">
                      <span className="mt-1 h-4 w-4 shrink-0 rounded-full border border-emerald-300 bg-emerald-100" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </ResultCard>

              <ResultCard
                action={
                  <button
                    className="rounded-md border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-700 transition hover:bg-gray-50"
                    onClick={() => void copyDraftMessage()}
                    type="button"
                  >
                    {copied ? "Copied" : "Copy"}
                  </button>
                }
                title="Draft Message"
              >
                <p className="text-sm leading-6 text-gray-700">
                  {result.draft_message}
                </p>
              </ResultCard>

              <div className="xl:col-span-2">
                <ResultCard title="Agent Trace">
                  <ol className="relative space-y-6 border-l border-gray-200 pl-6">
                    {result.agent_trace.map((item, index) => (
                      <li key={item.agent} className="relative">
                        <span className="absolute -left-[31px] flex h-10 w-10 items-center justify-center rounded-full border border-gray-200 bg-white text-sm font-semibold text-gray-950 shadow-sm">
                          {index + 1}
                        </span>
                        <div className="rounded-md border border-gray-200 bg-gray-50 px-4 py-3">
                          <h3 className="text-sm font-semibold text-gray-950">
                            {item.agent}
                          </h3>
                          <p className="mt-1 text-sm leading-6 text-gray-700">
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
                  className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm"
                >
                  <p className="text-sm font-semibold text-gray-950">{section}</p>
                  <p className="mt-2 text-sm leading-6 text-gray-600">
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
    <section className="rounded-lg border border-gray-200 bg-white p-5 text-left shadow-sm">
      <div className="mb-4 flex items-center justify-between gap-4">
        <h2 className="text-sm font-semibold uppercase text-gray-500">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  );
}

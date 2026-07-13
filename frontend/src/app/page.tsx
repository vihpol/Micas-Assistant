"use client";

import { useEffect, useState } from "react";

const sections = ["HR", "Operations", "Marketing"];

export default function Home() {
  const [connected, setConnected] = useState(false);

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

  return (
    <main className="flex min-h-screen bg-[#f6f7f9]">
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
              className="w-full rounded-md px-3 py-2 text-left text-sm font-medium text-gray-700 transition hover:bg-gray-100 hover:text-gray-950"
              type="button"
            >
              {section}
            </button>
          ))}
        </nav>
      </aside>

      <section className="flex flex-1 flex-col">
        <header className="flex h-16 items-center justify-end border-b border-gray-200 bg-white px-8">
          <div className="flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-sm font-medium text-emerald-700">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            {connected ? "Backend connected" : "Backend unavailable"}
          </div>
        </header>

        <div className="flex flex-1 items-center justify-center px-8 py-12">
          <div className="w-full max-w-3xl text-center">
            <h2 className="text-4xl font-semibold text-gray-950">
              What can I help with?
            </h2>

            <div className="mt-8 rounded-lg border border-gray-200 bg-white p-3 shadow-sm">
              <input
                aria-label="Assistant request"
                className="h-16 w-full rounded-md border border-transparent px-5 text-lg outline-none placeholder:text-gray-400 focus:border-gray-300"
                placeholder="Ask about HR, operations, or marketing workflows..."
                type="text"
              />
            </div>

            <button
              className="mt-5 rounded-md bg-gray-950 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-gray-800"
              type="button"
            >
              Run AI Agents
            </button>
          </div>
        </div>
      </section>
    </main>
  );
}

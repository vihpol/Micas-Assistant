"use client";

import Script from "next/script";
import { FormEvent, useEffect, useState } from "react";

type GeminiAnswer = {
  answer: string;
  model: string;
};

declare global {
  interface Window {
    google?: {
      search?: {
        cse?: {
          element?: {
            getElement?: (name: string) => {
              execute?: (query: string) => void;
            };
          };
        };
      };
    };
  }
}

const googleSearchEngineId = process.env.NEXT_PUBLIC_GOOGLE_CSE_ID;

export default function Home() {
  const [connected, setConnected] = useState(false);
  const [query, setQuery] = useState("");
  const [submittedQuery, setSubmittedQuery] = useState("");
  const [googleReady, setGoogleReady] = useState(false);
  const [answer, setAnswer] = useState<GeminiAnswer | null>(null);
  const [loadingAnswer, setLoadingAnswer] = useState(false);
  const [error, setError] = useState("");

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

  async function search(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const cleanQuery = query.trim();

    if (!cleanQuery) {
      return;
    }

    setSubmittedQuery(cleanQuery);
    setAnswer(null);
    setError("");
    executeGoogleSearch(cleanQuery);
    await askGemini(cleanQuery);
  }

  function executeGoogleSearch(cleanQuery: string) {
    const searchElement =
      window.google?.search?.cse?.element?.getElement?.("micas-results");
    searchElement?.execute?.(cleanQuery);
  }

  async function askGemini(cleanQuery: string) {
    setLoadingAnswer(true);

    try {
      const response = await fetch("/api/gemini-answer", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ query: cleanQuery }),
      });

      if (!response.ok) {
        const data = (await response.json().catch(() => null)) as
          | { detail?: string }
          | null;
        throw new Error(data?.detail ?? "Gemini request failed");
      }

      const data = (await response.json()) as GeminiAnswer;
      setAnswer(data);
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Gemini request failed.",
      );
    } finally {
      setLoadingAnswer(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#eef4f3] text-[#07192f]">
      {googleSearchEngineId ? (
        <Script
          async
          onLoad={() => setGoogleReady(true)}
          src={`https://cse.google.com/cse.js?cx=${googleSearchEngineId}`}
        />
      ) : null}

      <header className="border-b border-[#d3e2df] bg-white">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <div>
            <p className="text-xs font-semibold uppercase text-[#0f9b8e]">
              MICAS
            </p>
            <h1 className="text-sm font-semibold text-[#07192f]">
              Google + Gemini Search
            </h1>
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
            {connected ? "Search service online" : "Search service unavailable"}
          </div>
        </div>
      </header>

      <section className="mx-auto flex w-full max-w-6xl flex-col px-6 py-12">
        <div className="mx-auto w-full max-w-4xl text-center">
          <p className="text-sm font-semibold uppercase text-[#0f9b8e]">
            Google results with a Gemini answer layer
          </p>
          <h2 className="mt-3 text-4xl font-semibold text-[#07192f]">
            Search anything from one place
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-[#516a73]">
            Use Google Programmable Search for results and Gemini for a concise
            answer. This is not limited to internal department links.
          </p>

          <form
            className="mx-auto mt-8 flex h-16 w-full max-w-3xl items-center gap-2 rounded-full border border-[#0f9b8e] bg-white px-3 py-2 text-left shadow-sm shadow-[#0b2f4a]/5 focus-within:border-[#08766d]"
            onSubmit={search}
          >
            <input
              aria-label="Search with Google and Gemini"
              className="h-full min-w-0 flex-1 rounded-full border border-transparent bg-transparent px-5 text-lg text-[#07192f] outline-none placeholder:text-[#8aa1a9]"
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search Google with Gemini assistance..."
              type="search"
              value={query}
            />
            <button
              className="inline-flex h-11 shrink-0 items-center justify-center rounded-full bg-[#0f9b8e] px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#08766d] disabled:cursor-not-allowed disabled:bg-[#8aa1a9]"
              disabled={!query.trim() || loadingAnswer}
              type="submit"
            >
              {loadingAnswer ? "Searching..." : "Search"}
            </button>
          </form>
        </div>

        <section className="mt-10 grid grid-cols-1 gap-5 lg:grid-cols-[0.9fr_1.1fr]">
          <section className="rounded-lg border border-[#d3e2df] bg-white p-5 shadow-sm shadow-[#0b2f4a]/5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-sm font-semibold uppercase text-[#0f9b8e]">
                  Gemini Answer
                </h3>
                <p className="mt-1 text-sm text-[#516a73]">
                  Generated by the backend using `GEMINI_API_KEY`.
                </p>
              </div>
              {answer ? (
                <span className="rounded-full bg-[#e8f7f5] px-2.5 py-1 text-xs font-semibold text-[#08766d]">
                  {answer.model}
                </span>
              ) : null}
            </div>

            <div className="mt-5 rounded-md border border-[#e3eeeb] bg-[#f8fbfa] p-4">
              {loadingAnswer ? (
                <p className="text-sm leading-6 text-[#516a73]">
                  Gemini is preparing an answer...
                </p>
              ) : answer ? (
                <p className="whitespace-pre-line text-sm leading-6 text-[#28434f]">
                  {answer.answer}
                </p>
              ) : error ? (
                <p className="text-sm leading-6 text-[#9a6815]">{error}</p>
              ) : (
                <p className="text-sm leading-6 text-[#516a73]">
                  Enter a search above to ask Gemini for a concise answer. Google
                  results will appear beside it when the Programmable Search
                  engine ID is configured.
                </p>
              )}
            </div>
          </section>

          <section className="rounded-lg border border-[#d3e2df] bg-white p-5 shadow-sm shadow-[#0b2f4a]/5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-sm font-semibold uppercase text-[#0f9b8e]">
                  Google Programmable Search
                </h3>
                <p className="mt-1 text-sm text-[#516a73]">
                  Search results are rendered by Google&apos;s Programmable
                  Search element.
                </p>
              </div>
              <span
                className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                  googleSearchEngineId
                    ? "bg-[#e8f7f5] text-[#08766d]"
                    : "bg-[#fff8e8] text-[#9a6815]"
                }`}
              >
                {googleSearchEngineId ? "Configured" : "Needs engine ID"}
              </span>
            </div>

            <div className="mt-5 min-h-80 rounded-md border border-[#e3eeeb] bg-[#f8fbfa] p-4">
              {googleSearchEngineId ? (
                <>
                  {!googleReady && (
                    <p className="text-sm leading-6 text-[#516a73]">
                      Loading Google Programmable Search...
                    </p>
                  )}
                  <div className="gcse-searchresults-only" data-gname="micas-results" />
                  {!submittedQuery ? (
                    <p className="text-sm leading-6 text-[#516a73]">
                      Search above to load Google results here.
                    </p>
                  ) : null}
                </>
              ) : (
                <div>
                  <p className="text-sm leading-6 text-[#516a73]">
                    Add `NEXT_PUBLIC_GOOGLE_CSE_ID` to enable Google
                    Programmable Search results on this page.
                  </p>
                  <pre className="mt-4 overflow-x-auto rounded-md bg-[#07192f] p-4 text-xs text-white">
                    NEXT_PUBLIC_GOOGLE_CSE_ID=your_engine_id_here
                  </pre>
                </div>
              )}
            </div>
          </section>
        </section>
      </section>
    </main>
  );
}

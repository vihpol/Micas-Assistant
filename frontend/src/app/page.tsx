"use client";

import Script from "next/script";
import { FormEvent, useEffect, useMemo, useState } from "react";

type Department = "HR" | "Operations" | "Marketing";

type Resource = {
  title: string;
  department: Department | "Company";
  description: string;
  href: string;
  tags: string[];
};

type Announcement = {
  title: string;
  detail: string;
  department: Department | "Company";
};

const googleSearchEngineId = process.env.NEXT_PUBLIC_GOOGLE_CSE_ID;

const resources: Resource[] = [
  {
    title: "Employee Handbook",
    department: "HR",
    description: "Policies, benefits, time off, payroll, and workplace guidance.",
    href: "#employee-handbook",
    tags: ["benefits", "policy", "time off", "payroll", "handbook"],
  },
  {
    title: "Onboarding Checklist",
    department: "HR",
    description: "New-hire steps, equipment requests, access setup, and orientation links.",
    href: "#onboarding",
    tags: ["new hire", "orientation", "access", "equipment"],
  },
  {
    title: "Operations Requests",
    department: "Operations",
    description: "Submit facility, inventory, vendor, logistics, and workflow requests.",
    href: "#operations-requests",
    tags: ["inventory", "vendor", "facility", "logistics", "request"],
  },
  {
    title: "Standard Operating Procedures",
    department: "Operations",
    description: "Reference SOPs, recurring workflows, checklists, and escalation paths.",
    href: "#sops",
    tags: ["sop", "process", "workflow", "escalation"],
  },
  {
    title: "Brand Assets",
    department: "Marketing",
    description: "Approved logos, colors, templates, messaging, and campaign examples.",
    href: "#brand-assets",
    tags: ["logo", "template", "brand", "campaign", "copy"],
  },
  {
    title: "Marketing Intake Form",
    department: "Marketing",
    description: "Request campaign support, content, graphics, announcements, or web updates.",
    href: "#marketing-intake",
    tags: ["campaign", "content", "graphics", "announcement", "website"],
  },
  {
    title: "Company Directory",
    department: "Company",
    description: "Find teams, owners, shared inboxes, and department contacts.",
    href: "#directory",
    tags: ["people", "contacts", "teams", "owners"],
  },
  {
    title: "Forms and Approvals",
    department: "Company",
    description: "Common forms for requests, purchases, reimbursements, and approvals.",
    href: "#forms",
    tags: ["forms", "approval", "purchase", "reimbursement"],
  },
];

const announcements: Announcement[] = [
  {
    title: "Benefits enrollment window",
    detail: "HR resources and deadline reminders are pinned for quick access.",
    department: "HR",
  },
  {
    title: "Inventory count checklist updated",
    detail: "Operations added the latest count sheet and owner checklist.",
    department: "Operations",
  },
  {
    title: "New brand templates available",
    detail: "Marketing uploaded refreshed slide, flyer, and email layouts.",
    department: "Marketing",
  },
];

const quickLinks = [
  "Company Directory",
  "Forms and Approvals",
  "Employee Handbook",
  "Operations Requests",
  "Marketing Intake Form",
  "Standard Operating Procedures",
];

export default function Home() {
  const [connected, setConnected] = useState(false);
  const [query, setQuery] = useState("");
  const [submittedQuery, setSubmittedQuery] = useState("");
  const [searches, setSearches] = useState<string[]>([]);
  const [feedback, setFeedback] = useState("");
  const [feedbackSent, setFeedbackSent] = useState(false);

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

  const filteredResources = useMemo(() => {
    const normalizedQuery = submittedQuery.trim().toLowerCase();

    if (!normalizedQuery) {
      return resources.slice(0, 6);
    }

    return resources.filter((resource) => {
      const searchableText = [
        resource.title,
        resource.department,
        resource.description,
        ...resource.tags,
      ]
        .join(" ")
        .toLowerCase();

      return searchableText.includes(normalizedQuery);
    });
  }, [submittedQuery]);

  const zeroResultCount =
    submittedQuery && filteredResources.length === 0 ? 1 : 0;

  function runSearch(event?: FormEvent<HTMLFormElement>) {
    event?.preventDefault();
    const cleanQuery = query.trim();

    if (!cleanQuery) {
      return;
    }

    setSubmittedQuery(cleanQuery);
    setSearches((current) => [cleanQuery, ...current].slice(0, 8));
  }

  function chooseQuickLink(link: string) {
    setQuery(link);
    setSubmittedQuery(link);
    setSearches((current) => [link, ...current].slice(0, 8));
  }

  function submitFeedback(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!feedback.trim()) {
      return;
    }

    setFeedback("");
    setFeedbackSent(true);
    window.setTimeout(() => setFeedbackSent(false), 2200);
  }

  return (
    <main className="min-h-screen bg-[#eef4f3]">
      {googleSearchEngineId ? (
        <Script
          async
          src={`https://cse.google.com/cse.js?cx=${googleSearchEngineId}`}
        />
      ) : null}

      <header className="border-b border-[#d3e2df] bg-white">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
          <div>
            <p className="text-xs font-semibold uppercase text-[#0f9b8e]">
              MICAS
            </p>
            <h1 className="text-sm font-semibold text-[#07192f]">
              Internal Resource Hub
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
            {connected ? "Hub online" : "Hub status unavailable"}
          </div>
        </div>
      </header>

      <section className="mx-auto flex w-full max-w-7xl flex-col px-6 py-10">
        <div className="mx-auto w-full max-w-4xl text-center">
          <p className="text-sm font-semibold uppercase text-[#0f9b8e]">
            Search first. Ask less. Find faster.
          </p>
          <h2 className="mt-3 text-4xl font-semibold text-[#07192f]">
            One place for every department
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-[#516a73]">
            Find links, documents, forms, announcements, owners, and company
            resources across HR, Operations, Marketing, and shared teams.
          </p>

          <form
            className="mx-auto mt-8 flex h-16 w-full max-w-3xl items-center gap-2 rounded-full border border-[#c6d9d5] bg-white px-3 py-2 text-left shadow-sm shadow-[#0b2f4a]/5 focus-within:border-[#0f9b8e]"
            onSubmit={runSearch}
          >
            <input
              aria-label="Search company resources"
              className="h-full min-w-0 flex-1 rounded-full border border-transparent bg-transparent px-5 text-lg text-[#07192f] outline-none placeholder:text-[#8aa1a9]"
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search policies, forms, tools, owners..."
              type="search"
              value={query}
            />
            <button
              className="inline-flex h-11 shrink-0 items-center justify-center rounded-full bg-[#0f9b8e] px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#08766d] disabled:cursor-not-allowed disabled:bg-[#8aa1a9]"
              disabled={!query.trim()}
              type="submit"
            >
              Search
            </button>
          </form>

          <div className="mx-auto mt-4 flex max-w-3xl flex-wrap justify-center gap-2">
            {quickLinks.slice(0, 4).map((link) => (
              <button
                key={link}
                className="rounded-full border border-[#c6d9d5] bg-white px-3 py-1.5 text-sm font-medium text-[#28434f] transition hover:border-[#0f9b8e] hover:text-[#08766d]"
                onClick={() => chooseQuickLink(link)}
                type="button"
              >
                {link}
              </button>
            ))}
          </div>
        </div>

        {googleSearchEngineId ? (
          <section className="mx-auto mt-10 w-full max-w-5xl rounded-lg border border-[#d3e2df] bg-white p-5 shadow-sm shadow-[#0b2f4a]/5">
            <h3 className="text-sm font-semibold uppercase text-[#0f9b8e]">
              Google Search
            </h3>
            <div className="gcse-search mt-4" />
          </section>
        ) : (
          <section className="mx-auto mt-10 w-full max-w-5xl">
            <div className="mb-4 flex items-end justify-between gap-4">
              <div>
                <h3 className="text-sm font-semibold uppercase text-[#0f9b8e]">
                  Resource Results
                </h3>
                <p className="mt-1 text-sm text-[#516a73]">
                  Add `NEXT_PUBLIC_GOOGLE_CSE_ID` later to replace this with
                  embedded Google Programmable Search.
                </p>
              </div>
              {submittedQuery ? (
                <p className="text-sm font-medium text-[#516a73]">
                  {filteredResources.length} result
                  {filteredResources.length === 1 ? "" : "s"}
                </p>
              ) : null}
            </div>

            {filteredResources.length ? (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {filteredResources.map((resource) => (
                  <ResourceCard key={resource.title} resource={resource} />
                ))}
              </div>
            ) : (
              <div className="rounded-lg border border-[#d3e2df] bg-white p-6 shadow-sm shadow-[#0b2f4a]/5">
                <h4 className="text-base font-semibold text-[#07192f]">
                  No result found
                </h4>
                <p className="mt-2 text-sm leading-6 text-[#516a73]">
                  Capture this search as feedback so the right page, form, or
                  owner can be added to the hub.
                </p>
              </div>
            )}
          </section>
        )}

        <section className="mt-10 grid grid-cols-1 gap-5 lg:grid-cols-[1.4fr_0.8fr]">
          <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
            {(["HR", "Operations", "Marketing"] as Department[]).map(
              (department) => (
                <section
                  key={department}
                  className="rounded-lg border border-[#d3e2df] bg-white p-5 shadow-sm shadow-[#0b2f4a]/5"
                >
                  <h3 className="text-sm font-semibold uppercase text-[#0f9b8e]">
                    {department}
                  </h3>
                  <div className="mt-4 space-y-3">
                    {resources
                      .filter((resource) => resource.department === department)
                      .map((resource) => (
                        <a
                          key={resource.title}
                          className="block rounded-md border border-[#e3eeeb] bg-[#f8fbfa] px-3 py-3 text-left transition hover:border-[#0f9b8e]"
                          href={resource.href}
                        >
                          <span className="text-sm font-semibold text-[#07192f]">
                            {resource.title}
                          </span>
                          <span className="mt-1 block text-xs leading-5 text-[#516a73]">
                            {resource.description}
                          </span>
                        </a>
                      ))}
                  </div>
                </section>
              ),
            )}
          </div>

          <div className="space-y-5">
            <section className="rounded-lg border border-[#d3e2df] bg-white p-5 shadow-sm shadow-[#0b2f4a]/5">
              <h3 className="text-sm font-semibold uppercase text-[#0f9b8e]">
                Announcements
              </h3>
              <div className="mt-4 space-y-4">
                {announcements.map((announcement) => (
                  <article key={announcement.title}>
                    <p className="text-sm font-semibold text-[#07192f]">
                      {announcement.title}
                    </p>
                    <p className="mt-1 text-sm leading-6 text-[#516a73]">
                      {announcement.detail}
                    </p>
                  </article>
                ))}
              </div>
            </section>

            <section className="rounded-lg border border-[#d3e2df] bg-white p-5 shadow-sm shadow-[#0b2f4a]/5">
              <h3 className="text-sm font-semibold uppercase text-[#0f9b8e]">
                Adoption Signals
              </h3>
              <dl className="mt-4 grid grid-cols-3 gap-3">
                <Metric label="Searches" value={searches.length} />
                <Metric label="Zero result" value={zeroResultCount} />
                <Metric label="Resources" value={resources.length} />
              </dl>
              {searches.length ? (
                <div className="mt-4">
                  <p className="text-xs font-semibold uppercase text-[#516a73]">
                    Recent searches
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {searches.slice(0, 5).map((search, index) => (
                      <span
                        key={`${search}-${index}`}
                        className="rounded-full bg-[#e8f7f5] px-2.5 py-1 text-xs font-medium text-[#08766d]"
                      >
                        {search}
                      </span>
                    ))}
                  </div>
                </div>
              ) : null}
            </section>
          </div>
        </section>

        <section className="mt-10 grid grid-cols-1 gap-5 lg:grid-cols-[0.9fr_1.1fr]">
          <section className="rounded-lg border border-[#d3e2df] bg-white p-5 shadow-sm shadow-[#0b2f4a]/5">
            <h3 className="text-sm font-semibold uppercase text-[#0f9b8e]">
              Quick Links
            </h3>
            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
              {quickLinks.map((link) => (
                <button
                  key={link}
                  className="rounded-md border border-[#e3eeeb] bg-[#f8fbfa] px-3 py-3 text-left text-sm font-semibold text-[#07192f] transition hover:border-[#0f9b8e] hover:text-[#08766d]"
                  onClick={() => chooseQuickLink(link)}
                  type="button"
                >
                  {link}
                </button>
              ))}
            </div>
          </section>

          <section className="rounded-lg border border-[#d3e2df] bg-white p-5 shadow-sm shadow-[#0b2f4a]/5">
            <h3 className="text-sm font-semibold uppercase text-[#0f9b8e]">
              Missing Something?
            </h3>
            <form className="mt-4" onSubmit={submitFeedback}>
              <textarea
                className="min-h-28 w-full resize-none rounded-md border border-[#c6d9d5] bg-[#f8fbfa] px-4 py-3 text-sm leading-6 text-[#07192f] outline-none placeholder:text-[#8aa1a9] focus:border-[#0f9b8e]"
                onChange={(event) => setFeedback(event.target.value)}
                placeholder="Tell us what you searched for or what link should be added."
                value={feedback}
              />
              <div className="mt-3 flex items-center justify-between gap-4">
                <p className="text-sm text-[#516a73]">
                  Feedback helps turn failed searches into useful pages.
                </p>
                <button
                  className="rounded-md bg-[#07192f] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#12324a] disabled:cursor-not-allowed disabled:bg-[#8aa1a9]"
                  disabled={!feedback.trim()}
                  type="submit"
                >
                  Send
                </button>
              </div>
              {feedbackSent ? (
                <p className="mt-3 text-sm font-semibold text-[#08766d]">
                  Feedback captured for the hub team.
                </p>
              ) : null}
            </form>
          </section>
        </section>
      </section>
    </main>
  );
}

function ResourceCard({ resource }: Readonly<{ resource: Resource }>) {
  return (
    <a
      className="block rounded-lg border border-[#d3e2df] bg-white p-5 text-left shadow-sm shadow-[#0b2f4a]/5 transition hover:border-[#0f9b8e]"
      href={resource.href}
    >
      <div className="flex items-center justify-between gap-4">
        <h4 className="text-base font-semibold text-[#07192f]">
          {resource.title}
        </h4>
        <span className="rounded-full bg-[#e8f7f5] px-2.5 py-1 text-xs font-semibold text-[#08766d]">
          {resource.department}
        </span>
      </div>
      <p className="mt-2 text-sm leading-6 text-[#516a73]">
        {resource.description}
      </p>
    </a>
  );
}

function Metric({
  label,
  value,
}: Readonly<{ label: string; value: number }>) {
  return (
    <div className="rounded-md border border-[#e3eeeb] bg-[#f8fbfa] px-3 py-3">
      <dt className="text-xs font-semibold uppercase text-[#516a73]">
        {label}
      </dt>
      <dd className="mt-1 text-2xl font-semibold text-[#07192f]">{value}</dd>
    </div>
  );
}

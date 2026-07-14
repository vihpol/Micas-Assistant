import json
import os
import re
import urllib.error
import urllib.request
from typing import Literal

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel


Category = Literal["HR", "Operations", "Marketing"]
AGENT_NAMES = [
    "Analyzer Agent",
    "Specialist Agent",
    "Writer Agent",
    "Reviewer Agent",
]


class AnalyzeRequest(BaseModel):
    category: Category
    request: str


class AgentTraceItem(BaseModel):
    agent: str
    output: str


class AnalyzeResponse(BaseModel):
    summary: str
    generated_plan: str
    checklist: list[str]
    draft_message: str
    agent_trace: list[AgentTraceItem]


app = FastAPI(title="micas-assistops API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://192.168.1.174:3010",
    ],
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)

MOCK_ANALYSIS: dict[Category, AnalyzeResponse] = {
    "HR": AnalyzeResponse(
        summary="This looks like an HR request that needs clear employee-facing guidance and a careful follow-up path.",
        generated_plan="Clarify the employee need, identify the relevant policy or process owner, prepare a concise response, and route any sensitive details to HR leadership.",
        checklist=[
            "Confirm the employee group and urgency.",
            "Check the applicable HR policy or benefits guidance.",
            "Draft a response with next steps and escalation contact.",
            "Flag any confidential or compliance-sensitive details.",
        ],
        draft_message="Hi team, I reviewed the HR request and outlined the likely next steps. Please confirm the employee group and any timing constraints so HR can route this cleanly.",
        agent_trace=[
            AgentTraceItem(
                agent="Analyzer Agent",
                output="Detected an HR workflow involving policy guidance, employee communication, or people operations support.",
            ),
            AgentTraceItem(
                agent="Specialist Agent",
                output="Recommended checking policy context, confidentiality needs, and the correct HR owner before responding.",
            ),
            AgentTraceItem(
                agent="Writer Agent",
                output="Prepared a direct employee-facing draft with a request for missing details.",
            ),
            AgentTraceItem(
                agent="Reviewer Agent",
                output="Verified the message stays neutral, concise, and avoids making unsupported policy commitments.",
            ),
        ],
    ),
    "Operations": AnalyzeResponse(
        summary="This is an operations request that should be turned into an owner-driven execution plan with checkpoints.",
        generated_plan="Define the operational issue, assign an owner, capture blockers, set a target completion window, and track completion through a short status loop.",
        checklist=[
            "Identify the impacted workflow or site.",
            "Assign a single owner for the next action.",
            "List dependencies, blockers, and required resources.",
            "Set a check-in time and completion target.",
        ],
        draft_message="Hi team, I mapped the operations request into action items. Please confirm the owner, blocker list, and target completion time so we can keep the work moving.",
        agent_trace=[
            AgentTraceItem(
                agent="Analyzer Agent",
                output="Detected an operational coordination request with ownership, timing, and dependency needs.",
            ),
            AgentTraceItem(
                agent="Specialist Agent",
                output="Recommended converting the request into accountable tasks with status checkpoints.",
            ),
            AgentTraceItem(
                agent="Writer Agent",
                output="Prepared an operations update asking for owner, blockers, and timing confirmation.",
            ),
            AgentTraceItem(
                agent="Reviewer Agent",
                output="Checked that the plan is practical, minimal, and focused on execution.",
            ),
        ],
    ),
    "Marketing": AnalyzeResponse(
        summary="This is a marketing request that needs audience framing, channel selection, and a simple content plan.",
        generated_plan="Clarify the campaign goal, identify the audience, choose the primary channels, draft the message, and review the call to action before publishing.",
        checklist=[
            "Confirm campaign goal and audience.",
            "Choose the strongest channel for the message.",
            "Draft copy with a clear call to action.",
            "Review tone, timing, and brand fit.",
        ],
        draft_message="Hi team, I turned the marketing request into a lightweight campaign plan. Please confirm the target audience, primary channel, and desired call to action before we draft final copy.",
        agent_trace=[
            AgentTraceItem(
                agent="Analyzer Agent",
                output="Detected a marketing workflow involving audience, channel, copy, and campaign intent.",
            ),
            AgentTraceItem(
                agent="Specialist Agent",
                output="Recommended clarifying the goal and choosing channels before writing final content.",
            ),
            AgentTraceItem(
                agent="Writer Agent",
                output="Prepared a campaign coordination message with the key missing inputs.",
            ),
            AgentTraceItem(
                agent="Reviewer Agent",
                output="Verified the output is brand-safe, action-oriented, and easy to hand off.",
            ),
        ],
    ),
}

AGENT_PROMPTS = {
    "Analyzer Agent": "Summarize the request and identify the main objective in one concise sentence.",
    "Specialist Agent": "Create a practical plan for the department in two concise sentences.",
    "Writer Agent": "Draft a short professional message the team could send or adapt.",
    "Reviewer Agent": "Review the plan and return four checklist items separated by semicolons.",
}


def _fallback_response(category: Category, request: str) -> AnalyzeResponse:
    mock_response = MOCK_ANALYSIS[category].model_copy(deep=True)
    mock_response.summary = f"{mock_response.summary} Request received: {request}"
    return mock_response


def _extract_response_text(data: dict) -> str:
    if isinstance(data.get("output_text"), str):
        return data["output_text"].strip()

    output_parts = []
    for output_item in data.get("output", []):
        for content_item in output_item.get("content", []):
            text = content_item.get("text")
            if isinstance(text, str):
                output_parts.append(text)

    return " ".join(output_parts).strip()


def _call_openai_agent(
    *,
    agent: str,
    category: Category,
    request: str,
    context: list[AgentTraceItem],
) -> str:
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        raise RuntimeError("OPENAI_API_KEY is not configured")

    model = os.getenv("OPENAI_MODEL", "gpt-4.1-mini")
    prior_context = "\n".join(
        f"{item.agent}: {item.output}" for item in context
    ) or "No previous agent output yet."
    prompt = (
        f"You are the {agent} in a {category} assistant workflow.\n"
        f"Department: {category}\n"
        f"User request: {request}\n"
        f"Previous agent output:\n{prior_context}\n\n"
        f"Task: {AGENT_PROMPTS[agent]}\n"
        "Keep the output specific, useful, and under 60 words."
    )
    payload = {
        "model": model,
        "input": [
            {
                "role": "system",
                "content": "You are a concise internal operations assistant for MICAS.",
            },
            {"role": "user", "content": prompt},
        ],
        "max_output_tokens": 220,
    }
    request_data = json.dumps(payload).encode("utf-8")
    http_request = urllib.request.Request(
        "https://api.openai.com/v1/responses",
        data=request_data,
        headers={
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
        },
        method="POST",
    )

    with urllib.request.urlopen(http_request, timeout=30) as response:
        response_data = json.loads(response.read().decode("utf-8"))

    text = _extract_response_text(response_data)
    if not text:
        raise RuntimeError(f"{agent} returned an empty response")

    return text


def _call_ollama_agent(
    *,
    agent: str,
    category: Category,
    request: str,
    context: list[AgentTraceItem],
) -> str:
    base_url = os.getenv("OLLAMA_BASE_URL")
    if not base_url:
        raise RuntimeError("OLLAMA_BASE_URL is not configured")

    model = os.getenv("OLLAMA_MODEL", "tinyllama:latest")
    prior_context = "\n".join(
        f"{item.agent}: {item.output}" for item in context
    ) or "No previous agent output yet."
    prompt = (
        "You are a concise internal operations assistant for MICAS.\n"
        f"You are the {agent} in a {category} assistant workflow.\n"
        f"Department: {category}\n"
        f"User request: {request}\n"
        f"Previous agent output:\n{prior_context}\n\n"
        f"Task: {AGENT_PROMPTS[agent]}\n"
        "Keep the output specific, useful, and under 60 words."
    )
    payload = {
        "model": model,
        "prompt": prompt,
        "stream": False,
        "options": {
            "temperature": 0.3,
            "num_predict": 80,
        },
    }
    request_data = json.dumps(payload).encode("utf-8")
    http_request = urllib.request.Request(
        f"{base_url.rstrip('/')}/api/generate",
        data=request_data,
        headers={"Content-Type": "application/json"},
        method="POST",
    )

    with urllib.request.urlopen(http_request, timeout=180) as response:
        response_data = json.loads(response.read().decode("utf-8"))

    text = str(response_data.get("response", "")).strip()
    if not text:
        raise RuntimeError(f"{agent} returned an empty Ollama response")

    return text


def _call_ollama_coordinator(category: Category, request: str) -> str:
    base_url = os.getenv("OLLAMA_BASE_URL")
    if not base_url:
        raise RuntimeError("OLLAMA_BASE_URL is not configured")

    model = os.getenv("OLLAMA_MODEL", "tinyllama:latest")
    prompt = (
        "You are running a MICAS internal assistant workflow. "
        "Simulate four agents. Answer the user's request directly. "
        "Do not mention formatting rules, labels, or word counts.\n"
        f"Department: {category}\n"
        f"User request: {request}\n\n"
        "Complete these four lines with useful content:\n"
        "ANALYZER: identify the main business need\n"
        "SPECIALIST: recommend the next practical steps\n"
        "WRITER: write a short team message\n"
        "REVIEWER: checklist item; checklist item; checklist item; checklist item"
    )
    payload = {
        "model": model,
        "prompt": prompt,
        "stream": False,
        "options": {
            "temperature": 0.2,
            "num_predict": 140,
        },
    }
    request_data = json.dumps(payload).encode("utf-8")
    http_request = urllib.request.Request(
        f"{base_url.rstrip('/')}/api/generate",
        data=request_data,
        headers={"Content-Type": "application/json"},
        method="POST",
    )

    with urllib.request.urlopen(http_request, timeout=240) as response:
        response_data = json.loads(response.read().decode("utf-8"))

    text = str(response_data.get("response", "")).strip()
    if not text:
        raise RuntimeError("Ollama coordinator returned an empty response")

    return text


def _parse_labeled_output(text: str) -> dict[str, str]:
    labels = {
        "ANALYZER": "",
        "SPECIALIST": "",
        "WRITER": "",
        "REVIEWER": "",
    }
    current_label = ""

    for raw_line in text.splitlines():
        line = raw_line.strip()
        if not line:
            continue

        upper_line = line.upper()
        matched_label = next(
            (label for label in labels if upper_line.startswith(f"{label}:")),
            "",
        )
        if matched_label:
            current_label = matched_label
            labels[current_label] = line.split(":", 1)[1].strip()
        elif current_label:
            labels[current_label] = f"{labels[current_label]} {line}".strip()

    return labels


def _clean_agent_output(text: str) -> str:
    return text.strip().strip('"').strip("'").strip()


def _run_ollama_workflow(category: Category, request: str) -> AnalyzeResponse:
    raw_output = _call_ollama_coordinator(category, request)
    parsed = _parse_labeled_output(raw_output)
    fallback = MOCK_ANALYSIS[category]
    raw_output = _clean_agent_output(raw_output)
    if raw_output and not any(parsed.values()):
        return AnalyzeResponse(
            summary=raw_output,
            generated_plan=fallback.generated_plan,
            checklist=fallback.checklist,
            draft_message=fallback.draft_message,
            agent_trace=[
                AgentTraceItem(agent="Analyzer Agent", output=raw_output),
                AgentTraceItem(
                    agent="Specialist Agent", output=fallback.generated_plan
                ),
                AgentTraceItem(agent="Writer Agent", output=fallback.draft_message),
                AgentTraceItem(
                    agent="Reviewer Agent", output=fallback.agent_trace[3].output
                ),
            ],
        )

    summary = _clean_agent_output(parsed["ANALYZER"]) or fallback.summary
    generated_plan = _clean_agent_output(parsed["SPECIALIST"]) or fallback.generated_plan
    draft_message = _clean_agent_output(parsed["WRITER"]) or fallback.draft_message
    reviewer_output = (
        _clean_agent_output(parsed["REVIEWER"]) or fallback.agent_trace[3].output
    )

    return AnalyzeResponse(
        summary=summary,
        generated_plan=generated_plan,
        checklist=_extract_checklist(reviewer_output, fallback.checklist),
        draft_message=draft_message,
        agent_trace=[
            AgentTraceItem(agent="Analyzer Agent", output=summary),
            AgentTraceItem(agent="Specialist Agent", output=generated_plan),
            AgentTraceItem(agent="Writer Agent", output=draft_message),
            AgentTraceItem(agent="Reviewer Agent", output=reviewer_output),
        ],
    )


def _call_openai_workflow_agent(
    *,
    agent: str,
    category: Category,
    request: str,
    context: list[AgentTraceItem],
) -> str:
    return _call_openai_agent(
        agent=agent,
        category=category,
        request=request,
        context=context,
    )


def _extract_checklist(reviewer_output: str, fallback: list[str]) -> list[str]:
    normalized = reviewer_output.replace("\n", ";")
    items = [
        _clean_agent_output(item.strip(" -0123456789.)"))
        for item in re.split(r";|(?:^|\s+)\d+[.)]\s+", normalized)
        if item.strip(" -0123456789.)")
    ]

    return items[:4] if len(items) >= 3 else fallback


def _run_llm_workflow(category: Category, request: str) -> AnalyzeResponse:
    if not os.getenv("OPENAI_API_KEY"):
        return _run_ollama_workflow(category, request)

    agent_trace: list[AgentTraceItem] = []

    for agent in AGENT_NAMES:
        output = _call_openai_workflow_agent(
            agent=agent,
            category=category,
            request=request,
            context=agent_trace,
        )
        agent_trace.append(AgentTraceItem(agent=agent, output=output))

    fallback = MOCK_ANALYSIS[category]
    return AnalyzeResponse(
        summary=agent_trace[0].output,
        generated_plan=agent_trace[1].output,
        checklist=_extract_checklist(agent_trace[3].output, fallback.checklist),
        draft_message=agent_trace[2].output,
        agent_trace=agent_trace,
    )


def run_hr_workflow(request: str) -> AnalyzeResponse:
    try:
        return _run_llm_workflow("HR", request)
    except (
        RuntimeError,
        urllib.error.URLError,
        urllib.error.HTTPError,
        TimeoutError,
    ):
        return _fallback_response("HR", request)


def run_operations_workflow(request: str) -> AnalyzeResponse:
    try:
        return _run_llm_workflow("Operations", request)
    except (
        RuntimeError,
        urllib.error.URLError,
        urllib.error.HTTPError,
        TimeoutError,
    ):
        return _fallback_response("Operations", request)


def run_marketing_workflow(request: str) -> AnalyzeResponse:
    try:
        return _run_llm_workflow("Marketing", request)
    except (
        RuntimeError,
        urllib.error.URLError,
        urllib.error.HTTPError,
        TimeoutError,
    ):
        return _fallback_response("Marketing", request)


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.post("/analyze", response_model=AnalyzeResponse)
def analyze(payload: AnalyzeRequest) -> AnalyzeResponse:
    workflows = {
        "HR": run_hr_workflow,
        "Operations": run_operations_workflow,
        "Marketing": run_marketing_workflow,
    }
    return workflows[payload.category](payload.request)

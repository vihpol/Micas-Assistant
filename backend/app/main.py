from typing import Literal

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel


Category = Literal["HR", "Operations", "Marketing"]


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


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.post("/analyze", response_model=AnalyzeResponse)
def analyze(payload: AnalyzeRequest) -> AnalyzeResponse:
    mock_response = MOCK_ANALYSIS[payload.category].model_copy(deep=True)
    mock_response.summary = f"{mock_response.summary} Request received: {payload.request}"
    return mock_response

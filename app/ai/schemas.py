from typing import Literal

from pydantic import BaseModel, Field

Section = Literal[
    "requiretments and support",
    "services and solutions",
    "returns-and-warranty",
    "shipping",
    "other",
]


class Classification(BaseModel):
    section: Section
    language: str = Field(
        description="Language of the latest customer message, e.g. Indonesian, English"
    )
    needs_human: bool = Field(description="True when an always-escalate rule applies")
    reason: str = Field(description="One sentence explaining the classification")
    acknowledgement: str = Field(
        description="Short note to the customer, in their language, that a colleague replies"
    )


class Issue(BaseModel):
    product: Literal[
        "web-development",
        "ai-powered-systems",
        "business-process-automation",
    ]

    problem: Literal[
        # Web Development
        "website-not-accessible",
        "website-bug",
        "deployment-failed",
        "website-performance-issue",
        # AI-Powered Systems
        "ai-not-responding",
        "ai-incorrect-response",
        "document-processing-error",
        "knowledge-base-error",
        # Business Process Automation
        "automation-not-triggering",
        "automation-failed",
        "integration-error",
        "data-synchronization-error",
        # General Technical Issues
        "access-permission-issue",
        "feature-not-working",
        "other",
    ]

    project_id: str | None = Field(
        default=None, description="Unique project identifier, if available"
    )

    customer_name: str | None = Field(
        default=None, description="Name of the customer or business"
    )

    description: str = Field(description="Detailed explanation of the reported issue")

    error_message: str | None = Field(
        default=None, description="Technical error message, if available"
    )

    affected_feature: str | None = Field(
        default=None,
        description="Specific website page, AI feature, or automation workflow affected",
    )

    screenshot_url: str | None = Field(
        default=None,
        description="Link to a screenshot or supporting evidence, if available",
    )

    days_since_handover: int | None = Field(
        default=None,
        ge=0,
        description="Number of days since the project was officially delivered or handed over",
    )

    issue_status: Literal[
        "reported",
        "investigating",
        "in-progress",
        "resolved",
        "closed",
    ] = "reported"

    severity: Literal[
        "low",
        "medium",
        "high",
        "critical",
    ] = "medium"

    requires_human_review: bool = Field(
        default=True,
        description="Whether the issue requires review by the Olahtek team",
    )


class AgentReply(BaseModel):
    action: Literal["reply", "escalate"]
    reply: str = Field(description="The email to the customer, plain text")
    reasoning: str = Field(description="Which knowledge base entries you used, and why")
    enough_information: bool = Field(
        description="True when the knowledge base answers the question"
    )
    promises_an_action: bool = Field(
        description="True when the reply promises a refund, shipment, replacement, date, or call"
    )
    issue: Issue | None = Field(
        default=None,
        description="Fill in when the customer reports a problem with a product",
    )


class Decision(BaseModel):
    action: Literal["reply", "escalate"]
    section: str
    reply: str
    reason: str
    proposed_action: str | None = None

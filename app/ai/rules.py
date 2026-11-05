from app.ai.schemas import Issue


# Steps where the customer needs to provide additional information.
CUSTOMER_STEPS = {"ask-details"}


def resolve_issue(issue: Issue) -> str:
    """
    Decide the next step for a reported technical issue.
    The model classifies the issue; Python determines the next action.
    """

    # Issues requiring human review should be escalated.
    if issue.requires_human_review or issue.severity in {"high", "critical"}:
        return "escalate"

    # A project ID is needed to identify the customer's project.
    if not issue.project_id:
        return "ask-details"

    # A description is required to understand the reported issue.
    if not issue.description.strip():
        return "ask-details"

    return next_step(issue)


def next_step(issue: Issue) -> str:
    """
    Route the issue according to the Olahtek service and problem type.
    """

    # Web Development
    if issue.product == "web-development":
        if issue.problem == "website-not-accessible":
            return "investigate-website"

        if issue.problem == "website-bug":
            return "investigate-website"

        if issue.problem == "deployment-failed":
            return "review-deployment"

        if issue.problem == "website-performance-issue":
            return "investigate-performance"

    # AI-Powered Systems
    if issue.product == "ai-powered-systems":
        if issue.problem == "ai-not-responding":
            return "investigate-ai-system"

        if issue.problem == "ai-incorrect-response":
            return "review-ai-response"

        if issue.problem == "document-processing-error":
            return "investigate-document-processing"

        if issue.problem == "knowledge-base-error":
            return "review-knowledge-base"

    # Business Process Automation
    if issue.product == "business-process-automation":
        if issue.problem == "automation-not-triggering":
            return "investigate-automation"

        if issue.problem == "automation-failed":
            return "investigate-automation"

        if issue.problem == "integration-error":
            return "investigate-integration"

        if issue.problem == "data-synchronization-error":
            return "investigate-data-sync"

    # General Technical Issues
    if issue.problem == "access-permission-issue":
        return "review-access"

    if issue.problem == "feature-not-working":
        return "investigate-feature"

    # Unknown or unsupported issues require human review.
    return "escalate"

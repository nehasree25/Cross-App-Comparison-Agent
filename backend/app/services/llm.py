from langchain_groq import ChatGroq

from app.core.config import settings


def get_groq_llm() -> ChatGroq:
    """Create the configured Groq chat model for the agent layer."""

    if not settings.groq_api_key:
        raise RuntimeError(
            "GROQ_API_KEY must be set before creating the Groq LLM."
        )

    return ChatGroq(
        api_key=settings.groq_api_key,
        model=settings.groq_model,
        temperature=0,
    )
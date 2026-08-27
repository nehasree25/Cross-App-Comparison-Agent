from collections.abc import Sequence
from typing import Any

from langchain.agents import AgentExecutor, create_tool_calling_agent
from langchain_core.language_models import BaseChatModel
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain_core.tools import BaseTool
from sqlalchemy.orm import Session

from app.agents.prompts import PRODUCT_AGENT_SYSTEM_PROMPT
from app.services.llm import get_groq_llm
from app.tools.comparison import create_compare_products_tool
from app.tools.merchant_search import create_search_merchant_products_tool
from app.tools.product_search import create_search_products_tool
from app.tools.ranking import create_rank_products_tool


def create_product_agent(
    db: Session,
    llm: BaseChatModel | None = None,
) -> AgentExecutor:
    """Create a bounded product agent with a database-bound search tool."""

    model = llm or get_groq_llm()
    tools: Sequence[BaseTool] = [
        create_search_products_tool(db),
        create_search_merchant_products_tool(db),
        create_compare_products_tool(db),
        create_rank_products_tool(db),
    ]
    prompt = ChatPromptTemplate.from_messages(
        [
            ("system", PRODUCT_AGENT_SYSTEM_PROMPT),
            ("human", "{input}"),
            MessagesPlaceholder(variable_name="agent_scratchpad"),
        ]
    )
    agent = create_tool_calling_agent(model, tools, prompt)

    return AgentExecutor(
        agent=agent,
        tools=list(tools),
        max_iterations=6,
        handle_parsing_errors=True,
        return_intermediate_steps=True,
    )


def run_product_agent(
    db: Session,
    message: str,
    llm: BaseChatModel | None = None,
) -> dict[str, Any]:
    """Run the product agent and return its final answer plus execution trace."""

    if not message or not message.strip():
        raise ValueError("message must not be empty")

    return create_product_agent(db, llm).invoke({"input": message.strip()})
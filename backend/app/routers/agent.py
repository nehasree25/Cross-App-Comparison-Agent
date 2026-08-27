from collections.abc import Mapping
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, status
from langchain_core.tools import ToolException
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session

from app.agents.agent import run_product_agent
from app.database import get_db
from app.models.user import User
from app.routers.auth import get_current_user
from app.schemas.agent import AgentChatRequest, AgentChatResponse
from app.schemas.product import ProductResult

router = APIRouter(prefix="/api/agent", tags=["agent"])


@router.post("/chat", response_model=AgentChatResponse)
def chat(
    request: AgentChatRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> AgentChatResponse:
    del current_user

    try:
        result = run_product_agent(db, request.message)
    except ValueError as error:
        raise HTTPException(status_code=400, detail=str(error)) from error
    except (SQLAlchemyError, ToolException, RuntimeError) as error:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="The product agent is temporarily unavailable.",
        ) from error

    return AgentChatResponse(
        message=result.get("output", "I could not generate a recommendation."),
        products=_products_from_agent_result(result),
    )


def _products_from_agent_result(result: Mapping[str, Any]) -> list[ProductResult]:
    products: list[ProductResult] = []
    seen_ids: set[str] = set()

    for _, observation in result.get("intermediate_steps", []):
        if not isinstance(observation, list):
            continue
        for item in observation:
            candidate = item.get("product", item) if isinstance(item, dict) else None
            if not isinstance(candidate, dict):
                continue
            try:
                product = ProductResult.model_validate(candidate)
            except ValueError:
                continue
            if product.product_id not in seen_ids:
                seen_ids.add(product.product_id)
                products.append(product)

    return products
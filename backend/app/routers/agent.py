from collections.abc import Mapping
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, status
from langchain_core.tools import ToolException
from sqlalchemy import select
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session

from app.agents.agent import run_product_agent
from app.database import get_db
from app.models.comparison_session import ComparisonSession
from app.models.user import User
from app.routers.auth import get_current_user
from app.schemas.agent import AgentChatRequest, AgentChatResponse
from app.schemas.comparison import ComparisonSessionRead
from app.schemas.product import ProductResult, ProductSearchParams

router = APIRouter(prefix="/api", tags=["agent"])


@router.post("/compare", response_model=AgentChatResponse)
def chat(
    request: AgentChatRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> AgentChatResponse:
    try:
        result = run_product_agent(db, request.message)
    except ValueError as error:
        raise HTTPException(status_code=400, detail=str(error)) from error
    except (SQLAlchemyError, ToolException, RuntimeError) as error:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="The product agent is temporarily unavailable.",
        ) from error

    products = _products_from_agent_result(result)
    product_ids = list(dict.fromkeys(product.product_id for product in products))
    category = products[0].category if products else (
        ProductSearchParams(query=request.message).category or "Unknown"
    )
    db.add(
        ComparisonSession(
            user_id=current_user.id,
            user_query=request.message,
            category=category,
            product_ids=product_ids,
            product_count=len(product_ids),
        )
    )
    try:
        db.commit()
    except SQLAlchemyError as error:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="The comparison history service is temporarily unavailable.",
        ) from error

    return AgentChatResponse(
        message=result.get("output", "I could not generate a recommendation."),
        products=products,
    )


@router.get("/comparisons", response_model=list[ComparisonSessionRead])
def comparison_history(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> list[ComparisonSession]:
    return db.scalars(
        select(ComparisonSession)
        .where(ComparisonSession.user_id == current_user.id)
        .order_by(ComparisonSession.created_at.desc())
    ).all()


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
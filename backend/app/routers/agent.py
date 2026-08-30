from collections.abc import Mapping
import re
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
from app.schemas.agent import AgentChatRequest, AgentChatResponse, RecommendedProduct
from app.schemas.comparison import ComparisonSessionRead
from app.schemas.product import ProductResult, ProductSearchParams
from app.services.recommendation import select_best_product

router = APIRouter(prefix="/api", tags=["agent"])


@router.post("/recommendations", response_model=AgentChatResponse)
def chat(
    request: AgentChatRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> AgentChatResponse:
    if _requests_unsupported_price_ranking(request.message):
        return AgentChatResponse(
            message=(
                "Sorry, costliest/most expensive product recommendations "
                "are not currently supported."
            ),
            recommended_product=None,
            recommendation_reason=None,
            products=[],
        )

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

    # Select best product from returned results
    recommended_product, recommendation_reason = select_best_product(
        products, request.message
    )
    
    # CRITICAL: Log if we have products but no recommendation
    if products and not recommended_product:
        import logging as logging_module
        logger_critical = logging_module.getLogger(__name__)
        logger_critical.error(f"CRITICAL: {len(products)} products but NO RECOMMENDATION | Query='{request.message}'")
    
    return AgentChatResponse(
        message=result.get("output", "I could not generate a recommendation."),
        recommended_product=recommended_product,
        recommendation_reason=recommendation_reason,
        products=products,
    )


@router.get("/comparison-history", response_model=list[ComparisonSessionRead])
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
    """Extract products from agent intermediate steps with detailed logging."""
    products: list[ProductResult] = []
    seen_ids: set[str] = set()
    
    import logging
    logger = logging.getLogger(__name__)
    
    intermediate_steps = result.get("intermediate_steps", [])
    logger.info(f"Extracting products from {len(intermediate_steps)} intermediate steps")
    logger.debug(f"Full result keys: {result.keys()}")

    for idx, step in enumerate(intermediate_steps):
        logger.debug(f"Step {idx}: type={type(step)}, len={len(step) if isinstance(step, (list, tuple)) else 'N/A'}")
        
        if not isinstance(step, (tuple, list)) or len(step) != 2:
            logger.debug(f"Step {idx}: not a 2-tuple, skipping")
            continue
        
        action, observation = step
        tool_name = getattr(action, 'tool', 'unknown')
        logger.debug(f"Step {idx}: action_tool={tool_name}, observation_type={type(observation).__name__}")
        
        if not isinstance(observation, list):
            logger.debug(f"Step {idx}: observation is not a list (got {type(observation).__name__}), skipping")
            continue
        
        logger.debug(f"Step {idx}: processing {len(observation)} observation items")
        
        for item_idx, item in enumerate(observation):
            logger.debug(f"  Item {item_idx}: type={type(item).__name__}, keys={item.keys() if isinstance(item, dict) else 'N/A'}")
            
            candidate = item.get("product", item) if isinstance(item, dict) else None
            
            if not isinstance(candidate, dict):
                logger.debug(f"    Candidate type={type(candidate).__name__}, not extracting")
                continue
            
            logger.debug(f"    Candidate keys: {list(candidate.keys())[:5]}...")  # Log first 5 keys
            
            try:
                product = ProductResult.model_validate(candidate)
                if product.product_id not in seen_ids:
                    seen_ids.add(product.product_id)
                    products.append(product)
                    logger.info(f"  ✓ Extracted product: {product.product_id} ({product.name})")
                else:
                    logger.debug(f"    ✗ Duplicate product: {product.product_id}")
            except ValueError as e:
                logger.warning(f"    ✗ Validation failed for item {item_idx}: {str(e)[:100]}")
                continue

    logger.info(f"TOTAL PRODUCTS EXTRACTED: {len(products)}")
    for p in products:
        logger.debug(f"  - {p.product_id}: {p.name} | ₹{p.final_price} | Rating: {p.rating}")
    
    return products


def _requests_unsupported_price_ranking(message: str) -> bool:
    return bool(
        re.search(
            r"\b(?:costliest|most\s+expensive|highest\s+priced|maximum\s+price|most\s+costly)\b",
            message,
            re.IGNORECASE,
        )
    )


def _recommended_product_from_agent_result(
    result: Mapping[str, Any],
) -> RecommendedProduct | None:
    for action, observation in reversed(result.get("intermediate_steps", [])):
        if getattr(action, "tool", None) != "rank_products":
            continue
        if not isinstance(observation, list) or not observation:
            return None
        candidate = observation[0]
        if not isinstance(candidate, dict):
            return None
        try:
            product = ProductResult.model_validate(candidate.get("product", candidate))
        except ValueError:
            return None
        return RecommendedProduct(
            product_id=product.product_id,
            merchant=product.merchant,
            name=product.name,
            brand=product.brand,
            final_price=str(product.final_price),
            currency=product.currency,
            availability=product.availability,
            rating=str(product.rating),
            delivery_days=product.delivery_days,
        )
    return None
from typing import Any

from langchain_core.tools import StructuredTool, ToolException, tool
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session

from app.schemas.product import ProductRankingParams
from app.services.product_service import ProductService, product_service


def create_rank_products_tool(
    db: Session,
    service: ProductService = product_service,
) -> StructuredTool:
    """Create a tool that ranks authoritative products by a stated preference."""

    @tool("rank_products", args_schema=ProductRankingParams)
    def rank_products(
        product_ids: list[str], preference: str
    ) -> list[dict[str, Any]]:
        """Rank selected products as cheapest, best value, highest rated, or fastest delivery."""

        try:
            params = ProductRankingParams(
                product_ids=product_ids,
                preference=preference,
            )
            return service.rank_products(
                db, params.product_ids, params.preference.value
            )
        except SQLAlchemyError as error:
            raise ToolException(
                "The product ranking service is temporarily unavailable."
            ) from error

    return rank_products
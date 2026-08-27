from typing import Any

from langchain_core.tools import StructuredTool, ToolException, tool
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session

from app.schemas.product import ProductComparisonParams
from app.services.product_service import ProductService, product_service


def create_compare_products_tool(
    db: Session,
    service: ProductService = product_service,
) -> StructuredTool:
    """Create a tool that compares authoritative products across merchants."""

    @tool("compare_products", args_schema=ProductComparisonParams)
    def compare_products(product_ids: list[str]) -> list[dict[str, Any]]:
        """Compare selected database products using deterministic Python scoring."""

        try:
            params = ProductComparisonParams(product_ids=product_ids)
            return service.compare_products(db, params.product_ids)
        except SQLAlchemyError as error:
            raise ToolException(
                "The product comparison service is temporarily unavailable."
            ) from error

    return compare_products
from typing import Any

from langchain_core.tools import StructuredTool, ToolException, tool
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session

from app.schemas.product import ProductResult, ProductSearchParams
from app.services.product_service import ProductService, product_service


def create_search_products_tool(
    db: Session,
    service: ProductService = product_service,
) -> StructuredTool:
    """Create a database-bound tool for natural-language product search."""

    @tool("search_products", args_schema=ProductSearchParams)
    def search_products(
        query: str | None = None,
        category: str | None = None,
        brand: str | None = None,
        min_price: float | None = None,
        max_price: float | None = None,
        availability: bool | None = None,
        limit: int = 20,
    ) -> list[dict[str, Any]]:
        """Search connected merchants for products matching the supplied filters."""

        try:
            params = ProductSearchParams(
                query=query,
                category=category,
                brand=brand,
                min_price=min_price,
                max_price=max_price,
                availability=availability,
                limit=limit,
            )
            products = service.search_products(db, params)
        except SQLAlchemyError as error:
            raise ToolException(
                "The product catalog is temporarily unavailable."
            ) from error

        return [_serialize_product(product) for product in products]

    return search_products


def _serialize_product(product: ProductResult) -> dict[str, Any]:
    return product.model_dump(mode="json")
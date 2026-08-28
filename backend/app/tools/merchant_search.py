from typing import Any

from langchain_core.tools import StructuredTool, ToolException, tool
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session

from app.schemas.product import (
    MerchantProductSearchParams,
    ProductResult,
)
from app.services.product_service import ProductService, product_service


def create_search_merchant_products_tool(
    db: Session,
    service: ProductService = product_service,
) -> StructuredTool:
    """Create a database-bound tool for searching one connected merchant."""

    @tool("search_merchant_products", args_schema=MerchantProductSearchParams)
    def search_merchant_products(
        merchant_name: str,
        query: str | None = None,
        category: str | None = None,
        brand: str | None = None,
        min_price: float | None = None,
        max_price: float | None = None,
        min_rating: float | None = None,
        max_rating: float | None = None,
        max_delivery_days: int | None = None,
        availability: bool | None = True,
        limit: int = 20,
    ) -> list[dict[str, Any]]:
        """Search products from one connected merchant."""

        try:
            params = MerchantProductSearchParams(
                merchant_name=merchant_name,
                query=query,
                category=category,
                brand=brand,
                min_price=min_price,
                max_price=max_price,
                min_rating=min_rating,
                max_rating=max_rating,
                max_delivery_days=max_delivery_days,
                availability=availability,
                limit=limit,
            )
            products = service.search_merchant_products(db, params)
        except SQLAlchemyError as error:
            raise ToolException(
                "The merchant catalog is temporarily unavailable."
            ) from error

        return [_serialize_product(product) for product in products]


    return search_merchant_products


def _serialize_product(product: ProductResult) -> dict[str, Any]:
    return product.model_dump(mode="json")
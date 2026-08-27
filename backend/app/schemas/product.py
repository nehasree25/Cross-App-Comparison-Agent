from decimal import Decimal
from enum import Enum

from pydantic import BaseModel, ConfigDict, Field


class ProductResult(BaseModel):
    """Normalized product shape shared by merchant search and comparison."""

    model_config = ConfigDict(from_attributes=True)

    product_id: str = Field(min_length=1, max_length=100)
    merchant: str = Field(min_length=1, max_length=100)
    name: str = Field(min_length=1, max_length=500)
    brand: str = Field(min_length=1, max_length=100)
    category: str = Field(min_length=1, max_length=100)
    description: str = Field(min_length=1, max_length=5000)
    price: Decimal = Field(ge=0)
    currency: str = Field(min_length=3, max_length=3)
    discount_percent: Decimal = Field(ge=0, le=100)
    final_price: Decimal = Field(ge=0)
    availability: bool
    condition: str = Field(min_length=1, max_length=50)
    delivery_days: int = Field(ge=0)
    rating: Decimal = Field(ge=0, le=5)
    review_count: int = Field(ge=0)


class ProductSearchParams(BaseModel):
    query: str | None = Field(default=None, min_length=1, max_length=200)
    category: str | None = Field(default=None, min_length=1, max_length=100)
    brand: str | None = Field(default=None, min_length=1, max_length=100)
    min_price: Decimal | None = Field(default=None, ge=0)
    max_price: Decimal | None = Field(default=None, ge=0)
    availability: bool | None = None
    limit: int = Field(default=20, ge=1, le=100)


class MerchantProductSearchParams(ProductSearchParams):
    merchant_name: str = Field(min_length=1, max_length=100)


class ProductComparisonParams(BaseModel):
    product_ids: list[str] = Field(min_length=2, max_length=100)


class RankingPreference(str, Enum):
    cheapest = "cheapest"
    best_value = "best_value"
    highest_rated = "highest_rated"
    fastest_delivery = "fastest_delivery"
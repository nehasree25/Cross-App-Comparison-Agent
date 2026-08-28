from decimal import Decimal
from enum import Enum
import re

from pydantic import BaseModel, ConfigDict, Field, PrivateAttr, model_validator


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
    min_rating: Decimal | None = Field(default=None, ge=0, le=5)
    max_rating: Decimal | None = Field(default=None, ge=0, le=5)
    max_delivery_days: int | None = Field(default=None, ge=0)
    _min_rating_exclusive: bool = PrivateAttr(default=False)
    _max_rating_exclusive: bool = PrivateAttr(default=False)

    def __init__(self, **data):
        search_text = " ".join(
            str(value) for value in (data.get("query"), data.get("category"))
            if value
        )
        super().__init__(**data)
        self._min_rating_exclusive = bool(
            re.search(
                r"(?:rating|rated)\s*(?:above|over|greater than)",
                search_text,
                re.IGNORECASE,
            )
        )
        self._max_rating_exclusive = bool(
            re.search(
                r"(?:rating|rated)\s*(?:below|under|less than)",
                search_text,
                re.IGNORECASE,
            )
        )
    availability: bool | None = True
    limit: int = Field(default=20, ge=1, le=100)

    @model_validator(mode="before")
    @classmethod
    def normalize_filters(cls, values):
        if not isinstance(values, dict):
            return values

        values = dict(values)
        search_text = " ".join(
            str(value) for value in (values.get("query"), values.get("category"))
            if value
        )
        category = _normalize_category(search_text)
        if category and not values.get("category"):
            values["category"] = category
        if values.get("max_price") is None:
            max_price = _extract_max_price(search_text)
            if max_price is not None:
                values["max_price"] = max_price
        min_rating, max_rating = _extract_rating_range(search_text)
        if values.get("min_rating") is None and min_rating is not None:
            values["min_rating"] = min_rating
        if values.get("max_rating") is None and max_rating is not None:
            values["max_rating"] = max_rating
        delivery_days = _extract_max_delivery_days(search_text)
        if values.get("max_delivery_days") is None and delivery_days is not None:
            values["max_delivery_days"] = delivery_days
        if values.get("query") and _is_natural_language_query(values["query"]):
            values["query"] = _clean_query(values["query"], category)
        return values


class MerchantProductSearchParams(ProductSearchParams):
    merchant_name: str = Field(min_length=1, max_length=100)


class ProductComparisonParams(BaseModel):
    product_ids: list[str] = Field(min_length=2, max_length=100)


class RankingPreference(str, Enum):
    cheapest = "cheapest"
    best_value = "best_value"
    highest_rated = "highest_rated"
    fastest_delivery = "fastest_delivery"


class ProductRankingParams(BaseModel):
    product_ids: list[str] = Field(min_length=1, max_length=100)
    preference: RankingPreference


def _normalize_category(search_text: str) -> str | None:
    category_aliases = {
        "laptop": "Laptops",
        "laptops": "Laptops",
        "mobile": "Smartphones",
        "mobiles": "Smartphones",
        "smartphone": "Smartphones",
        "smartphones": "Smartphones",
        "chair": "Office Chairs",
        "chairs": "Office Chairs",
        "office chair": "Office Chairs",
        "office chairs": "Office Chairs",
    }
    for alias, category in category_aliases.items():
        if re.search(rf"\b{re.escape(alias)}\b", search_text, re.IGNORECASE):
            return category
    return None


def _extract_max_price(search_text: str) -> Decimal | None:
    match = re.search(
        r"(?:under|below|less than|up to|upto)\s*(?:INR|Rs\.?|₹)?\s*([\d,]+)",
        search_text,
        re.IGNORECASE,
    )
    if not match:
        return None
    amount = Decimal(match.group(1).replace(",", ""))
    if amount <= 5 and re.search(r"(?:rating|rated)", search_text, re.IGNORECASE):
        return None
    return amount


def _is_natural_language_query(query: str) -> bool:
    return bool(re.search(r"\b(?:find|under|below|cheapest|less|than|INR|rs|rating|rated|above|between)\b", query, re.IGNORECASE))


def _extract_rating_range(search_text: str) -> tuple[Decimal | None, Decimal | None]:
    number = r"([0-5](?:\.\d+)?)"
    range_match = re.search(
        rf"(?:rating|rated)\s*(?:between\s*)?{number}\s*(?:-|to|and)\s*{number}",
        search_text,
        re.IGNORECASE,
    )
    if range_match:
        return Decimal(range_match.group(1)), Decimal(range_match.group(2))

    above_match = re.search(
        rf"(?:rating|rated)\s*(?:above|over|greater than|at least)\s*{number}",
        search_text,
        re.IGNORECASE,
    )
    below_match = re.search(
        rf"(?:rating|rated)\s*(?:below|under|less than|at most)\s*{number}",
        search_text,
        re.IGNORECASE,
    )
    exact_match = re.search(rf"(?:rating|rated)\s*{number}", search_text, re.IGNORECASE)
    return (
        Decimal(above_match.group(1)) if above_match else Decimal(exact_match.group(1)) if exact_match else None,
        Decimal(below_match.group(1)) if below_match else Decimal(exact_match.group(1)) if exact_match else None,
    )


def _extract_max_delivery_days(search_text: str) -> int | None:
    match = re.search(
        r"(?:delivery|delivered)\s*(?:within|in|under|up to|upto|no more than)\s*(\d+)\s*days?",
        search_text,
        re.IGNORECASE,
    )
    return int(match.group(1)) if match else None


def _clean_query(query: str, category: str | None) -> str | None:
    if category:
        return None
    cleaned = re.sub(r"\bfind\b", "", query, flags=re.IGNORECASE)
    cleaned = re.sub(r"\b(?:the\s+)?cheapest\b", "", cleaned, flags=re.IGNORECASE)
    cleaned = re.sub(
        r"\b(?:under|below|less than|up to|upto)\s*(?:INR|Rs\.?|₹)?\s*[\d,]+",
        "",
        cleaned,
        flags=re.IGNORECASE,
    )
    cleaned = re.sub(
        r"\b(?:delivery|delivered)\s*(?:within|in|under|up to|upto|no more than)\s*\d+\s*days?",
        "",
        cleaned,
        flags=re.IGNORECASE,
    )
    cleaned = re.sub(
        r"\b(?:with\s+)?(?:a\s+)?rating\s*(?:above|over|greater than|at least|below|under|less than|at most|between)?\s*[0-5](?:\.\d+)?(?:\s*(?:-|to|and)\s*[0-5](?:\.\d+)?)?",
        "",
        cleaned,
        flags=re.IGNORECASE,
    )
    cleaned = re.sub(r"\s+", " ", cleaned).strip()
    return cleaned or None
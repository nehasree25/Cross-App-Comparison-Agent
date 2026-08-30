"""Recommendation engine for selecting best product from comparison results."""

import re
from decimal import Decimal

from app.schemas.agent import RecommendedProduct
from app.schemas.product import ProductResult, ProductSearchParams


def select_best_product(
    products: list[ProductResult],
    user_query: str,
) -> tuple[RecommendedProduct | None, str | None]:
    """
    Select the best product from comparison results based on user intent.
    
    Returns:
        Tuple of (RecommendedProduct, recommendation_reason) or (None, error_message)
    """
    if not products:
        return None, "No products available for recommendation."
    
    # Parse user requirements from the query
    requirements = _parse_user_requirements(user_query)
    
    # Filter products that satisfy hard requirements
    valid_products = _filter_valid_products(products, requirements)
    
    if not valid_products:
        return None, "No products matched all of your requirements."
    
    # If only one valid product, recommend it
    if len(valid_products) == 1:
        product = valid_products[0]
        reason = _generate_reason(product, requirements)
        return _product_to_recommendation(product), reason
    
    # Rank valid products based on user preference
    best_product = _rank_and_select(valid_products, requirements)
    reason = _generate_reason(best_product, requirements)
    
    return _product_to_recommendation(best_product), reason


def _parse_user_requirements(query: str) -> dict:
    """Extract user intent and requirements from query."""
    requirements = {
        "max_price": _extract_max_price(query),
        "min_rating": _extract_min_rating(query),
        "max_delivery_days": _extract_max_delivery_days(query),
        "preference": _extract_preference(query),
        "availability_required": True,  # Generally assume user wants available products
    }
    return requirements


def _extract_max_price(query: str) -> Decimal | None:
    """Extract maximum price constraint from query."""
    match = re.search(
        r"(?:under|below|less than|up to|upto|max|maximum|within|around)\s*(?:INR|Rs\.?|₹)?\s*([\d,]+)",
        query,
        re.IGNORECASE,
    )
    if match:
        try:
            return Decimal(match.group(1).replace(",", ""))
        except (ValueError, TypeError):
            return None
    return None


def _extract_min_rating(query: str) -> Decimal | None:
    """Extract minimum rating constraint from query."""
    match = re.search(
        r"(?:rating|rated)\s*(?:above|over|greater than|at least)\s*([0-5](?:\.\d+)?)",
        query,
        re.IGNORECASE,
    )
    if match:
        try:
            return Decimal(match.group(1))
        except (ValueError, TypeError):
            return None
    return None


def _extract_max_delivery_days(query: str) -> int | None:
    """Extract maximum delivery days constraint from query."""
    match = re.search(
        r"(?:delivery|delivered|within|in|under|up to|upto)\s*(\d+)\s*days?",
        query,
        re.IGNORECASE,
    )
    if match:
        try:
            return int(match.group(1))
        except (ValueError, TypeError):
            return None
    return None


def _extract_preference(query: str) -> str:
    """Detect user's ranking preference from query."""
    query_lower = query.lower()
    
    # Check for specific preferences in order of priority
    if re.search(r"\b(?:cheapest|lowest|minimum price|best price)\b", query_lower):
        return "cheapest"
    
    if re.search(r"\b(?:best rated|highest rated|top rated|highest rating|best rating)\b", query_lower):
        return "highest_rated"
    
    if re.search(r"\b(?:fastest|quickest|quick delivery|express)\b", query_lower):
        return "fastest_delivery"
    
    if re.search(r"\b(?:best value|value for money|good value|best deal)\b", query_lower):
        return "best_value"
    
    # Default to best overall value
    return "best_value"


def _filter_valid_products(
    products: list[ProductResult],
    requirements: dict,
) -> list[ProductResult]:
    """Filter products that satisfy hard constraints."""
    valid = []
    
    for product in products:
        # Availability requirement
        if requirements["availability_required"] and not product.availability:
            continue
        
        # Price constraint
        if requirements["max_price"] is not None:
            if product.final_price > requirements["max_price"]:
                continue
        
        # Rating constraint (hard minimum if specified)
        if requirements["min_rating"] is not None:
            if product.rating < requirements["min_rating"]:
                continue
        
        # Delivery constraint
        if requirements["max_delivery_days"] is not None:
            if product.delivery_days > requirements["max_delivery_days"]:
                continue
        
        valid.append(product)
    
    return valid


def _rank_and_select(
    products: list[ProductResult],
    requirements: dict,
) -> ProductResult:
    """Rank products and select the best one."""
    preference = requirements.get("preference", "best_value")
    
    # Create scored list
    scored = []
    for product in products:
        score = _compute_product_score(product, preference)
        scored.append((product, score))
    
    # Sort by score descending, then by price ascending, then by rating descending
    scored.sort(
        key=lambda x: (
            -x[1],  # Score descending
            x[0].final_price,  # Price ascending (cheaper is better)
            -x[0].rating,  # Rating descending (higher is better)
            x[0].product_id,  # Product ID for deterministic ordering
        )
    )
    
    # Return the best product
    return scored[0][0]


def _compute_product_score(product: ProductResult, preference: str) -> float:
    """
    Compute a numerical score for a product based on preference.
    
    Higher score = better product.
    """
    if preference == "cheapest":
        # For cheapest: normalize price inversely (lower price = higher score)
        # Assume max price is 100,000; normalize to 0-1 range
        price_score = max(0.0, 1.0 - float(product.final_price) / 100000.0)
        # Slight bonus for higher rating
        rating_score = float(product.rating) / 5.0
        return price_score * 0.8 + rating_score * 0.2
    
    elif preference == "highest_rated":
        # For highest rated: prioritize rating
        rating_score = float(product.rating) / 5.0
        review_bonus = min(1.0, float(product.review_count) / 5000.0)
        price_score = max(0.0, 1.0 - float(product.final_price) / 100000.0)
        return rating_score * 0.7 + review_bonus * 0.2 + price_score * 0.1
    
    elif preference == "fastest_delivery":
        # For fastest delivery: prioritize delivery speed
        # Normalize delivery days (assume max reasonable is 30 days)
        delivery_score = max(0.0, 1.0 - float(product.delivery_days) / 30.0)
        rating_score = float(product.rating) / 5.0
        price_score = max(0.0, 1.0 - float(product.final_price) / 100000.0)
        return delivery_score * 0.6 + rating_score * 0.25 + price_score * 0.15
    
    else:  # best_value (default)
        # Balance all factors for overall value
        price_score = max(0.0, 1.0 - float(product.final_price) / 100000.0)
        discount_score = float(product.discount_percent) / 100.0
        rating_score = float(product.rating) / 5.0
        delivery_score = max(0.0, 1.0 - float(product.delivery_days) / 30.0)
        review_bonus = min(1.0, float(product.review_count) / 5000.0)
        
        return (
            price_score * 0.25
            + discount_score * 0.10
            + rating_score * 0.30
            + delivery_score * 0.15
            + review_bonus * 0.20
        )


def _generate_reason(product: ProductResult, requirements: dict) -> str:
    """Generate a human-readable reason for the recommendation."""
    preference = requirements.get("preference", "best_value")
    
    reason_parts = []
    
    if preference == "cheapest":
        reason_parts.append(f"Recommended because it has the lowest price (₹{product.final_price:,})")
        if product.rating >= 4.0:
            reason_parts.append(f"with a solid {product.rating} rating")
    
    elif preference == "highest_rated":
        reason_parts.append(f"Recommended because it has the highest rating ({product.rating}/5)")
        if product.review_count > 0:
            reason_parts.append(f"based on {product.review_count:,} reviews")
        reason_parts.append(f"at ₹{product.final_price:,}")
    
    elif preference == "fastest_delivery":
        reason_parts.append(f"Recommended because it offers the fastest delivery ({product.delivery_days} days)")
        reason_parts.append(f"with a {product.rating}/5 rating at ₹{product.final_price:,}")
    
    else:  # best_value
        reason_parts.append("Best overall match based on")
        factors = []
        if requirements.get("max_price"):
            factors.append("your budget")
        if product.rating >= 4.5:
            factors.append(f"strong {product.rating} rating")
        elif product.rating >= 4.0:
            factors.append(f"good {product.rating} rating")
        if product.delivery_days <= 2:
            factors.append("fast delivery")
        elif product.delivery_days <= 5:
            factors.append(f"{product.delivery_days}-day delivery")
        
        if factors:
            reason_parts.append(", ".join(factors))
        else:
            reason_parts.append("a balanced combination of price, rating, and delivery")
    
    return " ".join(reason_parts).strip() + "."


def _product_to_recommendation(product: ProductResult) -> RecommendedProduct:
    """Convert a ProductResult to a RecommendedProduct."""
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

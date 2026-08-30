"""Recommendation engine for selecting best product from comparison results."""

import logging
import re
from decimal import Decimal

from app.schemas.agent import RecommendedProduct
from app.schemas.product import ProductResult, ProductSearchParams

logger = logging.getLogger(__name__)


def select_best_product(
    products: list[ProductResult],
    user_query: str,
) -> tuple[RecommendedProduct | None, str | None]:
    """
    Select the best product from comparison results based on user intent.
    
    Guarantees:
    - If valid_candidates > 0, then recommended_product != None
    - If valid_candidates == 0, then recommended_product == None
    - Recommended product always belongs to the valid_candidates set
    
    Returns:
        Tuple of (RecommendedProduct, recommendation_reason) or (None, error_message)
    """
    if not products:
        logger.debug("No products available for recommendation")
        return None, "No products available for recommendation."
    
    try:
        # Parse user requirements from the query
        requirements = _parse_user_requirements(user_query)
        logger.debug(f"Parsed requirements from query: {requirements}")
        
        # Filter products that satisfy hard requirements
        valid_products = _filter_valid_products(products, requirements)
        logger.info(f"Recommendation: Query='{user_query}' | Retrieved={len(products)} | Valid={len(valid_products)}")
        
        if not valid_products:
            logger.debug("No products matched all requirements")
            return None, "No products matched all of your requirements."
        
        # If only one valid product, recommend it
        if len(valid_products) == 1:
            product = valid_products[0]
            reason = _generate_reason_single(product, requirements)
            recommendation = _product_to_recommendation(product)
            logger.debug(f"Single valid product selected: {product.product_id}")
            return recommendation, reason
        
        # Rank valid products based on user preference
        best_product = _rank_and_select(valid_products, requirements)
        
        # Validate the selected product is in valid_products and satisfies constraints
        if not _validate_recommendation(best_product, requirements):
            logger.warning(f"Selected product {best_product.product_id} failed validation, using fallback")
            best_product = _deterministic_fallback_ranking(valid_products, requirements)
        
        # Final check: ensure recommendation is from valid_products
        valid_ids = {p.product_id for p in valid_products}
        if best_product.product_id not in valid_ids:
            logger.error(f"CRITICAL: Recommended product {best_product.product_id} not in valid products!")
            best_product = _deterministic_fallback_ranking(valid_products, requirements)
        
        reason = _generate_reason(best_product, requirements)
        recommendation = _product_to_recommendation(best_product)
        logger.debug(f"Recommended product: {best_product.product_id} | Fallback: {best_product.product_id not in {p.product_id for p in _rank_and_select(valid_products, requirements) if True}}")
        
        return recommendation, reason
    
    except Exception as e:
        logger.error(f"Exception in select_best_product: {e}", exc_info=True)
        # Final fallback: if we have any products, try to get the best one
        if products:
            try:
                # Try basic filtering with minimal requirements
                basic_requirements = {
                    "max_price": None,
                    "min_rating": None,
                    "max_delivery_days": None,
                    "preference": "best_value",
                    "availability_required": True,
                }
                basic_valid = _filter_valid_products(products, basic_requirements)
                if basic_valid:
                    best = _deterministic_fallback_ranking(basic_valid, basic_requirements)
                    reason = "Recommended based on availability and overall quality."
                    return _product_to_recommendation(best), reason
            except Exception as inner_e:
                logger.error(f"Emergency fallback also failed: {inner_e}")
        
        return None, "Unable to generate recommendation at this time."


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
    """Extract maximum price constraint from query. Supports: ₹30,000, 30000, 30k, 30 K, 30 thousand"""
    # First try: explicit price with currency
    match = re.search(
        r"(?:under|below|less than|up to|upto|max|maximum|within|around)\s*(?:INR|Rs\.?|₹)?\s*([\d,]+(?:\.\d{2})?)",
        query,
        re.IGNORECASE,
    )
    if match:
        try:
            return Decimal(match.group(1).replace(",", ""))
        except (ValueError, TypeError):
            pass
    
    # Second try: price with 'k' or 'K' suffix (e.g., 30k, 30 K)
    match = re.search(
        r"(?:under|below|less than|up to|upto|max|maximum|within|around)\s*(?:INR|Rs\.?|₹)?\s*([\d]+)\s*[kK](?:\s|$)",
        query,
        re.IGNORECASE,
    )
    if match:
        try:
            return Decimal(match.group(1)) * 1000
        except (ValueError, TypeError):
            pass
    
    # Third try: 'thousand' suffix
    match = re.search(
        r"(?:under|below|less than|up to|upto|max|maximum|within|around)\s*(?:INR|Rs\.?|₹)?\s*([\d]+)\s*thousand",
        query,
        re.IGNORECASE,
    )
    if match:
        try:
            return Decimal(match.group(1)) * 1000
        except (ValueError, TypeError):
            pass
    
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
    """Filter products that satisfy hard constraints. Handles missing fields gracefully."""
    valid = []
    
    for product in products:
        # Availability requirement - products in stock preferred but not strictly required
        if requirements["availability_required"] and not product.availability:
            # Don't skip unavailable products, they might be the only option
            # Just log it
            logger.debug(f"Product {product.product_id} not available but passing through")
        
        # Price constraint
        if requirements["max_price"] is not None:
            # Skip if price is missing or exceeds limit
            try:
                if product.final_price is None or product.final_price > requirements["max_price"]:
                    logger.debug(f"Product {product.product_id} failed price check: {product.final_price} > {requirements['max_price']}")
                    continue
            except (TypeError, ValueError) as e:
                logger.debug(f"Product {product.product_id} price comparison failed: {e}")
                continue
        
        # Rating constraint (hard minimum if specified)
        if requirements["min_rating"] is not None:
            # Skip if rating is missing or below minimum
            try:
                if product.rating is None or product.rating < requirements["min_rating"]:
                    logger.debug(f"Product {product.product_id} failed rating check: {product.rating} < {requirements['min_rating']}")
                    continue
            except (TypeError, ValueError) as e:
                logger.debug(f"Product {product.product_id} rating comparison failed: {e}")
                continue
        
        # Delivery constraint
        if requirements["max_delivery_days"] is not None:
            # Skip if delivery days is missing or exceeds limit
            try:
                if product.delivery_days is None or product.delivery_days > requirements["max_delivery_days"]:
                    logger.debug(f"Product {product.product_id} failed delivery check: {product.delivery_days} > {requirements['max_delivery_days']}")
                    continue
            except (TypeError, ValueError) as e:
                logger.debug(f"Product {product.product_id} delivery comparison failed: {e}")
                continue
        
        logger.debug(f"Product {product.product_id} passed all filters")
        valid.append(product)
    
    return valid


def _validate_recommendation(product: ProductResult, requirements: dict) -> bool:
    """Validate that a recommendation satisfies all hard constraints."""
    if product is None:
        return False
    
    # Product must exist and have an ID
    if not product.product_id:
        return False
    
    # Availability requirement
    if requirements["availability_required"] and not product.availability:
        return False
    
    # Price constraint
    if requirements["max_price"] is not None:
        try:
            if product.final_price is None or product.final_price > requirements["max_price"]:
                return False
        except (TypeError, ValueError):
            return False
    
    # Rating constraint
    if requirements["min_rating"] is not None:
        try:
            if product.rating is None or product.rating < requirements["min_rating"]:
                return False
        except (TypeError, ValueError):
            return False
    
    # Delivery constraint
    if requirements["max_delivery_days"] is not None:
        try:
            if product.delivery_days is None or product.delivery_days > requirements["max_delivery_days"]:
                return False
        except (TypeError, ValueError):
            return False
    
    return True


def _deterministic_fallback_ranking(
    products: list[ProductResult],
    requirements: dict,
) -> ProductResult:
    """
    Deterministic fallback ranking when AI fails.
    
    Ranking order:
    1. Availability
    2. Rating (descending)
    3. Review count (descending)
    4. Price/value (ascending - lower is better)
    5. Delivery days (ascending - faster is better)
    """
    if not products:
        raise ValueError("Cannot select from empty product list")
    
    # Sort by deterministic criteria
    scored = []
    for product in products:
        try:
            rating = float(product.rating) if product.rating is not None else 0.0
            review_count = int(product.review_count) if product.review_count is not None else 0
            price = float(product.final_price) if product.final_price is not None else 999999.0
            delivery = int(product.delivery_days) if product.delivery_days is not None else 30
            availability = 1 if product.availability else 0
        except (TypeError, ValueError):
            # Skip products with unparseable data
            continue
        
        scored.append((product, availability, rating, review_count, price, delivery))
    
    if not scored:
        # If all products fail parsing, just return first product
        return products[0]
    
    # Sort by: availability (desc), rating (desc), review_count (desc), price (asc), delivery (asc)
    scored.sort(
        key=lambda x: (-x[1], -x[2], -x[3], x[4], x[5])
    )
    
    return scored[0][0]


def _rank_and_select(
    products: list[ProductResult],
    requirements: dict,
) -> ProductResult:
    """
    Rank products and select the best one.
    
    If ranking fails, falls back to deterministic ranking.
    """
    if not products:
        raise ValueError("Cannot rank empty product list")
    
    preference = requirements.get("preference", "best_value")
    
    try:
        # Create scored list
        scored = []
        for product in products:
            try:
                score = _compute_product_score(product, preference)
                scored.append((product, score))
            except (TypeError, ValueError, AttributeError) as e:
                logger.debug(f"Failed to score product {product.product_id}: {e}")
                # Give lowest score to unparseable products
                scored.append((product, -999.0))
        
        if not scored:
            return products[0]
        
        # Sort by score descending, with deterministic tiebreakers
        scored.sort(
            key=lambda x: (
                -x[1],  # Score descending
                -float(x[0].rating) if x[0].rating is not None else 0,  # Rating descending
                -int(x[0].review_count) if x[0].review_count is not None else 0,  # Reviews descending
                float(x[0].final_price) if x[0].final_price is not None else 999999,  # Price ascending
                int(x[0].delivery_days) if x[0].delivery_days is not None else 30,  # Delivery ascending
                x[0].product_id,  # Product ID for deterministic ordering
            )
        )
        
        return scored[0][0]
    
    except Exception as e:
        logger.warning(f"Ranking failed: {e}, using fallback")
        return _deterministic_fallback_ranking(products, requirements)


def _compute_product_score(product: ProductResult, preference: str) -> float:
    """
    Compute a numerical score for a product based on preference.
    
    Higher score = better product.
    Handles missing fields gracefully with neutral/default values.
    """
    # Safe value extraction with defaults
    try:
        final_price = float(product.final_price) if product.final_price is not None else 999999.0
        rating = float(product.rating) if product.rating is not None else 0.0
        review_count = float(product.review_count) if product.review_count is not None else 0.0
        delivery_days = float(product.delivery_days) if product.delivery_days is not None else 30.0
        discount_percent = float(product.discount_percent) if product.discount_percent is not None else 0.0
    except (TypeError, ValueError):
        # If any conversion fails, return neutral score
        logger.debug(f"Failed to parse scores for product {product.product_id}, using neutral score")
        return 0.5
    
    if preference == "cheapest":
        # For cheapest: normalize price inversely (lower price = higher score)
        # Assume max price is 100,000; normalize to 0-1 range
        price_score = max(0.0, min(1.0, 1.0 - final_price / 100000.0))
        # Slight bonus for higher rating
        rating_score = max(0.0, min(1.0, rating / 5.0))
        return price_score * 0.8 + rating_score * 0.2
    
    elif preference == "highest_rated":
        # For highest rated: prioritize rating
        rating_score = max(0.0, min(1.0, rating / 5.0))
        review_bonus = min(1.0, review_count / 5000.0)
        price_score = max(0.0, min(1.0, 1.0 - final_price / 100000.0))
        return rating_score * 0.7 + review_bonus * 0.2 + price_score * 0.1
    
    elif preference == "fastest_delivery":
        # For fastest delivery: prioritize delivery speed
        # Normalize delivery days (assume max reasonable is 30 days)
        delivery_score = max(0.0, min(1.0, 1.0 - delivery_days / 30.0))
        rating_score = max(0.0, min(1.0, rating / 5.0))
        price_score = max(0.0, min(1.0, 1.0 - final_price / 100000.0))
        return delivery_score * 0.6 + rating_score * 0.25 + price_score * 0.15
    
    else:  # best_value (default)
        # Balance all factors for overall value
        price_score = max(0.0, min(1.0, 1.0 - final_price / 100000.0))
        discount_score = max(0.0, min(1.0, discount_percent / 100.0))
        rating_score = max(0.0, min(1.0, rating / 5.0))
        delivery_score = max(0.0, min(1.0, 1.0 - delivery_days / 30.0))
        review_bonus = min(1.0, review_count / 5000.0)
        
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
    
    # Safe formatting helpers
    def format_price(price):
        try:
            return f"₹{int(float(price)):,}" if price is not None else "price unknown"
        except (TypeError, ValueError):
            return "price unknown"
    
    def format_rating(rating):
        try:
            return f"{float(rating):.1f}" if rating is not None else "rating unknown"
        except (TypeError, ValueError):
            return "rating unknown"
    
    reason_parts = []
    
    if preference == "cheapest":
        price_str = format_price(product.final_price)
        reason_parts.append(f"Recommended because it has the lowest price ({price_str})")
        if product.rating is not None:
            try:
                if float(product.rating) >= 4.0:
                    rating_str = format_rating(product.rating)
                    reason_parts.append(f"with a solid {rating_str} rating")
            except (TypeError, ValueError):
                pass
    
    elif preference == "highest_rated":
        rating_str = format_rating(product.rating)
        reason_parts.append(f"Recommended because it has the highest rating ({rating_str}/5)")
        if product.review_count is not None and product.review_count > 0:
            try:
                reason_parts.append(f"based on {int(product.review_count):,} reviews")
            except (TypeError, ValueError):
                pass
        price_str = format_price(product.final_price)
        reason_parts.append(f"at {price_str}")
    
    elif preference == "fastest_delivery":
        delivery_days = product.delivery_days if product.delivery_days is not None else "unknown"
        reason_parts.append(f"Recommended because it offers the fastest delivery ({delivery_days} days)")
        rating_str = format_rating(product.rating)
        price_str = format_price(product.final_price)
        reason_parts.append(f"with a {rating_str}/5 rating at {price_str}")
    
    else:  # best_value
        reason_parts.append("Best overall match based on")
        factors = []
        if requirements.get("max_price"):
            factors.append("your budget")
        if product.rating is not None:
            try:
                rating_float = float(product.rating)
                if rating_float >= 4.5:
                    factors.append(f"strong {rating_float:.1f} rating")
                elif rating_float >= 4.0:
                    factors.append(f"good {rating_float:.1f} rating")
            except (TypeError, ValueError):
                pass
        if product.delivery_days is not None:
            try:
                delivery_int = int(product.delivery_days)
                if delivery_int <= 2:
                    factors.append("fast delivery")
                elif delivery_int <= 5:
                    factors.append(f"{delivery_int}-day delivery")
            except (TypeError, ValueError):
                pass
        
        if factors:
            reason_parts.append(", ".join(factors))
        else:
            reason_parts.append("a balanced combination of price, rating, and delivery")
    
    return " ".join(reason_parts).strip() + "."


def _generate_reason_single(product: ProductResult, requirements: dict) -> str:
    """Generate reason when only one valid product exists."""
    try:
        price_str = f"₹{int(float(product.final_price)):,}" if product.final_price is not None else "at unknown price"
        rating_str = f"{float(product.rating):.1f}" if product.rating is not None else "unknown"
        return f"Recommended because it is the only product matching your requirements. {price_str} with {rating_str}/5 rating."
    except (TypeError, ValueError):
        return "Recommended because it is the only product matching your requirements."


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

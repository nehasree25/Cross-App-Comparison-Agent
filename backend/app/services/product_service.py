from collections.abc import Sequence

from sqlalchemy import Select, and_, or_, select
from sqlalchemy.orm import Session

from app.models.product import Product
from app.schemas.product import (
    MerchantProductSearchParams,
    ProductResult,
    ProductSearchParams,
)


class ProductService:
    """Read-only product queries backed by the existing SQLAlchemy session."""

    def search_products(
        self, db: Session, params: ProductSearchParams
    ) -> list[ProductResult]:
        statement = self._build_search_statement(params)
        products: Sequence[Product] = db.scalars(statement).all()
        return [ProductResult.model_validate(product) for product in products]

    def search_merchant_products(
        self, db: Session, params: MerchantProductSearchParams
    ) -> list[ProductResult]:
        statement = self._build_search_statement(params).where(
            Product.merchant.ilike(params.merchant_name)
        )
        products: Sequence[Product] = db.scalars(statement).all()
        return [ProductResult.model_validate(product) for product in products]

    def compare_products(
        self, db: Session, product_ids: Sequence[str]
    ) -> list[dict[str, object]]:
        """Load products by ID and compare them with deterministic Python logic."""

        products = db.scalars(
            select(Product)
            .where(Product.product_id.in_(product_ids))
            .order_by(Product.product_id.asc())
        ).all()
        results = [ProductResult.model_validate(product) for product in products]
        by_id = {product.product_id: product for product in results}

        comparisons = []
        for product_id in product_ids:
            product = by_id.get(product_id)
            if product is None:
                continue
            comparisons.append(
                {
                    "product": product.model_dump(mode="json"),
                    "score": _comparison_score(product),
                }
            )

        return sorted(
            comparisons,
            key=lambda item: (
                -item["score"],
                item["product"]["final_price"],
                item["product"]["product_id"],
            ),
        )

    def rank_products(
        self,
        db: Session,
        product_ids: Sequence[str],
        preference: str,
    ) -> list[dict[str, object]]:
        """Load products by ID and rank them using deterministic Python rules."""

        products = db.scalars(
            select(Product)
            .where(Product.product_id.in_(product_ids))
        ).all()
        results = [ProductResult.model_validate(product) for product in products]

        if preference == "cheapest":
            results.sort(key=lambda product: (
                not product.availability,
                product.final_price,
                -product.rating,
                product.product_id,
            ))
        elif preference == "highest_rated":
            results.sort(key=lambda product: (
                not product.availability,
                -product.rating,
                -product.review_count,
                product.final_price,
                product.product_id,
            ))
        elif preference == "fastest_delivery":
            results.sort(key=lambda product: (
                not product.availability,
                product.delivery_days,
                -product.rating,
                product.final_price,
                product.product_id,
            ))
        else:
            results.sort(key=lambda product: (
                not product.availability,
                -_comparison_score(product),
                product.final_price,
                product.product_id,
            ))

        return [product.model_dump(mode="json") for product in results]

    @staticmethod
    def _build_search_statement(
        params: ProductSearchParams,
    ) -> Select[tuple[Product]]:
        filters = []

        if params.query:
            query = f"%{params.query}%"
            filters.append(
                or_(
                    Product.name.ilike(query),
                    Product.brand.ilike(query),
                    Product.category.ilike(query),
                    Product.description.ilike(query),
                )
            )
        if params.category:
            filters.append(Product.category.ilike(f"%{params.category}%"))
        if params.brand:
            filters.append(Product.brand.ilike(params.brand))
        if params.min_price is not None:
            filters.append(Product.final_price >= params.min_price)
        if params.max_price is not None:
            filters.append(Product.final_price <= params.max_price)
        if params.min_rating is not None:
            filters.append(
                Product.rating > params.min_rating
                if params._min_rating_exclusive
                else Product.rating >= params.min_rating
            )
        if params.max_rating is not None:
            filters.append(
                Product.rating < params.max_rating
                if params._max_rating_exclusive
                else Product.rating <= params.max_rating
            )
        if params.max_delivery_days is not None:
            filters.append(Product.delivery_days <= params.max_delivery_days)
        if params.availability is not None:
            filters.append(Product.availability.is_(params.availability))

        return (
            select(Product)
            .where(and_(*filters))
            .order_by(Product.final_price.asc(), Product.product_id.asc())
            .limit(params.limit)
        )


product_service = ProductService()


def _comparison_score(product: ProductResult) -> float:
    """Score only database values; higher means a stronger overall offer."""

    price_score = max(0.0, 1.0 - float(product.final_price) / 100000.0)
    discount_score = float(product.discount_percent) / 100.0
    rating_score = float(product.rating) / 5.0
    delivery_score = 1.0 / (1.0 + product.delivery_days)
    availability_score = 1.0 if product.availability else 0.0
    return (
        price_score * 0.35
        + discount_score * 0.15
        + rating_score * 0.25
        + delivery_score * 0.15
        + availability_score * 0.10
    )
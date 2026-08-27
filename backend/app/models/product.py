from decimal import Decimal

from sqlalchemy import Boolean, Integer, Numeric, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class Product(Base):
    __tablename__ = "products"

    id: Mapped[int] = mapped_column(primary_key=True)
    product_id: Mapped[str] = mapped_column(String(100), unique=True, nullable=False, index=True)
    merchant: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    name: Mapped[str] = mapped_column(String(500), nullable=False, index=True)
    brand: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    category: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    price: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)
    currency: Mapped[str] = mapped_column(String(3), nullable=False)
    discount_percent: Mapped[Decimal] = mapped_column(Numeric(5, 2), nullable=False)
    final_price: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)
    availability: Mapped[bool] = mapped_column(Boolean, nullable=False, index=True)
    condition: Mapped[str] = mapped_column(String(50), nullable=False)
    delivery_days: Mapped[int] = mapped_column(Integer, nullable=False)
    rating: Mapped[Decimal] = mapped_column(Numeric(3, 2), nullable=False)
    review_count: Mapped[int] = mapped_column(Integer, nullable=False)
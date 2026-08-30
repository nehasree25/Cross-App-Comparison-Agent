from datetime import datetime
from decimal import Decimal

from sqlalchemy import DateTime, ForeignKey, Integer, Numeric, String, func, TIMESTAMP
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class Order(Base):
    __tablename__ = "orders"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False, index=True)
    product_id: Mapped[str] = mapped_column(
        ForeignKey("products.product_id"), nullable=False, index=True
    )
    razorpay_order_id: Mapped[str] = mapped_column(String(100), unique=True, nullable=False)
    razorpay_payment_id: Mapped[str] = mapped_column(String(100), nullable=True)
    amount: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)
    amount_paise: Mapped[int] = mapped_column(Integer, nullable=False)
    currency: Mapped[str] = mapped_column(String(3), default="INR", nullable=False)
    status: Mapped[str] = mapped_column(String(50), default="created", nullable=False)
    payment_status: Mapped[str] = mapped_column(String(50), default="PAYMENT_PENDING", nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        TIMESTAMP(timezone=True),
        server_default=func.now(),
        nullable=False
    )
    checkout_at: Mapped[datetime | None] = mapped_column(TIMESTAMP(timezone=True), nullable=True)
    payment_at: Mapped[datetime | None] = mapped_column(TIMESTAMP(timezone=True), nullable=True)

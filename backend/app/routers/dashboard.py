from datetime import datetime, timedelta
from decimal import Decimal

from fastapi import APIRouter, Depends, status
from sqlalchemy import and_, func, select
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import ComparisonSession, Order, Product, User
from app.routers.auth import get_current_user
from app.schemas.order import OrderRead

router = APIRouter(prefix="/api", tags=["dashboard"])


def format_datetime(dt: datetime | None) -> str | None:
    """Format datetime to ISO string or None"""
    return dt.isoformat() if dt else None


class OrderBasic:
    """Lightweight order representation for recent orders"""
    def __init__(self, order: Order, product_name: str):
        self.id = order.id
        self.product_id = order.product_id
        self.product_name = product_name
        self.amount = str(order.amount)
        self.payment_status = order.payment_status
        self.created_at = format_datetime(order.created_at)


@router.get("/dashboard", status_code=status.HTTP_200_OK)
def get_dashboard(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get user dashboard with aggregated statistics"""
    
    # Count comparisons
    total_comparisons = db.scalar(
        select(func.count(ComparisonSession.id)).where(
            ComparisonSession.user_id == current_user.id
        )
    ) or 0
    
    # Total orders
    total_orders = db.scalar(
        select(func.count(Order.id)).where(Order.user_id == current_user.id)
    ) or 0
    
    # Paid orders
    paid_orders = db.scalar(
        select(func.count(Order.id)).where(
            and_(
                Order.user_id == current_user.id,
                Order.payment_status == "PAID"
            )
        )
    ) or 0
    
    # Total spent (only PAID orders)
    total_spent_decimal = db.scalar(
        select(func.sum(Order.amount)).where(
            and_(
                Order.user_id == current_user.id,
                Order.payment_status == "PAID"
            )
        )
    ) or Decimal("0.00")
    total_spent = int(float(total_spent_decimal))
    
    # Pending orders
    pending_orders = db.scalar(
        select(func.count(Order.id)).where(
            and_(
                Order.user_id == current_user.id,
                Order.payment_status == "PAYMENT_PENDING"
            )
        )
    ) or 0
    
    # Payment success rate
    # Count attempts: orders where checkout was initiated (checkout_at is not null)
    payment_attempts = db.scalar(
        select(func.count(Order.id)).where(
            and_(
                Order.user_id == current_user.id,
                Order.checkout_at.is_not(None)
            )
        )
    ) or 0
    
    if payment_attempts > 0:
        payment_success_rate = round((paid_orders / payment_attempts) * 100)
    else:
        payment_success_rate = None
    
    # Get last 7 days spending by date
    today = datetime.utcnow().date()
    last_7_days = [today - timedelta(days=i) for i in range(6, -1, -1)]
    
    daily_spending = []
    for date in last_7_days:
        day_start = datetime.combine(date, datetime.min.time())
        day_end = datetime.combine(date, datetime.max.time())
        
        day_spent = db.scalar(
            select(func.sum(Order.amount)).where(
                and_(
                    Order.user_id == current_user.id,
                    Order.payment_status == "PAID",
                    Order.payment_at >= day_start,
                    Order.payment_at <= day_end
                )
            )
        ) or Decimal("0.00")
        
        daily_spending.append({
            "date": date.isoformat(),
            "amount": int(float(day_spent))
        })
    
    # Get recent orders (latest 3)
    recent_orders_objs = db.scalars(
        select(Order)
        .where(Order.user_id == current_user.id)
        .order_by(Order.created_at.desc())
        .limit(3)
    ).all()
    
    recent_orders = []
    for order in recent_orders_objs:
        product = db.scalar(
            select(Product).where(Product.product_id == order.product_id)
        )
        recent_orders.append({
            "id": order.id,
            "product_id": order.product_id,
            "product_name": product.name if product else order.product_id,
            "amount": str(order.amount),
            "payment_status": order.payment_status,
            "created_at": format_datetime(order.created_at)
        })
    
    return {
        "user": {
            "id": current_user.id,
            "name": current_user.name,
            "username": current_user.username
        },
        "stats": {
            "total_comparisons": total_comparisons,
            "total_orders": total_orders,
            "total_spent": total_spent,
            "paid_orders": paid_orders,
            "pending_orders": pending_orders,
            "payment_success_rate": payment_success_rate
        },
        "daily_spending": daily_spending,
        "recent_orders": recent_orders
    }

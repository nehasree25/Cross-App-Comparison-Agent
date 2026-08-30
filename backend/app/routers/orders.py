import hashlib
import hmac
import json
import os
from datetime import datetime
from decimal import Decimal

import razorpay
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Order, Product, User
from app.routers.auth import get_current_user
from app.schemas.order import OrderCreate, OrderResponse, PaymentVerification, OrderRead

router = APIRouter(prefix="/api", tags=["orders"])

# Initialize Razorpay client
RAZORPAY_KEY_ID = os.getenv("RAZORPAY_KEY_ID")
RAZORPAY_KEY_SECRET = os.getenv("RAZORPAY_KEY_SECRET")

if not RAZORPAY_KEY_ID or not RAZORPAY_KEY_SECRET:
    raise RuntimeError("RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET must be set in .env")

razorpay_client = razorpay.Client(auth=(RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET))


def convert_to_paise(amount: Decimal) -> int:
    """Convert Decimal amount (INR) to paise (integers)"""
    return int(amount * 100)


def format_datetime(dt: datetime | None) -> str | None:
    """Format datetime to ISO string or None"""
    return dt.isoformat() if dt else None


def verify_razorpay_signature(
    razorpay_order_id: str, razorpay_payment_id: str, razorpay_signature: str
) -> bool:
    """Verify Razorpay payment signature"""
    try:
        message = f"{razorpay_order_id}|{razorpay_payment_id}"
        expected_signature = hmac.new(
            RAZORPAY_KEY_SECRET.encode(),
            message.encode(),
            hashlib.sha256
        ).hexdigest()
        return hmac.compare_digest(expected_signature, razorpay_signature)
    except Exception:
        return False


@router.post("/orders", response_model=OrderResponse, status_code=status.HTTP_201_CREATED)
def create_order(
    order_data: OrderCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> OrderResponse:
    """
    Create an order and initiate Razorpay payment.
    
    Steps:
    1. Validate product exists
    2. Get product price from database (never trust frontend)
    3. Convert amount to paise
    4. Create Razorpay order
    5. Save local order record
    6. Return order details
    """

    # Step 1: Find product in database
    product = db.scalar(
        select(Product).where(Product.product_id == order_data.product_id)
    )
    if not product:
        print(f"DEBUG: Product not found - product_id: {order_data.product_id}")
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product not found",
        )

    # Step 2: Get final_price from database (never trust frontend)
    if not product.final_price or product.final_price <= 0:
        print(f"DEBUG: Invalid product price - product_id: {order_data.product_id}, price: {product.final_price}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid product price",
        )

    amount_decimal = product.final_price
    
    # Step 3: Convert to paise
    amount_paise = convert_to_paise(amount_decimal)

    # Step 4: Create Razorpay order
    try:
        order_count = db.scalar(select(func.count(Order.id))) or 0
        receipt = f"order_{current_user.id}_{order_data.product_id}_{order_count + 1}"
        
        razorpay_order = razorpay_client.order.create(
            {
                "amount": amount_paise,
                "currency": "INR",
                "receipt": receipt,
            }
        )
        razorpay_order_id = razorpay_order["id"]
    except KeyError as error:
        print(f"DEBUG: Razorpay API response missing 'id': {razorpay_order}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Invalid Razorpay response",
        ) from error
    except Exception as error:
        print(f"DEBUG: Razorpay API error: {type(error).__name__}: {error}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create Razorpay order. Please try again.",
        ) from error

    # Step 5: Save local order record
    try:
        local_order = Order(
            user_id=current_user.id,
            product_id=order_data.product_id,
            razorpay_order_id=razorpay_order_id,
            amount=amount_decimal,
            amount_paise=amount_paise,
            currency="INR",
            status="created",
            payment_status="PAYMENT_PENDING",
        )
        db.add(local_order)
        db.flush()  # Flush to get the ID without full refresh
        db.commit()
    except IntegrityError as error:
        db.rollback()
        # Check if it's a foreign key constraint (product doesn't exist)
        error_str = str(error).lower()
        if "product_id" in error_str or "foreign key" in error_str:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Product not found or no longer available",
            ) from error
        # Other integrity errors
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Unable to create order. Please try again with different details.",
        ) from error
    except Exception as error:
        db.rollback()
        print(f"DEBUG: Order creation error: {type(error).__name__}: {error}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to save order",
        ) from error

    # Step 6: Return order response (without secret key)
    return OrderResponse(
        order_id=razorpay_order_id,
        amount=amount_paise,
        currency="INR",
        key_id=RAZORPAY_KEY_ID,
    )


@router.get("/orders", response_model=list[OrderRead])
def get_user_orders(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get all orders for the authenticated user"""
    orders = db.scalars(
        select(Order).where(Order.user_id == current_user.id).order_by(Order.created_at.desc())
    ).all()
    
    return [
        OrderRead(
            id=order.id,
            user_id=order.user_id,
            product_id=order.product_id,
            razorpay_order_id=order.razorpay_order_id,
            razorpay_payment_id=order.razorpay_payment_id,
            amount=order.amount,
            amount_paise=order.amount_paise,
            currency=order.currency,
            status=order.status,
            payment_status=order.payment_status,
            created_at=format_datetime(order.created_at),
            checkout_at=format_datetime(order.checkout_at),
            payment_at=format_datetime(order.payment_at),
        )
        for order in orders
    ]


@router.post("/orders/{order_id}/checkout")
def mark_checkout_started(
    order_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Mark checkout as started by setting checkout_at timestamp"""
    order = db.scalar(
        select(Order).where(
            (Order.id == order_id) & (Order.user_id == current_user.id)
        )
    )
    
    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Order not found",
        )
    
    try:
        order.checkout_at = datetime.utcnow()
        db.commit()
        db.refresh(order)
        return {
            "status": "success",
            "checkout_at": format_datetime(order.checkout_at)
        }
    except Exception as error:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update checkout status",
        ) from error


@router.post("/orders/{order_id}/verify-payment")
def verify_payment(
    order_id: int,
    payment_data: PaymentVerification,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Verify Razorpay payment and update order status"""
    order = db.scalar(
        select(Order).where(
            (Order.id == order_id) & (Order.user_id == current_user.id)
        )
    )
    
    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Order not found",
        )
    
    # Verify signature
    if not verify_razorpay_signature(
        payment_data.razorpay_order_id,
        payment_data.razorpay_payment_id,
        payment_data.razorpay_signature
    ):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid payment signature",
        )
    
    # Verify order ID matches
    if order.razorpay_order_id != payment_data.razorpay_order_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Order ID mismatch",
        )
    
    try:
        order.razorpay_payment_id = payment_data.razorpay_payment_id
        order.payment_status = "PAID"
        order.payment_at = datetime.utcnow()
        order.status = "completed"
        db.commit()
        db.refresh(order)
        
        return {
            "status": "success",
            "payment_status": order.payment_status,
            "payment_at": format_datetime(order.payment_at),
            "message": "Payment verified successfully"
        }
    except Exception as error:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update payment status",
        ) from error


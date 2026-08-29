import os
from decimal import Decimal

import razorpay
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Order, Product, User
from app.routers.auth import get_current_user
from app.schemas.order import OrderCreate, OrderResponse

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
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product not found",
        )

    # Step 2: Get final_price from database (never trust frontend)
    if not product.final_price or product.final_price <= 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid product price",
        )

    amount_decimal = product.final_price
    
    # Step 3: Convert to paise
    amount_paise = convert_to_paise(amount_decimal)

    # Step 4: Create Razorpay order
    try:
        receipt = f"order_{current_user.id}_{order_data.product_id}_{db.query(Order).count() + 1}"
        
        razorpay_order = razorpay_client.order.create(
            {
                "amount": amount_paise,
                "currency": "INR",
                "receipt": receipt,
            }
        )
        razorpay_order_id = razorpay_order["id"]
    except Exception as error:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create Razorpay order",
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
        )
        db.add(local_order)
        db.commit()
        db.refresh(local_order)
    except Exception as error:
        db.rollback()
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

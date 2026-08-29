from decimal import Decimal

from pydantic import BaseModel, Field


class OrderCreate(BaseModel):
    """Request schema for creating an order"""
    product_id: str = Field(..., description="Product ID to order")


class OrderResponse(BaseModel):
    """Response schema with Razorpay order details for frontend"""
    order_id: str = Field(..., description="Razorpay order ID")
    amount: int = Field(..., description="Amount in paise")
    currency: str = Field(default="INR", description="Currency code")
    key_id: str = Field(..., description="Razorpay public key for checkout")


class OrderRead(BaseModel):
    """Schema for reading stored order from database"""
    id: int
    user_id: int
    product_id: str
    razorpay_order_id: str
    amount: Decimal
    amount_paise: int
    currency: str
    status: str

    class Config:
        from_attributes = True

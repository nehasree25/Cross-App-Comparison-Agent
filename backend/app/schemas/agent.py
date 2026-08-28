from pydantic import BaseModel, Field

from app.schemas.product import ProductResult


class RecommendedProduct(BaseModel):
    product_id: str
    merchant: str
    name: str
    brand: str
    final_price: str
    currency: str
    availability: bool
    rating: str
    delivery_days: int


class AgentChatRequest(BaseModel):
    message: str = Field(min_length=1, max_length=2000)


class AgentChatResponse(BaseModel):
    message: str
    recommended_product: RecommendedProduct | None = None
    products: list[ProductResult] = Field(default_factory=list)
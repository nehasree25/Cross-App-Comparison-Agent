from pydantic import BaseModel, Field

from app.schemas.product import ProductResult


class AgentChatRequest(BaseModel):
    message: str = Field(min_length=1, max_length=2000)


class AgentChatResponse(BaseModel):
    message: str
    products: list[ProductResult] = Field(default_factory=list)
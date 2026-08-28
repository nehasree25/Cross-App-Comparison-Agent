from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict


class ComparisonSessionRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    user_id: int
    user_query: str
    category: str
    product_ids: list[str]
    product_count: int
    created_at: datetime
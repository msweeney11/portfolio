from pydantic import BaseModel
from typing import Optional, Any
from datetime import datetime

class WishlistItemCreate(BaseModel):
    customer_id: int
    product_id: int

class WishlistItemOut(BaseModel):
    id: int
    customer_id: int
    product_id: int
    created_at: datetime
    product: Optional[Any] = None  # Product details from product service

    class Config:
        from_attributes = True

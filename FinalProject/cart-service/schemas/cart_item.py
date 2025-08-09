from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class CartItemCreate(BaseModel):
    customer_id: int
    product_id: int
    quantity: int

class CartItemOut(BaseModel):
    id: int
    customer_id: int
    product_id: int
    quantity: int
    updated_at: Optional[datetime]

    class Config:
        orm_mode = True

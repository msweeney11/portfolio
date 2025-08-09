from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime

class CartItemCreate(BaseModel):
    product_id: int
    quantity: int = Field(..., gt=0)

class CartItemUpdate(BaseModel):
    quantity: int = Field(..., gt=0)

class ProductInfo(BaseModel):
    product_id: int
    product_name: str
    list_price: float
    discount_percent: float
    product_code: str

class CartItemOut(BaseModel):
    id: int
    customer_id: int
    product_id: int
    quantity: int
    updated_at: datetime
    product_info: Optional[ProductInfo] = None
    subtotal: Optional[float] = None

    class Config:
        from_attributes = True

class CartSummary(BaseModel):
    items: List[CartItemOut]
    total_items: int
    total_amount: float
    discount_amount: float
    final_amount: float

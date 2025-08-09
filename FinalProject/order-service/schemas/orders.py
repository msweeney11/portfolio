from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime

class OrderItemCreate(BaseModel):
    product_id: int
    item_price: float
    discount_amount: float = 0.0
    quantity: int = Field(..., gt=0)

class OrderItemOut(BaseModel):
    item_id: int
    product_id: int
    item_price: float
    discount_amount: float
    quantity: int

    class Config:
        from_attributes = True

class OrderCreate(BaseModel):
    customer_id: int
    ship_amount: float = 0.0
    tax_amount: float = 0.0
    ship_address_id: int
    card_type: str = Field(..., max_length=50)
    card_number: str = Field(..., min_length=16, max_length=16)
    card_expires: str = Field(..., pattern=r"^\d{2}/\d{2}$")
    billing_address_id: int
    items: List[OrderItemCreate]

class OrderOut(BaseModel):
    order_id: int
    customer_id: int
    order_date: datetime
    ship_amount: float
    tax_amount: float
    ship_date: Optional[datetime] = None
    ship_address_id: int
    card_type: str
    card_number: str
    card_expires: str
    billing_address_id: int
    items: Optional[List[OrderItemOut]] = []

    class Config:
        from_attributes = True

class OrderUpdate(BaseModel):
    ship_amount: Optional[float] = None
    tax_amount: Optional[float] = None
    ship_date: Optional[datetime] = None
    ship_address_id: Optional[int] = None

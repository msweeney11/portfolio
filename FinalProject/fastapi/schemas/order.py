from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime

class OrderBase(BaseModel):
    customer_id: int
    order_date: datetime
    ship_amount: float
    tax_amount: float
    ship_date: Optional[datetime] = None
    ship_address_id: int
    card_type: str = Field(..., max_length=20)
    card_number: str = Field(..., min_length=12, max_length=19)
    card_expires: str = Field(..., pattern=r"^\d{2}/\d{2}$")
    billing_address_id: int

class OrderCreate(OrderBase):
    pass

class OrderUpdate(BaseModel):
    ship_amount: Optional[float] = None
    tax_amount: Optional[float] = None
    ship_date: Optional[datetime] = None
    ship_address_id: Optional[int] = None
    card_type: Optional[str] = Field(None, max_length=20)
    card_number: Optional[str] = Field(None, min_length=12, max_length=19)
    card_expires: Optional[str] = Field(None, pattern=r"^\d{2}/\d{2}$")
    billing_address_id: Optional[int] = None

class OrderOut(OrderBase):
    order_id: int

    class Config:
        from_attributes = True

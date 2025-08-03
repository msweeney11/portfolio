from pydantic import BaseModel, constr
from typing import Optional
from datetime import date

class OrderBase(BaseModel):
    customer_id: int
    order_date: date
    ship_amount: float
    tax_amount: float
    ship_date: Optional[date] = None
    ship_address_id: int
    card_type: constr(max_length=20)
    card_number: constr(min_length=12, max_length=19)
    card_expires: constr(pattern=r"^\d{2}/\d{2}$")
    billing_address_id: int

class OrderCreate(OrderBase):
    pass

class OrderUpdate(BaseModel):
    ship_amount: Optional[float] = None
    tax_amount: Optional[float] = None
    ship_date: Optional[date] = None
    ship_address_id: Optional[int] = None
    card_type: Optional[constr(max_length=20)] = None
    card_number: Optional[constr(min_length=12, max_length=19)] = None
    card_expires: constr(pattern=r"^\d{2}/\d{2}$") | None
    billing_address_id: Optional[int] = None

class OrderOut(OrderBase):
    order_id: int

    class Config:
        orm_mode = True

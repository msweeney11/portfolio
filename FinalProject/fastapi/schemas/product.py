from pydantic import BaseModel, constr
from typing import Optional
from datetime import date

class ProductBase(BaseModel):
    category_id: int
    product_code: constr(max_length=50)
    product_name: constr(max_length=255)
    description: Optional[str] = None
    list_price: float
    discount_percent: float
    date_added: Optional[date] = None

class ProductCreate(ProductBase):
    pass

class ProductUpdate(BaseModel):
    category_id: Optional[int] = None
    product_code: Optional[constr(max_length=50)] = None
    product_name: Optional[constr(max_length=255)] = None
    description: Optional[str] = None
    list_price: Optional[float] = None
    discount_percent: Optional[float] = None
    date_added: Optional[date] = None

class ProductOut(ProductBase):
    product_id: int

    class Config:
        orm_mode = True

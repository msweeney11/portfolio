from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime

class ProductBase(BaseModel):
    category_id: int
    product_code: str = Field(..., max_length=50)
    product_name: str = Field(..., max_length=255)
    description: Optional[str] = None
    list_price: float
    discount_percent: float
    date_added: Optional[datetime] = None

class ProductCreate(ProductBase):
    pass

class ProductUpdate(BaseModel):
    category_id: Optional[int] = None
    product_code: Optional[str] = Field(None, max_length=50)
    product_name: Optional[str] = Field(None, max_length=255)
    description: Optional[str] = None
    list_price: Optional[float] = None
    discount_percent: Optional[float] = None
    date_added: Optional[datetime] = None

class ProductOut(ProductBase):
    product_id: int

    class Config:
        from_attributes = True

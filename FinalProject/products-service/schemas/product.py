from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime

class CategoryBase(BaseModel):
    category_name: str = Field(..., max_length=255)

class CategoryCreate(CategoryBase):
    pass

class CategoryOut(CategoryBase):
    category_id: int

    class Config:
        from_attributes = True

class ProductBase(BaseModel):
    category_id: int
    product_code: str = Field(..., max_length=50)
    product_name: str = Field(..., max_length=255)
    description: Optional[str] = ""
    list_price: float = Field(..., gt=0)
    discount_percent: float = Field(default=0.0, ge=0, le=100)
    date_added: Optional[datetime] = None

class ProductCreate(ProductBase):
    pass

class ProductUpdate(BaseModel):
    category_id: Optional[int] = None
    product_code: Optional[str] = Field(None, max_length=50)
    product_name: Optional[str] = Field(None, max_length=255)
    description: Optional[str] = None
    list_price: Optional[float] = Field(None, gt=0)
    discount_percent: Optional[float] = Field(None, ge=0, le=100)

class ProductOut(ProductBase):
    product_id: int
    category: Optional[CategoryOut] = None

    class Config:
        from_attributes = True

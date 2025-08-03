from pydantic import BaseModel
from typing import Optional

class ProductCreate(BaseModel):
    name: str
    sku: str
    brand: str
    price: float
    inventory: int

class ProductUpdate(BaseModel):
    name: Optional[str]
    sku: Optional[str]
    brand: Optional[str]
    price: Optional[float]
    inventory: Optional[int]

class Product(BaseModel):
    id: int
    name: str
    sku: str
    brand: str
    price: float
    inventory: int

    class Config:
        orm_mode = True

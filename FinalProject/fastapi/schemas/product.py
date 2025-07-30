from pydantic import BaseModel
from typing import Optional

class ProductCreate(BaseModel):
    name: str
    description: Optional[str]

class ProductUpdate(BaseModel):
    name: Optional[str]
    description: Optional[str]

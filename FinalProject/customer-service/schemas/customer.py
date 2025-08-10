from pydantic import BaseModel, EmailStr, constr
from typing import Optional

# Shared base for reusable fields
class CustomerBase(BaseModel):
    email_address: EmailStr
    password: constr(min_length=8)
    first_name: constr(max_length=50)
    last_name: constr(max_length=50)
    shipping_address_id: Optional[int] = None
    billing_address_id: Optional[int] = None

# For incoming customer creation requests
class CustomerCreate(CustomerBase):
    email_address: EmailStr
    password: constr(min_length=8)
    first_name: constr(max_length=50)
    last_name: constr(max_length=50)


# For partial updates
class CustomerUpdate(BaseModel):
    email_address: Optional[EmailStr] = None
    password: Optional[constr(min_length=8)] = None
    first_name: Optional[constr(max_length=50)] = None
    last_name: Optional[constr(max_length=50)] = None
    shipping_address_id: Optional[int] = None
    billing_address_id: Optional[int] = None

# Public-facing schema
class CustomerOut(BaseModel):
    customer_id: int
    email_address: str
    first_name: str
    last_name: str

# Internal schema used only by auth-service
class CustomerAuth(BaseModel):
    customer_id: int
    email_address: str
    password: str

class Config:
    orm_mode = True

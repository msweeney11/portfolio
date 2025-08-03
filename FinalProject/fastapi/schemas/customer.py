from pydantic import BaseModel, EmailStr, constr
from typing import Optional

# Shared base for reusable fields
class CustomerBase(BaseModel):
    email_address: EmailStr
    password: constr(min_length=8)  # Consider hashing this before storing
    first_name: constr(max_length=50)
    last_name: constr(max_length=50)
    shipping_address_id: Optional[int] = None
    billing_address_id: Optional[int] = None

# For incoming customer creation requests
class CustomerCreate(CustomerBase):
    pass

# For partial updates
class CustomerUpdate(BaseModel):
    email_address: Optional[EmailStr] = None
    password: Optional[constr(min_length=8)] = None
    first_name: Optional[constr(max_length=50)] = None
    last_name: Optional[constr(max_length=50)] = None
    shipping_address_id: Optional[int] = None
    billing_address_id: Optional[int] = None

# For responses (includes ID and ORM compatibility)
class CustomerOut(CustomerBase):
    customer_id: int

    class Config:
        orm_mode = True

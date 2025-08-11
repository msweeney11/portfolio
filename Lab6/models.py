from pydantic import BaseModel

class ProductUpdate(BaseModel):
    product_id: int
    discount_percent: float

class CustomerUpdate(BaseModel):
    customer_id: int
    first_name: str
    last_name: str

class AddressUpdate(BaseModel):
    address_id: int
    zip_code: str

class OrderItemUpdate(BaseModel):
    item_id: int
    quantity: int

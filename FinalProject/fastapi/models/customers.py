from sqlalchemy import Column, Integer, String, ForeignKey
from .database import Base

class Customer(Base):
    __tablename__ = "customers"

    customer_id = Column(Integer, primary_key=True)
    email_address = Column(String(255), nullable=False, unique=True)
    password = Column(String(60), nullable=False)
    first_name = Column(String(60), nullable=False)
    last_name = Column(String(60), nullable=False)
    shipping_address_id = Column(Integer, ForeignKey("addresses.address_id"))
    billing_address_id = Column(Integer, ForeignKey("addresses.address_id"))

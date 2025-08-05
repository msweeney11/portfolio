from sqlalchemy import Column, Integer, DateTime, ForeignKey, String, Numeric, CHAR
from .database import Base

class Order(Base):
    __tablename__ = "orders"

    order_id = Column(Integer, primary_key=True)
    customer_id = Column(Integer, ForeignKey("customers.customer_id"))
    order_date = Column(DateTime)
    ship_amount = Column(Numeric(10, 2))
    tax_amount = Column(Numeric(10, 2))
    ship_date = Column(DateTime)
    ship_address_id = Column(Integer, ForeignKey("addresses.address_id"))
    card_type = Column(String(50))
    card_number = Column(CHAR(16))
    card_expires = Column(CHAR(7))
    billing_address_id = Column(Integer, ForeignKey("addresses.address_id"))

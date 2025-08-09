from sqlalchemy import Column, Integer, DateTime, ForeignKey, String, Numeric, CHAR
from .database import Base

class Order(Base):
    __tablename__ = "orders"

    order_id = Column(Integer, primary_key=True)
    customer_id = Column(Integer, nullable=False)
    order_date = Column(DateTime, nullable=False)
    ship_amount = Column(Numeric(10, 2), nullable=False)
    tax_amount = Column(Numeric(10, 2), nullable=False)
    ship_date = Column(DateTime)
    ship_address_id = Column(Integer, nullable=False)
    card_type = Column(String(50), nullable=False)
    card_number = Column(CHAR(16), nullable=False)
    card_expires = Column(CHAR(7), nullable=False)
    billing_address_id = Column(Integer, nullable=False)

# order-service/models/order_items.py
from sqlalchemy import Column, Integer, ForeignKey, Numeric
from .database import Base

class OrderItem(Base):
    __tablename__ = "order_items"

    item_id = Column(Integer, primary_key=True)
    order_id = Column(Integer, ForeignKey("orders.order_id"), nullable=False)
    product_id = Column(Integer, nullable=False)
    item_price = Column(Numeric(10, 2), nullable=False)
    discount_amount = Column(Numeric(10, 2), nullable=False)
    quantity = Column(Integer, nullable=False)

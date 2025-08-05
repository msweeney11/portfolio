from sqlalchemy import Column, Integer, ForeignKey, Numeric
from .database import Base

class OrderItem(Base):
    __tablename__ = "order_items"

    item_id = Column(Integer, primary_key=True)
    order_id = Column(Integer, ForeignKey("orders.order_id"))
    product_id = Column(Integer, ForeignKey("products.product_id"))
    item_price = Column(Numeric(10, 2))
    discount_amount = Column(Numeric(10, 2))
    quantity = Column(Integer)

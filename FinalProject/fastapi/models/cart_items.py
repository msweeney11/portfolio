from sqlalchemy import Column, Integer, ForeignKey
from .database import Base

class CartItem(Base):
    __tablename__ = "cart_items"
    id = Column(Integer, primary_key=True)
    product_id = Column(Integer, ForeignKey("products.id"))
    customer_id = Column(Integer, ForeignKey("customers.id"))
    quantity = Column(Integer)

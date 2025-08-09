from sqlalchemy import Column, BigInteger, Integer, ForeignKey, DateTime, func
from .database import Base

class CartItem(Base):
    __tablename__ = "cart_items"

    id = Column(BigInteger, primary_key=True)
    customer_id = Column(Integer, nullable=False)
    product_id = Column(Integer, nullable=False)
    quantity = Column(Integer, nullable=False, default=1)
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())

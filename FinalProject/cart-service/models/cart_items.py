from sqlalchemy import Column, BigInteger, Integer, ForeignKey, DateTime
from models.database import Base

class CartItem(Base):
    __tablename__ = "cart_items"

    id = Column(BigInteger, primary_key=True)
    customer_id = Column(Integer, ForeignKey("customers.customer_id"))
    product_id = Column(Integer, ForeignKey("products.product_id"))
    quantity = Column(Integer, nullable=False)
    updated_at = Column(DateTime)

from sqlalchemy import Column, BigInteger, Integer, ForeignKey
from .database import Base

class Wishlist(Base):
    __tablename__ = "wishlist"

    id = Column(BigInteger, primary_key=True)
    user_id = Column(Integer, ForeignKey("customers.customer_id"))
    product_id = Column(Integer, ForeignKey("products.product_id"))

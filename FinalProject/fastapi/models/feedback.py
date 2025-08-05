from sqlalchemy import Column, BigInteger, Integer, Text, DateTime, ForeignKey
from .database import Base

class Feedback(Base):
    __tablename__ = "feedback"

    id = Column(BigInteger, primary_key=True)
    customer_id = Column(Integer, ForeignKey("customers.customer_id"))
    product_id = Column(Integer, ForeignKey("products.product_id"))
    rating = Column(Integer, nullable=False)
    comment = Column(Text)
    created_at = Column(DateTime)

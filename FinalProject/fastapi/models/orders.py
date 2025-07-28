from sqlalchemy import Column, Integer, DateTime
from .database import Base

class Order(Base):
    __tablename__ = "orders"
    id = Column(Integer, primary_key=True)
    customer_id = Column(Integer)
    status = Column(String(50))
    timestamp = Column(DateTime)

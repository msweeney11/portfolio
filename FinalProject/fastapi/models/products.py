from sqlalchemy import Column, Integer, String, Float
from .database import Base

class Product(Base):
    __tablename__ = "products"
    id = Column(Integer, primary_key=True)
    name = Column(String(100))
    sku = Column(String(50))
    brand = Column(String(50))
    price = Column(Float)
    inventory = Column(Integer)

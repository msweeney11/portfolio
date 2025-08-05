from sqlalchemy import Column, Integer, String, Text, Numeric, DateTime, ForeignKey
from .database import Base

class Product(Base):
    __tablename__ = "products"

    product_id = Column(Integer, primary_key=True)
    category_id = Column(Integer, ForeignKey("categories.category_id"))
    product_code = Column(String(10))
    product_name = Column(String(255))
    description = Column(Text)
    list_price = Column(Numeric(10, 2))
    discount_percent = Column(Numeric(10, 2))
    date_added = Column(DateTime)

from sqlalchemy import Column, Integer, String, Text, Numeric, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from .database import Base

class Product(Base):
    __tablename__ = "products"

    product_id = Column(Integer, primary_key=True)
    category_id = Column(Integer, ForeignKey("categories.category_id"), nullable=False)
    product_code = Column(String(10), unique=True, nullable=False)
    product_name = Column(String(255), nullable=False)
    description = Column(Text)
    list_price = Column(Numeric(10, 2), nullable=False)
    discount_percent = Column(Numeric(10, 2), default=0.0)
    date_added = Column(DateTime)

    # Relationship to category
    category = relationship("Category", back_populates="products")

# products-service/models/categories.py
from sqlalchemy import Column, Integer, String
from sqlalchemy.orm import relationship
from .database import Base

class Category(Base):
    __tablename__ = "categories"

    category_id = Column(Integer, primary_key=True)
    category_name = Column(String(255), nullable=False, unique=True)

    # Relationship to products
    products = relationship("Product", back_populates="category")

# products-service/models/__init__.py
from .database import get_db, Base
from .products import Product
from .categories import Category

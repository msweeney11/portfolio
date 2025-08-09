from sqlalchemy import Column, Integer, String
from sqlalchemy.orm import relationship
from .database import Base

class Category(Base):
    __tablename__ = "categories"

    category_id = Column(Integer, primary_key=True)
    category_name = Column(String(255), nullable=False, unique=True)

    # Relationship to products
    products = relationship("Product", back_populates="category")

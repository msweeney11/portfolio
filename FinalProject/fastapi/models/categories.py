from sqlalchemy import Column, Integer, String
from .database import Base

class Category(Base):
    __tablename__ = "categories"

    category_id = Column(Integer, primary_key=True)
    category_name = Column(String(255), nullable=False)

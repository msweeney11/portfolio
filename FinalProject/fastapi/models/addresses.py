from sqlalchemy import Column, Integer, String
from .database import Base

class Address(Base):
    __tablename__ = "addresses"
    id = Column(Integer, primary_key=True)
    street = Column(String(100))
    city = Column(String(50))
    zip_code = Column(String(10))

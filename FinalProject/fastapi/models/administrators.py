from sqlalchemy import Column, Integer, String
from database import Base

class Administrator(Base):
    __tablename__ = "administrators"
    id = Column(Integer, primary_key=True)
    username = Column(String(50))
    email = Column(String(100))

from sqlalchemy import Column, Integer, String
from .database import Base

class Administrator(Base):
    __tablename__ = "administrators"

    admin_id = Column(Integer, primary_key=True)
    email_address = Column(String(255), nullable=False, unique=True)
    password = Column(String(255), nullable=False)
    first_name = Column(String(255), nullable=False)
    last_name = Column(String(255), nullable=False)

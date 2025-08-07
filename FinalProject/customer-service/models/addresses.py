from sqlalchemy import Column, Integer, String, Boolean, ForeignKey
from models.database import Base

class Address(Base):
    __tablename__ = "addresses"

    address_id = Column(Integer, primary_key=True)
    customer_id = Column(Integer, ForeignKey("customers.customer_id"))
    line1 = Column(String(60), nullable=False)
    line2 = Column(String(60))
    city = Column(String(40), nullable=False)
    state = Column(String(2), nullable=False)
    zip_code = Column(String(10), nullable=False)
    phone = Column(String(12))
    disabled = Column(Boolean, default=False)

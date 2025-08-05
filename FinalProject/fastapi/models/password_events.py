from sqlalchemy import Column, BigInteger, Integer, String, DateTime, ForeignKey
from .database import Base

class PasswordEvent(Base):
    __tablename__ = "password_events"

    id = Column(BigInteger, primary_key=True)
    customer_id = Column(Integer, ForeignKey("customers.customer_id"))
    event_type = Column(String(50))
    event_timestamp = Column(DateTime)

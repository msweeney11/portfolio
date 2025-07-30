from sqlalchemy import Column, Integer, DateTime
from database import Base

class PasswordEvent(Base):
    __tablename__ = "password_events"
    id = Column(Integer, primary_key=True)
    customer_id = Column(Integer)
    event_time = Column(DateTime)

from sqlalchemy import Column, Integer, String, DateTime
from .database import Base

class UserSession(Base):
    __tablename__ = "user_sessions"
    id = Column(Integer, primary_key=True)
    customer_id = Column(Integer)
    session_token = Column(String(255))
    expires_at = Column(DateTime)

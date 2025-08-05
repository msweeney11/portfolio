from sqlalchemy import Column, BigInteger, Integer, String, Text, Boolean, DateTime, ForeignKey
from .database import Base

class UserSession(Base):
    __tablename__ = "user_sessions"

    id = Column(BigInteger, primary_key=True)
    customer_id = Column(Integer, ForeignKey("customers.customer_id"))
    session_token = Column(String(512), nullable=False)
    user_agent = Column(Text)
    ip_address = Column(String(45))
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime)
    expires_at = Column(DateTime)

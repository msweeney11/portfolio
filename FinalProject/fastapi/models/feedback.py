from sqlalchemy import Column, Integer, Text
from .database import Base

class Feedback(Base):
    __tablename__ = "feedback"
    id = Column(Integer, primary_key=True)
    customer_id = Column(Integer)
    comments = Column(Text)
    rating = Column(Integer)

from sqlalchemy import Column, Integer, DateTime, ForeignKey, UniqueConstraint
from .database import Base
from datetime import datetime

class WishlistItem(Base):
    __tablename__ = "wishlist_items"

    id = Column(Integer, primary_key=True, index=True)
    customer_id = Column(Integer, nullable=False)
    product_id = Column(Integer, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Ensure customer can't add same product twice
    __table_args__ = (
        UniqueConstraint('customer_id', 'product_id', name='unique_customer_product_wishlist'),
    )

from sqlalchemy import Column, Integer, String, ForeignKey
from database import Base

class ProductImage(Base):
    __tablename__ = "product_images"
    id = Column(Integer, primary_key=True)
    product_id = Column(Integer, ForeignKey("products.id"))
    image_url = Column(String(255))

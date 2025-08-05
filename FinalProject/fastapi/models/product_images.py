from sqlalchemy import Column, BigInteger, Integer, Text, ForeignKey
from .database import Base

class ProductImage(Base):
    __tablename__ = "product_images"

    id = Column(BigInteger, primary_key=True)
    product_id = Column(Integer, ForeignKey("products.product_id"))
    image_url = Column(Text)

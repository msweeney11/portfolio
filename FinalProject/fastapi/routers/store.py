from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
"""from models.database import SessionLocal
from models.product import Product

router = APIRouter()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.get("/products")
def get_products(db: Session = Depends(get_db)):
    products = db.query(Product).all()
    return [{"id": p.id, "name": p.name} for p in products]"""

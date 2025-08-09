from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from models.cart_items import CartItem
from schemas.cart_item import CartItemCreate, CartItemOut
from models.database import SessionLocal

router = APIRouter()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.post("/cart-items", response_model=CartItemOut, status_code=201)
def add_to_cart(item: CartItemCreate, db: Session = Depends(get_db)):
    cart_item = CartItem(**item.dict())
    db.add(cart_item)
    db.commit()
    db.refresh(cart_item)
    return cart_item

@router.get("/cart-items", response_model=list[CartItemOut])
def get_cart(customer_id: int, db: Session = Depends(get_db)):
    return db.query(CartItem).filter(CartItem.customer_id == customer_id).all()

@router.delete("/cart-items/{item_id}", status_code=204)
def remove_from_cart(item_id: int, db: Session = Depends(get_db)):
    item = db.query(CartItem).filter(CartItem.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    db.delete(item)
    db.commit()

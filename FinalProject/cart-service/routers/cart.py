from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from models.cart_items import CartItem
from schemas.cart_item import CartItemCreate, CartItemOut
from models.database import SessionLocal

router = APIRouter()

# Creates and manages database session lifecycle for dependency injection
# Yields database session for request processing, ensures proper cleanup on completion
# Used as FastAPI dependency to provide database access to route handlers
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# POST /cart-items — Adds a new item to customer's shopping cart
# Creates CartItem record with customer ID, product ID, and quantity
# Returns created cart item with generated ID and timestamp
@router.post("/cart-items", response_model=CartItemOut, status_code=201)
def add_to_cart(item: CartItemCreate, db: Session = Depends(get_db)):
    cart_item = CartItem(**item.dict())
    db.add(cart_item)
    db.commit()
    db.refresh(cart_item)
    return cart_item

# GET /cart-items — Retrieves all cart items for a specific customer
# Filters cart items by customer ID and returns complete list
# Used to display customer's current shopping cart contents
@router.get("/cart-items", response_model=list[CartItemOut])
def get_cart(customer_id: int, db: Session = Depends(get_db)):
    return db.query(CartItem).filter(CartItem.customer_id == customer_id).all()

# DELETE /cart-items/{item_id} — Removes specific item from shopping cart
# Finds cart item by ID, deletes it from database if found
# Returns 404 error if item doesn't exist, 204 on successful deletion
@router.delete("/cart-items/{item_id}", status_code=204)
def remove_from_cart(item_id: int, db: Session = Depends(get_db)):
    item = db.query(CartItem).filter(CartItem.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    db.delete(item)
    db.commit()

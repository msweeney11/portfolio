from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from models import Order, get_db
from schemas import OrderCreate, OrderUpdate

router = APIRouter(prefix="/orders", tags=["Orders"])

# POST /orders/ — Creates a new order record in the database
# Accepts OrderCreate schema, creates Order instance with current data
# Returns created order with generated ID and details
@router.post("/", response_model=OrderCreate, status_code=status.HTTP_201_CREATED)
def create_order(order: OrderCreate, db: Session = Depends(get_db)):
    new_order = Order(**order.dict())
    db.add(new_order)
    db.commit()
    db.refresh(new_order)
    return new_order

# GET /orders/ — Retrieves all orders from the database
# Returns complete list of orders for administrative or reporting purposes
# Used to view all order records in the system
@router.get("/", response_model=list[OrderCreate])
def get_orders(db: Session = Depends(get_db)):
    return db.query(Order).all()

# GET /orders/{order_id} — Retrieves specific order by ID
# Returns order details for the specified order ID
# Raises 404 error if order doesn't exist
@router.get("/{order_id}", response_model=OrderCreate)
def get_order(order_id: int, db: Session = Depends(get_db)):
    order = db.query(Order).get(order_id)
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    return order

# PUT /orders/{order_id} — Updates existing order with partial data
# Accepts OrderUpdate schema for partial updates, preserves unchanged fields
# Returns updated order data or raises 404 if order doesn't exist
@router.put("/{order_id}", response_model=OrderCreate)
def update_order(order_id: int, order_update: OrderUpdate, db: Session = Depends(get_db)):
    order = db.query(Order).get(order_id)
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    for key, value in order_update.dict(exclude_unset=True).items():
        setattr(order, key, value)
    db.commit()
    db.refresh(order)
    return order

# DELETE /orders/{order_id} — Removes order from database
# Permanently deletes order record for the specified ID
# Returns 204 status on success or 404 if order doesn't exist
@router.delete("/{order_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_order(order_id: int, db: Session = Depends(get_db)):
    order = db.query(Order).get(order_id)
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    db.delete(order)
    db.commit()

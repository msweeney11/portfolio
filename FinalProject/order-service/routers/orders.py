from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import select
from models import get_db, Order, OrderItem
from schemas import OrderCreate, OrderOut, OrderUpdate, OrderItemOut
from datetime import datetime
import httpx

router = APIRouter()


async def validate_customer(customer_id: int):
  """Validate customer exists via customer service"""
  try:
    async with httpx.AsyncClient() as client:
      response = await client.get(f"http://customer-service:8003/customers/{customer_id}")
      return response.status_code == 200
  except httpx.RequestError:
    return False


async def get_product_info(product_id: int):
  """Get product information from product service"""
  try:
    async with httpx.AsyncClient() as client:
      response = await client.get(f"http://products-service:8004/products/{product_id}")
      if response.status_code == 200:
        return response.json()
      return None
  except httpx.RequestError:
    return None


@router.post("/", response_model=OrderOut, status_code=status.HTTP_201_CREATED)
async def create_order(order_data: OrderCreate, db: Session = Depends(get_db)):
  # Validate customer exists
  if not await validate_customer(order_data.customer_id):
    raise HTTPException(status_code=400, detail="Customer not found")

  # Validate all products exist and get their info
  for item in order_data.items:
    product_info = await get_product_info(item.product_id)
    if not product_info:
      raise HTTPException(status_code=400, detail=f"Product {item.product_id} not found")

  # Create order
  order = Order(
    customer_id=order_data.customer_id,
    order_date=datetime.now(),
    ship_amount=order_data.ship_amount,
    tax_amount=order_data.tax_amount,
    ship_address_id=order_data.ship_address_id,
    card_type=order_data.card_type,
    card_number=order_data.card_number,
    card_expires=order_data.card_expires,
    billing_address_id=order_data.billing_address_id
  )

  db.add(order)
  db.commit()
  db.refresh(order)

  # Create order items
  order_items = []
  for item_data in order_data.items:
    order_item = OrderItem(
      order_id=order.order_id,
      product_id=item_data.product_id,
      item_price=item_data.item_price,
      discount_amount=item_data.discount_amount,
      quantity=item_data.quantity
    )
    db.add(order_item)
    order_items.append(order_item)

  db.commit()

  # Refresh items to get their IDs
  for item in order_items:
    db.refresh(item)

  # Return order with items
  order_out = OrderOut.from_orm(order)
  order_out.items = [OrderItemOut.from_orm(item) for item in order_items]

  return order_out


@router.get("/", response_model=list[OrderOut])
async def get_orders(customer_id: int = None, db: Session = Depends(get_db)):
  query = db.query(Order)
  if customer_id:
    query = query.filter(Order.customer_id == customer_id)

  orders = query.all()

  # Get items for each order
  result = []
  for order in orders:
    order_items = db.query(OrderItem).filter(OrderItem.order_id == order.order_id).all()
    order_out = OrderOut.from_orm(order)
    order_out.items = [OrderItemOut.from_orm(item) for item in order_items]
    result.append(order_out)

  return result


@router.get("/{order_id}", response_model=OrderOut)
async def get_order(order_id: int, db: Session = Depends(get_db)):
  order = db.query(Order).filter(Order.order_id == order_id).first()
  if not order:
    raise HTTPException(status_code=404, detail="Order not found")

  # Get order items
  order_items = db.query(OrderItem).filter(OrderItem.order_id == order_id).all()

  order_out = OrderOut.from_orm(order)
  order_out.items = [OrderItemOut.from_orm(item) for item in order_items]

  return order_out


@router.put("/{order_id}", response_model=OrderOut)
async def update_order(order_id: int, order_update: OrderUpdate, db: Session = Depends(get_db)):
  order = db.query(Order).filter(Order.order_id == order_id).first()
  if not order:
    raise HTTPException(status_code=404, detail="Order not found")

  for key, value in order_update.dict(exclude_unset=True).items():
    setattr(order, key, value)

  db.commit()
  db.refresh(order)

  # Get order items
  order_items = db.query(OrderItem).filter(OrderItem.order_id == order_id).all()

  order_out = OrderOut.from_orm(order)
  order_out.items = [OrderItemOut.from_orm(item) for item in order_items]

  return order_out


@router.delete("/{order_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_order(order_id: int, db: Session = Depends(get_db)):
  order = db.query(Order).filter(Order.order_id == order_id).first()
  if not order:
    raise HTTPException(status_code=404, detail="Order not found")

  # Delete order items first
  db.query(OrderItem).filter(OrderItem.order_id == order_id).delete()

  # Delete order
  db.delete(order)
  db.commit()


@router.get("/customer/{customer_id}/orders", response_model=list[OrderOut])
async def get_customer_orders(customer_id: int, db: Session = Depends(get_db)):
  # Validate customer exists
  if not await validate_customer(customer_id):
    raise HTTPException(status_code=404, detail="Customer not found")

  return await get_orders(customer_id=customer_id, db=db)

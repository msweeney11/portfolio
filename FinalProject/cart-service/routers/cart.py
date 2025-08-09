from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from models import get_db, CartItem
from schemas import CartItemCreate, CartItemUpdate, CartItemOut, CartSummary, ProductInfo
import httpx

router = APIRouter()


async def get_product_info(product_id: int):
  """Get product information from products service"""
  try:
    async with httpx.AsyncClient() as client:
      response = await client.get(f"http://products-service:8004/products/{product_id}")
      if response.status_code == 200:
        return response.json()
      return None
  except httpx.RequestError:
    return None


async def validate_customer(customer_id: int):
  """Validate customer exists via customer service"""
  try:
    async with httpx.AsyncClient() as client:
      response = await client.get(f"http://customer-service:8003/customers/{customer_id}")
      return response.status_code == 200
  except httpx.RequestError:
    return False


@router.post("/{customer_id}/items", response_model=CartItemOut, status_code=status.HTTP_201_CREATED)
async def add_to_cart(customer_id: int, item: CartItemCreate, db: Session = Depends(get_db)):
  # Validate customer exists
  if not await validate_customer(customer_id):
    raise HTTPException(status_code=404, detail="Customer not found")

  # Validate product exists
  product_info = await get_product_info(item.product_id)
  if not product_info:
    raise HTTPException(status_code=404, detail="Product not found")

  # Check if item already exists in cart
  existing_item = db.query(CartItem).filter(
    CartItem.customer_id == customer_id,
    CartItem.product_id == item.product_id
  ).first()

  if existing_item:
    # Update quantity
    existing_item.quantity += item.quantity
    db.commit()
    db.refresh(existing_item)
    cart_item = existing_item
  else:
    # Create new cart item
    cart_item = CartItem(
      customer_id=customer_id,
      product_id=item.product_id,
      quantity=item.quantity
    )
    db.add(cart_item)
    db.commit()
    db.refresh(cart_item)

  # Add product info and calculate subtotal
  result = CartItemOut.from_orm(cart_item)
  result.product_info = ProductInfo(**product_info)
  price = product_info["list_price"]
  discount = product_info["discount_percent"]
  discounted_price = price * (1 - discount / 100)
  result.subtotal = discounted_price * cart_item.quantity

  return result


@router.get("/{customer_id}", response_model=CartSummary)
async def get_cart(customer_id: int, db: Session = Depends(get_db)):
  # Validate customer exists
  if not await validate_customer(customer_id):
    raise HTTPException(status_code=404, detail="Customer not found")

  cart_items = db.query(CartItem).filter(CartItem.customer_id == customer_id).all()

  enriched_items = []
  total_items = 0
  total_amount = 0
  discount_amount = 0

  for cart_item in cart_items:
    product_info = await get_product_info(cart_item.product_id)
    if product_info:
      item_out = CartItemOut.from_orm(cart_item)
      item_out.product_info = ProductInfo(**product_info)

      price = product_info["list_price"]
      discount_percent = product_info["discount_percent"]
      item_discount = price * (discount_percent / 100) * cart_item.quantity
      discounted_price = price * (1 - discount_percent / 100)
      subtotal = discounted_price * cart_item.quantity

      item_out.subtotal = subtotal
      enriched_items.append(item_out)

      total_items += cart_item.quantity
      total_amount += price * cart_item.quantity
      discount_amount += item_discount

  final_amount = total_amount - discount_amount

  return CartSummary(
    items=enriched_items,
    total_items=total_items,
    total_amount=total_amount,
    discount_amount=discount_amount,
    final_amount=final_amount
  )


@router.put("/{customer_id}/items/{item_id}", response_model=CartItemOut)
async def update_cart_item(customer_id: int, item_id: int, item_update: CartItemUpdate, db: Session = Depends(get_db)):
  cart_item = db.query(CartItem).filter(
    CartItem.id == item_id,
    CartItem.customer_id == customer_id
  ).first()

  if not cart_item:
    raise HTTPException(status_code=404, detail="Cart item not found")

  cart_item.quantity = item_update.quantity
  db.commit()
  db.refresh(cart_item)

  # Get product info and calculate subtotal
  product_info = await get_product_info(cart_item.product_id)
  result = CartItemOut.from_orm(cart_item)
  if product_info:
    result.product_info = ProductInfo(**product_info)
    price = product_info["list_price"]
    discount = product_info["discount_percent"]
    discounted_price = price * (1 - discount / 100)
    result.subtotal = discounted_price * cart_item.quantity

  return result


@router.delete("/{customer_id}/items/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
async def remove_from_cart(customer_id: int, item_id: int, db: Session = Depends(get_db)):
  cart_item = db.query(CartItem).filter(
    CartItem.id == item_id,
    CartItem.customer_id == customer_id
  ).first()

  if not cart_item:
    raise HTTPException(status_code=404, detail="Cart item not found")

  db.delete(cart_item)
  db.commit()


@router.delete("/{customer_id}", status_code=status.HTTP_204_NO_CONTENT)
async def clear_cart(customer_id: int, db: Session = Depends(get_db)):
  # Validate customer exists
  if not await validate_customer(customer_id):
    raise HTTPException(status_code=404, detail="Customer not found")

  db.query(CartItem).filter(CartItem.customer_id == customer_id).delete()
  db.commit()


@router.get("/{customer_id}/count")
async def get_cart_count(customer_id: int, db: Session = Depends(get_db)):
  total = db.query(CartItem).filter(CartItem.customer_id == customer_id).count()
  return {"count": total}

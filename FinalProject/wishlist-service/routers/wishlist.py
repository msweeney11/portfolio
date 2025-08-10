from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from models import get_db, WishlistItem
from schemas import WishlistItemCreate, WishlistItemOut
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
      response = await client.get(f"http://products-service:8005/products/{product_id}")
      if response.status_code == 200:
        return response.json()
      return None
  except httpx.RequestError:
    return None


@router.post("/", response_model=WishlistItemOut, status_code=status.HTTP_201_CREATED)
async def add_to_wishlist(item_data: WishlistItemCreate, db: Session = Depends(get_db)):
  # Validate customer exists
  if not await validate_customer(item_data.customer_id):
    raise HTTPException(status_code=400, detail="Customer not found")

  # Validate product exists
  product_info = await get_product_info(item_data.product_id)
  if not product_info:
    raise HTTPException(status_code=400, detail="Product not found")

  # Check if item already exists
  existing_item = db.query(WishlistItem).filter(
    WishlistItem.customer_id == item_data.customer_id,
    WishlistItem.product_id == item_data.product_id
  ).first()

  if existing_item:
    raise HTTPException(status_code=400, detail="Item already in wishlist")

  # Create wishlist item
  wishlist_item = WishlistItem(
    customer_id=item_data.customer_id,
    product_id=item_data.product_id
  )

  try:
    db.add(wishlist_item)
    db.commit()
    db.refresh(wishlist_item)

    # Add product info to response
    result = WishlistItemOut.from_orm(wishlist_item)
    result.product = product_info

    return result
  except IntegrityError:
    db.rollback()
    raise HTTPException(status_code=400, detail="Item already in wishlist")


@router.get("/customer/{customer_id}", response_model=list[WishlistItemOut])
async def get_customer_wishlist(customer_id: int, db: Session = Depends(get_db)):
  # Validate customer exists
  if not await validate_customer(customer_id):
    raise HTTPException(status_code=404, detail="Customer not found")

  wishlist_items = db.query(WishlistItem).filter(
    WishlistItem.customer_id == customer_id
  ).all()

  # Get product information for each item
  result = []
  for item in wishlist_items:
    product_info = await get_product_info(item.product_id)
    item_out = WishlistItemOut.from_orm(item)
    if product_info:
      item_out.product = product_info
    result.append(item_out)

  return result


@router.delete("/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
async def remove_from_wishlist(item_id: int, db: Session = Depends(get_db)):
  item = db.query(WishlistItem).filter(WishlistItem.id == item_id).first()

  if not item:
    raise HTTPException(status_code=404, detail="Wishlist item not found")

  db.delete(item)
  db.commit()


@router.delete("/customer/{customer_id}/product/{product_id}", status_code=status.HTTP_204_NO_CONTENT)
async def remove_from_wishlist_by_product(customer_id: int, product_id: int, db: Session = Depends(get_db)):
  item = db.query(WishlistItem).filter(
    WishlistItem.customer_id == customer_id,
    WishlistItem.product_id == product_id
  ).first()

  if not item:
    raise HTTPException(status_code=404, detail="Item not found in wishlist")

  db.delete(item)
  db.commit()


@router.delete("/customer/{customer_id}", status_code=status.HTTP_204_NO_CONTENT)
async def clear_customer_wishlist(customer_id: int, db: Session = Depends(get_db)):
  # Validate customer exists
  if not await validate_customer(customer_id):
    raise HTTPException(status_code=404, detail="Customer not found")

  db.query(WishlistItem).filter(WishlistItem.customer_id == customer_id).delete()
  db.commit()


@router.get("/customer/{customer_id}/count")
async def get_wishlist_count(customer_id: int, db: Session = Depends(get_db)):
  count = db.query(WishlistItem).filter(WishlistItem.customer_id == customer_id).count()
  return {"count": count}

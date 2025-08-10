from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session, joinedload
from models import get_db, Product, Category
from schemas import ProductCreate, ProductOut, ProductUpdate
from datetime import datetime
from typing import Optional
import uuid

router = APIRouter()


# Generates a unique 8-character product code using UUID
# Returns uppercase string that serves as unique identifier for products
# Used when product code is not provided during product creation
def generate_product_code():
  """Generate a unique product code"""
  return str(uuid.uuid4())[:8].upper()


# POST /products/ — Creates a new product with validation and auto-generated code
# Validates category exists, generates unique product code if not provided
# Creates Product record with current timestamp and returns product with category details
@router.post("/", response_model=ProductOut, status_code=status.HTTP_201_CREATED)
async def create_product(product: ProductCreate, db: Session = Depends(get_db)):
  # Check if category exists
  category = db.query(Category).filter(Category.category_id == product.category_id).first()
  if not category:
    raise HTTPException(status_code=400, detail="Category not found")

  # Generate product code if not provided
  product_code = product.product_code
  if not product_code or product_code.strip() == "":
    product_code = generate_product_code()
    # Ensure uniqueness
    while db.query(Product).filter(Product.product_code == product_code).first():
      product_code = generate_product_code()

  # Check if product code already exists
  existing = db.query(Product).filter(Product.product_code == product_code).first()
  if existing:
    raise HTTPException(status_code=400, detail="Product code already exists")

  product_dict = product.dict()
  product_dict["product_code"] = product_code
  if not product_dict.get("date_added"):
    product_dict["date_added"] = datetime.now()

  new_product = Product(**product_dict)
  db.add(new_product)
  db.commit()
  db.refresh(new_product)

  # Load with category relationship
  product_with_category = db.query(Product).options(joinedload(Product.category)).filter(
    Product.product_id == new_product.product_id).first()
  return product_with_category


# GET /products/ — Retrieves products with optional filtering and pagination
# Supports filtering by category, search terms, price range with skip/limit pagination
# Returns products with category details loaded for comprehensive product information
@router.get("", response_model=list[ProductOut])  # no slash
@router.get("/", response_model=list[ProductOut])  # slash version
async def get_products(
  category_id: Optional[int] = Query(None),
  search: Optional[str] = Query(None),
  min_price: Optional[float] = Query(None),
  max_price: Optional[float] = Query(None),
  skip: int = Query(0, ge=0),
  limit: int = Query(100, ge=1, le=1000),
  db: Session = Depends(get_db)
):
  query = db.query(Product).options(joinedload(Product.category))

  if category_id:
    query = query.filter(Product.category_id == category_id)

  if search:
    query = query.filter(
      Product.product_name.contains(search) |
      Product.description.contains(search)
    )

  if min_price is not None:
    query = query.filter(Product.list_price >= min_price)

  if max_price is not None:
    query = query.filter(Product.list_price <= max_price)

  return query.offset(skip).limit(limit).all()


# GET /products/{product_id} — Retrieves specific product by ID with category details
# Returns complete product information including associated category
# Raises 404 error if product doesn't exist
@router.get("/{product_id}", response_model=ProductOut)
async def get_product(product_id: int, db: Session = Depends(get_db)):
  product = db.query(Product).options(joinedload(Product.category)).filter(Product.product_id == product_id).first()
  if not product:
    raise HTTPException(status_code=404, detail="Product not found")
  return product


# PUT /products/{product_id} — Updates existing product with validation
# Validates category and product code uniqueness if being updated
# Returns updated product with category details or raises appropriate errors
@router.put("/{product_id}", response_model=ProductOut)
async def update_product(product_id: int, product_update: ProductUpdate, db: Session = Depends(get_db)):
  product = db.query(Product).filter(Product.product_id == product_id).first()
  if not product:
    raise HTTPException(status_code=404, detail="Product not found")

  # Check category if being updated
  if product_update.category_id:
    category = db.query(Category).filter(Category.category_id == product_update.category_id).first()
    if not category:
      raise HTTPException(status_code=400, detail="Category not found")

  # Check product code uniqueness if being updated
  if product_update.product_code:
    existing = db.query(Product).filter(
      Product.product_code == product_update.product_code,
      Product.product_id != product_id
    ).first()
    if existing:
      raise HTTPException(status_code=400, detail="Product code already exists")

  for key, value in product_update.dict(exclude_unset=True).items():
    setattr(product, key, value)

  db.commit()
  db.refresh(product)

  # Load with category relationship
  product_with_category = db.query(Product).options(joinedload(Product.category)).filter(
    Product.product_id == product_id).first()
  return product_with_category


# DELETE /products/{product_id} — Removes product from database
# Deletes product record permanently from the database
# Returns 204 status on success or 404 if product doesn't exist
@router.delete("/{product_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_product(product_id: int, db: Session = Depends(get_db)):
  product = db.query(Product).filter(Product.product_id == product_id).first()
  if not product:
    raise HTTPException(status_code=404, detail="Product not found")

  db.delete(product)
  db.commit()

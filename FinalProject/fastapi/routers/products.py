from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from models import Product, get_db
from schemas import ProductCreate, ProductUpdate, ProductOut
from datetime import datetime

router = APIRouter(prefix="/products", tags=["Products"])


# POST /products/ — Creates a new product with automatic date assignment
# Accepts ProductCreate schema, adds current timestamp if date_added not provided
# Returns created product with generated ID and complete details
@router.post("/", response_model=ProductOut, status_code=status.HTTP_201_CREATED)
def create_product(product: ProductCreate, db: Session = Depends(get_db)):
  product_dict = product.dict()
  if not product_dict.get("date_added"):
    product_dict["date_added"] = datetime.now()

  new_product = Product(**product_dict)
  db.add(new_product)
  db.commit()
  db.refresh(new_product)
  return new_product


# GET /products/ — Retrieves all products from the database
# Returns complete list of products for browsing and administrative purposes
# Used to display product catalogs and inventory management
@router.get("/", response_model=list[ProductOut])
def get_products(db: Session = Depends(get_db)):
  return db.query(Product).all()


# GET /products/{product_id} — Retrieves specific product by ID
# Returns detailed product information for the specified product ID
# Raises 404 error if product doesn't exist in the database
@router.get("/{product_id}", response_model=ProductOut)
def get_product(product_id: int, db: Session = Depends(get_db)):
  product = db.query(Product).filter(Product.product_id == product_id).first()
  if not product:
    raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")
  return product


# PUT /products/{product_id} — Updates existing product with partial data
# Accepts ProductUpdate schema for selective field updates
# Returns updated product data or raises 404 if product doesn't exist
@router.put("/{product_id}", response_model=ProductOut)
def update_product(product_id: int, product_update: ProductUpdate, db: Session = Depends(get_db)):
  product = db.query(Product).filter(Product.product_id == product_id).first()
  if not product:
    raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")

  for key, value in product_update.dict(exclude_unset=True).items():
    setattr(product, key, value)

  db.commit()
  db.refresh(product)
  return product


# DELETE /products/{product_id} — Removes product from database permanently
# Deletes product record for the specified product ID
# Returns 204 status on success or 404 if product doesn't exist
@router.delete("/{product_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_product(product_id: int, db: Session = Depends(get_db)):
  product = db.query(Product).filter(Product.product_id == product_id).first()
  if not product:
    raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")

  db.delete(product)
  db.commit()

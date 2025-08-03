from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from models import Product, get_db
from schemas import ProductCreate, ProductUpdate
from models import get_db  # DB session dependency

router = APIRouter(prefix="/products", tags=["Products"])

# Create a product
@router.post("/", response_model=ProductCreate, status_code=status.HTTP_201_CREATED)
def create_product(product: ProductCreate, db: Session = Depends(get_db)):
    new_product = Product(**product.dict())
    db.add(new_product)
    db.commit()
    db.refresh(new_product)
    return new_product

# Read all products
@router.get("/", response_model=list[ProductCreate])
def get_products(db: Session = Depends(get_db)):
    return db.query(Product).all()

# Read single product
@router.get("/{product_id}", response_model=ProductCreate)
def get_product(product_id: int, db: Session = Depends(get_db)):
    product = db.query(Product).get(product_id)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return product

# Update product
@router.put("/{product_id}", response_model=ProductCreate)
def update_product(product_id: int, product_update: ProductUpdate, db: Session = Depends(get_db)):
    product = db.query(Product).get(product_id)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    for key, value in product_update.dict(exclude_unset=True).items():
        setattr(product, key, value)
    db.commit()
    db.refresh(product)
    return product

# Delete product
@router.delete("/{product_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_product(product_id: int, db: Session = Depends(get_db)):
    product = db.query(Product).get(product_id)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    db.delete(product)
    db.commit()

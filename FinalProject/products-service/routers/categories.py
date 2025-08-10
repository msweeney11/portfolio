from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from models import get_db, Category
from schemas import CategoryCreate, CategoryOut

router = APIRouter()


# POST /categories/ — Creates a new product category
# Validates category name uniqueness and creates Category record
# Returns created category or raises 400 error if name already exists
@router.post("/", response_model=CategoryOut, status_code=status.HTTP_201_CREATED)
async def create_category(category: CategoryCreate, db: Session = Depends(get_db)):
  # Check if category name already exists
  existing = db.query(Category).filter(Category.category_name == category.category_name).first()
  if existing:
    raise HTTPException(status_code=400, detail="Category name already exists")

  new_category = Category(**category.dict())
  db.add(new_category)
  db.commit()
  db.refresh(new_category)
  return new_category


# GET /categories/ — Retrieves all product categories from the database
# Returns complete list of categories for product organization and filtering
# Used by admin interface and product browsing functionality
@router.get("/", response_model=list[CategoryOut])
async def get_categories(db: Session = Depends(get_db)):
  return db.query(Category).all()


# GET /categories/{category_id} — Retrieves specific category by ID
# Returns category details for the specified category ID
# Raises 404 error if category doesn't exist
@router.get("/{category_id}", response_model=CategoryOut)
async def get_category(category_id: int, db: Session = Depends(get_db)):
  category = db.query(Category).filter(Category.category_id == category_id).first()
  if not category:
    raise HTTPException(status_code=404, detail="Category not found")
  return category

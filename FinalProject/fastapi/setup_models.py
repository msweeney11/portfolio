import time
from sqlalchemy.exc import OperationalError


def setup_database():
  from models.database import Base, engine
  from models.products import Product
  from models.categories import Category
  from models.orders import Order

  while True:
    try:
      # Create all tables
      Base.metadata.create_all(bind=engine)
      print("Database setup complete")
      break
    except OperationalError:
      print("Waiting for MySQL to be ready...")
      time.sleep(2)


def seed_categories():
  from models.database import SessionLocal
  from models.categories import Category

  db = SessionLocal()
  try:
    # Check if categories already exist
    if db.query(Category).count() == 0:
      # Add default category
      default_category = Category(category_name="General")
      db.add(default_category)
      db.commit()
      print("Default category added")
  except Exception as e:
    print(f"Error seeding categories: {e}")
    db.rollback()
  finally:
    db.close()

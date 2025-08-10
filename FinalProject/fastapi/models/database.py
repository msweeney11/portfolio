# models/database.py
from sqlalchemy.orm import sessionmaker, declarative_base
from sqlalchemy import create_engine

DATABASE_URL = "mysql+pymysql://root:rootpass@mysql-db:3306/accessory_shop"

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(bind=engine, autocommit=False, autoflush=False)
Base = declarative_base()

# Creates and manages database session lifecycle for dependency injection
# Yields database session for request processing, ensures proper cleanup on completion
# Used as FastAPI dependency to provide database access to route handlers
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

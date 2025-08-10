import os
from dotenv import load_dotenv
from sqlalchemy.orm import sessionmaker, declarative_base
from sqlalchemy import create_engine

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")
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

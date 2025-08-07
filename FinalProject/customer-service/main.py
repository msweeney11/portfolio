from fastapi import FastAPI
from routers import customers
from setup_models import setup_database
from models import Customer, get_db

setup_database()
app = FastAPI()

# Include customer routes
app.include_router(customers.router, prefix="/customers", tags=["Customers"])

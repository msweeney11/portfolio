from fastapi import FastAPI
from routers import customers
from setup_models import setup_database
from models.customers import Customer
from models.database import get_db

setup_database()
app = FastAPI()

# Include customer routes
app.include_router(customers.router, tags=["Customers"])

@app.get("/health")
def health_check():
    return {"service": "customer-service", "status": "healthy"}

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import products, orders
from setup_models import setup_database, seed_categories

# Setup database and seed data
setup_database()
seed_categories()

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:4000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(products.router)
app.include_router(orders.router)

@app.get("/")
def read_root():
    return {"message": "FastAPI service is working!"}

@app.get("/health")
def health_check():
    return {"service": "fastapi-main", "status": "healthy"}

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import products, categories
from setup_models import setup_database

setup_database()
app = FastAPI(title="Products Service", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:4000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(products.router, prefix="/products", tags=["Products"])
app.include_router(categories.router, prefix="/categories", tags=["Categories"])

# GET /health — Health check endpoint for service monitoring
# Returns service name and status to verify the products service is operational
@app.get("/health")
def health_check():
    return {"service": "products-service", "status": "healthy"}

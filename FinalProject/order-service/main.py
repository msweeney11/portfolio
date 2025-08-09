from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import orders
from setup_models import setup_database

setup_database()
app = FastAPI(title="Order Service", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:4000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(orders.router, prefix="/orders", tags=["Orders"])

@app.get("/health")
def health_check():
    return {"service": "order-service", "status": "healthy"}

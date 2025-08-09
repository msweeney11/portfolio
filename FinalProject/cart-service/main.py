from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import cart
from setup_models import setup_database

setup_database()
app = FastAPI(title="Cart Service", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:4000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(cart.router, prefix="/cart", tags=["Cart"])

@app.get("/health")
def health_check():
    return {"service": "cart-service", "status": "healthy"}

from fastapi import FastAPI
from routers import cart

app = FastAPI()
app.include_router(cart.router)

@app.get("/health")
def health_check():
    return {"service": "cart-service", "status": "healthy"}

from fastapi import FastAPI
from routers import cart

app = FastAPI()
app.include_router(cart.router)

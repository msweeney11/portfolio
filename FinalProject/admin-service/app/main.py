from fastapi import FastAPI
from .routers import products, uploads
from fastapi.staticfiles import StaticFiles

app = FastAPI()

app.include_router(products.router, prefix="/admin/products")
app.include_router(uploads.router, prefix="/admin/uploads")

#app.mount("/static", StaticFiles(directory="app/static"), name="static")

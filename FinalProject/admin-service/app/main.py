from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from pathlib import Path
from .routers import products, uploads

app = FastAPI(title="PhoneHub Admin Service", version="1.0.0")

# Create static directories if they don't exist
static_dir = Path("app/static")
uploads_dir = static_dir / "uploads"
uploads_dir.mkdir(parents=True, exist_ok=True)

# Mount static files
app.mount("/static", StaticFiles(directory="app/static"), name="static")

# Include routers
app.include_router(products.router, prefix="/admin/products", tags=["Admin Products"])
app.include_router(uploads.router, prefix="/admin/uploads", tags=["Admin Uploads"])

@app.get("/")
def read_root():
    return {"message": "PhoneHub Admin Service", "version": "1.0.0"}

@app.get("/health")
def health_check():
    return {"service": "admin-service", "status": "healthy"}

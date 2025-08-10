from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import products, orders


app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:4000", "http://bff:4000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(products.router)
app.include_router(orders.router)

# GET / — Root endpoint that returns basic service information
# Provides confirmation that the FastAPI service is operational
@app.get("/")
def read_root():
    return {"message": "FastAPI service is working!"}

# GET /health — Health check endpoint for service monitoring
# Returns service name and status to verify the FastAPI service is healthy
@app.get("/health")
def health_check():
    return {"service": "fastapi-main", "status": "healthy"}

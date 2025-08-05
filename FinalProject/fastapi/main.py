# app/main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import customers
from setup_models import setup_database

setup_database()
app = FastAPI()
app.include_router(customers.router)

# Add CORS middleware
app.add_middleware(  # type: ignore
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {"message": "FastAPI service is working!"}



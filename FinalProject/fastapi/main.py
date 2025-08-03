# app/main.py
from fastapi import FastAPI

app = FastAPI()
#app.include_router(store.router)

@app.get("/")
def read_root():
    return {"message": "FastAPI service is working!"}

from fastapi import FastAPI, Request, Query, Path

app = FastAPI()

@app.get("/")
def read_root():
    return {"message": "Hello from FastAPI"}

@app.get("/greet")
def greet(name: str = Query("friend")):
    return {"message": f"Hello, {name}!"}

@app.get("/square/{number}")
def square(number: int = Path(...)):
    return {"number": number, "square": number * number}

@app.put("/user/{user_id}")
async def update_user(user_id: int, request: Request):
    data = await request.json()
    return {"user_id": user_id, "updated": data}

@app.get("/search")
def search(keyword: str = Query(...), page: int = Query(1)):
    return {"search": keyword, "page": page}

@app.put("/item/{item_id}")
async def update_item(item_id: int, request: Request):
    data = await request.json()
    return {"item_id": item_id, "item": data}

@app.get("/status/{code}")
def get_status(code: int):
    return {"code": code, "info": "Success" if code == 200 else "Check status"}

@app.get("/convert")
def convert_temp(c: float = Query(...)):
    return {"celsius": c, "fahrenheit": c * 9 / 5 + 32}

@app.put("/profile/{username}")
async def update_profile(username: str, request: Request):
    data = await request.json()
    return {"username": username, "profile": data}

@app.get("/echo")
def echo(q: str = Query(...)):
    return {"echo": q}

@app.get("/multiply/{x}/{y}")
def multiply(x: int, y: int):
    return {"x": x, "y": y, "product": x * y}

@app.put("/reset-password/{user_id}")
async def reset_password(user_id: int, request: Request):
    body = await request.json()
    return {"user_id": user_id, "status": "Password updated", "data": body}

@app.get("/divide")
def divide(x: float, y: float):
    if y == 0:
        return {"error": "Division by zero"}
    return {"result": x / y}

@app.put("/settings")
async def update_settings(request: Request):
    settings = await request.json()
    return {"status": "Updated", "settings": settings}

@app.get("/ping")
def ping():
    return {"pong": True}

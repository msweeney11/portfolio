from fastapi import APIRouter, Depends, HTTPException, status, Form, Response, Cookie
from fastapi.responses import RedirectResponse
from pydantic import BaseModel
from models import get_db
from sqlalchemy.orm import Session
from passlib.context import CryptContext
from jose import jwt, JWTError
from datetime import datetime, timedelta
from helpers import set_session_cookie, fetch_customer_by_email, create_customer
from config import SECRET_KEY, ALGORITHM

router = APIRouter()
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

class LoginRequest(BaseModel):
    email: str
    password: str

@router.post("/login")
async def login_customer(login_data: LoginRequest, response: Response):  # Make async
    print("Login attempt:", login_data.email)
    customer = await fetch_customer_by_email(login_data.email)  # Add await

    if not customer or not pwd_context.verify(login_data.password, customer["password"]):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")

    token = create_access_token({"sub": customer["email_address"]})
    set_session_cookie(response, token)

    response.set_cookie(
        key="customer_id",
        value=str(customer["customer_id"]),
        httponly=True,
        secure=True,
        samesite="Strict",
        path="/"
    )

    return {"message": "Logged in"}

class RegisterRequest(BaseModel):
    email_address: str
    password: str
    first_name: str
    last_name: str

@router.post("/register")
async def register_customer(payload: RegisterRequest, response: Response):  # Make async
    existing_customer = await fetch_customer_by_email(payload.email_address)  # Add await
    if existing_customer:
        raise HTTPException(status_code=400, detail="Email already registered")

    hashed_password = pwd_context.hash(payload.password)

    customer_data = {
        "email_address": payload.email_address,
        "password": hashed_password,
        "first_name": payload.first_name,
        "last_name": payload.last_name
    }

    try:
        new_customer = await create_customer(customer_data)  # Add await
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

    response.set_cookie(
        key="customer_id",
        value=str(new_customer["customer_id"]),
        httponly=True,
        secure=True,
        samesite="Strict",
        path="/"
    )

    return {"message": "Customer registered"}

def create_access_token(data: dict, expires_delta: timedelta = timedelta(hours=1)):
    to_encode = data.copy()
    to_encode["exp"] = datetime.utcnow() + expires_delta
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

@router.get("/verify")
def verify_token(token: str = Cookie(None)):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return {"email": payload["sub"]}
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")

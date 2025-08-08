from fastapi import APIRouter, Depends, HTTPException, status, Form, Response, Cookie
from fastapi.responses import RedirectResponse
from pydantic import BaseModel
from passlib.context import CryptContext
from jose import jwt, JWTError
from datetime import datetime, timedelta
from helpers import set_session_cookie, fetch_customer_by_email
from config import SECRET_KEY, ALGORITHM

router = APIRouter()
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# JSON-based login request model
class LoginRequest(BaseModel):
    email: str
    password: str

# JSON-based login endpoint
@router.post("/login")
def login_customer(login_data: LoginRequest, response: Response):
    print("Login attempt:", login_data.email)
    customer = fetch_customer_by_email(login_data.email)

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

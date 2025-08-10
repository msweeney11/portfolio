from fastapi import APIRouter, Depends, HTTPException, status, Form, Response, Cookie, Request
from fastapi.responses import RedirectResponse, JSONResponse
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

# POST /auth/login — Authenticates customer credentials and creates session
# Validates email/password against customer service, generates JWT token
# Sets session and customer_id cookies, returns login confirmation with token data
@router.post("/login")
async def login_customer(login_data: LoginRequest):
    print("Login attempt:", login_data.email)
    customer = await fetch_customer_by_email(login_data.email)  # Add await

    if not customer or not pwd_context.verify(login_data.password, customer["password"]):
      raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")

    token = create_access_token({"sub": customer["email_address"]})

    response = JSONResponse(content={
      "message": "Logged in",
      "session_token": token,
      "customer_id": customer["customer_id"]
    })

    set_session_cookie(response, token)
    response.set_cookie(
      key="customer_id",
      value=str(customer["customer_id"]),
      httponly=True,
      secure=False,
      samesite="Lax",
      path="/",
      max_age=24 * 60 * 60
    )

    print("Session token created:", token)
    print("Setting customer_id cookie:", customer["customer_id"])
    return response


class RegisterRequest(BaseModel):
    email_address: str
    password: str
    first_name: str
    last_name: str

# POST /auth/register — Registers new customer account with validation
# Checks for existing email, hashes password, creates customer via customer service
# Sets customer_id cookie on successful registration
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
        secure=False,
        samesite=None,
        path="/"
    )

    return {"message": "Customer registered"}

# Creates JWT access token with expiration time
# Encodes customer data into secure token for session management
# Default expiration is 1 hour, can be customized with expires_delta parameter
def create_access_token(data: dict, expires_delta: timedelta = timedelta(hours=1)):
    to_encode = data.copy()
    to_encode["exp"] = datetime.utcnow() + expires_delta
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


# POST /auth/logout — Clears authentication cookies to log out user
# Removes session and customer_id cookies with multiple configurations
# Ensures complete logout by clearing cookies with different path/domain settings
@router.post("/logout")
def logout_customer(response: Response):
  print("Logout request received")

  # Clear the session cookie
  response.delete_cookie(
    key="session",
    path="/",
    httponly=True,
    secure=False,
    samesite="Lax"
  )

  # Clear the customer_id cookie
  response.delete_cookie(
    key="customer_id",
    path="/",
    httponly=True,
    secure=False,
    samesite="Lax"
  )

  # Also try clearing with different configurations in case they were set differently
  response.delete_cookie(key="session", path="/")
  response.delete_cookie(key="customer_id", path="/")
  response.delete_cookie(key="session")
  response.delete_cookie(key="customer_id")

  print("Authentication cookies cleared")

  return JSONResponse(
    content={"message": "Logged out successfully"},
    status_code=200
  )

# GET /auth/verify — Validates session token and returns user information
# Decodes JWT token from session cookie, validates authenticity
# Returns user email and customer_id if session is valid, raises 401 if invalid
@router.get("/verify")
def verify_session(
    session: str = Cookie(None),
    customer_id: str = Cookie(None)
):
    print("Incoming session cookie:", session)
    print("Incoming customer_id cookie:", customer_id)

    if not session or not customer_id:
        raise HTTPException(status_code=401, detail="Missing cookies")

    try:
        payload = jwt.decode(session, SECRET_KEY, algorithms=[ALGORITHM])
        print("Decoded JWT payload:", payload)
    except JWTError as e:
        print("JWT decode error:", str(e))
        raise HTTPException(status_code=401, detail="Invalid session token")

    return {"message": "Session valid",
            "email": payload.get("sub"),
            "customer_id": customer_id
    }

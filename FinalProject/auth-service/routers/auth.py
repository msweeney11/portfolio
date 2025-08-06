from fastapi import APIRouter, Depends, HTTPException, status, Form, Response, Cookie
from fastapi.responses import RedirectResponse
from pydantic import BaseModel
from models import Customer, get_db
from sqlalchemy.orm import Session
from passlib.context import CryptContext
from jose import jwt, JWTError
from datetime import datetime, timedelta
from helpers import set_session_cookie
from config import SECRET_KEY, ALGORITHM
router = APIRouter()
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


# JSON-based login request model
class LoginRequest(BaseModel):
    email: str
    password: str

# JSON-based login endpoint
@router.post("/login")
def login_customer(
    login_data: LoginRequest,
    response: Response,
    db: Session = Depends(get_db)
):
    print("Login attempt:", login_data.email)
    customer = db.query(Customer).filter(Customer.email_address == login_data.email).first()  # type: ignore

    if not customer or not pwd_context.verify(login_data.password, customer.password):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")

    # Create JWT token
    token = create_access_token({"sub": customer.email_address})

    # Set session cookie with JWT
    set_session_cookie(response, token)

    # Optional: still set customer_id if needed for legacy reasons
    response.set_cookie(
        key="customer_id",
        value=str(customer.customer_id),
        httponly=True,
        secure=True,
        samesite="Strict",
        path="/"
    )

    return {"message": "Logged in"}

# Register customer
@router.post("/register")
def register_customer(
    response: Response,
    email_address: str = Form(...),
    password: str = Form(...),
    first_name: str = Form(...),
    last_name: str = Form(...),
    db: Session = Depends(get_db)
):
    print("Received registration:", email_address, first_name, last_name)
    existing_customer = db.query(Customer).filter(Customer.email_address.__eq__(email_address)).first()
    if existing_customer:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email already registered")
    hashed_password = pwd_context.hash(password)
    new_customer = Customer(
        email_address=email_address,
        password=hashed_password,
        first_name=first_name,
        last_name=last_name
    )
    db.add(new_customer)
    db.commit()
    db.refresh(new_customer)
    response.set_cookie(
        key="customer_id",
        value=str(new_customer.customer_id),
        httponly=True,
        secure=True,
        samesite="strict",
        path="/"
    )
    return RedirectResponse(url="/index.html", status_code=302)

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


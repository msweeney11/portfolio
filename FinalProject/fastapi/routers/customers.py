from fastapi import APIRouter, Depends, HTTPException, status, Form, Response
from passlib.context import CryptContext
from fastapi.responses import RedirectResponse
from sqlalchemy.orm import Session
from sqlalchemy import select
from models import Customer, get_db
from schemas import CustomerCreate, CustomerUpdate, CustomerOut
from pydantic import BaseModel

router = APIRouter(prefix="/customers")
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Create a customer
@router.post("/", response_model=CustomerOut, status_code=status.HTTP_201_CREATED)
def create_customer(customer: CustomerCreate, db: Session = Depends(get_db)):
    new_customer = Customer(**customer.dict())
    db.add(new_customer)
    db.commit()
    db.refresh(new_customer)
    return new_customer

# Read all customers
@router.get("/", response_model=list[CustomerOut])
def get_customers(db: Session = Depends(get_db)):
    return db.query(Customer).all()

# Read single customer by ID
@router.get("/{customer_id}", response_model=CustomerOut)
def get_customer(customer_id: int, db: Session = Depends(get_db)):
    customer = db.query(Customer).get(customer_id)
    if not customer:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Customer not found")
    return customer

# Update customer
@router.put("/{customer_id}", response_model=CustomerOut)
def update_customer(customer_id: int, customer_update: CustomerUpdate, db: Session = Depends(get_db)):
    customer = db.query(Customer).get(customer_id)
    if not customer:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Customer not found")
    for key, value in customer_update.dict(exclude_unset=True).items():
        setattr(customer, key, value)
    db.commit()
    db.refresh(customer)
    return customer

# Delete customer
@router.delete("/{customer_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_customer(customer_id: int, db: Session = Depends(get_db)):
    customer = db.query(Customer).get(customer_id)
    if not customer:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Customer not found")
    db.delete(customer)
    db.commit()

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
    return RedirectResponse(url="/dashboard", status_code=302)

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
    customer = db.query(Customer).filter(Customer.email_address == login_data.email).first() # type: ignore
    if not customer or not pwd_context.verify(login_data.password, customer.password):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")
    response.set_cookie(
        key="customer_id",
        value=str(customer.customer_id),
        httponly=True,
        secure=True,
        samesite="strict",
        path="/"
    )
    return {"message": "Logged in"}

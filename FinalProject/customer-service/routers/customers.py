from fastapi import APIRouter, Depends, HTTPException, status, Form, Response, Request
from passlib.context import CryptContext
from fastapi.responses import RedirectResponse
from sqlalchemy.orm import Session
from sqlalchemy import select
from schemas import CustomerCreate, CustomerUpdate, CustomerOut, CustomerAuth
from models.database import get_db
from models.customers import Customer
from pydantic import BaseModel, EmailStr

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

@router.get("/by-email", response_model=CustomerAuth)
def get_customer_by_email(email_address: EmailStr, db: Session = Depends(get_db)):
    customer = db.query(Customer).filter(Customer.email_address == email_address).first()
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    return customer

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



from pydantic import BaseModel

class RegisterSchema(BaseModel):
    email_address: str
    password: str

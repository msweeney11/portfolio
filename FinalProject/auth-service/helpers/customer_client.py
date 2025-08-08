import httpx

def fetch_customer_by_email(email: str):
    try:
        response = httpx.get(
            "http://customer-service:8003/customers/by-email",
            params={"email_address": email}
        )
        response.raise_for_status()
        return response.json()
    except httpx.HTTPStatusError as e:
        if e.response.status_code == 404:
            return None
        raise

def create_customer(payload: dict):
    try:
        response = httpx.post(
            "http://customer-service:8003/customers/create-user",
            json=payload
        )
        response.raise_for_status()
        return response.json()
    except httpx.HTTPStatusError as e:
        if e.response.status_code == 400:
            raise ValueError("Customer already exists")
        raise


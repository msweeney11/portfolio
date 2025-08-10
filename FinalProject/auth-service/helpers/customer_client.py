import httpx

# Retrieves customer data from customer-service by email address
# Returns customer object if found, None if not found (404), or raises exception for other errors
# Handles HTTP status errors gracefully, specifically treating 404 as a valid "not found" case
async def fetch_customer_by_email(email: str):
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(
                "http://customer-service:8003/customers/by-email",
                params={"email_address": email}
            )
            if response.status_code == 404:
                return None
            response.raise_for_status()
            return response.json()
    except httpx.HTTPStatusError as e:
        if e.response.status_code == 404:
            return None
        raise

# Creates a new customer record in the customer-service
# Accepts customer data payload and forwards it to customer creation endpoint
# Handles duplicate customer scenarios by raising ValueError for 400 status codes
async def create_customer(payload: dict):
    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                "http://customer-service:8003/customers/create-user",
                json=payload
            )
            response.raise_for_status()
            return response.json()
    except httpx.HTTPStatusError as e:
        if e.response.status_code == 400:
            raise ValueError("Customer already exists")
        raise

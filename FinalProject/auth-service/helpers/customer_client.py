import httpx

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

import httpx

def fetch_customer_by_email(email: str):
    try:
        print(f"Fetching customer by email_address: {email}")
        response = httpx.get(
            "http://customer-service:8003/customers/by-email",
            params={"email_address": email}
        )
        response.raise_for_status()
        return response.json()
    except httpx.HTTPStatusError as e:
        print(f"Customer-service responded with {e.response.status_code} for email_address={email}")
        if e.response.status_code == 404:
            return None
        raise

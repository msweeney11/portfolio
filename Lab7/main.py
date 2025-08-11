from fastapi import FastAPI, Header, Cookie, Response, Request
from typing import Optional

app = FastAPI()

@app.get("/greet")
def greet_user(user_agent: Optional[str] = Header(None), visit: Optional[str] = Cookie(None)):
    return {
        "message": "Welcome!",
        "User-Agent": user_agent,
        "Visit-Cookie": visit
    }

@app.post("/set-cookie")
def set_cookie(response: Response):
    response.set_cookie(key="visit", value="first_time", max_age=3600)
    return {"message": "Cookie set successfully"}

@app.get("/check-auth")
def check_auth(auth_token: Optional[str] = Header(None), session_id: Optional[str] = Cookie(None)):
    return {
        "auth_token": auth_token,
        "session_id": session_id,
        "status": "Authenticated" if auth_token and session_id else "Missing credentials"
    }

@app.get("/track")
def track_user(request: Request):
    headers = dict(request.headers)
    cookies = request.cookies
    return {
        "headers_received": headers,
        "cookies_received": cookies
    }

@app.put("/update-preferences")
def update_preferences(preference: Optional[str] = Header(None), theme: Optional[str] = Cookie(None)):
    return {
        "Preference-Header": preference,
        "Theme-Cookie": theme
    }

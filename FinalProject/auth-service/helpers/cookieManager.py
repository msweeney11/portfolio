# Sets a secure session cookie with JWT token for user authentication
# Configures cookie with HTTP-only flag, lax SameSite policy, and 24-hour expiration
# Used to maintain user sessions across requests in a secure manner
def set_session_cookie(response, token):
  response.set_cookie(
    key="session",
    value=token,
    httponly=True,
    secure=False,
    samesite="Lax",
    path="/",
    max_age=24 * 60 * 60
  )

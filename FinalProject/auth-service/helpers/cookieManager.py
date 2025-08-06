def set_session_cookie(response, token):
  response.set_cookie(
    key="session",
    value=token,
    httponly=True,
    secure=True,
    samesite="Lax",
    max_age=24 * 60 * 60
  )

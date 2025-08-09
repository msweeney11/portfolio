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

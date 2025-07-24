export function setSessionCookie(res, token) {
  res.cookie("session", token, {
    httpOnly: true,
    secure: true,
    sameSite: "Lax",
    maxAge: 24 * 60 * 60 * 1000
  });
}

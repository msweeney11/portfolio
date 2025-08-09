const BASE_URL = "http://fastapi:8000";
const AUTH_URL = process.env.AUTH_URL || "http://auth-service:8000";
const CUSTOMER_URL = process.env.CUSTOMER_URL || "http://customer-service:8003";

export async function loginUser(email, password) {
  try {
    const res = await fetch(`${AUTH_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password })
    });

    if (!res.ok) {
      throw new Error(`Login failed: ${res.status}`);
    }

    return await res.json();
  } catch (error) {
    console.error("Login service error:", error);
    throw error;
  }
}

export async function registerUser(userData) {
  try {
    const res = await fetch(`${AUTH_URL}/auth/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(userData)
    });

    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.detail || 'Registration failed');
    }

    return await res.json();
  } catch (error) {
    console.error("Registration service error:", error);
    throw error;
  }
}

const BASE_URL = "http://fastapi:8000";
const AUTH_URL = process.env.AUTH_URL || "http://auth-service:8000";
const CUSTOMER_URL = process.env.CUSTOMER_URL || "http://customer-service:8003";

// Note: These functions are now mostly unused since we're doing direct fetch in auth.js
// But keeping them for other potential uses
export async function loginUser(email, password) {
  const res = await fetch("http://auth-service:8000/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ email, password })
  });
  return await res.json();
}

export async function registerUser(userData) {
  const res = await fetch("http://auth-service:8000/auth/register", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    credentials: "include", // Add this
    body: JSON.stringify(userData)
  });

  if (res.redirected) {
    return { success: true, redirectUrl: res.url };
  }

  return await res.json();
}

// This function is now less important since we handle verification directly in BFF
export async function verifyLogin(cookie) {
  try {
    const res = await fetch(`${AUTH_URL}/auth/verify`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        ...(cookie ? { Cookie: cookie } : {})
      },
      credentials: "include" // Add this
    });

    if (!res.ok) {
      return { loggedIn: false, status: res.status };
    }

    const data = await res.json();
    return { loggedIn: true, user: data };
  } catch (error) {
    console.error("Verify login error:", error);
    return { loggedIn: false, error };
  }
}

export async function fetchProducts(filters = {}) {
  try {
    const query = new URLSearchParams(filters).toString();
    const res = await fetch(`${BASE_URL}/products${query ? '?' + query : ''}`, {
      credentials: "include" // Add this to all requests that might need auth
    });

    if (!res.ok) {
      throw new Error(`Failed to fetch products: ${res.status}`);
    }

    return await res.json();
  } catch (error) {
    console.error("Fetch products error:", error);
    throw error;
  }
}

export async function fetchSingleProduct(productId) {
  try {
    const res = await fetch(`${BASE_URL}/products/${productId}`, {
      credentials: "include"
    });

    if (!res.ok) {
      throw new Error(`Failed to fetch product: ${res.status}`);
    }

    return await res.json();
  } catch (error) {
    console.error("Fetch single product error:", error);
    throw error;
  }
}

export async function fetchOrderHistory(userId) {
  try {
    const res = await fetch(`${BASE_URL}/orders?customer_id=${userId}`, {
      credentials: "include"
    });

    if (!res.ok) {
      throw new Error(`Failed to fetch orders: ${res.status}`);
    }

    return await res.json();
  } catch (error) {
    console.error("Fetch order history error:", error);
    throw error;
  }
}

export async function createProduct(productData) {
  try {
    const res = await fetch(`${BASE_URL}/products/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(productData)
    });

    if (!res.ok) {
      throw new Error(`Failed to create product: ${res.status}`);
    }

    return await res.json();
  } catch (error) {
    console.error("Create product error:", error);
    throw error;
  }
}

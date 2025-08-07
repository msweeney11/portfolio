const BASE_URL = "http://fastapi:8000";
const AUTH_URL = process.env.AUTH_URL || "http://auth-service:8000";
const CUSTOMER_URL = process.env.CUSTOMER_URL || "http://customer-service:8003";

export async function loginUser(email, password) {
  console.log("Calling auth-service login with:", email);
  try {
    const res = await fetch(`${AUTH_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password })
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error("Auth-service responded with error:", res.status, errText);
      return { error: errText, status: res.status };
    }

    const data = await res.json();
    console.log("Auth-service response JSON:", data);
    return data;
  } catch (err) {
    console.error("Error contacting auth-service:", err);
    return { error: "Auth-service unreachable", detail: err.message };
  }
}

export async function registerUser(customerData) {
  console.log("Calling customer-service register with:", customerData);
  try {
    const res = await fetch(`${CUSTOMER_URL}/customers/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(customerData)
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error("Customer-service responded with error:", res.status, errText);
      return { error: errText, status: res.status };
    }

    const data = await res.json();
    console.log("Customer-service response JSON:", data);
    return data;
  } catch (err) {
    console.error("Error contacting customer-service:", err);
    return { error: "Customer-service unreachable", detail: err.message };
  }
}

export async function fetchProducts(filters) {
  const query = new URLSearchParams(filters).toString();
  const res = await fetch(`${BASE_URL}/products?${query}`);
  return await res.json();
}

export async function fetchOrderHistory(userId) {
  const res = await fetch(`${BASE_URL}/orders/${userId}`);
  return await res.json();
}

export async function createProduct(productData) {
  const res = await fetch(`${BASE_URL}/admin/create`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(productData)
  });
  return await res.json();
}

export async function uploadImage(file) {
  const formData = new FormData();
  formData.append("image", file.buffer, file.originalname);

  const res = await fetch(`${BASE_URL}/admin/upload`, {
    method: "POST",
    body: formData
  });
  return await res.json();
}

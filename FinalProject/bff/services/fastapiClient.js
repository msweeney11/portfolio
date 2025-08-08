const BASE_URL = "http://fastapi:8000";
const AUTH_URL = process.env.AUTH_URL || "http://auth-service:8000";
const CUSTOMER_URL = process.env.CUSTOMER_URL || "http://customer-service:8003";

export async function loginUser(email, password) {
  const res = await fetch("http://auth-service:8000/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password })
  });
  return await res.json();
}

export async function registerUser(email_address, password, first_name, last_name) {
  const formData = new URLSearchParams();
  formData.append("email_address", email_address);
  formData.append("password", password);
  formData.append("first_name", first_name);
  formData.append("last_name", last_name);

  const res = await fetch("http://auth-service:8000/auth/register", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body: formData
  });

  // Since the endpoint redirects, you might want to handle that
  if (res.redirected) {
    return { success: true, redirectUrl: res.url };
  }

  return await res.json();
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

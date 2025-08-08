const BASE_URL = "http://fastapi:8000";
const AUTH_URL = process.env.AUTH_URL || "http://auth-service:8000";

export async function loginUser(email, password) {
  const res = await fetch("http://auth-service:8000/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password })
  });
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

const BASE_URL = "http://localhost:4000/api";

// ------------------ AUTH ------------------ //
export async function login(email, password) {
  const res = await fetch(`${BASE_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ email, password }),
  });
  return await res.json();
}

// ---------------- PRODUCTS ---------------- //
export async function getProducts(filters = {}) {
  const query = new URLSearchParams(filters).toString();
  const res = await fetch(`${BASE_URL}/products?${query}`);
  return await res.json();
}

// ------------------ ORDERS ---------------- //
export async function getOrders() {
  const res = await fetch(`${BASE_URL}/orders`, {
    method: "GET",
    credentials: "include"
  });
  return await res.json();
}

// ------------------ ADMIN ----------------- //
export async function createProduct(productData) {
  const res = await fetch(`${BASE_URL}/admin/create`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(productData),
  });
  return await res.json();
}

export async function uploadImage(file) {
  const formData = new FormData();
  formData.append("image", file);

  const res = await fetch(`${BASE_URL}/admin/upload`, {
    method: "POST",
    credentials: "include",
    body: formData
  });
  return await res.json();
}

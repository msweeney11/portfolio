const BASE_URL = "http://localhost:8000/products";

// Create a product
export async function createProduct(data) {
  const res = await fetch(`${BASE_URL}/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data)
  });
  return await res.json();
}

// Get all products
export async function fetchProducts() {
  const res = await fetch(`${BASE_URL}/`);
  return await res.json();
}

// Get single product
export async function fetchProductById(productId) {
  const res = await fetch(`${BASE_URL}/${productId}`);
  return await res.json();
}

// Update product
export async function updateProduct(productId, updateData) {
  const res = await fetch(`${BASE_URL}/${productId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(updateData)
  });
  return await res.json();
}

// Delete product
export async function deleteProduct(productId) {
  const res = await fetch(`${BASE_URL}/${productId}`, {
    method: "DELETE"
  });
  return res.status === 204;
}

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


export async function fetchProducts(filters = {}) {
  try {
    const query = new URLSearchParams(filters).toString();
    const res = await fetch(`${BASE_URL}/products${query ? '?' + query : ''}`);

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
    const res = await fetch(`${BASE_URL}/products/${productId}`);

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
    const res = await fetch(`${BASE_URL}/orders?customer_id=${userId}`);

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
      body: JSON.stringify(productData)
    });

    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(errorData.detail || "Failed to create product");
    }

    return await res.json();
  } catch (error) {
    console.error("Create product error:", error);
    throw error;
  }
}

export async function uploadImage(file) {
  try {
    const formData = new FormData();
    formData.append("file", file);

    const res = await fetch("http://admin-service:8000/admin/uploads/", {
      method: "POST",
      body: formData
    });

    if (!res.ok) {
      throw new Error(`Failed to upload image: ${res.status}`);
    }

    return await res.json();
  } catch (error) {
    console.error("Upload image error:", error);
    throw error;
  }
}

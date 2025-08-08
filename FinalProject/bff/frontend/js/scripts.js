console.log("scripts.js loaded");

// Utility: Get query parameters
function getQueryParam(param) {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get(param);
}

// Utility: Check if user is logged in
function isLoggedIn() {
  return document.cookie.includes('session=');
}

// Utility: Redirect if not logged in
function requireLogin() {
  if (!isLoggedIn()) {
    window.location.href = 'login.html';
  }
}

async function loadProducts() {
  try {
    const res = await fetch('/api/products');
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }
    const products = await res.json();
    const container = document.getElementById('product-grid');

    if (!container) {
      console.warn('Product grid container not found');
      return;
    }

    container.innerHTML = ''; // Clear existing content

    if (products && products.length > 0) {
      products.forEach(p => {
        const card = document.createElement('div');
        card.className = 'col mb-5';
        card.innerHTML = `
          <div class="card h-100">
            <img class="card-img-top" src="https://dummyimage.com/450x300/dee2e6/6c757d.jpg" alt="${p.product_name}" />
            <div class="card-body p-4">
              <div class="text-center">
                <h5 class="fw-bolder">${p.product_name}</h5>
                <p class="text-muted">${p.description || 'No description'}</p>
                $${p.list_price}
              </div>
            </div>
            <div class="card-footer p-4 pt-0 border-top-0 bg-transparent">
              <div class="text-center">
                <a class="btn btn-outline-dark mt-auto" href="product-detail.html?id=${p.product_id}">View options</a>
              </div>
            </div>
          </div>
        `;
        container.appendChild(card);
      });
    } else {
      container.innerHTML = '<div class="col-12"><p class="text-center">No products available</p></div>';
    }
  } catch (error) {
    console.error('Failed to load products:', error);
    const container = document.getElementById('product-grid');
    if (container) {
      container.innerHTML = '<div class="col-12"><p class="text-center text-danger">Failed to load products</p></div>';
    }
  }
}

// Load single product
async function loadProductDetail() {
  try {
    const id = getQueryParam('id');
    if (!id) {
      throw new Error('No product ID provided');
    }

    const res = await fetch(`/api/products/${id}`);
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }

    const product = await res.json();

    document.getElementById('product-name').textContent = product.product_name || 'Product Name';
    document.getElementById('product-price').textContent = `$${product.list_price || '0.00'}`;
    document.getElementById('product-description').textContent = product.description || 'No description available';
    document.getElementById('product-image').src = 'https://dummyimage.com/600x700/dee2e6/6c757d.jpg';
    document.getElementById('product-image').alt = product.product_name || 'Product';
  } catch (error) {
    console.error('Failed to load product detail:', error);
    document.getElementById('product-name').textContent = 'Product not found';
    document.getElementById('product-price').textContent = '$0.00';
    document.getElementById('product-description').textContent = 'Unable to load product details.';
  }
}

// Handle login
async function login(email, password) {
  console.log("Attaching login handler");
  try {
    console.log("attachment successful")
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password })
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error("Login failed:", res.status, errText);
      console.log("Login failed:", res.status, errText)
      return { error: errText, status: res.status };
    }

    const data = await res.json();
    return data;

  } catch (err) {
    console.error("Network error during login:", err);
    console.log("Network error during login:", err)
    return { error: "Network error", detail: err };
  }
}

async function handleLogin(e) {
  e.preventDefault();
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  const result = await login(email, password);
  console.log("Login response:", result);

  if (result.message === "Logged in") {
    alert("Login successful!");
    window.location.replace("/index.html");
  } else {
    alert("Login failed: " + (result.error || "Invalid credentials"));
  }
}

// Handle registration
// Handle registration
async function handleRegister(e) {
  e.preventDefault();
  const name = document.getElementById("name").value;
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  try {
    const res = await fetch("http://localhost:8002/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password })
    });

    if (res.ok) {
      const result = await res.json();
      alert("Account created successfully!");
      window.location.href = "/login.html";
    } else {
      const errData = await res.json();
      alert("Registration failed: " + (errData.error || "Unknown error"));
    }
  } catch (err) {
    console.error("Network error during registration:", err);
    alert("Registration failed: Network error");
  }
}


// Load cart
async function loadCart() {
  requireLogin();
  const res = await fetch('/api/cart');
  const cart = await res.json();
  const container = document.getElementById('cart-items');
  cart.forEach(item => {
    const row = document.createElement('div');
    row.className = 'cart-row';
    row.innerHTML = `
      <span>${item.product.name}</span>
      <input type="number" value="${item.quantity}" data-id="${item.id}">
      <button onclick="removeFromCart(${item.id})">Remove</button>
    `;
    container.appendChild(row);
  });
}

// Remove item from cart
async function removeFromCart(id) {
  await fetch(`/api/cart/${id}`, { method: 'DELETE' });
  location.reload();
}

// Load wishlist
async function loadWishlist() {
  requireLogin();
  const res = await fetch('/api/wishlist');
  const wishlist = await res.json();
  const container = document.getElementById('wishlist-items');
  wishlist.forEach(item => {
    const card = document.createElement('div');
    card.className = 'wishlist-card';
    card.innerHTML = `
      <img src="${item.product.image}" alt="${item.product.name}">
      <h3>${item.product.name}</h3>
      <button onclick="removeFromWishlist(${item.id})">Remove</button>
    `;
    container.appendChild(card);
  });
}

// Remove item from wishlist
async function removeFromWishlist(id) {
  await fetch(`/api/wishlist/${id}`, { method: 'DELETE' });
  location.reload();
}

// Submit order
async function handleCheckout(e) {
  e.preventDefault();
  requireLogin();
  const address = document.getElementById('address').value;
  const payment = document.getElementById('payment').value;
  const res = await fetch('/api/orders', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ address, payment })
  });
  if (res.ok) {
    window.location.href = 'orders.html';
  } else {
    alert('Checkout failed');
  }
}

// Load past orders
async function loadOrders() {
  requireLogin();
  const res = await fetch('/api/orders');
  const orders = await res.json();
  const container = document.getElementById('order-list');
  orders.forEach(order => {
    const div = document.createElement('div');
    div.className = 'order-card';
    div.innerHTML = `
      <h4>Order #${order.id}</h4>
      <p>Status: ${order.status}</p>
      <p>Date: ${new Date(order.created_at).toLocaleDateString()}</p>
    `;
    container.appendChild(div);
  });
}

// Load and update profile
async function loadProfile() {
  requireLogin();
  const res = await fetch('/api/customers/me');
  const user = await res.json();
  document.getElementById('name').value = user.name;
  document.getElementById('email').value = user.email;
}

async function updateProfile(e) {
  e.preventDefault();
  const name = document.getElementById('name').value;
  const email = document.getElementById('email').value;
  await fetch('/api/customers/me', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, email })
  });
  alert('Profile updated');
}

// Page router
document.addEventListener('DOMContentLoaded', () => {
  const page = window.location.pathname;

  // Normalize route name
  const route = page === '/' ? 'login' : page.split('/').pop().replace('.html', '');

  console.log("Detected route:", route);

  switch (route) {
    case 'index':
      loadProducts();
      break;

    case 'product-detail':
      loadProductDetail();
      break;

    case 'login':
      const loginForm = document.getElementById('login-form');
      if (loginForm) {
        console.log("Attaching login handler");
        loginForm.addEventListener('submit', handleLogin);
      }
      break;

    case 'register':
      const registerForm = document.getElementById('register-form');
      if (registerForm) {
        registerForm.addEventListener('submit', handleRegister);
      }
      break;

    case 'cart':
      loadCart();
      break;

    case 'wishlist':
      loadWishlist();
      break;

    case 'checkout':
      const checkoutForm = document.getElementById('checkout-form');
      if (checkoutForm) {
        checkoutForm.addEventListener('submit', handleCheckout);
      }
      break;

    case 'orders':
      loadOrders();
      break;

    case 'profile':
      loadProfile();
      const profileForm = document.getElementById('profile-form');
      if (profileForm) {
        profileForm.addEventListener('submit', updateProfile);
      }
      break;

    default:
      console.warn("No route matched for:", route);
  }
});


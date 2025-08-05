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

// 🏠 index.html — Load all products
async function loadProducts() {
  const res = await fetch('/api/products');
  const products = await res.json();
  const container = document.getElementById('product-grid');
  products.forEach(p => {
    const card = document.createElement('div');
    card.className = 'product-card';
    card.innerHTML = `
      <img src="${p.image}" alt="${p.name}">
      <h3>${p.name}</h3>
      <p>$${p.price}</p>
      <a href="product-detail.html?id=${p.id}">View</a>
    `;
    container.appendChild(card);
  });
}

// 📄 product-detail.html — Load single product
async function loadProductDetail() {
  const id = getQueryParam('id');
  const res = await fetch(`/api/products/${id}`);
  const product = await res.json();
  document.getElementById('product-name').textContent = product.name;
  document.getElementById('product-price').textContent = `$${product.price}`;
  document.getElementById('product-description').textContent = product.description;
  document.getElementById('product-image').src = product.image;
}

// 🔐 login.html — Handle login
async function handleLogin(e) {
  e.preventDefault();
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;
  const res = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  if (res.ok) {
    window.location.href = 'index.html';
  } else {
    alert('Login failed');
  }
}

// 🧾 register.html — Handle registration
async function handleRegister(e) {
  e.preventDefault();
  const name = document.getElementById('name').value;
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;
  const res = await fetch('/api/customers', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, email, password })
  });
  if (res.ok) {
    window.location.href = 'login.html';
  } else {
    alert('Registration failed');
  }
}

// 🛒 cart.html — Load and manage cart
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

// 🛒 Remove item from cart
async function removeFromCart(id) {
  await fetch(`/api/cart/${id}`, { method: 'DELETE' });
  location.reload();
}

// ❤️ wishlist.html — Load wishlist
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

// ❤️ Remove item from wishlist
async function removeFromWishlist(id) {
  await fetch(`/api/wishlist/${id}`, { method: 'DELETE' });
  location.reload();
}

// 💳 checkout.html — Submit order
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

// 📦 orders.html — Load past orders
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

// 👤 profile.html — Load and update profile
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

// 🧠 Page router
document.addEventListener('DOMContentLoaded', () => {
  const page = window.location.pathname;

  if (page.endsWith('index.html')) loadProducts();
  else if (page.endsWith('product-detail.html')) loadProductDetail();
  else if (page.endsWith('login.html')) document.getElementById('login-form').addEventListener('submit', handleLogin);
  else if (page.endsWith('register.html')) document.getElementById('register-form').addEventListener('submit', handleRegister);
  else if (page.endsWith('cart.html')) loadCart();
  else if (page.endsWith('wishlist.html')) loadWishlist();
  else if (page.endsWith('checkout.html')) document.getElementById('checkout-form').addEventListener('submit', handleCheckout);
  else if (page.endsWith('orders.html')) loadOrders();
  else if (page.endsWith('profile.html')) {
    loadProfile();
    document.getElementById('profile-form').addEventListener('submit', updateProfile);
  }
});

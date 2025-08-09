console.log("scripts.js loaded");

// Global state (from friend's version)
let currentUser = null;
let allProducts = [];
let currentProduct = null;
let cart = JSON.parse(localStorage.getItem('phonehub_cart')) || [];
let wishlist = JSON.parse(localStorage.getItem('phonehub_wishlist')) || [];

// Utility: Get query parameters (your version)
function getQueryParam(param) {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get(param);
}

// Utility: Check if user is logged in (your version - prioritized)
async function isLoggedIn() {
  try {
    console.log("Checking login status...");
    const res = await fetch("/api/auth/verify", {
      credentials: "include"
    });

    console.log("Login check response:", res.status);
    res.text().then(body => console.log("Login check body:", body));

    return res.ok;
  } catch (err) {
    console.error("Error checking login status:", err);
    return false;
  }
}

// Utility: Redirect if not logged in (your version - prioritized)
async function requireLogin() {
  // Skip login check if we just logged in
  if (window.justLoggedIn) {
    console.log("Skipping login check: just logged in");
    // Optional: clear the flag after a short delay
    setTimeout(() => {
      window.justLoggedIn = false;
    }, 2000);
    return;
  }

  const loggedIn = await isLoggedIn();
  if (!loggedIn) {
    window.location.href = "login.html";
  }
}

// Enhanced initialization (merged approach)
async function initializePage() {
    // Check if user is logged in using your method first
    const loggedIn = await isLoggedIn();
    
    if (loggedIn) {
        try {
            // Try to get full customer details (from friend's version)
            const customerId = getCurrentCustomerId();
            if (customerId) {
                try {
                    const customerResponse = await fetch(`/api/customers/${customerId}`, {
                        credentials: 'include'
                    });
                    if (customerResponse.ok) {
                        currentUser = await customerResponse.json();
                        console.log('Customer data loaded:', currentUser);
                    } else {
                        // Get user info from auth verify
                        const authResponse = await fetch('/api/auth/verify', {
                            credentials: 'include'
                        });
                        if (authResponse.ok) {
                            const authData = await authResponse.json();
                            currentUser = {
                                email: authData.email || 'user@example.com',
                                first_name: authData.email ? authData.email.split('@')[0] : 'User'
                            };
                        }
                    }
                } catch (error) {
                    console.log('Customer service not available, using fallback');
                }
            }
        } catch (error) {
            console.log('Authentication check failed:', error);
            currentUser = null;
        }
    } else {
        currentUser = null;
    }

    updateNavigation();
    updateCartBadge();
    updateWishlistBadge();
}

// Navigation update (from friend's version)
function updateNavigation() {
    const navUserSection = document.getElementById('navbar-user-section');
    if (navUserSection) {
        if (currentUser) {
            const displayName = currentUser.first_name ||
                               (currentUser.email ? currentUser.email.split('@')[0] : 'User');

            navUserSection.innerHTML = `
                <a href="cart.html" class="btn btn-outline-primary position-relative me-2">
                    <i class="bi bi-cart me-1"></i>Cart
                    <span class="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger" id="cart-badge">
                        ${cart.length}
                    </span>
                </a>
                <div class="dropdown">
                    <button class="btn btn-success dropdown-toggle" type="button" data-bs-toggle="dropdown">
                        <i class="bi bi-person-circle me-1"></i>Welcome, ${displayName}!
                    </button>
                    <ul class="dropdown-menu dropdown-menu-end">
                        <li><a class="dropdown-item" href="profile.html">
                            <i class="bi bi-person-circle me-2"></i>My Profile
                        </a></li>
                        <li><a class="dropdown-item" href="orders.html">
                            <i class="bi bi-box-seam me-2"></i>My Orders
                        </a></li>
                        <li><a class="dropdown-item" href="wishlist.html">
                            <i class="bi bi-heart me-2"></i>Wishlist <span class="badge bg-secondary wishlist-badge">${wishlist.length}</span>
                        </a></li>
                        <li><a class="dropdown-item" href="admin-dashboard.html">
                            <i class="bi bi-gear me-2"></i>Admin Panel
                        </a></li>
                        <li><hr class="dropdown-divider"></li>
                        <li><a class="dropdown-item text-danger" href="#" onclick="logout()">
                            <i class="bi bi-box-arrow-right me-2"></i>Logout
                        </a></li>
                    </ul>
                </div>
            `;
        } else {
            navUserSection.innerHTML = `
                <a href="login.html" class="btn btn-outline-primary me-2">
                    <i class="bi bi-box-arrow-in-right me-1"></i>Login
                </a>
                <a href="register.html" class="btn btn-primary">
                    <i class="bi bi-person-plus me-1"></i>Register
                </a>
            `;
        }
    }
}

// Product loading (enhanced from friend's version)
async function loadProducts() {
  try {
    showLoadingSpinner();
    const res = await fetch('/api/products');
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }
    allProducts = await res.json();
    const container = document.getElementById('product-grid');

    if (!container) {
      console.warn('Product grid container not found');
      return;
    }

    container.innerHTML = ''; // Clear existing content

    if (allProducts && allProducts.length > 0) {
      allProducts.forEach(p => {
        const discountedPrice = p.discount_percent > 0
            ? (p.list_price * (1 - p.discount_percent / 100)).toFixed(2)
            : p.list_price;

        const card = document.createElement('div');
        card.className = 'col mb-5';
        card.innerHTML = `
          <div class="card h-100 shadow-sm product-card">
            <div class="position-relative">
              <img class="card-img-top" src="https://dummyimage.com/450x300/dee2e6/6c757d.jpg" alt="${p.product_name}" />
              ${p.discount_percent > 0 ?
                `<span class="position-absolute top-0 end-0 badge bg-danger m-2">
                    -${p.discount_percent}%
                </span>` : ''
              }
              <div class="position-absolute bottom-0 end-0 m-2">
                <button class="btn btn-sm btn-light rounded-circle" onclick="quickAddToWishlist(${p.product_id}, '${p.product_name.replace(/'/g, '\\\'')}')" title="Add to Wishlist">
                  <i class="bi bi-heart"></i>
                </button>
              </div>
            </div>
            <div class="card-body p-4">
              <div class="text-center">
                <h5 class="fw-bolder">${p.product_name}</h5>
                <p class="text-muted">${p.description || 'No description'}</p>
                <div class="mb-3">
                  ${p.discount_percent > 0 ?
                    `<div>
                        <span class="text-muted text-decoration-line-through small">$${p.list_price}</span>
                        <div class="fs-5 fw-bold text-primary">$${discountedPrice}</div>
                    </div>` :
                    `<div class="fs-5 fw-bold text-primary">$${p.list_price}</div>`
                  }
                </div>
              </div>
            </div>
            <div class="card-footer p-4 pt-0 border-top-0 bg-transparent">
              <div class="text-center">
                <div class="btn-group w-100" role="group">
                  <button class="btn btn-outline-primary btn-sm" onclick="quickAddToCart(${p.product_id}, '${p.product_name.replace(/'/g, '\\\'')}', ${discountedPrice})">
                    <i class="bi bi-cart-plus"></i>
                  </button>
                  <a class="btn btn-primary btn-sm" href="product-detail.html?id=${p.product_id}">
                    <i class="bi bi-eye me-1"></i>View Details
                  </a>
                </div>
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
    displayProductsError();
  }
}

function showLoadingSpinner() {
    const productGrid = document.getElementById('product-grid');
    if (productGrid) {
        productGrid.innerHTML = `
            <div class="col-12 text-center">
                <div class="spinner-border text-primary" role="status">
                    <span class="visually-hidden">Loading products...</span>
                </div>
                <p class="mt-2">Loading products...</p>
            </div>
        `;
    }
}

function displayProductsError() {
    const container = document.getElementById('product-grid');
    if (container) {
        container.innerHTML = '<div class="col-12"><p class="text-center text-danger">Failed to load products</p></div>';
    }
}

// Load single product (your version)
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
    currentProduct = product;

    document.querySelector('button.btn-outline-dark').addEventListener('click', () => {
      addToCart(product.product_id);
    });

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

// Handle login (your version - prioritized)
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
    showNotification("Login successful!", 'success');
    window.justLoggedIn = true;
    window.location.replace("/index.html");
  } else {
    showNotification("Login failed: " + (result.error || "Invalid credentials"), 'error');
  }
}

// Handle registration (your version)
async function handleRegister(e) {
  e.preventDefault();

  const firstName = document.getElementById("first-name").value;
  const lastName = document.getElementById("last-name").value;
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  try {
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        first_name: firstName,
        last_name: lastName,
        email_address: email,
        password: password
      })
    });

    if (res.ok) {
      const result = await res.json();
      showNotification("Account created successfully!", 'success');
      window.location.href = "/login.html";
    } else {
      const errData = await res.json();
      showNotification("Registration failed: " + (errData.error || "Unknown error"), 'error');
    }
  } catch (err) {
    console.error("Network error during registration:", err);
    showNotification("Registration failed: Network error", 'error');
  }
}

// Cart functions (enhanced from friend's version)
async function loadCart() {
  await requireLogin();
  const res = await fetch('/api/cart-items');
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

async function updateCartBadge() {
  const badgeEls = document.querySelectorAll('.bi-cart-fill + .badge, #cart-badge');
  
  // Use local cart if not logged in
  if (!(await isLoggedIn())) {
    const totalQty = cart.reduce((sum, item) => sum + item.quantity, 0);
    badgeEls.forEach(badge => {
      badge.textContent = totalQty;
      badge.style.display = totalQty > 0 ? 'inline' : 'none';
    });
    return;
  }

  try {
    const res = await fetch('/api/cart-items');
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const serverCart = await res.json();
    const totalQty = serverCart.reduce((sum, item) => sum + item.quantity, 0);
    badgeEls.forEach(badge => {
      badge.textContent = totalQty;
      badge.style.display = totalQty > 0 ? 'inline' : 'none';
    });
  } catch (err) {
    console.error('Failed to update cart badge:', err);
    // Fallback to local cart
    const totalQty = cart.reduce((sum, item) => sum + item.quantity, 0);
    badgeEls.forEach(badge => {
      badge.textContent = totalQty;
      badge.style.display = totalQty > 0 ? 'inline' : 'none';
    });
  }
}

// Quick add to cart (from friend's version)
function quickAddToCart(productId, productName, price) {
    if (!currentUser) {
        showNotification('Please log in to add items to cart', 'warning');
        return;
    }

    const existingItem = cart.find(item => item.productId === productId);

    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        cart.push({
            productId: productId,
            name: productName,
            price: parseFloat(price),
            quantity: 1,
            addedAt: new Date().toISOString()
        });
    }

    saveCart();
    updateCartBadge();
    showNotification(`${productName} added to cart!`, 'success');
}

function saveCart() {
    localStorage.setItem('phonehub_cart', JSON.stringify(cart));
}

// Wishlist functions (from friend's version)
function quickAddToWishlist(productId, productName) {
    if (!currentUser) {
        showNotification('Please log in to save items to your wishlist', 'warning');
        return;
    }

    const existingItem = wishlist.find(item => item.productId === productId);

    if (existingItem) {
        showNotification('Item already in wishlist', 'info');
        return;
    }

    wishlist.push({
        productId: productId,
        name: productName,
        addedAt: new Date().toISOString()
    });

    saveWishlist();
    updateWishlistBadge();
    showNotification(`${productName} added to wishlist!`, 'success');
}

function saveWishlist() {
    localStorage.setItem('phonehub_wishlist', JSON.stringify(wishlist));
}

function updateWishlistBadge() {
    const wishlistBadges = document.querySelectorAll('.wishlist-badge');
    wishlistBadges.forEach(badge => {
        badge.textContent = wishlist.length;
        badge.style.display = wishlist.length > 0 ? 'inline' : 'none';
    });
}

// Remove item from cart (your version)
async function removeFromCart(id) {
  await fetch(`/api/cart-items/${id}`, { method: 'DELETE' });
  updateCartBadge();
  location.reload();
}

// Other functions from your version
async function loadWishlist() {
  await requireLogin();
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

async function removeFromWishlist(id) {
  await fetch(`/api/wishlist/${id}`, { method: 'DELETE' });
  location.reload();
}

async function handleCheckout(e) {
  e.preventDefault();
  await requireLogin();
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
    showNotification('Checkout failed', 'error');
  }
}

async function loadOrders() {
  await requireLogin();
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

async function loadProfile() {
  await requireLogin();
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
  showNotification('Profile updated', 'success');
}

async function addToCart(productId) {
  if (!(await isLoggedIn())) {
    window.location.href = 'login.html';
    return;
  }

  try {
    const res = await fetch('/api/cart-items', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ product_id: productId, quantity: 1 })
    });

    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    updateCartBadge();
    showNotification('Item added to cart!', 'success');
  } catch (err) {
    console.error('Failed to add to cart:', err);
    showNotification('Failed to add item to cart', 'error');
  }
}

// Logout function (enhanced from friend's version)
async function logout() {
    try {
        currentUser = null;

        // Clear local storage
        cart = [];
        wishlist = [];
        localStorage.removeItem('phonehub_cart');
        localStorage.removeItem('phonehub_wishlist');

        // Clear cookies by setting them to expire
        document.cookie = 'session=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
        document.cookie = 'customer_id=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';

        updateNavigation();
        updateCartBadge();
        updateWishlistBadge();

        showNotification('Logged out successfully', 'success');

        setTimeout(() => {
            window.location.href = 'index.html';
        }, 1000);
    } catch (error) {
        console.error('Logout error:', error);
        window.location.href = 'index.html';
    }
}

// Utility functions (from friend's version)
function getCurrentCustomerId() {
    const cookies = document.cookie.split(';');
    for (let cookie of cookies) {
        const [name, value] = cookie.trim().split('=');
        if (name === 'customer_id') {
            return parseInt(value);
        }
    }
    return null;
}

function showNotification(message, type = 'info') {
    // Remove existing notifications
    const existingNotifications = document.querySelectorAll('.phonehub-notification');
    existingNotifications.forEach(notification => notification.remove());

    // Create notification element
    const notification = document.createElement('div');
    notification.className = `alert alert-${type === 'error' ? 'danger' : type === 'success' ? 'success' : type === 'warning' ? 'warning' : 'info'} alert-dismissible fade show position-fixed phonehub-notification`;
    notification.style.cssText = 'top: 20px; right: 20px; z-index: 9999; min-width: 300px; max-width: 400px;';
    notification.innerHTML = `
        <div class="d-flex align-items-center">
            <i class="bi bi-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-triangle' : type === 'warning' ? 'exclamation-triangle' : 'info-circle'} me-2"></i>
            <div class="flex-grow-1">${message}</div>
            <button type="button" class="btn-close ms-2" data-bs-dismiss="alert" aria-label="Close"></button>
        </div>
    `;

    document.body.appendChild(notification);

    // Auto remove after 5 seconds
    setTimeout(() => {
        if (notification.parentNode) {
            notification.parentNode.removeChild(notification);
        }
    }, 5000);
}

// YOUR PAGE ROUTER SYSTEM (PRIORITIZED)
document.addEventListener('DOMContentLoaded', async () => {
  const page = window.location.pathname;
  const route = page === '/' ? 'login' : page.split('/').pop().replace('.html', '');

  console.log("Detected route:", route);
  
  // Initialize page first
  await initializePage();

  const publicRoutes = ['login', 'register'];

  // Your authentication flow takes priority
  if (!publicRoutes.includes(route)) {
    await requireLogin();
  }

  // Your route handling system (prioritized)
  switch (route) {
    case 'index':
      loadProducts();
      break;

    case 'product-detail':
      loadProductDetail();
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

    default:
      console.warn("No route matched for:", route);
  }
});

// Export functions for global access (from friend's version)
window.PhoneHubApp = {
    login,
    logout,
    loadProducts,
    showNotification,
    getCurrentCustomerId,
    quickAddToCart,
    quickAddToWishlist,
    addToCart
};
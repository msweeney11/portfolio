console.log("scripts.js loaded");

// Global state
let currentUser = null;
let allProducts = [];
let currentProduct = null;
let cart = JSON.parse(localStorage.getItem('phonehub_cart')) || [];
let wishlist = JSON.parse(localStorage.getItem('phonehub_wishlist')) || [];

// Utility: Get query parameters
function getQueryParam(param) {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get(param);
}

// Utility: Check if user is logged in
async function isLoggedIn() {
  try {
    // Check if user manually logged out (frontend flag)
    if (localStorage.getItem('user_logged_out') === 'true') {
      console.log("User manually logged out - not checking backend");
      currentUser = null;
      return false;
    }

    console.log("Checking login status...");
    const res = await fetch("/api/auth/verify", {
      credentials: "include"
    });

    console.log("Login check response:", res.status);

    if (res.ok) {
      const userData = await res.json();
      // Store user data if verification successful
      if (userData && userData.email) {
        currentUser = {
          email: userData.email,
          first_name: userData.first_name || userData.email.split('@')[0],
          last_name: userData.last_name || '',
          customer_id: userData.customer_id || null
        };
      }
      return true;
    }

    // If not logged in, clear current user
    currentUser = null;
    return false;
  } catch (err) {
    console.error("Error checking login status:", err);
    currentUser = null;
    return false;
  }
}

// Utility: Redirect if not logged in
async function requireLogin() {
  // Skip login check if we just logged in
  if (window.justLoggedIn) {
    console.log("Skipping login check: just logged in");
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

// Enhanced initialization
async function initializePage() {
    console.log("Initializing page...");

    // Check if user is logged in
    const loggedIn = await isLoggedIn();
    console.log("Login status:", loggedIn, "Current user:", currentUser);

    // Update UI based on login status
    updateNavigation();
    updateCartBadge();
    updateWishlistBadge();
}

// Navigation update - THIS IS THE KEY FUNCTION
function updateNavigation() {
    const navUserSection = document.getElementById('navbar-user-section');
    if (!navUserSection) {
        console.warn('navbar-user-section not found');
        return;
    }

    console.log("Updating navigation, currentUser:", currentUser);

    if (currentUser) {
        const displayName = currentUser.first_name ||
                           (currentUser.email ? currentUser.email.split('@')[0] : 'User');

        navUserSection.innerHTML = `
            <a href="cart.html" class="btn btn-outline-primary position-relative me-2">
                <i class="bi bi-cart me-1"></i>Cart
                <span class="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger" id="cart-badge" style="display: none;">
                    0
                </span>
            </a>
            <div class="dropdown">
                <button class="btn btn-success dropdown-toggle" type="button" data-bs-toggle="dropdown" aria-expanded="false">
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
                        <i class="bi bi-heart me-2"></i>Wishlist <span class="badge bg-secondary wishlist-badge" style="display: none;">0</span>
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
        // Show login and register buttons when not logged in
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

// Product loading
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

    container.innerHTML = '';

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
    currentProduct = product;

    const addToCartBtn = document.querySelector('button.btn-outline-dark');
    if (addToCartBtn) {
      addToCartBtn.addEventListener('click', () => {
        addToCart(product.product_id);
      });
    }

    const elements = {
      name: document.getElementById('product-name'),
      price: document.getElementById('product-price'),
      description: document.getElementById('product-description'),
      image: document.getElementById('product-image')
    };

    if (elements.name) elements.name.textContent = product.product_name || 'Product Name';
    if (elements.price) elements.price.textContent = `$${product.list_price || '0.00'}`;
    if (elements.description) elements.description.textContent = product.description || 'No description available';
    if (elements.image) {
      elements.image.src = 'https://dummyimage.com/600x700/dee2e6/6c757d.jpg';
      elements.image.alt = product.product_name || 'Product';
    }
  } catch (error) {
    console.error('Failed to load product detail:', error);
    const elements = {
      name: document.getElementById('product-name'),
      price: document.getElementById('product-price'),
      description: document.getElementById('product-description')
    };

    if (elements.name) elements.name.textContent = 'Product not found';
    if (elements.price) elements.price.textContent = '$0.00';
    if (elements.description) elements.description.textContent = 'Unable to load product details.';
  }
}

// Handle login - ENHANCED VERSION
async function login(email, password) {
  try {
    console.log("Attempting login for:", email);
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include", // Important for cookies
      body: JSON.stringify({ email, password })
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error("Login failed:", res.status, errText);
      return { error: errText, status: res.status };
    }

    const data = await res.json();
    console.log("Login successful:", data);

    // Set the user data immediately after successful login
    currentUser = {
      email: email,
      first_name: data.first_name || email.split('@')[0],
      last_name: data.last_name || '',
      customer_id: data.customer_id || null
    };

    return data;

  } catch (err) {
    console.error("Network error during login:", err);
    return { error: "Network error", detail: err };
  }
}

async function handleLogin(e) {
  e.preventDefault();
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  // Clear logout flag when attempting to log in
  localStorage.removeItem('user_logged_out');

  const result = await login(email, password);
  console.log("Login response:", result);

  if (result.message === "Logged in" || result.success) {
    showNotification("Login successful!", 'success');
    window.justLoggedIn = true;

    // Update navigation immediately
    updateNavigation();

    // Redirect after a short delay to show the success message
    setTimeout(() => {
      window.location.replace("/index.html");
    }, 1000);
  } else {
    showNotification("Login failed: " + (result.error || "Invalid credentials"), 'error');
  }
}

// Handle registration
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
      setTimeout(() => {
        window.location.href = "/login.html";
      }, 1500);
    } else {
      const errData = await res.json();
      showNotification("Registration failed: " + (errData.error || "Unknown error"), 'error');
    }
  } catch (err) {
    console.error("Network error during registration:", err);
    showNotification("Registration failed: Network error", 'error');
  }
}

// Cart functions
async function loadCart() {
  await requireLogin();
  const res = await fetch('/api/cart-items');
  const cart = await res.json();
  const container = document.getElementById('cart-items');
  if (container) {
    container.innerHTML = '';
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
}

async function updateCartBadge() {
  const badgeEls = document.querySelectorAll('#cart-badge');

  // Use local cart if not logged in
  if (!currentUser) {
    const totalQty = cart.reduce((sum, item) => sum + item.quantity, 0);
    badgeEls.forEach(badge => {
      badge.textContent = totalQty;
      badge.style.display = totalQty > 0 ? 'inline' : 'none';
    });
    return;
  }

  try {
    const res = await fetch('/api/cart-items', { credentials: 'include' });
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

// Quick add to cart
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

// Wishlist functions
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

// Remove item from cart
async function removeFromCart(id) {
  try {
    await fetch(`/api/cart-items/${id}`, { method: 'DELETE', credentials: 'include' });
    updateCartBadge();
    location.reload();
  } catch (err) {
    console.error('Failed to remove from cart:', err);
  }
}

// Other functions
async function loadWishlist() {
  await requireLogin();
  try {
    const res = await fetch('/api/wishlist', { credentials: 'include' });
    const wishlist = await res.json();
    const container = document.getElementById('wishlist-items');
    if (container) {
      container.innerHTML = '';
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
  } catch (err) {
    console.error('Failed to load wishlist:', err);
  }
}

async function removeFromWishlist(id) {
  try {
    await fetch(`/api/wishlist/${id}`, { method: 'DELETE', credentials: 'include' });
    location.reload();
  } catch (err) {
    console.error('Failed to remove from wishlist:', err);
  }
}

async function handleCheckout(e) {
  e.preventDefault();
  await requireLogin();
  const address = document.getElementById('address').value;
  const payment = document.getElementById('payment').value;
  try {
    const res = await fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ address, payment })
    });
    if (res.ok) {
      window.location.href = 'orders.html';
    } else {
      showNotification('Checkout failed', 'error');
    }
  } catch (err) {
    console.error('Checkout failed:', err);
    showNotification('Checkout failed', 'error');
  }
}

async function loadOrders() {
  await requireLogin();
  try {
    const res = await fetch('/api/orders', { credentials: 'include' });
    const orders = await res.json();
    const container = document.getElementById('order-list');
    if (container) {
      container.innerHTML = '';
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
  } catch (err) {
    console.error('Failed to load orders:', err);
  }
}

async function loadProfile() {
  await requireLogin();
  try {
    const res = await fetch('/api/customers/me', { credentials: 'include' });
    const user = await res.json();
    const nameEl = document.getElementById('name');
    const emailEl = document.getElementById('email');
    if (nameEl) nameEl.value = user.name || '';
    if (emailEl) emailEl.value = user.email || '';
  } catch (err) {
    console.error('Failed to load profile:', err);
  }
}

async function updateProfile(e) {
  e.preventDefault();
  const name = document.getElementById('name').value;
  const email = document.getElementById('email').value;
  try {
    await fetch('/api/customers/me', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ name, email })
    });
    showNotification('Profile updated', 'success');
  } catch (err) {
    console.error('Failed to update profile:', err);
    showNotification('Failed to update profile', 'error');
  }
}

async function addToCart(productId) {
  if (!currentUser) {
    window.location.href = 'login.html';
    return;
  }

  try {
    const res = await fetch('/api/cart-items', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
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

// ENHANCED LOGOUT FUNCTION
async function logout() {
    try {
        console.log("Logging out...");
        console.log("Current cookies before logout:", document.cookie);

        // Call backend logout endpoint if it exists
        try {
            const logoutResponse = await fetch('/api/auth/logout', {
                method: 'POST',
                credentials: 'include'
            });
            console.log('Backend logout response:', logoutResponse.status);
        } catch (err) {
            console.log('Backend logout endpoint not available or failed:', err);
        }

        // Clear local state
        currentUser = null;
        cart = [];
        wishlist = [];

        // Clear local storage and set logout flag
        localStorage.removeItem('phonehub_cart');
        localStorage.removeItem('phonehub_wishlist');
        localStorage.setItem('user_logged_out', 'true'); // Add logout flag
        localStorage.clear(); // Clear everything just to be safe

        // More aggressive cookie clearing
        const cookiesToClear = ['session', 'customer_id', 'auth_token', 'token', 'Pycharm-6cefadf3'];
        const currentDomain = window.location.hostname;
        const possibleDomains = [currentDomain, `.${currentDomain}`, 'localhost', '.localhost'];
        const possiblePaths = ['/', '/api', '/auth'];

        // Clear cookies for all possible domain/path combinations
        cookiesToClear.forEach(cookieName => {
            possibleDomains.forEach(domain => {
                possiblePaths.forEach(path => {
                    // Clear with domain and path
                    document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=${path}; domain=${domain}; SameSite=None; Secure`;
                    document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=${path}; domain=${domain}`;
                    document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=${path}`;
                });
            });

            // Also try without domain/path specification
            document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC;`;
            document.cookie = `${cookieName}=deleted; expires=Thu, 01 Jan 1970 00:00:00 UTC;`;
        });

        // Additional method: Set cookies to empty values with current timestamp
        cookiesToClear.forEach(cookieName => {
            document.cookie = `${cookieName}=; Max-Age=0; path=/;`;
            document.cookie = `${cookieName}=; Max-Age=-1; path=/;`;
        });

        console.log("Cookies after clearing attempt:", document.cookie);

        // Update UI immediately
        updateNavigation();
        updateCartBadge();
        updateWishlistBadge();

        showNotification('Logged out successfully', 'success');

        // Force a hard refresh to clear any cached authentication state
        setTimeout(() => {
            // Use replace to prevent back button issues
            window.location.replace(window.location.protocol + '//' + window.location.host + '/index.html');
            // Alternative: force full page reload
            // window.location.reload(true);
        }, 1000);
    } catch (error) {
        console.error('Logout error:', error);
        // Force redirect even if logout fails
        setTimeout(() => {
            window.location.replace(window.location.protocol + '//' + window.location.host + '/index.html');
        }, 500);
    }
}

// Utility functions
function getCurrentCustomerId() {
    if (currentUser && currentUser.customer_id) {
        return currentUser.customer_id;
    }

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

// Enhanced page initialization with better error handling
document.addEventListener('DOMContentLoaded', async () => {
  try {
    const page = window.location.pathname;
    const route = page === '/' ? 'index' : page.split('/').pop().replace('.html', '') || 'index';

    console.log("Detected route:", route);

    // Initialize page first - this checks login status and updates navigation
    await initializePage();

    const publicRoutes = ['login', 'register', 'index'];

    // Check authentication for protected routes
    if (!publicRoutes.includes(route)) {
      await requireLogin();
    }

    // Route handling
    switch (route) {
      case 'index':
        if (typeof loadProducts === 'function') {
          loadProducts();
        }
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
  } catch (error) {
    console.error('Error during page initialization:', error);
    showNotification('Page initialization failed', 'error');
  }
});

// Search and filter functions (if needed)
function searchProducts() {
    const searchInput = document.getElementById('search-input');
    if (!searchInput) return;

    const query = searchInput.value.toLowerCase().trim();
    if (!query) {
        loadProducts(); // Show all products if search is empty
        return;
    }

    const filteredProducts = allProducts.filter(product =>
        product.product_name.toLowerCase().includes(query) ||
        (product.description && product.description.toLowerCase().includes(query))
    );

    displayFilteredProducts(filteredProducts);
}

function filterByCategory(categoryId) {
    if (!categoryId) {
        loadProducts(); // Show all products
        return;
    }

    const filteredProducts = allProducts.filter(product =>
        product.category_id == categoryId
    );

    displayFilteredProducts(filteredProducts);
}

function displayFilteredProducts(products) {
    const container = document.getElementById('product-grid');
    if (!container) return;

    container.innerHTML = '';

    if (products && products.length > 0) {
        products.forEach(p => {
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
                            <span class="text-muted text-decoration-line-through small">${p.list_price}</span>
                            <div class="fs-5 fw-bold text-primary">${discountedPrice}</div>
                        </div>` :
                        `<div class="fs-5 fw-bold text-primary">${p.list_price}</div>`
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
        container.innerHTML = '<div class="col-12"><p class="text-center">No products found matching your criteria</p></div>';
    }
}

// Price filter functionality
function initializePriceFilter() {
    const priceFilter = document.getElementById('price-filter');
    const priceDisplay = document.getElementById('price-display');

    if (priceFilter && priceDisplay) {
        priceFilter.addEventListener('input', function() {
            const maxPrice = parseInt(this.value);
            priceDisplay.textContent = `$0 - ${maxPrice}`;

            const filteredProducts = allProducts.filter(product =>
                parseFloat(product.list_price) <= maxPrice
            );

            displayFilteredProducts(filteredProducts);
        });
    }
}

// Sort functionality
function initializeSortFilter() {
    const sortSelect = document.getElementById('sort-select');

    if (sortSelect) {
        sortSelect.addEventListener('change', function() {
            const sortBy = this.value;
            let sortedProducts = [...allProducts];

            switch (sortBy) {
                case 'name':
                    sortedProducts.sort((a, b) => a.product_name.localeCompare(b.product_name));
                    break;
                case 'price-low':
                    sortedProducts.sort((a, b) => parseFloat(a.list_price) - parseFloat(b.list_price));
                    break;
                case 'price-high':
                    sortedProducts.sort((a, b) => parseFloat(b.list_price) - parseFloat(a.list_price));
                    break;
                case 'newest':
                    sortedProducts.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
                    break;
                default:
                    break;
            }

            displayFilteredProducts(sortedProducts);
        });
    }
}

// Initialize filters and search when products are loaded
function initializeFiltersAndSearch() {
    // Search functionality
    const searchInput = document.getElementById('search-input');
    if (searchInput) {
        // Add enter key support
        searchInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                searchProducts();
            }
        });
    }

    // Category filter functionality
    const categoryFilters = document.querySelectorAll('.filter-category');
    categoryFilters.forEach(filter => {
        filter.addEventListener('click', function(e) {
            e.preventDefault();
            const categoryId = this.getAttribute('data-category');
            filterByCategory(categoryId);
        });
    });

    // Initialize other filters
    initializePriceFilter();
    initializeSortFilter();
}

// Quantity change for product detail modal
function changeQuantity(change) {
    const quantityInput = document.getElementById('quantity');
    if (quantityInput) {
        let currentQuantity = parseInt(quantityInput.value) || 1;
        let newQuantity = currentQuantity + change;

        // Ensure quantity stays within bounds
        if (newQuantity < 1) newQuantity = 1;
        if (newQuantity > 10) newQuantity = 10;

        quantityInput.value = newQuantity;
    }
}

// Modal functions for product detail
function showProductModal(productId) {
    const product = allProducts.find(p => p.product_id === productId);
    if (!product) return;

    currentProduct = product;

    // Update modal content
    const modal = document.getElementById('productModal');
    const modalLabel = document.getElementById('productModalLabel');
    const modalImage = document.getElementById('modal-product-image');
    const modalName = document.getElementById('modal-product-name');
    const modalCategory = document.getElementById('modal-product-category');
    const modalCode = document.getElementById('modal-product-code');
    const modalRating = document.getElementById('modal-product-rating');
    const modalDescription = document.getElementById('modal-product-description');
    const modalPrices = document.getElementById('modal-product-prices');

    if (modalLabel) modalLabel.textContent = product.product_name;
    if (modalImage) {
        modalImage.src = 'https://dummyimage.com/450x300/dee2e6/6c757d.jpg';
        modalImage.alt = product.product_name;
    }
    if (modalName) modalName.textContent = product.product_name;
    if (modalCategory) modalCategory.textContent = product.category_name || 'Accessories';
    if (modalCode) modalCode.textContent = `SKU: ${product.product_code || product.product_id}`;
    if (modalDescription) modalDescription.textContent = product.description || 'No description available';

    // Update rating (placeholder for now)
    if (modalRating) {
        modalRating.innerHTML = '★★★★☆ (4.0)';
    }

    // Update prices
    if (modalPrices) {
        const discountedPrice = product.discount_percent > 0
            ? (product.list_price * (1 - product.discount_percent / 100)).toFixed(2)
            : null;

        modalPrices.innerHTML = discountedPrice ?
            `<div>
                <span class="text-muted text-decoration-line-through">${product.list_price}</span>
                <span class="fs-4 fw-bold text-danger ms-2">${discountedPrice}</span>
                <span class="badge bg-danger ms-2">Save ${product.discount_percent}%</span>
            </div>` :
            `<div class="fs-4 fw-bold text-primary">${product.list_price}</div>`;
    }

    // Reset quantity
    const quantityInput = document.getElementById('quantity');
    if (quantityInput) quantityInput.value = 1;

    // Show modal
    if (modal && typeof bootstrap !== 'undefined') {
        const bsModal = new bootstrap.Modal(modal);
        bsModal.show();
    }
}

// Add to cart from modal
function addToCartFromModal() {
    if (!currentProduct) return;

    const quantityInput = document.getElementById('quantity');
    const quantity = quantityInput ? parseInt(quantityInput.value) || 1 : 1;

    for (let i = 0; i < quantity; i++) {
        const discountedPrice = currentProduct.discount_percent > 0
            ? (currentProduct.list_price * (1 - currentProduct.discount_percent / 100)).toFixed(2)
            : currentProduct.list_price;

        quickAddToCart(currentProduct.product_id, currentProduct.product_name, discountedPrice);
    }

    // Close modal
    const modal = document.getElementById('productModal');
    if (modal && typeof bootstrap !== 'undefined') {
        const bsModal = bootstrap.Modal.getInstance(modal);
        if (bsModal) bsModal.hide();
    }
}

// Add to wishlist from modal
function addToWishlistFromModal() {
    if (!currentProduct) return;

    quickAddToWishlist(currentProduct.product_id, currentProduct.product_name);

    // Close modal
    const modal = document.getElementById('productModal');
    if (modal && typeof bootstrap !== 'undefined') {
        const bsModal = bootstrap.Modal.getInstance(modal);
        if (bsModal) bsModal.hide();
    }
}


// Export functions for global access
window.PhoneHubApp = {
    login,
    logout,
    loadProducts,
    showNotification,
    getCurrentCustomerId,
    quickAddToCart,
    quickAddToWishlist,
    addToCart,
    searchProducts,
    filterByCategory,
    changeQuantity,
    showProductModal,
    addToCartFromModal: addToCartFromModal,
    addToWishlistFromModal: addToWishlistFromModal
};

// Make functions globally available
window.login = login;
window.logout = logout;
window.loadProducts = loadProducts;
window.searchProducts = searchProducts;
window.filterByCategory = filterByCategory;
window.quickAddToCart = quickAddToCart;
window.quickAddToWishlist = quickAddToWishlist;
window.addToCart = addToCart;
window.changeQuantity = changeQuantity;
window.showProductModal = showProductModal;
window.addToCartFromModal = addToCartFromModal;
window.addToWishlistFromModal = addToWishlistFromModal;

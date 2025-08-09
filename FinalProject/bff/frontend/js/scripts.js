const API_BASE = '/api';

// Global state
let currentUser = null;
let allProducts = [];
let currentProduct = null;
let cart = JSON.parse(localStorage.getItem('phonehub_cart')) || [];
let wishlist = JSON.parse(localStorage.getItem('phonehub_wishlist')) || [];

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
    initializePage();
    loadProducts();
    initializeEventListeners();
    updateCartBadge();
    updateWishlistBadge();
});

async function initializePage() {
    // Check if user is logged in
    try {
        // First try to verify session with auth service
        const authResponse = await fetch('/api/auth/verify', {
            credentials: 'include'
        });

        if (authResponse.ok) {
            const authData = await authResponse.json();
            console.log('Auth verified:', authData);

            // Try to get full customer details
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
                        // Use auth data as fallback
                        currentUser = {
                            email: authData.email || 'user@example.com',
                            first_name: authData.email ? authData.email.split('@')[0] : 'User'
                        };
                    }
                } catch (error) {
                    console.log('Customer service not available, using auth data');
                    currentUser = {
                        email: authData.email || 'user@example.com',
                        first_name: authData.email ? authData.email.split('@')[0] : 'User'
                    };
                }
            } else {
                // No customer ID, but auth verified - use auth data
                currentUser = {
                    email: authData.email || 'user@example.com',
                    first_name: authData.email ? authData.email.split('@')[0] : 'User'
                };
            }
        } else {
            console.log('User not logged in');
            currentUser = null;
        }
    } catch (error) {
        console.log('Authentication check failed:', error);
        currentUser = null;
    }

    updateNavigation();
}

function updateNavigation() {
    const navUserSection = document.getElementById('navbar-user-section');
    if (navUserSection) {
        if (currentUser) {
            // User is logged in - show profile and logout
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

            console.log('Navigation updated for logged in user:', displayName);
        } else {
            // User not logged in - show login and register
            navUserSection.innerHTML = `
                <a href="login.html" class="btn btn-outline-primary me-2">
                    <i class="bi bi-box-arrow-in-right me-1"></i>Login
                </a>
                <a href="register.html" class="btn btn-primary">
                    <i class="bi bi-person-plus me-1"></i>Register
                </a>
            `;

            console.log('Navigation updated for guest user');
        }
    }
}

function initializeEventListeners() {
    // Search functionality
    const searchInput = document.getElementById('search-input');
    if (searchInput) {
        searchInput.addEventListener('input', debounce(function() {
            searchProducts();
        }, 500));
    }

    // Category filter links
    const categoryLinks = document.querySelectorAll('.filter-category');
    categoryLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const categoryId = this.getAttribute('data-category');
            filterByCategory(categoryId);
        });
    });

    // Price filter
    const priceFilter = document.getElementById('price-filter');
    if (priceFilter) {
        priceFilter.addEventListener('input', function() {
            updatePriceDisplay();
            filterProducts();
        });
    }

    // Sort dropdown
    const sortSelect = document.getElementById('sort-select');
    if (sortSelect) {
        sortSelect.addEventListener('change', function() {
            sortProducts();
        });
    }
}

// Product functions
async function loadProducts(filters = {}) {
    try {
        showLoadingSpinner();
        const queryParams = new URLSearchParams(filters).toString();
        const response = await fetch(`${API_BASE}/products${queryParams ? '?' + queryParams : ''}`);

        if (response.ok) {
            allProducts = await response.json();
            displayProducts(allProducts);
        } else {
            console.error('Failed to load products');
            displayProductsError();
        }
    } catch (error) {
        console.error('Error loading products:', error);
        displayProductsError();
    }
}

function displayProducts(products) {
    const productGrid = document.getElementById('product-grid');
    if (!productGrid) return;

    if (products.length === 0) {
        productGrid.innerHTML = `
            <div class="col-12 text-center">
                <div class="card h-100 border-0">
                    <div class="card-body p-5">
                        <i class="bi bi-phone display-1 text-muted mb-3"></i>
                        <h5>No Products Found</h5>
                        <p class="text-muted">Try adjusting your search or filters</p>
                        <button class="btn btn-primary" onclick="clearFilters()">Clear Filters</button>
                    </div>
                </div>
            </div>
        `;
        return;
    }

    productGrid.innerHTML = products.map(product => {
        const discountedPrice = product.discount_percent > 0
            ? (product.list_price * (1 - product.discount_percent / 100)).toFixed(2)
            : product.list_price;

        return `
            <div class="col mb-5">
                <div class="card h-100 shadow-sm product-card" onclick="viewProduct(${product.product_id})" style="cursor: pointer;">
                    <div class="position-relative">
                        <img class="card-img-top"
                             src="https://via.placeholder.com/300x200/007bff/ffffff?text=${encodeURIComponent(product.product_name.substring(0, 20))}"
                             alt="${product.product_name}"
                             style="height: 200px; object-fit: cover;" />
                        ${product.discount_percent > 0 ?
                            `<span class="position-absolute top-0 end-0 badge bg-danger m-2">
                                -${product.discount_percent}%
                            </span>` : ''
                        }
                        <div class="position-absolute bottom-0 end-0 m-2">
                            <button class="btn btn-sm btn-light rounded-circle" onclick="event.stopPropagation(); quickAddToWishlist(${product.product_id}, '${product.product_name.replace(/'/g, '\\\'')}')" title="Add to Wishlist">
                                <i class="bi bi-heart"></i>
                            </button>
                        </div>
                    </div>
                    <div class="card-body p-4 d-flex flex-column">
                        <div class="text-center flex-grow-1">
                            <h6 class="fw-bolder mb-2">${product.product_name}</h6>
                            ${product.category ? `
                                <small class="text-muted d-block mb-2">
                                    <i class="bi bi-tag me-1"></i>${product.category.category_name}
                                </small>
                            ` : ''}
                            <div class="d-flex justify-content-center small text-warning mb-2">
                                ${generateStarRating(4.5)}
                            </div>
                            <p class="text-muted small mb-3" style="height: 3em; overflow: hidden; font-size: 0.85em;">
                                ${product.description || 'Premium phone accessory designed for your device'}
                            </p>
                        </div>
                        <div class="text-center mt-auto">
                            <div class="mb-3">
                                ${product.discount_percent > 0 ?
                                    `<div>
                                        <span class="text-muted text-decoration-line-through small">$${product.list_price}</span>
                                        <div class="fs-5 fw-bold text-primary">$${discountedPrice}</div>
                                    </div>` :
                                    `<div class="fs-5 fw-bold text-primary">$${product.list_price}</div>`
                                }
                            </div>
                            <div class="btn-group w-100" role="group">
                                <button class="btn btn-outline-primary btn-sm" onclick="event.stopPropagation(); quickAddToCart(${product.product_id}, '${product.product_name.replace(/'/g, '\\\'')}', ${discountedPrice})">
                                    <i class="bi bi-cart-plus"></i>
                                </button>
                                <button class="btn btn-primary btn-sm" onclick="event.stopPropagation(); viewProduct(${product.product_id})">
                                    <i class="bi bi-eye me-1"></i>View Details
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

function showLoadingSpinner() {
    const productGrid = document.getElementById('product-grid');
    if (productGrid) {
        productGrid.innerHTML = `
            <div class="col-12 text-center">
                <div class="spinner-border text-primary" role="status">
                    <span class="visually-hidden">Loading products...</span>
                </div>
                <p class="mt-2">Loading phone accessories...</p>
            </div>
        `;
    }
}

function displayProductsError() {
    const productGrid = document.getElementById('product-grid');
    if (!productGrid) return;

    productGrid.innerHTML = `
        <div class="col-12 text-center">
            <div class="alert alert-warning" role="alert">
                <i class="bi bi-exclamation-triangle me-2"></i>
                Unable to load products. Please try again later.
                <button class="btn btn-outline-primary btn-sm ms-2" onclick="loadProducts()">
                    <i class="bi bi-arrow-clockwise me-1"></i>Retry
                </button>
            </div>
        </div>
    `;
}

// Product detail modal
async function viewProduct(productId) {
    try {
        const response = await fetch(`${API_BASE}/products/${productId}`);
        if (response.ok) {
            currentProduct = await response.json();
            showProductModal();
        } else {
            showNotification('Product not found', 'error');
        }
    } catch (error) {
        console.error('Error loading product:', error);
        showNotification('Error loading product details', 'error');
    }
}

function showProductModal() {
    if (!currentProduct) return;

    const modal = new bootstrap.Modal(document.getElementById('productModal'));

    // Update modal content
    document.getElementById('productModalLabel').textContent = currentProduct.product_name;
    document.getElementById('modal-product-name').textContent = currentProduct.product_name;
    document.getElementById('modal-product-description').textContent =
        currentProduct.description || 'Premium phone accessory designed for your device.';

    // Update image
    document.getElementById('modal-product-image').src =
        `https://via.placeholder.com/400x300/007bff/ffffff?text=${encodeURIComponent(currentProduct.product_name.substring(0, 20))}`;

    // Update category and SKU
    if (currentProduct.category) {
        document.getElementById('modal-product-category').textContent = currentProduct.category.category_name;
    }
    document.getElementById('modal-product-code').textContent = `SKU: ${currentProduct.product_code}`;

    // Update rating
    document.getElementById('modal-product-rating').innerHTML = generateStarRating(4.5);

    // Update prices
    const discountedPrice = currentProduct.discount_percent > 0
        ? (currentProduct.list_price * (1 - currentProduct.discount_percent / 100)).toFixed(2)
        : currentProduct.list_price;

    const pricesHtml = currentProduct.discount_percent > 0
        ? `<div>
            <span class="text-muted text-decoration-line-through fs-6">${currentProduct.list_price}</span>
            <div class="fs-3 fw-bold text-primary">${discountedPrice}</div>
            <small class="text-success">You save ${(currentProduct.list_price - discountedPrice).toFixed(2)} (${currentProduct.discount_percent}%)</small>
          </div>`
        : `<div class="fs-3 fw-bold text-primary">${currentProduct.list_price}</div>`;

    document.getElementById('modal-product-prices').innerHTML = pricesHtml;

    // Reset quantity
    document.getElementById('quantity').value = 1;

    modal.show();
}

// Search and filter functions
function searchProducts() {
    const searchTerm = document.getElementById('search-input').value.trim().toLowerCase();
    if (searchTerm === '') {
        displayProducts(allProducts);
        return;
    }

    const filteredProducts = allProducts.filter(product =>
        product.product_name.toLowerCase().includes(searchTerm) ||
        (product.description && product.description.toLowerCase().includes(searchTerm)) ||
        (product.category && product.category.category_name.toLowerCase().includes(searchTerm))
    );

    displayProducts(filteredProducts);
    showNotification(`Found ${filteredProducts.length} products matching "${searchTerm}"`, 'info');
}

function filterByCategory(categoryId) {
    if (!categoryId || categoryId === '') {
        displayProducts(allProducts);
        return;
    }

    const filteredProducts = allProducts.filter(product =>
        product.category_id === parseInt(categoryId)
    );

    displayProducts(filteredProducts);

    const categoryName = filteredProducts.length > 0 && filteredProducts[0].category
        ? filteredProducts[0].category.category_name
        : `Category ${categoryId}`;

    showNotification(`Showing ${filteredProducts.length} products in ${categoryName}`, 'info');
}

function updatePriceDisplay() {
    const priceFilter = document.getElementById('price-filter');
    const priceDisplay = document.getElementById('price-display');
    if (priceFilter && priceDisplay) {
        priceDisplay.textContent = `$0 - ${priceFilter.value}`;
    }
}

function filterProducts() {
    const maxPrice = document.getElementById('price-filter').value;
    const filteredProducts = allProducts.filter(product => {
        const price = product.discount_percent > 0
            ? product.list_price * (1 - product.discount_percent / 100)
            : product.list_price;
        return price <= maxPrice;
    });

    displayProducts(filteredProducts);
}

function sortProducts() {
    const sortBy = document.getElementById('sort-select').value;
    let sortedProducts = [...allProducts];

    switch (sortBy) {
        case 'price-low':
            sortedProducts.sort((a, b) => {
                const priceA = a.discount_percent > 0 ? a.list_price * (1 - a.discount_percent / 100) : a.list_price;
                const priceB = b.discount_percent > 0 ? b.list_price * (1 - b.discount_percent / 100) : b.list_price;
                return priceA - priceB;
            });
            break;
        case 'price-high':
            sortedProducts.sort((a, b) => {
                const priceA = a.discount_percent > 0 ? a.list_price * (1 - a.discount_percent / 100) : a.list_price;
                const priceB = b.discount_percent > 0 ? b.list_price * (1 - b.discount_percent / 100) : b.list_price;
                return priceB - priceA;
            });
            break;
        case 'newest':
            sortedProducts.sort((a, b) => new Date(b.date_added) - new Date(a.date_added));
            break;
        case 'name':
        default:
            sortedProducts.sort((a, b) => a.product_name.localeCompare(b.product_name));
            break;
    }

    displayProducts(sortedProducts);
}

function clearFilters() {
    // Reset all filters
    document.getElementById('search-input').value = '';
    document.getElementById('price-filter').value = 200;
    document.getElementById('sort-select').value = 'name';
    updatePriceDisplay();
    displayProducts(allProducts);
    showNotification('Filters cleared', 'success');
}

// Cart functions
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

function addToCart() {
    if (!currentProduct || !currentUser) {
        showNotification('Please log in to add items to cart', 'warning');
        return;
    }

    const quantity = parseInt(document.getElementById('quantity').value);
    const price = currentProduct.discount_percent > 0
        ? currentProduct.list_price * (1 - currentProduct.discount_percent / 100)
        : currentProduct.list_price;

    const existingItem = cart.find(item => item.productId === currentProduct.product_id);

    if (existingItem) {
        existingItem.quantity += quantity;
    } else {
        cart.push({
            productId: currentProduct.product_id,
            name: currentProduct.product_name,
            price: parseFloat(price),
            quantity: quantity,
            addedAt: new Date().toISOString()
        });
    }

    saveCart();
    updateCartBadge();

    // Close modal
    const modal = bootstrap.Modal.getInstance(document.getElementById('productModal'));
    modal.hide();

    showNotification(`${currentProduct.product_name} (${quantity}) added to cart!`, 'success');
}

function changeQuantity(change) {
    const quantityInput = document.getElementById('quantity');
    const currentValue = parseInt(quantityInput.value);
    const newValue = Math.max(1, Math.min(10, currentValue + change));
    quantityInput.value = newValue;
}

function saveCart() {
    localStorage.setItem('phonehub_cart', JSON.stringify(cart));
}

function updateCartBadge() {
    const cartBadge = document.getElementById('cart-badge');
    if (cartBadge) {
        const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
        cartBadge.textContent = totalItems;
        cartBadge.style.display = totalItems > 0 ? 'inline' : 'none';
    }
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

function addToWishlist() {
    if (!currentProduct || !currentUser) {
        showNotification('Please log in to save items to your wishlist', 'warning');
        return;
    }

    const existingItem = wishlist.find(item => item.productId === currentProduct.product_id);

    if (existingItem) {
        showNotification('Item already in wishlist', 'info');
        return;
    }

    wishlist.push({
        productId: currentProduct.product_id,
        name: currentProduct.product_name,
        addedAt: new Date().toISOString()
    });

    saveWishlist();
    updateWishlistBadge();
    showNotification(`${currentProduct.product_name} added to wishlist!`, 'success');
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

// Auth functions
async function login(email, password) {
    try {
        const response = await fetch(`${API_BASE}/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify({ email, password })
        });

        const result = await response.json();

        if (response.ok) {
            showNotification('Login successful!', 'success');

            // Try to get user info from customer service
            try {
                const customerId = getCurrentCustomerId();
                if (customerId) {
                    const customerResponse = await fetch(`/api/customers/${customerId}`, {
                        credentials: 'include'
                    });
                    if (customerResponse.ok) {
                        currentUser = await customerResponse.json();
                    } else {
                        // Fallback - create a basic user object from email
                        currentUser = {
                            email: email,
                            first_name: email.split('@')[0] // Use part before @ as name
                        };
                    }
                } else {
                    // Fallback - create a basic user object from email
                    currentUser = {
                        email: email,
                        first_name: email.split('@')[0]
                    };
                }
            } catch (error) {
                console.log('Could not fetch user details, using email');
                currentUser = {
                    email: email,
                    first_name: email.split('@')[0]
                };
            }

            // Update navigation immediately
            updateNavigation();

            // Redirect after a short delay
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 1000);
        } else {
            throw new Error(result.error || result.detail || 'Invalid credentials');
        }
    } catch (error) {
        console.error('Login error:', error);
        showNotification('Login failed. Please check your credentials.', 'error');
    }
}

async function register(name, email, password) {
    try {
        const response = await fetch(`${API_BASE}/auth/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify({ name, email, password })
        });

        const result = await response.json();

        if (response.ok) {
            showNotification('Registration successful! Please log in.', 'success');
            setTimeout(() => {
                window.location.href = 'login.html';
            }, 1500);
        } else {
            throw new Error(result.error || result.detail || 'Registration failed');
        }
    } catch (error) {
        console.error('Registration error:', error);
        showNotification('Registration failed. Please try again.', 'error');
    }
}

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

// Utility functions
function generateStarRating(rating) {
    let stars = '';
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;

    for (let i = 1; i <= 5; i++) {
        if (i <= fullStars) {
            stars += '<i class="bi-star-fill"></i>';
        } else if (i === fullStars + 1 && hasHalfStar) {
            stars += '<i class="bi-star-half"></i>';
        } else {
            stars += '<i class="bi-star"></i>';
        }
    }
    return stars;
}

function getCurrentCustomerId() {
    // Extract customer ID from cookie
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

// Form handlers
document.addEventListener('DOMContentLoaded', function() {
    // Login form
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;

            if (!email || !password) {
                showNotification('Please fill in all fields', 'error');
                return;
            }

            login(email, password);
        });
    }

    // Register form
    const registerForm = document.getElementById('register-form');
    if (registerForm) {
        registerForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const firstName = document.getElementById('first-name').value.trim();
            const lastName = document.getElementById('last-name').value.trim();
            const name = `${firstName} ${lastName}`.trim();
            const email = document.getElementById('email').value.trim();
            const password = document.getElementById('password').value;

            if (!firstName || !lastName || !email || !password) {
                showNotification('Please fill in all fields', 'error');
                return;
            }

            if (password.length < 8) {
                showNotification('Password must be at least 8 characters long', 'error');
                return;
            }

            register(name, email, password);
        });
    }
});

// Utility function for debouncing search
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Export functions for use in other scripts and global access
window.PhoneHubApp = {
    login,
    register,
    logout,
    loadProducts,
    showNotification,
    getCurrentCustomerId,
    viewProduct,
    quickAddToCart,
    quickAddToWishlist,
    filterByCategory,
    searchProducts,
    addToCart,
    addToWishlist,
    changeQuantity
};

const API_BASE = '/api';

// Global state
let currentUser = null;

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
    initializePage();
    loadProducts();
});

async function initializePage() {
    // Check if user is logged in
    try {
        const response = await fetch('/api/auth/verify', {
            credentials: 'include'
        });
        if (response.ok) {
            currentUser = await response.json();
            updateNavigation();
        }
    } catch (error) {
        console.log('User not logged in');
    }
    updateNavigation();
}

function updateNavigation() {
    const navUserSection = document.getElementById('navbar-user-section');
    if (navUserSection) {
        if (currentUser) {
            navUserSection.innerHTML = `
                <span class="navbar-text me-2">Hello, ${currentUser.email}</span>
                <a href="profile.html" class="btn btn-outline-primary btn-sm me-2">
                    <i class="bi bi-person me-1"></i>Profile
                </a>
                <button class="btn btn-outline-danger btn-sm" onclick="logout()">
                    <i class="bi bi-box-arrow-right me-1"></i>Logout
                </button>
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

// Product functions
async function loadProducts(filters = {}) {
    try {
        const queryParams = new URLSearchParams(filters).toString();
        const response = await fetch(`${API_BASE}/products${queryParams ? '?' + queryParams : ''}`);

        if (response.ok) {
            const products = await response.json();
            displayProducts(products);
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
                        <p class="text-muted">Check back soon for new phone accessories!</p>
                    </div>
                </div>
            </div>
        `;
        return;
    }

    productGrid.innerHTML = products.map(product => `
        <div class="col mb-5">
            <div class="card h-100 shadow-sm">
                <div class="position-relative">
                    <img class="card-img-top"
                         src="https://via.placeholder.com/300x200/007bff/ffffff?text=${encodeURIComponent(product.product_name)}"
                         alt="${product.product_name}"
                         style="height: 200px; object-fit: cover;" />
                    ${product.discount_percent > 0 ?
                        `<span class="position-absolute top-0 end-0 badge bg-danger m-2">
                            ${product.discount_percent}% OFF
                        </span>` : ''
                    }
                </div>
                <div class="card-body p-4">
                    <div class="text-center">
                        <h5 class="fw-bolder">${product.product_name}</h5>
                        <div class="d-flex justify-content-center small text-warning mb-2">
                            ${generateStarRating(4)}
                        </div>
                        <p class="text-muted small mb-3" style="height: 3em; overflow: hidden;">
                            ${product.description || 'Premium phone accessory designed for your device'}
                        </p>
                        <div class="mb-2">
                            ${product.discount_percent > 0 ?
                                `<span class="text-muted text-decoration-line-through small">$${product.list_price}</span>
                                 <span class="fs-5 fw-bold text-primary">$${(product.list_price * (1 - product.discount_percent / 100)).toFixed(2)}</span>` :
                                `<span class="fs-5 fw-bold text-primary">$${product.list_price}</span>`
                            }
                        </div>
                        ${product.category ?
                            `<small class="text-muted">
                                <i class="bi bi-tag me-1"></i>${product.category.category_name}
                            </small>` : ''
                        }
                    </div>
                </div>
                <div class="card-footer p-4 pt-0 border-top-0 bg-transparent">
                    <div class="text-center">
                        <div class="row g-2">
                            <div class="col">
                                <button class="btn btn-outline-primary w-100" onclick="viewProduct(${product.product_id})">
                                    <i class="bi-eye me-1"></i>View
                                </button>
                            </div>
                            <div class="col">
                                <button class="btn btn-primary w-100" onclick="quickAddToWishlist(${product.product_id}, '${product.product_name}')">
                                    <i class="bi-heart me-1"></i>Save
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `).join('');
}

function displayProductsError() {
    const productGrid = document.getElementById('product-grid');
    if (!productGrid) return;

    productGrid.innerHTML = `
        <div class="col-12 text-center">
            <div class="alert alert-warning" role="alert">
                <i class="bi bi-exclamation-triangle me-2"></i>
                Unable to load products. Please try again later.
            </div>
        </div>
    `;
}

function generateStarRating(rating) {
    let stars = '';
    for (let i = 1; i <= 5; i++) {
        if (i <= rating) {
            stars += '<i class="bi-star-fill"></i>';
        } else {
            stars += '<i class="bi-star"></i>';
        }
    }
    return stars;
}

function viewProduct(productId) {
    // For now, just show an alert. In a full implementation, you'd navigate to a product detail page
    showNotification(`Viewing product #${productId}. Product detail page coming soon!`, 'info');
}

function quickAddToWishlist(productId, productName) {
    if (!currentUser) {
        showNotification('Please log in to save items to your wishlist', 'error');
        return;
    }
    showNotification(`${productName} saved to wishlist! (Wishlist functionality coming soon)`, 'success');
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

        if (response.ok) {
            const result = await response.json();
            showNotification('Login successful!', 'success');
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 1000);
        } else {
            const error = await response.json();
            throw new Error(error.detail || 'Invalid credentials');
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

        if (response.ok) {
            showNotification('Registration successful! Please log in.', 'success');
            setTimeout(() => {
                window.location.href = 'login.html';
            }, 1500);
        } else {
            const error = await response.json();
            throw new Error(error.error || 'Registration failed');
        }
    } catch (error) {
        console.error('Registration error:', error);
        showNotification('Registration failed. Please try again.', 'error');
    }
}

async function logout() {
    try {
        currentUser = null;

        // Clear cookies by setting them to expire
        document.cookie = 'session=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
        document.cookie = 'customer_id=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';

        updateNavigation();
        showNotification('Logged out successfully', 'success');

        setTimeout(() => {
            window.location.href = 'index.html';
        }, 1000);
    } catch (error) {
        console.error('Logout error:', error);
        window.location.href = 'index.html';
    }
}

// Order functions
async function loadUserOrders() {
    if (!currentUser) return [];

    try {
        const customerId = getCurrentCustomerId();
        if (!customerId) return [];

        const response = await fetch(`${API_BASE}/orders/customer/${customerId}`, {
            credentials: 'include'
        });

        if (response.ok) {
            return await response.json();
        }
        return [];
    } catch (error) {
        console.error('Error loading orders:', error);
        return [];
    }
}

// Utility functions
function getCurrentCustomerId() {
    // Extract customer ID from cookie or user data
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
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `alert alert-${type === 'error' ? 'danger' : type === 'success' ? 'success' : 'info'} alert-dismissible fade show position-fixed`;
    notification.style.cssText = 'top: 20px; right: 20px; z-index: 9999; min-width: 300px; max-width: 400px;';
    notification.innerHTML = `
        <div class="d-flex align-items-center">
            <i class="bi bi-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-triangle' : 'info-circle'} me-2"></i>
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
            login(email, password);
        });
    }

    // Register form
    const registerForm = document.getElementById('register-form');
    if (registerForm) {
        registerForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const firstName = document.getElementById('first-name').value;
            const lastName = document.getElementById('last-name').value;
            const name = `${firstName} ${lastName}`.trim();
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;

            if (password.length < 8) {
                showNotification('Password must be at least 8 characters long', 'error');
                return;
            }

            register(name, email, password);
        });
    }

    // Search functionality
    const searchInput = document.getElementById('search-input');
    if (searchInput) {
        searchInput.addEventListener('input', debounce(function() {
            const searchTerm = this.value.trim();
            loadProducts({ search: searchTerm });
        }, 500));
    }

    // Category filter
    const categoryLinks = document.querySelectorAll('[data-category]');
    categoryLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const categoryId = this.getAttribute('data-category');
            if (categoryId) {
                loadProducts({ category_id: categoryId });
            } else {
                loadProducts();
            }
        });
    });
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

// Export functions for use in other scripts
window.PhoneHubApp = {
    login,
    register,
    logout,
    loadProducts,
    loadUserOrders,
    showNotification,
    getCurrentCustomerId,
    viewProduct,
    quickAddToWishlist
};

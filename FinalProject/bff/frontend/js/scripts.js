const API_BASE = '/api';

// Global state
let currentUser = null;
let cart = { items: [], total: 0 };

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
    initializePage();
    loadProducts();
    updateCartDisplay();
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
            loadUserCart();
        }
    } catch (error) {
        console.log('User not logged in');
    }
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
        }
    } catch (error) {
        console.error('Error loading products:', error);
    }
}

function displayProducts(products) {
    const productGrid = document.getElementById('product-grid');
    if (!productGrid) return;

    productGrid.innerHTML = products.map(product => `
        <div class="col mb-5">
            <div class="card h-100">
                <img class="card-img-top" src="https://via.placeholder.com/300x200?text=${encodeURIComponent(product.product_name)}" alt="${product.product_name}" />
                <div class="card-body p-4">
                    <div class="text-center">
                        <h5 class="fw-bolder">${product.product_name}</h5>
                        <div class="d-flex justify-content-center small text-warning mb-2">
                            ${generateStarRating(4)}
                        </div>
                        <p class="text-muted small">${product.description || 'Premium phone accessory'}</p>
                        ${product.discount_percent > 0 ?
                            `<span class="text-muted text-decoration-line-through">$${product.list_price}</span>
                             $${(product.list_price * (1 - product.discount_percent / 100)).toFixed(2)}` :
                            `$${product.list_price}`
                        }
                    </div>
                </div>
                <div class="card-footer p-4 pt-0 border-top-0 bg-transparent">
                    <div class="text-center">
                        <button class="btn btn-outline-dark mt-auto" onclick="addToCart(${product.product_id}, '${product.product_name}', ${product.list_price})">
                            <i class="bi-cart-plus me-1"></i>Add to Cart
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `).join('');
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
            window.location.href = 'index.html';
        } else {
            throw new Error('Invalid credentials');
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
            showNotification('Registration successful!', 'success');
            // Send welcome email
            const result = await response.json();
            if (result.customer && result.customer.customer_id) {
                await sendWelcomeEmail(result.customer.customer_id);
            }
            window.location.href = 'login.html';
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
    currentUser = null;
    cart = { items: [], total: 0 };

    // Clear cookies by setting them to expire
    document.cookie = 'session=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
    document.cookie = 'customer_id=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';

    updateNavigation();
    updateCartDisplay();
    showNotification('Logged out successfully', 'success');
    window.location.href = 'index.html';
}

// Order functions
async function createOrder(orderData) {
    try {
        const response = await fetch(`${API_BASE}/orders/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify(orderData)
        });

        if (response.ok) {
            const order = await response.json();

            // Send order confirmation email
            await sendOrderConfirmation({
                customer_id: order.customer_id,
                order_id: order.order_id,
                order_total: order.final_amount || orderData.total_amount
            });

            // Clear cart after successful order
            await clearCart();

            showNotification('Order placed successfully!', 'success');
            return order;
        } else {
            throw new Error('Failed to create order');
        }
    } catch (error) {
        console.error('Error creating order:', error);
        showNotification('Failed to place order', 'error');
        return null;
    }
}

async function loadUserOrders() {
    if (!currentUser) return [];

    try {
        const customerId = getCurrentCustomerId();
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

async function sendOrderConfirmation(orderData) {
    try {
        await fetch(`${API_BASE}/notifications/order-confirmation`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify(orderData)
        });
    } catch (error) {
        console.error('Error sending order confirmation:', error);
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
            register(name, email, password);
        });
    }

    // Checkout form
    const checkoutForm = document.getElementById('checkout-form');
    if (checkoutForm) {
        checkoutForm.addEventListener('submit', async function(e) {
            e.preventDefault();

            if (cart.items.length === 0) {
                showNotification('Your cart is empty', 'error');
                return;
            }

            const orderData = {
                customer_id: getCurrentCustomerId(),
                ship_amount: 5.99,
                tax_amount: cart.final_amount * 0.08,
                ship_address_id: 1, // Default address
                card_type: document.getElementById('payment').value,
                card_number: '1234567890123456', // In real app, use payment processor
                card_expires: '12/25',
                billing_address_id: 1, // Default address
                items: cart.items.map(item => ({
                    product_id: item.product_id,
                    item_price: item.product_info.list_price,
                    discount_amount: (item.product_info.list_price * item.product_info.discount_percent / 100) * item.quantity,
                    quantity: item.quantity
                }))
            };

            const order = await createOrder(orderData);
            if (order) {
                window.location.href = 'orders.html';
            }
        });
    }
});

// Export functions for use in other scripts
window.PhoneHubApp = {
    login,
    register,
    logout,
    addToCart,
    removeFromCart,
    updateCartItemQuantity,
    loadProducts,
    loadUserCart,
    createOrder,
    showNotification,
    getCurrentCustomerId
};

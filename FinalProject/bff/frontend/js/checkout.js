// js/checkout.js
// Add currentUser variable at the top with other variables
const API_BASE = '/api';
let cartItems = [];
let orderSummary = {
    subtotal: 0,
    shipping: 5.99,
    tax: 0,
    total: 0
};

document.addEventListener('DOMContentLoaded', function() {
    initializeCheckoutPage();
    loadCartItems();
    initializeFormValidation();
    setupBillingAddressToggle();
    setupCardNumberFormatting();
});

async function initializeCheckoutPage() {
    // Check if user is logged in (same pattern as cart.js)
    try {
        const response = await fetch('/api/auth/verify', {
            credentials: 'include'
        });
        if (response.ok) {
            const authData = await response.json();
            currentUser = authData;
            console.log("User authenticated in checkout:", currentUser);
            await loadUserData();
            updateNavigation();
        } else {
            // Redirect to login if not authenticated
            console.log("Not authenticated, redirecting to login");
            window.location.href = 'login.html';
        }
    } catch (error) {
        console.log('Authentication check failed:', error);
        window.location.href = 'login.html';
    }
}

async function loadUserData() {
    try {
        const customerId = getCurrentCustomerId();
        console.log("Loading user data for customer ID:", customerId);

        if (customerId) {
            const response = await fetch(`/api/customers/${customerId}`, {
                credentials: 'include'
            });
            if (response.ok) {
                const customer = await response.json();
                console.log("Customer data loaded:", customer);
                prefillCustomerInfo(customer);
            } else {
                console.log("Failed to load customer data:", response.status);
            }
        }

        // Always populate demo payment info
        prefillDemoPaymentInfo();
    } catch (error) {
        console.error('Could not load customer data:', error);
        // Still populate demo payment info even if customer data fails
        prefillDemoPaymentInfo();
    }
}

function prefillCustomerInfo(customer) {
    // Safely set form values
    const firstNameEl = document.getElementById('firstName');
    const lastNameEl = document.getElementById('lastName');
    const emailEl = document.getElementById('email');

    if (firstNameEl) firstNameEl.value = customer.first_name || '';
    if (lastNameEl) lastNameEl.value = customer.last_name || '';
    if (emailEl) emailEl.value = customer.email_address || customer.email || '';
}

function prefillDemoPaymentInfo() {
    // Auto-populate payment fields with demo data
    const cardTypeEl = document.getElementById('cardType');
    const cardNumberEl = document.getElementById('cardNumber');
    const cardExpiryEl = document.getElementById('cardExpiry');
    const cardCVVEl = document.getElementById('cardCVV');

    if (cardTypeEl) cardTypeEl.value = 'Visa';
    if (cardNumberEl) cardNumberEl.value = '4532 1234 5678 9012';
    if (cardExpiryEl) cardExpiryEl.value = '12/28';
    if (cardCVVEl) cardCVVEl.value = '123';

    // Also prefill some demo address info if fields are empty
    const shippingAddress1El = document.getElementById('shippingAddress1');
    const shippingCityEl = document.getElementById('shippingCity');
    const shippingStateEl = document.getElementById('shippingState');
    const shippingZipEl = document.getElementById('shippingZip');
    const phoneEl = document.getElementById('phone');

    if (shippingAddress1El && !shippingAddress1El.value) {
        shippingAddress1El.value = '123 Demo Street';
    }
    if (shippingCityEl && !shippingCityEl.value) {
        shippingCityEl.value = 'Demo City';
    }
    if (shippingStateEl && !shippingStateEl.value) {
        shippingStateEl.value = 'CA';
    }
    if (shippingZipEl && !shippingZipEl.value) {
        shippingZipEl.value = '90210';
    }
    if (phoneEl && !phoneEl.value) {
        phoneEl.value = '(555) 123-4567';
    }
}

function loadCartItems() {
    // Load cart from localStorage (in a real app, this would come from a cart service)
    const cart = JSON.parse(localStorage.getItem('phonehub_cart')) || [];
    cartItems = cart;

    if (cartItems.length === 0) {
        // Redirect to cart if empty
        showNotification('Your cart is empty. Redirecting to store...', 'info');
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 2000);
        return;
    }

    displayCartItems();
    calculateTotals();
}

function displayCartItems() {
    const container = document.getElementById('checkout-items');
    if (!container) return;

    if (cartItems.length === 0) {
        container.innerHTML = `
            <div class="text-center py-3">
                <i class="bi bi-cart-x display-4 text-muted"></i>
                <p class="text-muted">No items in cart</p>
            </div>
        `;
        return;
    }

    container.innerHTML = cartItems.map(item => `
        <div class="d-flex align-items-center mb-3 p-2 border rounded">
            <img src="https://via.placeholder.com/50x50/007bff/ffffff?text=${encodeURIComponent(item.name.substring(0, 3))}"
                 alt="${item.name}" class="rounded me-3" style="width: 50px; height: 50px; object-fit: cover;">
            <div class="flex-grow-1">
                <h6 class="mb-1 small">${item.name}</h6>
                <div class="d-flex justify-content-between">
                    <small class="text-muted">Qty: ${item.quantity}</small>
                    <small class="fw-bold">$${(item.price * item.quantity).toFixed(2)}</small>
                </div>
            </div>
        </div>
    `).join('');
}

function calculateTotals() {
    orderSummary.subtotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    // Free shipping over $50
    if (orderSummary.subtotal >= 50) {
        orderSummary.shipping = 0;
    }

    // Calculate tax (8.5% for demo)
    orderSummary.tax = orderSummary.subtotal * 0.085;

    // Calculate total
    orderSummary.total = orderSummary.subtotal + orderSummary.shipping + orderSummary.tax;

    updateOrderSummary();
}

function updateOrderSummary() {
    const subtotalEl = document.getElementById('subtotal');
    const shippingEl = document.getElementById('shipping');
    const taxEl = document.getElementById('tax');
    const totalEl = document.getElementById('total');

    if (subtotalEl) subtotalEl.textContent = `$${orderSummary.subtotal.toFixed(2)}`;
    if (shippingEl) shippingEl.textContent = orderSummary.shipping === 0 ? 'FREE' : `$${orderSummary.shipping.toFixed(2)}`;
    if (taxEl) taxEl.textContent = `$${orderSummary.tax.toFixed(2)}`;
    if (totalEl) totalEl.textContent = `$${orderSummary.total.toFixed(2)}`;
}

function setupBillingAddressToggle() {
    const checkbox = document.getElementById('sameAsShipping');
    const billingFields = document.getElementById('billingAddressFields');

    if (checkbox && billingFields) {
        checkbox.addEventListener('change', function() {
            billingFields.style.display = this.checked ? 'none' : 'block';

            // Update required attributes
            const billingInputs = billingFields.querySelectorAll('input, select');
            billingInputs.forEach(input => {
                input.required = !this.checked;
            });
        });
    }
}

function setupCardNumberFormatting() {
    const cardNumberInput = document.getElementById('cardNumber');
    const cardExpiryInput = document.getElementById('cardExpiry');

    if (cardNumberInput) {
        cardNumberInput.addEventListener('input', function(e) {
            // Remove all non-digits
            let value = e.target.value.replace(/\D/g, '');

            // Add spaces every 4 digits
            value = value.replace(/(\d{4})(?=\d)/g, '$1 ');

            // Limit to 19 characters (16 digits + 3 spaces)
            if (value.length > 19) {
                value = value.substring(0, 19);
            }

            e.target.value = value;
        });
    }

    if (cardExpiryInput) {
        cardExpiryInput.addEventListener('input', function(e) {
            let value = e.target.value.replace(/\D/g, '');

            if (value.length >= 2) {
                value = value.substring(0, 2) + '/' + value.substring(2, 4);
            }

            e.target.value = value;
        });
    }
}

function initializeFormValidation() {
    const form = document.getElementById('checkout-form');
    if (form) {
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            if (validateForm()) {
                placeOrder();
            }
        });
    }
}

function validateForm() {
    const form = document.getElementById('checkout-form');
    const inputs = form.querySelectorAll('input[required], select[required]');
    let isValid = true;

    inputs.forEach(input => {
        if (!input.value.trim()) {
            input.classList.add('is-invalid');
            isValid = false;
        } else {
            input.classList.remove('is-invalid');
        }
    });

    // Validate email
    const emailEl = document.getElementById('email');
    if (emailEl) {
        const email = emailEl.value;
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            emailEl.classList.add('is-invalid');
            showNotification('Please enter a valid email address', 'error');
            isValid = false;
        }
    }

    // Validate card number (basic check)
    const cardNumberEl = document.getElementById('cardNumber');
    if (cardNumberEl) {
        const cardNumber = cardNumberEl.value.replace(/\s/g, '');
        if (cardNumber.length < 13 || cardNumber.length > 19) {
            cardNumberEl.classList.add('is-invalid');
            showNotification('Please enter a valid card number', 'error');
            isValid = false;
        }
    }

    // Validate expiry date
    const cardExpiryEl = document.getElementById('cardExpiry');
    if (cardExpiryEl) {
        const expiry = cardExpiryEl.value;
        const expiryRegex = /^\d{2}\/\d{2}$/;
        if (!expiryRegex.test(expiry)) {
            cardExpiryEl.classList.add('is-invalid');
            showNotification('Please enter a valid expiry date (MM/YY)', 'error');
            isValid = false;
        }
    }

    // Validate CVV
    const cvvEl = document.getElementById('cardCVV');
    if (cvvEl) {
        const cvv = cvvEl.value;
        if (cvv.length < 3 || cvv.length > 4) {
            cvvEl.classList.add('is-invalid');
            showNotification('Please enter a valid CVV', 'error');
            isValid = false;
        }
    }

    if (!isValid) {
        showNotification('Please fill in all required fields correctly', 'error');
    }

    return isValid;
}

async function placeOrder() {
    try {
        // Show loading state
        const placeOrderBtn = document.querySelector('button[onclick="placeOrder()"]');
        const originalText = placeOrderBtn.innerHTML;
        placeOrderBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2" role="status"></span>Processing...';
        placeOrderBtn.disabled = true;

        // Get customer ID using the function from scripts.js
        const customerId = getCurrentCustomerId();
        console.log("Placing order for customer ID:", customerId);

        if (!customerId) {
            throw new Error('User not authenticated. Please log in again.');
        }

        // Prepare order data with complete information
        const orderData = {
            customer_id: customerId,
            order_total: orderSummary.total,        // Add order total
            ship_amount: orderSummary.shipping,
            tax_amount: orderSummary.tax,
            ship_address_id: 1, // In a real app, this would be from address management
            card_type: document.getElementById('cardType').value,
            card_number: document.getElementById('cardNumber').value.replace(/\s/g, '').slice(-4).padStart(16, '*'),
            card_expires: document.getElementById('cardExpiry').value,
            billing_address_id: 1, // In a real app, this would be from address management
            items: cartItems.map(item => ({
                product_id: item.productId,
                product_name: item.name,            // Include product name
                item_price: item.price,             // Keep original price field
                price: item.price,                  // Add price as fallback
                discount_amount: 0,
                quantity: item.quantity
            }))
        };

        console.log("Order data being sent:", orderData);

        // Submit order
        const response = await fetch(`${API_BASE}/orders`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify(orderData)
        });

        console.log("Order response status:", response.status);

        if (response.ok) {
            const order = await response.json();
            console.log("Order placed successfully:", order);

            // Clear cart
            localStorage.removeItem('phonehub_cart');

            // Show success modal
            const orderNumberEl = document.getElementById('order-number');
            if (orderNumberEl) {
                orderNumberEl.textContent = order.order_id || order.id || 'Unknown';
            }

            const successModal = document.getElementById('orderSuccessModal');
            if (successModal && typeof bootstrap !== 'undefined') {
                const bsModal = new bootstrap.Modal(successModal);
                bsModal.show();
            }

            // Reset form
            const form = document.getElementById('checkout-form');
            if (form) form.reset();

        } else {
            const error = await response.json();
            console.error("Order placement failed:", error);
            throw new Error(error.detail || error.message || 'Failed to place order');
        }

    } catch (error) {
        console.error('Error placing order:', error);
        showNotification('Failed to place order: ' + error.message, 'error');
    } finally {
        // Restore button
        const placeOrderBtn = document.querySelector('button[onclick="placeOrder()"]');
        if (placeOrderBtn) {
            placeOrderBtn.innerHTML = '<i class="bi bi-credit-card me-2"></i>Place Order';
            placeOrderBtn.disabled = false;
        }
    }
}

function applyPromoCode() {
    const promoCodeEl = document.getElementById('promoCode');
    if (!promoCodeEl) return;

    const promoCode = promoCodeEl.value.trim().toUpperCase();

    if (!promoCode) {
        showNotification('Please enter a promo code', 'warning');
        return;
    }

    // Demo promo codes
    const validCodes = {
        'SAVE10': { discount: 0.10, type: 'percentage', description: '10% off' },
        'FREESHIP': { discount: orderSummary.shipping, type: 'fixed', description: 'Free shipping' },
        'WELCOME20': { discount: 0.20, type: 'percentage', description: '20% off for new customers' }
    };

    if (validCodes[promoCode]) {
        const promo = validCodes[promoCode];
        let discount = 0;

        if (promo.type === 'percentage') {
            discount = orderSummary.subtotal * promo.discount;
        } else {
            discount = promo.discount;
        }

        // Apply discount
        if (promo.type === 'percentage') {
            orderSummary.subtotal = orderSummary.subtotal - discount;
        } else if (promoCode === 'FREESHIP') {
            orderSummary.shipping = 0;
        }

        // Recalculate totals
        orderSummary.total = orderSummary.subtotal + orderSummary.shipping + orderSummary.tax;
        updateOrderSummary();

        showNotification(`Promo code applied: ${promo.description}`, 'success');

        // Disable promo input
        promoCodeEl.disabled = true;
        const promoBtn = document.querySelector('button[onclick="applyPromoCode()"]');
        if (promoBtn) promoBtn.disabled = true;

    } else {
        showNotification('Invalid promo code', 'error');
    }
}

// Use the same function from scripts.js but prioritize cookie first
function getCurrentCustomerId() {
    // First check cookies since we know the cookie is being set correctly
    const cookies = document.cookie.split(';');
    for (let cookie of cookies) {
        const [name, value] = cookie.trim().split('=');
        if (name === 'customer_id') {
            const cookieCustomerId = parseInt(value);
            console.log("Customer ID from cookie:", cookieCustomerId);
            return cookieCustomerId;
        }
    }

    // Fallback: try to get it from the global currentUser object (set by scripts.js)
    if (window.currentUser && window.currentUser.customer_id) {
        console.log("Customer ID from window.currentUser:", window.currentUser.customer_id);
        return window.currentUser.customer_id;
    }

    // Last fallback: try to get from currentUser variable in this scope
    if (typeof currentUser !== 'undefined' && currentUser && currentUser.customer_id) {
        console.log("Customer ID from local currentUser:", currentUser.customer_id);
        return currentUser.customer_id;
    }

    console.error("Could not find customer ID in any location");
    console.log("Available cookies:", document.cookie);
    console.log("window.currentUser:", window.currentUser);
    return null;
}

function updateNavigation() {
    const navUserSection = document.getElementById('navbar-user-section');
    if (navUserSection && currentUser) {
        const displayName = currentUser.first_name ||
                           (currentUser.email ? currentUser.email.split('@')[0] : 'User');

        navUserSection.innerHTML = `
            <div class="dropdown">
                <button class="btn btn-success dropdown-toggle" type="button" data-bs-toggle="dropdown">
                    <i class="bi bi-person-circle me-1"></i>${displayName}
                </button>
                <ul class="dropdown-menu dropdown-menu-end">
                    <li><a class="dropdown-item" href="profile.html">
                        <i class="bi bi-person-circle me-2"></i>My Profile
                    </a></li>
                    <li><a class="dropdown-item" href="orders.html">
                        <i class="bi bi-box-seam me-2"></i>My Orders
                    </a></li>
                    <li><a class="dropdown-item" href="wishlist.html">
                        <i class="bi bi-heart me-2"></i>Wishlist
                    </a></li>
                    <li><hr class="dropdown-divider"></li>
                    <li><a class="dropdown-item text-danger" href="#" onclick="logout()">
                        <i class="bi bi-box-arrow-right me-2"></i>Logout
                    </a></li>
                </ul>
            </div>
        `;
    }
}

async function logout() {
    try {
        // Clear local state
        currentUser = null;

        // Clear cookies and storage
        document.cookie = 'session=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
        document.cookie = 'customer_id=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
        localStorage.removeItem('phonehub_cart');
        localStorage.removeItem('phonehub_wishlist');
        localStorage.setItem('user_logged_out', 'true');

        showNotification('Logged out successfully', 'success');
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 1000);
    } catch (error) {
        console.error('Logout error:', error);
        window.location.href = 'index.html';
    }
}

function showNotification(message, type = 'info') {
    const existingNotifications = document.querySelectorAll('.phonehub-notification');
    existingNotifications.forEach(notification => notification.remove());

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

    setTimeout(() => {
        if (notification.parentNode) {
            notification.parentNode.removeChild(notification);
        }
    }, 5000);
}

// Make functions globally available
window.placeOrder = placeOrder;
window.applyPromoCode = applyPromoCode;
window.logout = logout;

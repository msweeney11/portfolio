// js/checkout.js
const API_BASE = '/api';
let cartItems = [];
let currentUser = null;
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
    // Check if user is logged in
    try {
        const response = await fetch('/api/auth/verify', {
            credentials: 'include'
        });
        if (response.ok) {
            const authData = await response.json();
            currentUser = authData;
            await loadUserData();
            updateNavigation();
        } else {
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
        if (customerId) {
            const response = await fetch(`/api/customers/${customerId}`, {
                credentials: 'include'
            });
            if (response.ok) {
                const customer = await response.json();
                prefillCustomerInfo(customer);
            }
        }
    } catch (error) {
        console.log('Could not load customer data:', error);
    }
}

function prefillCustomerInfo(customer) {
    document.getElementById('firstName').value = customer.first_name || '';
    document.getElementById('lastName').value = customer.last_name || '';
    document.getElementById('email').value = customer.email_address || '';
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
    document.getElementById('subtotal').textContent = `$${orderSummary.subtotal.toFixed(2)}`;
    document.getElementById('shipping').textContent = orderSummary.shipping === 0 ? 'FREE' : `$${orderSummary.shipping.toFixed(2)}`;
    document.getElementById('tax').textContent = `$${orderSummary.tax.toFixed(2)}`;
    document.getElementById('total').textContent = `$${orderSummary.total.toFixed(2)}`;
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
    const email = document.getElementById('email').value;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        document.getElementById('email').classList.add('is-invalid');
        showNotification('Please enter a valid email address', 'error');
        isValid = false;
    }

    // Validate card number (basic check)
    const cardNumber = document.getElementById('cardNumber').value.replace(/\s/g, '');
    if (cardNumber.length < 13 || cardNumber.length > 19) {
        document.getElementById('cardNumber').classList.add('is-invalid');
        showNotification('Please enter a valid card number', 'error');
        isValid = false;
    }

    // Validate expiry date
    const expiry = document.getElementById('cardExpiry').value;
    const expiryRegex = /^\d{2}\/\d{2}$/;
    if (!expiryRegex.test(expiry)) {
        document.getElementById('cardExpiry').classList.add('is-invalid');
        showNotification('Please enter a valid expiry date (MM/YY)', 'error');
        isValid = false;
    }

    // Validate CVV
    const cvv = document.getElementById('cardCVV').value;
    if (cvv.length < 3 || cvv.length > 4) {
        document.getElementById('cardCVV').classList.add('is-invalid');
        showNotification('Please enter a valid CVV', 'error');
        isValid = false;
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

        const customerId = getCurrentCustomerId();
        if (!customerId) {
            throw new Error('User not logged in');
        }

        // Prepare order data
        const orderData = {
            customer_id: customerId,
            ship_amount: orderSummary.shipping,
            tax_amount: orderSummary.tax,
            ship_address_id: 1, // In a real app, this would be from address management
            card_type: document.getElementById('cardType').value,
            card_number: document.getElementById('cardNumber').value.replace(/\s/g, '').slice(-4).padStart(16, '*'),
            card_expires: document.getElementById('cardExpiry').value,
            billing_address_id: 1, // In a real app, this would be from address management
            items: cartItems.map(item => ({
                product_id: item.productId,
                item_price: item.price,
                discount_amount: 0,
                quantity: item.quantity
            }))
        };

        // Submit order
        const response = await fetch(`${API_BASE}/orders`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify(orderData)
        });

        if (response.ok) {
            const order = await response.json();

            // Clear cart
            localStorage.removeItem('phonehub_cart');

            // Show success modal
            document.getElementById('order-number').textContent = order.order_id;
            const successModal = new bootstrap.Modal(document.getElementById('orderSuccessModal'));
            successModal.show();

            // Reset form
            document.getElementById('checkout-form').reset();

        } else {
            const error = await response.json();
            throw new Error(error.detail || 'Failed to place order');
        }

    } catch (error) {
        console.error('Error placing order:', error);
        showNotification('Failed to place order: ' + error.message, 'error');
    } finally {
        // Restore button
        const placeOrderBtn = document.querySelector('button[onclick="placeOrder()"]');
        placeOrderBtn.innerHTML = '<i class="bi bi-credit-card me-2"></i>Place Order';
        placeOrderBtn.disabled = false;
    }
}

function applyPromoCode() {
    const promoCode = document.getElementById('promoCode').value.trim().toUpperCase();

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
        document.getElementById('promoCode').disabled = true;
        document.querySelector('button[onclick="applyPromoCode()"]').disabled = true;

    } else {
        showNotification('Invalid promo code', 'error');
    }
}

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
        document.cookie = 'session=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
        document.cookie = 'customer_id=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
        localStorage.removeItem('phonehub_cart');
        localStorage.removeItem('phonehub_wishlist');
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

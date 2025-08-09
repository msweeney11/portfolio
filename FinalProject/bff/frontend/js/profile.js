const API_BASE = '/api';
let currentUser = null;

document.addEventListener('DOMContentLoaded', function() {
    initializePage();
    initializeForms();
    loadUserProfile();
    loadUserOrders();
});

async function initializePage() {
    // Check if user is logged in
    try {
        const response = await fetch('/api/auth/verify', {
            credentials: 'include'
        });
        if (response.ok) {
            currentUser = await response.json();
            updateProfileInfo();
        } else {
            // Redirect to login if not authenticated
            window.location.href = 'login.html';
        }
    } catch (error) {
        console.log('Authentication check failed:', error);
        window.location.href = 'login.html';
    }
}

function updateProfileInfo() {
    if (!currentUser) return;

    const userNameElement = document.getElementById('user-name');
    const userEmailElement = document.getElementById('user-email');

    if (userNameElement) {
        userNameElement.textContent = `Welcome, ${currentUser.first_name || 'User'}!`;
    }
    if (userEmailElement) {
        userEmailElement.textContent = currentUser.email;
    }
}

async function loadUserProfile() {
    try {
        const customerId = getCurrentCustomerId();
        if (!customerId) return;

        const response = await fetch(`/api/customers/${customerId}`, {
            credentials: 'include'
        });

        if (response.ok) {
            const profile = await response.json();
            populateProfileForm(profile);
        }
    } catch (error) {
        console.error('Error loading profile:', error);
    }
}

function populateProfileForm(profile) {
    const firstNameInput = document.getElementById('firstName');
    const lastNameInput = document.getElementById('lastName');
    const emailAddressInput = document.getElementById('emailAddress');

    if (firstNameInput) firstNameInput.value = profile.first_name || '';
    if (lastNameInput) lastNameInput.value = profile.last_name || '';
    if (emailAddressInput) emailAddressInput.value = profile.email_address || '';
}

async function loadUserOrders() {
    try {
        const customerId = getCurrentCustomerId();
        if (!customerId) return;

        const response = await fetch(`${API_BASE}/orders/customer/${customerId}`, {
            credentials: 'include'
        });

        if (response.ok) {
            const orders = await response.json();
            displayOrders(orders);
        } else {
            displayNoOrders();
        }
    } catch (error) {
        console.error('Error loading orders:', error);
        displayNoOrders();
    }
}

function displayOrders(orders) {
    const ordersList = document.getElementById('orders-list');
    if (!ordersList) return;

    if (orders.length === 0) {
        displayNoOrders();
        return;
    }

    ordersList.innerHTML = orders.map(order => `
        <div class="card mb-3 border-0 shadow-sm">
            <div class="card-body">
                <div class="d-flex justify-content-between align-items-start">
                    <div>
                        <h6 class="card-title mb-1">
                            <i class="bi bi-receipt me-2"></i>Order #${order.order_id}
                        </h6>
                        <p class="text-muted small mb-2">
                            <i class="bi bi-calendar me-1"></i>
                            ${new Date(order.order_date).toLocaleDateString()}
                        </p>
                        <div class="mb-2">
                            ${order.items ? order.items.map(item => `
                                <span class="badge bg-light text-dark me-1">
                                    ${item.quantity}x Product #${item.product_id}
                                </span>
                            `).join('') : ''}
                        </div>
                    </div>
                    <div class="text-end">
                        <div class="fw-bold text-primary">
                            $${calculateOrderTotal(order)}
                        </div>
                        <span class="badge bg-${getOrderStatusColor(order)} ms-2">
                            ${getOrderStatus(order)}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    `).join('');
}

function displayNoOrders() {
    const ordersList = document.getElementById('orders-list');
    if (!ordersList) return;

    ordersList.innerHTML = `
        <div class="text-center py-4 text-muted">
            <i class="bi bi-box display-4 mb-3"></i>
            <p>No orders found</p>
            <p class="small">Start shopping to see your orders here</p>
            <a href="index.html" class="btn btn-primary">
                <i class="bi bi-shop me-2"></i>Start Shopping
            </a>
        </div>
    `;
}

function calculateOrderTotal(order) {
    let total = 0;
    if (order.items) {
        total = order.items.reduce((sum, item) => {
            return sum + (item.item_price * item.quantity) - item.discount_amount;
        }, 0);
    }
    total += order.ship_amount || 0;
    total += order.tax_amount || 0;
    return total.toFixed(2);
}

function getOrderStatus(order) {
    if (order.ship_date) {
        return 'Shipped';
    } else {
        return 'Processing';
    }
}

function getOrderStatusColor(order) {
    if (order.ship_date) {
        return 'success';
    } else {
        return 'warning';
    }
}

function initializeForms() {
    // Profile form
    const profileForm = document.getElementById('profile-form');
    if (profileForm) {
        profileForm.addEventListener('submit', handleProfileUpdate);
    }

    // Password form
    const passwordForm = document.getElementById('password-form');
    if (passwordForm) {
        passwordForm.addEventListener('submit', handlePasswordUpdate);
    }

    // Address form
    const addressForm = document.getElementById('address-form');
    if (addressForm) {
        addressForm.addEventListener('submit', handleAddressAdd);
    }
}

async function handleProfileUpdate(e) {
    e.preventDefault();

    const customerId = getCurrentCustomerId();
    if (!customerId) return;

    const formData = new FormData(e.target);
    const updateData = {
        first_name: formData.get('firstName') || document.getElementById('firstName').value,
        last_name: formData.get('lastName') || document.getElementById('lastName').value,
        email_address: formData.get('emailAddress') || document.getElementById('emailAddress').value
    };

    try {
        const response = await fetch(`/api/customers/${customerId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify(updateData)
        });

        if (response.ok) {
            showNotification('Profile updated successfully!', 'success');
        } else {
            throw new Error('Failed to update profile');
        }
    } catch (error) {
        console.error('Error updating profile:', error);
        showNotification('Failed to update profile', 'error');
    }
}

async function handlePasswordUpdate(e) {
    e.preventDefault();

    const currentPassword = document.getElementById('currentPassword').value;
    const newPassword = document.getElementById('newPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;

    if (newPassword !== confirmPassword) {
        showNotification('Passwords do not match', 'error');
        return;
    }

    if (newPassword.length < 8) {
        showNotification('Password must be at least 8 characters long', 'error');
        return;
    }

    // In a real implementation, you would send this to your auth service
    showNotification('Password update functionality coming soon', 'info');
}

async function handleAddressAdd(e) {
    e.preventDefault();

    const formData = new FormData(e.target);
    const addressData = {
        line1: formData.get('addressLine1') || document.getElementById('addressLine1').value,
        line2: formData.get('addressLine2') || document.getElementById('addressLine2').value,
        city: formData.get('city') || document.getElementById('city').value,
        state: formData.get('state') || document.getElementById('state').value,
        zip_code: formData.get('zipCode') || document.getElementById('zipCode').value,
        customer_id: getCurrentCustomerId()
    };

    // In a real implementation, you would send this to your address service
    showNotification('Address management functionality coming soon', 'info');

    // Close modal
    const modal = bootstrap.Modal.getInstance(document.getElementById('addAddressModal'));
    if (modal) {
        modal.hide();
    }
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

async function logout() {
    try {
        // Clear local state
        currentUser = null;

        // Clear cookies
        document.cookie = 'session=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
        document.cookie = 'customer_id=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';

        showNotification('Logged out successfully', 'success');

        // Redirect to home page
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 1000);
    } catch (error) {
        console.error('Logout error:', error);
        window.location.href = 'index.html';
    }
}

function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `alert alert-${type === 'error' ? 'danger' : type === 'success' ? 'success' : 'info'} alert-dismissible fade show position-fixed`;
    notification.style.cssText = 'top: 20px; right: 20px; z-index: 9999; min-width: 300px;';
    notification.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;

    document.body.appendChild(notification);

    // Auto remove after 5 seconds
    setTimeout(() => {
        if (notification.parentNode) {
            notification.parentNode.removeChild(notification);
        }
    }, 5000);
}

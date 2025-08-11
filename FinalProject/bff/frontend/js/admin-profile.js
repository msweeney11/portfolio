const API_BASE = '/api';

/**
 * Initialize admin dashboard when DOM loads
 * Sets up event listeners and loads dashboard data
 */
document.addEventListener('DOMContentLoaded', function() {
    loadDashboardStats();
    loadRecentActivity();
});

/**
 * Load dashboard statistics
 * Fetches and displays key metrics like product count, customer count, etc.
 */
async function loadDashboardStats() {
    try {
        // Load products count
        const productsResponse = await fetch(`${API_BASE}/products`);
        if (productsResponse.ok) {
            const products = await productsResponse.json();
            document.getElementById('total-products').textContent = products.length;
        }

        // Load customers count (if available)
        try {
            const customersResponse = await fetch(`/api/customers`);
            if (customersResponse.ok) {
                const customers = await customersResponse.json();
                document.getElementById('total-customers').textContent = customers.length;
            }
        } catch (error) {
            document.getElementById('total-customers').textContent = '-';
        }

        // Load orders count
        try {
            const ordersResponse = await fetch(`${API_BASE}/orders`);
            if (ordersResponse.ok) {
                const orders = await ordersResponse.json();
                document.getElementById('total-orders').textContent = orders.length;

                // Calculate total revenue
                const revenue = orders.reduce((sum, order) => {
                    return sum + calculateOrderTotal(order);
                }, 0);
                document.getElementById('total-revenue').textContent = `${revenue.toFixed(2)}`;
            }
        } catch (error) {
            document.getElementById('total-orders').textContent = '-';
            document.getElementById('total-revenue').textContent = '$-';
        }

    } catch (error) {
        console.error('Error loading dashboard stats:', error);
    }
}

/**
 * Calculate total amount for an order
 * Sums item prices, shipping, and tax
 * @param {Object} order - Order object with items and totals
 * @returns {number} Total order amount
 */
function calculateOrderTotal(order) {
    let total = 0;
    if (order.items) {
        total = order.items.reduce((sum, item) => {
            return sum + (item.item_price * item.quantity) - item.discount_amount;
        }, 0);
    }
    total += order.ship_amount || 0;
    total += order.tax_amount || 0;
    return total;
}

/**
 * Load recent activity for dashboard
 * Fetches and displays recent orders and activities
 */
async function loadRecentActivity() {
    const recentActivity = document.getElementById('recent-activity');
    if (!recentActivity) return;

    try {
        // Load recent orders
        const ordersResponse = await fetch(`${API_BASE}/orders`);
        if (ordersResponse.ok) {
            const orders = await ordersResponse.json();

            // Sort by date and take the most recent 5
            const recentOrders = orders
                .sort((a, b) => new Date(b.order_date) - new Date(a.order_date))
                .slice(0, 5);

            displayRecentActivity(recentOrders);
        } else {
            displayNoActivity();
        }
    } catch (error) {
        console.error('Error loading recent activity:', error);
        displayNoActivity();
    }
}

/**
 * Display recent activity items
 * Creates activity cards for recent orders
 * @param {Array} orders - Array of recent orders
 */
function displayRecentActivity(orders) {
    const recentActivity = document.getElementById('recent-activity');
    if (!recentActivity) return;

    if (orders.length === 0) {
        displayNoActivity();
        return;
    }

    recentActivity.innerHTML = orders.map(order => `
        <div class="d-flex align-items-center mb-3 p-3 bg-light rounded">
            <div class="flex-shrink-0">
                <i class="bi bi-cart-check-fill text-success fs-4"></i>
            </div>
            <div class="flex-grow-1 ms-3">
                <div class="fw-bold">New Order #${order.order_id}</div>
                <div class="text-muted small">
                    Customer ID: ${order.customer_id} •
                    ${new Date(order.order_date).toLocaleDateString()} •
                    ${calculateOrderTotal(order).toFixed(2)}
                </div>
                ${order.items ? `
                    <div class="mt-1">
                        <small class="text-muted">
                            ${order.items.length} item${order.items.length !== 1 ? 's' : ''}
                        </small>
                    </div>
                ` : ''}
            </div>
            <div class="flex-shrink-0">
                <span class="badge bg-success">New</span>
            </div>
        </div>
    `).join('');
}

/**
 * Display no activity message
 * Shows message when there are no recent activities
 */
function displayNoActivity() {
    const recentActivity = document.getElementById('recent-activity');
    if (!recentActivity) return;

    recentActivity.innerHTML = `
        <div class="text-center py-4 text-muted">
            <i class="bi bi-clock-history display-4 mb-3"></i>
            <p>No recent activity</p>
            <p class="small">Activity will appear here as customers place orders</p>
        </div>
    `;
}

/**
 * Log out admin user
 * Clears admin session and redirects to home page
 */
async function logout() {
    try {
        // Clear cookies
        document.cookie = 'session=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
        document.cookie = 'admin_session=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';

        // Show notification
        showNotification('Logged out successfully', 'success');

        // Redirect to login or home page
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 1000);
    } catch (error) {
        console.error('Logout error:', error);
        window.location.href = 'index.html';
    }
}

/**
 * Display notification message to user
 * Creates and displays a temporary notification alert
 * @param {string} message - Message to display
 * @param {string} type - Notification type (info, success, error)
 */
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

// Export functions for global use
window.logout = logout;

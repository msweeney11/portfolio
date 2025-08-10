console.log("orders.js loaded");

// Global order management state
let allOrders = [];
let filteredOrders = [];
let currentReorderOrderId = null;
let currentSupportOrderId = null;
let currentPage = 1;
const ordersPerPage = 10;

// Order status configurations
const orderStatusConfig = {
    'processing': {
        color: 'warning',
        icon: 'clock',
        label: 'Processing'
    },
    'shipped': {
        color: 'info',
        icon: 'truck',
        label: 'Shipped'
    },
    'delivered': {
        color: 'success',
        icon: 'check-circle',
        label: 'Delivered'
    },
    'cancelled': {
        color: 'danger',
        icon: 'x-circle',
        label: 'Cancelled'
    },
    'pending': {
        color: 'secondary',
        icon: 'pause-circle',
        label: 'Pending'
    }
};

// Initialize orders page
async function initializeOrdersPage() {
    console.log("Initializing orders page...");

    // Ensure user is logged in
    if (!currentUser) {
        console.log("No user logged in, redirecting...");
        window.location.href = 'login.html';
        return;
    }

    // Set up event listeners
    setupOrderEventListeners();

    // Load orders
    await loadOrders();
}

// Set up event listeners
function setupOrderEventListeners() {
    // Search functionality
    const searchInput = document.getElementById('order-search');
    if (searchInput) {
        searchInput.addEventListener('input', debounce(filterOrders, 300));
        searchInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                filterOrders();
            }
        });
    }

    // Filter change listeners
    const statusFilter = document.getElementById('status-filter');
    const timeFilter = document.getElementById('time-filter');

    if (statusFilter) {
        statusFilter.addEventListener('change', filterOrders);
    }

    if (timeFilter) {
        timeFilter.addEventListener('change', filterOrders);
    }

    // Support form submission
    const supportForm = document.getElementById('support-form');
    if (supportForm) {
        supportForm.addEventListener('submit', handleSupportSubmission);
    }
}

// Load orders from backend
async function loadOrders() {
    try {
        showOrdersLoading(true);

        const customerId = getCurrentCustomerId();
        if (!customerId) {
            throw new Error('Customer ID not found');
        }

        console.log("Loading orders for customer:", customerId);

        const response = await fetch(`/api/orders/customer/${customerId}`, {
            credentials: 'include'
        });

        if (!response.ok) {
            if (response.status === 404) {
                // No orders found - this is normal for new customers
                allOrders = [];
                filteredOrders = [];
                displayOrders();
                updateOrderSummary();
                showOrdersLoading(false);
                return;
            }
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const orders = await response.json();
        console.log("Loaded orders:", orders);

        // Ensure orders is an array
        allOrders = Array.isArray(orders) ? orders : [];
        filteredOrders = [...allOrders];

        // Sort orders by date (newest first)
        allOrders.sort((a, b) => new Date(b.order_date || b.created_at) - new Date(a.order_date || a.created_at));
        filteredOrders.sort((a, b) => new Date(b.order_date || b.created_at) - new Date(a.order_date || a.created_at));

        displayOrders();
        updateOrderSummary();
        showOrdersLoading(false);

    } catch (error) {
        console.error('Failed to load orders:', error);
        showOrdersError(error.message);
        showOrdersLoading(false);
    }
}

// Show/hide loading state
function showOrdersLoading(show) {
    const loadingEl = document.getElementById('orders-loading');
    const orderListEl = document.getElementById('order-list');
    const emptyStateEl = document.getElementById('empty-orders');

    if (show) {
        if (loadingEl) loadingEl.style.display = 'block';
        if (orderListEl) orderListEl.classList.add('d-none');
        if (emptyStateEl) emptyStateEl.style.display = 'none';
    } else {
        if (loadingEl) loadingEl.style.display = 'none';
    }
}

// Display orders error
function showOrdersError(message) {
    const orderListEl = document.getElementById('order-list');
    const emptyStateEl = document.getElementById('empty-orders');

    if (orderListEl) {
        orderListEl.classList.remove('d-none');
        orderListEl.innerHTML = `
            <div class="alert alert-danger text-center">
                <i class="bi bi-exclamation-triangle display-6 mb-3"></i>
                <h4>Error Loading Orders</h4>
                <p>${message}</p>
                <button class="btn btn-primary" onclick="loadOrders()">
                    <i class="bi bi-arrow-clockwise me-2"></i>Try Again
                </button>
            </div>
        `;
    }

    if (emptyStateEl) emptyStateEl.style.display = 'none';
}

// Display orders in the UI
function displayOrders() {
    const orderListEl = document.getElementById('order-list');
    const emptyStateEl = document.getElementById('empty-orders');
    const ordersCountEl = document.getElementById('orders-count');

    if (!orderListEl) return;

    // Update orders count
    if (ordersCountEl) {
        ordersCountEl.textContent = `${filteredOrders.length} order${filteredOrders.length !== 1 ? 's' : ''} found`;
    }

    if (filteredOrders.length === 0) {
        orderListEl.classList.add('d-none');
        if (emptyStateEl) emptyStateEl.style.display = 'block';
        return;
    }

    if (emptyStateEl) emptyStateEl.style.display = 'none';
    orderListEl.classList.remove('d-none');

    // Calculate pagination
    const startIndex = (currentPage - 1) * ordersPerPage;
    const endIndex = startIndex + ordersPerPage;
    const paginatedOrders = filteredOrders.slice(startIndex, endIndex);

    // Generate order cards
    orderListEl.innerHTML = paginatedOrders.map(order => createOrderCard(order)).join('');

    // Update pagination
    updatePagination();
}

function createOrderCard(order) {
    const status = order.order_status || order.status || 'pending';
    const statusConfig = orderStatusConfig[status] || orderStatusConfig['pending'];
    const orderDate = new Date(order.order_date || order.created_at).toLocaleDateString();
    const orderTotal = parseFloat(order.order_total || order.total || 0).toFixed(2);

    // Handle order items - they might be in different formats
    let itemsDisplay = '';
    if (order.items && Array.isArray(order.items)) {
        itemsDisplay = order.items.slice(0, 2).map(item => {
            // Try multiple property names for product name
            const productName = item.product_name || item.name || `Product ID: ${item.product_id || item.id || 'Unknown'}`;
            const quantity = item.quantity || 1;

            return `<div class="small text-muted">• ${productName} (x${quantity})</div>`;
        }).join('');

        if (order.items.length > 2) {
            itemsDisplay += `<div class="small text-muted">• +${order.items.length - 2} more item${order.items.length - 2 > 1 ? 's' : ''}</div>`;
        }
    } else {
        itemsDisplay = '<div class="small text-muted">Order details not available</div>';
    }

    return `
        <div class="card mb-3 shadow-sm order-card" data-order-id="${order.order_id || order.id}">
            <div class="card-body">
                <div class="row align-items-center">
                    <div class="col-md-2">
                        <div class="text-center">
                            <h6 class="mb-1">Order #${order.order_id || order.id}</h6>
                            <small class="text-muted">${orderDate}</small>
                        </div>
                    </div>
                    <div class="col-md-3">
                        <div class="d-flex align-items-center">
                            <span class="badge bg-${statusConfig.color} me-2">
                                <i class="bi bi-${statusConfig.icon} me-1"></i>${statusConfig.label}
                            </span>
                        </div>
                        <div class="mt-1">
                            ${itemsDisplay}
                        </div>
                    </div>
                    <div class="col-md-2 text-center">
                        <div class="fs-5 fw-bold text-success">$${orderTotal}</div>
                        <small class="text-muted">${order.items ? order.items.length : 0} item${order.items && order.items.length !== 1 ? 's' : ''}</small>
                    </div>
                    <div class="col-md-2 text-center">
                        ${order.tracking_number ?
                            `<div class="small">
                                <strong>Tracking:</strong><br>
                                <code class="small">${order.tracking_number}</code>
                            </div>` :
                            '<div class="small text-muted">No tracking yet</div>'
                        }
                    </div>
                    <div class="col-md-3">
                        <div class="btn-group w-100" role="group">
                            <button class="btn btn-outline-primary btn-sm" onclick="showOrderDetails(${order.order_id || order.id})" title="View Details">
                                <i class="bi bi-eye"></i>
                            </button>
                            ${status === 'delivered' || status === 'cancelled' ?
                                `<button class="btn btn-outline-success btn-sm" onclick="showReorderModal(${order.order_id || order.id})" title="Reorder">
                                    <i class="bi bi-arrow-repeat"></i>
                                </button>` : ''
                            }
                            ${order.tracking_number ?
                                `<button class="btn btn-outline-info btn-sm" onclick="trackOrder('${order.tracking_number}')" title="Track Package">
                                    <i class="bi bi-geo-alt"></i>
                                </button>` : ''
                            }
                            <button class="btn btn-outline-warning btn-sm" onclick="showSupportModal(${order.order_id || order.id})" title="Contact Support">
                                <i class="bi bi-headset"></i>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
}

// Update order summary cards
function updateOrderSummary() {
    const totalOrdersEl = document.getElementById('total-orders-count');
    const processingOrdersEl = document.getElementById('processing-orders-count');
    const shippedOrdersEl = document.getElementById('shipped-orders-count');
    const totalSpentEl = document.getElementById('total-spent');

    const totalOrders = allOrders.length;
    const processingOrders = allOrders.filter(o => (o.order_status || o.status) === 'processing').length;
    const shippedOrders = allOrders.filter(o => (o.order_status || o.status) === 'shipped').length;
    const totalSpent = allOrders.reduce((sum, order) => sum + parseFloat(order.order_total || order.total || 0), 0);

    if (totalOrdersEl) totalOrdersEl.textContent = totalOrders;
    if (processingOrdersEl) processingOrdersEl.textContent = processingOrders;
    if (shippedOrdersEl) shippedOrdersEl.textContent = shippedOrders;
    if (totalSpentEl) totalSpentEl.textContent = `$${totalSpent.toFixed(2)}`;
}

// Filter orders based on search and filters
function filterOrders() {
    const searchQuery = document.getElementById('order-search')?.value.toLowerCase().trim() || '';
    const statusFilter = document.getElementById('status-filter')?.value || '';
    const timeFilter = document.getElementById('time-filter')?.value || '';

    filteredOrders = allOrders.filter(order => {
        // Search filter
        if (searchQuery) {
            const orderIdMatch = (order.order_id || order.id).toString().includes(searchQuery);
            const productMatch = order.items && order.items.some(item =>
                (item.product_name || item.name || '').toLowerCase().includes(searchQuery)
            );
            if (!orderIdMatch && !productMatch) return false;
        }

        // Status filter
        if (statusFilter && (order.order_status || order.status) !== statusFilter) {
            return false;
        }

        // Time filter
        if (timeFilter) {
            const orderDate = new Date(order.order_date || order.created_at);
            const daysAgo = parseInt(timeFilter);
            const cutoffDate = new Date();
            cutoffDate.setDate(cutoffDate.getDate() - daysAgo);

            if (orderDate < cutoffDate) return false;
        }

        return true;
    });

    currentPage = 1; // Reset to first page
    displayOrders();
}

// Show order details modal
function showOrderDetails(orderId) {
    const order = allOrders.find(o => (o.order_id || o.id) == orderId);
    if (!order) return;

    const modalDetailsEl = document.getElementById('modal-order-details');
    if (!modalDetailsEl) return;

    const status = order.order_status || order.status || 'pending';
    const statusConfig = orderStatusConfig[status] || orderStatusConfig['pending'];
    const orderDate = new Date(order.order_date || order.created_at).toLocaleDateString();
    const orderTotal = parseFloat(order.order_total || order.total || 0).toFixed(2);

    let itemsHtml = '';
    if (order.items && Array.isArray(order.items)) {
        itemsHtml = order.items.map(item => {
            // Try multiple property names for product details
            const productName = item.product_name || item.name || `Product ID: ${item.product_id || item.id || 'Unknown'}`;
            const quantity = item.quantity || 1;
            const unitPrice = parseFloat(item.price || item.unit_price || item.item_price || 0);
            const totalPrice = unitPrice * quantity;

            return `
                <div class="d-flex justify-content-between align-items-center py-2 border-bottom">
                    <div>
                        <h6 class="mb-0">${productName}</h6>
                        <small class="text-muted">Quantity: ${quantity}</small>
                    </div>
                    <div class="text-end">
                        <div class="fw-bold">$${totalPrice.toFixed(2)}</div>
                        <small class="text-muted">$${unitPrice.toFixed(2)} each</small>
                    </div>
                </div>
            `;
        }).join('');
    }

    modalDetailsEl.innerHTML = `
        <div class="row mb-3">
            <div class="col-md-6">
                <h6>Order Information</h6>
                <p><strong>Order ID:</strong> #${order.order_id || order.id}</p>
                <p><strong>Date:</strong> ${orderDate}</p>
                <p><strong>Status:</strong> <span class="badge bg-${statusConfig.color}"><i class="bi bi-${statusConfig.icon} me-1"></i>${statusConfig.label}</span></p>
                ${order.tracking_number ? `<p><strong>Tracking:</strong> <code>${order.tracking_number}</code></p>` : ''}
            </div>
            <div class="col-md-6">
                <h6>Delivery Information</h6>
                <p><strong>Address:</strong><br>${order.shipping_address || order.delivery_address || 'Address not available'}</p>
                ${order.estimated_delivery ? `<p><strong>Estimated Delivery:</strong> ${new Date(order.estimated_delivery).toLocaleDateString()}</p>` : ''}
            </div>
        </div>

        <h6>Order Items</h6>
        <div class="mb-3">
            ${itemsHtml || '<p class="text-muted">No items found</p>'}
        </div>

        <div class="d-flex justify-content-between align-items-center pt-3 border-top">
            <h5 class="mb-0">Total: $${orderTotal}</h5>
        </div>
    `;

    // Show modal
    const modal = document.getElementById('orderDetailsModal');
    if (modal && typeof bootstrap !== 'undefined') {
        const bsModal = new bootstrap.Modal(modal);
        bsModal.show();
    }
}

// Show reorder confirmation modal
function showReorderModal(orderId) {
    const order = allOrders.find(o => (o.order_id || o.id) == orderId);
    if (!order || !order.items) return;

    currentReorderOrderId = orderId;

    const reorderItemsEl = document.getElementById('reorder-items');
    if (reorderItemsEl) {
        reorderItemsEl.innerHTML = order.items.map(item => {
            const productName = item.product_name || item.name || `Product ID: ${item.product_id || item.id || 'Unknown'}`;
            const quantity = item.quantity || 1;
            return `<div>• ${productName} (x${quantity})</div>`;
        }).join('');
    }

    const modal = document.getElementById('reorderModal');
    if (modal && typeof bootstrap !== 'undefined') {
        const bsModal = new bootstrap.Modal(modal);
        bsModal.show();
    }
}

// Confirm reorder
function confirmReorder() {
    if (!currentReorderOrderId) return;

    const order = allOrders.find(o => (o.order_id || o.id) == currentReorderOrderId);
    if (!order || !order.items) return;

    // Add all items to cart
    order.items.forEach(item => {
        quickAddToCart(
            item.product_id || item.id,
            item.product_name || item.name || 'Product',
            item.price || item.unit_price || 0
        );
    });

    showNotification(`${order.items.length} items added to cart from order #${order.order_id || order.id}`, 'success');

    // Close modal
    const modal = document.getElementById('reorderModal');
    if (modal && typeof bootstrap !== 'undefined') {
        const bsModal = bootstrap.Modal.getInstance(modal);
        if (bsModal) bsModal.hide();
    }

    currentReorderOrderId = null;
}

// Show support contact modal
function showSupportModal(orderId) {
    currentSupportOrderId = orderId;

    const orderIdInput = document.getElementById('support-order-id');
    if (orderIdInput) {
        orderIdInput.value = `#${orderId}`;
    }

    // Reset form
    const form = document.getElementById('support-form');
    if (form) {
        form.reset();
        if (orderIdInput) orderIdInput.value = `#${orderId}`; // Set again after reset
    }

    const modal = document.getElementById('supportModal');
    if (modal && typeof bootstrap !== 'undefined') {
        const bsModal = new bootstrap.Modal(modal);
        bsModal.show();
    }
}

// Handle support form submission
async function handleSupportSubmission(e) {
    e.preventDefault();

    const formData = new FormData(e.target);
    const supportData = {
        orderId: currentSupportOrderId,
        issueType: formData.get('support-issue') || document.getElementById('support-issue')?.value,
        message: formData.get('support-message') || document.getElementById('support-message')?.value,
        customerEmail: currentUser?.email
    };

    if (!supportData.issueType || !supportData.message) {
        showNotification('Please fill in all required fields', 'warning');
        return;
    }

    try {
        // For now, just simulate sending the support message
        // In a real app, you'd send this to a support endpoint
        console.log('Support request:', supportData);

        showNotification('Support request submitted successfully! We\'ll get back to you soon.', 'success');

        // Close modal
        const modal = document.getElementById('supportModal');
        if (modal && typeof bootstrap !== 'undefined') {
            const bsModal = bootstrap.Modal.getInstance(modal);
            if (bsModal) bsModal.hide();
        }

        currentSupportOrderId = null;

    } catch (error) {
        console.error('Failed to submit support request:', error);
        showNotification('Failed to submit support request. Please try again.', 'error');
    }
}

// Track order function
function trackOrder(trackingNumber) {
    if (!trackingNumber) return;

    // In a real app, this would integrate with shipping providers
    // For now, just show a notification
    showNotification(`Tracking package: ${trackingNumber}`, 'info');

    // You could open a tracking URL in a new window:
    // window.open(`https://example-shipping.com/track/${trackingNumber}`, '_blank');
}

// Export orders to CSV
function exportOrders() {
    if (filteredOrders.length === 0) {
        showNotification('No orders to export', 'warning');
        return;
    }

    const csvContent = [
        // Header
        ['Order ID', 'Date', 'Status', 'Total', 'Items Count', 'Tracking Number'].join(','),
        // Data rows
        ...filteredOrders.map(order => [
            order.order_id || order.id,
            new Date(order.order_date || order.created_at).toLocaleDateString(),
            order.order_status || order.status || 'pending',
            parseFloat(order.order_total || order.total || 0).toFixed(2),
            order.items ? order.items.length : 0,
            order.tracking_number || 'N/A'
        ].join(','))
    ].join('\n');

    // Create and download file
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `phonehub-orders-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);

    showNotification('Orders exported successfully', 'success');
}

// Pagination functions
function updatePagination() {
    const paginationEl = document.getElementById('orders-pagination');
    if (!paginationEl || filteredOrders.length <= ordersPerPage) {
        if (paginationEl) paginationEl.style.display = 'none';
        return;
    }

    const totalPages = Math.ceil(filteredOrders.length / ordersPerPage);
    paginationEl.style.display = 'flex';

    const paginationUl = paginationEl.querySelector('ul');
    if (!paginationUl) return;

    let paginationHtml = '';

    // Previous button
    paginationHtml += `
        <li class="page-item ${currentPage === 1 ? 'disabled' : ''}">
            <a class="page-link" href="#" onclick="loadOrdersPage(${currentPage - 1})">Previous</a>
        </li>
    `;

    // Page numbers
    for (let i = 1; i <= totalPages; i++) {
        if (i === 1 || i === totalPages || (i >= currentPage - 2 && i <= currentPage + 2)) {
            paginationHtml += `
                <li class="page-item ${i === currentPage ? 'active' : ''}">
                    <a class="page-link" href="#" onclick="loadOrdersPage(${i})">${i}</a>
                </li>
            `;
        } else if (i === currentPage - 3 || i === currentPage + 3) {
            paginationHtml += `<li class="page-item disabled"><span class="page-link">...</span></li>`;
        }
    }

    // Next button
    paginationHtml += `
        <li class="page-item ${currentPage === totalPages ? 'disabled' : ''}">
            <a class="page-link" href="#" onclick="loadOrdersPage(${currentPage + 1})">Next</a>
        </li>
    `;

    paginationUl.innerHTML = paginationHtml;
}

function loadOrdersPage(page) {
    const totalPages = Math.ceil(filteredOrders.length / ordersPerPage);
    if (page < 1 || page > totalPages) return;

    currentPage = page;
    displayOrders();
}

// Utility function for debouncing
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

// Make functions globally available
window.loadOrders = loadOrders;
window.filterOrders = filterOrders;
window.exportOrders = exportOrders;
window.showOrderDetails = showOrderDetails;
window.showReorderModal = showReorderModal;
window.confirmReorder = confirmReorder;
window.showSupportModal = showSupportModal;
window.trackOrder = trackOrder;
window.loadOrdersPage = loadOrdersPage;

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Only initialize if we're on the orders page
    if (window.location.pathname.includes('orders.html')) {
        // Wait for main initialization to complete
        setTimeout(initializeOrdersPage, 100);
    }
});

console.log("orders.js initialization complete");

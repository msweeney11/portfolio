const API_BASE = '/api'; // Define API base URL

async function loadWishlist() {
    try {
        const customerId = getCurrentCustomerId();
        if (!customerId) {
            console.error('No customer ID found');
            showNotification('Please log in to view your wishlist', 'warning');
            // Don't redirect immediately, let user choose
            displayEmptyWishlist();
            return;
        }

        console.log('Loading wishlist for customer:', customerId);

        const response = await fetch(`${API_BASE}/wishlist/customer/${customerId}`, {
            credentials: 'include',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            }
        });

        console.log('Wishlist response status:', response.status);

        if (!response.ok) {
            if (response.status === 404) {
                // Customer not found or no wishlist items
                displayEmptyWishlist();
                return;
            }
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const wishlistData = await response.json();
        console.log('Wishlist data received:', wishlistData);

        // Ensure we have an array
        const wishlist = Array.isArray(wishlistData) ? wishlistData : [];

        displayWishlist(wishlist);

    } catch (error) {
        console.error('Error loading wishlist:', error);
        showNotification('Failed to load wishlist: ' + error.message, 'error');
        displayEmptyWishlist();
    }
}

function displayWishlist(wishlist) {
    const container = document.getElementById('wishlist-items');
    if (!container) {
        console.error('Wishlist container not found');
        return;
    }

    if (!wishlist || wishlist.length === 0) {
        displayEmptyWishlist();
        return;
    }

    container.innerHTML = '';

    wishlist.forEach(item => {
        const product = item.product || {};
        const card = document.createElement('div');
        card.className = 'col-md-6 col-lg-4 mb-4';

        // Handle price display
        const price = product.list_price || product.price || '0.00';
        const discountPrice = product.discount_percent > 0
            ? (price * (1 - product.discount_percent / 100)).toFixed(2)
            : null;

        card.innerHTML = `
            <div class="card h-100 shadow-sm wishlist-card">
                <div class="position-relative">
                    <img class="card-img-top"
                         src="${product.image_url || 'https://dummyimage.com/300x200/dee2e6/6c757d.jpg'}"
                         alt="${product.product_name || 'Product'}"
                         style="height: 200px; object-fit: cover;">
                    ${product.discount_percent > 0 ?
                        `<span class="position-absolute top-0 end-0 badge bg-danger m-2">
                            -${product.discount_percent}%
                        </span>` : ''
                    }
                </div>
                <div class="card-body d-flex flex-column">
                    <h5 class="card-title">${product.product_name || 'Unknown Product'}</h5>
                    <p class="card-text text-muted small flex-grow-1">
                        ${product.description || 'No description available'}
                    </p>
                    <div class="price-section mb-3">
                        ${discountPrice ?
                            `<div>
                                <span class="text-muted text-decoration-line-through small">$${price}</span>
                                <div class="fs-5 fw-bold text-primary">$${discountPrice}</div>
                            </div>` :
                            `<div class="fs-5 fw-bold text-primary">$${price}</div>`
                        }
                    </div>
                    <div class="mt-auto">
                        <div class="btn-group w-100" role="group">
                            <button class="btn btn-outline-primary btn-sm"
                                    onclick="addToCartFromWishlist(${item.product_id}, '${(product.product_name || '').replace(/'/g, '\\\'')}')"
                                    title="Add to Cart">
                                <i class="bi bi-cart-plus"></i>
                            </button>
                            <button class="btn btn-primary btn-sm"
                                    onclick="viewProduct(${item.product_id})"
                                    title="View Details">
                                <i class="bi bi-eye me-1"></i>View
                            </button>
                            <button class="btn btn-outline-danger btn-sm"
                                    onclick="removeFromWishlist(${item.id})"
                                    title="Remove from Wishlist">
                                <i class="bi bi-trash"></i>
                            </button>
                        </div>
                    </div>
                </div>
                <div class="card-footer bg-transparent">
                    <small class="text-muted">
                        <i class="bi bi-calendar me-1"></i>
                        Added ${formatDate(item.created_at)}
                    </small>
                </div>
            </div>
        `;
        container.appendChild(card);
    });

    // Update wishlist count
    updateWishlistCount(wishlist.length);
}

function displayEmptyWishlist() {
    const container = document.getElementById('wishlist-items');
    if (!container) return;

    container.innerHTML = `
        <div class="col-12">
            <div class="text-center py-5">
                <i class="bi bi-heart display-1 text-muted mb-3"></i>
                <h3 class="text-muted">Your wishlist is empty</h3>
                <p class="text-muted">Start adding products you love!</p>
                <a href="index.html" class="btn btn-primary">
                    <i class="bi bi-shop me-1"></i>Continue Shopping
                </a>
            </div>
        </div>
    `;

    updateWishlistCount(0);
}

async function removeFromWishlist(itemId) {
    if (!confirm('Are you sure you want to remove this item from your wishlist?')) {
        return;
    }

    try {
        const response = await fetch(`${API_BASE}/wishlist/${itemId}`, {
            method: 'DELETE',
            credentials: 'include'
        });

        if (response.ok) {
            showNotification('Item removed from wishlist', 'success');
            await loadWishlist(); // Reload the wishlist
        } else {
            const errorText = await response.text();
            throw new Error(errorText || 'Failed to remove item');
        }
    } catch (error) {
        console.error('Error removing from wishlist:', error);
        showNotification('Failed to remove item from wishlist: ' + error.message, 'error');
    }
}

async function addToCartFromWishlist(productId, productName) {
    try {
        const customerId = getCurrentCustomerId();
        if (!customerId) {
            showNotification('Please log in to add items to cart', 'warning');
            return;
        }

        const response = await fetch(`${API_BASE}/cart-items`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify({
                product_id: productId,
                quantity: 1
            })
        });

        if (response.ok) {
            showNotification(`${productName} added to cart!`, 'success');

            // Update cart badge if function exists
            if (typeof updateCartBadge === 'function') {
                updateCartBadge();
            }
        } else {
            const errorText = await response.text();
            throw new Error(errorText || 'Failed to add to cart');
        }
    } catch (error) {
        console.error('Error adding to cart:', error);
        showNotification('Failed to add item to cart: ' + error.message, 'error');
    }
}

async function clearWishlist() {
    if (!confirm('Are you sure you want to remove all items from your wishlist?')) {
        return;
    }

    try {
        const customerId = getCurrentCustomerId();
        if (!customerId) {
            showNotification('Please log in first', 'warning');
            return;
        }

        const response = await fetch(`${API_BASE}/wishlist/customer/${customerId}`, {
            method: 'DELETE',
            credentials: 'include'
        });

        if (response.ok) {
            showNotification('Wishlist cleared successfully', 'success');
            await loadWishlist();
        } else {
            const errorText = await response.text();
            throw new Error(errorText || 'Failed to clear wishlist');
        }
    } catch (error) {
        console.error('Error clearing wishlist:', error);
        showNotification('Failed to clear wishlist: ' + error.message, 'error');
    }
}

async function viewProduct(productId) {
    window.location.href = `product-detail.html?id=${productId}`;
}

function getCurrentCustomerId() {
    // First check cookies - this is most reliable since your logs show it works
    const cookies = document.cookie.split(';');
    for (let cookie of cookies) {
        const [name, value] = cookie.trim().split('=');
        if (name === 'customer_id') {
            const customerId = parseInt(value);
            console.log("Customer ID from cookie:", customerId);
            return customerId;
        }
    }

    // Check if scripts.js has set currentUser (wait for it to be available)
    if (typeof window.currentUser !== 'undefined' && window.currentUser && window.currentUser.customer_id) {
        const customerId = parseInt(window.currentUser.customer_id);
        console.log("Customer ID from window.currentUser:", customerId);
        return customerId;
    }

    // Try to get from global scripts.js functions if available
    if (typeof window.PhoneHubApp !== 'undefined' && typeof window.PhoneHubApp.getCurrentCustomerId === 'function') {
        const customerId = window.PhoneHubApp.getCurrentCustomerId();
        console.log("Customer ID from PhoneHubApp:", customerId);
        return customerId;
    }

    console.log("No customer ID found anywhere");
    return null;
}

function updateWishlistCount(count) {
    const countElements = document.querySelectorAll('.wishlist-count');
    countElements.forEach(element => {
        element.textContent = count;
    });

    // Update page title
    const titleElement = document.querySelector('h1');
    if (titleElement) {
        titleElement.textContent = `My Wishlist (${count} items)`;
    }
}

function formatDate(dateString) {
    if (!dateString) return 'Unknown';

    try {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
    } catch (error) {
        return 'Unknown';
    }
}

async function logout() {
    try {
        // Call logout from main scripts.js if available
        if (typeof window.logout === 'function') {
            window.logout();
            return;
        }

        // Fallback logout implementation
        document.cookie = 'session=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
        document.cookie = 'customer_id=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
        localStorage.clear();

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

function showError(message) {
    showNotification(message, 'error');
}

function showSuccess(message) {
    showNotification(message, 'success');
}

// Initialize wishlist when page loads - wait for auth to complete
document.addEventListener('DOMContentLoaded', function() {
    console.log('Wishlist page loaded, initializing...');

    // Wait a bit for scripts.js to complete authentication
    setTimeout(() => {
        loadWishlist();
    }, 500);

    // Also listen for a custom event from scripts.js when auth is ready
    document.addEventListener('authReady', function() {
        console.log('Auth ready event received, loading wishlist...');
        loadWishlist();
    });
});

// Make functions globally available
window.loadWishlist = loadWishlist;
window.removeFromWishlist = removeFromWishlist;
window.addToCartFromWishlist = addToCartFromWishlist;
window.clearWishlist = clearWishlist;
window.viewProduct = viewProduct;

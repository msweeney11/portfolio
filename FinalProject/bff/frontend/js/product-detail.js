const API_BASE = '/api';

// Only declare these if they don't exist (to avoid conflicts with scripts.js)

/**
 * Initialize the page when DOM content is loaded
 * Sets up event listeners for product detail page initialization
 */
document.addEventListener('DOMContentLoaded', function() {
    initializeProductPage();
    loadProduct();
});

/**
 * Initialize product page authentication and navigation
 * Checks if user is logged in and updates navigation accordingly
 */
async function initializeProductPage() {
    // Check if user is logged in
    try {
        const response = await fetch('/api/auth/verify', {
            credentials: 'include'
        });
        if (response.ok) {
            const authData = await response.json();
            currentUser = authData;
            updateNavigation();
        }
    } catch (error) {
        console.log('User not logged in');
    }
}

/**
 * Load and display product details from URL parameter
 * Gets product ID from URL query string and fetches product data
 */
async function loadProduct() {
    const urlParams = new URLSearchParams(window.location.search);
    const productId = urlParams.get('id');

    if (!productId) {
        showProductNotFound();
        return;
    }

    try {
        const response = await fetch(`${API_BASE}/products/${productId}`);

        if (response.ok) {
            currentProduct = await response.json();
            displayProduct(currentProduct);
            loadRelatedProducts(currentProduct.category_id);
            updateBreadcrumb(currentProduct);
        } else {
            showProductNotFound();
        }
    } catch (error) {
        console.error('Error loading product:', error);
        showProductNotFound();
    }
}

/**
 * Display product information on the page
 * Updates all product elements with data from the product object
 * @param {Object} product - Product object containing all product details
 */
function displayProduct(product) {
    // Hide loading, show content
    document.getElementById('product-loading').style.display = 'none';
    document.getElementById('product-content').style.display = 'block';

    // Update page title
    document.title = `${product.product_name} | PhoneHub`;

    // Product name
    document.getElementById('product-name').textContent = product.product_name;

    // Product image
    const mainImage = document.getElementById('product-main-image');
    mainImage.src = product.image_url || `https://via.placeholder.com/400x400/007bff/ffffff?text=${encodeURIComponent(product.product_name.substring(0, 20))}`;
    mainImage.alt = product.product_name;

    // Category badge
    if (product.category) {
        document.getElementById('product-category-badge').innerHTML =
            `<span class="badge bg-secondary">${product.category.category_name}</span>`;
    }

    // Pricing
    const discountedPrice = product.discount_percent > 0
        ? (product.list_price * (1 - product.discount_percent / 100)).toFixed(2)
        : product.list_price;

    if (product.discount_percent > 0) {
        document.getElementById('regular-price').style.display = 'none';
        document.getElementById('discounted-pricing').style.display = 'block';
        document.getElementById('sale-price').textContent = `$${discountedPrice}`;
        document.getElementById('original-price').textContent = `$${product.list_price}`;
        document.getElementById('savings-amount').textContent = (product.list_price - discountedPrice).toFixed(2);

        // Show discount badge
        document.getElementById('discount-badge').style.display = 'block';
        document.getElementById('discount-amount').textContent = product.discount_percent;
    } else {
        document.getElementById('regular-price').textContent = `$${product.list_price}`;
    }

    // Product details
    document.getElementById('product-sku').textContent = product.product_code;
    document.getElementById('product-category-name').textContent =
        product.category ? product.category.category_name : 'N/A';
    document.getElementById('product-date').textContent =
        product.date_added ? new Date(product.date_added).toLocaleDateString() : 'N/A';

    // Description
    document.getElementById('product-description').textContent =
        product.description || 'This premium phone accessory is designed with the highest quality materials and attention to detail.';

    // Detailed description in tabs
    if (product.description) {
        document.getElementById('detailed-description').innerHTML = `
            <p>${product.description}</p>
            <h6>What's in the Box:</h6>
            <ul>
                <li>1x ${product.product_name}</li>
                <li>1x Installation Guide</li>
                <li>1x Warranty Card</li>
            </ul>
            <h6>Key Features:</h6>
            <ul>
                <li>Premium quality materials</li>
                <li>Perfect compatibility</li>
                <li>Easy installation</li>
                <li>Durable construction</li>
                <li>1-year warranty</li>
            </ul>
        `;
    }
}

/**
 * Update breadcrumb navigation with product information
 * Sets the breadcrumb links with category and product names
 * @param {Object} product - Product object containing category information
 */
function updateBreadcrumb(product) {
    if (product.category) {
        document.getElementById('breadcrumb-category').textContent = product.category.category_name;
        document.getElementById('breadcrumb-category').href = `index.html?category=${product.category_id}`;
    }
    document.getElementById('breadcrumb-product').textContent = product.product_name;
}

/**
 * Load and display related products from the same category
 * Fetches products from the same category and displays up to 4 related items
 * @param {number} categoryId - Category ID to find related products
 */
async function loadRelatedProducts(categoryId) {
    if (!categoryId) return;

    try {
        const response = await fetch(`${API_BASE}/products?category_id=${categoryId}&limit=4`);
        if (response.ok) {
            const products = await response.json();
            // Filter out current product
            const relatedProducts = products.filter(p => p.product_id !== currentProduct.product_id).slice(0, 4);
            displayRelatedProducts(relatedProducts);
        }
    } catch (error) {
        console.error('Error loading related products:', error);
    }
}

/**
 * Display related products in the related products section
 * Creates product cards for each related product
 * @param {Array} products - Array of related product objects
 */
function displayRelatedProducts(products) {
    const container = document.getElementById('related-products');
    if (!container) return;

    if (products.length === 0) {
        container.innerHTML = '<div class="col-12 text-center text-muted">No related products found</div>';
        return;
    }

    container.innerHTML = products.map(product => {
        const discountedPrice = product.discount_percent > 0
            ? (product.list_price * (1 - product.discount_percent / 100)).toFixed(2)
            : product.list_price;

        return `
            <div class="col mb-4">
                <div class="card h-100 shadow-sm" style="cursor: pointer;" onclick="viewProduct(${product.product_id})">
                    <div class="position-relative">
                        <img class="card-img-top"
                             src="${product.image_url || `https://via.placeholder.com/200x150/007bff/ffffff?text=${encodeURIComponent(product.product_name.substring(0, 15))}`}"                                alt="${product.product_name}"
                             style="height: 150px; object-fit: cover;" />
                        ${product.discount_percent > 0 ?
                            `<span class="position-absolute top-0 end-0 badge bg-danger m-2">
                                -${product.discount_percent}%
                            </span>` : ''
                        }
                    </div>
                    <div class="card-body text-center">
                        <h6 class="fw-bolder mb-2">${product.product_name}</h6>
                        <div class="mb-2">
                            ${product.discount_percent > 0 ?
                                `<span class="text-muted text-decoration-line-through small">$${product.list_price}</span>
                                 <div class="fw-bold text-primary">$${discountedPrice}</div>` :
                                `<div class="fw-bold text-primary">$${product.list_price}</div>`
                            }
                        </div>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

/**
 * Change quantity in the quantity input field
 * Increases or decreases quantity while maintaining bounds (1-10)
 * @param {number} change - Amount to change quantity (+1 or -1)
 */
function changeQuantity(change) {
    const quantityInput = document.getElementById('quantity');
    const currentValue = parseInt(quantityInput.value);
    const newValue = Math.max(1, Math.min(10, currentValue + change));
    quantityInput.value = newValue;
}

/**
 * Add current product to shopping cart
 * Validates user login, calculates price, and adds item to localStorage cart
 */
async function addToCart() {
    if (!currentUser) {
        showNotification('Please log in to add items to cart', 'warning');
        return;
    }

    if (!currentProduct) return;

    const quantity = parseInt(document.getElementById('quantity').value);
    const price = currentProduct.discount_percent > 0
        ? currentProduct.list_price * (1 - currentProduct.discount_percent / 100)
        : currentProduct.list_price;

    // Add to localStorage cart (in a real app, this would be a cart service)
    let cart = JSON.parse(localStorage.getItem('phonehub_cart')) || [];
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

    localStorage.setItem('phonehub_cart', JSON.stringify(cart));

    // Show success toast
    showCartToast();
    showNotification(`${currentProduct.product_name} (${quantity}) added to cart!`, 'success');
}

/**
 * Add current product to user's wishlist
 * Validates user login and sends request to wishlist API
 */
async function addToWishlist() {
    if (!currentUser) {
        showNotification('Please log in to save items to your wishlist', 'warning');
        return;
    }

    if (!currentProduct) return;

    try {
        const customerId = getCurrentCustomerId();
        const response = await fetch(`${API_BASE}/wishlist`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify({
                customer_id: customerId,
                product_id: currentProduct.product_id
            })
        });

        if (response.ok) {
            showNotification(`${currentProduct.product_name} added to wishlist!`, 'success');
        } else {
            const error = await response.json();
            if (error.detail && error.detail.includes('already in wishlist')) {
                showNotification('Item already in wishlist', 'info');
            } else {
                throw new Error(error.detail || 'Failed to add to wishlist');
            }
        }
    } catch (error) {
        console.error('Error adding to wishlist:', error);
        showNotification('Failed to add to wishlist: ' + error.message, 'error');
    }
}

/**
 * Show Bootstrap toast notification for cart addition
 * Displays a toast message when item is added to cart
 */
function showCartToast() {
    const toast = new bootstrap.Toast(document.getElementById('cart-toast'));
    toast.show();
}

/**
 * Navigate to product detail page
 * Redirects to product detail page with the specified product ID
 * @param {number} productId - ID of the product to view
 */
function viewProduct(productId) {
    window.location.href = `product-detail.html?id=${productId}`;
}

/**
 * Share product on social media platforms
 * Opens sharing URL for the specified platform
 * @param {string} platform - Social media platform (facebook, twitter, whatsapp, email)
 */
function shareProduct(platform) {
    const url = window.location.href;
    const text = `Check out this ${currentProduct.product_name} on PhoneHub!`;

    let shareUrl = '';

    switch (platform) {
        case 'facebook':
            shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
            break;
        case 'twitter':
            shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`;
            break;
        case 'whatsapp':
            shareUrl = `https://wa.me/?text=${encodeURIComponent(text + ' ' + url)}`;
            break;
        case 'email':
            shareUrl = `mailto:?subject=${encodeURIComponent(text)}&body=${encodeURIComponent(url)}`;
            break;
    }

    if (shareUrl) {
        window.open(shareUrl, '_blank', 'width=600,height=400');
    }
}

/**
 * Show product not found error state
 * Hides loading spinner and shows product not found message
 */
function showProductNotFound() {
    document.getElementById('product-loading').style.display = 'none';
    document.getElementById('product-not-found').style.display = 'block';
}

/**
 * Get customer ID from browser cookies
 * Parses document.cookie to extract customer_id value
 * @returns {number|null} Customer ID or null if not found
 */
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

// Only define these functions if they don't exist (to avoid conflicts with scripts.js)
if (typeof updateNavigation !== 'function') {
    /**
     * Update navigation bar based on user login status
     * Shows user menu if logged in, otherwise shows login/register buttons
     */
    function updateNavigation() {
        const navUserSection = document.getElementById('navbar-user-section');
        if (navUserSection && currentUser) {
            const displayName = currentUser.first_name ||
                               (currentUser.email ? currentUser.email.split('@')[0] : 'User');

            navUserSection.innerHTML = `
                <a href="cart.html" class="btn btn-outline-primary position-relative me-2">
                    <i class="bi bi-cart me-1"></i>Cart
                    <span class="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger" id="cart-badge">
                        0
                    </span>
                </a>
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

            // Update cart badge
            updateCartBadge();
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

if (typeof updateCartBadge !== 'function') {
    /**
     * Update cart badge with current item count
     * Reads cart from localStorage and updates badge display
     */
    function updateCartBadge() {
        const cart = JSON.parse(localStorage.getItem('phonehub_cart')) || [];
        const cartBadge = document.getElementById('cart-badge');
        if (cartBadge) {
            const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
            cartBadge.textContent = totalItems;
            cartBadge.style.display = totalItems > 0 ? 'inline' : 'none';
        }
    }
}

if (typeof logout !== 'function') {
    /**
     * Log out current user
     * Clears cookies, localStorage, and redirects to home page
     */
    async function logout() {
        try {
            document.cookie = 'session=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
            document.cookie = 'customer_id=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
            localStorage.removeItem('phonehub_cart');
            localStorage.removeItem('phonehub_wishlist');
            currentUser = null;
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
}

if (typeof showNotification !== 'function') {
    /**
     * Display notification message to user
     * Creates and displays a temporary notification alert
     * @param {string} message - Message to display
     * @param {string} type - Notification type (info, success, warning, error)
     */
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
}

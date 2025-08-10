const API_BASE = '/api';
let cartItems = [];
let currentUser = null;
let selectedItemForRemoval = null;
let selectedItemForWishlist = null;
let orderSummary = {
    subtotal: 0,
    shipping: 5.99,
    tax: 0,
    discount: 0,
    total: 0
};

document.addEventListener('DOMContentLoaded', function() {
    initializeCartPage();
    loadCart();
    loadRecommendedProducts();
});

async function initializeCartPage() {
    // Check if user is logged in
    try {
        const response = await fetch('/api/auth/verify', {
            credentials: 'include'
        });
        if (response.ok) {
            const authData = await response.json();
            currentUser = authData;
            updateNavigation();
        } else {
            // Redirect to login if not authenticated
            window.location.href = 'login.html';
        }
    } catch (error) {
        console.log('Authentication check failed:', error);
        window.location.href = 'login.html';
    }
}

async function loadCart() {
    try {
        // Show loading state
        document.getElementById('cart-loading').style.display = 'block';
        document.getElementById('cart-content').style.display = 'none';
        document.getElementById('empty-cart').style.display = 'none';

        // Load cart from localStorage (in production, this would be from cart service)
        const localCart = JSON.parse(localStorage.getItem('phonehub_cart')) || [];

        if (localCart.length === 0) {
            showEmptyCart();
            return;
        }

        // Fetch full product details for each cart item
        const cartWithProductDetails = await Promise.all(
            localCart.map(async (cartItem) => {
                try {
                    const response = await fetch(`${API_BASE}/products/${cartItem.productId}`);
                    if (response.ok) {
                        const product = await response.json();
                        return {
                            ...cartItem,
                            product: product
                        };
                    }
                } catch (error) {
                    console.error(`Error loading product ${cartItem.productId}:`, error);
                }
                return cartItem; // Return original item if product fetch fails
            })
        );

        cartItems = cartWithProductDetails;
        displayCartItems();
        calculateTotals();
        showCartContent();

    } catch (error) {
        console.error('Error loading cart:', error);
        showNotification('Failed to load cart', 'error');
        showEmptyCart();
    } finally {
        document.getElementById('cart-loading').style.display = 'none';
    }
}

function displayCartItems() {
    const container = document.getElementById('cart-items-list');
    if (!container) return;

    if (cartItems.length === 0) {
        showEmptyCart();
        return;
    }

    // Update item count
    const itemCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);
    document.getElementById('item-count').textContent = `${itemCount} item${itemCount !== 1 ? 's' : ''}`;

    // Show clear cart button
    document.getElementById('clear-cart-btn').style.display = 'inline-block';

    container.innerHTML = cartItems.map((item, index) => {
        const product = item.product;
        const discountedPrice = product && product.discount_percent > 0
            ? (product.list_price * (1 - product.discount_percent / 100))
            : (product ? product.list_price : item.price);

        const imageUrl = getProductImageUrl(product);
        const itemTotal = (discountedPrice * item.quantity).toFixed(2);

        return `
            <div class="border-bottom p-4" data-cart-index="${index}">
                <div class="row align-items-center">
                    <!-- Product Image -->
                    <div class="col-md-2">
                        <img src="${imageUrl}"
                             alt="${product ? product.product_name : item.name}"
                             class="img-fluid rounded shadow-sm"
                             style="width: 80px; height: 80px; object-fit: cover;"
                             onerror="this.src='https://via.placeholder.com/80x80/6c757d/ffffff?text=No+Image'">
                    </div>

                    <!-- Product Details -->
                    <div class="col-md-4">
                        <h6 class="fw-bold mb-1">${product ? product.product_name : item.name}</h6>
                        <p class="text-muted small mb-1">${product ? (product.description || 'Premium phone accessory') : 'Product description'}</p>
                        ${product && product.product_code ? `<small class="text-muted">SKU: ${product.product_code}</small>` : ''}
                        ${product && product.discount_percent > 0 ? `
                            <div class="mt-1">
                                <span class="badge bg-danger small">${product.discount_percent}% OFF</span>
                            </div>
                        ` : ''}
                    </div>

                    <!-- Quantity Controls -->
                    <div class="col-md-2">
                        <div class="d-flex align-items-center justify-content-center">
                            <button class="btn btn-outline-secondary btn-sm" onclick="updateQuantity(${index}, -1)" ${item.quantity <= 1 ? 'disabled' : ''}>
                                <i class="bi bi-dash"></i>
                            </button>
                            <span class="mx-3 fw-bold">${item.quantity}</span>
                            <button class="btn btn-outline-secondary btn-sm" onclick="updateQuantity(${index}, 1)" ${item.quantity >= 10 ? 'disabled' : ''}>
                                <i class="bi bi-plus"></i>
                            </button>
                        </div>
                        <div class="text-center mt-1">
                            <small class="text-muted">Max 10</small>
                        </div>
                    </div>

                    <!-- Price -->
                    <div class="col-md-2 text-center">
                        ${product && product.discount_percent > 0 ? `
                            <div class="text-muted text-decoration-line-through small">$${(product.list_price * item.quantity).toFixed(2)}</div>
                            <div class="fw-bold text-primary">$${itemTotal}</div>
                            <small class="text-success">You save $${((product.list_price - discountedPrice) * item.quantity).toFixed(2)}</small>
                        ` : `
                            <div class="fw-bold text-primary fs-6">$${itemTotal}</div>
                        `}
                    </div>

                    <!-- Actions -->
                    <div class="col-md-2 text-end">
                        <div class="btn-group-vertical" role="group">
                            <button class="btn btn-outline-primary btn-sm mb-1" onclick="moveToWishlist(${index})" title="Move to Wishlist">
                                <i class="bi bi-heart"></i>
                            </button>
                            <button class="btn btn-outline-danger btn-sm" onclick="removeItem(${index})" title="Remove Item">
                                <i class="bi bi-trash"></i>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

function getProductImageUrl(product) {
    if (!product) return 'https://via.placeholder.com/80x80/6c757d/ffffff?text=No+Image';

    // If product has an uploaded image
    if (product.image_url && product.image_url.trim() !== '') {
        if (product.image_url.startsWith('/static')) {
            return `http://localhost:8001${product.image_url}`;
        }
        if (product.image_url.startsWith('http')) {
            return product.image_url;
        }
        return `http://localhost:8001${product.image_url}`;
    }

    // Default image based on product category or name
    const productName = product.product_name.toLowerCase();
    if (productName.includes('case') || productName.includes('cover')) {
        return 'https://images.unsplash.com/photo-1574944985070-8f3ebc6b79d2?w=150&h=150&fit=crop';
    }
    if (productName.includes('charger') || productName.includes('cable')) {
        return 'https://images.unsplash.com/photo-1583394838336-acd977736f90?w=150&h=150&fit=crop';
    }
    if (productName.includes('headphone') || productName.includes('audio')) {
        return 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=150&h=150&fit=crop';
    }

    return 'https://images.unsplash.com/photo-1556656793-08538906a9f8?w=150&h=150&fit=crop';
}

function calculateTotals() {
    // Calculate subtotal
    orderSummary.subtotal = cartItems.reduce((sum, item) => {
        const product = item.product;
        const price = product && product.discount_percent > 0
            ? (product.list_price * (1 - product.discount_percent / 100))
            : (product ? product.list_price : item.price);
        return sum + (price * item.quantity);
    }, 0);

    // Calculate discount savings
    const totalSavings = cartItems.reduce((sum, item) => {
        const product = item.product;
        if (product && product.discount_percent > 0) {
            const originalPrice = product.list_price * item.quantity;
            const discountedPrice = (product.list_price * (1 - product.discount_percent / 100)) * item.quantity;
            return sum + (originalPrice - discountedPrice);
        }
        return sum;
    }, 0);

    // Free shipping over $50
    if (orderSummary.subtotal >= 50) {
        orderSummary.shipping = 0;
    } else {
        orderSummary.shipping = 5.99;
    }

    // Calculate tax (8.5% for demo)
    orderSummary.tax = orderSummary.subtotal * 0.085;

    // Calculate total
    orderSummary.total = orderSummary.subtotal + orderSummary.shipping + orderSummary.tax - orderSummary.discount;

    // Update UI
    updateOrderSummary(totalSavings);
}

function updateOrderSummary(totalSavings = 0) {
    document.getElementById('subtotal').textContent = `$${orderSummary.subtotal.toFixed(2)}`;

    const shippingElement = document.getElementById('shipping-cost');
    if (orderSummary.shipping === 0) {
        shippingElement.innerHTML = '<span class="text-success">FREE</span>';
    } else {
        shippingElement.textContent = `$${orderSummary.shipping.toFixed(2)}`;
    }

    document.getElementById('tax-amount').textContent = `$${orderSummary.tax.toFixed(2)}`;

    const discountElement = document.getElementById('total-discount');
    const totalDiscountAmount = totalSavings + orderSummary.discount;
    if (totalDiscountAmount > 0) {
        discountElement.textContent = `-$${totalDiscountAmount.toFixed(2)}`;
        discountElement.style.display = 'inline';
    } else {
        discountElement.style.display = 'none';
    }

    document.getElementById('total-amount').textContent = `$${orderSummary.total.toFixed(2)}`;

    // Update checkout button state
    const checkoutBtn = document.getElementById('checkout-btn');
    if (cartItems.length === 0) {
        checkoutBtn.disabled = true;
        checkoutBtn.innerHTML = '<i class="bi bi-cart-x me-2"></i>Cart is Empty';
    } else {
        checkoutBtn.disabled = false;
        checkoutBtn.innerHTML = '<i class="bi bi-credit-card me-2"></i>Proceed to Checkout';
    }
}

function updateQuantity(cartIndex, change) {
    if (cartIndex < 0 || cartIndex >= cartItems.length) return;

    const item = cartItems[cartIndex];
    const newQuantity = item.quantity + change;

    if (newQuantity < 1 || newQuantity > 10) return;

    item.quantity = newQuantity;
    saveCart();
    displayCartItems();
    calculateTotals();

    showNotification('Quantity updated', 'success');
}

function removeItem(cartIndex) {
    if (cartIndex < 0 || cartIndex >= cartItems.length) return;

    selectedItemForRemoval = cartIndex;
    const item = cartItems[cartIndex];

    // Update modal with item details
    const modal = document.getElementById('removeItemModal');
    const modalImage = document.getElementById('modal-item-image');
    const modalName = document.getElementById('modal-item-name');
    const modalPrice = document.getElementById('modal-item-price');

    modalImage.src = getProductImageUrl(item.product);
    modalName.textContent = item.product ? item.product.product_name : item.name;

    const price = item.product && item.product.discount_percent > 0
        ? (item.product.list_price * (1 - item.product.discount_percent / 100))
        : (item.product ? item.product.list_price : item.price);
    modalPrice.textContent = `$${price.toFixed(2)} × ${item.quantity}`;

    // Show modal
    const bsModal = new bootstrap.Modal(modal);
    bsModal.show();
}

function confirmRemoveItem() {
    if (selectedItemForRemoval === null) return;

    const removedItem = cartItems[selectedItemForRemoval];
    cartItems.splice(selectedItemForRemoval, 1);
    selectedItemForRemoval = null;

    saveCart();

    // Close modal
    const modal = bootstrap.Modal.getInstance(document.getElementById('removeItemModal'));
    modal.hide();

    if (cartItems.length === 0) {
        showEmptyCart();
    } else {
        displayCartItems();
        calculateTotals();
    }

    const itemName = removedItem.product ? removedItem.product.product_name : removedItem.name;
    showNotification(`${itemName} removed from cart`, 'success');
}

function moveToWishlist(cartIndex) {
    if (!currentUser) {
        showNotification('Please log in to use wishlist', 'warning');
        return;
    }

    if (cartIndex < 0 || cartIndex >= cartItems.length) return;

    selectedItemForWishlist = cartIndex;
    const item = cartItems[cartIndex];

    // Update modal with item details
    const modal = document.getElementById('moveToWishlistModal');
    const modalImage = document.getElementById('wishlist-item-image');
    const modalName = document.getElementById('wishlist-item-name');
    const modalPrice = document.getElementById('wishlist-item-price');

    modalImage.src = getProductImageUrl(item.product);
    modalName.textContent = item.product ? item.product.product_name : item.name;

    const price = item.product && item.product.discount_percent > 0
        ? (item.product.list_price * (1 - item.product.discount_percent / 100))
        : (item.product ? item.product.list_price : item.price);
    modalPrice.textContent = `$${price.toFixed(2)}`;

    // Show modal
    const bsModal = new bootstrap.Modal(modal);
    bsModal.show();
}

async function confirmMoveToWishlist() {
    if (selectedItemForWishlist === null) return;

    try {
        const item = cartItems[selectedItemForWishlist];

        // Add to wishlist via API (if available) or localStorage
        const customerId = getCurrentCustomerId();
        if (customerId && item.product) {
            const response = await fetch(`${API_BASE}/wishlist`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                credentials: 'include',
                body: JSON.stringify({
                    customer_id: customerId,
                    product_id: item.product.product_id
                })
            });

            if (!response.ok && response.status !== 400) { // 400 might mean already in wishlist
                throw new Error('Failed to add to wishlist');
            }
        } else {
            // Fallback to localStorage
            let wishlist = JSON.parse(localStorage.getItem('phonehub_wishlist')) || [];
            const productId = item.product ? item.product.product_id : item.productId;

            if (!wishlist.find(w => w.productId === productId)) {
                wishlist.push({
                    productId: productId,
                    name: item.product ? item.product.product_name : item.name,
                    addedAt: new Date().toISOString()
                });
                localStorage.setItem('phonehub_wishlist', JSON.stringify(wishlist));
            }
        }

        // Remove from cart
        const movedItem = cartItems[selectedItemForWishlist];
        cartItems.splice(selectedItemForWishlist, 1);
        selectedItemForWishlist = null;

        saveCart();

        // Close modal
        const modal = bootstrap.Modal.getInstance(document.getElementById('moveToWishlistModal'));
        modal.hide();

        if (cartItems.length === 0) {
            showEmptyCart();
        } else {
            displayCartItems();
            calculateTotals();
        }

        const itemName = movedItem.product ? movedItem.product.product_name : movedItem.name;
        showNotification(`${itemName} moved to wishlist`, 'success');

    } catch (error) {
        console.error('Error moving to wishlist:', error);
        showNotification('Failed to move item to wishlist', 'error');
    }
}

function clearCart() {
    if (!confirm('Are you sure you want to remove all items from your cart?')) {
        return;
    }

    cartItems = [];
    saveCart();
    showEmptyCart();
    showNotification('Cart cleared', 'success');
}

function applyPromoCode() {
    const promoCodeInput = document.getElementById('promo-code');
    const promoCode = promoCodeInput.value.trim().toUpperCase();

    if (!promoCode) {
        showNotification('Please enter a promo code', 'warning');
        return;
    }

    // Demo promo codes
    const validCodes = {
        'SAVE10': { discount: 0.10, type: 'percentage', description: '10% off your order' },
        'FREESHIP': { discount: orderSummary.shipping, type: 'fixed', description: 'Free shipping' },
        'WELCOME20': { discount: 0.20, type: 'percentage', description: '20% off for new customers' },
        'PHONEHUB5': { discount: 5.00, type: 'fixed', description: '$5 off your order' }
    };

    if (validCodes[promoCode]) {
        const promo = validCodes[promoCode];
        let discountAmount = 0;

        if (promo.type === 'percentage') {
            discountAmount = orderSummary.subtotal * promo.discount;
        } else {
            discountAmount = Math.min(promo.discount, orderSummary.subtotal); // Don't allow discount larger than subtotal
        }

        orderSummary.discount = discountAmount;

        // Special handling for free shipping
        if (promoCode === 'FREESHIP') {
            orderSummary.shipping = 0;
        }

        calculateTotals();
        showNotification(`Promo code applied: ${promo.description}`, 'success');

        // Disable promo code input
        promoCodeInput.disabled = true;
        promoCodeInput.value = promoCode;
        document.querySelector('button[onclick="applyPromoCode()"]').disabled = true;
        document.querySelector('button[onclick="applyPromoCode()"]').innerHTML = 'Applied!';

    } else {
        showNotification('Invalid promo code', 'error');
        promoCodeInput.focus();
    }
}

async function proceedToCheckout() {
    if (cartItems.length === 0) {
        showNotification('Your cart is empty', 'warning');
        return;
    }

    if (!currentUser) {
        showNotification('Please log in to checkout', 'warning');
        window.location.href = 'login.html';
        return;
    }

    // Save cart state and redirect to checkout
    window.location.href = 'checkout.html';
}

async function loadRecommendedProducts() {
    try {
        const response = await fetch(`${API_BASE}/products?limit=4`);
        if (response.ok) {
            const products = await response.json();

            // Filter out products already in cart
            const cartProductIds = cartItems.map(item => item.productId || (item.product && item.product.product_id));
            const filteredProducts = products.filter(product =>
                !cartProductIds.includes(product.product_id)
            ).slice(0, 4);

            displayRecommendedProducts(filteredProducts);
        }
    } catch (error) {
        console.error('Error loading recommended products:', error);
        document.getElementById('recommended-products').innerHTML = `
            <div class="col-12 text-center text-muted">
                <p>Unable to load recommendations</p>
            </div>
        `;
    }
}

function displayRecommendedProducts(products) {
    const container = document.getElementById('recommended-products');
    if (!container) return;

    if (products.length === 0) {
        container.innerHTML = `
            <div class="col-12 text-center text-muted">
                <p>No recommendations available</p>
            </div>
        `;
        return;
    }

    container.innerHTML = products.map(product => {
        const discountedPrice = product.discount_percent > 0
            ? (product.list_price * (1 - product.discount_percent / 100)).toFixed(2)
            : product.list_price;

        const imageUrl = getProductImageUrl(product);

        return `
            <div class="col mb-4">
                <div class="card h-100 shadow-sm" style="cursor: pointer;">
                    <div class="position-relative">
                        <img class="card-img-top"
                             src="${imageUrl}"
                             alt="${product.product_name}"
                             style="height: 200px; object-fit: cover;"
                             onclick="viewProduct(${product.product_id})" />
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
                                `<span class="text-muted text-decoration-line-through small">${product.list_price}</span>
                                 <div class="fw-bold text-primary">${discountedPrice}</div>` :
                                `<div class="fw-bold text-primary">${product.list_price}</div>`
                            }
                        </div>
                    </div>
                    <div class="card-footer bg-transparent border-0 pt-0">
                        <div class="d-grid gap-2">
                            <button class="btn btn-outline-primary btn-sm" onclick="addToCartFromRecommendations(${product.product_id}, '${product.product_name.replace(/'/g, '\\\'')}', ${discountedPrice})">
                                <i class="bi bi-cart-plus me-1"></i>Add to Cart
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

function addToCartFromRecommendations(productId, productName, price) {
    // Check if item already exists in cart
    const existingItem = cartItems.find(item =>
        (item.productId === productId) || (item.product && item.product.product_id === productId)
    );

    if (existingItem) {
        if (existingItem.quantity < 10) {
            existingItem.quantity += 1;
            saveCart();
            displayCartItems();
            calculateTotals();
            showNotification(`${productName} quantity updated in cart!`, 'success');
        } else {
            showNotification('Maximum quantity reached for this item', 'warning');
        }
    } else {
        // Add new item to cart
        const newItem = {
            productId: productId,
            name: productName,
            price: parseFloat(price),
            quantity: 1,
            addedAt: new Date().toISOString()
        };

        cartItems.push(newItem);
        saveCart();

        // Reload cart to get full product details
        loadCart();
        showNotification(`${productName} added to cart!`, 'success');
    }

    // Reload recommendations to remove the added item
    loadRecommendedProducts();
}

function viewProduct(productId) {
    window.location.href = `product-detail.html?id=${productId}`;
}

function saveCart() {
    // Save to localStorage (in production, this would sync with cart service)
    const cartData = cartItems.map(item => ({
        productId: item.productId || (item.product && item.product.product_id),
        name: item.name || (item.product && item.product.product_name),
        price: item.price || (item.product && item.product.list_price),
        quantity: item.quantity,
        addedAt: item.addedAt
    }));

    localStorage.setItem('phonehub_cart', JSON.stringify(cartData));

    // Update cart badge in navigation
    updateCartBadge();
}

function updateCartBadge() {
    const cartBadges = document.querySelectorAll('#cart-badge');
    const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);

    cartBadges.forEach(badge => {
        badge.textContent = totalItems;
        badge.style.display = totalItems > 0 ? 'inline' : 'none';
    });
}

function showEmptyCart() {
    document.getElementById('cart-loading').style.display = 'none';
    document.getElementById('cart-content').style.display = 'none';
    document.getElementById('empty-cart').style.display = 'block';

    // Update item count
    document.getElementById('item-count').textContent = '0 items';

    // Hide clear cart button
    document.getElementById('clear-cart-btn').style.display = 'none';
}

function showCartContent() {
    document.getElementById('cart-loading').style.display = 'none';
    document.getElementById('cart-content').style.display = 'block';
    document.getElementById('empty-cart').style.display = 'none';
}

function getCurrentCustomerId() {
    if (currentUser && currentUser.customer_id) {
        return currentUser.customer_id;
    }

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
            <a href="cart.html" class="btn btn-primary position-relative me-2">
                <i class="bi bi-cart me-1"></i>Cart
                <span class="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger" id="cart-badge">
                    ${cartItems.reduce((sum, item) => sum + item.quantity, 0)}
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
    }
}

async function logout() {
    try {
        // Clear local state
        currentUser = null;
        cartItems = [];

        // Clear cookies
        document.cookie = 'session=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
        document.cookie = 'customer_id=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';

        // Clear local storage
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

// Export functions for global use
window.updateQuantity = updateQuantity;
window.removeItem = removeItem;
window.confirmRemoveItem = confirmRemoveItem;
window.moveToWishlist = moveToWishlist;
window.confirmMoveToWishlist = confirmMoveToWishlist;
window.clearCart = clearCart;
window.applyPromoCode = applyPromoCode;
window.proceedToCheckout = proceedToCheckout;
window.addToCartFromRecommendations = addToCartFromRecommendations;
window.viewProduct = viewProduct;
window.logout = logout;

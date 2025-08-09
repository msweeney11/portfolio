const ADMIN_API = '/api/admin';

document.addEventListener('DOMContentLoaded', function() {
    loadProducts();
    loadCategories();
    initializeProductForm();
});

async function loadProducts() {
    try {
        const response = await fetch(`${ADMIN_API}/products`);
        if (response.ok) {
            const products = await response.json();
            displayProducts(products);
        } else {
            console.error('Failed to load products');
            showError('Failed to load products');
        }
    } catch (error) {
        console.error('Error loading products:', error);
        showError('Error loading products');
    }
}

async function loadCategories() {
    try {
        const response = await fetch('/api/products/categories');
        if (response.ok) {
            const categories = await response.json();
            populateCategoryDropdown(categories);
        }
    } catch (error) {
        console.error('Error loading categories:', error);
    }
}

function populateCategoryDropdown(categories) {
    const categorySelect = document.getElementById('category');
    if (!categorySelect) return;

    categorySelect.innerHTML = categories.map(cat =>
        `<option value="${cat.category_id}">${cat.category_name}</option>`
    ).join('');
}

function displayProducts(products) {
    const productList = document.getElementById('productList');
    if (!productList) return;

    if (products.length === 0) {
        productList.innerHTML = `
            <li class="list-group-item text-center py-4">
                <i class="bi bi-phone display-4 text-muted mb-3"></i>
                <p class="mb-0">No phone accessories found</p>
                <p class="text-muted">Add your first product using the form above</p>
            </li>
        `;
        return;
    }

    productList.innerHTML = products.map(product => `
        <li class="list-group-item d-flex justify-content-between align-items-start">
            <div class="ms-2 me-auto">
                <div class="fw-bold text-primary">
                    <i class="bi bi-phone me-2"></i>${product.product_name}
                </div>
                <p class="mb-1 text-muted">${product.description || 'No description'}</p>
                <div class="d-flex gap-3 small text-muted">
                    <span><i class="bi bi-tag me-1"></i>SKU: ${product.product_code}</span>
                    <span><i class="bi bi-currency-dollar me-1"></i>$${product.list_price}</span>
                    ${product.discount_percent > 0 ?
                        `<span class="text-success"><i class="bi bi-percent me-1"></i>${product.discount_percent}% off</span>` :
                        ''
                    }
                    <span><i class="bi bi-folder me-1"></i>${product.category ? product.category.category_name : 'Unknown'}</span>
                </div>
            </div>
            <div class="btn-group" role="group">
                <button class="btn btn-outline-primary btn-sm" onclick="editProduct(${product.product_id})">
                    <i class="bi bi-pencil"></i>
                </button>
                <button class="btn btn-outline-danger btn-sm" onclick="deleteProduct(${product.product_id})">
                    <i class="bi bi-trash"></i>
                </button>
            </div>
        </li>
    `).join('');
}

function initializeProductForm() {
    const form = document.getElementById('createProductForm');
    if (!form) return;

    form.addEventListener('submit', async function(e) {
        e.preventDefault();

        const formData = new FormData(form);
        const productData = {
            category_id: parseInt(document.getElementById('category').value),
            product_code: document.getElementById('productCode').value.trim() || "",
            product_name: document.getElementById('name').value,
            description: document.getElementById('description').value,
            list_price: parseFloat(document.getElementById('price').value),
            discount_percent: parseFloat(document.getElementById('discount').value) || 0.0
        };

        try {
            // Handle image upload if present
            const imageFile = document.getElementById('image').files[0];
            if (imageFile) {
                const imageData = new FormData();
                imageData.append('file', imageFile);

                const uploadResponse = await fetch(`${ADMIN_API}/uploads`, {
                    method: 'POST',
                    body: imageData
                });

                if (uploadResponse.ok) {
                    const uploadResult = await uploadResponse.json();
                    productData.image_url = uploadResult.url;
                }
            }

            // Create product
            const response = await fetch(`${ADMIN_API}/products`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(productData)
            });

            if (response.ok) {
                const result = await response.json();
                showSuccess('Phone accessory added successfully!');
                form.reset();
                loadProducts(); // Reload the product list
            } else {
                const error = await response.json();
                throw new Error(error.detail || 'Failed to create product');
            }
        } catch (error) {
            console.error('Error creating product:', error);
            showError('Failed to add product: ' + error.message);
        }
    });
}

async function editProduct(productId) {
    // Implementation for editing products
    showNotification('Edit functionality coming soon', 'info');
}

async function deleteProduct(productId) {
    if (!confirm('Are you sure you want to delete this product?')) {
        return;
    }

    try {
        const response = await fetch(`${ADMIN_API}/products/${productId}`, {
            method: 'DELETE'
        });

        if (response.ok) {
            showSuccess('Product deleted successfully');
            loadProducts();
        } else {
            throw new Error('Failed to delete product');
        }
    } catch (error) {
        console.error('Error deleting product:', error);
        showError('Failed to delete product');
    }
}

function showSuccess(message) {
    showNotification(message, 'success');
}

function showError(message) {
    showNotification(message, 'error');
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

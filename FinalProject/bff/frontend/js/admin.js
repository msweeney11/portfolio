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
        const response = await fetch('/api/products/categories/all');
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

    productList.innerHTML = products.map(product => {
        const imageUrl = getProductImageUrl(product);
        const fallbackImage = getPlaceholderImage('default', 80, 80);

        return `
            <li class="list-group-item d-flex justify-content-between align-items-start">
                <div class="d-flex align-items-start">
                    <div class="me-3">
                        <img src="${imageUrl}"
                             alt="${product.product_name}"
                             class="rounded"
                             style="width: 80px; height: 80px; object-fit: cover;"
                             onerror="this.onerror=null; this.src='${fallbackImage}'">
                    </div>
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
                        ${product.image_url ? `
                            <div class="mt-2">
                                <small class="text-info">
                                    <i class="bi bi-image me-1"></i>Custom image uploaded
                                </small>
                            </div>
                        ` : `
                            <div class="mt-2">
                                <small class="text-warning">
                                    <i class="bi bi-image me-1"></i>Using category default image
                                </small>
                            </div>
                        `}
                    </div>
                </div>
                <div class="btn-group" role="group">
                    <button class="btn btn-outline-primary btn-sm" onclick="editProduct(${product.product_id})" title="Edit Product">
                        <i class="bi bi-pencil"></i>
                    </button>
                    <button class="btn btn-outline-danger btn-sm" onclick="deleteProduct(${product.product_id})" title="Delete Product">
                        <i class="bi bi-trash"></i>
                    </button>
                </div>
            </li>
        `;
    }).join('');
}

// Use the same image handling functions from scripts.js
function getProductImageUrl(product) {
    if (!product) return getPlaceholderImage('default');

    // If product has an uploaded image URL
    if (product.image_url && product.image_url.trim() !== '') {
        // If it starts with /static, it's from admin-service
        if (product.image_url.startsWith('/static')) {
            return `http://localhost:8001${product.image_url}`;
        }
        // If it's already a full URL (like Unsplash)
        if (product.image_url.startsWith('http')) {
            return product.image_url;
        }
        // If it's a relative URL
        return `http://localhost:8001${product.image_url}`;
    }

    // Fallback to category-based placeholder
    return getCategoryImage(product);
}

function getCategoryImage(product) {
    if (!product) return getPlaceholderImage('default');

    const productName = product.product_name ? product.product_name.toLowerCase() : '';
    const categoryName = product.category ? product.category.category_name.toLowerCase() : '';

    // Phone cases and covers
    if (productName.includes('case') || productName.includes('cover') || categoryName.includes('case')) {
        return 'https://images.unsplash.com/photo-1574944985070-8f3ebc6b79d2?w=400&h=400&fit=crop';
    }
    // Chargers and cables
    if (productName.includes('charger') || productName.includes('cable') || productName.includes('charging') || categoryName.includes('charger')) {
        return 'https://images.unsplash.com/photo-1583394838336-acd977736f90?w=400&h=400&fit=crop';
    }
    // Audio accessories
    if (productName.includes('headphone') || productName.includes('earbuds') || productName.includes('speaker') || productName.includes('audio') || categoryName.includes('audio')) {
        return 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&h=400&fit=crop';
    }
    // Car mounts and stands
    if (productName.includes('mount') || productName.includes('stand') || categoryName.includes('mount') || categoryName.includes('stand')) {
        return 'https://images.unsplash.com/photo-1556656793-08538906a9f8?w=400&h=400&fit=crop';
    }
    // Screen protectors
    if (productName.includes('screen') || productName.includes('protector') || productName.includes('glass') || categoryName.includes('protector')) {
        return 'https://images.unsplash.com/photo-1556656793-08538906a9f8?w=400&h=400&fit=crop';
    }
    // Power banks and batteries
    if (productName.includes('power') || productName.includes('bank') || productName.includes('battery') || categoryName.includes('power') || categoryName.includes('batteries')) {
        return 'https://images.unsplash.com/photo-1609592173572-a4c7a0b09be5?w=400&h=400&fit=crop';
    }
    // Phone grips and rings
    if (productName.includes('grip') || productName.includes('ring') || productName.includes('pop') || categoryName.includes('grip') || categoryName.includes('ring')) {
        return 'https://images.unsplash.com/photo-1571068316344-75bc76f77890?w=400&h=400&fit=crop';
    }
    // Camera accessories
    if (productName.includes('camera') || productName.includes('lens') || productName.includes('tripod') || categoryName.includes('camera')) {
        return 'https://images.unsplash.com/photo-1606983340091-bd40bbf55be3?w=400&h=400&fit=crop';
    }

    // Default phone accessory image
    return 'https://images.unsplash.com/photo-1556656793-08538906a9f8?w=400&h=400&fit=crop';
}

function getPlaceholderImage(type = 'default', width = 400, height = 400) {
    const placeholders = {
        case: `https://via.placeholder.com/${width}x${height}/007bff/ffffff?text=Phone+Case`,
        charger: `https://via.placeholder.com/${width}x${height}/28a745/ffffff?text=Charger`,
        audio: `https://via.placeholder.com/${width}x${height}/6f42c1/ffffff?text=Audio`,
        mount: `https://via.placeholder.com/${width}x${height}/fd7e14/ffffff?text=Mount`,
        screen: `https://via.placeholder.com/${width}x${height}/20c997/ffffff?text=Screen`,
        power: `https://via.placeholder.com/${width}x${height}/e83e8c/ffffff?text=Power`,
        grip: `https://via.placeholder.com/${width}x${height}/6c757d/ffffff?text=Grip`,
        camera: `https://via.placeholder.com/${width}x${height}/17a2b8/ffffff?text=Camera`,
        default: `https://via.placeholder.com/${width}x${height}/6c757d/ffffff?text=Phone+Accessory`
    };

    return placeholders[type] || placeholders.default;
}

function initializeProductForm() {
    const form = document.getElementById('createProductForm');
    if (!form) return;

    // Add image preview functionality
    const imageInput = document.getElementById('image');
    if (imageInput) {
        imageInput.addEventListener('change', function(e) {
            const file = e.target.files[0];
            if (file) {
                previewImage(file);
            }
        });
    }

    form.addEventListener('submit', async function(e) {
        e.preventDefault();

        const submitBtn = e.target.querySelector('button[type="submit"]');
        const originalText = submitBtn.innerHTML;
        submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2" role="status"></span>Creating...';
        submitBtn.disabled = true;

        try {
            let imageUrl = null;

            // Handle image upload first if present
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
                    imageUrl = uploadResult.url;
                    console.log('Image uploaded successfully:', imageUrl);
                } else {
                    console.warn('Image upload failed, proceeding without image');
                }
            }

            // Prepare product data
            const productData = {
                category_id: parseInt(document.getElementById('category').value),
                product_code: document.getElementById('productCode').value.trim() || "",
                product_name: document.getElementById('name').value,
                description: document.getElementById('description').value,
                list_price: parseFloat(document.getElementById('price').value),
                discount_percent: parseFloat(document.getElementById('discount').value) || 0.0
            };

            // Add image URL if we have one
            if (imageUrl) {
                productData.image_url = imageUrl;
            }

            console.log('Creating product:', productData);

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
                clearImagePreview();
                loadProducts(); // Reload the product list
            } else {
                const error = await response.json();
                throw new Error(error.detail || 'Failed to create product');
            }
        } catch (error) {
            console.error('Error creating product:', error);
            showError('Failed to add product: ' + error.message);
        } finally {
            // Restore button
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
        }
    });
}

function previewImage(file) {
    // Remove existing preview
    clearImagePreview();

    // Create preview container
    const previewContainer = document.createElement('div');
    previewContainer.id = 'image-preview';
    previewContainer.className = 'mt-3 p-3 border rounded bg-light';

    // Create preview image
    const img = document.createElement('img');
    img.className = 'img-thumbnail me-3';
    img.style.maxWidth = '150px';
    img.style.maxHeight = '150px';

    // Create file info
    const fileInfo = document.createElement('div');
    fileInfo.className = 'd-inline-block align-top';
    fileInfo.innerHTML = `
        <div class="fw-bold text-success">Image Preview</div>
        <div class="small text-muted">
            <i class="bi bi-file-earmark-image me-1"></i>${file.name}
        </div>
        <div class="small text-muted">
            Size: ${(file.size / 1024 / 1024).toFixed(2)} MB
        </div>
        <button type="button" class="btn btn-outline-danger btn-sm mt-2" onclick="clearImagePreview()">
            <i class="bi bi-trash me-1"></i>Remove
        </button>
    `;

    previewContainer.appendChild(img);
    previewContainer.appendChild(fileInfo);

    // Insert preview after the file input
    const imageInput = document.getElementById('image');
    imageInput.parentNode.appendChild(previewContainer);

    // Load and display image
    const reader = new FileReader();
    reader.onload = function(e) {
        img.src = e.target.result;
    };
    reader.readAsDataURL(file);
}

function clearImagePreview() {
    const preview = document.getElementById('image-preview');
    if (preview) {
        preview.remove();
    }

    // Clear file input
    const imageInput = document.getElementById('image');
    if (imageInput) {
        imageInput.value = '';
    }
}

async function editProduct(productId) {
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
    // Remove existing notifications
    const existingNotifications = document.querySelectorAll('.admin-notification');
    existingNotifications.forEach(notification => notification.remove());

    // Create notification element
    const notification = document.createElement('div');
    notification.className = `alert alert-${type === 'error' ? 'danger' : type === 'success' ? 'success' : 'info'} alert-dismissible fade show position-fixed admin-notification`;
    notification.style.cssText = 'top: 20px; right: 20px; z-index: 9999; min-width: 300px; max-width: 500px;';
    notification.innerHTML = `
        <div class="d-flex align-items-center">
            <i class="bi bi-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-triangle' : 'info-circle'} me-2"></i>
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

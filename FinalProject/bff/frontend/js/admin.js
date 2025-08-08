// Admin functionality for product management

// Generate a short product code (max 10 characters)
function generateProductCode() {
  const prefix = 'P';
  const timestamp = Date.now().toString().slice(-8); // Last 8 digits of timestamp
  return prefix + timestamp; // e.g., P12345678 (9 characters)
}

// Load existing products
async function loadProducts() {
  try {
    const response = await fetch('/api/admin/products');
    const products = await response.json();
    const productList = document.getElementById('productList');

    productList.innerHTML = '';

    if (products && products.length > 0) {
      products.forEach(product => {
        const listItem = document.createElement('li');
        listItem.className = 'list-group-item d-flex justify-content-between align-items-center';
        listItem.innerHTML = `
          <div>
            <h6 class="mb-1">${product.product_name}</h6>
            <p class="mb-1">Code: ${product.product_code} | Price: $${product.list_price}</p>
            <small class="text-muted">${product.description || 'No description'}</small>
          </div>
          <div>
            <button class="btn btn-sm btn-outline-danger" onclick="deleteProduct(${product.product_id})">
              Delete
            </button>
          </div>
        `;
        productList.appendChild(listItem);
      });
    } else {
      productList.innerHTML = '<li class="list-group-item">No products found</li>';
    }
  } catch (error) {
    console.error('Failed to load products:', error);
    document.getElementById('productList').innerHTML =
      '<li class="list-group-item text-danger">Error loading products</li>';
  }
}

// Create new product with validation
async function createProduct(event) {
  event.preventDefault();

  const submitBtn = event.target.querySelector('button[type="submit"]');
  const originalText = submitBtn.textContent;

  // Show loading state
  submitBtn.disabled = true;
  submitBtn.innerHTML = '<i class="spinner-border spinner-border-sm me-2"></i>Creating...';

  try {
    const name = document.getElementById('name').value.trim();
    const price = document.getElementById('price').value;
    const description = document.getElementById('description').value.trim();
    const productCode = document.getElementById('productCode').value.trim();
    const discount = document.getElementById('discount').value || 0;
    const category = document.getElementById('category').value || 1;

    // Validation
    if (!name) {
      showMessage('Product name is required', 'warning');
      return;
    }

    if (!price || parseFloat(price) <= 0) {
      showMessage('Please enter a valid price', 'warning');
      return;
    }

    // Generate product code if not provided
    const finalProductCode = productCode || generateProductCode();

    // Limit lengths
    const productName = name.length > 255 ? name.substring(0, 255) : name;
    const productDescription = description.length > 1000 ? description.substring(0, 1000) : description;

    const productData = {
      product_name: productName,
      product_code: finalProductCode,
      list_price: parseFloat(price),
      description: productDescription,
      category_id: parseInt(category),
      discount_percent: parseFloat(discount)
    };

    console.log('Creating product with data:', productData);

    const response = await fetch('/api/admin/products/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(productData)
    });

    if (response.ok) {
      const result = await response.json();
      console.log('Product created successfully:', result);

      // Show success message
      showMessage('Product created successfully!', 'success');

      // Reset form
      document.getElementById('createProductForm').reset();

      // Reload products list
      loadProducts();
    } else {
      const errorText = await response.text();
      console.error('Server error:', errorText);

      let errorMessage = 'Failed to create product';
      try {
        const errorData = JSON.parse(errorText);
        errorMessage = errorData.detail || errorMessage;
      } catch (e) {
        errorMessage = `Server error: ${response.status}`;
      }

      showMessage(errorMessage, 'danger');
    }
  } catch (error) {
    console.error('Error creating product:', error);
    showMessage('Network error: ' + error.message, 'danger');
  } finally {
    // Reset button
    submitBtn.disabled = false;
    submitBtn.innerHTML = originalText;
  }
}

// Delete product with confirmation
async function deleteProduct(productId) {
  if (!confirm('Are you sure you want to delete this product?')) {
    return;
  }

  try {
    const response = await fetch(`/api/admin/products/${productId}`, {
      method: 'DELETE'
    });

    if (response.ok) {
      showMessage('Product deleted successfully!', 'success');
      loadProducts();
    } else {
      const errorText = await response.text();
      console.error('Delete error:', errorText);

      let errorMessage = 'Failed to delete product';
      try {
        const errorData = JSON.parse(errorText);
        errorMessage = errorData.detail || errorMessage;
      } catch (e) {
        errorMessage = `Server error: ${response.status}`;
      }

      showMessage(errorMessage, 'danger');
    }
  } catch (error) {
    console.error('Error deleting product:', error);
    showMessage('Network error: ' + error.message, 'danger');
  }
}

// Show message function (same as in scripts.js)
function showMessage(message, type = 'info') {
  const toast = document.createElement('div');
  toast.className = `alert alert-${type} alert-dismissible fade show position-fixed`;
  toast.style.cssText = 'top: 20px; right: 20px; z-index: 9999; min-width: 300px;';
  toast.innerHTML = `
    ${message}
    <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
  `;
  document.body.appendChild(toast);

  setTimeout(() => {
    toast.remove();
  }, 5000);
}

// File upload handling (for future use)
async function handleFileUpload(file) {
  try {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch('/api/admin/uploads/', {
      method: 'POST',
      body: formData
    });

    if (response.ok) {
      const result = await response.json();
      return result.url;
    } else {
      throw new Error('Upload failed');
    }
  } catch (error) {
    console.error('Upload error:', error);
    throw error;
  }
}

// Initialize admin page
document.addEventListener('DOMContentLoaded', function() {
  console.log('Admin page loaded');

  // Load existing products
  loadProducts();

  // Attach form handler
  const form = document.getElementById('createProductForm');
  if (form) {
    form.addEventListener('submit', createProduct);
  }

  // Add input validation
  const priceInput = document.getElementById('price');
  if (priceInput) {
    priceInput.addEventListener('input', function() {
      const value = parseFloat(this.value);
      if (isNaN(value) || value < 0) {
        this.setCustomValidity('Please enter a valid positive number');
      } else {
        this.setCustomValidity('');
      }
    });
  }

  // Add character limit indicators
  const nameInput = document.getElementById('name');
  const descInput = document.getElementById('description');

  if (nameInput) {
    nameInput.addEventListener('input', function() {
      if (this.value.length > 255) {
        this.value = this.value.substring(0, 255);
      }
    });
  }

  if (descInput) {
    descInput.addEventListener('input', function() {
      if (this.value.length > 1000) {
        this.value = this.value.substring(0, 1000);
      }
    });
  }
});

// Make deleteProduct available globally
window.deleteProduct = deleteProduct;

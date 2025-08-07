// Admin functionality for product management

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
            <p class="mb-1">Price: $${product.list_price}</p>
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

// Create new product
async function createProduct(event) {
  event.preventDefault();

  const name = document.getElementById('name').value;
  const price = document.getElementById('price').value;
  const description = document.getElementById('description').value;

  try {
    const productData = {
      product_name: name,
      product_code: `PROD-${Date.now()}`,
      list_price: parseFloat(price),
      description: description,
      category_id: 1,
      discount_percent: 0.0
    };

    const response = await fetch('/api/admin/products/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(productData)
    });

    if (response.ok) {
      alert('Product created successfully!');
      document.getElementById('createProductForm').reset();
      loadProducts();
    } else {
      const error = await response.json();
      alert('Failed to create product: ' + (error.detail || 'Unknown error'));
    }
  } catch (error) {
    console.error('Error creating product:', error);
    alert('Failed to create product: Network error');
  }
}

// Delete product
async function deleteProduct(productId) {
  if (!confirm('Are you sure you want to delete this product?')) {
    return;
  }

  try {
    const response = await fetch(`/api/admin/products/${productId}`, {
      method: 'DELETE'
    });

    if (response.ok) {
      alert('Product deleted successfully!');
      loadProducts();
    } else {
      const error = await response.json();
      alert('Failed to delete product: ' + (error.detail || 'Unknown error'));
    }
  } catch (error) {
    console.error('Error deleting product:', error);
    alert('Failed to delete product: Network error');
  }
}

// Initialize admin page
document.addEventListener('DOMContentLoaded', function() {
  loadProducts();

  const form = document.getElementById('createProductForm');
  if (form) {
    form.addEventListener('submit', createProduct);
  }
});

window.deleteProduct = deleteProduct;

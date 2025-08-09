// bff/frontend/js/admin.js - Admin panel JavaScript
const ADMIN_API = '/api/admin';
document.addEventListener('DOMContentLoaded', function() {
    loadProducts();
    loadCategories();

    // Initialize form handlers
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
        }
    } catch (error) {
        console.error('Error loading products:', error);
    }
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

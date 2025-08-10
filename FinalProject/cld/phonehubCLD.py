"""
Accessory Shop CLI Tool
A command-line interface for managing the PhoneHub accessory shop microservices
"""

import click
import requests
import json
import os
import sys
from typing import Optional, Dict, Any
from datetime import datetime
import tabulate


class APIClient:
  """Base API client for making requests to microservices"""

  def __init__(self, base_url: str = "http://localhost"):
    self.base_url = base_url
    self.session = requests.Session()

  def get(self, endpoint: str, **kwargs) -> requests.Response:
    return self.session.get(f"{self.base_url}{endpoint}", **kwargs)

  def post(self, endpoint: str, **kwargs) -> requests.Response:
    return self.session.post(f"{self.base_url}{endpoint}", **kwargs)

  def put(self, endpoint: str, **kwargs) -> requests.Response:
    return self.session.put(f"{self.base_url}{endpoint}", **kwargs)

  def delete(self, endpoint: str, **kwargs) -> requests.Response:
    return self.session.delete(f"{self.base_url}{endpoint}", **kwargs)


class AccessoryShopCLI:
  """Main CLI class for the accessory shop"""

  def __init__(self):
    self.auth_client = APIClient("http://localhost:8002")
    self.customer_client = APIClient("http://localhost:8003")
    self.cart_client = APIClient("http://localhost:8004")
    self.products_client = APIClient("http://localhost:8005")
    self.wishlist_client = APIClient("http://localhost:8006")
    self.order_client = APIClient("http://localhost:8007")
    self.admin_client = APIClient("http://localhost:8001")
    self.bff_client = APIClient("http://localhost:4000")

    # Session management
    self.session_token = None
    self.customer_id = None


cli = AccessoryShopCLI()


@click.group()
@click.option('--debug', is_flag=True, help='Enable debug mode')
def main(debug):
  """PhoneHub Accessory Shop CLI Tool"""
  if debug:
    click.echo("Debug mode enabled")


# Health Check Commands
@main.group()
def health():
  """Check health of all services"""
  pass


@health.command()
def all():
  """Check health of all services"""
  services = {
    "Auth Service": "http://localhost:8002/health",
    "Customer Service": "http://localhost:8003/health",
    "Cart Service": "http://localhost:8004/health",
    "Products Service": "http://localhost:8005/health",
    "Wishlist Service": "http://localhost:8006/health",
    "Order Service": "http://localhost:8007/health",
    "Admin Service": "http://localhost:8001/health",
    "BFF": "http://localhost:4000/health",
    "FastAPI Main": "http://localhost:8000/health"
  }

  results = []
  for name, url in services.items():
    try:
      response = requests.get(url, timeout=5)
      status = "✅ Healthy" if response.status_code == 200 else f"❌ Error ({response.status_code})"
    except requests.exceptions.RequestException:
      status = "❌ Unreachable"

    results.append([name, status])

  click.echo(tabulate.tabulate(results, headers=["Service", "Status"], tablefmt="grid"))


# Authentication Commands
@main.group()
def auth():
  """Authentication commands"""
  pass


@auth.command()
@click.option('--email', prompt=True, help='User email')
@click.option('--password', prompt=True, hide_input=True, help='User password')
def login(email, password):
  """Login to the system"""
  try:
    response = cli.auth_client.post("/auth/login", json={
      "email": email,
      "password": password
    })

    if response.status_code == 200:
      data = response.json()
      cli.session_token = data.get("session_token")
      cli.customer_id = data.get("customer_id")
      click.echo(f"✅ Login successful! Customer ID: {cli.customer_id}")
    else:
      click.echo(f"❌ Login failed: {response.json().get('detail', 'Unknown error')}")
  except requests.exceptions.RequestException as e:
    click.echo(f"❌ Connection error: {e}")


@auth.command()
@click.option('--email', prompt=True, help='User email')
@click.option('--password', prompt=True, hide_input=True, confirmation_prompt=True, help='User password')
@click.option('--first-name', prompt=True, help='First name')
@click.option('--last-name', prompt=True, help='Last name')
def register(email, password, first_name, last_name):
  """Register a new user"""
  try:
    response = cli.auth_client.post("/auth/register", json={
      "email_address": email,
      "password": password,
      "first_name": first_name,
      "last_name": last_name
    })

    if response.status_code == 200:
      click.echo("✅ Registration successful!")
    else:
      click.echo(f"❌ Registration failed: {response.json().get('detail', 'Unknown error')}")
  except requests.exceptions.RequestException as e:
    click.echo(f"❌ Connection error: {e}")


@auth.command()
def logout():
  """Logout from the system"""
  try:
    response = cli.auth_client.post("/auth/logout")
    if response.status_code == 200:
      cli.session_token = None
      cli.customer_id = None
      click.echo("✅ Logout successful!")
    else:
      click.echo("❌ Logout failed")
  except requests.exceptions.RequestException as e:
    click.echo(f"❌ Connection error: {e}")


# Product Commands
@main.group()
def products():
  """Product management commands"""
  pass


@products.command()
def list():
  """List all products"""
  try:
    response = cli.products_client.get("/products/")
    if response.status_code == 200:
      products_data = response.json()
      if not products_data:
        click.echo("No products found.")
        return

      # Format product data for display
      table_data = []
      for product in products_data:
        table_data.append([
          product.get('product_id', ''),
          product.get('product_code', ''),
          product.get('product_name', '')[:40] + ('...' if len(product.get('product_name', '')) > 40 else ''),
          f"${product.get('list_price', 0):.2f}",
          f"{product.get('discount_percent', 0)}%",
          product.get('category', {}).get('category_name', 'N/A')
        ])

      headers = ['ID', 'Code', 'Name', 'Price', 'Discount', 'Category']
      click.echo(tabulate.tabulate(table_data, headers=headers, tablefmt="grid"))
    else:
      click.echo(f"❌ Failed to fetch products: {response.status_code}")
  except requests.exceptions.RequestException as e:
    click.echo(f"❌ Connection error: {e}")


@products.command()
@click.argument('product_id', type=int)
def get(product_id):
  """Get details of a specific product"""
  try:
    response = cli.products_client.get(f"/products/{product_id}")
    if response.status_code == 200:
      product = response.json()
      click.echo(f"""
Product Details:
================
ID: {product.get('product_id')}
Code: {product.get('product_code')}
Name: {product.get('product_name')}
Description: {product.get('description')}
Price: ${product.get('list_price', 0):.2f}
Discount: {product.get('discount_percent', 0)}%
Category: {product.get('category', {}).get('category_name', 'N/A')}
Date Added: {product.get('date_added')}
Image URL: {product.get('image_url', 'N/A')}
""")
    else:
      click.echo(f"❌ Product not found: {response.json().get('detail', 'Unknown error')}")
  except requests.exceptions.RequestException as e:
    click.echo(f"❌ Connection error: {e}")


@products.command()
def categories():
  """List all product categories"""
  try:
    response = cli.products_client.get("/categories/")
    if response.status_code == 200:
      categories = response.json()
      table_data = [[cat['category_id'], cat['category_name']] for cat in categories]
      click.echo(tabulate.tabulate(table_data, headers=['ID', 'Category Name'], tablefmt="grid"))
    else:
      click.echo(f"❌ Failed to fetch categories: {response.status_code}")
  except requests.exceptions.RequestException as e:
    click.echo(f"❌ Connection error: {e}")


# Customer Commands
@main.group()
def customers():
  """Customer management commands"""
  pass


@customers.command()
def list():
  """List all customers"""
  try:
    response = cli.customer_client.get("/customers/")
    if response.status_code == 200:
      customers_data = response.json()
      table_data = []
      for customer in customers_data:
        table_data.append([
          customer.get('customer_id'),
          customer.get('email_address'),
          customer.get('first_name'),
          customer.get('last_name')
        ])

      headers = ['ID', 'Email', 'First Name', 'Last Name']
      click.echo(tabulate.tabulate(table_data, headers=headers, tablefmt="grid"))
    else:
      click.echo(f"❌ Failed to fetch customers: {response.status_code}")
  except requests.exceptions.RequestException as e:
    click.echo(f"❌ Connection error: {e}")


@customers.command()
@click.argument('customer_id', type=int)
def get(customer_id):
  """Get details of a specific customer"""
  try:
    response = cli.customer_client.get(f"/customers/{customer_id}")
    if response.status_code == 200:
      customer = response.json()
      click.echo(f"""
Customer Details:
=================
ID: {customer.get('customer_id')}
Email: {customer.get('email_address')}
First Name: {customer.get('first_name')}
Last Name: {customer.get('last_name')}
""")
    else:
      click.echo(f"❌ Customer not found: {response.json().get('detail', 'Unknown error')}")
  except requests.exceptions.RequestException as e:
    click.echo(f"❌ Connection error: {e}")


# Admin Commands
@main.group()
def admin():
  """Admin commands for product management"""
  pass


@admin.command()
@click.option('--name', prompt=True, help='Product name')
@click.option('--price', prompt=True, type=float, help='Product price')
@click.option('--category-id', prompt=True, type=int, help='Category ID')
@click.option('--description', default='', help='Product description')
@click.option('--discount', default=0.0, type=float, help='Discount percentage')
def create_product(name, price, category_id, description, discount):
  """Create a new product via admin service"""
  try:
    response = cli.admin_client.post("/admin/products/", json={
      "product_name": name,
      "list_price": price,
      "category_id": category_id,
      "description": description,
      "discount_percent": discount
    })

    if response.status_code == 201:
      product = response.json()
      click.echo(f"✅ Product created successfully! ID: {product.get('product_id')}")
    else:
      click.echo(f"❌ Failed to create product: {response.json().get('detail', 'Unknown error')}")
  except requests.exceptions.RequestException as e:
    click.echo(f"❌ Connection error: {e}")


@admin.command()
@click.argument('product_id', type=int)
def delete_product(product_id):
  """Delete a product via admin service"""
  if click.confirm(f'Are you sure you want to delete product {product_id}?'):
    try:
      response = cli.admin_client.delete(f"/admin/products/{product_id}")
      if response.status_code == 200:
        click.echo("✅ Product deleted successfully!")
      else:
        click.echo(f"❌ Failed to delete product: {response.status_code}")
    except requests.exceptions.RequestException as e:
      click.echo(f"❌ Connection error: {e}")


# Order Commands
@main.group()
def orders():
  """Order management commands"""
  pass


@orders.command()
@click.option('--customer-id', type=int, help='Filter by customer ID')
def list(customer_id):
  """List orders"""
  try:
    params = {}
    if customer_id:
      params['customer_id'] = customer_id

    response = cli.order_client.get("/orders/", params=params)
    if response.status_code == 200:
      orders_data = response.json()
      if not orders_data:
        click.echo("No orders found.")
        return

      table_data = []
      for order in orders_data:
        total = sum(item['item_price'] * item['quantity'] for item in order.get('items', []))
        table_data.append([
          order.get('order_id'),
          order.get('customer_id'),
          order.get('order_date', '')[:10],  # Just date part
          len(order.get('items', [])),
          f"${total:.2f}"
        ])

      headers = ['Order ID', 'Customer ID', 'Date', 'Items', 'Total']
      click.echo(tabulate.tabulate(table_data, headers=headers, tablefmt="grid"))
    else:
      click.echo(f"❌ Failed to fetch orders: {response.status_code}")
  except requests.exceptions.RequestException as e:
    click.echo(f"❌ Connection error: {e}")


@orders.command()
@click.argument('order_id', type=int)
def get(order_id):
  """Get details of a specific order"""
  try:
    response = cli.order_client.get(f"/orders/{order_id}")
    if response.status_code == 200:
      order = response.json()
      click.echo(f"""
Order Details:
==============
Order ID: {order.get('order_id')}
Customer ID: {order.get('customer_id')}
Order Date: {order.get('order_date')}
Shipping: ${order.get('ship_amount', 0):.2f}
Tax: ${order.get('tax_amount', 0):.2f}
""")

      if order.get('items'):
        click.echo("\nOrder Items:")
        click.echo("============")
        table_data = []
        for item in order['items']:
          table_data.append([
            item.get('product_id'),
            item.get('quantity'),
            f"${item.get('item_price', 0):.2f}",
            f"${item.get('item_price', 0) * item.get('quantity', 0):.2f}"
          ])

        headers = ['Product ID', 'Quantity', 'Unit Price', 'Total']
        click.echo(tabulate.tabulate(table_data, headers=headers, tablefmt="grid"))
    else:
      click.echo(f"❌ Order not found: {response.json().get('detail', 'Unknown error')}")
  except requests.exceptions.RequestException as e:
    click.echo(f"❌ Connection error: {e}")


# Database Commands
@main.group()
def db():
  """Database utility commands"""
  pass


@db.command()
def seed():
  """Seed database with sample data (if available)"""
  click.echo("Database seeding functionality would be implemented here")
  click.echo("This would populate the database with sample products, customers, etc.")


# Utility Commands
@main.command()
def status():
  """Show current session status"""
  if cli.session_token and cli.customer_id:
    click.echo(f"✅ Logged in as Customer ID: {cli.customer_id}")
  else:
    click.echo("❌ Not logged in")


@main.command()
def version():
  """Show CLI version"""
  click.echo("PhoneHub Accessory Shop CLI v1.0.0")


if __name__ == '__main__':
  main()

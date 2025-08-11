from fastapi import FastAPI, Query
from models import ProductUpdate, CustomerUpdate, AddressUpdate, OrderItemUpdate
from database import connect

app = FastAPI()

# GET routes
@app.get("/")
def read_root():
    return {"message": "Welcome to Guitar Shop API!"}

@app.get("/products/")
def get_all_products():
    conn = connect()
    cursor = conn.cursor(dictionary=True)
    cursor.execute("SELECT * FROM Products")
    return cursor.fetchall()

@app.get("/products/filter/")
def filter_products(min_price: float = Query(0), max_price: float = Query(5000)):
    conn = connect()
    cursor = conn.cursor(dictionary=True)
    cursor.execute("SELECT * FROM Products WHERE list_price BETWEEN %s AND %s", (min_price, max_price))
    return cursor.fetchall()

@app.get("/customers/")
def get_customers():
    conn = connect()
    cursor = conn.cursor(dictionary=True)
    cursor.execute("SELECT * FROM Customers")
    return cursor.fetchall()

@app.get("/orders/")
def get_order_items():
    conn = connect()
    cursor = conn.cursor(dictionary=True)
    cursor.execute("SELECT * FROM Order_Items")
    return cursor.fetchall()

@app.get("/addresses/")
def get_addresses(state: str = Query(None)):
    conn = connect()
    cursor = conn.cursor(dictionary=True)
    if state:
        cursor.execute("SELECT * FROM Addresses WHERE state = %s", (state,))
    else:
        cursor.execute("SELECT * FROM Addresses")
    return cursor.fetchall()

# PUT routes
@app.put("/products/update/")
def update_discount(data: ProductUpdate):
    conn = connect()
    cursor = conn.cursor()
    cursor.execute("UPDATE Products SET discount_percent = %s WHERE product_id = %s", (data.discount_percent, data.product_id))
    conn.commit()
    return {"status": "updated"}

@app.put("/customers/update/")
def update_customer(data: CustomerUpdate):
    conn = connect()
    cursor = conn.cursor()
    cursor.execute("UPDATE Customers SET first_name = %s, last_name = %s WHERE customer_id = %s",
                   (data.first_name, data.last_name, data.customer_id))
    conn.commit()
    return {"status": "updated"}

@app.put("/addresses/update/")
def update_address(data: AddressUpdate):
    conn = connect()
    cursor = conn.cursor()
    cursor.execute("UPDATE Addresses SET zip_code = %s WHERE address_id = %s",
                   (data.zip_code, data.address_id))
    conn.commit()
    return {"status": "updated"}

@app.put("/orders/update/")
def update_order_quantity(data: OrderItemUpdate):
    conn = connect()
    cursor = conn.cursor()
    cursor.execute("UPDATE Order_Items SET quantity = %s WHERE item_id = %s",
                   (data.quantity, data.item_id))
    conn.commit()
    return {"status": "updated"}

@app.put("/products/update_name/")
def update_product_name(product_id: int = Query(...), name: str = Query(...)):
    conn = connect()
    cursor = conn.cursor()
    cursor.execute("UPDATE Products SET product_name = %s WHERE product_id = %s", (name, product_id))
    conn.commit()
    return {"status": "updated"}

import mysql.connector
def connect_to_db():
    try:
        mydb = mysql.connector.connect(
            host="localhost",
            user="root",
            password="",
            database="my_guitar_shop"
        )
        print("Successfully connected to MySQL database!")

    except mysql.connector.Error as err:
        print(f"Error connecting to MySQL: {err}")

    return mydb

def get_products(mycursor):
    sql_query = """SELECT product_code, product_name, list_price, discount_percent
                   FROM products
                   ORDER BY list_price DESC;"""
    mycursor.execute(sql_query)
    return mycursor.fetchall()

def query_products(mycursor):
    results = get_products(mycursor)
    for row in results:
      print(f"code: {row[0]}, name: {row[1]}, price: ${row[2]}, discount: {row[3]}%")
    print('\n')

def get_customers(mycursor):
  sql_query = """SELECT first_name, last_name, CONCAT(last_name, ", ", first_name) AS full_name
                 FROM customers
                 WHERE last_name >= 'M'
                 ORDER BY last_name ASC;"""
  mycursor.execute(sql_query)
  return mycursor.fetchall()

def query_customers(mycursor):
  results = get_customers(mycursor)
  for row in results:
    print(f"first_name: {row[0]}, last_name: {row[1]}, full_name: {row[2]}")
  print('\n')

def get_prices(mycursor):
  sql_query = """SELECT product_name, list_price, date_added
                 FROM products
                 WHERE list_price > 500 AND list_price < 2000
                 ORDER BY date_added DESC;"""
  mycursor.execute(sql_query)
  return mycursor.fetchall()

def query_prices(mycursor):
  results = get_prices(mycursor)
  for row in results:
    print(f"product_name: {row[0]}, price: {row[1]}, date_added: {row[2]}")
  print('\n')

def get_discounts(mycursor):
  sql_query = """SELECT item_id, item_price, discount_amount, quantity, item_price * quantity AS price_total, discount_amount * quantity AS discount_total, (item_price - discount_amount) * quantity AS item_total
                 FROM order_items
                 WHERE ((item_price - discount_amount) * quantity)  > 500
                 ORDER BY item_total DESC;"""
  mycursor.execute(sql_query)
  return mycursor.fetchall()

def query_discounts(mycursor):
  results = get_discounts(mycursor)
  for row in results:
    print(f"item_id: {row[0]}, item_price: ${row[1]}, discount_amount: ${row[2]}, quantity: {row[3]}, price_total: ${row[4]}, discount_total: ${row[5]}, item_total: ${row[6]}")
  print('\n')

def get_products_join(mycursor):
  sql_query = """SELECT c.category_name, p.product_name, p.list_price
                 FROM Products p
                 JOIN categories c ON p.category_id = c.category_id
                 ORDER BY c.category_name ASC, p.product_name ASC;"""
  mycursor.execute(sql_query)
  return mycursor.fetchall()

def join_products(mycursor):
  results = get_products_join(mycursor)
  for row in results:
    print(f"category_name: {row[0]}, product_name: {row[1]}, list_price: ${row[2]}")
  print('\n')

def get_customers_join(mycursor):
  sql_query = """SELECT c.first_name, c.last_name, a.line1, a.city, a.state, a.zip_code
                 FROM customers c
                 JOIN addresses a ON c.customer_id = a.customer_id
                 WHERE c.email_address = 'allan.sherwood@yahoo.com'
                 ORDER BY a.zip_code ASC;"""
  mycursor.execute(sql_query)
  return mycursor.fetchall()

def join_customers(mycursor):
  results = get_customers_join(mycursor)
  for row in results:
    print(f"first_name: {row[0]}, last_name: {row[1]}, line1: {row[2]}, city: {row[3]}, state: {row[4]}, zip_code: {row[5]}")
  print('\n')

def get_address(mycursor):
  sql_query = """SELECT c.first_name, c.last_name, a.line1, a.city, a.state, a.zip_code
                 FROM customers c
                 JOIN addresses a ON c.customer_id = a.customer_id
                 WHERE c.shipping_address_id = a.address_id
                 ORDER BY a.zip_code ASC;"""
  mycursor.execute(sql_query)
  return mycursor.fetchall()

def query_address(mycursor):
  results = get_address(mycursor)
  for row in results:
    print(f"first_name: {row[0]}, last_name: {row[1]}, line1: {row[2]}, city: {row[3]}, state: {row[4]}, zip_code: {row[5]}")
  print('\n')

def main():
    mydb = connect_to_db()
    try:
      mycursor = mydb.cursor()
      query_products(mycursor)
      query_customers(mycursor)
      query_prices(mycursor)
      query_discounts(mycursor)
      join_products(mycursor)
      join_customers(mycursor)
      query_address(mycursor)

    except mysql.connector.Error as err:
        print(f"Error: {err}")

    finally:
        if mydb.is_connected():
            mydb.close()
        print("MySQL connection closed.")

if __name__ == "__main__":
    main()


Each query in main.py has two functions, 
a get function to take the query from the database and returns it
a printer function to call the get function and print the results in the correct format

# defines the function with the mycursor parameter
def get_products(mycursor):
    # the sql query that is to be sent to the databse
    sql_query = """SELECT product_code, product_name, list_price, discount_percent
                   FROM products
                   ORDER BY list_price DESC;"""
    # exectues the sql query on the database
    mycursor.execute(sql_query)
    # fetches and returns the data resulting from the sql query
    return mycursor.fetchall()

# defines the function with the mycursor parameter
def query_products(mycursor):
    # calls the getter function for the sql query and saves it to a variable
    results = get_products(mycursor)
    # takes the results and prints it out in a readable format
    for row in results:
      print(f"code: {row[0]}, name: {row[1]}, price: ${row[2]}, discount: {row[3]}%")
    # prints a new line to keep the output readable when printing multiple queries
    print('\n')

test.py has a unittest for each sql query, using this format, 

# defines the function with the paramater self to be used for assertations 
def test_get_customers(self):
   # creates a mock cursor to call the functions
   mock_cursor = Mock()
   # the data that should be returned by the function
   expected_data = [('Allan', 'Sherwood', 'Sherwood, Allan'),
                    ('Erin', 'Valentino', 'Valentino, Erin'),
                    ('Frank Lee', 'Wilson', 'Wilson, Frank Lee'),
                    ('Barry', 'Zimmer', 'Zimmer, Barry')]
  # this is simulating the data fetch and tellng mock_cursor what to return when fetchall() is called
  mock_cursor.fetchall.return_value = expected_data
  # sets result equal to what the function in main returns
  result = get_customers(mock_cursor)
  # asserts if the result of the function is equal to expected data
  self.assertEqual(result, expected_data)


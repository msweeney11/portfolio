<pre>
MICHAEL SWEENEY & MICHAEL HANNA 

We have designed a clean looking storefront for phone accessories, features include a products page, a working shopping cart, wishlist, orders and order tracking, as well as an admin dashboard for uploading products to the containerized database

LIST OF CONTAINERS
- Auth Service
- Customer Service
- Cart Service
- Products Service
- Wishlist Service
- Order Service
- Admin Service
- MySQL Database
- BFF
- FastAPI

Aside from MySQL, each service has its own directory in the FinalProject folder, following a rough outline of 

service-name/
├── models/ Contains data models, defining how they will map to the database
├── routers/ Holds route handlers, organizes endpoints
├── schemas/ Defines pydantic models for requests/response validation
├── .env Stores environmetal variables and keeps sensitive data out of code
├── __init__.py Marks directory as python package
├── Dockerfile Defines how to containerize the service
├── main.py Entry point of the service, sets up the FastAPI, routes, and middleware
└── requirements.txt List of needed python dependencies required, is ran automatically by our Dockerfile

bff/
├── frontend/ Contains HTML pages, styles, scripts, and static assets
│   ├── assets/ Stores images, fonts, and other static resources
│   ├── css/ Contains CSS files for styling the UI
│   ├── js/ Contains frontend JavaScript logic
│   ├── admin.html Admin interface page
│   ├── admin-dashboard.html Dashboard for admin users
│   ├── api.js Handles frontend API calls to backend
│   ├── cart.html Shopping cart page
│   ├── checkout.html Checkout flow page
│   ├── create-account.html Account creation page
│   ├── index.html Homepage
│   ├── login.html Login page
│   ├── orders.html Displays user orders
│   ├── product-detail.html Product info page
│   ├── profile.html User profile page
│   ├── register.html Registration page
│   └── wishlist.html Wishlist page
├── middleware/ Contains Express middleware for auth, logging, etc.
├── node_modules/ Auto-generated folder with installed npm packages
├── routes/ Defines Express route handlers for backend endpoints
├── services/ Encapsulates business logic and external API calls
├── uploads/ Stores user-uploaded files like images or documents
├── Dockerfile Defines how to containerize the service
├── index.js Entry point of the backend; sets up Express app and routes
├── package.json Declares project metadata, dependencies, and scripts
└── package-lock.json Locks exact versions of dependencies for consistency


(Assuming you already have Pycharm, Docker, etc all set up)

INSTALLATION GUIDE: 

- Clone the repository in Pycharm

- Open up file navigator and navigative into the FinalProject Folder

- Type the command "docker compose up --build"

- You should see docker start to work its magic and initialize the site

- It will be done once you see all the services send "Application startup complete."

- Open your browser of choice and go to "localhost:4000" 

- From there you will be on our products page, index.html, clicking on most of the other pages will result in you being redirected to login


COMMAND LINE DRIVER

The CLI communicates with the following microservices:

Auth Service (port 8002): Authentication and session management
Customer Service (port 8003): Customer data management
Cart Service (port 8004): Shopping cart operations
Products Service (port 8005): Product catalog management
Wishlist Service (port 8006): Customer wishlist functionality
Order Service (port 8007): Order processing and management
Admin Service (port 8001): Administrative operations
BFF (Backend for Frontend) (port 4000): API gateway
FastAPI Main (port 8000): Main application service

INSTALLATION:
- Navigate to the cld folder located in FinalProject
- run the command "pip install -r requirements.txt"
- from there you may run any of our commands listed below

USAGE:
(py if on windows, python if on mac)
- python phonehubCLD.py [COMMAND] [OPTIONS]
COMMANDS:

  Global Options:
    --debug: Enable debug mode for detailed output

  Health Check Commands:
    health all
      Checks the health status of all microservices and displays a status table
      EX: python phonehubCLD.py health all

  Authentication Commands:
    auth login
      Authenticates a user and establishes a session
      EX: python phonehubCLD.py auth login --email user@example.com --password mypassword

    auth register
      Creates a new user account in the database
      EX: python phonehubCLD.py auth register --email user@example.com --password mypassword --first-name John --last-name Doe

    auth logout
      Terminates the current user session
      EX: python phonehubCLD.py auth logout

  Product Management Commands:
    products list
      Displays all available products in a formatted table
      EX: python phonehubCLD.py products list

    products get <product_id>
      Retrieves detailed information about a specific product
      EX: python phonehubCLD.py products get 123

    products categories
      Lists all available product categories
      EX: python phonehubCLD.py products categories

  Customer Management Commands:
    customers list
      Shows all customers in the system
      EX: python phonehubCLD.py customers list

    customers get <customer_id>
      Retrieves detailed information about a specific customer
      EX: python phonehubCLD.py customers get 456

  Administrative Commands:
    admin create-product
      Creates a new product through the admin service
      EX: python phonehubCLD.py admin create-product --name "iPhone Case" --price 29.99 --category-id 1 --description "Protective case" --discount 10.0

    admin delete-product <product_id>
      Removes a product from the catalog
      EX: python phonehubCLD.py admin delete-product 123

  Order Management Commands:
    orders list
      Displays all orders in the system with optional customer filtering
      EX: python phonehubCLD.py orders list
          python phonehubCLD.py orders list --customer-id 456

    orders get <order_id>
      Retrieves comprehensive details about a specific order
      EX: python phonehubCLD.py orders get 789

  Database Utility Commands:
    db seed
      Placeholder for database seeding functionality
      EX: python phonehubCLD.py db seed

  Utility Commands:
    status
      Shows current session and authentication status
      EX: python phonehubCLD.py status

    version
      Displays the CLI tool version
      EX: python phonehubCLD.py version
</pre>




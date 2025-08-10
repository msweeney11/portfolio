import time
from sqlalchemy.exc import OperationalError

# Initializes database tables with retry logic for MySQL connection
# Waits for MySQL to be ready before creating tables, handles container startup timing
# Continues retrying every 2 seconds until database connection is established
def setup_database():
    from models.database import Base, engine
    from models.customers import Customer

    while True:
        try:
            Base.metadata.create_all(bind=engine)
            print("Database setup complete")
            break
        except OperationalError:
            print("Waiting for MySQL to be ready...")
            time.sleep(2)

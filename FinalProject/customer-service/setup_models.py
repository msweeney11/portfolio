import time
from sqlalchemy.exc import OperationalError

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

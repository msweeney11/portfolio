import mysql.connector

def connect():
    return mysql.connector.connect(
        host='localhost',
        user='root',
        password='pass',
        database='my_guitar_shop'
    )

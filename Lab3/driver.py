import requests

BASE = "http://127.0.0.1:8000"

print("1:", requests.get(BASE + "/").json())
print("2:", requests.get(BASE + "/greet?name=Michael").json())
print("3:", requests.get(BASE + "/square/9").json())

profile = {"name": "Michael", "age": 21}
print("4:", requests.put(BASE + "/user/42", json=profile).json())

print("5:", requests.get(BASE + "/search?keyword=book&page=2").json())

item = {"name": "Keyboard", "description": "Mechanical"}
print("6:", requests.put(BASE + "/item/1001", json=item).json())

print("7:", requests.get(BASE + "/status/400").json())
print("8:", requests.get(BASE + "/convert?c=20").json())
print("9:", requests.put(BASE + "/profile/msweeney", json=profile).json())
print("10:", requests.get(BASE + "/echo?q=hello").json())
print("11:", requests.get(BASE + "/multiply/8/7").json())

print("12:", requests.put(BASE + "/reset-password/123", json={"password": "newpass"}).json())

print("13:", requests.get(BASE + "/divide?x=10&y=2").json())
print("14:", requests.put(BASE + "/settings", json={"theme": "dark", "notifications": True}).json())
print("15:", requests.get(BASE + "/ping").json())

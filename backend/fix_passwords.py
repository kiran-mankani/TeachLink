from werkzeug.security import generate_password_hash
from pymongo import MongoClient

# MongoDB se connect karo
client = MongoClient('mongodb://localhost:27017/')
db = client['Teachlink']

# Sab ka password 123456789 rakhenge
NEW_PASSWORD = '123456789'

print("🔧 Passwords ko bcrypt mein convert kar rahe hain...")
print("=" * 50)

# Naya bcrypt hash banao
hashed = generate_password_hash(NEW_PASSWORD)
if isinstance(hashed, bytes):
    hashed = hashed.decode('utf-8')

print(f"✅ Naya hash generate ho gaya")

# Saare users ka password update karo
result = db.users_collection.update_many(
    {},  # Empty = ALL users
    {'$set': {'password': hashed}}
)

print(f"✅ {result.modified_count} users ka password update ho gaya")
print(f"📌 Naya password sab ka: {NEW_PASSWORD}")
print("=" * 50)

# Sab users dikhao
print("\n📋 Saare users:")
users = db.users_collection.find({}, {'email': 1, 'name': 1, 'role': 1})
for u in users:
    print(f"   📧 {u.get('email')} ({u.get('role')})")

print("\n" + "=" * 50)
print("🎉 HO GAYA! Ab login karo:")
print(f"   Password: {NEW_PASSWORD}")
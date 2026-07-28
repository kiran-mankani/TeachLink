from datetime import datetime
from config.database import users_collection
import bcrypt

# 🔥 YE CLASS ZAROORI HAI - User class define karna
class User:
    @staticmethod
    def create_user(user_data):
        # Password hash karein
        hashed_password = bcrypt.hashpw(user_data['password'].encode('utf-8'), bcrypt.gensalt())
        
        user_doc = {
            'fullName': user_data['fullName'],
            'email': user_data['email'],
            'password': hashed_password.decode('utf-8'),
            'role': user_data['role'],  # student, teacher, admin
            'location': user_data.get('location', ''),
            'created_at': datetime.utcnow()
        }
        
        # Database mein insert karein
        result = users_collection.insert_one(user_doc)
        return str(result.inserted_id)

    @staticmethod
    def find_by_email(email):
        """Email ke through user dhoondhein"""
        return users_collection.find_one({'email': email})

    @staticmethod
    def verify_password(input_password, stored_password):
        """Password verify karein"""
        return bcrypt.checkpw(input_password.encode('utf-8'), stored_password.encode('utf-8'))
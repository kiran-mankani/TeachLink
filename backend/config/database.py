from pymongo import MongoClient
import os

# MongoDB Connection - localhost use kar rahe hain
MONGO_URI = 'mongodb://localhost:27017/'
DB_NAME = 'Teachlink'

try:
    # Connect to MongoDB
    client = MongoClient(MONGO_URI, serverSelectionTimeoutMS=5000)
    
    # Test connection
    client.admin.command('ping')
    print(f"✅ MongoDB Connected successfully! Database: {DB_NAME}")
    
    # Get database
    db = client[DB_NAME]
    
    # Collections
    users_collection = db['users']
    student_profiles = db['student_profiles']
    teacher_profiles = db['teacher_profiles']
    requests_collection = db['requests']
    sessions_collection = db['sessions']
    messages_collection = db['messages']
    reviews_collection = db['reviews']
    payments_collection = db['payments']
    notifications_collection = db['notifications']
    enrollment_requests = db['enrollment_requests']
    connections_collection = db['connections']
    matches_collection = db['matches']
    attendance_collection = db['attendance']
    
    # Create indexes for faster queries
    users_collection.create_index('email', unique=True)
    student_profiles.create_index('user_id', unique=True)
    teacher_profiles.create_index('user_id', unique=True)
    enrollment_requests.create_index([('student_id', 1), ('teacher_id', 1)])
    connections_collection.create_index([('teacher_id', 1), ('student_id', 1)], unique=True)
    
except Exception as e:
    print(f"❌ MongoDB Connection Error: {e}")
    print("🔄 Make sure MongoDB is running with: mongod")
    # Don't crash, but warn
    db = None
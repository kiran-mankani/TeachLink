from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
from werkzeug.security import generate_password_hash, check_password_hash
from bson import ObjectId
from datetime import datetime
from config.database import db

auth_bp = Blueprint('auth', __name__)


@auth_bp.route('/register/student', methods=['POST'])
def register_student():
    try:
        data = request.json
        print(f"📥 Student Registration Data: {data}")
        
        email = data.get('email', '').strip().lower()
        password = data.get('password', '')
        fullName = data.get('fullName', '').strip()
        phone = data.get('phone', '').strip()
        
        if not email or not password or not fullName:
            return jsonify({'error': 'Email, password, and full name are required'}), 400
        
        existing_user = db.users_collection.find_one({'email': email})
        if existing_user:
            return jsonify({'error': 'User with this email already exists'}), 400
        
        hashed_password = generate_password_hash(password)
        
        # ✅ Ensure it's a string
        if isinstance(hashed_password, bytes):
            hashed_password = hashed_password.decode('utf-8')
        
        user_data = {
            'email': email,
            'password': hashed_password,
            'name': fullName,
            'phone': phone,
            'role': 'student',
            'is_active': True,
            'created_at': datetime.utcnow(),
            'updated_at': datetime.utcnow()
        }
        
        result = db.users_collection.insert_one(user_data)
        user_id = str(result.inserted_id)
        
        student_profile = {
            'user_id': ObjectId(user_id),
            '_user_id': ObjectId(user_id),
            '_name': fullName,
            'name': fullName,
            '_phone': phone,
            'phone': phone,
            '_subjects': [],
            'subjects': [],
            '_isProfileComplete': False,
            'isProfileComplete': False,
            '_created_at': datetime.utcnow(),
            'created_at': datetime.utcnow()
        }
        
        db.student_profiles.insert_one(student_profile)
        
        access_token = create_access_token(identity=user_id)
        
        return jsonify({
            'success': True,
            'message': 'Student registered successfully',
            'token': access_token,
            'user': {
                '_id': user_id,
                'email': email,
                'name': fullName,
                'role': 'student',
                'isProfileComplete': False,
                'profilePercentage': 20
            }
        }), 201
        
    except Exception as e:
        print(f"❌ Error in register_student: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500


@auth_bp.route('/register/teacher', methods=['POST'])
def register_teacher():
    try:
        data = request.json
        print(f"📥 Teacher Registration Data: {data}")
        
        email = data.get('email', '').strip().lower()
        password = data.get('password', '')
        fullName = data.get('fullName', '').strip()
        phone = data.get('phone', '').strip()
        
        if not email or not password or not fullName:
            return jsonify({'error': 'Email, password, and full name are required'}), 400
        
        existing_user = db.users_collection.find_one({'email': email})
        if existing_user:
            return jsonify({'error': 'User with this email already exists'}), 400
        
        hashed_password = generate_password_hash(password)
        
        # ✅ Ensure it's a string
        if isinstance(hashed_password, bytes):
            hashed_password = hashed_password.decode('utf-8')
        
        user_data = {
            'email': email,
            'password': hashed_password,
            'name': fullName,
            'phone': phone,
            'role': 'teacher',
            'is_active': True,
            'created_at': datetime.utcnow(),
            'updated_at': datetime.utcnow()
        }
        
        result = db.users_collection.insert_one(user_data)
        user_id = str(result.inserted_id)
        
        teacher_profile = {
            'user_id': ObjectId(user_id),
            '_user_id': ObjectId(user_id),
            '_name': fullName,
            'name': fullName,
            '_phone': phone,
            'phone': phone,
            '_subjects': [],
            'subjects': [],
            '_teaching_mode': 'online',
            'teaching_mode': 'online',
            '_isProfileComplete': False,
            'isProfileComplete': False,
            '_created_at': datetime.utcnow(),
            'created_at': datetime.utcnow()
        }
        
        db.teacher_profiles.insert_one(teacher_profile)
        
        access_token = create_access_token(identity=user_id)
        
        return jsonify({
            'success': True,
            'message': 'Teacher registered successfully',
            'token': access_token,
            'user': {
                '_id': user_id,
                'email': email,
                'name': fullName,
                'role': 'teacher',
                'isProfileComplete': False,
                'profilePercentage': 20
            }
        }), 201
        
    except Exception as e:
        print(f"❌ Error in register_teacher: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500


# ✅ FIXED LOGIN - With empty password check
@auth_bp.route('/login', methods=['POST'])
def login():
    try:
        data = request.json
        email = data.get('email', '').strip().lower()
        password = data.get('password', '')
        
        print(f"🔍 Login attempt: {email}")
        
        if not email or not password:
            return jsonify({'error': 'Email and password are required'}), 400
        
        user = db.users_collection.find_one({'email': email})
        if not user:
            print(f"❌ User not found: {email}")
            return jsonify({'error': 'Invalid credentials'}), 401
        
        # ✅ FIX: Handle password correctly
        stored_password = user.get('password', '')
        
        # If stored_password is bytes, decode to string
        if isinstance(stored_password, bytes):
            stored_password = stored_password.decode('utf-8')
        
        # ✅ CRITICAL CHECK: If stored_password is empty or invalid format
        if not stored_password or '$' not in stored_password:
            print(f"❌ Invalid password format for: {email}")
            print(f"   stored_password: '{stored_password}'")
            return jsonify({'error': 'Invalid credentials. Please reset your password.'}), 401
        
        # check_password_hash expects (password_hash, password) both strings
        if not check_password_hash(stored_password, password):
            print(f"❌ Invalid password for: {email}")
            return jsonify({'error': 'Invalid credentials'}), 401
        
        if not user.get('is_active', True):
            return jsonify({'error': 'Account is deactivated'}), 403
        
        user_id = str(user['_id'])
        role = user.get('role', 'student')
        
        print(f"✅ Login successful: {email}")
        print(f"✅ User ID: {user_id}")
        
        is_complete = False
        profile_percentage = 20
        
        if role == 'student':
            profile = db.student_profiles.find_one({
                '$or': [
                    {'_user_id': ObjectId(user_id)},
                    {'user_id': ObjectId(user_id)}
                ]
            })
            if profile:
                is_complete = profile.get('_isProfileComplete', False) or profile.get('isProfileComplete', False)
        else:
            profile = db.teacher_profiles.find_one({
                '$or': [
                    {'_user_id': ObjectId(user_id)},
                    {'user_id': ObjectId(user_id)}
                ]
            })
            if profile:
                is_complete = profile.get('_isProfileComplete', False) or profile.get('isProfileComplete', False)
        
        access_token = create_access_token(identity=user_id)
        
        return jsonify({
            'success': True,
            'message': 'Login successful',
            'token': access_token,
            'user': {
                '_id': user_id,
                'email': user.get('email'),
                'name': user.get('name', ''),
                'phone': user.get('phone', ''),
                'role': role,
                'isProfileComplete': is_complete,
                'profilePercentage': 100 if is_complete else 20
            }
        }), 200
        
    except Exception as e:
        print(f"❌ Error in login: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500


@auth_bp.route('/me', methods=['GET'])
@jwt_required()
def get_current_user():
    try:
        current_user_id = get_jwt_identity()
        
        user = db.users_collection.find_one({'_id': ObjectId(current_user_id)})
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        role = user.get('role', 'student')
        
        profile_data = {}
        is_complete = False
        
        if role == 'student':
            profile = db.student_profiles.find_one({
                '$or': [
                    {'_user_id': ObjectId(current_user_id)},
                    {'user_id': ObjectId(current_user_id)}
                ]
            })
            if profile:
                is_complete = profile.get('_isProfileComplete', False) or profile.get('isProfileComplete', False)
                profile_data = {
                    'subjects': profile.get('_subjects', []) or profile.get('subjects', []),
                    'location': profile.get('_location', '') or profile.get('location', ''),
                    'education_level': profile.get('_education_level', '') or profile.get('education_level', ''),
                    'learning_mode': profile.get('_learning_mode', '') or profile.get('learning_mode', 'online'),
                    'profile_picture': profile.get('_profile_picture', '') or profile.get('profile_picture', ''),
                    'bio': profile.get('_bio', '') or profile.get('bio', ''),
                    'phone': profile.get('_phone', '') or profile.get('phone', ''),
                    'budget_range': profile.get('_budget_range', '') or profile.get('budget_range', ''),
                    'study_time': profile.get('_study_time', '') or profile.get('study_time', ''),
                }
        else:
            profile = db.teacher_profiles.find_one({
                '$or': [
                    {'_user_id': ObjectId(current_user_id)},
                    {'user_id': ObjectId(current_user_id)}
                ]
            })
            if profile:
                is_complete = profile.get('_isProfileComplete', False) or profile.get('isProfileComplete', False)
                profile_data = {
                    'subjects': profile.get('_subjects', []) or profile.get('subjects', []),
                    'location': profile.get('_location', '') or profile.get('location', ''),
                    'teaching_mode': profile.get('_teaching_mode', '') or profile.get('teaching_mode', 'online'),
                    'qualification': profile.get('_qualification', '') or profile.get('qualification', ''),
                    'experience': profile.get('_experience', '') or profile.get('experience', ''),
                    'fee_range': profile.get('_fee_range', '') or profile.get('fee_range', ''),
                    'teaching_levels': profile.get('_teaching_levels', []) or profile.get('teaching_levels', []),
                    'profile_picture': profile.get('_profile_picture', '') or profile.get('profile_picture', ''),
                    'bio': profile.get('_bio', '') or profile.get('bio', ''),
                    'phone': profile.get('_phone', '') or profile.get('phone', ''),
                }
        
        return jsonify({
            'success': True,
            'user': {
                '_id': str(user['_id']),
                'email': user.get('email'),
                'name': user.get('name', ''),
                'phone': user.get('phone', ''),
                'role': role,
                'isProfileComplete': is_complete,
                'profilePercentage': 100 if is_complete else 20,
                **profile_data
            }
        }), 200
        
    except Exception as e:
        print(f"❌ Error in get_current_user: {e}")
        return jsonify({'error': str(e)}), 500


@auth_bp.route('/logout', methods=['POST'])
@jwt_required()
def logout():
    return jsonify({
        'success': True,
        'message': 'Logged out successfully'
    }), 200
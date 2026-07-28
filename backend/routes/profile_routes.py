# backend/routes/profile_routes.py
from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from bson import ObjectId
from datetime import datetime
from config.database import db

profile_bp = Blueprint('profile', __name__)


# ============================================================
# ✅ GET TEACHER PROFILE FOR STUDENT
# ============================================================
@profile_bp.route('/teacher/<teacher_id>', methods=['GET'])
@jwt_required()
def get_teacher_profile_for_student(teacher_id):
    try:
        current_user_id = get_jwt_identity()
        print(f"🔍 Student {current_user_id} viewing teacher {teacher_id}")
        
        if not ObjectId.is_valid(teacher_id):
            return jsonify({'error': 'Invalid teacher ID'}), 400
            
        user = db.users_collection.find_one({'_id': ObjectId(current_user_id)})
        if not user or user.get('role') != 'student':
            return jsonify({'error': 'Only students can view teacher profiles'}), 403
        
        teacher = db.users_collection.find_one({'_id': ObjectId(teacher_id)})
        if not teacher:
            return jsonify({'error': 'Teacher not found'}), 404
        
        if teacher.get('role') != 'teacher':
            return jsonify({'error': 'User is not a teacher'}), 400
        
        teacher_profile = db.teacher_profiles.find_one({
            '$or': [
                {'_user_id': ObjectId(teacher_id)},
                {'user_id': ObjectId(teacher_id)}
            ]
        })
        
        if not teacher_profile:
            return jsonify({'error': 'Teacher profile not found'}), 404

        availability_days = teacher_profile.get('_availability_days', []) or teacher_profile.get('availability_days', [])
        time_slots = teacher_profile.get('_time_slots', []) or teacher_profile.get('time_slots', [])
        
        timings = []
        if availability_days and time_slots:
            for i, day in enumerate(availability_days):
                if i < len(time_slots) and time_slots[i]:
                    timings.append(f"{day}: {', '.join(time_slots[i])}")
        
        reviews = list(db.reviews_collection.find({'teacher_id': ObjectId(teacher['_id'])}))
        avg_rating = 0
        if reviews:
            avg_rating = sum(r.get('rating', 0) for r in reviews) / len(reviews)

        teaching_mode = teacher_profile.get('_teaching_mode')
        if not teaching_mode:
            teaching_mode = teacher_profile.get('teaching_mode')
        if not teaching_mode:
            teaching_mode = 'online'

        teacher_data = {
            '_id': str(teacher_profile['_id']),
            'user_id': str(teacher['_id']),
            'name': teacher_profile.get('_name', '') or teacher_profile.get('name', 'Unknown Teacher'),
            'profile_picture': teacher_profile.get('_profile_picture', '') or teacher_profile.get('profile_picture', ''),
            'qualification': teacher_profile.get('_qualification', '') or teacher_profile.get('qualification', ''),
            'experience': teacher_profile.get('_experience', '') or teacher_profile.get('experience', ''),
            'subjects': teacher_profile.get('_subjects', []) or teacher_profile.get('subjects', []),
            'teaching_mode': teaching_mode,
            'fee_range': teacher_profile.get('_fee_range', '') or teacher_profile.get('fee_range', ''),
            'location': teacher_profile.get('_location', '') or teacher_profile.get('location', ''),
            'bio': teacher_profile.get('_bio', '') or teacher_profile.get('bio', ''),
            'timings': timings,
            'rating': round(avg_rating, 1),
            'reviews_count': len(reviews),
            'isProfileComplete': teacher_profile.get('_isProfileComplete', False) or teacher_profile.get('isProfileComplete', False)
        }
        
        return jsonify({
            'success': True,
            'teacher': teacher_data
        }), 200
        
    except Exception as e:
        print(f"Error in get_teacher_profile_for_student: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500


# ============================================================
# ✅ GET MY PROFILE - ROLE-BASED RESPONSE
# ============================================================
@profile_bp.route('/me', methods=['GET'])
@jwt_required()
def get_my_profile():
    try:
        current_user_id = get_jwt_identity()
        
        user = db.users_collection.find_one({'_id': ObjectId(current_user_id)})
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        role = user.get('role', 'student')
        
        # ✅ Fetch profile based on role
        profile = None
        if role == 'student':
            profile = db.student_profiles.find_one({
                '$or': [
                    {'_user_id': ObjectId(current_user_id)},
                    {'user_id': ObjectId(current_user_id)}
                ]
            })
        else:
            profile = db.teacher_profiles.find_one({
                '$or': [
                    {'_user_id': ObjectId(current_user_id)},
                    {'user_id': ObjectId(current_user_id)}
                ]
            })
        
        if not profile:
            return jsonify({
                'success': True,
                'profile': {
                    'name': user.get('name', ''),
                    'email': user.get('email', ''),
                    'role': role,
                    'isProfileComplete': False
                }
            }), 200
        
        # ✅ Common fields for both roles
        name = profile.get('_name', '') or profile.get('name', '') or user.get('name', '')
        phone = profile.get('_phone', '') or profile.get('phone', '')
        location = profile.get('_location', '') or profile.get('location', '')
        subjects = profile.get('_subjects', []) or profile.get('subjects', [])
        profile_picture = profile.get('_profile_picture', '') or profile.get('profile_picture', '')
        bio = profile.get('_bio', '') or profile.get('bio', '')
        isProfileComplete = profile.get('_isProfileComplete', False) or profile.get('isProfileComplete', False)
        
        # ✅ Base profile data (common for both roles)
        profile_data = {
            'name': name,
            'email': user.get('email', ''),
            'phone': phone,
            'location': location,
            'subjects': subjects,
            'profile_picture': profile_picture,
            'bio': bio,
            'role': role,
            'isProfileComplete': isProfileComplete
        }
        
        # ✅ ROLE-BASED FIELDS
        if role == 'student':
            # ✅ Student-specific fields
            education_level = profile.get('_education_level', '') or profile.get('education_level', '')
            learning_mode = profile.get('_learning_mode', '')
            if not learning_mode:
                learning_mode = profile.get('learning_mode', '')
            if not learning_mode:
                learning_mode = profile.get('_preferred_mode', '')
            if not learning_mode:
                learning_mode = profile.get('preferred_mode', '')
            
            gender = profile.get('_gender', '') or profile.get('gender', '')
            school_name = profile.get('_school_name', '') or profile.get('school_name', '')
            board = profile.get('_board', '') or profile.get('board', '')
            budget_range = profile.get('_budget_range', '') or profile.get('budget_range', '')
            study_time = profile.get('_study_time', '') or profile.get('study_time', '')
            
            profile_data.update({
                'education_level': education_level,
                'learning_mode': learning_mode,
                'gender': gender,
                'school_name': school_name,
                'board': board,
                'budget_range': budget_range,
                'study_time': study_time
            })
            
            print(f"📊 Student Profile fetched - Education Level: '{education_level}'")
            print(f"📊 School Name: '{school_name}'")
            print(f"📊 Budget: '{budget_range}'")
            print(f"📊 Study Time: '{study_time}'")
            
        else:
            # ✅ Teacher-specific fields
            qualification = profile.get('_qualification', '') or profile.get('qualification', '')
            experience = profile.get('_experience', '') or profile.get('experience', '')
            fee_range = profile.get('_fee_range', '') or profile.get('fee_range', '')
            teaching_mode = profile.get('_teaching_mode', '') or profile.get('teaching_mode', 'online')
            teaching_levels = profile.get('_teaching_levels', []) or profile.get('teaching_levels', [])
            
            profile_data.update({
                'qualification': qualification,
                'experience': experience,
                'fee_range': fee_range,
                'teaching_mode': teaching_mode,
                'teaching_levels': teaching_levels
            })
            
            print(f"📊 Teacher Profile fetched - Teaching Levels: {teaching_levels}")
            print(f"📊 Qualification: '{qualification}'")
            print(f"📊 Experience: '{experience}'")
            print(f"📊 Fee Range: '{fee_range}'")
        
        return jsonify({
            'success': True,
            'profile': profile_data
        }), 200
        
    except Exception as e:
        print(f"Error in get_my_profile: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500


# ============================================================
# ✅ UPDATE PROFILE - FIXED WITH teaching_levels
# ============================================================
@profile_bp.route('/update', methods=['PUT'])
@jwt_required()
def update_profile():
    try:
        current_user_id = get_jwt_identity()
        data = request.json
        
        if not data:
            return jsonify({'error': 'No data provided'}), 400
        
        user = db.users_collection.find_one({'_id': ObjectId(current_user_id)})
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        role = user.get('role', 'student')
        
        update_data = {}
        normal_data = {}
        
        # ✅ Common field mapping
        field_mapping = {
            'name': '_name',
            'phone': '_phone',
            'location': '_location',
            'subjects': '_subjects',
            'profile_picture': '_profile_picture',
            'bio': '_bio'
        }
        
        # ✅ Student field mapping
        student_field_mapping = {
            'education_level': '_education_level',
            'learning_mode': '_learning_mode',
            'gender': '_gender',
            'school_name': '_school_name',
            'board': '_board',
            'budget_range': '_budget_range',
            'study_time': '_study_time'
        }
        
        # ✅ Teacher field mapping
        teacher_field_mapping = {
            'qualification': '_qualification',
            'experience': '_experience',
            'fee_range': '_fee_range',
            'teaching_mode': '_teaching_mode',
            'teaching_levels': '_teaching_levels'
        }
        
        # ✅ Build mapping based on role
        if role == 'student':
            all_mapping = {**field_mapping, **student_field_mapping}
        else:
            all_mapping = {**field_mapping, **teacher_field_mapping}
        
        for frontend_field, db_field in all_mapping.items():
            if frontend_field in data:
                value = data[frontend_field]
                if isinstance(value, str):
                    value = value.strip()
                update_data[db_field] = value
                normal_data[frontend_field] = value
        
        if not update_data:
            return jsonify({'error': 'No fields to update'}), 400
        
        update_data['_updated_at'] = datetime.utcnow()
        normal_data['updated_at'] = datetime.utcnow()
        
        if data.get('isProfileComplete'):
            update_data['_isProfileComplete'] = True
            normal_data['isProfileComplete'] = True
        
        if role == 'student':
            collection = db.student_profiles
        else:
            collection = db.teacher_profiles
        
        existing = collection.find_one({
            '$or': [
                {'_user_id': ObjectId(current_user_id)},
                {'user_id': ObjectId(current_user_id)}
            ]
        })
        
        if existing:
            collection.update_one(
                {'_id': existing['_id']},
                {'$set': {**update_data, **normal_data}}
            )
        else:
            update_data['_user_id'] = ObjectId(current_user_id)
            update_data['_created_at'] = datetime.utcnow()
            normal_data['user_id'] = ObjectId(current_user_id)
            normal_data['_user_id'] = ObjectId(current_user_id)
            normal_data['_created_at'] = datetime.utcnow()
            collection.insert_one({**update_data, **normal_data})
        
        return jsonify({
            'success': True,
            'message': 'Profile updated successfully'
        }), 200
        
    except Exception as e:
        print(f"Error in update_profile: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500


# ============================================================
# ✅ PUBLIC PROFILE
# ============================================================
@profile_bp.route('/public/<user_id>', methods=['GET'])
def get_public_profile(user_id):
    try:
        if not ObjectId.is_valid(user_id):
            return jsonify({'error': 'Invalid user ID'}), 400
            
        user = db.users_collection.find_one({'_id': ObjectId(user_id)})
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        role = user.get('role', 'student')
        
        if role == 'student':
            profile = db.student_profiles.find_one({
                '$or': [
                    {'_user_id': ObjectId(user_id)},
                    {'user_id': ObjectId(user_id)}
                ]
            })
        else:
            profile = db.teacher_profiles.find_one({
                '$or': [
                    {'_user_id': ObjectId(user_id)},
                    {'user_id': ObjectId(user_id)}
                ]
            })
        
        if not profile:
            return jsonify({'error': 'Profile not found'}), 404
        
        return jsonify({
            'success': True,
            'profile': {
                'name': profile.get('_name', '') or profile.get('name', ''),
                'role': role,
                'location': profile.get('_location', '') or profile.get('location', ''),
                'subjects': profile.get('_subjects', []) or profile.get('subjects', []),
                'bio': profile.get('_bio', '') or profile.get('bio', ''),
                'profile_picture': profile.get('_profile_picture', '') or profile.get('profile_picture', ''),
                'rating': profile.get('_rating', 0) or profile.get('rating', 0)
            }
        }), 200
        
    except Exception as e:
        print(f"Error in get_public_profile: {e}")
        return jsonify({'error': str(e)}), 500
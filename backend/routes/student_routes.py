from flask import jsonify, request, Blueprint
from flask_jwt_extended import jwt_required, get_jwt_identity
from bson import ObjectId
from datetime import datetime
import json
from config.database import db
from ai import get_student_recommendations, get_all_recommended_teachers

student_bp = Blueprint('student', __name__)


def get_student_completion(student):
    """Calculate student profile completion percentage"""
    if not student:
        return 20
        
    required_fields = {
        'phone': 20,
        'location': 20,
        'education_level': 20,
        'subjects': 20,
        'learning_mode': 20
    }
    
    required_score = 0
    for field, weight in required_fields.items():
        if field == 'subjects':
            subjects = student.get('_subjects', []) or student.get('subjects', [])
            if subjects and len(subjects) > 0:
                required_score += weight
        else:
            value = student.get(f'_{field}', '')
            if not value:
                value = student.get(field, '')
            if value and str(value).strip():
                required_score += weight
    
    if required_score >= 100:
        return 100
    
    return 20


@student_bp.route('/complete-profile', methods=['POST'])
@jwt_required()
def complete_student_profile():
    """Save/Update student profile"""
    try:
        current_user_id = get_jwt_identity()
        data = request.json
        
        if not data:
            return jsonify({'error': 'No data provided'}), 400
        
        area = data.get('area', '').strip()
        education_level = data.get('education_level', '').strip()
        subjects = data.get('subjects', [])
        learning_mode = data.get('learning_mode', '').strip()
        phone = data.get('phone', '').strip()
        profile_picture = data.get('profile_picture', '')
        bio = data.get('bio', '').strip()
        name = data.get('name', '').strip()
        
        school_name = data.get('school_name', '').strip()
        board = data.get('board', '').strip()
        budget_range = data.get('budget_range', '').strip()
        study_time = data.get('study_time', '').strip()
        
        # ✅ Get subject-wise budget from request
        subject_budget = data.get('subject_budget', '{}')
        if isinstance(subject_budget, dict):
            subject_budget = json.dumps(subject_budget)
        
        print(f"📥 Saving school_name: '{school_name}'")
        print(f"📥 Saving board: '{board}'")
        print(f"📥 Saving budget_range: '{budget_range}'")
        print(f"📥 Saving study_time: '{study_time}'")
        print(f"📥 Saving subject_budget: '{subject_budget}'")
        print(f"📥 User ID: {current_user_id}")
        
        if not area or not education_level or not subjects or not learning_mode or not phone:
            return jsonify({'error': 'All required fields are required'}), 400
        
        existing_profile = db.student_profiles.find_one({
            '$or': [
                {'_user_id': ObjectId(current_user_id)},
                {'user_id': ObjectId(current_user_id)}
            ]
        })
        
        update_data = {
            '_location': area,
            '_education_level': education_level,
            '_subjects': subjects,
            '_learning_mode': learning_mode,
            '_phone': phone,
            '_profile_picture': profile_picture,
            '_bio': bio,
            '_isProfileComplete': True,
            '_updated_at': datetime.utcnow(),
            '_school_name': school_name,
            '_board': board,
            '_budget_range': budget_range,
            '_study_time': study_time,
            '_subject_budget': subject_budget  # ✅ ADD THIS
        }
        
        if name:
            update_data['_name'] = name
        
        print(f"📤 Updating with: {update_data}")
        
        if existing_profile:
            result = db.student_profiles.update_one(
                {'_id': existing_profile['_id']},
                {'$set': update_data}
            )
            print(f"✅ Updated existing profile: {result.modified_count} modified")
        else:
            update_data['_user_id'] = ObjectId(current_user_id)
            update_data['user_id'] = ObjectId(current_user_id)
            update_data['_created_at'] = datetime.utcnow()
            result = db.student_profiles.insert_one(update_data)
            print(f"✅ Created new profile with ID: {result.inserted_id}")
        
        updated_student = db.student_profiles.find_one({
            '$or': [
                {'_user_id': ObjectId(current_user_id)},
                {'user_id': ObjectId(current_user_id)}
            ]
        })
        
        if not updated_student:
            return jsonify({'error': 'Failed to save profile'}), 500
        
        percentage = get_student_completion(updated_student)
        
        return jsonify({
            'success': True,
            'message': 'Profile completed successfully',
            'percentage': percentage
        }), 200
        
    except Exception as e:
        print(f"Error in complete_student_profile: {e}")
        return jsonify({'error': str(e)}), 500


@student_bp.route('/profile-status', methods=['GET'])
@jwt_required()
def student_profile_status():
    """Get profile completion status"""
    try:
        current_user_id = get_jwt_identity()
        student = db.student_profiles.find_one({
            '$or': [
                {'_user_id': ObjectId(current_user_id)},
                {'user_id': ObjectId(current_user_id)}
            ]
        })
        if not student:
            return jsonify({
                'success': True,
                'percentage': 20,
                'is_complete': False
            }), 200
        
        percentage = get_student_completion(student)
        is_complete = percentage >= 98
        
        return jsonify({
            'success': True,
            'percentage': percentage,
            'is_complete': is_complete
        }), 200
    except Exception as e:
        print(f"Error in profile-status: {e}")
        return jsonify({
            'success': True,
            'percentage': 20,
            'is_complete': False
        }), 200


# ============================================================
# ✅ GET STUDENT'S APPROVED COURSES
# ============================================================
@student_bp.route('/my-courses', methods=['GET'])
@jwt_required()
def get_my_courses():
    try:
        current_user_id = get_jwt_identity()
        
        student = db.student_profiles.find_one({
            '$or': [
                {'_user_id': ObjectId(current_user_id)},
                {'user_id': ObjectId(current_user_id)}
            ]
        })
        
        if not student:
            return jsonify({'error': 'Student profile not found'}), 404
        
        approved_requests = list(db.enrollment_requests.find({
            'student_id': current_user_id,
            'status': 'approved'
        }).sort('created_at', -1))
        
        print(f"📋 Found {len(approved_requests)} approved courses")
        
        courses = []
        
        for req in approved_requests:
            try:
                teacher_user = db.users_collection.find_one({
                    '_id': ObjectId(req['teacher_id'])
                })
                
                if not teacher_user:
                    print(f"⚠️ Teacher user not found for ID: {req['teacher_id']}")
                    continue
                
                teacher_profile = db.teacher_profiles.find_one({
                    '$or': [
                        {'_user_id': ObjectId(req['teacher_id'])},
                        {'user_id': ObjectId(req['teacher_id'])}
                    ]
                })
                
                teacher_name = teacher_user.get('name', 'Unknown Teacher')
                teacher_email = teacher_user.get('email', '')
                
                if teacher_profile:
                    teacher_picture = teacher_profile.get('_profile_picture', '') or teacher_profile.get('profile_picture', '')
                    teacher_subjects = teacher_profile.get('_subjects', []) or teacher_profile.get('subjects', [])
                    teacher_location = teacher_profile.get('_location', '') or teacher_profile.get('location', '')
                    teacher_teaching_mode = teacher_profile.get('_teaching_mode', 'online') or teacher_profile.get('teaching_mode', 'online')
                    teacher_bio = teacher_profile.get('_bio', '') or teacher_profile.get('bio', '')
                    teacher_qualification = teacher_profile.get('_qualification', '') or teacher_profile.get('qualification', '')
                    teacher_experience = teacher_profile.get('_experience', '') or teacher_profile.get('experience', '')
                    teacher_fee_range = teacher_profile.get('_fee_range', '') or teacher_profile.get('fee_range', '')
                    teacher_rating = teacher_profile.get('_rating', 0) or teacher_profile.get('rating', 0)
                    teacher_schedules = teacher_profile.get('_schedules', []) or teacher_profile.get('schedules', [])
                else:
                    teacher_picture = ''
                    teacher_subjects = []
                    teacher_location = ''
                    teacher_teaching_mode = 'online'
                    teacher_bio = ''
                    teacher_qualification = ''
                    teacher_experience = ''
                    teacher_fee_range = ''
                    teacher_rating = 0
                    teacher_schedules = []
                
                preferred_schedule = req.get('preferred_schedule', 'Flexible')
                subject = req.get('subject', 'General')
                learning_mode = req.get('learning_mode', 'online')
                attendance = 85
                payment_status = 'Paid'
                
                meeting_link = req.get('meeting_link', '')
                location = req.get('location', teacher_location)
                
                enrollment_date = req.get('created_at')
                if isinstance(enrollment_date, datetime):
                    enrollment_date = enrollment_date.isoformat()
                elif enrollment_date:
                    enrollment_date = str(enrollment_date)
                else:
                    enrollment_date = datetime.utcnow().isoformat()
                
                course_start_date = datetime.utcnow().isoformat()
                course_end_date = datetime.utcnow().isoformat()
                
                schedule_str = preferred_schedule
                if teacher_schedules:
                    schedule_parts = []
                    for sched in teacher_schedules[:2]:
                        days = sched.get('days', [])
                        time_slots = sched.get('time_slots', [])
                        if days and time_slots:
                            day_str = ', '.join(days[:2])
                            time_str = time_slots[0].get('start_time', '') if time_slots else ''
                            schedule_parts.append(f"{day_str} {time_str}")
                    if schedule_parts:
                        schedule_str = ' | '.join(schedule_parts[:2])
                
                courses.append({
                    '_id': str(req['_id']),
                    'teacher_id': str(req['teacher_id']),
                    'teacher_name': teacher_name,
                    'teacher_email': teacher_email,
                    'teacher_picture': teacher_picture,
                    'teacher_subjects': teacher_subjects,
                    'teacher_location': teacher_location,
                    'teacher_teaching_mode': teacher_teaching_mode,
                    'teacher_bio': teacher_bio,
                    'teacher_qualification': teacher_qualification,
                    'teacher_experience': teacher_experience,
                    'teacher_fee_range': teacher_fee_range,
                    'rating': teacher_rating,
                    'subject': subject,
                    'preferred_schedule': preferred_schedule,
                    'schedule': schedule_str,
                    'learning_mode': learning_mode,
                    'mode': learning_mode,
                    'enrollment_date': enrollment_date,
                    'course_start_date': course_start_date,
                    'course_end_date': course_end_date,
                    'attendance': attendance,
                    'payment_status': payment_status,
                    'fee': teacher_fee_range,
                    'status': 'active',
                    'enrollment_id': str(req['_id']),
                    'meeting_link': meeting_link,
                    'location': location,
                    'student_id': current_user_id
                })
                
            except Exception as e:
                print(f"❌ Error processing course {req.get('teacher_id')}: {e}")
                continue
        
        print(f"✅ Returning {len(courses)} courses")
        
        return jsonify({
            'success': True,
            'courses': courses,
            'count': len(courses)
        }), 200
        
    except Exception as e:
        print(f"❌ Error in get_my_courses: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500


# ============================================================
# ✅ AI RECOMMENDATION - GET RECOMMENDED TEACHERS
# ============================================================
@student_bp.route('/recommended-teachers', methods=['GET'])
@jwt_required()
def get_recommended_teachers():
    try:
        current_user_id = get_jwt_identity()
        recommendations = get_student_recommendations(current_user_id)
        return jsonify({
            'success': True,
            'teachers': recommendations,
            'count': len(recommendations)
        }), 200
    except Exception as e:
        print(f"❌ Error in get_recommended_teachers: {e}")
        return jsonify({'error': str(e)}), 500


@student_bp.route('/all-recommended-teachers', methods=['GET'])
@jwt_required()
def get_all_recommended_teachers_route():
    try:
        current_user_id = get_jwt_identity()
        recommendations = get_all_recommended_teachers(current_user_id)
        return jsonify({
            'success': True,
            'teachers': recommendations,
            'count': len(recommendations)
        }), 200
    except Exception as e:
        print(f"❌ Error in get_all_recommended_teachers_route: {e}")
        return jsonify({'error': str(e)}), 500


# ============================================================
# STUDENT DASHBOARD
# ============================================================
@student_bp.route('/dashboard', methods=['GET'])
@jwt_required()
def get_student_dashboard():
    try:
        current_user_id = get_jwt_identity()
        student = db.student_profiles.find_one({
            '$or': [
                {'_user_id': ObjectId(current_user_id)},
                {'user_id': ObjectId(current_user_id)}
            ]
        })
        if not student:
            return jsonify({'error': 'Student profile not found'}), 404
        
        enrollment_requests = list(db.enrollment_requests.find({
            'student_id': current_user_id
        }).sort('created_at', -1))
        
        pending_requests = len([r for r in enrollment_requests if r.get('status') == 'pending'])
        approved_requests = [r for r in enrollment_requests if r.get('status') == 'approved']
        active_courses = len(approved_requests)
        
        unique_teachers = set()
        for req in approved_requests:
            unique_teachers.add(str(req.get('teacher_id')))
        total_teachers = len(unique_teachers)
        
        print(f"📊 Student Dashboard Stats:")
        print(f"   Pending Requests: {pending_requests}")
        print(f"   Active Courses: {active_courses}")
        print(f"   Total Teachers: {total_teachers}")
        
        formatted_requests = []
        for req in enrollment_requests:
            teacher = db.users_collection.find_one({'_id': ObjectId(req['teacher_id'])})
            teacher_name = teacher.get('name', 'Unknown Teacher') if teacher else 'Unknown Teacher'
            
            formatted_requests.append({
                '_id': str(req['_id']),
                'teacher_id': str(req['teacher_id']),
                'teacher_name': teacher_name,
                'subject': req.get('subject', ''),
                'learning_mode': req.get('learning_mode', ''),
                'preferred_schedule': req.get('preferred_schedule', ''),
                'message': req.get('message', ''),
                'status': req.get('status', 'pending'),
                'created_at': req['created_at'].isoformat() if isinstance(req['created_at'], datetime) else str(req['created_at'])
            })
        
        profile_percentage = get_student_completion(student)
        
        name = student.get('_name', '') or student.get('name', '')
        location = student.get('_location', '') or student.get('location', '')
        subjects = student.get('_subjects', []) or student.get('subjects', [])
        learning_mode = student.get('_learning_mode', '') or student.get('learning_mode', 'online')
        profile_picture = student.get('_profile_picture', '') or student.get('profile_picture', '')
        education_level = student.get('_education_level', '') or student.get('education_level', '')
        phone = student.get('_phone', '') or student.get('phone', '')
        bio = student.get('_bio', '') or student.get('bio', '')
        
        return jsonify({
            'success': True,
            'student': {
                '_id': str(student['_id']),
                'name': name,
                'location': location,
                'subjects': subjects,
                'learning_mode': learning_mode,
                'profile_picture': profile_picture,
                'education_level': education_level,
                'phone': phone,
                'bio': bio
            },
            'profile_percentage': profile_percentage,
            'is_profile_complete': profile_percentage >= 98,
            'active_sessions': [],
            'today_sessions': [],
            'completed_count': 0,
            'pending_requests_count': pending_requests,
            'active_courses': active_courses,
            'total_teachers': total_teachers,
            'recommended_tutors': [],
            'enrollment_requests': formatted_requests
        }), 200
        
    except Exception as e:
        print(f"Error in student dashboard: {e}")
        return jsonify({'error': str(e)}), 500


# ============================================================
# NEARBY TEACHERS
# ============================================================
@student_bp.route('/nearby-teachers', methods=['GET'])
@jwt_required()
def get_nearby_teachers():
    """Get teachers near student's location"""
    try:
        current_user_id = get_jwt_identity()
        
        student = db.student_profiles.find_one({
            '$or': [
                {'_user_id': ObjectId(current_user_id)},
                {'user_id': ObjectId(current_user_id)}
            ]
        })
        
        if not student:
            return jsonify({'error': 'Student not found'}), 404
            
        percentage = get_student_completion(student)
        if percentage < 98:
            return jsonify({
                'error': 'Profile incomplete. Complete your profile to access this feature.',
                'required_percentage': 98,
                'current_percentage': percentage
            }), 403

        student_area = student.get('_location', '') or student.get('location', '')
        student_subjects = student.get('_subjects', []) or student.get('subjects', [])
        
        if not student_area:
            return jsonify({'error': 'Location not set'}), 400
        
        teachers = list(db.teacher_profiles.find({
            '$or': [
                {'_location': student_area},
                {'location': student_area}
            ]
        }))
        
        print(f"📌 Found {len(teachers)} teachers in area: {student_area}")
        
        result = []
        for teacher in teachers:
            teacher_name = teacher.get('_name', '') or teacher.get('name', 'Unknown')
            teacher_subjects = teacher.get('_subjects', []) or teacher.get('subjects', [])
            teacher_user_id = teacher.get('_user_id', '') or teacher.get('user_id', '')
            teacher_rating = teacher.get('_rating', 0) or teacher.get('rating', 0)
            teacher_fee = teacher.get('_fee_range', '') or teacher.get('fee_range', '')
            teacher_mode = teacher.get('_teaching_mode', 'online') or teacher.get('teaching_mode', 'online')
            teacher_picture = teacher.get('_profile_picture', '') or teacher.get('profile_picture', '')
            teacher_experience = teacher.get('_experience', '') or teacher.get('experience', '')
            teacher_qualification = teacher.get('_qualification', '') or teacher.get('qualification', '')
            
            match_score = 0
            if student_subjects and teacher_subjects:
                common = set(student_subjects) & set(teacher_subjects)
                match_score = len(common) * 20 if common else 0
            
            result.append({
                '_id': str(teacher['_id']),
                'user_id': str(teacher_user_id) if teacher_user_id else '',
                'name': teacher_name,
                'subjects': teacher_subjects if teacher_subjects else ['General'],
                'rating': teacher_rating,
                'fee_range': teacher_fee,
                'teaching_mode': teacher_mode,
                'profile_picture': teacher_picture,
                'experience': teacher_experience,
                'qualification': teacher_qualification,
                'match_score': match_score,
                'location': student_area
            })
        
        result.sort(key=lambda x: x['match_score'], reverse=True)
        
        print(f"📌 Returning {len(result)} teachers")
        
        return jsonify({
            'success': True, 
            'teachers': result
        }), 200
        
    except Exception as e:
        print(f"Error in get_nearby_teachers: {e}")
        return jsonify({'error': str(e)}), 500


# ============================================================
# ✅ GET STUDENT PROFILE BY ID (FIXED - Searches both _id and user_id)
# ============================================================
@student_bp.route('/profile/<student_id>', methods=['GET'])
@jwt_required()
def get_student_profile_by_id(student_id):
    try:
        current_user_id = get_jwt_identity()
        
        print(f"🔍 Fetching student profile for ID: {student_id}")
        print(f"👤 Current user: {current_user_id}")
        
        # ✅ First: Try to find by _id (profile's _id)
        student_profile = None
        
        if ObjectId.is_valid(student_id):
            student_profile = db.student_profiles.find_one({
                '_id': ObjectId(student_id)
            })
        
        # ✅ Second: If not found, try by user_id or _user_id
        if not student_profile and ObjectId.is_valid(student_id):
            student_profile = db.student_profiles.find_one({
                '$or': [
                    {'_user_id': ObjectId(student_id)},
                    {'user_id': ObjectId(student_id)}
                ]
            })
        
        # ✅ Third: If still not found, try by string match
        if not student_profile:
            student_profile = db.student_profiles.find_one({
                '$or': [
                    {'_user_id': student_id},
                    {'user_id': student_id}
                ]
            })
        
        if not student_profile:
            print(f"❌ Student profile not found for ID: {student_id}")
            return jsonify({'error': 'Student profile not found'}), 404
        
        # ✅ Get user details
        user_id = student_profile.get('_user_id', '') or student_profile.get('user_id', '')
        user = None
        if user_id and ObjectId.is_valid(user_id):
            user = db.users_collection.find_one({'_id': ObjectId(user_id)})
        
        student_name = student_profile.get('_name', '') or student_profile.get('name', '')
        if not student_name and user:
            student_name = user.get('name', '')
        
        # ✅ Get subject budget
        subject_budget = student_profile.get('_subject_budget', '{}')
        if isinstance(subject_budget, str):
            try:
                subject_budget = json.loads(subject_budget)
            except:
                subject_budget = {}
        
        print(f"✅ Student found: {student_name}")
        print(f"✅ Student profile _id: {student_profile['_id']}")
        print(f"✅ Subject Budget: {subject_budget}")
        
        return jsonify({
            'success': True,
            'student': {
                '_id': str(student_profile['_id']),
                'user_id': str(user_id) if user_id else '',
                'name': student_name or 'Unknown',
                'profile_picture': student_profile.get('_profile_picture', '') or student_profile.get('profile_picture', ''),
                'education_level': student_profile.get('_education_level', '') or student_profile.get('education_level', ''),
                'subjects': student_profile.get('_subjects', []) or student_profile.get('subjects', []),
                'learning_mode': student_profile.get('_learning_mode', '') or student_profile.get('learning_mode', 'online'),
                'location': student_profile.get('_location', '') or student_profile.get('location', ''),
                'bio': student_profile.get('_bio', '') or student_profile.get('bio', ''),
                'phone': student_profile.get('_phone', '') or student_profile.get('phone', ''),
                'study_time': student_profile.get('_study_time', '') or student_profile.get('study_time', 'Flexible'),
                'school_name': student_profile.get('_school_name', '') or student_profile.get('school_name', ''),
                'board': student_profile.get('_board', '') or student_profile.get('board', ''),
                'budget_range': student_profile.get('_budget_range', '') or student_profile.get('budget_range', ''),
                'subject_budget': subject_budget,  # ✅ ADD THIS
                'isProfileComplete': student_profile.get('_isProfileComplete', False) or student_profile.get('isProfileComplete', False)
            }
        }), 200
        
    except Exception as e:
        print(f"❌ Error in get_student_profile_by_id: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500
from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from bson import ObjectId
from datetime import datetime
from config.database import db
from ai import get_tutor_recommendations

teacher_bp = Blueprint('teacher', __name__)


# ============================================================
# ✅ HELPER: Get Teacher Profile Completion
# ============================================================
def get_teacher_completion(teacher):
    """Calculate teacher profile completion percentage"""
    if not teacher:
        return 0
    
    required_fields = {
        'phone': 15,
        'qualification': 15,
        'experience': 15,
        'subjects': 15,
        'teaching_mode': 15,
        'teaching_levels': 15,
    }
    
    optional_fields = {
        'profile_picture': 5,
        'bio': 5
    }
    
    required_score = 0
    for field, weight in required_fields.items():
        if field == 'subjects':
            subjects = teacher.get('_subjects', []) or teacher.get('subjects', [])
            if subjects and len(subjects) > 0:
                required_score += weight
        elif field == 'teaching_levels':
            levels = teacher.get('_teaching_levels', []) or teacher.get('teaching_levels', [])
            if levels and len(levels) > 0:
                required_score += weight
        else:
            value = teacher.get(f'_{field}', '')
            if not value:
                value = teacher.get(field, '')
            if value and str(value).strip():
                required_score += weight
    
    optional_score = 0
    for field, weight in optional_fields.items():
        value = teacher.get(f'_{field}', '')
        if not value:
            value = teacher.get(field, '')
        if value and str(value).strip():
            optional_score += weight
    
    if teacher.get('_isProfileComplete', False) or teacher.get('isProfileComplete', False):
        return 100
    
    total_percentage = min(required_score + optional_score, 100)
    return total_percentage


# ============================================================
# ✅ HELPER: Get Recommended Students (FIXED - Handles dict subjects)
# ============================================================
def get_recommended_students(teacher):
    """Get recommended students based on matching subjects and area"""
    try:
        # ✅ FIXED: Extract subject names from new format
        teacher_subjects_raw = teacher.get('_subjects', []) or teacher.get('subjects', [])
        teacher_subjects = []
        if teacher_subjects_raw and isinstance(teacher_subjects_raw, list):
            for s in teacher_subjects_raw:
                if isinstance(s, str):
                    teacher_subjects.append(s)
                elif isinstance(s, dict):
                    subject_name = s.get('subject', '') or s.get('name', '') or s.get('title', '')
                    if subject_name:
                        teacher_subjects.append(subject_name)
        
        teacher_area = teacher.get('_location', '') or teacher.get('location', '')
        
        print(f"📌 Teacher Details:")
        print(f"   Subjects: {teacher_subjects}")
        print(f"   Area: '{teacher_area}'")
        
        if not teacher_subjects:
            print("⚠️ No subjects found for teacher")
            return []
        
        if not teacher_area:
            print("⚠️ No area found for teacher")
            return []
        
        all_students = list(db.student_profiles.find())
        print(f"📌 Total students in DB: {len(all_students)}")
        
        recommended = []
        
        for student in all_students:
            # ✅ FIXED: Extract student subject names
            student_subjects_raw = student.get('_subjects', []) or student.get('subjects', [])
            student_subjects = []
            if student_subjects_raw and isinstance(student_subjects_raw, list):
                for s in student_subjects_raw:
                    if isinstance(s, str):
                        student_subjects.append(s)
                    elif isinstance(s, dict):
                        subject_name = s.get('subject', '') or s.get('name', '') or s.get('title', '')
                        if subject_name:
                            student_subjects.append(subject_name)
            
            student_area = student.get('_location', '') or student.get('location', '')
            student_user_id = student.get('_user_id', '') or student.get('user_id', '')
            student_name = student.get('_name', '') or student.get('name', 'Unknown')
            student_profile_pic = student.get('_profile_picture', '') or student.get('profile_picture', '')
            student_bio = student.get('_bio', '') or student.get('bio', '')
            student_education = student.get('_education_level', '') or student.get('education_level', '')
            student_learning_mode = student.get('_learning_mode', '') or student.get('learning_mode', '')
            
            if not student_subjects:
                continue
            
            match_score = 0
            if student_subjects and teacher_subjects:
                common = set(student_subjects) & set(teacher_subjects)
                if common:
                    match_score = min(len(common) * 20, 100)
            
            if student_area and teacher_area and student_area.lower() == teacher_area.lower():
                match_score += 10
            
            match_score = max(0, min(100, match_score))
            
            if match_score > 0:
                recommended.append({
                    'student_id': str(student['_id']),
                    'user_id': str(student_user_id) if student_user_id else '',
                    'name': student_name,
                    'subjects': student_subjects,
                    'education': student_education,
                    'learning_mode': student_learning_mode,
                    'location': student_area,
                    'profile_picture': student_profile_pic,
                    'bio': student_bio,
                    'match_score': match_score
                })
        
        recommended.sort(key=lambda x: x['match_score'], reverse=True)
        
        print(f"📌 Returning {len(recommended)} recommended students")
        return recommended[:10]
        
    except Exception as e:
        print(f"❌ Error in student recommendation: {e}")
        import traceback
        traceback.print_exc()
        return []


# ============================================================
# ✅ ROUTE: Teacher Dashboard
# ============================================================
@teacher_bp.route('/dashboard', methods=['GET'])
@jwt_required()
def get_teacher_dashboard():
    try:
        current_user_id = get_jwt_identity()
        
        teacher = db.teacher_profiles.find_one({
            '$or': [
                {'_user_id': ObjectId(current_user_id)},
                {'user_id': ObjectId(current_user_id)}
            ]
        })
        
        if not teacher:
            return jsonify({'error': 'Teacher profile not found'}), 404
        
        name = teacher.get('_name', '') or teacher.get('name', '')
        
        # ✅ UPDATED: Handle new subject format with fees
        subjects_raw = teacher.get('_subjects', []) or teacher.get('subjects', [])
        subjects = []
        subject_fees = []
        if subjects_raw and isinstance(subjects_raw, list):
            for s in subjects_raw:
                if isinstance(s, str):
                    subjects.append(s)
                    subject_fees.append({'subject': s, 'fee': 0})
                elif isinstance(s, dict):
                    subject_name = s.get('subject', '')
                    fee = s.get('fee', 0)
                    if subject_name:
                        subjects.append(subject_name)
                        subject_fees.append({'subject': subject_name, 'fee': fee})
        
        teaching_mode = teacher.get('_teaching_mode', 'online') or teacher.get('teaching_mode', 'online')
        location = teacher.get('_location', '') or teacher.get('location', '')
        rating = teacher.get('_rating', 0) or teacher.get('rating', 0)
        experience = teacher.get('_experience', '') or teacher.get('experience', '')
        profile_picture = teacher.get('_profile_picture', '') or teacher.get('profile_picture', '')
        bio = teacher.get('_bio', '') or teacher.get('bio', '')
        phone = teacher.get('_phone', '') or teacher.get('phone', '')
        qualification = teacher.get('_qualification', '') or teacher.get('qualification', '')
        teaching_levels = teacher.get('_teaching_levels', []) or teacher.get('teaching_levels', [])
        
        is_profile_complete = teacher.get('_isProfileComplete', False) or teacher.get('isProfileComplete', False)
        profile_percentage = get_teacher_completion(teacher)
        
        if profile_percentage >= 98:
            is_profile_complete = True
        
        print(f"📌 Teacher Dashboard Data:")
        print(f"   Name: {name}")
        print(f"   Location: {location}")
        print(f"   Subjects with Fees: {subject_fees}")
        print(f"   Teaching Levels: {teaching_levels}")
        print(f"   Profile Complete: {is_profile_complete}")
        print(f"   Percentage: {profile_percentage}")
        
        recommended_students = []
        if is_profile_complete and subjects and location:
            print("📌 Fetching recommended students...")
            recommended_students = get_recommended_students(teacher)
            print(f"📌 Found {len(recommended_students)} recommended students")
        else:
            print(f"⚠️ Skipping recommendations - Complete: {is_profile_complete}, Subjects: {bool(subjects)}, Location: {bool(location)}")
        
        enrollment_requests = list(db.enrollment_requests.find({
            'teacher_id': current_user_id
        }).sort('created_at', -1))
        
        pending_requests = len([r for r in enrollment_requests if r.get('status') == 'pending'])
        approved_students = len([r for r in enrollment_requests if r.get('status') == 'approved'])
        total_earnings = 0
        
        print(f"📊 Teacher Dashboard Stats:")
        print(f"   Pending Requests: {pending_requests}")
        print(f"   Approved Students: {approved_students}")
        print(f"   Total Earnings: {total_earnings}")
        
        formatted_requests = []
        for req in enrollment_requests:
            student = db.users_collection.find_one({'_id': ObjectId(req['student_id'])})
            student_name = student.get('name', 'Unknown Student') if student else 'Unknown Student'
            
            formatted_requests.append({
                '_id': str(req['_id']),
                'student_id': str(req['student_id']),
                'student_name': student_name,
                'subject': req.get('subject', ''),
                'learning_mode': req.get('learning_mode', ''),
                'preferred_schedule': req.get('preferred_schedule', ''),
                'message': req.get('message', ''),
                'status': req.get('status', 'pending'),
                'created_at': req['created_at'].isoformat() if isinstance(req['created_at'], datetime) else str(req['created_at'])
            })
        
        return jsonify({
            'success': True,
            'teacher': {
                '_id': str(teacher['_id']),
                'name': name,
                'subjects': subjects,
                'subject_fees': subject_fees,
                'teaching_mode': teaching_mode,
                'location': location,
                'rating': rating,
                'experience': experience,
                'profile_picture': profile_picture,
                'bio': bio,
                'completed_sessions': teacher.get('_completed_sessions', 0) or teacher.get('completed_sessions', 0),
                'phone': phone,
                'qualification': qualification,
                'teaching_levels': teaching_levels,
                'isProfileComplete': is_profile_complete
            },
            'profile_percentage': profile_percentage,
            'is_profile_complete': is_profile_complete,
            'upcoming_sessions': [],
            'pending_requests_count': pending_requests,
            'active_students': approved_students,
            'total_earnings': total_earnings,
            'recommended_students': recommended_students,
            'completed_sessions_count': teacher.get('_completed_sessions', 0) or teacher.get('completed_sessions', 0),
            'enrollment_requests': formatted_requests
        }), 200
        
    except Exception as e:
        print(f"❌ Error in teacher dashboard: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500


# ============================================================
# ✅ ROUTE: Teacher Profile Status
# ============================================================
@teacher_bp.route('/profile-status', methods=['GET'])
@jwt_required()
def teacher_profile_status():
    try:
        current_user_id = get_jwt_identity()
        
        teacher = db.teacher_profiles.find_one({
            '$or': [
                {'_user_id': ObjectId(current_user_id)},
                {'user_id': ObjectId(current_user_id)}
            ]
        })
        
        if not teacher:
            return jsonify({
                'success': True,
                'percentage': 20,
                'is_complete': False
            }), 200
        
        percentage = get_teacher_completion(teacher)
        is_complete = teacher.get('_isProfileComplete', False) or teacher.get('isProfileComplete', False)
        
        if percentage >= 98:
            is_complete = True
        
        print(f"📌 Teacher Profile Status - Percentage: {percentage}, Is Complete: {is_complete}")
        
        return jsonify({
            'success': True,
            'percentage': percentage,
            'is_complete': is_complete
        }), 200
        
    except Exception as e:
        print(f"❌ Error in teacher_profile_status: {e}")
        return jsonify({'error': str(e)}), 500


# ============================================================
# ✅ ROUTE: Complete Teacher Profile
# ============================================================
@teacher_bp.route('/complete-profile', methods=['POST'])
@jwt_required()
def complete_teacher_profile():
    try:
        current_user_id = get_jwt_identity()
        data = request.json
        
        if not data:
            return jsonify({'error': 'No data provided'}), 400
        
        print(f"📥 Full request data: {data}")
        
        phone = data.get('phone', '').strip()
        qualification = data.get('qualification', '').strip()
        experience = data.get('experience', '').strip()
        subjects_data = data.get('subjects', [])
        
        teaching_mode = data.get('teaching_mode', '')
        if not teaching_mode:
            teaching_mode = data.get('learning_mode', '')
        teaching_mode = teaching_mode.strip()
        
        teaching_levels = data.get('teaching_levels', [])
        if not teaching_levels:
            teaching_levels = data.get('_teaching_levels', [])
        
        print(f"📥 Teaching Levels received: {teaching_levels}")
        
        location = data.get('location', '')
        if not location:
            location = data.get('area', '')
        location = location.strip()
        
        profile_picture = data.get('profile_picture', '')
        bio = data.get('bio', '').strip()
        
        print(f"📥 Saving teacher profile:")
        print(f"   Location: '{location}'")
        print(f"   Subjects with fees: {subjects_data}")
        print(f"   Teaching Mode: '{teaching_mode}'")
        print(f"   Teaching Levels: {teaching_levels}")
        
        # ✅ VALIDATION
        if not phone:
            return jsonify({'error': 'Phone number is required'}), 400
        if not qualification:
            return jsonify({'error': 'Qualification is required'}), 400
        if not experience:
            return jsonify({'error': 'Experience is required'}), 400
        if not subjects_data or len(subjects_data) == 0:
            return jsonify({'error': 'At least one subject is required'}), 400
        if not teaching_mode:
            return jsonify({'error': 'Teaching mode is required'}), 400
        if not location:
            return jsonify({'error': 'Location is required'}), 400
        if not teaching_levels or len(teaching_levels) == 0:
            return jsonify({'error': 'At least one teaching level is required'}), 400
        
        # ✅ VALIDATE: Every subject must have a fee
        validated_subjects = []
        for subject_item in subjects_data:
            if isinstance(subject_item, dict):
                subject_name = subject_item.get('subject', '').strip()
                fee = subject_item.get('fee', 0)
                
                if not subject_name:
                    return jsonify({'error': 'Each subject must have a name'}), 400
                if fee <= 0:
                    return jsonify({'error': f'Subject "{subject_name}" must have a valid fee (positive number)'}), 400
                
                validated_subjects.append({
                    'subject': subject_name,
                    'fee': fee
                })
            elif isinstance(subject_item, str):
                return jsonify({'error': 'Subject must include fee'}), 400
            else:
                return jsonify({'error': 'Invalid subject format'}), 400
        
        print(f"✅ Validated subjects: {validated_subjects}")
        
        update_data = {
            '_phone': phone,
            '_qualification': qualification,
            '_experience': experience,
            '_subjects': validated_subjects,
            '_teaching_mode': teaching_mode,
            '_location': location,
            '_profile_picture': profile_picture,
            '_bio': bio,
            '_teaching_levels': teaching_levels,
            '_isProfileComplete': True,
            '_updated_at': datetime.utcnow()
        }
        
        normal_fields = {
            'phone': phone,
            'qualification': qualification,
            'experience': experience,
            'subjects': validated_subjects,
            'teaching_mode': teaching_mode,
            'location': location,
            'profile_picture': profile_picture,
            'bio': bio,
            'teaching_levels': teaching_levels,
            'isProfileComplete': True,
            'updated_at': datetime.utcnow()
        }
        
        existing = db.teacher_profiles.find_one({
            '$or': [
                {'_user_id': ObjectId(current_user_id)},
                {'user_id': ObjectId(current_user_id)}
            ]
        })
        
        if existing:
            result = db.teacher_profiles.update_one(
                {'_id': existing['_id']},
                {'$set': {**update_data, **normal_fields}}
            )
            print(f"✅ Updated teacher profile - Modified: {result.modified_count}")
        else:
            update_data['_user_id'] = ObjectId(current_user_id)
            update_data['_created_at'] = datetime.utcnow()
            normal_fields['user_id'] = ObjectId(current_user_id)
            normal_fields['_user_id'] = ObjectId(current_user_id)
            normal_fields['_created_at'] = datetime.utcnow()
            
            result = db.teacher_profiles.insert_one({**update_data, **normal_fields})
            print(f"✅ Created new teacher profile - ID: {result.inserted_id}")
        
        updated_teacher = db.teacher_profiles.find_one({
            '$or': [
                {'_user_id': ObjectId(current_user_id)},
                {'user_id': ObjectId(current_user_id)}
            ]
        })
        
        print(f"📊 Saved teacher profile - Subjects with fees: {updated_teacher.get('_subjects', [])}")
        
        percentage = get_teacher_completion(updated_teacher)
        is_complete = updated_teacher.get('_isProfileComplete', False) or updated_teacher.get('isProfileComplete', False)
        
        if percentage >= 98:
            is_complete = True
        
        print(f"📊 Final Percentage: {percentage}%, Complete: {is_complete}")
        
        return jsonify({
            'success': True,
            'message': 'Profile completed successfully',
            'percentage': percentage,
            'is_complete': is_complete
        }), 200
        
    except Exception as e:
        print(f"❌ Error in complete_teacher_profile: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500


# ============================================================
# ✅ GET TEACHER'S APPROVED STUDENTS
# ============================================================
@teacher_bp.route('/my-students', methods=['GET'])
@jwt_required()
def get_my_students():
    try:
        current_user_id = get_jwt_identity()
        
        print(f"📤 Fetching students for teacher: {current_user_id}")
        
        teacher = db.teacher_profiles.find_one({
            '$or': [
                {'_user_id': ObjectId(current_user_id)},
                {'user_id': ObjectId(current_user_id)}
            ]
        })
        
        if not teacher:
            return jsonify({'error': 'Teacher profile not found'}), 404
        
        approved_requests = list(db.enrollment_requests.find({
            'teacher_id': current_user_id,
            'status': 'approved'
        }).sort('created_at', -1))
        
        print(f"📋 Found {len(approved_requests)} approved students")
        
        students = []
        
        for req in approved_requests:
            try:
                student_user = db.users_collection.find_one({
                    '_id': ObjectId(req['student_id'])
                })
                
                if not student_user:
                    print(f"⚠️ Student user not found for ID: {req['student_id']}")
                    continue
                
                student_profile = db.student_profiles.find_one({
                    '$or': [
                        {'_user_id': ObjectId(req['student_id'])},
                        {'user_id': ObjectId(req['student_id'])}
                    ]
                })
                
                student_name = student_user.get('name', 'Unknown Student')
                
                student_picture = ''
                student_subjects = []
                student_location = ''
                student_learning_mode = 'online'
                student_bio = ''
                student_education = ''
                student_shift = 'Flexible'
                
                if student_profile:
                    student_picture = student_profile.get('_profile_picture', '') or student_profile.get('profile_picture', '')
                    student_subjects = student_profile.get('_subjects', []) or student_profile.get('subjects', [])
                    student_location = student_profile.get('_location', '') or student_profile.get('location', '')
                    student_learning_mode = student_profile.get('_learning_mode', '') or student_profile.get('learning_mode', 'online')
                    student_bio = student_profile.get('_bio', '') or student_profile.get('bio', '')
                    student_education = student_profile.get('_education_level', '') or student_profile.get('education_level', '')
                    student_shift = student_profile.get('_study_time', '') or student_profile.get('study_time', '')
                
                if not student_shift:
                    student_shift = req.get('preferred_timing', 'Flexible')
                if not student_shift:
                    student_shift = 'Flexible'
                
                preferred_schedule = req.get('preferred_schedule', 'Flexible')
                attendance = 0
                
                enrollment_date = req.get('created_at')
                if isinstance(enrollment_date, datetime):
                    enrollment_date = enrollment_date.isoformat()
                elif enrollment_date:
                    enrollment_date = str(enrollment_date)
                else:
                    enrollment_date = datetime.utcnow().isoformat()
                
                subject = req.get('subject', 'General')
                if not subject or subject == 'General':
                    if student_subjects and len(student_subjects) > 0:
                        subject = student_subjects[0]
                
                students.append({
                    'student_id': str(req['student_id']),
                    'student_name': student_name,
                    'student_picture': student_picture,
                    'student_subjects': student_subjects,
                    'student_location': student_location,
                    'student_learning_mode': student_learning_mode,
                    'student_bio': student_bio,
                    'student_education': student_education,
                    'student_shift': student_shift,
                    'subject': subject,
                    'preferred_schedule': preferred_schedule,
                    'enrollment_date': enrollment_date,
                    'attendance': attendance,
                    'status': 'active',
                    'enrollment_id': str(req['_id'])
                })
                
            except Exception as e:
                print(f"❌ Error processing student {req.get('student_id')}: {e}")
                continue
        
        print(f"✅ Returning {len(students)} students")
        
        return jsonify({
            'success': True,
            'students': students,
            'count': len(students)
        }), 200
        
    except Exception as e:
        print(f"❌ Error in get_my_students: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500


# ============================================================
# ✅ AI RECOMMENDATION - GET RECOMMENDED STUDENTS FOR TEACHER
# ============================================================
@teacher_bp.route('/recommended-students', methods=['GET'])
@jwt_required()
def get_recommended_students_for_teacher():
    try:
        current_user_id = get_jwt_identity()
        
        recommendations = get_tutor_recommendations(current_user_id)
        
        return jsonify({
            'success': True,
            'students': recommendations,
            'count': len(recommendations)
        }), 200
        
    except Exception as e:
        print(f"❌ Error in get_recommended_students_for_teacher: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500


# ============================================================
# ✅ GET TEACHER SCHEDULES WITH SUBJECT FILTER
# ============================================================
@teacher_bp.route('/schedules/<teacher_id>', methods=['GET'])
@jwt_required()
def get_teacher_schedules(teacher_id):
    """Get teacher schedules with optional subject filter"""
    try:
        current_user_id = get_jwt_identity()
        subject = request.args.get('subject', '')
        
        print(f"📤 Fetching schedules for teacher: {teacher_id}, subject: '{subject}'")
        print(f"👤 Current user: {current_user_id}")
        
        user = db.users_collection.find_one({'_id': ObjectId(current_user_id)})
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        teacher = db.teacher_profiles.find_one({
            '$or': [
                {'_user_id': ObjectId(teacher_id)},
                {'user_id': ObjectId(teacher_id)}
            ]
        })
        
        if not teacher:
            print(f"❌ Teacher not found with ID: {teacher_id}")
            return jsonify({'error': 'Teacher not found'}), 404
        
        schedules = teacher.get('_schedules', []) or teacher.get('schedules', [])
        
        print(f"📌 Found {len(schedules)} total schedules for teacher")
        
        filtered_schedules = []
        if subject:
            for s in schedules:
                s_subject = s.get('subject', '')
                print(f"   Checking schedule subject: '{s_subject}' against '{subject}'")
                if s_subject.lower() == subject.lower():
                    filtered_schedules.append(s)
            print(f"📌 Filtered to {len(filtered_schedules)} schedules for subject: {subject}")
        else:
            filtered_schedules = schedules
        
        formatted_schedules = []
        for schedule in filtered_schedules:
            time_slots = schedule.get('time_slots', [])
            for slot in time_slots:
                is_booked = slot.get('is_booked', False)
                formatted_schedules.append({
                    'day': slot.get('day', ''),
                    'start_time': slot.get('start_time', ''),
                    'end_time': slot.get('end_time', ''),
                    'subject': schedule.get('subject', ''),
                    'is_booked': is_booked
                })
        
        print(f"📌 Returning {len(formatted_schedules)} formatted schedules")
        
        return jsonify({
            'success': True,
            'schedules': formatted_schedules
        }), 200
        
    except Exception as e:
        print(f"❌ Error in get_teacher_schedules: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from bson import ObjectId
from datetime import datetime
from config.database import db

enrollment_bp = Blueprint('enrollment', __name__)


# ============================================================
# ✅ CREATE ENROLLMENT REQUEST - UPDATED WITH SUBJECT-WISE FEES
# ============================================================
@enrollment_bp.route('/request', methods=['POST'])
@jwt_required()
def create_enrollment_request():
    try:
        current_user_id = get_jwt_identity()
        data = request.json

        teacher_id = data.get('teacher_id')
        preferred_schedule = data.get('preferred_schedule')
        message = data.get('message', '')

        print(f"📥 Enrollment request data: {data}")
        print(f"👤 Current user: {current_user_id}")

        # ✅ VALIDATION
        if not teacher_id:
            return jsonify({'error': 'Teacher ID is required'}), 400
        
        if not preferred_schedule:
            return jsonify({'error': 'Please select a schedule'}), 400

        if not ObjectId.is_valid(teacher_id):
            return jsonify({'error': 'Invalid Teacher ID format'}), 400

        # ✅ Get student info
        student = db.users_collection.find_one({'_id': ObjectId(current_user_id)})
        if not student:
            return jsonify({'error': 'Student not found'}), 404

        # ✅ Get student profile
        student_profile = db.student_profiles.find_one({
            '$or': [
                {'_user_id': ObjectId(current_user_id)},
                {'user_id': ObjectId(current_user_id)}
            ]
        })

        subject = 'General'
        if student_profile:
            subjects = student_profile.get('_subjects', []) or student_profile.get('subjects', [])
            subject = subjects[0] if subjects else 'General'

        learning_mode = student_profile.get('_learning_mode', '') or student_profile.get('learning_mode', 'Online')

        # ✅ Get teacher info
        teacher = db.users_collection.find_one({'_id': ObjectId(teacher_id)})
        if not teacher:
            print(f"❌ Teacher not found with ID: {teacher_id}")
            return jsonify({'error': 'Teacher not found'}), 404

        print(f"✅ Teacher found: {teacher.get('name')}")

        # ✅ FIXED: Check if student already has a pending OR approved request
        existing = db.enrollment_requests.find_one({
            'student_id': current_user_id,
            'teacher_id': teacher_id,
            'status': {'$in': ['pending', 'approved']}
        })

        if existing:
            return jsonify({'error': f'You already have a {existing["status"]} request for this teacher'}), 400

        # ✅ Get teacher profile for subject-wise fees
        teacher_profile = db.teacher_profiles.find_one({
            '$or': [
                {'_user_id': ObjectId(teacher_id)},
                {'user_id': ObjectId(teacher_id)}
            ]
        })

        # ✅ UPDATED: Extract subject-wise fees
        fee = ''
        subject_fees = []
        
        if teacher_profile:
            subjects_raw = teacher_profile.get('_subjects', []) or teacher_profile.get('subjects', [])
            
            if subjects_raw and isinstance(subjects_raw, list):
                if subjects_raw and isinstance(subjects_raw[0], dict):
                    # New format: [{subject: 'Math', fee: 5000}]
                    subject_fees = subjects_raw
                    # Get fee for the student's subject
                    for s in subject_fees:
                        if s.get('subject', '') == subject:
                            fee = str(s.get('fee', ''))
                            break
                else:
                    # Old format: ['Math', 'Physics']
                    if subject in subjects_raw:
                        # Try to find fee from old format (will be empty)
                        fee = ''
                    subject_fees = [{'subject': s, 'fee': 0} for s in subjects_raw]

        print(f"📌 Student subject: {subject}")
        print(f"📌 Teacher subject fees: {subject_fees}")
        print(f"📌 Fee for subject: {fee}")

        # ✅ Create enrollment request with subject and fee
        request_data = {
            'teacher_id': teacher_id,
            'teacher_name': teacher.get('name', 'Unknown Teacher'),
            'student_id': current_user_id,
            'student_name': student.get('name', 'Unknown Student'),
            'subject': subject,
            'learning_mode': learning_mode,
            'preferred_schedule': preferred_schedule,
            'message': message,
            'fee': fee,  # ✅ UPDATED: Subject-wise fee
            'subject_fees': subject_fees,  # ✅ NEW: All subject-wise fees
            'status': 'pending',
            'created_at': datetime.utcnow(),
            'updated_at': datetime.utcnow()
        }

        result = db.enrollment_requests.insert_one(request_data)
        request_id = str(result.inserted_id)

        print(f"✅ Enrollment request created: {request_id}")

        # ✅ ========== CREATE NOTIFICATION FOR TEACHER ==========
        notification = {
            'sender_id': ObjectId(current_user_id),
            'receiver_id': ObjectId(teacher_id),
            'type': 'new_request',
            'title': '📩 New Enrollment Request',
            'message': f'{student.get("name", "A student")} wants to enroll in {subject}. Fee: Rs. {fee}/month',
            'request_id': ObjectId(request_id),
            'read': False,
            'created_at': datetime.utcnow()
        }
        db.notifications_collection.insert_one(notification)
        print(f"✅ Notification sent to Teacher (ID: {teacher_id})")
        # =======================================================

        return jsonify({
            'success': True,
            'message': 'Enrollment request sent successfully',
            'request_id': request_id,
            'fee': fee
        }), 201

    except Exception as e:
        print(f"❌ Error in create_enrollment_request: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500


# ============================================================
# ✅ ACCEPT ENROLLMENT REQUEST - UPDATED
# ============================================================
@enrollment_bp.route('/request/<request_id>/accept', methods=['PUT'])
@jwt_required()
def accept_enrollment_request(request_id):
    try:
        current_user_id = get_jwt_identity()
        
        if not ObjectId.is_valid(request_id):
            return jsonify({'error': 'Invalid request ID'}), 400
        
        request_data = db.enrollment_requests.find_one({
            '_id': ObjectId(request_id)
        })
        
        if not request_data:
            return jsonify({'error': 'Request not found'}), 404
        
        # Only teacher can accept
        if str(request_data.get('teacher_id')) != current_user_id:
            return jsonify({'error': 'Only the teacher can accept this request'}), 403
        
        if request_data.get('status') != 'pending':
            return jsonify({'error': f'Request is already {request_data.get("status")}'}), 400
        
        # Update request status
        db.enrollment_requests.update_one(
            {'_id': ObjectId(request_id)},
            {'$set': {
                'status': 'approved',
                'updated_at': datetime.utcnow()
            }}
        )
        
        # ✅ Create a match/session with subject-wise fee
        match_data = {
            'teacher_id': request_data['teacher_id'],
            'student_id': request_data['student_id'],
            'subject': request_data.get('subject', 'General'),
            'learning_mode': request_data.get('learning_mode', 'online'),
            'preferred_schedule': request_data.get('preferred_schedule', ''),
            'fee': request_data.get('fee', ''),  # ✅ UPDATED: Subject-wise fee
            'subject_fees': request_data.get('subject_fees', []),  # ✅ NEW: All subject-wise fees
            'status': 'active',
            'created_at': datetime.utcnow()
        }
        
        result = db.matches_collection.insert_one(match_data)
        
        # ✅ ========== CREATE NOTIFICATION FOR STUDENT ==========
        teacher = db.users_collection.find_one({'_id': ObjectId(current_user_id)})
        teacher_name = teacher.get('name', 'Teacher') if teacher else 'Teacher'
        
        fee_display = request_data.get('fee', '')
        fee_text = f" (Rs. {fee_display}/month)" if fee_display else ""
        
        notification = {
            'sender_id': ObjectId(current_user_id),
            'receiver_id': ObjectId(request_data['student_id']),
            'type': 'request_accepted',
            'title': '✅ Enrollment Accepted!',
            'message': f'{teacher_name} has accepted your enrollment request for {request_data.get("subject", "the course")}{fee_text}.',
            'request_id': ObjectId(request_id),
            'read': False,
            'created_at': datetime.utcnow()
        }
        db.notifications_collection.insert_one(notification)
        print(f"✅ Notification sent to Student (ID: {request_data['student_id']})")
        # ========================================================
        
        return jsonify({
            'success': True,
            'message': 'Request accepted successfully',
            'match_id': str(result.inserted_id)
        }), 200
        
    except Exception as e:
        print(f"❌ Error in accept_enrollment_request: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500


# ============================================================
# ✅ REJECT ENROLLMENT REQUEST
# ============================================================
@enrollment_bp.route('/request/<request_id>/reject', methods=['PUT'])
@jwt_required()
def reject_enrollment_request(request_id):
    try:
        current_user_id = get_jwt_identity()
        
        if not ObjectId.is_valid(request_id):
            return jsonify({'error': 'Invalid request ID'}), 400
        
        request_data = db.enrollment_requests.find_one({
            '_id': ObjectId(request_id)
        })
        
        if not request_data:
            return jsonify({'error': 'Request not found'}), 404
        
        # Only teacher can reject
        if str(request_data.get('teacher_id')) != current_user_id:
            return jsonify({'error': 'Only the teacher can reject this request'}), 403
        
        if request_data.get('status') != 'pending':
            return jsonify({'error': f'Request is already {request_data.get("status")}'}), 400
        
        db.enrollment_requests.update_one(
            {'_id': ObjectId(request_id)},
            {'$set': {
                'status': 'rejected',
                'updated_at': datetime.utcnow()
            }}
        )
        
        # ✅ ========== CREATE NOTIFICATION FOR STUDENT ==========
        teacher = db.users_collection.find_one({'_id': ObjectId(current_user_id)})
        teacher_name = teacher.get('name', 'Teacher') if teacher else 'Teacher'
        
        notification = {
            'sender_id': ObjectId(current_user_id),
            'receiver_id': ObjectId(request_data['student_id']),
            'type': 'request_rejected',
            'title': '❌ Request Rejected',
            'message': f'{teacher_name} has declined your enrollment request for {request_data.get("subject", "the course")}.',
            'request_id': ObjectId(request_id),
            'read': False,
            'created_at': datetime.utcnow()
        }
        db.notifications_collection.insert_one(notification)
        print(f"✅ Notification sent to Student (ID: {request_data['student_id']})")
        # ========================================================
        
        return jsonify({
            'success': True,
            'message': 'Request rejected successfully'
        }), 200
        
    except Exception as e:
        print(f"❌ Error in reject_enrollment_request: {e}")
        return jsonify({'error': str(e)}), 500


# ============================================================
# ✅ CANCEL ENROLLMENT REQUEST
# ============================================================
@enrollment_bp.route('/request/<request_id>/cancel', methods=['PUT'])
@jwt_required()
def cancel_enrollment_request(request_id):
    try:
        current_user_id = get_jwt_identity()
        
        if not ObjectId.is_valid(request_id):
            return jsonify({'error': 'Invalid request ID'}), 400
        
        request_data = db.enrollment_requests.find_one({
            '_id': ObjectId(request_id)
        })
        
        if not request_data:
            return jsonify({'error': 'Request not found'}), 404
        
        # Only student can cancel
        if str(request_data.get('student_id')) != current_user_id:
            return jsonify({'error': 'Only the student can cancel this request'}), 403
        
        if request_data.get('status') != 'pending':
            return jsonify({'error': f'Cannot cancel - request is already {request_data.get("status")}'}), 400
        
        db.enrollment_requests.update_one(
            {'_id': ObjectId(request_id)},
            {'$set': {
                'status': 'cancelled',
                'updated_at': datetime.utcnow()
            }}
        )
        
        # ✅ ========== CREATE NOTIFICATION FOR STUDENT ==========
        notification = {
            'sender_id': ObjectId(current_user_id),
            'receiver_id': ObjectId(current_user_id),
            'type': 'request_cancelled',
            'title': '⚠️ Request Cancelled',
            'message': f'You cancelled your enrollment request for {request_data.get("subject", "the course")}.',
            'request_id': ObjectId(request_id),
            'read': False,
            'created_at': datetime.utcnow()
        }
        db.notifications_collection.insert_one(notification)
        print(f"✅ Notification sent to Student (ID: {current_user_id})")
        # ========================================================
        
        return jsonify({
            'success': True,
            'message': 'Request cancelled successfully'
        }), 200
        
    except Exception as e:
        print(f"❌ Error in cancel_enrollment_request: {e}")
        return jsonify({'error': str(e)}), 500


# ============================================================
# ✅ GET STUDENT ENROLLMENT REQUESTS
# ============================================================
@enrollment_bp.route('/requests/student', methods=['GET'])
@jwt_required()
def get_student_requests():
    try:
        current_user_id = get_jwt_identity()
        requests = list(db.enrollment_requests.find({
            'student_id': current_user_id
        }).sort('created_at', -1))

        # ✅ Get teacher profile pictures for each request
        for req in requests:
            req['_id'] = str(req['_id'])
            req['teacher_id'] = str(req['teacher_id'])
            req['student_id'] = str(req['student_id'])
            
            # ✅ Fetch teacher profile picture
            teacher_profile = db.teacher_profiles.find_one({
                '$or': [
                    {'_user_id': ObjectId(req['teacher_id'])},
                    {'user_id': ObjectId(req['teacher_id'])}
                ]
            })
            if teacher_profile:
                req['teacher_profile_picture'] = teacher_profile.get('_profile_picture', '') or teacher_profile.get('profile_picture', '')
                req['teacher_location'] = teacher_profile.get('_location', '') or teacher_profile.get('location', '')
                req['teacher_qualification'] = teacher_profile.get('_qualification', '') or teacher_profile.get('qualification', '')
            else:
                req['teacher_profile_picture'] = ''
                req['teacher_location'] = ''
                req['teacher_qualification'] = ''

        return jsonify({
            'success': True,
            'requests': requests
        }), 200

    except Exception as e:
        print(f"❌ Error in get_student_requests: {e}")
        return jsonify({'error': str(e)}), 500


# ============================================================
# ✅ GET TEACHER ENROLLMENT REQUESTS
# ============================================================
@enrollment_bp.route('/requests/teacher', methods=['GET'])
@jwt_required()
def get_teacher_requests():
    try:
        current_user_id = get_jwt_identity()
        
        requests = list(db.enrollment_requests.find({
            'teacher_id': current_user_id
        }).sort('created_at', -1))

        # ✅ Get student profile pictures for each request
        for req in requests:
            req['_id'] = str(req['_id'])
            req['teacher_id'] = str(req['teacher_id'])
            req['student_id'] = str(req['student_id'])
            
            # ✅ Fetch student profile picture
            student_profile = db.student_profiles.find_one({
                '$or': [
                    {'_user_id': ObjectId(req['student_id'])},
                    {'user_id': ObjectId(req['student_id'])}
                ]
            })
            if student_profile:
                req['student_profile_picture'] = student_profile.get('_profile_picture', '') or student_profile.get('profile_picture', '')
                req['student_location'] = student_profile.get('_location', '') or student_profile.get('location', '')
                req['student_education'] = student_profile.get('_education_level', '') or student_profile.get('education_level', '')
            else:
                req['student_profile_picture'] = ''
                req['student_location'] = ''
                req['student_education'] = ''

        return jsonify({
            'success': True,
            'requests': requests
        }), 200

    except Exception as e:
        print(f"❌ Error in get_teacher_requests: {e}")
        return jsonify({'error': str(e)}), 500


# ============================================================
# ✅ GET SINGLE ENROLLMENT REQUEST
# ============================================================
@enrollment_bp.route('/request/<request_id>', methods=['GET'])
@jwt_required()
def get_enrollment_request(request_id):
    try:
        current_user_id = get_jwt_identity()
        
        if not ObjectId.is_valid(request_id):
            return jsonify({'error': 'Invalid request ID'}), 400
        
        request_data = db.enrollment_requests.find_one({
            '_id': ObjectId(request_id)
        })
        
        if not request_data:
            return jsonify({'error': 'Request not found'}), 404
        
        # Check authorization
        if str(request_data.get('teacher_id')) != current_user_id and \
           str(request_data.get('student_id')) != current_user_id:
            return jsonify({'error': 'Unauthorized'}), 403
        
        request_data['_id'] = str(request_data['_id'])
        request_data['teacher_id'] = str(request_data['teacher_id'])
        request_data['student_id'] = str(request_data['student_id'])
        
        return jsonify({
            'success': True,
            'request': request_data
        }), 200
        
    except Exception as e:
        print(f"❌ Error in get_enrollment_request: {e}")
        return jsonify({'error': str(e)}), 500


# ============================================================
# ✅ GET TEACHER PROFILE WITH SCHEDULES - UPDATED
# ============================================================
@enrollment_bp.route('/teacher-profile/<teacher_id>', methods=['GET'])
@jwt_required()
def get_teacher_profile_with_schedules(teacher_id):
    try:
        print(f"🔍 Fetching teacher profile for ID: {teacher_id}")
        
        if not ObjectId.is_valid(teacher_id):
            return jsonify({'error': 'Invalid teacher ID'}), 400
            
        teacher = db.users_collection.find_one({'_id': ObjectId(teacher_id)})
        if not teacher:
            print(f"❌ Teacher user not found for ID: {teacher_id}")
            return jsonify({'error': 'Teacher not found'}), 404
        
        print(f"✅ Teacher user found: {teacher.get('name', 'Unknown')}")
        
        profile = db.teacher_profiles.find_one({
            '$or': [
                {'_user_id': ObjectId(teacher_id)},
                {'user_id': ObjectId(teacher_id)}
            ]
        })
        
        if not profile:
            print(f"❌ Teacher profile not found for user: {teacher_id}")
            return jsonify({'error': 'Teacher profile not found'}), 404

        print(f"✅ Teacher profile found")
        
        # ✅ Get reviews and rating
        reviews = list(db.reviews_collection.find({'teacher_id': ObjectId(teacher['_id'])}))
        avg_rating = 0
        if reviews:
            avg_rating = sum(r.get('rating', 0) for r in reviews) / len(reviews)

        # ✅ Get schedules from teacher profile
        schedules = profile.get('_schedules', []) or profile.get('schedules', [])
        
        formatted_schedules = []
        if schedules and len(schedules) > 0:
            for schedule in schedules:
                days = schedule.get('days', [])
                start_time = schedule.get('start_time', '')
                end_time = schedule.get('end_time', '')
                
                if days and start_time and end_time:
                    days_str = ' • '.join(days[:3])
                    if len(days) > 3:
                        days_str += f' +{len(days) - 3} more'
                    
                    formatted_schedules.append({
                        'day': days_str,
                        'time': f'{start_time} - {end_time}',
                        'display': f'{days_str} | {start_time} - {end_time}'
                    })
        
        # ✅ UPDATED: Flexible Timing message
        if not formatted_schedules:
            formatted_schedules.append({
                'day': 'Flexible',
                'time': 'Flexible',
                'display': 'Flexible Timing - Schedule will be finalized after enrollment.'
            })

        # ✅ FIX: Get teaching_mode with multiple fallbacks
        teaching_mode = profile.get('_teaching_mode', '')
        if not teaching_mode:
            teaching_mode = profile.get('teaching_mode', '')
        if not teaching_mode:
            teaching_mode = profile.get('_learning_mode', '')
        if not teaching_mode:
            teaching_mode = 'online'
        
        print(f"📌 Teaching Mode from DB: '{teaching_mode}'")

        # ✅ UPDATED: Get subject-wise fees
        subjects_raw = profile.get('_subjects', []) or profile.get('subjects', [])
        subject_fees = []
        teacher_subjects = []
        
        if subjects_raw and isinstance(subjects_raw, list):
            if subjects_raw and isinstance(subjects_raw[0], dict):
                # New format: [{subject: 'Math', fee: 5000}]
                subject_fees = subjects_raw
                teacher_subjects = [s.get('subject', '') for s in subjects_raw if isinstance(s, dict)]
            else:
                # Old format: ['Math', 'Physics']
                teacher_subjects = subjects_raw
                subject_fees = [{'subject': s, 'fee': 0} for s in subjects_raw]
        
        print(f"📌 Subject Fees: {subject_fees}")

        # ✅ PUBLIC INFORMATION ONLY
        teacher_data = {
            '_id': str(profile['_id']),
            'user_id': str(teacher['_id']),
            'name': profile.get('_name', '') or profile.get('name', 'Unknown Teacher'),
            'profile_picture': profile.get('_profile_picture', '') or profile.get('profile_picture', ''),
            'qualification': profile.get('_qualification', '') or profile.get('qualification', ''),
            'experience': profile.get('_experience', '') or profile.get('experience', ''),
            'subjects': teacher_subjects,  # ✅ UPDATED: Subject names only
            'subject_fees': subject_fees,  # ✅ NEW: Subject-wise fees
            'teaching_mode': teaching_mode,
            'location': profile.get('_location', '') or profile.get('location', ''),
            'bio': profile.get('_bio', '') or profile.get('bio', ''),
            'rating': round(avg_rating, 1),
            'reviews_count': len(reviews),
            'schedules': formatted_schedules,
            'isProfileComplete': profile.get('_isProfileComplete', False) or profile.get('isProfileComplete', False)
        }

        print(f"✅ Returning teacher: {teacher_data['name']} with {len(formatted_schedules)} schedules")
        print(f"✅ Teaching Mode in response: '{teacher_data['teaching_mode']}'")
        print(f"✅ Subject Fees: {teacher_data['subject_fees']}")
        
        return jsonify({
            'success': True,
            'teacher': teacher_data
        }), 200

    except Exception as e:
        print(f"❌ Error in get_teacher_profile_with_schedules: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500


# ============================================================
# ✅ GET STUDENT PROFILE (FOR TEACHER REVIEW)
# ============================================================
@enrollment_bp.route('/student-profile/<student_id>', methods=['GET'])
@jwt_required()
def get_student_profile_for_teacher(student_id):
    try:
        current_user_id = get_jwt_identity()
        
        if not ObjectId.is_valid(student_id):
            return jsonify({'error': 'Invalid student ID'}), 400
        
        # Check if user is teacher
        user = db.users_collection.find_one({'_id': ObjectId(current_user_id)})
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        # Check if current user is a teacher
        teacher_profile = db.teacher_profiles.find_one({
            '$or': [
                {'_user_id': ObjectId(current_user_id)},
                {'user_id': ObjectId(current_user_id)}
            ]
        })
        
        if not teacher_profile:
            return jsonify({'error': 'Only teachers can view student profiles'}), 403
        
        student_user = db.users_collection.find_one({'_id': ObjectId(student_id)})
        if not student_user:
            return jsonify({'error': 'Student not found'}), 404
        
        student_profile = db.student_profiles.find_one({
            '$or': [
                {'_user_id': ObjectId(student_id)},
                {'user_id': ObjectId(student_id)}
            ]
        })
        
        if not student_profile:
            return jsonify({'error': 'Student profile not found'}), 404
        
        # Return public information
        return jsonify({
            'success': True,
            'student': {
                '_id': str(student_profile['_id']),
                'user_id': str(student_id),
                'name': student_profile.get('_name', '') or student_profile.get('name', 'Unknown'),
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
                'isProfileComplete': student_profile.get('_isProfileComplete', False) or student_profile.get('isProfileComplete', False)
            }
        }), 200
        
    except Exception as e:
        print(f"❌ Error in get_student_profile_for_teacher: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500


# ============================================================
# ✅ GET REQUEST STATUS FOR STUDENT (NOV 2026)
# ============================================================
@enrollment_bp.route('/request/status/<teacher_id>', methods=['GET'])
@jwt_required()
def get_request_status(teacher_id):
    """
    Get the status of a student's request for a specific teacher
    Used to show "Pending" / "Approved" / "Rejected" on teacher profile page
    """
    try:
        current_user_id = get_jwt_identity()
        
        if not ObjectId.is_valid(teacher_id):
            return jsonify({'error': 'Invalid teacher ID'}), 400
        
        # Find request for this student and teacher
        request_data = db.enrollment_requests.find_one({
            'student_id': current_user_id,
            'teacher_id': teacher_id
        })
        
        if not request_data:
            return jsonify({
                'success': True,
                'has_request': False,
                'status': None
            }), 200
        
        return jsonify({
            'success': True,
            'has_request': True,
            'status': request_data.get('status', 'pending'),
            'request_id': str(request_data['_id'])
        }), 200
        
    except Exception as e:
        print(f"❌ Error in get_request_status: {e}")
        return jsonify({'error': str(e)}), 500
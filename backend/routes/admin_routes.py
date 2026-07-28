from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from bson import ObjectId
from datetime import datetime, timedelta
from config.database import db

# ✅ Define blueprint
admin_bp = Blueprint('admin', __name__, url_prefix='/api/admin')


# ============================================================
# ✅ CHECK ADMIN (Helper Function)
# ============================================================
def check_admin(user_id):
    """Check if user is admin"""
    user = db.users_collection.find_one({'_id': ObjectId(user_id)})
    if not user or user.get('role') != 'admin':
        return False
    return True


# ============================================================
# ✅ GET ALL USERS (Admin Only)
# ============================================================
@admin_bp.route('/users', methods=['GET'])
@jwt_required()
def get_all_users():
    try:
        current_user_id = get_jwt_identity()
        
        user = db.users_collection.find_one({'_id': ObjectId(current_user_id)})
        if not user or user.get('role') != 'admin':
            return jsonify({'error': 'Unauthorized - Admin access required'}), 403
        
        users = list(db.users_collection.find({}, {'password': 0}))
        for u in users:
            u['_id'] = str(u['_id'])
        
        return jsonify({
            'success': True,
            'users': users,
            'count': len(users)
        }), 200
        
    except Exception as e:
        print(f"❌ Error in get_all_users: {e}")
        return jsonify({'error': str(e)}), 500


# ============================================================
# ✅ GET ALL ENROLLMENT REQUESTS (Admin Only)
# ============================================================
@admin_bp.route('/enrollment-requests', methods=['GET'])
@jwt_required()
def get_all_enrollment_requests():
    try:
        current_user_id = get_jwt_identity()
        
        user = db.users_collection.find_one({'_id': ObjectId(current_user_id)})
        if not user or user.get('role') != 'admin':
            return jsonify({'error': 'Unauthorized - Admin access required'}), 403
        
        requests = list(db.enrollment_requests.find().sort('created_at', -1))
        for req in requests:
            req['_id'] = str(req['_id'])
            req['student_id'] = str(req['student_id'])
            req['teacher_id'] = str(req['teacher_id'])
        
        return jsonify({
            'success': True,
            'requests': requests,
            'count': len(requests)
        }), 200
        
    except Exception as e:
        print(f"❌ Error in get_all_enrollment_requests: {e}")
        return jsonify({'error': str(e)}), 500


# ============================================================
# ✅ DELETE USER (Admin Only)
# ============================================================
@admin_bp.route('/users/<user_id>', methods=['DELETE'])
@jwt_required()
def delete_user(user_id):
    try:
        current_user_id = get_jwt_identity()
        
        user = db.users_collection.find_one({'_id': ObjectId(current_user_id)})
        if not user or user.get('role') != 'admin':
            return jsonify({'error': 'Unauthorized - Admin access required'}), 403
        
        if user_id == current_user_id:
            return jsonify({'error': 'Cannot delete your own account'}), 400
        
        result = db.users_collection.delete_one({'_id': ObjectId(user_id)})
        if result.deleted_count == 0:
            return jsonify({'error': 'User not found'}), 404
        
        db.student_profiles.delete_one({'user_id': ObjectId(user_id)})
        db.teacher_profiles.delete_one({'user_id': ObjectId(user_id)})
        
        return jsonify({
            'success': True,
            'message': 'User deleted successfully'
        }), 200
        
    except Exception as e:
        print(f"❌ Error in delete_user: {e}")
        return jsonify({'error': str(e)}), 500


# ============================================================
# ✅ GET DASHBOARD STATS (Admin Only)
# ============================================================
@admin_bp.route('/stats', methods=['GET'])
@jwt_required()
def get_admin_stats():
    try:
        current_user_id = get_jwt_identity()
        
        user = db.users_collection.find_one({'_id': ObjectId(current_user_id)})
        if not user or user.get('role') != 'admin':
            return jsonify({'error': 'Unauthorized - Admin access required'}), 403
        
        total_users = db.users_collection.count_documents({})
        total_students = db.users_collection.count_documents({'role': 'student'})
        total_teachers = db.users_collection.count_documents({'role': 'teacher'})
        total_requests = db.enrollment_requests.count_documents({})
        pending_requests = db.enrollment_requests.count_documents({'status': 'pending'})
        approved_requests = db.enrollment_requests.count_documents({'status': 'approved'})
        rejected_requests = db.enrollment_requests.count_documents({'status': 'rejected'})
        
        return jsonify({
            'success': True,
            'stats': {
                'total_users': total_users,
                'total_students': total_students,
                'total_teachers': total_teachers,
                'total_requests': total_requests,
                'pending_requests': pending_requests,
                'approved_requests': approved_requests,
                'rejected_requests': rejected_requests
            }
        }), 200
        
    except Exception as e:
        print(f"❌ Error in get_admin_stats: {e}")
        return jsonify({'error': str(e)}), 500


# ============================================================
# ✅ ADMIN DASHBOARD - Complete Dashboard Data
# ============================================================
@admin_bp.route('/dashboard', methods=['GET'])
@jwt_required()
def admin_dashboard():
    try:
        current_user_id = get_jwt_identity()
        
        if not check_admin(current_user_id):
            return jsonify({'error': 'Unauthorized - Admin access required'}), 403
        
        # ========== STATISTICS ==========
        total_students = db.users_collection.count_documents({'role': 'student'})
        total_teachers = db.users_collection.count_documents({'role': 'teacher'})
        active_enrollments = db.matches_collection.count_documents({'status': 'active'})
        pending_payments = db.payments_collection.count_documents({'status': 'pending'})
        pending_requests = db.enrollment_requests.count_documents({'status': 'pending'})
        
        paid_payments = db.payments_collection.find({'status': {'$in': ['paid', 'approved']}})
        total_revenue = sum(p.get('amount', 0) for p in paid_payments)
        
        stats = {
            'totalStudents': total_students,
            'totalTeachers': total_teachers,
            'activeEnrollments': active_enrollments,
            'pendingPayments': pending_payments,
            'totalRevenue': total_revenue,
            'pendingRequests': pending_requests
        }
        
        # ========== ANALYTICS ==========
        total_payments = db.payments_collection.count_documents({})
        paid = db.payments_collection.count_documents({'status': {'$in': ['paid', 'approved']}})
        pending = db.payments_collection.count_documents({'status': 'pending'})
        rejected = db.payments_collection.count_documents({'status': 'rejected'})
        
        payment_status = {'paid': paid, 'pending': pending, 'rejected': rejected}
        
        monthly_enrollments = []
        for i in range(5, -1, -1):
            month_date = datetime.utcnow() - timedelta(days=30*i)
            month_name = month_date.strftime('%b')
            start = month_date.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
            end = (start.replace(day=28) + timedelta(days=4)).replace(day=1) - timedelta(seconds=1)
            
            count = db.matches_collection.count_documents({
                'created_at': {'$gte': start, '$lte': end}
            })
            monthly_enrollments.append({'month': month_name, 'count': count})
        
        analytics = {
            'studentsVsTeachers': {
                'students': total_students,
                'teachers': total_teachers
            },
            'monthlyEnrollments': monthly_enrollments,
            'paymentStatus': payment_status
        }
        
        # ========== RECENT ACTIVITY ==========
        recent_activity = []
        
        latest_matches = db.matches_collection.find().sort('created_at', -1).limit(3)
        for m in latest_matches:
            student = None
            if m.get('student_id'):
                try:
                    student = db.users_collection.find_one({'_id': ObjectId(m['student_id'])})
                except:
                    pass
            recent_activity.append({
                'type': 'enrollment_accepted',
                'message': f"{student.get('name', 'Student') if student else 'Student'} enrolled in {m.get('subject', 'course')}",
                'timestamp': m.get('created_at')
            })
        
        latest_payments = db.payments_collection.find().sort('created_at', -1).limit(3)
        for p in latest_payments:
            if p.get('status') in ['approved', 'paid']:
                student = None
                if p.get('student_id'):
                    try:
                        student = db.users_collection.find_one({'_id': ObjectId(p['student_id'])})
                    except:
                        pass
                recent_activity.append({
                    'type': 'payment_approved',
                    'message': f"{student.get('name', 'Student') if student else 'Student'} paid Rs. {p.get('amount', 0)}",
                    'timestamp': p.get('created_at')
                })
        
        recent_activity.sort(key=lambda x: x.get('timestamp', datetime.utcnow()), reverse=True)
        recent_activity = recent_activity[:5]
        
        # ========== LATEST STUDENTS (FIXED) ==========
        latest_students = list(db.users_collection.find(
            {'role': 'student'},
            {'password': 0}
        ).sort('created_at', -1).limit(5))
        
        for s in latest_students:
            s['_id'] = str(s['_id'])
            profile = db.student_profiles.find_one({
                '$or': [{'user_id': ObjectId(s['_id'])}, {'_user_id': ObjectId(s['_id'])}]
            })
            
            s['learning_mode'] = profile.get('_learning_mode', 'online') if profile else 'online'
            
            # ✅ FIXED: Get location from multiple possible fields
            if profile:
                s['location'] = profile.get('_location') or profile.get('location') or profile.get('_area') or profile.get('area') or ''
            else:
                s['location'] = ''
            
            # ✅ Also set area field for AdminDashboard.jsx
            s['area'] = s['location']
            s['student_location'] = s['location']
            
            s['status'] = 'active' if s.get('isActive', True) else 'inactive'
            
            subjects_raw = profile.get('_subjects', []) if profile else []
            if subjects_raw and isinstance(subjects_raw[0], dict):
                s['subjects'] = [sub.get('subject', '') for sub in subjects_raw]
            else:
                s['subjects'] = subjects_raw
            
            s['profile_picture'] = profile.get('_profile_picture', '') or profile.get('profile_picture', '') if profile else ''
        
        # ========== LATEST TEACHERS ==========
        latest_teachers = list(db.users_collection.find(
            {'role': 'teacher'},
            {'password': 0}
        ).sort('created_at', -1).limit(5))
        
        for t in latest_teachers:
            t['_id'] = str(t['_id'])
            profile = db.teacher_profiles.find_one({
                '$or': [{'user_id': ObjectId(t['_id'])}, {'_user_id': ObjectId(t['_id'])}]
            })
            
            subjects_raw = profile.get('_subjects', []) or profile.get('subjects', []) if profile else []
            if subjects_raw and isinstance(subjects_raw[0], dict):
                t['subjects'] = [s.get('subject', '') for s in subjects_raw if isinstance(s, dict)]
            else:
                t['subjects'] = subjects_raw
            
            t['teaching_mode'] = profile.get('_teaching_mode', 'online') if profile else 'online'
            t['location'] = profile.get('_location', '') if profile else ''
            t['area'] = t['location']
            t['status'] = 'active' if t.get('isActive', True) else 'inactive'
            t['profile_picture'] = profile.get('_profile_picture', '') or profile.get('profile_picture', '') if profile else ''
        
        # ========== PENDING PAYMENTS ==========
        pending_payments_list = list(db.payments_collection.find(
            {'status': 'pending'}
        ).sort('created_at', -1).limit(5))
        
        for p in pending_payments_list:
            p['_id'] = str(p['_id'])
            p['student_id'] = str(p['student_id'])
            p['teacher_id'] = str(p['teacher_id'])
            
            student = db.users_collection.find_one({'_id': ObjectId(p['student_id'])})
            teacher = db.users_collection.find_one({'_id': ObjectId(p['teacher_id'])})
            p['student_name'] = student.get('name', 'Student') if student else 'Student'
            p['teacher_name'] = teacher.get('name', 'Teacher') if teacher else 'Teacher'
            
            amount = p.get('amount', 0)
            if isinstance(amount, dict):
                p['amount'] = amount.get('amount') or amount.get('budget') or amount.get('value') or 0
            else:
                p['amount'] = float(amount) if amount else 0
        
        # ========== PENDING REQUESTS ==========
        pending_requests_list = list(db.enrollment_requests.find(
            {'status': 'pending'}
        ).sort('created_at', -1).limit(5))
        
        for r in pending_requests_list:
            r['_id'] = str(r['_id'])
            r['student_id'] = str(r['student_id'])
            r['teacher_id'] = str(r['teacher_id'])
            
            student = db.users_collection.find_one({'_id': ObjectId(r['student_id'])})
            teacher = db.users_collection.find_one({'_id': ObjectId(r['teacher_id'])})
            r['student_name'] = student.get('name', 'Student') if student else 'Student'
            r['teacher_name'] = teacher.get('name', 'Teacher') if teacher else 'Teacher'
            
            if isinstance(r.get('subject'), dict):
                r['subject'] = r['subject'].get('subject', 'General')
        
        return jsonify({
            'success': True,
            'stats': stats,
            'analytics': analytics,
            'recentActivity': recent_activity,
            'latestStudents': latest_students,
            'latestTeachers': latest_teachers,
            'pendingPayments': pending_payments_list,
            'pendingRequests': pending_requests_list
        }), 200
        
    except Exception as e:
        print(f"❌ Error in admin_dashboard: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500


# ============================================================
# ✅ GET ALL TEACHERS (Admin Only)
# ============================================================
@admin_bp.route('/teachers', methods=['GET'])
@jwt_required()
def admin_get_teachers():
    try:
        current_user_id = get_jwt_identity()
        
        if not check_admin(current_user_id):
            return jsonify({'error': 'Unauthorized - Admin access required'}), 403
        
        teachers = list(db.users_collection.find(
            {'role': 'teacher'},
            {'password': 0}
        ).sort('created_at', -1))
        
        result = []
        for t in teachers:
            t['_id'] = str(t['_id'])
            profile = db.teacher_profiles.find_one({
                '$or': [{'user_id': ObjectId(t['_id'])}, {'_user_id': ObjectId(t['_id'])}]
            })
            
            reviews = list(db.reviews_collection.find({'teacher_id': ObjectId(t['_id'])}))
            avg_rating = 0
            if reviews:
                avg_rating = sum(r.get('rating', 0) for r in reviews) / len(reviews)
            
            subjects_raw = profile.get('_subjects', []) or profile.get('subjects', []) if profile else []
            if subjects_raw and isinstance(subjects_raw[0], dict):
                subject_names = [s.get('subject', '') for s in subjects_raw if isinstance(s, dict)]
            else:
                subject_names = subjects_raw
            
            result.append({
                '_id': t['_id'],
                'name': t.get('name', 'Unknown'),
                'email': t.get('email', ''),
                'subjects': subject_names,
                'teaching_mode': profile.get('_teaching_mode', 'online') if profile else 'online',
                'location': profile.get('_location', '') if profile else '',
                'experience': profile.get('_experience', '') if profile else '',
                'qualification': profile.get('_qualification', '') if profile else '',
                'rating': round(avg_rating, 1),
                'status': 'active' if t.get('isActive', True) else 'inactive',
                'joined': t.get('created_at', datetime.utcnow())
            })
        
        return jsonify({
            'success': True,
            'teachers': result,
            'count': len(result)
        }), 200
        
    except Exception as e:
        print(f"❌ Error in admin_get_teachers: {e}")
        return jsonify({'error': str(e)}), 500


# ============================================================
# ✅ GET ALL STUDENTS (Admin Only)
# ============================================================
@admin_bp.route('/students', methods=['GET'])
@jwt_required()
def admin_get_students():
    try:
        current_user_id = get_jwt_identity()
        
        if not check_admin(current_user_id):
            return jsonify({'error': 'Unauthorized - Admin access required'}), 403
        
        students = list(db.users_collection.find(
            {'role': 'student'},
            {'password': 0}
        ).sort('created_at', -1))
        
        result = []
        for s in students:
            s['_id'] = str(s['_id'])
            profile = db.student_profiles.find_one({
                '$or': [{'user_id': ObjectId(s['_id'])}, {'_user_id': ObjectId(s['_id'])}]
            })
            
            enrollments = db.matches_collection.count_documents({
                'student_id': s['_id'],
                'status': 'active'
            })
            
            subjects_raw = profile.get('_subjects', []) or profile.get('subjects', []) if profile else []
            if subjects_raw and isinstance(subjects_raw[0], dict):
                subject_names = [s.get('subject', '') for s in subjects_raw if isinstance(s, dict)]
            else:
                subject_names = subjects_raw
            
            completion = 20
            if profile:
                fields = ['name', 'email', 'phone', 'location', 'education_level', 'subjects', 'learning_mode']
                completed = sum(1 for f in fields if profile.get(f))
                completion = min(100, 20 + (completed / len(fields)) * 80)
            
            result.append({
                '_id': s['_id'],
                'name': s.get('name', 'Unknown'),
                'email': s.get('email', ''),
                'phone': profile.get('_phone', '') if profile else '',
                'subjects': subject_names,
                'learning_mode': profile.get('_learning_mode', 'online') if profile else 'online',
                'location': profile.get('_location', '') if profile else '',
                'education_level': profile.get('_education_level', '') if profile else '',
                'profile_completion': round(completion),
                'enrollments': enrollments,
                'status': 'active' if s.get('isActive', True) else 'inactive',
                'joined': s.get('created_at', datetime.utcnow())
            })
        
        return jsonify({
            'success': True,
            'students': result,
            'count': len(result)
        }), 200
        
    except Exception as e:
        print(f"❌ Error in admin_get_students: {e}")
        return jsonify({'error': str(e)}), 500


# ============================================================
# ✅ SUSPEND STUDENT (Admin Only)
# ============================================================
@admin_bp.route('/students/<student_id>/suspend', methods=['PUT'])
@jwt_required()
def admin_suspend_student(student_id):
    try:
        current_user_id = get_jwt_identity()
        
        if not check_admin(current_user_id):
            return jsonify({'error': 'Unauthorized - Admin access required'}), 403
        
        if not ObjectId.is_valid(student_id):
            return jsonify({'error': 'Invalid student ID'}), 400
        
        result = db.users_collection.update_one(
            {'_id': ObjectId(student_id), 'role': 'student'},
            {'$set': {'isActive': False, 'updated_at': datetime.utcnow()}}
        )
        
        if result.modified_count == 0:
            return jsonify({'error': 'Student not found'}), 404
        
        return jsonify({
            'success': True,
            'message': 'Student suspended successfully'
        }), 200
        
    except Exception as e:
        print(f"❌ Error in admin_suspend_student: {e}")
        return jsonify({'error': str(e)}), 500


# ============================================================
# ✅ ACTIVATE STUDENT (Admin Only)
# ============================================================
@admin_bp.route('/students/<student_id>/activate', methods=['PUT'])
@jwt_required()
def admin_activate_student(student_id):
    try:
        current_user_id = get_jwt_identity()
        
        if not check_admin(current_user_id):
            return jsonify({'error': 'Unauthorized - Admin access required'}), 403
        
        if not ObjectId.is_valid(student_id):
            return jsonify({'error': 'Invalid student ID'}), 400
        
        result = db.users_collection.update_one(
            {'_id': ObjectId(student_id), 'role': 'student'},
            {'$set': {'isActive': True, 'updated_at': datetime.utcnow()}}
        )
        
        if result.modified_count == 0:
            return jsonify({'error': 'Student not found'}), 404
        
        return jsonify({
            'success': True,
            'message': 'Student activated successfully'
        }), 200
        
    except Exception as e:
        print(f"❌ Error in admin_activate_student: {e}")
        return jsonify({'error': str(e)}), 500


# ============================================================
# ✅ SUSPEND TEACHER (Admin Only)
# ============================================================
@admin_bp.route('/teachers/<teacher_id>/suspend', methods=['PUT'])
@jwt_required()
def admin_suspend_teacher(teacher_id):
    try:
        current_user_id = get_jwt_identity()
        
        if not check_admin(current_user_id):
            return jsonify({'error': 'Unauthorized - Admin access required'}), 403
        
        if not ObjectId.is_valid(teacher_id):
            return jsonify({'error': 'Invalid teacher ID'}), 400
        
        result = db.users_collection.update_one(
            {'_id': ObjectId(teacher_id), 'role': 'teacher'},
            {'$set': {'isActive': False, 'updated_at': datetime.utcnow()}}
        )
        
        if result.modified_count == 0:
            return jsonify({'error': 'Teacher not found'}), 404
        
        return jsonify({
            'success': True,
            'message': 'Teacher suspended successfully'
        }), 200
        
    except Exception as e:
        print(f"❌ Error in admin_suspend_teacher: {e}")
        return jsonify({'error': str(e)}), 500


# ============================================================
# ✅ ACTIVATE TEACHER (Admin Only)
# ============================================================
@admin_bp.route('/teachers/<teacher_id>/activate', methods=['PUT'])
@jwt_required()
def admin_activate_teacher(teacher_id):
    try:
        current_user_id = get_jwt_identity()
        
        if not check_admin(current_user_id):
            return jsonify({'error': 'Unauthorized - Admin access required'}), 403
        
        if not ObjectId.is_valid(teacher_id):
            return jsonify({'error': 'Invalid teacher ID'}), 400
        
        result = db.users_collection.update_one(
            {'_id': ObjectId(teacher_id), 'role': 'teacher'},
            {'$set': {'isActive': True, 'updated_at': datetime.utcnow()}}
        )
        
        if result.modified_count == 0:
            return jsonify({'error': 'Teacher not found'}), 404
        
        return jsonify({
            'success': True,
            'message': 'Teacher activated successfully'
        }), 200
        
    except Exception as e:
        print(f"❌ Error in admin_activate_teacher: {e}")
        return jsonify({'error': str(e)}), 500


# ============================================================
# ✅ GET ALL PAYMENTS (Admin Only)
# ============================================================
@admin_bp.route('/payments', methods=['GET'])
@jwt_required()
def admin_get_payments():
    try:
        current_user_id = get_jwt_identity()
        
        if not check_admin(current_user_id):
            return jsonify({'error': 'Unauthorized - Admin access required'}), 403
        
        payments = list(db.payments_collection.find().sort('created_at', -1))
        
        for p in payments:
            p['_id'] = str(p['_id'])
            p['student_id'] = str(p['student_id'])
            p['teacher_id'] = str(p['teacher_id'])
            
            student = db.users_collection.find_one({'_id': ObjectId(p['student_id'])})
            teacher = db.users_collection.find_one({'_id': ObjectId(p['teacher_id'])})
            p['student_name'] = student.get('name', 'Student') if student else 'Student'
            p['teacher_name'] = teacher.get('name', 'Teacher') if teacher else 'Teacher'
        
        return jsonify({
            'success': True,
            'payments': payments,
            'count': len(payments)
        }), 200
        
    except Exception as e:
        print(f"❌ Error in admin_get_payments: {e}")
        return jsonify({'error': str(e)}), 500


# ============================================================
# ✅ APPROVE PAYMENT (Admin Only)
# ============================================================
@admin_bp.route('/payments/<payment_id>/approve', methods=['PUT'])
@jwt_required()
def admin_approve_payment(payment_id):
    try:
        current_user_id = get_jwt_identity()
        
        if not check_admin(current_user_id):
            return jsonify({'error': 'Unauthorized - Admin access required'}), 403
        
        if not ObjectId.is_valid(payment_id):
            return jsonify({'error': 'Invalid payment ID'}), 400
        
        payment = db.payments_collection.find_one({'_id': ObjectId(payment_id)})
        if not payment:
            return jsonify({'error': 'Payment not found'}), 404
        
        if payment.get('status') != 'pending':
            return jsonify({'error': f'Payment is already {payment.get("status")}'}), 400
        
        db.payments_collection.update_one(
            {'_id': ObjectId(payment_id)},
            {'$set': {'status': 'approved', 'updated_at': datetime.utcnow()}}
        )
        
        if payment.get('enrollment_id'):
            db.matches_collection.update_one(
                {'_id': ObjectId(payment['enrollment_id'])},
                {'$set': {
                    'payment_status': 'paid',
                    'chat_unlocked': True,
                    'attendance_unlocked': True,
                    'meeting_unlocked': True,
                    'updated_at': datetime.utcnow()
                }}
            )
        
        student_notification = {
            'sender_id': ObjectId(current_user_id),
            'receiver_id': ObjectId(payment['student_id']),
            'type': 'payment_approved',
            'title': '✅ Payment Approved!',
            'message': 'Your payment has been approved. Chat is now unlocked.',
            'read': False,
            'created_at': datetime.utcnow()
        }
        db.notifications_collection.insert_one(student_notification)
        
        teacher_notification = {
            'sender_id': ObjectId(current_user_id),
            'receiver_id': ObjectId(payment['teacher_id']),
            'type': 'payment_approved',
            'title': '💰 Payment Approved',
            'message': 'Student payment has been approved. Chat is now unlocked.',
            'read': False,
            'created_at': datetime.utcnow()
        }
        db.notifications_collection.insert_one(teacher_notification)
        
        return jsonify({
            'success': True,
            'message': 'Payment approved successfully. Chat unlocked.'
        }), 200
        
    except Exception as e:
        print(f"❌ Error in admin_approve_payment: {e}")
        return jsonify({'error': str(e)}), 500


# ============================================================
# ✅ REJECT PAYMENT (Admin Only)
# ============================================================
@admin_bp.route('/payments/<payment_id>/reject', methods=['PUT'])
@jwt_required()
def admin_reject_payment(payment_id):
    try:
        current_user_id = get_jwt_identity()
        data = request.json or {}
        reason = data.get('reason', 'Payment rejected by admin')
        
        if not check_admin(current_user_id):
            return jsonify({'error': 'Unauthorized - Admin access required'}), 403
        
        if not ObjectId.is_valid(payment_id):
            return jsonify({'error': 'Invalid payment ID'}), 400
        
        payment = db.payments_collection.find_one({'_id': ObjectId(payment_id)})
        if not payment:
            return jsonify({'error': 'Payment not found'}), 404
        
        if payment.get('status') != 'pending':
            return jsonify({'error': f'Payment is already {payment.get("status")}'}), 400
        
        db.payments_collection.update_one(
            {'_id': ObjectId(payment_id)},
            {'$set': {
                'status': 'rejected',
                'rejection_reason': reason,
                'updated_at': datetime.utcnow()
            }}
        )
        
        student_notification = {
            'sender_id': ObjectId(current_user_id),
            'receiver_id': ObjectId(payment['student_id']),
            'type': 'payment_rejected',
            'title': '❌ Payment Rejected',
            'message': f'Your payment has been rejected. Reason: {reason}',
            'read': False,
            'created_at': datetime.utcnow()
        }
        db.notifications_collection.insert_one(student_notification)
        
        return jsonify({
            'success': True,
            'message': 'Payment rejected successfully'
        }), 200
        
    except Exception as e:
        print(f"❌ Error in admin_reject_payment: {e}")
        return jsonify({'error': str(e)}), 500


# ============================================================
# ✅ GET ALL ENROLLMENTS (Admin Only)
# ============================================================
@admin_bp.route('/enrollments', methods=['GET'])
@jwt_required()
def admin_get_enrollments():
    try:
        current_user_id = get_jwt_identity()
        
        if not check_admin(current_user_id):
            return jsonify({'error': 'Unauthorized - Admin access required'}), 403
        
        enrollments = list(db.matches_collection.find().sort('created_at', -1))
        
        print(f"📋 Found {len(enrollments)} enrollments in matches_collection")
        
        for e in enrollments:
            e['_id'] = str(e['_id'])
            
            student_id = e.get('student_id') or e.get('_student_id')
            teacher_id = e.get('teacher_id') or e.get('_teacher_id')
            
            if student_id:
                e['student_id'] = str(student_id)
            if teacher_id:
                e['teacher_id'] = str(teacher_id)
            
            student = None
            if student_id:
                try:
                    student = db.users_collection.find_one({'_id': ObjectId(student_id)})
                except:
                    pass
            e['student_name'] = student.get('name', 'Student') if student else 'Student'
            
            teacher = None
            if teacher_id:
                try:
                    teacher = db.users_collection.find_one({'_id': ObjectId(teacher_id)})
                except:
                    pass
            e['teacher_name'] = teacher.get('name', 'Teacher') if teacher else 'Teacher'
            
            e['subject'] = e.get('subject', 'General')
            e['fee'] = e.get('fee', '')
            e['subject_fees'] = e.get('subject_fees', [])
            
            status = e.get('status', 'pending')
            if status == 'active':
                status = 'accepted'
            e['status'] = status
            
            e['payment_status'] = e.get('payment_status', 'pending')
            e['created_at'] = e.get('created_at', datetime.utcnow())
        
        return jsonify({
            'success': True,
            'enrollments': enrollments,
            'count': len(enrollments)
        }), 200
        
    except Exception as e:
        print(f"❌ Error in admin_get_enrollments: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500


# ============================================================
# ✅ UPDATE ENROLLMENT STATUS (Admin Only)
# ============================================================
@admin_bp.route('/enrollments/<enrollment_id>/status', methods=['PUT'])
@jwt_required()
def admin_update_enrollment_status(enrollment_id):
    try:
        current_user_id = get_jwt_identity()
        data = request.json
        new_status = data.get('status')
        
        if not check_admin(current_user_id):
            return jsonify({'error': 'Unauthorized - Admin access required'}), 403
        
        if not new_status:
            return jsonify({'error': 'Status is required'}), 400
        
        valid_statuses = ['active', 'completed', 'pending', 'cancelled']
        if new_status not in valid_statuses:
            return jsonify({'error': f'Invalid status. Must be one of: {valid_statuses}'}), 400
        
        if not ObjectId.is_valid(enrollment_id):
            return jsonify({'error': 'Invalid enrollment ID'}), 400
        
        result = db.matches_collection.update_one(
            {'_id': ObjectId(enrollment_id)},
            {'$set': {'status': new_status, 'updated_at': datetime.utcnow()}}
        )
        
        if result.modified_count == 0:
            return jsonify({'error': 'Enrollment not found or already has this status'}), 404
        
        return jsonify({
            'success': True,
            'message': f'Enrollment status updated to {new_status}'
        }), 200
        
    except Exception as e:
        print(f"❌ Error in admin_update_enrollment_status: {e}")
        return jsonify({'error': str(e)}), 500


# ============================================================
# ✅ UPDATE ENROLLMENT PAYMENT STATUS (Admin Only)
# ============================================================
@admin_bp.route('/enrollments/<enrollment_id>/payment', methods=['PUT'])
@jwt_required()
def admin_update_enrollment_payment(enrollment_id):
    try:
        current_user_id = get_jwt_identity()
        data = request.json
        payment_status = data.get('payment_status')
        
        if not check_admin(current_user_id):
            return jsonify({'error': 'Unauthorized - Admin access required'}), 403
        
        if not payment_status:
            return jsonify({'error': 'Payment status is required'}), 400
        
        valid_statuses = ['pending', 'paid', 'failed']
        if payment_status not in valid_statuses:
            return jsonify({'error': f'Invalid payment status. Must be one of: {valid_statuses}'}), 400
        
        if not ObjectId.is_valid(enrollment_id):
            return jsonify({'error': 'Invalid enrollment ID'}), 400
        
        result = db.matches_collection.update_one(
            {'_id': ObjectId(enrollment_id)},
            {'$set': {'payment_status': payment_status, 'updated_at': datetime.utcnow()}}
        )
        
        if result.modified_count == 0:
            return jsonify({'error': 'Enrollment not found'}), 404
        
        return jsonify({
            'success': True,
            'message': f'Payment status updated to {payment_status}'
        }), 200
        
    except Exception as e:
        print(f"❌ Error in admin_update_enrollment_payment: {e}")
        return jsonify({'error': str(e)}), 500


# ============================================================
# ✅ GET ALL ATTENDANCE (Admin Only)
# ============================================================
@admin_bp.route('/attendance', methods=['GET'])
@jwt_required()
def admin_get_attendance():
    try:
        current_user_id = get_jwt_identity()
        
        if not check_admin(current_user_id):
            return jsonify({'error': 'Unauthorized - Admin access required'}), 403
        
        attendance = list(db.attendance_collection.find().sort('created_at', -1))
        
        for a in attendance:
            a['_id'] = str(a['_id'])
            a['student_id'] = str(a['student_id'])
            a['teacher_id'] = str(a['teacher_id'])
            
            student = db.users_collection.find_one({'_id': ObjectId(a['student_id'])})
            teacher = db.users_collection.find_one({'_id': ObjectId(a['teacher_id'])})
            a['student_name'] = student.get('name', 'Student') if student else 'Student'
            a['teacher_name'] = teacher.get('name', 'Teacher') if teacher else 'Teacher'
        
        return jsonify({
            'success': True,
            'attendance': attendance,
            'count': len(attendance)
        }), 200
        
    except Exception as e:
        print(f"❌ Error in admin_get_attendance: {e}")
        return jsonify({'error': str(e)}), 500


# ============================================================
# ✅ GET ALL NOTIFICATIONS (Admin Only)
# ============================================================
@admin_bp.route('/notifications', methods=['GET'])
@jwt_required()
def admin_get_notifications():
    try:
        current_user_id = get_jwt_identity()
        
        if not check_admin(current_user_id):
            return jsonify({'error': 'Unauthorized - Admin access required'}), 403
        
        notifications = list(db.notifications_collection.find().sort('created_at', -1))
        
        for n in notifications:
            n['_id'] = str(n['_id'])
            n['sender_id'] = str(n['sender_id']) if n.get('sender_id') else None
            n['receiver_id'] = str(n['receiver_id']) if n.get('receiver_id') else None
            
            if n.get('receiver_id'):
                user = db.users_collection.find_one({'_id': ObjectId(n['receiver_id'])})
                n['recipient_name'] = user.get('name', 'Unknown') if user else 'Unknown'
                n['recipient_role'] = user.get('role', 'User') if user else 'User'
        
        return jsonify({
            'success': True,
            'notifications': notifications,
            'count': len(notifications)
        }), 200
        
    except Exception as e:
        print(f"❌ Error in admin_get_notifications: {e}")
        return jsonify({'error': str(e)}), 500


# ============================================================
# ✅ MARK NOTIFICATION AS READ (Admin Only)
# ============================================================
@admin_bp.route('/notifications/<notification_id>/read', methods=['PUT'])
@jwt_required()
def admin_mark_notification_read(notification_id):
    try:
        current_user_id = get_jwt_identity()
        
        if not check_admin(current_user_id):
            return jsonify({'error': 'Unauthorized - Admin access required'}), 403
        
        if not ObjectId.is_valid(notification_id):
            return jsonify({'error': 'Invalid notification ID'}), 400
        
        result = db.notifications_collection.update_one(
            {'_id': ObjectId(notification_id)},
            {'$set': {'read': True}}
        )
        
        if result.modified_count == 0:
            return jsonify({'error': 'Notification not found'}), 404
        
        return jsonify({
            'success': True,
            'message': 'Notification marked as read'
        }), 200
        
    except Exception as e:
        print(f"❌ Error in admin_mark_notification_read: {e}")
        return jsonify({'error': str(e)}), 500


# ============================================================
# ✅ MARK ALL NOTIFICATIONS AS READ (Admin Only)
# ============================================================
@admin_bp.route('/notifications/mark-all-read', methods=['PUT'])
@jwt_required()
def admin_mark_all_notifications_read():
    try:
        current_user_id = get_jwt_identity()
        
        if not check_admin(current_user_id):
            return jsonify({'error': 'Unauthorized - Admin access required'}), 403
        
        result = db.notifications_collection.update_many(
            {'read': False},
            {'$set': {'read': True}}
        )
        
        return jsonify({
            'success': True,
            'message': f'{result.modified_count} notifications marked as read',
            'count': result.modified_count
        }), 200
        
    except Exception as e:
        print(f"❌ Error in admin_mark_all_notifications_read: {e}")
        return jsonify({'error': str(e)}), 500


# ============================================================
# ✅ DELETE NOTIFICATION (Admin Only)
# ============================================================
@admin_bp.route('/notifications/<notification_id>', methods=['DELETE'])
@jwt_required()
def admin_delete_notification(notification_id):
    try:
        current_user_id = get_jwt_identity()
        
        if not check_admin(current_user_id):
            return jsonify({'error': 'Unauthorized - Admin access required'}), 403
        
        if not ObjectId.is_valid(notification_id):
            return jsonify({'error': 'Invalid notification ID'}), 400
        
        result = db.notifications_collection.delete_one({'_id': ObjectId(notification_id)})
        
        if result.deleted_count == 0:
            return jsonify({'error': 'Notification not found'}), 404
        
        return jsonify({
            'success': True,
            'message': 'Notification deleted'
        }), 200
        
    except Exception as e:
        print(f"❌ Error in admin_delete_notification: {e}")
        return jsonify({'error': str(e)}), 500


# ============================================================
# ✅ DELETE ALL NOTIFICATIONS (Admin Only)
# ============================================================
@admin_bp.route('/notifications/delete-all', methods=['DELETE'])
@jwt_required()
def admin_delete_all_notifications():
    try:
        current_user_id = get_jwt_identity()
        
        if not check_admin(current_user_id):
            return jsonify({'error': 'Unauthorized - Admin access required'}), 403
        
        result = db.notifications_collection.delete_many({})
        
        return jsonify({
            'success': True,
            'message': f'{result.deleted_count} notifications deleted',
            'count': result.deleted_count
        }), 200
        
    except Exception as e:
        print(f"❌ Error in admin_delete_all_notifications: {e}")
        return jsonify({'error': str(e)}), 500


# ============================================================
# ✅ GET TEACHER BY ID (Admin Only)
# ============================================================
@admin_bp.route('/teachers/<teacher_id>', methods=['GET'])
@jwt_required()
def admin_get_teacher(teacher_id):
    try:
        current_user_id = get_jwt_identity()
        
        if not check_admin(current_user_id):
            return jsonify({'error': 'Unauthorized - Admin access required'}), 403
        
        if not ObjectId.is_valid(teacher_id):
            return jsonify({'error': 'Invalid teacher ID'}), 400
        
        teacher = db.users_collection.find_one(
            {'_id': ObjectId(teacher_id), 'role': 'teacher'},
            {'password': 0}
        )
        
        if not teacher:
            return jsonify({'error': 'Teacher not found'}), 404
        
        teacher['_id'] = str(teacher['_id'])
        
        profile = db.teacher_profiles.find_one({
            '$or': [{'user_id': ObjectId(teacher_id)}, {'_user_id': ObjectId(teacher_id)}]
        })
        
        if profile:
            teacher['profile'] = {
                'qualification': profile.get('_qualification', '') or profile.get('qualification', ''),
                'experience': profile.get('_experience', '') or profile.get('experience', ''),
                'teaching_mode': profile.get('_teaching_mode', 'online') or profile.get('teaching_mode', 'online'),
                'location': profile.get('_location', '') or profile.get('location', ''),
                'bio': profile.get('_bio', '') or profile.get('bio', ''),
                'subjects': profile.get('_subjects', []) or profile.get('subjects', []),
                'subject_fees': profile.get('_subject_fees', []) or profile.get('subject_fees', []),
                'schedules': profile.get('_schedules', []) or profile.get('schedules', [])
            }
        
        return jsonify({
            'success': True,
            'teacher': teacher
        }), 200
        
    except Exception as e:
        print(f"❌ Error in admin_get_teacher: {e}")
        return jsonify({'error': str(e)}), 500


# ============================================================
# ✅ GET STUDENT BY ID (Admin Only)
# ============================================================
@admin_bp.route('/students/<student_id>', methods=['GET'])
@jwt_required()
def admin_get_student(student_id):
    try:
        current_user_id = get_jwt_identity()
        
        if not check_admin(current_user_id):
            return jsonify({'error': 'Unauthorized - Admin access required'}), 403
        
        if not ObjectId.is_valid(student_id):
            return jsonify({'error': 'Invalid student ID'}), 400
        
        student = db.users_collection.find_one(
            {'_id': ObjectId(student_id), 'role': 'student'},
            {'password': 0}
        )
        
        if not student:
            return jsonify({'error': 'Student not found'}), 404
        
        student['_id'] = str(student['_id'])
        
        profile = db.student_profiles.find_one({
            '$or': [{'user_id': ObjectId(student_id)}, {'_user_id': ObjectId(student_id)}]
        })
        
        if profile:
            student['profile'] = {
                'education_level': profile.get('_education_level', '') or profile.get('education_level', ''),
                'learning_mode': profile.get('_learning_mode', 'online') or profile.get('learning_mode', 'online'),
                'location': profile.get('_location', '') or profile.get('location', ''),
                'subjects': profile.get('_subjects', []) or profile.get('subjects', []),
                'phone': profile.get('_phone', '') or profile.get('phone', ''),
                'school_name': profile.get('_school_name', '') or profile.get('school_name', ''),
                'board': profile.get('_board', '') or profile.get('board', ''),
                'study_time': profile.get('_study_time', '') or profile.get('study_time', ''),
                'bio': profile.get('_bio', '') or profile.get('bio', '')
            }
        
        return jsonify({
            'success': True,
            'student': student
        }), 200
        
    except Exception as e:
        print(f"❌ Error in admin_get_student: {e}")
        return jsonify({'error': str(e)}), 500
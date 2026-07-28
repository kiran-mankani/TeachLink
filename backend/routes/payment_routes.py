from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from bson import ObjectId
from datetime import datetime
from config.database import db

payment_bp = Blueprint('payment', __name__)


# ============================================================
# ✅ CREATE PAYMENT - UPDATED WITH SUBJECT-WISE FEES
# ============================================================
@payment_bp.route('/create', methods=['POST'])
@jwt_required()
def create_payment():
    try:
        current_user_id = get_jwt_identity()
        data = request.json
        
        amount = data.get('amount')
        course_id = data.get('course_id')
        teacher_id = data.get('teacher_id')
        subject = data.get('subject', 'General')
        payment_method = data.get('payment_method', 'bank_transfer')
        enrollment_id = data.get('enrollment_id')  # ✅ NEW: For enrollment-specific payment
        
        print(f"📥 Payment request data:")
        print(f"   Amount: {amount}")
        print(f"   Teacher ID: {teacher_id}")
        print(f"   Subject: {subject}")
        print(f"   Enrollment ID: {enrollment_id}")
        
        if not amount or not course_id or not teacher_id:
            return jsonify({'error': 'Amount, course_id and teacher_id are required'}), 400
        
        # ✅ Get student name
        student = db.users_collection.find_one({'_id': ObjectId(current_user_id)})
        student_name = student.get('name', 'Student') if student else 'Student'
        
        # ✅ Get teacher name
        teacher = db.users_collection.find_one({'_id': ObjectId(teacher_id)})
        teacher_name = teacher.get('name', 'Teacher') if teacher else 'Teacher'
        
        # ✅ Get enrollment details for subject-wise fee validation
        fee_from_enrollment = None
        enrollment_data = None
        
        if enrollment_id and ObjectId.is_valid(enrollment_id):
            enrollment_data = db.enrollment_requests.find_one({
                '_id': ObjectId(enrollment_id),
                'student_id': current_user_id,
                'status': 'approved'
            })
            
            if enrollment_data:
                # ✅ Get fee from enrollment
                fee_from_enrollment = enrollment_data.get('fee', '')
                if fee_from_enrollment:
                    try:
                        # Convert to float for comparison
                        fee_from_enrollment = float(str(fee_from_enrollment).replace(',', ''))
                    except:
                        fee_from_enrollment = None
                
                # ✅ Get subject from enrollment if not provided
                if not subject or subject == 'General':
                    subject = enrollment_data.get('subject', 'General')
                
                print(f"📌 Found enrollment with fee: {fee_from_enrollment}")
        
        # ✅ If no enrollment, try to get fee from teacher profile
        if not fee_from_enrollment:
            teacher_profile = db.teacher_profiles.find_one({
                '$or': [
                    {'_user_id': ObjectId(teacher_id)},
                    {'user_id': ObjectId(teacher_id)}
                ]
            })
            
            if teacher_profile:
                subjects_raw = teacher_profile.get('_subjects', []) or teacher_profile.get('subjects', [])
                if subjects_raw and isinstance(subjects_raw, list):
                    for s in subjects_raw:
                        if isinstance(s, dict) and s.get('subject', '') == subject:
                            fee_from_enrollment = s.get('fee', 0)
                            break
        
        # ✅ Validate amount matches fee
        if fee_from_enrollment:
            try:
                amount_float = float(amount)
                fee_float = float(fee_from_enrollment)
                
                # Allow small difference (in case of rounding)
                if abs(amount_float - fee_float) > 1:
                    print(f"⚠️ Amount mismatch: {amount_float} vs {fee_float}")
                    # Don't block, just warn - teacher might have changed fee
                    print(f"⚠️ Warning: Amount ({amount}) doesn't match enrollment fee ({fee_from_enrollment})")
            except:
                pass
        
        # ✅ Create payment record
        payment_data = {
            'student_id': current_user_id,
            'student_name': student_name,
            'teacher_id': teacher_id,
            'teacher_name': teacher_name,
            'course_id': course_id,
            'subject': subject,
            'amount': amount,
            'payment_method': payment_method,
            'status': 'pending',  # pending, completed, approved, rejected
            'created_at': datetime.utcnow(),
            'updated_at': datetime.utcnow()
        }
        
        # ✅ Add enrollment_id if provided
        if enrollment_id:
            payment_data['enrollment_id'] = enrollment_id
        
        result = db.payments_collection.insert_one(payment_data)
        payment_id = str(result.inserted_id)
        
        print(f"✅ Payment created: {payment_id}")
        
        # ✅ Create notification for teacher
        notification = {
            'sender_id': ObjectId(current_user_id),
            'receiver_id': ObjectId(teacher_id),
            'type': 'payment_received',
            'title': '💰 Payment Received',
            'message': f'{student_name} made a payment of Rs. {amount} for {subject}',
            'read': False,
            'created_at': datetime.utcnow()
        }
        db.notifications_collection.insert_one(notification)
        print(f"✅ Notification sent to Teacher (ID: {teacher_id})")
        
        return jsonify({
            'success': True,
            'message': 'Payment created successfully',
            'payment_id': payment_id,
            'payment': {
                '_id': payment_id,
                'amount': amount,
                'subject': subject,
                'status': 'pending'
            }
        }), 201
        
    except Exception as e:
        print(f"❌ Error in create_payment: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500


# ============================================================
# ✅ GET TEACHER PAYMENTS - UPDATED
# ============================================================
@payment_bp.route('/teacher', methods=['GET'])
@jwt_required()
def get_teacher_payments():
    try:
        current_user_id = get_jwt_identity()
        
        payments = list(db.payments_collection.find({
            'teacher_id': current_user_id
        }).sort('created_at', -1))
        
        for payment in payments:
            payment['_id'] = str(payment['_id'])
            payment['student_id'] = str(payment['student_id'])
            payment['teacher_id'] = str(payment['teacher_id'])
            if 'enrollment_id' in payment:
                payment['enrollment_id'] = str(payment['enrollment_id'])
        
        return jsonify({
            'success': True,
            'payments': payments,
            'count': len(payments)
        }), 200
        
    except Exception as e:
        print(f"❌ Error in get_teacher_payments: {e}")
        return jsonify({'error': str(e)}), 500


# ============================================================
# ✅ GET STUDENT PAYMENTS - UPDATED
# ============================================================
@payment_bp.route('/student', methods=['GET'])
@jwt_required()
def get_student_payments():
    try:
        current_user_id = get_jwt_identity()
        
        payments = list(db.payments_collection.find({
            'student_id': current_user_id
        }).sort('created_at', -1))
        
        for payment in payments:
            payment['_id'] = str(payment['_id'])
            payment['student_id'] = str(payment['student_id'])
            payment['teacher_id'] = str(payment['teacher_id'])
            if 'enrollment_id' in payment:
                payment['enrollment_id'] = str(payment['enrollment_id'])
            
            # ✅ Add subject-wise fee info if enrollment exists
            if 'enrollment_id' in payment:
                enrollment = db.enrollment_requests.find_one({
                    '_id': ObjectId(payment['enrollment_id'])
                })
                if enrollment:
                    payment['subject_fees'] = enrollment.get('subject_fees', [])
                    payment['enrollment_fee'] = enrollment.get('fee', '')
        
        return jsonify({
            'success': True,
            'payments': payments,
            'count': len(payments)
        }), 200
        
    except Exception as e:
        print(f"❌ Error in get_student_payments: {e}")
        return jsonify({'error': str(e)}), 500


# ============================================================
# ✅ UPDATE PAYMENT STATUS
# ============================================================
@payment_bp.route('/<payment_id>/status', methods=['PUT'])
@jwt_required()
def update_payment_status(payment_id):
    try:
        current_user_id = get_jwt_identity()
        data = request.json
        
        status = data.get('status')
        
        if not status:
            return jsonify({'error': 'Status is required'}), 400
        
        if status not in ['pending', 'completed', 'approved', 'rejected']:
            return jsonify({'error': 'Invalid status'}), 400
        
        if not ObjectId.is_valid(payment_id):
            return jsonify({'error': 'Invalid payment ID'}), 400
        
        payment = db.payments_collection.find_one({
            '_id': ObjectId(payment_id)
        })
        
        if not payment:
            return jsonify({'error': 'Payment not found'}), 404
        
        # Only teacher or admin can update status
        if str(payment.get('teacher_id')) != current_user_id:
            return jsonify({'error': 'Only teacher can update payment status'}), 403
        
        db.payments_collection.update_one(
            {'_id': ObjectId(payment_id)},
            {'$set': {
                'status': status,
                'updated_at': datetime.utcnow()
            }}
        )
        
        # ✅ Create notification for student
        notification = {
            'sender_id': ObjectId(current_user_id),
            'receiver_id': ObjectId(payment['student_id']),
            'type': 'payment_status_updated',
            'title': '💳 Payment Status Updated',
            'message': f'Your payment of Rs. {payment.get("amount")} for {payment.get("subject", "course")} is now {status}',
            'read': False,
            'created_at': datetime.utcnow()
        }
        db.notifications_collection.insert_one(notification)
        print(f"✅ Notification sent to Student (ID: {payment['student_id']})")
        
        return jsonify({
            'success': True,
            'message': f'Payment status updated to {status}'
        }), 200
        
    except Exception as e:
        print(f"❌ Error in update_payment_status: {e}")
        return jsonify({'error': str(e)}), 500


# ============================================================
# ✅ GET PAYMENT DETAILS - NEW ROUTE
# ============================================================
@payment_bp.route('/<payment_id>', methods=['GET'])
@jwt_required()
def get_payment_details(payment_id):
    try:
        current_user_id = get_jwt_identity()
        
        if not ObjectId.is_valid(payment_id):
            return jsonify({'error': 'Invalid payment ID'}), 400
        
        payment = db.payments_collection.find_one({
            '_id': ObjectId(payment_id)
        })
        
        if not payment:
            return jsonify({'error': 'Payment not found'}), 404
        
        # Check authorization
        if str(payment.get('student_id')) != current_user_id and \
           str(payment.get('teacher_id')) != current_user_id:
            return jsonify({'error': 'Unauthorized'}), 403
        
        payment['_id'] = str(payment['_id'])
        payment['student_id'] = str(payment['student_id'])
        payment['teacher_id'] = str(payment['teacher_id'])
        
        # ✅ Get enrollment details if exists
        if 'enrollment_id' in payment:
            enrollment = db.enrollment_requests.find_one({
                '_id': ObjectId(payment['enrollment_id'])
            })
            if enrollment:
                payment['subject_fees'] = enrollment.get('subject_fees', [])
                payment['enrollment_fee'] = enrollment.get('fee', '')
        
        return jsonify({
            'success': True,
            'payment': payment
        }), 200
        
    except Exception as e:
        print(f"❌ Error in get_payment_details: {e}")
        return jsonify({'error': str(e)}), 500
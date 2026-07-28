from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from bson import ObjectId
from datetime import datetime
from config.database import db

# ✅ Create blueprint
chat_bp = Blueprint('chat', __name__)


# ============================================================
# ✅ TEST ROUTE - To verify blueprint is working
# ============================================================
@chat_bp.route('/test', methods=['GET'])
def chat_test():
    return jsonify({
        'success': True,
        'message': 'Chat routes are working!',
        'timestamp': datetime.utcnow().isoformat()
    }), 200


# ============================================================
# ✅ GET CHAT ENROLLMENTS FOR USER
# ============================================================
@chat_bp.route('/enrollments', methods=['GET'])
@jwt_required()
def get_chat_enrollments():
    try:
        current_user_id = get_jwt_identity()
        
        print(f"🔍 Fetching chat enrollments for user: {current_user_id}")
        
        # ✅ Check if chat_messages collection exists, if not create it
        if 'chat_messages' not in db.list_collection_names():
            db.create_collection('chat_messages')
            print("✅ Created chat_messages collection")
        
        # ✅ Get all active enrollments where user is part of
        enrollments = list(db.matches_collection.find({
            '$or': [
                {'student_id': current_user_id},
                {'teacher_id': current_user_id}
            ],
            'status': 'active'
        }).sort('last_message_at', -1))
        
        print(f"📋 Found {len(enrollments)} enrollments")
        
        result = []
        for e in enrollments:
            e['_id'] = str(e['_id'])
            e['student_id'] = str(e['student_id'])
            e['teacher_id'] = str(e['teacher_id'])
            
            student = db.users_collection.find_one({'_id': ObjectId(e['student_id'])})
            teacher = db.users_collection.find_one({'_id': ObjectId(e['teacher_id'])})
            
            # ✅ Count unread messages for this user
            unread = db.chat_messages.count_documents({
                'enrollment_id': ObjectId(e['_id']),
                'receiver_id': ObjectId(current_user_id),
                'is_read': False
            })
            
            # ✅ Get last message
            last_msg = db.chat_messages.find_one(
                {'enrollment_id': ObjectId(e['_id'])},
                sort=[('created_at', -1)]
            )
            
            # ✅ Determine other user
            if str(e['student_id']) == current_user_id:
                other_user_id = str(e['teacher_id'])
                other_user_name = teacher.get('name', 'Teacher') if teacher else 'Teacher'
            else:
                other_user_id = str(e['student_id'])
                other_user_name = student.get('name', 'Student') if student else 'Student'
            
            result.append({
                '_id': e['_id'],
                'subject': e.get('subject', 'General'),
                'student_name': student.get('name', 'Student') if student else 'Student',
                'teacher_name': teacher.get('name', 'Teacher') if teacher else 'Teacher',
                'payment_status': e.get('payment_status', 'pending'),
                'status': e.get('status', 'active'),
                'last_message': last_msg.get('message', '') if last_msg else '',
                'last_message_at': last_msg.get('created_at') if last_msg else e.get('created_at'),
                'last_message_sender': last_msg.get('sender_name', '') if last_msg else '',
                'unread_count': unread,
                'other_user_id': other_user_id,
                'other_user_name': other_user_name
            })
        
        return jsonify({
            'success': True,
            'enrollments': result
        }), 200
        
    except Exception as e:
        print(f"❌ Error in get_chat_enrollments: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500


# ============================================================
# ✅ SEND MESSAGE
# ============================================================
@chat_bp.route('/send', methods=['POST'])
@jwt_required()
def send_message():
    try:
        current_user_id = get_jwt_identity()
        data = request.json
        
        receiver_id = data.get('receiver_id')
        enrollment_id = data.get('enrollment_id')
        message = data.get('message', '').strip()
        
        if not receiver_id:
            return jsonify({'error': 'Receiver ID is required'}), 400
        
        if not enrollment_id:
            return jsonify({'error': 'Enrollment ID is required'}), 400
        
        if not message:
            return jsonify({'error': 'Message cannot be empty'}), 400
        
        # ✅ Verify enrollment exists and is active
        enrollment = db.matches_collection.find_one({
            '_id': ObjectId(enrollment_id),
            'status': 'active'
        })
        
        if not enrollment:
            return jsonify({'error': 'Enrollment not found or not active'}), 404
        
        # ✅ Verify user is part of this enrollment
        student_id = enrollment.get('student_id')
        teacher_id = enrollment.get('teacher_id')
        
        if str(student_id) != current_user_id and str(teacher_id) != current_user_id:
            return jsonify({'error': 'Unauthorized - Not part of this enrollment'}), 403
        
        # ✅ Check if payment is completed
        payment_status = enrollment.get('payment_status', 'pending')
        if payment_status != 'paid':
            return jsonify({'error': 'Payment not completed. Chat is locked.'}), 403
        
        # ✅ Determine receiver
        if str(student_id) == current_user_id:
            receiver = teacher_id
        else:
            receiver = student_id
        
        # ✅ Get sender name
        sender = db.users_collection.find_one({'_id': ObjectId(current_user_id)})
        sender_name = sender.get('name', 'User') if sender else 'User'
        
        # ✅ Save message
        message_data = {
            'sender_id': ObjectId(current_user_id),
            'sender_name': sender_name,
            'receiver_id': ObjectId(receiver),
            'enrollment_id': ObjectId(enrollment_id),
            'message': message,
            'is_read': False,
            'created_at': datetime.utcnow()
        }
        
        result = db.chat_messages.insert_one(message_data)
        
        # ✅ Update last_message in enrollment
        db.matches_collection.update_one(
            {'_id': ObjectId(enrollment_id)},
            {'$set': {
                'last_message': message,
                'last_message_at': datetime.utcnow()
            }}
        )
        
        return jsonify({
            'success': True,
            'message': 'Message sent successfully',
            'message_id': str(result.inserted_id)
        }), 201
        
    except Exception as e:
        print(f"❌ Error in send_message: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500


# ============================================================
# ✅ GET MESSAGES FOR ENROLLMENT
# ============================================================
@chat_bp.route('/messages/<enrollment_id>', methods=['GET'])
@jwt_required()
def get_messages(enrollment_id):
    try:
        current_user_id = get_jwt_identity()
        
        if not ObjectId.is_valid(enrollment_id):
            return jsonify({'error': 'Invalid enrollment ID'}), 400
        
        enrollment = db.matches_collection.find_one({
            '_id': ObjectId(enrollment_id)
        })
        
        if not enrollment:
            return jsonify({'error': 'Enrollment not found'}), 404
        
        student_id = enrollment.get('student_id')
        teacher_id = enrollment.get('teacher_id')
        
        if str(student_id) != current_user_id and str(teacher_id) != current_user_id:
            return jsonify({'error': 'Unauthorized - Not part of this enrollment'}), 403
        
        # ✅ Get messages
        messages = list(db.chat_messages.find({
            'enrollment_id': ObjectId(enrollment_id)
        }).sort('created_at', 1))  # Oldest first
        
        # ✅ Mark messages as read
        db.chat_messages.update_many(
            {
                'enrollment_id': ObjectId(enrollment_id),
                'receiver_id': ObjectId(current_user_id),
                'is_read': False
            },
            {'$set': {'is_read': True}}
        )
        
        # ✅ Format messages for response
        for msg in messages:
            msg['_id'] = str(msg['_id'])
            msg['sender_id'] = str(msg['sender_id'])
            msg['receiver_id'] = str(msg['receiver_id'])
            msg['enrollment_id'] = str(msg['enrollment_id'])
            msg['is_sender'] = str(msg['sender_id']) == current_user_id
        
        # ✅ Get enrollment details
        student = db.users_collection.find_one({'_id': ObjectId(student_id)})
        teacher = db.users_collection.find_one({'_id': ObjectId(teacher_id)})
        
        return jsonify({
            'success': True,
            'messages': messages,
            'enrollment': {
                '_id': str(enrollment['_id']),
                'subject': enrollment.get('subject', 'General'),
                'student_name': student.get('name', 'Student') if student else 'Student',
                'teacher_name': teacher.get('name', 'Teacher') if teacher else 'Teacher',
                'payment_status': enrollment.get('payment_status', 'pending'),
                'status': enrollment.get('status', 'active')
            }
        }), 200
        
    except Exception as e:
        print(f"❌ Error in get_messages: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500


# ============================================================
# ✅ GET UNREAD COUNT
# ============================================================
@chat_bp.route('/unread-count', methods=['GET'])
@jwt_required()
def get_unread_count():
    try:
        current_user_id = get_jwt_identity()
        
        unread_count = db.chat_messages.count_documents({
            'receiver_id': ObjectId(current_user_id),
            'is_read': False
        })
        
        return jsonify({
            'success': True,
            'unread_count': unread_count
        }), 200
        
    except Exception as e:
        print(f"❌ Error in get_unread_count: {e}")
        return jsonify({'error': str(e)}), 500


# ============================================================
# ✅ MARK MESSAGE AS READ (Individual)
# ============================================================
@chat_bp.route('/read/<message_id>', methods=['PUT'])
@jwt_required()
def mark_message_read(message_id):
    try:
        current_user_id = get_jwt_identity()
        
        if not ObjectId.is_valid(message_id):
            return jsonify({'error': 'Invalid message ID'}), 400
        
        result = db.chat_messages.update_one(
            {
                '_id': ObjectId(message_id),
                'receiver_id': ObjectId(current_user_id)
            },
            {'$set': {'is_read': True}}
        )
        
        if result.modified_count == 0:
            return jsonify({'error': 'Message not found or already read'}), 404
        
        return jsonify({
            'success': True,
            'message': 'Message marked as read'
        }), 200
        
    except Exception as e:
        print(f"❌ Error in mark_message_read: {e}")
        return jsonify({'error': str(e)}), 500


# ============================================================
# ✅ MARK ALL MESSAGES AS READ FOR AN ENROLLMENT
# ============================================================
@chat_bp.route('/read-all/<enrollment_id>', methods=['PUT'])
@jwt_required()
def mark_all_messages_read(enrollment_id):
    try:
        current_user_id = get_jwt_identity()
        
        if not ObjectId.is_valid(enrollment_id):
            return jsonify({'error': 'Invalid enrollment ID'}), 400
        
        result = db.chat_messages.update_many(
            {
                'enrollment_id': ObjectId(enrollment_id),
                'receiver_id': ObjectId(current_user_id),
                'is_read': False
            },
            {'$set': {'is_read': True}}
        )
        
        return jsonify({
            'success': True,
            'message': f'{result.modified_count} messages marked as read',
            'count': result.modified_count
        }), 200
        
    except Exception as e:
        print(f"❌ Error in mark_all_messages_read: {e}")
        return jsonify({'error': str(e)}), 500


# ============================================================
# ✅ GET MESSAGE BY ID (For debugging)
# ============================================================
@chat_bp.route('/message/<message_id>', methods=['GET'])
@jwt_required()
def get_message(message_id):
    try:
        current_user_id = get_jwt_identity()
        
        if not ObjectId.is_valid(message_id):
            return jsonify({'error': 'Invalid message ID'}), 400
        
        message = db.chat_messages.find_one({'_id': ObjectId(message_id)})
        
        if not message:
            return jsonify({'error': 'Message not found'}), 404
        
        # ✅ Check if user is part of this message
        if str(message['sender_id']) != current_user_id and str(message['receiver_id']) != current_user_id:
            return jsonify({'error': 'Unauthorized'}), 403
        
        message['_id'] = str(message['_id'])
        message['sender_id'] = str(message['sender_id'])
        message['receiver_id'] = str(message['receiver_id'])
        message['enrollment_id'] = str(message['enrollment_id'])
        
        return jsonify({
            'success': True,
            'message': message
        }), 200
        
    except Exception as e:
        print(f"❌ Error in get_message: {e}")
        return jsonify({'error': str(e)}), 500


# ============================================================
# ✅ DELETE MESSAGE (Only sender can delete)
# ============================================================
@chat_bp.route('/delete/<message_id>', methods=['DELETE'])
@jwt_required()
def delete_message(message_id):
    try:
        current_user_id = get_jwt_identity()
        
        if not ObjectId.is_valid(message_id):
            return jsonify({'error': 'Invalid message ID'}), 400
        
        message = db.chat_messages.find_one({'_id': ObjectId(message_id)})
        
        if not message:
            return jsonify({'error': 'Message not found'}), 404
        
        # ✅ Only sender can delete
        if str(message['sender_id']) != current_user_id:
            return jsonify({'error': 'Only the sender can delete this message'}), 403
        
        db.chat_messages.delete_one({'_id': ObjectId(message_id)})
        
        return jsonify({
            'success': True,
            'message': 'Message deleted successfully'
        }), 200
        
    except Exception as e:
        print(f"❌ Error in delete_message: {e}")
        return jsonify({'error': str(e)}), 500


# ============================================================
# ✅ GET UNREAD COUNT FOR SPECIFIC ENROLLMENT
# ============================================================
@chat_bp.route('/unread-count/<enrollment_id>', methods=['GET'])
@jwt_required()
def get_unread_count_for_enrollment(enrollment_id):
    try:
        current_user_id = get_jwt_identity()
        
        if not ObjectId.is_valid(enrollment_id):
            return jsonify({'error': 'Invalid enrollment ID'}), 400
        
        unread_count = db.chat_messages.count_documents({
            'enrollment_id': ObjectId(enrollment_id),
            'receiver_id': ObjectId(current_user_id),
            'is_read': False
        })
        
        return jsonify({
            'success': True,
            'unread_count': unread_count
        }), 200
        
    except Exception as e:
        print(f"❌ Error in get_unread_count_for_enrollment: {e}")
        return jsonify({'error': str(e)}), 500
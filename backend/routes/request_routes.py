from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from bson import ObjectId
from datetime import datetime
from config.database import db


request_bp = Blueprint('request', __name__)
@request_bp.route('/send', methods=['POST'])
@jwt_required()
def create_request():
    try:
        current_user_id = get_jwt_identity()
        data = request.json
        
        student_id = data.get('student_id')
        teacher_id = data.get('teacher_id')
        
        # Determine roles
        user = db.users_collection.find_one({'_id': ObjectId(current_user_id)})
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        if user['role'] == 'student':
            student_id = current_user_id
        else:
            teacher_id = current_user_id
        
        # Check if request already exists
        existing = db.requests_collection.find_one({
            'student_id': ObjectId(student_id),
            'teacher_id': ObjectId(teacher_id),
            'status': {'$in': ['pending', 'accepted']}
        })
        
        if existing:
            return jsonify({'error': 'Request already exists'}), 400
        
        request_data = {
            'student_id': ObjectId(student_id),
            'teacher_id': ObjectId(teacher_id),
            'status': 'pending',
            'message': data.get('message', ''),
            'created_at': datetime.now(),
            'updated_at': datetime.now()
        }
        
        result = db.requests_collection.insert_one(request_data)
        
        # ✅ ========== CREATE NOTIFICATION FOR TEACHER ==========
        student_profile = db.student_profiles.find_one({'user_id': ObjectId(student_id)})
        student_name = student_profile.get('name', 'A student') if student_profile else 'A student'
        
        notification = {
            'sender_id': ObjectId(student_id),
            'receiver_id': ObjectId(teacher_id),
            'type': 'new_request',
            'title': 'New Connection Request',
            'message': f'{student_name} has sent you a connection request.',
            'request_id': result.inserted_id,
            'read': False,
            'created_at': datetime.now()
        }
        db.notifications_collection.insert_one(notification)
        print(f"✅ Notification sent to Teacher (ID: {teacher_id})")
        # =======================================================
        
        return jsonify({
            'success': True,
            'message': 'Request sent successfully',
            'request_id': str(result.inserted_id)
        }), 201
        
    except Exception as e:
        print(f"❌ Error in create_request: {e}")
        return jsonify({"error": str(e)}), 500


# ✅ ==============================
# GET REQUEST DETAIL (Naya Route)
# ==============================
@request_bp.route('/<request_id>', methods=['GET'])
@jwt_required()
def get_request(request_id):
    try:
        current_user_id = get_jwt_identity()
        
        # Request fetch karo
        request_data = db.requests_collection.find_one({'_id': ObjectId(request_id)})
        if not request_data:
            return jsonify({'error': 'Request not found'}), 404
        
        # Check authorization (Teacher hi dekh sakta hai)
        user = db.users_collection.find_one({'_id': ObjectId(current_user_id)})
        if user['role'] != 'teacher' or str(request_data['teacher_id']) != current_user_id:
            return jsonify({'error': 'Unauthorized'}), 403
        
        # Format response
        formatted_request = {
            '_id': str(request_data['_id']),
            'student_id': str(request_data['student_id']),
            'teacher_id': str(request_data['teacher_id']),
            'status': request_data.get('status', 'pending'),
            'message': request_data.get('message', ''),
            'created_at': request_data['created_at'].isoformat() if isinstance(request_data['created_at'], datetime) else str(request_data['created_at'])
        }
        
        return jsonify({
            'success': True,
            'request': formatted_request
        }), 200
        
    except Exception as e:
        print(f"❌ Error in get_request: {e}")
        return jsonify({'error': str(e)}), 500


@request_bp.route('/<request_id>/accept', methods=['POST'])
@jwt_required()
def accept_request(request_id):
    try:
        current_user_id = get_jwt_identity()
        
        request_data = db.requests_collection.find_one({'_id': ObjectId(request_id)})
        if not request_data:
            return jsonify({'error': 'Request not found'}), 404
        
        user = db.users_collection.find_one({'_id': ObjectId(current_user_id)})
        if user['role'] != 'teacher' or str(request_data['teacher_id']) != current_user_id:
            return jsonify({'error': 'Unauthorized'}), 403
        
        db.requests_collection.update_one(
            {'_id': ObjectId(request_id)},
            {'$set': {
                'status': 'accepted',
                'accepted_at': datetime.now(),
                'updated_at': datetime.now()
            }}
        )
        
        # Create initial session
        session_data = {
            'student_id': request_data['student_id'],
            'teacher_id': request_data['teacher_id'],
            'status': 'upcoming',
            'mode': 'online',
            'created_at': datetime.now(),
            'updated_at': datetime.now()
        }
        session_result = db.sessions_collection.insert_one(session_data)
        
        # ✅ ========== CREATE NOTIFICATION FOR STUDENT (ACCEPTED) ==========
        teacher_profile = db.teacher_profiles.find_one({'user_id': ObjectId(current_user_id)})
        teacher_name = teacher_profile.get('name', 'A teacher') if teacher_profile else 'A teacher'
        
        notification = {
            'sender_id': ObjectId(current_user_id),
            'receiver_id': request_data['student_id'],
            'type': 'request_accepted',
            'title': 'Request Accepted! 🎉',
            'message': f'{teacher_name} has accepted your connection request!',
            'request_id': ObjectId(request_id),
            'read': False,
            'created_at': datetime.now()
        }
        db.notifications_collection.insert_one(notification)
        print(f"✅ Notification sent to Student (ID: {request_data['student_id']})")
        # ====================================================================
        
        return jsonify({
            'success': True,
            'message': 'Request accepted successfully',
            'session_id': str(session_result.inserted_id)
        }), 200
        
    except Exception as e:
        print(f"❌ Error in accept_request: {e}")
        return jsonify({"error": str(e)}), 500


@request_bp.route('/<request_id>/reject', methods=['POST'])
@jwt_required()
def reject_request(request_id):
    try:
        current_user_id = get_jwt_identity()
        
        request_data = db.requests_collection.find_one({'_id': ObjectId(request_id)})
        if not request_data:
            return jsonify({'error': 'Request not found'}), 404
        
        user = db.users_collection.find_one({'_id': ObjectId(current_user_id)})
        if user['role'] != 'teacher' or str(request_data['teacher_id']) != current_user_id:
            return jsonify({'error': 'Unauthorized'}), 403
        
        db.requests_collection.update_one(
            {'_id': ObjectId(request_id)},
            {'$set': {
                'status': 'rejected',
                'rejected_at': datetime.now(),
                'updated_at': datetime.now()
            }}
        )
        
        # ✅ ========== CREATE NOTIFICATION FOR STUDENT (REJECTED) ==========
        teacher_profile = db.teacher_profiles.find_one({'user_id': ObjectId(current_user_id)})
        teacher_name = teacher_profile.get('name', 'A teacher') if teacher_profile else 'A teacher'
        
        notification = {
            'sender_id': ObjectId(current_user_id),
            'receiver_id': request_data['student_id'],
            'type': 'request_rejected',
            'title': 'Request Rejected',
            'message': f'{teacher_name} has declined your connection request.',
            'request_id': ObjectId(request_id),
            'read': False,
            'created_at': datetime.now()
        }
        db.notifications_collection.insert_one(notification)
        print(f"✅ Notification sent to Student (ID: {request_data['student_id']})")
        # ====================================================================
        
        return jsonify({
            'success': True,
            'message': 'Request rejected successfully'
        }), 200
        
    except Exception as e:
        print(f"❌ Error in reject_request: {e}")
        return jsonify({"error": str(e)}), 500
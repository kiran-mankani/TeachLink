from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from bson import ObjectId
from datetime import datetime
from config.database import db

attendance_bp = Blueprint('attendance', __name__)


@attendance_bp.route('/mark', methods=['POST'])
@jwt_required()
def mark_attendance():
    try:
        current_user_id = get_jwt_identity()
        data = request.json
        
        student_id = data.get('student_id')
        course_id = data.get('course_id')
        status = data.get('status', 'present')
        date = data.get('date')
        mode = data.get('mode', 'physical')
        meeting_link = data.get('meeting_link', '')
        
        if not student_id or not course_id:
            return jsonify({'error': 'Student ID and Course ID are required'}), 400
        
        if status not in ['present', 'absent', 'late', 'leave']:
            return jsonify({'error': 'Invalid status'}), 400
        
        if not ObjectId.is_valid(student_id) or not ObjectId.is_valid(course_id):
            return jsonify({'error': 'Invalid ID format'}), 400
        
        # Check if teacher is authorized
        teacher = db.teacher_profiles.find_one({
            '$or': [
                {'_user_id': ObjectId(current_user_id)},
                {'user_id': ObjectId(current_user_id)}
            ]
        })
        
        if not teacher:
            return jsonify({'error': 'Only teachers can mark attendance'}), 403
        
        # Check if student exists
        student = db.users_collection.find_one({'_id': ObjectId(student_id)})
        if not student:
            return jsonify({'error': 'Student not found'}), 404
        
        # Check if attendance already marked for this date
        existing = db.attendance_collection.find_one({
            'student_id': student_id,
            'course_id': course_id,
            'date': date or datetime.utcnow().date().isoformat()
        })
        
        if existing:
            return jsonify({'error': 'Attendance already marked for this date'}), 400
        
        attendance_data = {
            'teacher_id': current_user_id,
            'student_id': student_id,
            'course_id': course_id,
            'status': status,
            'mode': mode,
            'meeting_link': meeting_link,
            'date': date or datetime.utcnow().date().isoformat(),
            'created_at': datetime.utcnow()
        }
        
        result = db.attendance_collection.insert_one(attendance_data)
        
        # Create notification for student
        teacher_user = db.users_collection.find_one({'_id': ObjectId(current_user_id)})
        notification = {
            'sender_id': ObjectId(current_user_id),
            'receiver_id': ObjectId(student_id),
            'type': 'attendance_marked',
            'title': '📋 Attendance Marked',
            'message': f'{teacher_user.get("name", "Teacher")} marked you as {status}',
            'read': False,
            'created_at': datetime.utcnow()
        }
        db.notifications_collection.insert_one(notification)
        
        return jsonify({
            'success': True,
            'message': 'Attendance marked successfully',
            'attendance_id': str(result.inserted_id)
        }), 201
        
    except Exception as e:
        print(f"❌ Error in mark_attendance: {e}")
        return jsonify({'error': str(e)}), 500


@attendance_bp.route('/student/<student_id>', methods=['GET'])
@jwt_required()
def get_student_attendance(student_id):
    try:
        current_user_id = get_jwt_identity()
        
        if not ObjectId.is_valid(student_id):
            return jsonify({'error': 'Invalid student ID'}), 400
        
        # Check authorization
        if current_user_id != student_id:
            teacher = db.teacher_profiles.find_one({
                '$or': [
                    {'_user_id': ObjectId(current_user_id)},
                    {'user_id': ObjectId(current_user_id)}
                ]
            })
            if not teacher:
                return jsonify({'error': 'Unauthorized'}), 403
        
        attendance = list(db.attendance_collection.find({
            'student_id': student_id
        }).sort('date', -1))
        
        for record in attendance:
            record['_id'] = str(record['_id'])
            record['teacher_id'] = str(record['teacher_id'])
            record['student_id'] = str(record['student_id'])
            record['course_id'] = str(record['course_id'])
        
        # Calculate stats
        total = len(attendance)
        present = len([r for r in attendance if r.get('status') == 'present'])
        absent = len([r for r in attendance if r.get('status') == 'absent'])
        late = len([r for r in attendance if r.get('status') == 'late'])
        
        return jsonify({
            'success': True,
            'attendance': attendance,
            'stats': {
                'total': total,
                'present': present,
                'absent': absent,
                'late': late,
                'attendance_rate': round((present / total * 100) if total > 0 else 0, 1)
            }
        }), 200
        
    except Exception as e:
        print(f"❌ Error in get_student_attendance: {e}")
        return jsonify({'error': str(e)}), 500
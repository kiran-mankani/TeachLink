from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from bson import ObjectId
from datetime import datetime
from config.database import db

match_bp = Blueprint('match', __name__)


@match_bp.route('/create', methods=['POST'])
@jwt_required()
def create_match():
    try:
        current_user_id = get_jwt_identity()
        data = request.json
        
        teacher_id = data.get('teacher_id')
        student_id = data.get('student_id')
        subject = data.get('subject')
        learning_mode = data.get('learning_mode')
        schedule = data.get('schedule')
        
        if not teacher_id or not student_id or not subject:
            return jsonify({'error': 'Teacher ID, student ID and subject are required'}), 400
        
        if not ObjectId.is_valid(teacher_id) or not ObjectId.is_valid(student_id):
            return jsonify({'error': 'Invalid ID format'}), 400
        
        # Check if match already exists
        existing = db.matches_collection.find_one({
            'teacher_id': teacher_id,
            'student_id': student_id,
            'subject': subject,
            'status': 'active'
        })
        
        if existing:
            return jsonify({'error': 'Match already exists'}), 400
        
        match_data = {
            'teacher_id': teacher_id,
            'student_id': student_id,
            'subject': subject,
            'learning_mode': learning_mode or 'online',
            'schedule': schedule or 'Flexible',
            'status': 'active',
            'created_at': datetime.utcnow(),
            'updated_at': datetime.utcnow()
        }
        
        result = db.matches_collection.insert_one(match_data)
        
        return jsonify({
            'success': True,
            'message': 'Match created successfully',
            'match_id': str(result.inserted_id)
        }), 201
        
    except Exception as e:
        print(f"❌ Error in create_match: {e}")
        return jsonify({'error': str(e)}), 500


@match_bp.route('/teacher/<teacher_id>', methods=['GET'])
@jwt_required()
def get_teacher_matches(teacher_id):
    try:
        current_user_id = get_jwt_identity()
        
        if not ObjectId.is_valid(teacher_id):
            return jsonify({'error': 'Invalid teacher ID'}), 400
        
        if str(teacher_id) != current_user_id:
            user = db.users_collection.find_one({'_id': ObjectId(current_user_id)})
            if not user or user.get('role') != 'student':
                return jsonify({'error': 'Unauthorized'}), 403
        
        matches = list(db.matches_collection.find({
            'teacher_id': teacher_id,
            'status': 'active'
        }).sort('created_at', -1))
        
        for match in matches:
            match['_id'] = str(match['_id'])
            match['teacher_id'] = str(match['teacher_id'])
            match['student_id'] = str(match['student_id'])
            
            # Get student info
            student = db.users_collection.find_one({'_id': ObjectId(match['student_id'])})
            match['student_name'] = student.get('name', 'Unknown Student') if student else 'Unknown Student'
            match['student_profile'] = db.student_profiles.find_one({
                '$or': [
                    {'_user_id': ObjectId(match['student_id'])},
                    {'user_id': ObjectId(match['student_id'])}
                ]
            })
        
        return jsonify({
            'success': True,
            'matches': matches,
            'count': len(matches)
        }), 200
        
    except Exception as e:
        print(f"❌ Error in get_teacher_matches: {e}")
        return jsonify({'error': str(e)}), 500


@match_bp.route('/student/<student_id>', methods=['GET'])
@jwt_required()
def get_student_matches(student_id):
    try:
        current_user_id = get_jwt_identity()
        
        if not ObjectId.is_valid(student_id):
            return jsonify({'error': 'Invalid student ID'}), 400
        
        if str(student_id) != current_user_id:
            user = db.users_collection.find_one({'_id': ObjectId(current_user_id)})
            if not user or user.get('role') != 'teacher':
                return jsonify({'error': 'Unauthorized'}), 403
        
        matches = list(db.matches_collection.find({
            'student_id': student_id,
            'status': 'active'
        }).sort('created_at', -1))
        
        for match in matches:
            match['_id'] = str(match['_id'])
            match['teacher_id'] = str(match['teacher_id'])
            match['student_id'] = str(match['student_id'])
            
            # Get teacher info
            teacher = db.users_collection.find_one({'_id': ObjectId(match['teacher_id'])})
            match['teacher_name'] = teacher.get('name', 'Unknown Teacher') if teacher else 'Unknown Teacher'
            match['teacher_profile'] = db.teacher_profiles.find_one({
                '$or': [
                    {'_user_id': ObjectId(match['teacher_id'])},
                    {'user_id': ObjectId(match['teacher_id'])}
                ]
            })
        
        return jsonify({
            'success': True,
            'matches': matches,
            'count': len(matches)
        }), 200
        
    except Exception as e:
        print(f"❌ Error in get_student_matches: {e}")
        return jsonify({'error': str(e)}), 500


@match_bp.route('/<match_id>/end', methods=['PUT'])
@jwt_required()
def end_match(match_id):
    try:
        current_user_id = get_jwt_identity()
        
        if not ObjectId.is_valid(match_id):
            return jsonify({'error': 'Invalid match ID'}), 400
        
        match = db.matches_collection.find_one({
            '_id': ObjectId(match_id)
        })
        
        if not match:
            return jsonify({'error': 'Match not found'}), 404
        
        if str(match.get('teacher_id')) != current_user_id and str(match.get('student_id')) != current_user_id:
            return jsonify({'error': 'Unauthorized'}), 403
        
        db.matches_collection.update_one(
            {'_id': ObjectId(match_id)},
            {'$set': {
                'status': 'completed',
                'updated_at': datetime.utcnow()
            }}
        )
        
        return jsonify({
            'success': True,
            'message': 'Match ended successfully'
        }), 200
        
    except Exception as e:
        print(f"❌ Error in end_match: {e}")
        return jsonify({'error': str(e)}), 500
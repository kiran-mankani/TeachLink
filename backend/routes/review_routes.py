from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from bson import ObjectId
from datetime import datetime
from config.database import db

review_bp = Blueprint('review', __name__)


@review_bp.route('/create', methods=['POST'])
@jwt_required()
def create_review():
    try:
        current_user_id = get_jwt_identity()
        data = request.json
        
        teacher_id = data.get('teacher_id')
        rating = data.get('rating')
        comment = data.get('comment', '')
        
        if not teacher_id:
            return jsonify({'error': 'Teacher ID is required'}), 400
        
        if not rating or rating < 1 or rating > 5:
            return jsonify({'error': 'Rating must be between 1 and 5'}), 400
        
        if not ObjectId.is_valid(teacher_id):
            return jsonify({'error': 'Invalid teacher ID'}), 400
        
        # Check if teacher exists
        teacher = db.users_collection.find_one({'_id': ObjectId(teacher_id)})
        if not teacher or teacher.get('role') != 'teacher':
            return jsonify({'error': 'Teacher not found'}), 404
        
        # Check if student has already reviewed this teacher
        existing = db.reviews_collection.find_one({
            'student_id': current_user_id,
            'teacher_id': teacher_id
        })
        
        if existing:
            return jsonify({'error': 'You have already reviewed this teacher'}), 400
        
        review_data = {
            'student_id': current_user_id,
            'teacher_id': teacher_id,
            'rating': rating,
            'comment': comment,
            'created_at': datetime.utcnow()
        }
        
        result = db.reviews_collection.insert_one(review_data)
        
        # Update teacher rating
        reviews = list(db.reviews_collection.find({'teacher_id': teacher_id}))
        avg_rating = sum(r.get('rating', 0) for r in reviews) / len(reviews)
        
        db.teacher_profiles.update_one(
            {'_user_id': ObjectId(teacher_id)},
            {'$set': {
                '_rating': round(avg_rating, 1),
                'rating': round(avg_rating, 1)
            }}
        )
        
        return jsonify({
            'success': True,
            'message': 'Review created successfully',
            'review_id': str(result.inserted_id)
        }), 201
        
    except Exception as e:
        print(f"❌ Error in create_review: {e}")
        return jsonify({'error': str(e)}), 500


@review_bp.route('/teacher/<teacher_id>', methods=['GET'])
def get_teacher_reviews(teacher_id):
    try:
        if not ObjectId.is_valid(teacher_id):
            return jsonify({'error': 'Invalid teacher ID'}), 400
        
        reviews = list(db.reviews_collection.find({
            'teacher_id': teacher_id
        }).sort('created_at', -1))
        
        for review in reviews:
            review['_id'] = str(review['_id'])
            review['student_id'] = str(review['student_id'])
            review['teacher_id'] = str(review['teacher_id'])
            
            # Get student name
            student = db.users_collection.find_one({'_id': ObjectId(review['student_id'])})
            review['student_name'] = student.get('name', 'Unknown Student') if student else 'Unknown Student'
        
        avg_rating = 0
        if reviews:
            avg_rating = sum(r.get('rating', 0) for r in reviews) / len(reviews)
        
        return jsonify({
            'success': True,
            'reviews': reviews,
            'count': len(reviews),
            'avg_rating': round(avg_rating, 1)
        }), 200
        
    except Exception as e:
        print(f"❌ Error in get_teacher_reviews: {e}")
        return jsonify({'error': str(e)}), 500


@review_bp.route('/my', methods=['GET'])
@jwt_required()
def get_my_reviews():
    try:
        current_user_id = get_jwt_identity()
        
        reviews = list(db.reviews_collection.find({
            'student_id': current_user_id
        }).sort('created_at', -1))
        
        for review in reviews:
            review['_id'] = str(review['_id'])
            review['student_id'] = str(review['student_id'])
            review['teacher_id'] = str(review['teacher_id'])
            
            # Get teacher name
            teacher = db.users_collection.find_one({'_id': ObjectId(review['teacher_id'])})
            review['teacher_name'] = teacher.get('name', 'Unknown Teacher') if teacher else 'Unknown Teacher'
        
        return jsonify({
            'success': True,
            'reviews': reviews,
            'count': len(reviews)
        }), 200
        
    except Exception as e:
        print(f"❌ Error in get_my_reviews: {e}")
        return jsonify({'error': str(e)}), 500


@review_bp.route('/<review_id>', methods=['DELETE'])
@jwt_required()
def delete_review(review_id):
    try:
        current_user_id = get_jwt_identity()
        
        if not ObjectId.is_valid(review_id):
            return jsonify({'error': 'Invalid review ID'}), 400
        
        review = db.reviews_collection.find_one({
            '_id': ObjectId(review_id)
        })
        
        if not review:
            return jsonify({'error': 'Review not found'}), 404
        
        if str(review.get('student_id')) != current_user_id:
            return jsonify({'error': 'Unauthorized'}), 403
        
        teacher_id = review.get('teacher_id')
        
        db.reviews_collection.delete_one({'_id': ObjectId(review_id)})
        
        # Update teacher rating
        reviews = list(db.reviews_collection.find({'teacher_id': teacher_id}))
        if reviews:
            avg_rating = sum(r.get('rating', 0) for r in reviews) / len(reviews)
        else:
            avg_rating = 0
        
        db.teacher_profiles.update_one(
            {'_user_id': ObjectId(teacher_id)},
            {'$set': {
                '_rating': round(avg_rating, 1),
                'rating': round(avg_rating, 1)
            }}
        )
        
        return jsonify({
            'success': True,
            'message': 'Review deleted successfully'
        }), 200
        
    except Exception as e:
        print(f"❌ Error in delete_review: {e}")
        return jsonify({'error': str(e)}), 500
from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from bson import ObjectId
from datetime import datetime
from config.database import db

notification_bp = Blueprint('notification', __name__)


@notification_bp.route('/', methods=['GET'])
@jwt_required()
def get_notifications():
    try:
        current_user_id = get_jwt_identity()
        
        notifications = list(db.notifications_collection.find({
            'receiver_id': ObjectId(current_user_id)
        }).sort('created_at', -1))
        
        for notif in notifications:
            notif['_id'] = str(notif['_id'])
            notif['sender_id'] = str(notif['sender_id'])
            notif['receiver_id'] = str(notif['receiver_id'])
            if 'request_id' in notif:
                notif['request_id'] = str(notif['request_id'])
        
        return jsonify({
            'success': True,
            'notifications': notifications,
            'count': len(notifications)
        }), 200
        
    except Exception as e:
        print(f"❌ Error in get_notifications: {e}")
        return jsonify({'error': str(e)}), 500


@notification_bp.route('/unread-count', methods=['GET'])
@jwt_required()
def get_unread_count():
    try:
        current_user_id = get_jwt_identity()
        
        count = db.notifications_collection.count_documents({
            'receiver_id': ObjectId(current_user_id),
            'read': False
        })
        
        return jsonify({
            'success': True,
            'count': count
        }), 200
        
    except Exception as e:
        print(f"❌ Error in get_unread_count: {e}")
        return jsonify({'error': str(e)}), 500


@notification_bp.route('/<notification_id>/read', methods=['PUT'])
@jwt_required()
def mark_notification_read(notification_id):
    try:
        current_user_id = get_jwt_identity()
        
        if not ObjectId.is_valid(notification_id):
            return jsonify({'error': 'Invalid notification ID'}), 400
        
        result = db.notifications_collection.update_one(
            {
                '_id': ObjectId(notification_id),
                'receiver_id': ObjectId(current_user_id)
            },
            {'$set': {'read': True}}
        )
        
        if result.modified_count == 0:
            return jsonify({'error': 'Notification not found or already read'}), 404
        
        return jsonify({
            'success': True,
            'message': 'Notification marked as read'
        }), 200
        
    except Exception as e:
        print(f"❌ Error in mark_notification_read: {e}")
        return jsonify({'error': str(e)}), 500


@notification_bp.route('/mark-all-read', methods=['PUT'])
@jwt_required()
def mark_all_notifications_read():
    try:
        current_user_id = get_jwt_identity()
        
        result = db.notifications_collection.update_many(
            {
                'receiver_id': ObjectId(current_user_id),
                'read': False
            },
            {'$set': {'read': True}}
        )
        
        return jsonify({
            'success': True,
            'message': f'{result.modified_count} notifications marked as read'
        }), 200
        
    except Exception as e:
        print(f"❌ Error in mark_all_notifications_read: {e}")
        return jsonify({'error': str(e)}), 500


@notification_bp.route('/<notification_id>', methods=['DELETE'])
@jwt_required()
def delete_notification(notification_id):
    try:
        current_user_id = get_jwt_identity()
        
        if not ObjectId.is_valid(notification_id):
            return jsonify({'error': 'Invalid notification ID'}), 400
        
        result = db.notifications_collection.delete_one({
            '_id': ObjectId(notification_id),
            'receiver_id': ObjectId(current_user_id)
        })
        
        if result.deleted_count == 0:
            return jsonify({'error': 'Notification not found'}), 404
        
        return jsonify({
            'success': True,
            'message': 'Notification deleted successfully'
        }), 200
        
    except Exception as e:
        print(f"❌ Error in delete_notification: {e}")
        return jsonify({'error': str(e)}), 500
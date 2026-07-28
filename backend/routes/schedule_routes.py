from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from bson import ObjectId
from datetime import datetime, timedelta
from config.database import db

teacher_schedule_bp = Blueprint('teacher_schedule', __name__)


# ============================================================
# ✅ ADD SCHEDULE (Subject-wise)
# ============================================================
@teacher_schedule_bp.route('/add', methods=['POST'])
@jwt_required()
def add_schedule():
    try:
        current_user_id = get_jwt_identity()
        data = request.json
        
        subject = data.get('subject', '').strip()
        days = data.get('days', [])
        time_slots = data.get('time_slots', [])
        start_date = data.get('start_date', '')
        end_date = data.get('end_date', '')
        
        print(f"📥 Add Schedule for teacher: {current_user_id}")
        print(f"   Subject: {subject}")
        print(f"   Days: {days}")
        print(f"   Time Slots: {time_slots}")
        
        if not subject:
            return jsonify({'error': 'Subject is required'}), 400
        if not days or len(days) == 0:
            return jsonify({'error': 'Please select at least one day'}), 400
        if not time_slots or len(time_slots) == 0:
            return jsonify({'error': 'Please set time for each selected day'}), 400
        if not start_date:
            return jsonify({'error': 'Start date is required'}), 400
        
        # Get teacher profile
        profile = db.teacher_profiles.find_one({
            '$or': [
                {'_user_id': ObjectId(current_user_id)},
                {'user_id': ObjectId(current_user_id)}
            ]
        })
        
        if not profile:
            return jsonify({'error': 'Teacher profile not found'}), 404
        
        # Get existing schedules
        existing_schedules = profile.get('_schedules', []) or profile.get('schedules', [])
        
        # Check if schedule for this subject already exists
        for s in existing_schedules:
            if s.get('subject', '').lower() == subject.lower():
                return jsonify({'error': f'Schedule for {subject} already exists'}), 400
        
        # Auto-calculate end date (1 month from start date)
        if not end_date:
            start = datetime.strptime(start_date, '%Y-%m-%d')
            end = start + timedelta(days=30)
            end_date = end.strftime('%Y-%m-%d')
        
        # Create new schedule object
        new_schedule = {
            'id': str(ObjectId()),
            'subject': subject,
            'days': days,
            'time_slots': time_slots,
            'start_date': start_date,
            'end_date': end_date,
            'status': 'active',
            'created_at': datetime.utcnow().isoformat()
        }
        
        existing_schedules.append(new_schedule)
        
        # Update profile
        db.teacher_profiles.update_one(
            {'_id': profile['_id']},
            {'$set': {
                '_schedules': existing_schedules,
                'schedules': existing_schedules,
                '_updated_at': datetime.utcnow(),
                'updated_at': datetime.utcnow()
            }}
        )
        
        print(f"✅ Schedule added for subject: {subject}")
        
        return jsonify({
            'success': True,
            'message': f'Schedule for {subject} added successfully',
            'schedule': new_schedule
        }), 200
        
    except Exception as e:
        print(f"❌ Error in add_schedule: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500


# ============================================================
# ✅ GET TEACHER SCHEDULES (Subject-wise)
# ============================================================
@teacher_schedule_bp.route('/teacher/<teacher_id>', methods=['GET'])
@jwt_required()
def get_teacher_schedules(teacher_id):
    try:
        print(f"🔍 Fetching schedules for teacher: {teacher_id}")
        
        if not teacher_id or teacher_id == 'null' or teacher_id == 'undefined':
            return jsonify({'error': 'Invalid teacher ID'}), 400
        
        if not ObjectId.is_valid(teacher_id):
            return jsonify({'error': 'Invalid teacher ID format'}), 400
        
        profile = db.teacher_profiles.find_one({
            '$or': [
                {'_user_id': ObjectId(teacher_id)},
                {'user_id': ObjectId(teacher_id)}
            ]
        })
        
        if not profile:
            return jsonify({'error': 'Teacher profile not found'}), 404
        
        teaching_mode = profile.get('_teaching_mode', '') or profile.get('teaching_mode', 'online')
        schedules = profile.get('_schedules', []) or profile.get('schedules', [])
        subjects = profile.get('_subjects', []) or profile.get('subjects', [])
        
        # Ensure all schedules have status
        for schedule in schedules:
            if schedule.get('status') != 'active':
                schedule['status'] = 'active'
        
        print(f"✅ Teaching Mode: {teaching_mode}")
        print(f"✅ Found {len(schedules)} schedules for teacher")
        print(f"✅ Subjects: {subjects}")
        
        return jsonify({
            'success': True,
            'schedules': schedules,
            'teaching_mode': teaching_mode,
            'subjects': subjects
        }), 200
        
    except Exception as e:
        print(f"❌ Error in get_teacher_schedules: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500


# ============================================================
# ✅ GET TEACHER SCHEDULES BY SUBJECT
# ============================================================
@teacher_schedule_bp.route('/teacher/<teacher_id>/subject/<subject>', methods=['GET'])
@jwt_required()
def get_teacher_schedule_by_subject(teacher_id, subject):
    try:
        print(f"🔍 Fetching schedule for teacher: {teacher_id}, subject: {subject}")
        
        if not ObjectId.is_valid(teacher_id):
            return jsonify({'error': 'Invalid teacher ID'}), 400
        
        profile = db.teacher_profiles.find_one({
            '$or': [
                {'_user_id': ObjectId(teacher_id)},
                {'user_id': ObjectId(teacher_id)}
            ]
        })
        
        if not profile:
            return jsonify({'error': 'Teacher profile not found'}), 404
        
        schedules = profile.get('_schedules', []) or profile.get('schedules', [])
        
        # Find schedule for specific subject
        subject_schedule = None
        for s in schedules:
            if s.get('subject', '').lower() == subject.lower():
                subject_schedule = s
                break
        
        if not subject_schedule:
            return jsonify({
                'success': True,
                'schedule': None,
                'message': f'No schedule found for {subject}'
            }), 200
        
        return jsonify({
            'success': True,
            'schedule': subject_schedule
        }), 200
        
    except Exception as e:
        print(f"❌ Error in get_teacher_schedule_by_subject: {e}")
        return jsonify({'error': str(e)}), 500


# ============================================================
# ✅ DELETE SCHEDULE
# ============================================================
@teacher_schedule_bp.route('/delete', methods=['DELETE'])
@jwt_required()
def delete_schedule():
    try:
        current_user_id = get_jwt_identity()
        data = request.json
        
        schedule_id = data.get('schedule_id', '')
        
        if not schedule_id:
            return jsonify({'error': 'Schedule ID is required'}), 400
        
        profile = db.teacher_profiles.find_one({
            '$or': [
                {'_user_id': ObjectId(current_user_id)},
                {'user_id': ObjectId(current_user_id)}
            ]
        })
        
        if not profile:
            return jsonify({'error': 'Teacher profile not found'}), 404
        
        schedules = profile.get('_schedules', []) or profile.get('schedules', [])
        
        # Remove schedule
        original_count = len(schedules)
        schedules = [s for s in schedules if s.get('id') != schedule_id]
        
        if len(schedules) == original_count:
            return jsonify({'error': 'Schedule not found'}), 404
        
        db.teacher_profiles.update_one(
            {'_id': profile['_id']},
            {'$set': {
                '_schedules': schedules,
                'schedules': schedules,
                '_updated_at': datetime.utcnow(),
                'updated_at': datetime.utcnow()
            }}
        )
        
        return jsonify({
            'success': True,
            'message': 'Schedule deleted successfully'
        }), 200
        
    except Exception as e:
        print(f"❌ Error in delete_schedule: {e}")
        return jsonify({'error': str(e)}), 500


# ============================================================
# ✅ UPDATE SCHEDULE
# ============================================================
@teacher_schedule_bp.route('/update', methods=['PUT'])
@jwt_required()
def update_schedule():
    try:
        current_user_id = get_jwt_identity()
        data = request.json
        
        schedule_id = data.get('schedule_id', '')
        subject = data.get('subject', '').strip()
        days = data.get('days', [])
        time_slots = data.get('time_slots', [])
        start_date = data.get('start_date', '')
        end_date = data.get('end_date', '')
        
        if not schedule_id:
            return jsonify({'error': 'Schedule ID is required'}), 400
        if not subject:
            return jsonify({'error': 'Subject is required'}), 400
        if not days or len(days) == 0:
            return jsonify({'error': 'Please select at least one day'}), 400
        if not time_slots or len(time_slots) == 0:
            return jsonify({'error': 'Please set time for each selected day'}), 400
        
        profile = db.teacher_profiles.find_one({
            '$or': [
                {'_user_id': ObjectId(current_user_id)},
                {'user_id': ObjectId(current_user_id)}
            ]
        })
        
        if not profile:
            return jsonify({'error': 'Teacher profile not found'}), 404
        
        schedules = profile.get('_schedules', []) or profile.get('schedules', [])
        
        # Find and update schedule
        updated = False
        for s in schedules:
            if s.get('id') == schedule_id:
                s['subject'] = subject
                s['days'] = days
                s['time_slots'] = time_slots
                s['start_date'] = start_date
                s['end_date'] = end_date
                updated = True
                break
        
        if not updated:
            return jsonify({'error': 'Schedule not found'}), 404
        
        db.teacher_profiles.update_one(
            {'_id': profile['_id']},
            {'$set': {
                '_schedules': schedules,
                'schedules': schedules,
                '_updated_at': datetime.utcnow(),
                'updated_at': datetime.utcnow()
            }}
        )
        
        return jsonify({
            'success': True,
            'message': 'Schedule updated successfully'
        }), 200
        
    except Exception as e:
        print(f"❌ Error in update_schedule: {e}")
        return jsonify({'error': str(e)}), 500


# ============================================================
# ✅ CHECK SCHEDULE COMPLETION STATUS - FIX ADDED
# ============================================================
@teacher_schedule_bp.route('/completion-status/<teacher_id>', methods=['GET'])
@jwt_required()
def check_schedule_completion(teacher_id):
    """
    Check if teacher has completed schedules for all their subjects.
    This ALWAYS checks the database - no frontend state dependency.
    """
    try:
        print(f"🔍 Checking schedule completion for teacher: {teacher_id}")
        
        if not teacher_id or teacher_id == 'null' or teacher_id == 'undefined':
            return jsonify({'error': 'Invalid teacher ID'}), 400
        
        if not ObjectId.is_valid(teacher_id):
            return jsonify({'error': 'Invalid teacher ID format'}), 400
        
        # Get teacher profile from database
        profile = db.teacher_profiles.find_one({
            '$or': [
                {'_user_id': ObjectId(teacher_id)},
                {'user_id': ObjectId(teacher_id)}
            ]
        })
        
        if not profile:
            return jsonify({'error': 'Teacher profile not found'}), 404
        
        # Get subjects from profile
        subjects = profile.get('_subjects', []) or profile.get('subjects', [])
        
        # Get schedules from profile
        schedules = profile.get('_schedules', []) or profile.get('schedules', [])
        
        # Get scheduled subject names
        scheduled_subjects = [s.get('subject', '') for s in schedules]
        
        # Find pending subjects (subjects without schedules)
        pending_subjects = [sub for sub in subjects if sub not in scheduled_subjects]
        
        # Calculate completion status
        total_subjects = len(subjects)
        completed_subjects = len(scheduled_subjects)
        is_complete = total_subjects > 0 and completed_subjects == total_subjects
        
        print(f"📊 Total Subjects: {total_subjects}")
        print(f"📊 Scheduled: {completed_subjects}")
        print(f"📊 Pending: {len(pending_subjects)}")
        print(f"📊 Is Complete: {is_complete}")
        
        return jsonify({
            'success': True,
            'schedule_completed': is_complete,
            'total_subjects': total_subjects,
            'completed_subjects': completed_subjects,
            'pending_subjects': pending_subjects,
            'subjects': subjects,
            'scheduled_subjects': scheduled_subjects
        }), 200
        
    except Exception as e:
        print(f"❌ Error in check_schedule_completion: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500
from datetime import datetime
from bson import ObjectId

class EnrollmentRequest:
    def __init__(self, data):
        self.teacher_id = data.get('teacher_id')
        self.teacher_name = data.get('teacher_name')
        self.student_id = data.get('student_id')
        self.student_name = data.get('student_name')
        self.subject = data.get('subject')
        self.learning_mode = data.get('learning_mode')
        self.preferred_time = data.get('preferred_time')
        self.message = data.get('message', '')
        self.fee = data.get('fee', '')
        self.status = data.get('status', 'pending')
        self.created_at = data.get('created_at', datetime.utcnow())
        self.updated_at = data.get('updated_at', datetime.utcnow())

    def to_dict(self):
        return {
            'teacher_id': self.teacher_id,
            'teacher_name': self.teacher_name,
            'student_id': self.student_id,
            'student_name': self.student_name,
            'subject': self.subject,
            'learning_mode': self.learning_mode,
            'preferred_time': self.preferred_time,
            'message': self.message,
            'fee': self.fee,
            'status': self.status,
            'created_at': self.created_at,
            'updated_at': self.updated_at
        }
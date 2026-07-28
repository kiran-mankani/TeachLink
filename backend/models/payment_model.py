# backend/models/payment_model.py
from datetime import datetime

class Payment:
    def __init__(self, data):
        self.enrollment_id = data.get('enrollment_id')
        self.student_id = data.get('student_id')
        self.teacher_id = data.get('teacher_id')
        self.student_name = data.get('student_name', '')
        self.teacher_name = data.get('teacher_name', '')
        self.subject = data.get('subject', '')
        self.amount = data.get('amount', 0)
        self.commission = data.get('commission', 0)  # Platform commission
        self.teacher_amount = data.get('teacher_amount', 0)  # Amount teacher receives
        self.payment_method = data.get('payment_method', '')
        self.transaction_id = data.get('transaction_id', '')
        self.status = data.get('status', 'pending')  # pending, paid, failed
        self.payment_date = data.get('payment_date', datetime.utcnow())
        self.created_at = datetime.utcnow()
        self.updated_at = datetime.utcnow()

    def to_dict(self):
        return {
            'enrollment_id': self.enrollment_id,
            'student_id': self.student_id,
            'teacher_id': self.teacher_id,
            'student_name': self.student_name,
            'teacher_name': self.teacher_name,
            'subject': self.subject,
            'amount': self.amount,
            'commission': self.commission,
            'teacher_amount': self.teacher_amount,
            'payment_method': self.payment_method,
            'transaction_id': self.transaction_id,
            'status': self.status,
            'payment_date': self.payment_date,
            'created_at': self.created_at,
            'updated_at': self.updated_at
        }
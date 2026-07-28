from flask import Blueprint

# Import all route blueprints
from .auth_routes import auth_bp
from .student_routes import student_bp
from .teacher_routes import teacher_bp
from .profile_routes import profile_bp
from .notification_routes import notification_bp
from .request_routes import request_bp
from .enrollment_routes import enrollment_bp
from .admin_routes import admin_bp
from .match_routes import match_bp
from .payment_routes import payment_bp
from .review_routes import review_bp
from .schedule_routes import teacher_schedule_bp as schedule_bp
from .chat_routes import chat_bp
from .attendance_routes import attendance_bp

def register_routes(app):
    """Register all route blueprints with the Flask app"""
    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    app.register_blueprint(student_bp, url_prefix='/api/student')
    app.register_blueprint(teacher_bp, url_prefix='/api/teacher')
    app.register_blueprint(profile_bp, url_prefix='/api/profile')
    app.register_blueprint(notification_bp, url_prefix='/api/notifications')
    app.register_blueprint(request_bp, url_prefix='/api/requests')
    app.register_blueprint(enrollment_bp, url_prefix='/api/enrollment')
    app.register_blueprint(admin_bp, url_prefix='/api/admin')
    app.register_blueprint(match_bp, url_prefix='/api/match')
    app.register_blueprint(payment_bp, url_prefix='/api/payments')
    app.register_blueprint(review_bp, url_prefix='/api/reviews')
    app.register_blueprint(schedule_bp, url_prefix='/api/schedule')
    app.register_blueprint(chat_bp, url_prefix='/api/chat')
    app.register_blueprint(attendance_bp, url_prefix='/api/attendance')
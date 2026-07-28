from flask import Flask, jsonify
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from datetime import timedelta
import os
from dotenv import load_dotenv

from config.database import db

load_dotenv()

app = Flask(__name__)

# Configuration
app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'your-secret-key-here')
app.config['JWT_SECRET_KEY'] = os.getenv('JWT_SECRET_KEY', 'jwt-secret-key-here')
app.config['JWT_ACCESS_TOKEN_EXPIRES'] = timedelta(days=1)

# CORS configuration
CORS(app, origins=["http://localhost:5173"], supports_credentials=True)

jwt = JWTManager(app)

# Import all blueprints
from routes.auth_routes import auth_bp
from routes.student_routes import student_bp
from routes.teacher_routes import teacher_bp
from routes.request_routes import request_bp
from routes.profile_routes import profile_bp
from routes.match_routes import match_bp
from routes.notification_routes import notification_bp
from routes.payment_routes import payment_bp
from routes.review_routes import review_bp
from routes.schedule_routes import teacher_schedule_bp
from routes.enrollment_routes import enrollment_bp
from routes.chat_routes import chat_bp
from routes.attendance_routes import attendance_bp
from routes.admin_routes import admin_bp  # ✅ ADDED - Admin routes import

# Register all blueprints
app.register_blueprint(auth_bp, url_prefix='/api/auth')
app.register_blueprint(student_bp, url_prefix='/api/student')
app.register_blueprint(teacher_bp, url_prefix='/api/teacher')
app.register_blueprint(profile_bp, url_prefix='/api/profile')
app.register_blueprint(request_bp, url_prefix='/api/requests')
app.register_blueprint(match_bp, url_prefix='/api/match')
app.register_blueprint(notification_bp, url_prefix='/api/notifications')
app.register_blueprint(payment_bp, url_prefix='/api/payments')
app.register_blueprint(review_bp, url_prefix='/api/reviews')
app.register_blueprint(teacher_schedule_bp, url_prefix='/api/schedule')
app.register_blueprint(enrollment_bp, url_prefix='/api/enrollment')
app.register_blueprint(chat_bp, url_prefix='/api/chat')
app.register_blueprint(attendance_bp, url_prefix='/api/attendance')
app.register_blueprint(admin_bp, url_prefix='/api/admin')  # ✅ ADDED - Admin blueprint register


# Health check route
@app.route('/api/health', methods=['GET'])
def health_check():
    return jsonify({
        'status': 'healthy',
        'message': 'TeachLink API is running',
        'version': '1.0.0'
    }), 200

# Error handlers
@app.errorhandler(404)
def not_found(error):
    return jsonify({'error': 'Resource not found'}), 404

@app.errorhandler(500)
def internal_error(error):
    return jsonify({'error': 'Internal server error'}), 500


if __name__ == '__main__':
    app.run(debug=False, port=5000)
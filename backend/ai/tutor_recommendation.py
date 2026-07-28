"""
AI Recommendation engine for teachers (recommending students)
"""

from bson import ObjectId
from config.database import db
from .recommendation_utils import calculate_subject_match_score
from .location_data import get_area_distance_score, get_area_match_label


def get_tutor_recommendations(teacher_id):
    """
    Get AI recommendations for a teacher - returns top students
    """
    try:
        # 1. Get teacher profile
        teacher = db.teacher_profiles.find_one({
            '$or': [
                {'_user_id': ObjectId(teacher_id)},
                {'user_id': ObjectId(teacher_id)}
            ]
        })
        
        if not teacher:
            print("❌ Teacher not found")
            return []
        
        # 2. ✅ FIXED: Extract teacher subject names from dict format
        teacher_subjects_raw = teacher.get('_subjects', []) or teacher.get('subjects', [])
        if teacher_subjects_raw and isinstance(teacher_subjects_raw, list):
            if teacher_subjects_raw and isinstance(teacher_subjects_raw[0], dict):
                # New format: [{'subject': 'Physics', 'fee': 5000}]
                teacher_subjects = [s.get('subject', '') for s in teacher_subjects_raw if isinstance(s, dict)]
            else:
                # Old format: ['Physics', 'Math']
                teacher_subjects = teacher_subjects_raw
        else:
            teacher_subjects = []
        
        teacher_area = teacher.get('_location', '') or teacher.get('location', '')
        
        print(f"📌 Teacher Preferences:")
        print(f"   Area: {teacher_area}")
        print(f"   Subjects: {teacher_subjects}")
        
        if not teacher_subjects:
            print("⚠️ Teacher has no subjects - cannot recommend")
            return []
        
        # 3. Get all students
        students = list(db.student_profiles.find())
        print(f"📌 Found {len(students)} students in database")
        
        recommendations = []
        
        for student in students:
            # ✅ FIXED: Extract student subject names from dict format
            student_subjects_raw = student.get('_subjects', []) or student.get('subjects', [])
            if student_subjects_raw and isinstance(student_subjects_raw, list):
                if student_subjects_raw and isinstance(student_subjects_raw[0], dict):
                    # New format: [{'subject': 'Physics', 'fee': 5000}]
                    student_subjects = [s.get('subject', '') for s in student_subjects_raw if isinstance(s, dict)]
                else:
                    # Old format: ['Physics', 'Math']
                    student_subjects = student_subjects_raw
            else:
                student_subjects = []
            
            if not student_subjects:
                continue
            
            # ✅ Now both are string arrays, safe to pass to calculate_subject_match_score
            subject_match = calculate_subject_match_score(student_subjects, teacher_subjects)
            
            if subject_match <= 0:
                continue
            
            student_area = student.get('_location', '') or student.get('location', '')
            area_match = get_area_distance_score(teacher_area, student_area)
            
            # Calculate overall score (simplified for teacher)
            weights = {
                'area': 0.40,
                'subject': 0.60
            }
            
            overall_score = (
                (area_match * weights['area']) +
                (subject_match * weights['subject'])
            )
            
            # Clamp overall score between 0 and 100
            overall_score = max(0, min(100, overall_score))
            
            student_user_id = student.get('_user_id', '') or student.get('user_id', '')
            student_name = student.get('_name', '') or student.get('name', 'Unknown Student')
            student_profile_pic = student.get('_profile_picture', '') or student.get('profile_picture', '')
            student_education = student.get('_education_level', '') or student.get('education_level', '')
            student_learning_mode = student.get('_learning_mode', '') or student.get('learning_mode', '')
            
            recommendations.append({
                'student_id': str(student['_id']),
                'user_id': str(student_user_id) if student_user_id else '',
                'name': student_name,
                'subjects': student_subjects,
                'profile_picture': student_profile_pic,
                'education': student_education,
                'learning_mode': student_learning_mode,
                'location': student_area,
                'match_score': round(overall_score, 1),
                'area_match_label': get_area_match_label(area_match)[0]
            })
        
        recommendations.sort(key=lambda x: x['match_score'], reverse=True)
        
        print(f"📌 Returning {len(recommendations)} student recommendations")
        return recommendations[:10]  # Top 10 for teacher
        
    except Exception as e:
        print(f"❌ Error in get_tutor_recommendations: {e}")
        import traceback
        traceback.print_exc()
        return []
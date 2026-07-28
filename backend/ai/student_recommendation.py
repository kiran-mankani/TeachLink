"""
AI Recommendation engine for students (recommending teachers)
"""

from bson import ObjectId
from config.database import db
from .recommendation_utils import (
    calculate_subject_match_score,
    calculate_budget_match_score,
    calculate_mode_match_score,
    get_match_badge,
    get_match_reasons
)
from .location_data import get_area_distance_score, get_area_match_label
from .time_matching import calculate_time_match_score, get_teacher_time_shifts


class StudentRecommender:
    """AI Recommendation Engine for Students - Finds best matching teachers"""
    
    def __init__(self, student_profile, teacher_profiles):
        self.student = student_profile
        self.teachers = teacher_profiles
    
    def get_student_field(self, field_name):
        return self.student.get(f'_{field_name}', '') or self.student.get(field_name, '')
    
    def get_teacher_field(self, teacher, field_name):
        return teacher.get(f'_{field_name}', '') or teacher.get(field_name, '')
    
    # ✅ PRIORITY 1: Area/Location Match (35% weight - highest)
    def calculate_area_match(self, student_area, teacher_area):
        """
        Calculate area match score (0-35)
        Priority 1 - Location matching
        """
        if not student_area or not teacher_area:
            return 0
        
        # Exact area match
        if student_area.lower() == teacher_area.lower():
            return 35  # ✅ 100% area match
        
        # Get distance score (0-100)
        distance_score = get_area_distance_score(student_area, teacher_area)
        # Convert to 0-35 scale
        return (distance_score / 100) * 35
    
    # ✅ PRIORITY 2: Subject Match (25% weight)
    def calculate_subject_match(self, student_subjects, teacher_subjects):
        """
        Calculate subject match score (0-25)
        Priority 2 - Subject matching
        """
        if not student_subjects or not teacher_subjects:
            return 0
        
        student_strings = []
        for s in student_subjects:
            if isinstance(s, str):
                student_strings.append(s)
            elif isinstance(s, dict):
                subject_name = s.get('subject', '') or s.get('name', '') or s.get('title', '')
                if subject_name:
                    student_strings.append(subject_name)
        
        teacher_strings = []
        for s in teacher_subjects:
            if isinstance(s, str):
                teacher_strings.append(s)
            elif isinstance(s, dict):
                subject_name = s.get('subject', '') or s.get('name', '') or s.get('title', '')
                if subject_name:
                    teacher_strings.append(subject_name)
        
        if not student_strings or not teacher_strings:
            return 0
        
        common = set(student_strings) & set(teacher_strings)
        if not common:
            return 0
        
        max_possible = max(len(student_strings), len(teacher_strings))
        if max_possible == 0:
            return 0
        
        match_percentage = (len(common) / max_possible) * 100
        # Convert to 0-25 scale
        score = (match_percentage / 100) * 25
        return round(score, 1)
    
    # ✅ PRIORITY 3: Mode Match (20% weight)
    def calculate_mode_match(self, student_mode, teacher_mode):
        """
        Calculate teaching mode match score (0-20)
        Priority 3 - Mode matching
        """
        if not student_mode or not teacher_mode:
            return 0
        
        student_mode = student_mode.lower().strip()
        teacher_mode = teacher_mode.lower().strip()
        
        if student_mode == teacher_mode:
            return 20
        
        if 'both' in student_mode or 'both' in teacher_mode:
            return 15
        
        return 0
    
    # ✅ PRIORITY 4: Budget Match (15% weight - reduced from 20%)
    def calculate_budget_match(self, student_budget, teacher_fee):
        """
        Calculate budget/fee match score (0-15)
        Priority 4 - Budget matching
        MAX: 15 (100%)
        MIN: 0 (0%)
        """
        if not student_budget or not teacher_fee:
            return 0
        
        try:
            import re
            
            student_clean = str(student_budget).replace('Rs.', '').replace(',', '').strip()
            
            if '–' in student_clean:
                parts = student_clean.split('–')
            elif '-' in student_clean:
                parts = student_clean.split('-')
            else:
                numbers = re.findall(r'\d+', student_clean)
                if numbers:
                    val = int(numbers[0])
                    if '+' in student_clean:
                        return 15 if teacher_fee >= val else 0
                    return 15 if teacher_fee <= val else 0
                return 0
            
            if len(parts) == 2:
                student_min = int(''.join(re.findall(r'\d+', parts[0].strip())))
                student_max = int(''.join(re.findall(r'\d+', parts[1].strip())))
            else:
                return 0
            
            teacher_fee_clean = str(teacher_fee).replace('Rs.', '').replace(',', '').strip()
            teacher_fee_num = int(''.join(re.findall(r'\d+', teacher_fee_clean))) if re.findall(r'\d+', teacher_fee_clean) else 0
            
            if teacher_fee_num == 0:
                return 0
            
            # EXACT range matching - MAX 15 (100%), MIN 0 (0%)
            if student_min <= teacher_fee_num <= student_max:
                return 15
            else:
                return 0
            
        except Exception as e:
            print(f"⚠️ Budget match error: {e}")
            return 0
    
    # ✅ PRIORITY 5: Time/Schedule Match (5% weight - bonus)
    def calculate_time_match(self, student_time, teacher_time_shifts):
        """
        Calculate time/schedule match score (0-5)
        Priority 5 - Time matching (bonus)
        """
        if not student_time or not teacher_time_shifts:
            return 0
        
        # Calculate time match using existing function
        time_score = calculate_time_match_score(student_time, teacher_time_shifts)
        # Convert to 0-5 scale
        return (time_score / 100) * 5
    
    def calculate_rating_match(self, teacher_rating):
        """Calculate rating match score (0-5)"""
        if teacher_rating > 0:
            return min(teacher_rating, 5)
        return 0
    
    def has_schedule(self, teacher):
        """Check if teacher has at least one schedule"""
        schedules = teacher.get('_schedules', []) or teacher.get('schedules', [])
        return len(schedules) > 0
    
    def is_visible(self, teacher):
        """Check if teacher should be visible in recommendations"""
        is_complete = teacher.get('_isProfileComplete', False) or teacher.get('isProfileComplete', False)
        return is_complete
    
    def get_subject_fees(self, teacher):
        """Extract subject-wise fees from teacher profile"""
        subjects_raw = teacher.get('_subjects', []) or teacher.get('subjects', [])
        subject_fees = []
        
        if subjects_raw and isinstance(subjects_raw, list):
            if subjects_raw and isinstance(subjects_raw[0], dict):
                subject_fees = subjects_raw
            else:
                subject_fees = [{'subject': s, 'fee': 0} for s in subjects_raw if s]
        
        return subject_fees
    
    def get_fee_for_subject(self, subject_fees, subject_name):
        """Get fee for a specific subject from subject_fees array"""
        for s in subject_fees:
            if s.get('subject', '') == subject_name:
                return s.get('fee', 0)
        return 0
    
    def get_student_subject_budget(self, student_subjects, subject_name):
        """Get budget for a specific subject from student's subjects"""
        for s in student_subjects:
            if isinstance(s, dict):
                if s.get('subject') == subject_name:
                    return s.get('budget', '')
        return None
    
    def get_match_score(self, teacher):
        """Calculate overall match score for a single teacher"""
        if not self.is_visible(teacher):
            return None
        
        # Get student fields
        student_area = self.get_student_field('location')
        student_subjects = self.student.get('_subjects', []) or self.student.get('subjects', [])
        student_mode = self.get_student_field('learning_mode')
        student_global_budget = self.student.get('_budget_range', '') or self.student.get('budget_range', '')
        student_study_time = self.student.get('_study_time', '') or self.student.get('study_time', '')
        
        # Get teacher fields
        teacher_area = self.get_teacher_field(teacher, 'location')
        
        subject_fees = self.get_subject_fees(teacher)
        teacher_subjects = []
        for s in subject_fees:
            if isinstance(s, dict):
                subject_name = s.get('subject', '')
                if subject_name:
                    teacher_subjects.append(subject_name)
            elif isinstance(s, str):
                teacher_subjects.append(s)
        
        if not teacher_subjects:
            teacher_subjects_raw = teacher.get('_subjects', []) or teacher.get('subjects', [])
            if teacher_subjects_raw and isinstance(teacher_subjects_raw, list):
                for s in teacher_subjects_raw:
                    if isinstance(s, str):
                        teacher_subjects.append(s)
                    elif isinstance(s, dict):
                        subject_name = s.get('subject', '')
                        if subject_name:
                            teacher_subjects.append(subject_name)
        
        teacher_mode = self.get_teacher_field(teacher, 'teaching_mode')
        teacher_rating = teacher.get('_rating', 0) or teacher.get('rating', 0)
        
        # ✅ PRIORITY 1: Area Match (35%)
        area_score = self.calculate_area_match(student_area, teacher_area)
        
        # ✅ If area match is 0 (no match at all), still show but with low score
        # But we don't skip teachers based on area anymore
        
        # ✅ PRIORITY 2: Subject Match (25%)
        subject_score = self.calculate_subject_match(student_subjects, teacher_subjects)
        
        # ✅ If no subject match, reduce score significantly
        if subject_score == 0:
            # Still show teacher but with very low score
            # This ensures students can see all teachers
            pass
        
        # ✅ PRIORITY 3: Mode Match (20%)
        mode_score = self.calculate_mode_match(student_mode, teacher_mode)
        
        # ✅ PRIORITY 4: Budget Match (15%)
        matching_subject = None
        student_strings = []
        for s in student_subjects:
            if isinstance(s, str):
                student_strings.append(s)
            elif isinstance(s, dict):
                subject_name = s.get('subject', '')
                if subject_name:
                    student_strings.append(subject_name)
        
        for s in student_strings:
            if s in teacher_subjects:
                matching_subject = s
                break
        
        fee_for_matching = 0
        student_budget_for_matching = student_global_budget
        
        if matching_subject:
            fee_for_matching = self.get_fee_for_subject(subject_fees, matching_subject)
            subject_budget = self.get_student_subject_budget(student_subjects, matching_subject)
            if subject_budget:
                student_budget_for_matching = subject_budget
        
        budget_score = self.calculate_budget_match(student_budget_for_matching, fee_for_matching)
        
        # ✅ PRIORITY 5: Time/Schedule Match (5%)
        time_slots = teacher.get('_time_slots', []) or teacher.get('time_slots', [])
        teacher_time_shifts = get_teacher_time_shifts(time_slots)
        time_score = self.calculate_time_match(student_study_time, teacher_time_shifts)
        
        # ✅ Rating bonus (up to 5)
        rating_score = self.calculate_rating_match(teacher_rating)
        
        # ✅ Availability bonus (up to 5)
        has_schedule = self.has_schedule(teacher)
        availability_score = 5 if has_schedule else 0
        
        # ✅ Calculate total (max: 35 + 25 + 20 + 15 + 5 + 5 + 5 = 110)
        total = area_score + subject_score + mode_score + budget_score + time_score + rating_score + availability_score
        
        # Clamp between 0 and 100
        if total > 100:
            total = 100
        if total < 0:
            total = 0
        
        return {
            'total': round(total, 1),
            'breakdown': {
                'area': {'score': round(area_score, 1), 'max': 35, 'label': '📍 Location'},
                'subject': {'score': round(subject_score, 1), 'max': 25, 'label': '📚 Subject'},
                'mode': {'score': round(mode_score, 1), 'max': 20, 'label': '💻 Mode'},
                'budget': {'score': round(budget_score, 1), 'max': 15, 'label': '💰 Budget'},
                'time': {'score': round(time_score, 1), 'max': 5, 'label': '🕐 Time'},
                'availability': {'score': availability_score, 'max': 5, 'label': '📅 Available'},
                'rating': {'score': round(rating_score, 1), 'max': 5, 'label': '⭐ Rating'}
            },
            'matching_subject': matching_subject,
            'fee_for_matching': fee_for_matching,
            'student_budget': student_budget_for_matching,
            'area_match_label': get_area_match_label(area_score)[0] if area_score > 0 else 'Not in area'
        }
    
    def get_recommendations(self, min_score=0):
        """Get all teacher recommendations sorted by match score"""
        results = []
        
        for teacher in self.teachers:
            if not self.is_visible(teacher):
                continue
            
            match = self.get_match_score(teacher)
            if match is None:
                continue
            
            # ✅ Don't filter by min_score - show all teachers
            results.append({
                'teacher': teacher,
                'match_score': match['total'],
                'match_breakdown': match['breakdown'],
                'matching_subject': match.get('matching_subject'),
                'fee_for_matching': match.get('fee_for_matching', 0),
                'area_match_label': match.get('area_match_label', 'Unknown')
            })
        
        # ✅ Sort by match score descending (highest first)
        results.sort(key=lambda x: x['match_score'], reverse=True)
        return results


def get_student_recommendations(student_id):
    """Get AI recommendations for a student - returns top 10 teachers"""
    try:
        student = db.student_profiles.find_one({
            '$or': [
                {'_user_id': ObjectId(student_id)},
                {'user_id': ObjectId(student_id)}
            ]
        })
        
        if not student:
            print("❌ Student not found")
            return []
        
        student_area = student.get('_location', '') or student.get('location', '')
        student_subjects = student.get('_subjects', []) or student.get('subjects', [])
        student_global_budget = student.get('_budget_range', '') or student.get('budget_range', '')
        student_learning_mode = student.get('_learning_mode', '') or student.get('learning_mode', '')
        student_study_time = student.get('_study_time', '') or student.get('study_time', '')
        
        print(f"📌 Student Preferences:")
        print(f"   Area: {student_area}")
        print(f"   Subjects with Budgets: {student_subjects}")
        print(f"   Global Budget: {student_global_budget}")
        print(f"   Mode: {student_learning_mode}")
        print(f"   Study Time: {student_study_time}")
        print(f"   Priority: Area → Subject → Mode → Budget → Time")
        
        if not student_subjects:
            print("⚠️ Student has no subjects - cannot recommend")
            return []
        
        # Get all teachers with complete profiles
        teachers = list(db.teacher_profiles.find({
            '$or': [
                {'_isProfileComplete': True},
                {'isProfileComplete': True}
            ]
        }))
        
        print(f"📌 Found {len(teachers)} teachers with complete profiles")
        
        # Get teacher user details
        teacher_users = {}
        for teacher in teachers:
            user_id = teacher.get('_user_id', '') or teacher.get('user_id', '')
            if user_id:
                user = db.users_collection.find_one({'_id': ObjectId(user_id)})
                if user:
                    teacher_users[str(user_id)] = user
        
        # Run AI recommendation
        recommender = StudentRecommender(student, teachers)
        recommendations = recommender.get_recommendations(min_score=0)
        
        print(f"📌 Found {len(recommendations)} recommended teachers")
        
        # Format results
        result = []
        for rec in recommendations[:10]:  # Top 10
            teacher = rec['teacher']
            user_id = teacher.get('_user_id', '') or teacher.get('user_id', '')
            user = teacher_users.get(str(user_id), {})
            
            teacher_area = teacher.get('_location', '') or teacher.get('location', '')
            
            # ✅ Get area match from breakdown
            breakdown = rec.get('match_breakdown', {})
            area_match = breakdown.get('area', {}).get('score', 0)
            subject_match_score = breakdown.get('subject', {}).get('score', 0)
            mode_match_score = breakdown.get('mode', {}).get('score', 0)
            budget_match_score = breakdown.get('budget', {}).get('score', 0)
            time_match_score = breakdown.get('time', {}).get('score', 0)
            
            # ✅ Get subject-wise fees
            subject_fees = recommender.get_subject_fees(teacher)
            teacher_subjects = []
            for s in subject_fees:
                if isinstance(s, dict):
                    subject_name = s.get('subject', '')
                    if subject_name:
                        teacher_subjects.append(subject_name)
                elif isinstance(s, str):
                    teacher_subjects.append(s)
            
            if not teacher_subjects:
                teacher_subjects_raw = teacher.get('_subjects', []) or teacher.get('subjects', [])
                if teacher_subjects_raw and isinstance(teacher_subjects_raw, list):
                    for s in teacher_subjects_raw:
                        if isinstance(s, str):
                            teacher_subjects.append(s)
                        elif isinstance(s, dict):
                            subject_name = s.get('subject', '')
                            if subject_name:
                                teacher_subjects.append(subject_name)
            
            student_subject_strings = []
            for s in student_subjects:
                if isinstance(s, str):
                    student_subject_strings.append(s)
                elif isinstance(s, dict):
                    subject_name = s.get('subject', '')
                    if subject_name:
                        student_subject_strings.append(subject_name)
            
            subject_match = calculate_subject_match_score(student_subject_strings, teacher_subjects)
            
            matching_subject = rec.get('matching_subject')
            fee_for_matching = rec.get('fee_for_matching', 0)
            student_budget = rec.get('student_budget', student_global_budget)
            
            budget_match = calculate_budget_match_score(student_budget, fee_for_matching)
            
            teacher_mode = teacher.get('_teaching_mode', '')
            if not teacher_mode:
                teacher_mode = teacher.get('teaching_mode', '')
            if not teacher_mode:
                teacher_mode = 'online'
            
            mode_match = calculate_mode_match_score(student_learning_mode, teacher_mode)
            
            time_slots = teacher.get('_time_slots', []) or teacher.get('time_slots', [])
            teacher_time_shifts = get_teacher_time_shifts(time_slots)
            time_match = calculate_time_match_score(student_study_time, teacher_time_shifts)
            
            match_details = {
                'area_match': area_match,
                'subject_match': subject_match,
                'budget_match': budget_match,
                'mode_match': mode_match,
                'time_match': time_match,
                'mode': teacher_mode,
                'time': student_study_time
            }
            
            final_score = rec['match_score']
            if final_score > 100:
                final_score = 100
            if final_score < 0:
                final_score = 0
            
            badge, badge_icon = get_match_badge(final_score)
            match_reasons = get_match_reasons(match_details)
            
            # ✅ Get area match label
            area_match_label = 'Exact Area'
            if area_match < 35 and area_match > 0:
                area_match_label = 'Nearby Area'
            elif area_match == 0:
                area_match_label = 'Other Area'
            
            result.append({
                'teacher_id': str(user_id),
                'name': user.get('name', 'Unknown Teacher'),
                'profile_picture': teacher.get('_profile_picture', '') or teacher.get('profile_picture', ''),
                'subjects': teacher_subjects,
                'subject_fees': subject_fees,
                'matching_subject': matching_subject,
                'fee_for_matching': fee_for_matching,
                'student_budget': student_budget,
                'teaching_mode': teacher_mode,
                'location': teacher_area,
                'rating': teacher.get('_rating', 0) or teacher.get('rating', 0),
                'experience': teacher.get('_experience', '') or teacher.get('experience', ''),
                'qualification': teacher.get('_qualification', '') or teacher.get('qualification', ''),
                'bio': teacher.get('_bio', '') or teacher.get('bio', ''),
                'match_score': final_score,
                'match_badge': badge,
                'match_badge_icon': badge_icon,
                'match_details': match_details,
                'match_reasons': match_reasons,
                'area_match_label': area_match_label,
                'is_recommended': True,
                # ✅ New breakdown fields for display
                'match_breakdown': breakdown
            })
        
        print(f"📌 Returning {len(result)} teachers with max score: {max([r['match_score'] for r in result]) if result else 0}")
        return result
        
    except Exception as e:
        print(f"❌ Error in get_student_recommendations: {e}")
        import traceback
        traceback.print_exc()
        return []


def get_all_recommended_teachers(student_id):
    """Get all recommended teachers (for View All page)"""
    try:
        student = db.student_profiles.find_one({
            '$or': [
                {'_user_id': ObjectId(student_id)},
                {'user_id': ObjectId(student_id)}
            ]
        })
        
        if not student:
            return []
        
        student_area = student.get('_location', '') or student.get('location', '')
        student_subjects = student.get('_subjects', []) or student.get('subjects', [])
        student_global_budget = student.get('_budget_range', '') or student.get('budget_range', '')
        student_learning_mode = student.get('_learning_mode', '') or student.get('learning_mode', '')
        student_study_time = student.get('_study_time', '') or student.get('study_time', '')
        
        if not student_subjects:
            return []
        
        teachers = list(db.teacher_profiles.find({
            '$or': [
                {'_isProfileComplete': True},
                {'isProfileComplete': True}
            ]
        }))
        
        teacher_users = {}
        for teacher in teachers:
            user_id = teacher.get('_user_id', '') or teacher.get('user_id', '')
            if user_id:
                user = db.users_collection.find_one({'_id': ObjectId(user_id)})
                if user:
                    teacher_users[str(user_id)] = user
        
        recommender = StudentRecommender(student, teachers)
        recommendations = recommender.get_recommendations(min_score=0)
        
        result = []
        for rec in recommendations:
            teacher = rec['teacher']
            user_id = teacher.get('_user_id', '') or teacher.get('user_id', '')
            user = teacher_users.get(str(user_id), {})
            
            teacher_area = teacher.get('_location', '') or teacher.get('location', '')
            
            breakdown = rec.get('match_breakdown', {})
            area_match = breakdown.get('area', {}).get('score', 0)
            
            subject_fees = recommender.get_subject_fees(teacher)
            teacher_subjects = []
            for s in subject_fees:
                if isinstance(s, dict):
                    subject_name = s.get('subject', '')
                    if subject_name:
                        teacher_subjects.append(subject_name)
                elif isinstance(s, str):
                    teacher_subjects.append(s)
            
            if not teacher_subjects:
                teacher_subjects_raw = teacher.get('_subjects', []) or teacher.get('subjects', [])
                if teacher_subjects_raw and isinstance(teacher_subjects_raw, list):
                    for s in teacher_subjects_raw:
                        if isinstance(s, str):
                            teacher_subjects.append(s)
                        elif isinstance(s, dict):
                            subject_name = s.get('subject', '')
                            if subject_name:
                                teacher_subjects.append(subject_name)
            
            student_subject_strings = []
            for s in student_subjects:
                if isinstance(s, str):
                    student_subject_strings.append(s)
                elif isinstance(s, dict):
                    subject_name = s.get('subject', '')
                    if subject_name:
                        student_subject_strings.append(subject_name)
            
            subject_match = calculate_subject_match_score(student_subject_strings, teacher_subjects)
            
            matching_subject = rec.get('matching_subject')
            fee_for_matching = rec.get('fee_for_matching', 0)
            student_budget = rec.get('student_budget', student_global_budget)
            
            budget_match = calculate_budget_match_score(student_budget, fee_for_matching)
            
            teacher_mode = teacher.get('_teaching_mode', '')
            if not teacher_mode:
                teacher_mode = teacher.get('teaching_mode', '')
            if not teacher_mode:
                teacher_mode = 'online'
            
            mode_match = calculate_mode_match_score(student_learning_mode, teacher_mode)
            
            time_slots = teacher.get('_time_slots', []) or teacher.get('time_slots', [])
            teacher_time_shifts = get_teacher_time_shifts(time_slots)
            time_match = calculate_time_match_score(student_study_time, teacher_time_shifts)
            
            match_details = {
                'area_match': area_match,
                'subject_match': subject_match,
                'budget_match': budget_match,
                'mode_match': mode_match,
                'time_match': time_match,
                'mode': teacher_mode,
                'time': student_study_time
            }
            
            final_score = rec['match_score']
            if final_score > 100:
                final_score = 100
            if final_score < 0:
                final_score = 0
            
            badge, badge_icon = get_match_badge(final_score)
            match_reasons = get_match_reasons(match_details)
            
            area_match_label = 'Exact Area'
            if area_match < 35 and area_match > 0:
                area_match_label = 'Nearby Area'
            elif area_match == 0:
                area_match_label = 'Other Area'
            
            result.append({
                'teacher_id': str(user_id),
                'name': user.get('name', 'Unknown Teacher'),
                'profile_picture': teacher.get('_profile_picture', '') or teacher.get('profile_picture', ''),
                'subjects': teacher_subjects,
                'subject_fees': subject_fees,
                'matching_subject': matching_subject,
                'fee_for_matching': fee_for_matching,
                'student_budget': student_budget,
                'teaching_mode': teacher_mode,
                'location': teacher_area,
                'rating': teacher.get('_rating', 0) or teacher.get('rating', 0),
                'experience': teacher.get('_experience', '') or teacher.get('experience', ''),
                'qualification': teacher.get('_qualification', '') or teacher.get('qualification', ''),
                'bio': teacher.get('_bio', '') or teacher.get('bio', ''),
                'match_score': final_score,
                'match_badge': badge,
                'match_badge_icon': badge_icon,
                'match_details': match_details,
                'match_reasons': match_reasons,
                'area_match_label': area_match_label,
                'is_recommended': True,
                'match_breakdown': breakdown
            })
        
        return result
        
    except Exception as e:
        print(f"❌ Error in get_all_recommended_teachers: {e}")
        import traceback
        traceback.print_exc()
        return []
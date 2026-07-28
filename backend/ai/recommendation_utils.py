"""
Utility functions for AI recommendations
"""

from .location_data import get_area_distance_score, get_area_match_label
from .time_matching import calculate_time_match_score, get_teacher_time_shifts


# ✅ FIXED: Calculate subject match score - handles both string and dict arrays
def calculate_subject_match_score(student_subjects, teacher_subjects):
    """Calculate subject match score (0-100) - Handles both string and dict arrays"""
    if not student_subjects or not teacher_subjects:
        return 0
    
    # ✅ Convert student subjects to strings
    student_strings = []
    for s in student_subjects:
        if isinstance(s, str):
            student_strings.append(s.lower().strip())
        elif isinstance(s, dict):
            # Extract subject name from dict format: {'subject': 'Physics', 'fee': 5000}
            subject_name = s.get('subject', '') or s.get('name', '') or s.get('title', '')
            if subject_name:
                student_strings.append(subject_name.lower().strip())
    
    # ✅ Convert teacher subjects to strings
    teacher_strings = []
    for s in teacher_subjects:
        if isinstance(s, str):
            teacher_strings.append(s.lower().strip())
        elif isinstance(s, dict):
            # Extract subject name from dict format: {'subject': 'Physics', 'fee': 5000}
            subject_name = s.get('subject', '') or s.get('name', '') or s.get('title', '')
            if subject_name:
                teacher_strings.append(subject_name.lower().strip())
    
    # ✅ If no valid subjects found
    if not student_strings or not teacher_strings:
        return 0
    
    # ✅ Calculate match using sets
    common = set(student_strings) & set(teacher_strings)
    if not common:
        return 0
    
    # Calculate match percentage
    max_possible = max(len(student_strings), len(teacher_strings))
    match_percentage = (len(common) / max_possible) * 100
    
    # Cap at 100
    return min(match_percentage, 100)


# ✅ ADDED: Budget match score - EXACT range matching (100% if within budget)
def calculate_budget_match_score(student_budget, teacher_fee):
    """
    Calculate budget match score (0-100)
    
    Logic:
    - Student selects a range: e.g., "Rs. 4,000 – 6,000"
    - Teacher has a fee: e.g., 5000
    - If teacher_fee is within student range → 100% match
    - If teacher_fee is outside student range → 0% match (don't show)
    """
    if not student_budget or not teacher_fee:
        return 0
    
    try:
        import re
        
        # ✅ Parse student budget range
        # Example: "Rs. 4,000 – 6,000" → (4000, 6000)
        student_clean = student_budget.replace('Rs.', '').replace(',', '').strip()
        
        # Try to find range with dash
        if '–' in student_clean:
            parts = student_clean.split('–')
        elif '-' in student_clean:
            parts = student_clean.split('-')
        else:
            # Single value - try to extract number
            numbers = re.findall(r'\d+', student_clean)
            if numbers:
                val = int(numbers[0])
                return 100 if teacher_fee <= val else 0
            return 0
        
        if len(parts) == 2:
            student_min = int(''.join(re.findall(r'\d+', parts[0].strip())))
            student_max = int(''.join(re.findall(r'\d+', parts[1].strip())))
        else:
            return 0
        
        # ✅ Parse teacher fee
        teacher_fee_clean = str(teacher_fee).replace('Rs.', '').replace(',', '').strip()
        teacher_fee_num = int(''.join(re.findall(r'\d+', teacher_fee_clean))) if re.findall(r'\d+', teacher_fee_clean) else 0
        
        if teacher_fee_num == 0:
            return 0
        
        # ✅ EXACT range matching
        # If teacher fee is within student budget range → 100% match
        if student_min <= teacher_fee_num <= student_max:
            return 100
        else:
            # Teacher fee is outside student budget → 0% match (don't show)
            return 0
            
    except Exception as e:
        print(f"⚠️ Budget match error: {e}")
        return 0


def calculate_mode_match_score(student_mode, teacher_mode):
    """Calculate teaching mode match score (0-100)"""
    if not student_mode or not teacher_mode:
        return 50
    
    student_mode = student_mode.lower()
    teacher_mode = teacher_mode.lower()
    
    if student_mode == teacher_mode:
        return 100
    
    # Both mode means compatible with all
    if student_mode == 'both' or teacher_mode == 'both':
        return 90
    
    # Online vs Physical - 50% if not matching
    return 50


def get_match_badge(score):
    """Get match badge based on score"""
    # Ensure score is between 0-100
    score = max(0, min(100, score))
    if score >= 90:
        return 'Excellent', '⭐'
    elif score >= 75:
        return 'Very Good', '🌟'
    elif score >= 60:
        return 'Good', '✅'
    elif score >= 40:
        return 'Moderate', '📌'
    else:
        return 'Low', '⚠️'


def get_match_reasons(match_details):
    """Generate match reasons list"""
    reasons = []
    
    if match_details.get('area_match', 0) >= 80:
        reasons.append(f"📍 Nearby Area (Distance Match: {match_details['area_match']:.0f}%)")
    elif match_details.get('area_match', 0) >= 50:
        reasons.append(f"📍 Area Match: {match_details['area_match']:.0f}%")
    
    if match_details.get('subject_match', 0) >= 80:
        reasons.append(f"📚 Same Subject(s)")
    elif match_details.get('subject_match', 0) >= 50:
        reasons.append(f"📚 Subject Match: {match_details['subject_match']:.0f}%")
    
    # ✅ UPDATED: Budget match reasons
    if match_details.get('budget_match', 0) >= 100:
        reasons.append(f"💰 Within Budget")
    elif match_details.get('budget_match', 0) >= 50:
        reasons.append(f"💰 Budget Compatible")
    
    if match_details.get('mode_match', 0) >= 80:
        reasons.append(f"💻 {match_details.get('mode', '')} Classes")
    
    if match_details.get('time_match', 0) >= 80:
        reasons.append(f"🕐 {match_details.get('time', '')} Availability")
    
    return reasons
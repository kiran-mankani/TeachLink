# backend/ai/time_matching.py
"""
Time slot matching between student preferences and teacher schedules
"""

def convert_time_slot_to_shift(time_str):
    """
    Convert exact time to shift (Morning, Afternoon, Evening)
    """
    if not time_str:
        return 'Flexible'
    
    # Handle time string like "09:00 AM", "2:30 PM"
    try:
        # Parse time
        parts = time_str.strip().split(' ')
        if len(parts) != 2:
            return 'Flexible'
        
        time_part = parts[0]
        ampm = parts[1]
        
        hour = int(time_part.split(':')[0])
        minute = int(time_part.split(':')[1])
        
        # Convert to 24-hour format
        if ampm == 'PM' and hour != 12:
            hour += 12
        elif ampm == 'AM' and hour == 12:
            hour = 0
        
        # Determine shift
        if 6 <= hour < 12:
            return 'Morning'
        elif 12 <= hour < 17:
            return 'Afternoon'
        elif 17 <= hour < 22:
            return 'Evening'
        else:
            return 'Flexible'
            
    except Exception:
        return 'Flexible'

def get_teacher_time_shifts(time_slots):
    """
    Get unique shifts from teacher's time slots
    """
    if not time_slots:
        return ['Flexible']
    
    shifts = set()
    for slot in time_slots:
        start_time = slot.get('start_time', '')
        shift = convert_time_slot_to_shift(start_time)
        shifts.add(shift)
    
    return list(shifts)

def calculate_time_match_score(student_study_time, teacher_time_shifts):
    """
    Calculate time match score between student and teacher
    """
    if not student_study_time or student_study_time == 'Flexible':
        return 100  # Flexible students match everyone
    
    if not teacher_time_shifts:
        return 50  # Default if no schedule
    
    if student_study_time in teacher_time_shifts:
        return 100
    
    # Partial match - check if shifts are compatible
    # Morning <-> Afternoon: 70% match
    # Morning <-> Evening: 40% match
    # Afternoon <-> Evening: 70% match
    compatibility = {
        'Morning': {'Morning': 100, 'Afternoon': 70, 'Evening': 40, 'Flexible': 80},
        'Afternoon': {'Morning': 70, 'Afternoon': 100, 'Evening': 70, 'Flexible': 80},
        'Evening': {'Morning': 40, 'Afternoon': 70, 'Evening': 100, 'Flexible': 80},
        'Flexible': {'Morning': 80, 'Afternoon': 80, 'Evening': 80, 'Flexible': 100}
    }
    
    best_score = 0
    for teacher_shift in teacher_time_shifts:
        score = compatibility.get(student_study_time, {}).get(teacher_shift, 50)
        if score > best_score:
            best_score = score
    
    return best_score
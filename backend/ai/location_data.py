# backend/ai/location_data.py
"""
Karachi area coordinates and proximity mapping
"""

# Central coordinates for each area (latitude, longitude)
AREA_COORDINATES = {
    'Saddar': (24.8547, 67.0112),
    'Civil Lines': (24.8530, 67.0260),
    'Clifton': (24.8100, 67.0320),
    'DHA': (24.7900, 67.0400),
    'Gulshan-e-Iqbal': (24.9300, 67.0900),
    'Gulistan-e-Johar': (24.9290, 67.1200),
    'North Nazimabad': (24.9500, 67.0400),
    'Nazimabad': (24.9400, 67.0300),
    'Federal B Area': (24.9200, 67.0500),
    'Malir': (24.8700, 67.1600),
    'Korangi': (24.8300, 67.1400),
    'Liaquatabad': (24.8900, 67.0400),
    'Gulberg': (24.9000, 67.0500),
    'Karachi City': (24.8600, 67.0100),
    'Others': (24.8600, 67.0100)
}

# Pre-calculated distance scores between areas
# Higher score = closer proximity (0-100 scale)
AREA_DISTANCE_SCORES = {
    'Saddar': {
        'Saddar': 100,
        'Civil Lines': 90,
        'Clifton': 85,
        'DHA': 80,
        'Karachi City': 95,
        'Gulshan-e-Iqbal': 70,
        'Gulistan-e-Johar': 65,
        'North Nazimabad': 75,
        'Nazimabad': 78,
        'Federal B Area': 72,
        'Malir': 50,
        'Korangi': 55,
        'Liaquatabad': 80,
        'Gulberg': 82,
        'Others': 50
    },
    'Civil Lines': {
        'Civil Lines': 100,
        'Saddar': 90,
        'Clifton': 88,
        'DHA': 83,
        'Karachi City': 92,
        'Gulshan-e-Iqbal': 72,
        'Gulistan-e-Johar': 67,
        'North Nazimabad': 78,
        'Nazimabad': 80,
        'Federal B Area': 75,
        'Malir': 52,
        'Korangi': 57,
        'Liaquatabad': 82,
        'Gulberg': 84,
        'Others': 52
    },
    'Clifton': {
        'Clifton': 100,
        'Saddar': 85,
        'Civil Lines': 88,
        'DHA': 95,
        'Karachi City': 82,
        'Gulshan-e-Iqbal': 68,
        'Gulistan-e-Johar': 63,
        'North Nazimabad': 72,
        'Nazimabad': 75,
        'Federal B Area': 70,
        'Malir': 55,
        'Korangi': 60,
        'Liaquatabad': 75,
        'Gulberg': 78,
        'Others': 55
    },
    'DHA': {
        'DHA': 100,
        'Clifton': 95,
        'Saddar': 80,
        'Civil Lines': 83,
        'Karachi City': 78,
        'Gulshan-e-Iqbal': 72,
        'Gulistan-e-Johar': 68,
        'North Nazimabad': 70,
        'Nazimabad': 73,
        'Federal B Area': 68,
        'Malir': 58,
        'Korangi': 62,
        'Liaquatabad': 70,
        'Gulberg': 75,
        'Others': 58
    },
    'Gulshan-e-Iqbal': {
        'Gulshan-e-Iqbal': 100,
        'Gulistan-e-Johar': 90,
        'Federal B Area': 88,
        'North Nazimabad': 85,
        'Nazimabad': 82,
        'Gulberg': 85,
        'Liaquatabad': 80,
        'Saddar': 70,
        'Civil Lines': 72,
        'Clifton': 68,
        'DHA': 72,
        'Karachi City': 68,
        'Malir': 65,
        'Korangi': 68,
        'Others': 50
    },
    'Gulistan-e-Johar': {
        'Gulistan-e-Johar': 100,
        'Gulshan-e-Iqbal': 90,
        'Malir': 85,
        'Korangi': 82,
        'Federal B Area': 80,
        'North Nazimabad': 78,
        'Nazimabad': 75,
        'Gulberg': 78,
        'Liaquatabad': 72,
        'Saddar': 65,
        'Civil Lines': 67,
        'Clifton': 63,
        'DHA': 68,
        'Karachi City': 62,
        'Others': 50
    },
    'North Nazimabad': {
        'North Nazimabad': 100,
        'Nazimabad': 95,
        'Federal B Area': 90,
        'Gulberg': 88,
        'Gulshan-e-Iqbal': 85,
        'Liaquatabad': 85,
        'Saddar': 75,
        'Civil Lines': 78,
        'Clifton': 72,
        'DHA': 70,
        'Karachi City': 72,
        'Gulistan-e-Johar': 78,
        'Malir': 60,
        'Korangi': 65,
        'Others': 50
    },
    'Nazimabad': {
        'Nazimabad': 100,
        'North Nazimabad': 95,
        'Federal B Area': 92,
        'Gulberg': 90,
        'Gulshan-e-Iqbal': 82,
        'Liaquatabad': 88,
        'Saddar': 78,
        'Civil Lines': 80,
        'Clifton': 75,
        'DHA': 73,
        'Karachi City': 75,
        'Gulistan-e-Johar': 75,
        'Malir': 58,
        'Korangi': 62,
        'Others': 50
    },
    'Federal B Area': {
        'Federal B Area': 100,
        'North Nazimabad': 90,
        'Nazimabad': 92,
        'Gulberg': 88,
        'Gulshan-e-Iqbal': 88,
        'Liaquatabad': 85,
        'Saddar': 72,
        'Civil Lines': 75,
        'Clifton': 70,
        'DHA': 68,
        'Karachi City': 70,
        'Gulistan-e-Johar': 80,
        'Malir': 62,
        'Korangi': 65,
        'Others': 50
    },
    'Malir': {
        'Malir': 100,
        'Gulistan-e-Johar': 85,
        'Korangi': 88,
        'Gulshan-e-Iqbal': 65,
        'Federal B Area': 62,
        'North Nazimabad': 60,
        'Nazimabad': 58,
        'Gulberg': 55,
        'Liaquatabad': 55,
        'Saddar': 50,
        'Civil Lines': 52,
        'Clifton': 55,
        'DHA': 58,
        'Karachi City': 48,
        'Others': 40
    },
    'Korangi': {
        'Korangi': 100,
        'Malir': 88,
        'Gulistan-e-Johar': 82,
        'Gulshan-e-Iqbal': 68,
        'Federal B Area': 65,
        'North Nazimabad': 62,
        'Nazimabad': 62,
        'Gulberg': 60,
        'Liaquatabad': 60,
        'Saddar': 55,
        'Civil Lines': 57,
        'Clifton': 60,
        'DHA': 62,
        'Karachi City': 52,
        'Others': 45
    },
    'Liaquatabad': {
        'Liaquatabad': 100,
        'Gulberg': 92,
        'Nazimabad': 88,
        'North Nazimabad': 85,
        'Federal B Area': 85,
        'Gulshan-e-Iqbal': 80,
        'Saddar': 80,
        'Civil Lines': 82,
        'Clifton': 75,
        'DHA': 70,
        'Karachi City': 78,
        'Gulistan-e-Johar': 72,
        'Malir': 55,
        'Korangi': 60,
        'Others': 50
    },
    'Gulberg': {
        'Gulberg': 100,
        'Liaquatabad': 92,
        'Nazimabad': 90,
        'North Nazimabad': 88,
        'Federal B Area': 88,
        'Gulshan-e-Iqbal': 85,
        'Saddar': 82,
        'Civil Lines': 84,
        'Clifton': 78,
        'DHA': 75,
        'Karachi City': 80,
        'Gulistan-e-Johar': 78,
        'Malir': 55,
        'Korangi': 60,
        'Others': 50
    },
    'Karachi City': {
        'Karachi City': 100,
        'Saddar': 95,
        'Civil Lines': 92,
        'Clifton': 82,
        'DHA': 78,
        'Gulshan-e-Iqbal': 68,
        'Gulistan-e-Johar': 62,
        'North Nazimabad': 72,
        'Nazimabad': 75,
        'Federal B Area': 70,
        'Malir': 48,
        'Korangi': 52,
        'Liaquatabad': 78,
        'Gulberg': 80,
        'Others': 50
    },
    'Others': {
        'Others': 100,
        'Saddar': 50,
        'Civil Lines': 52,
        'Clifton': 55,
        'DHA': 58,
        'Gulshan-e-Iqbal': 50,
        'Gulistan-e-Johar': 50,
        'North Nazimabad': 50,
        'Nazimabad': 50,
        'Federal B Area': 50,
        'Malir': 40,
        'Korangi': 45,
        'Liaquatabad': 50,
        'Gulberg': 50,
        'Karachi City': 50
    }
}

def get_area_distance_score(student_area, teacher_area):
    """Get distance score between two areas (0-100)"""
    if not student_area or not teacher_area:
        return 50  # Default mid score if area not specified
    
    # Clean and normalize area names
    student_area = student_area.strip()
    teacher_area = teacher_area.strip()
    
    # Direct match
    if student_area == teacher_area:
        return 100
    
    # Check if student area exists in distance matrix
    if student_area in AREA_DISTANCE_SCORES:
        if teacher_area in AREA_DISTANCE_SCORES[student_area]:
            return AREA_DISTANCE_SCORES[student_area][teacher_area]
    
    # Fallback: Check reverse
    if teacher_area in AREA_DISTANCE_SCORES:
        if student_area in AREA_DISTANCE_SCORES[teacher_area]:
            return AREA_DISTANCE_SCORES[teacher_area][student_area]
    
    # Default for unknown areas
    return 50

def get_area_match_label(score):
    """Get label for area match score"""
    if score >= 90:
        return 'Excellent', '🟢'
    elif score >= 75:
        return 'Very Good', '🟢'
    elif score >= 60:
        return 'Good', '🟡'
    elif score >= 40:
        return 'Moderate', '🟡'
    else:
        return 'Low', '🔴'
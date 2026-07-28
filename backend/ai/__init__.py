# backend/ai/__init__.py
"""
AI module for TeachLink recommendation system
"""

from .student_recommendation import get_student_recommendations, get_all_recommended_teachers
from .tutor_recommendation import get_tutor_recommendations
from .location_data import get_area_distance_score, get_area_match_label
from .time_matching import convert_time_slot_to_shift, get_teacher_time_shifts, calculate_time_match_score
from .recommendation_utils import (
    calculate_subject_match_score,
    calculate_budget_match_score,
    calculate_mode_match_score,
    get_match_badge,
    get_match_reasons
)

__all__ = [
    'get_student_recommendations',
    'get_all_recommended_teachers',
    'get_tutor_recommendations',
    'get_area_distance_score',
    'get_area_match_label',
    'convert_time_slot_to_shift',
    'get_teacher_time_shifts',
    'calculate_time_match_score',
    'calculate_subject_match_score',
    'calculate_budget_match_score',
    'calculate_mode_match_score',
    'get_match_badge',
    'get_match_reasons'
]
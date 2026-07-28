// frontend/src/constants.js

// ✅ AREAS - SAME FOR EVERYWHERE
export const KARACHI_AREAS = [
  'DHA',
  'Clifton', 
  'Gulshan-e-Iqbal',
  'Gulistan-e-Johar',
  'North Nazimabad',
  'Malir',
  'Korangi',
  'Gulberg',
  'Nazimabad',
  'Liaquatabad',
  'Saddar',
  'Karachi City',
  'Federal B Area',
  'Landhi',
  'Shah Faisal',
];

// ✅ SUBJECTS - CATEGORIZED
export const SUBJECT_CATEGORIES = {
  '📚 School Subjects': [
    'Mathematics',
    'Physics',
    'Chemistry',
    'Biology',
    'English',
    'Urdu',
    'Pak Studies',
    'Islamiat',
    'Sindhi'
  ],
  '🎓 College Subjects': [
    'Accounting',
    'Economics',
    'Statistics',
    'Business Studies',
    'History',
    'Geography',
    'Political Science',
    'International Relations',
    'Psychology',
    'Sociology'
  ],
  '💻 Computer Science': [
    'Programming',
    'Database',
    'Networking',
    'Artificial Intelligence',
    'Cyber Security',
    'Data Science',
    'Computer Science'
  ],
  '🎨 Others': [
    'Art & Design',
    'Music',
    'Physical Education',
    'Arabic',
    'French',
    'Philosophy',
    'Logic',
    'Ethics'
  ]
};

// ✅ FLAT SUBJECTS LIST (for backward compatibility)
export const SUBJECTS = Object.values(SUBJECT_CATEGORIES).flat();

// ✅ EDUCATION LEVELS (for Student)
export const EDUCATION_LEVELS = [
  'Primary School (Class 1-5)',
  'Middle School (Class 6-8)',
  'High School (Matric - Class 9-10)',
  'Intermediate (FSC - Class 11-12)',
  'Intermediate (ICS)',
  'Intermediate (FA)',
  'Undergraduate (Bachelors - Year 1)',
  'Undergraduate (Bachelors - Year 2)',
  'Undergraduate (Bachelors - Year 3)',
  'Undergraduate (Bachelors - Year 4)',
  'Graduate (Masters)',
  'PhD / Doctorate',
  'Diploma / Certification',
  'Other'
];

// ✅ LEARNING MODES
export const LEARNING_MODES = ['Online', 'Physical', 'Both'];

// ✅ QUALIFICATIONS (Simplified - for Teacher)
export const QUALIFICATIONS = [
  'Intermediate',
  'Bachelor',
  'Master',
  'MPhil',
  'PhD',
  
];

// ✅ EXPERIENCE OPTIONS (Simplified)
export const EXPERIENCE_OPTIONS = [
  'Less than 1 Year',
  '1–2 Years',
  '3–5 Years',
  '5–10 Years',
  '10+ Years'
];

// ✅ TEACHING LEVELS (NEW - for Teacher)
export const TEACHING_LEVELS = [
  'Primary',
  'Secondary',
  'Matric',
  'Intermediate',
  'O Level',
  'A Level',
  'University',
  'Entry Test'
];

// ✅ GENDER OPTIONS
export const GENDER_OPTIONS = ['Male', 'Female', 'Other'];

// ✅ BUDGET RANGES (for Student)
export const BUDGET_RANGES = [
  'PKR 0 - 5,000',
  'PKR 5,001 - 10,000',
  'PKR 10,001 - 15,000',
  'PKR 15,001 - 20,000',
  'PKR 20,001 - 30,000',
  'PKR 30,001 - 50,000',
  'PKR 50,000+'
];

// ✅ PREFERRED TIMINGS
export const PREFERRED_TIMINGS = [
  'Morning (6 AM - 12 PM)',
  'Afternoon (12 PM - 4 PM)',
  'Evening (4 PM - 8 PM)',
  'Night (8 PM - 12 AM)',
  'Flexible'
];

// ✅ AVAILABILITY DAYS
export const AVAILABILITY_DAYS = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday'
];

// ✅ TIME SLOTS
export const TIME_SLOTS = [
  '9:00 AM - 10:00 AM',
  '10:00 AM - 11:00 AM',
  '11:00 AM - 12:00 PM',
  '12:00 PM - 1:00 PM',
  '1:00 PM - 2:00 PM',
  '2:00 PM - 3:00 PM',
  '3:00 PM - 4:00 PM',
  '4:00 PM - 5:00 PM',
  '5:00 PM - 6:00 PM',
  '6:00 PM - 7:00 PM',
  '7:00 PM - 8:00 PM',
  '8:00 PM - 9:00 PM',
  '9:00 PM - 10:00 PM'
];
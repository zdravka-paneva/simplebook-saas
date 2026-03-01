// Application-wide constants

export const APP_NAME = 'SimpleBook'

// Business types
export const BUSINESS_TYPES = [
  { value: 'salon', label: 'Hair Salon' },
  { value: 'spa', label: 'Spa & Wellness' },
  { value: 'clinic', label: 'Medical Clinic' },
  { value: 'gym', label: 'Fitness Center' },
  { value: 'tutoring', label: 'Tutoring/Coaching' },
  { value: 'other', label: 'Other' }
]

// Appointment statuses
export const APPOINTMENT_STATUS = {
  SCHEDULED: 'scheduled',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled'
}

// Time slots (in 30-minute intervals)
export const TIME_SLOTS = [
  '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
  '12:00', '12:30', '13:00', '13:30', '14:00', '14:30',
  '15:00', '15:30', '16:00', '16:30', '17:00', '17:30',
  '18:00', '18:30', '19:00'
]

// Validation messages
export const VALIDATION_MESSAGES = {
  EMAIL_REQUIRED: 'Email is required',
  EMAIL_INVALID: 'Please enter a valid email',
  PASSWORD_REQUIRED: 'Password is required',
  PASSWORD_WEAK: 'Password is too weak',
  NAME_REQUIRED: 'Name is required',
  PHONE_INVALID: 'Please enter a valid phone number'
}

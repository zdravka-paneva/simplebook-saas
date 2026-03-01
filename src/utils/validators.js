/**
 * Validate email format
 * @param {string} email - Email to validate
 * @returns {boolean} True if valid
 */
export function validateEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

/**
 * Validate password strength
 * @param {string} password - Password to validate
 * @returns {Object} { isValid, errors }
 */
export function validatePassword(password) {
  const errors = []

  if (password.length < 8) {
    errors.push('Password must be at least 8 characters')
  }
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain an uppercase letter')
  }
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain a lowercase letter')
  }
  if (!/[0-9]/.test(password)) {
    errors.push('Password must contain a number')
  }

  return {
    isValid: errors.length === 0,
    errors
  }
}

/**
 * Validate phone number
 * @param {string} phone - Phone to validate
 * @returns {boolean} True if valid
 */
export function validatePhone(phone) {
  const phoneRegex = /^[\d\s\-\+\(\)]{10,}$/
  return phoneRegex.test(phone.replace(/\s/g, ''))
}

/**
 * Validate form field
 * @param {string} value - Field value
 * @param {string} fieldType - Type of field (email, password, etc.)
 * @returns {string} Error message or empty string if valid
 */
export function validateField(value, fieldType) {
  if (!value || value.trim() === '') {
    return 'This field is required'
  }

  switch (fieldType) {
    case 'email':
      return validateEmail(value) ? '' : 'Invalid email address'
    case 'phone':
      return validatePhone(value) ? '' : 'Invalid phone number'
    default:
      return ''
  }
}

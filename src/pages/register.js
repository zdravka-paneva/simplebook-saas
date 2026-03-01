import { registerUser } from '../modules/auth.js'

const form = document.getElementById('registerForm')
const errorAlert = document.getElementById('errorAlert')
const errorMessage = document.getElementById('errorMessage')
const successAlert = document.getElementById('successAlert')
const submitBtn = form.querySelector('button[type="submit"]')
const submitText = document.getElementById('submitText')
const loadingSpinner = document.getElementById('loadingSpinner')
const passwordInput = document.getElementById('password')
const confirmPasswordInput = document.getElementById('confirmPassword')

// Password validation
function validatePassword() {
  if (passwordInput.value !== confirmPasswordInput.value) {
    errorMessage.textContent = 'Passwords do not match'
    errorAlert.style.display = 'block'
    return false
  }

  if (passwordInput.value.length < 8) {
    errorMessage.textContent = 'Password must be at least 8 characters long'
    errorAlert.style.display = 'block'
    return false
  }

  return true
}

// Form submission
form.addEventListener('submit', async (e) => {
  e.preventDefault()

  // Hide alerts
  errorAlert.style.display = 'none'
  successAlert.style.display = 'none'

  // Validate passwords
  if (!validatePassword()) {
    return
  }

  // Show loading state
  submitBtn.disabled = true
  submitText.style.display = 'none'
  loadingSpinner.style.display = 'inline-block'

  try {
    const businessName = document.getElementById('businessName').value
    const businessType = document.getElementById('businessType').value
    const email = document.getElementById('email').value
    const password = passwordInput.value

    // Register user
    const result = await registerUser(email, password, {
      business_name: businessName,
      business_type: businessType
    })

    // Show success message
    successAlert.style.display = 'block'

    // Redirect after 2 seconds
    setTimeout(() => {
      window.location.href = 'login.html'
    }, 2000)

  } catch (error) {
    // Show error
    errorMessage.textContent = error.message || 'Registration failed. Please try again.'
    errorAlert.style.display = 'block'

    // Reset button
    submitBtn.disabled = false
    submitText.style.display = 'inline'
    loadingSpinner.style.display = 'none'
  }
})

// Password match validation on input
confirmPasswordInput.addEventListener('input', () => {
  if (errorAlert.style.display === 'block') {
    validatePassword()
  }
})

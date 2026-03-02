import { loginUser, getCurrentUser } from '../modules/auth.js'

const form = document.getElementById('loginForm')
const errorAlert = document.getElementById('errorAlert')
const errorMessage = document.getElementById('errorMessage')
const successAlert = document.getElementById('successAlert')
const submitBtn = form.querySelector('button[type="submit"]')
const submitText = document.getElementById('submitText')
const loadingSpinner = document.getElementById('loadingSpinner')

// Form submission
form.addEventListener('submit', async (e) => {
  e.preventDefault()
  console.log('🔐 LOGIN: Form submitted!')

  // Hide alerts
  errorAlert.style.display = 'none'
  successAlert.style.display = 'none'

  // Show loading state
  submitBtn.disabled = true
  submitText.style.display = 'none'
  loadingSpinner.style.display = 'inline-block'

  try {
    const email = document.getElementById('email').value
    const password = document.getElementById('password').value
    const accountType = document.querySelector('input[name="accountType"]:checked').value
    console.log('🔐 LOGIN: Attempting login with email:', email, 'accountType:', accountType)

    // Login user
    const result = await loginUser(email, password)
    console.log('🔐 LOGIN: Login successful! User:', result.user.email)
    console.log('🔐 LOGIN: User metadata:', result.user.user_metadata)

    // Verify account type matches
    if (result.user.user_metadata?.account_type !== accountType) {
      console.log('🔐 LOGIN: Account type mismatch! Expected:', accountType, 'Got:', result.user.user_metadata?.account_type)
      errorMessage.textContent = `This account is registered as a ${result.user.user_metadata?.account_type === 'business' ? 'Business Owner' : 'Client'}. Please select the correct account type.`
      errorAlert.style.display = 'block'

      // Reset button
      submitBtn.disabled = false
      submitText.style.display = 'inline'
      loadingSpinner.style.display = 'none'
      return
    }

    // Show success message
    console.log('🔐 LOGIN: Account type match! Showing success and redirecting...')
    successAlert.style.display = 'block'

    // Redirect based on account type
    const redirectUrl = accountType === 'business' ? 'dashboard.html' : 'booking.html'
    console.log('🔐 LOGIN: Redirecting to:', redirectUrl)
    
    setTimeout(() => {
      console.log('🔐 LOGIN: EXECUTING REDIRECT NOW to:', redirectUrl)
      window.location.href = redirectUrl
    }, 1000)

  } catch (error) {
    console.error('🔐 LOGIN: Login error:', error)
    
    // Check if it's an email confirmation error
    if (error.message?.includes('Email not confirmed') || error.message?.includes('email_not_confirmed')) {
      errorText = 'Your email address hasn\'t been confirmed yet. Please check your email and click the confirmation link.'
    }
    
    errorMessage.textContent = errorText
    errorAlert.style.display = 'block'

    // Reset button
    submitBtn.disabled = false
    submitText.style.display = 'inline'
    loadingSpinner.style.display = 'none'
  }
})


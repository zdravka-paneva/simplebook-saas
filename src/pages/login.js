import { loginUser, getCurrentUser } from '../modules/auth.js'

const form = document.getElementById('loginForm')
const errorAlert = document.getElementById('errorAlert')
const errorMessage = document.getElementById('errorMessage')
const successAlert = document.getElementById('successAlert')
const submitBtn = form.querySelector('button[type="submit"]')
const submitText = document.getElementById('submitText')
const loadingSpinner = document.getElementById('loadingSpinner')

// Check if user is already logged in
async function checkAuth() {
  try {
    console.log('🔐 LOGIN: checkAuth() starting...')
    const user = await getCurrentUser()
    console.log('🔐 LOGIN: getCurrentUser() returned:', user?.email)
    
    if (user) {
      console.log('🔐 LOGIN: User found! User metadata:', user.user_metadata)
      const accountType = user.user_metadata?.account_type || 'client'
      console.log('🔐 LOGIN: Account type:', accountType)
      console.log('🔐 LOGIN: Redirecting to', accountType === 'business' ? 'dashboard.html' : 'booking.html')
      
      if (accountType === 'business') {
        window.location.href = 'dashboard.html'
      } else {
        window.location.href = 'booking.html'
      }
    } else {
      console.log('🔐 LOGIN: No user logged in - staying on login page')
    }
    // If not logged in, stay on login page - that's where we should be
  } catch (error) {
    console.error('🔐 LOGIN: checkAuth() error:', error)
  }
}

// Check auth on page load (but allow 100ms delay for session to load)
setTimeout(() => {
  checkAuth()
}, 100)

// Form submission
form.addEventListener('submit', async (e) => {
  e.preventDefault()

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

    // Login user
    const result = await loginUser(email, password)

    // Verify account type matches
    if (result.user.user_metadata?.account_type !== accountType) {
      errorMessage.textContent = `This account is registered as a ${result.user.user_metadata?.account_type === 'business' ? 'Business Owner' : 'Client'}. Please select the correct account type.`
      errorAlert.style.display = 'block'

      // Reset button
      submitBtn.disabled = false
      submitText.style.display = 'inline'
      loadingSpinner.style.display = 'none'
      return
    }

    // Show success message
    successAlert.style.display = 'block'

    // Redirect based on account type
    const redirectUrl = accountType === 'business' ? 'dashboard.html' : 'booking.html'
    
    setTimeout(() => {
      window.location.href = redirectUrl
    }, 1000)

  } catch (error) {
    // Show error
    let errorText = error.message || 'Login failed. Check your email and password.'
    
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


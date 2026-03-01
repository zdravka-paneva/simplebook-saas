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
    const user = await getCurrentUser()
    if (user) {
      // Check user type and redirect accordingly
      const accountType = user.user_metadata?.account_type || 'client'
      if (accountType === 'business') {
        window.location.href = 'dashboard.html'
      } else {
        window.location.href = 'booking.html'
      }
    }
  } catch (error) {
    console.log('User not authenticated')
  }
}

// Check auth on page load
checkAuth()

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
    errorMessage.textContent = error.message || 'Login failed. Check your email and password.'
    errorAlert.style.display = 'block'

    // Reset button
    submitBtn.disabled = false
    submitText.style.display = 'inline'
    loadingSpinner.style.display = 'none'
  }
})


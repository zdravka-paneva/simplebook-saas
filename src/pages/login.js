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
      // User is logged in, redirect to dashboard
      window.location.href = 'dashboard.html'
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

    // Login user
    const result = await loginUser(email, password)

    // Show success message
    successAlert.style.display = 'block'

    // Redirect after 1 second
    setTimeout(() => {
      window.location.href = 'dashboard.html'
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

import { loginUser } from '../modules/auth.js'

const form = document.getElementById('loginForm')
const errorAlert = document.getElementById('errorAlert')
const errorMessage = document.getElementById('errorMessage')
const successAlert = document.getElementById('successAlert')
const submitBtn = form.querySelector('button[type="submit"]')
const submitText = document.getElementById('submitText')
const loadingSpinner = document.getElementById('loadingSpinner')

// Handle form submission - SIMPLE & DIRECT
form.addEventListener('submit', async (e) => {
  e.preventDefault()
  console.log('🔐 LOGIN: Form submitted')

  errorAlert.style.display = 'none'
  successAlert.style.display = 'none'

  submitBtn.disabled = true
  submitText.style.display = 'none'
  loadingSpinner.style.display = 'inline-block'

  try {
    const email = document.getElementById('email').value.trim()
    const password = document.getElementById('password').value
    const accountType = document.querySelector('input[name="accountType"]:checked').value

    if (!email || !password) {
      throw new Error('Please enter email and password')
    }

    console.log('🔐 LOGIN: Attempting login -', email)
    const result = await loginUser(email, password)
    
    const userType = result.user.user_metadata?.account_type
    if (userType !== accountType) {
      throw new Error(`This account is a ${userType}. Please select the correct account type.`)
    }

    console.log('🔐 LOGIN: Success! Redirecting...')
    successAlert.textContent = 'Login successful!'
    successAlert.style.display = 'block'

    setTimeout(() => {
      const url = accountType === 'business' ? 'dashboard.html' : 'booking.html'
      window.location.href = url
    }, 500)

  } catch (error) {
    console.error('🔐 LOGIN: Error -', error.message)
    errorMessage.textContent = error.message || 'Login failed'
    errorAlert.style.display = 'block'

    submitBtn.disabled = false
    submitText.style.display = 'inline'
    loadingSpinner.style.display = 'none'
  }
})



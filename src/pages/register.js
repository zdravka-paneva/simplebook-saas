import { registerUser, loginUser } from '../modules/auth.js'

const form = document.getElementById('registerForm')
const errorAlert = document.getElementById('errorAlert')
const errorMessage = document.getElementById('errorMessage')
const successAlert = document.getElementById('successAlert')
const submitBtn = form.querySelector('button[type="submit"]')
const submitText = document.getElementById('submitText')
const loadingSpinner = document.getElementById('loadingSpinner')
const passwordInput = document.getElementById('password')
const confirmPasswordInput = document.getElementById('confirmPassword')
const passwordFeedback = document.getElementById('passwordFeedback')
const emailInput = document.getElementById('email')

// Account type radio buttons
const businessOption = document.getElementById('businessOption')
const clientOption = document.getElementById('clientOption')
const businessSection = document.getElementById('businessSection')
const clientSection = document.getElementById('clientSection')

// Show/hide sections based on account type
businessOption.addEventListener('change', () => {
  businessSection.style.display = 'block'
  clientSection.style.display = 'none'
})

clientOption.addEventListener('change', () => {
  businessSection.style.display = 'none'
  clientSection.style.display = 'block'
})

// Real-time password validation
function validatePasswordMatch() {
  const password = passwordInput.value
  const confirmPassword = confirmPasswordInput.value

  if (!confirmPassword) {
    if (passwordFeedback) {
      passwordFeedback.style.display = 'none'
    }
    return
  }

  if (password === confirmPassword && password.length > 0) {
    if (passwordFeedback) {
      passwordFeedback.innerHTML = '<small class="text-success">✓ Паролите съвпадат</small>'
      passwordFeedback.style.display = 'block'
    }
    errorAlert.style.display = 'none'
  } else if (password !== confirmPassword) {
    if (passwordFeedback) {
      passwordFeedback.innerHTML = '<small class="text-danger">✗ Паролите не съвпадат</small>'
      passwordFeedback.style.display = 'block'
    }
  }
}

// Real-time validation on password input
passwordInput.addEventListener('input', validatePasswordMatch)
confirmPasswordInput.addEventListener('input', validatePasswordMatch)

// Email validation
function validateEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

// Password strength validation
function validatePassword() {
  const email = emailInput.value.trim()
  const password = passwordInput.value
  const confirmPassword = confirmPasswordInput.value

  // Validate email
  if (!email) {
    errorMessage.textContent = '⚠️ Моля, въведи имейл'
    errorAlert.style.display = 'block'
    return false
  }

  if (!validateEmail(email)) {
    errorMessage.textContent = '⚠️ Невалиден имейл. Пример: име@example.com'
    errorAlert.style.display = 'block'
    return false
  }

  // Validate password length
  if (password.length < 8) {
    errorMessage.textContent = '⚠️ Паролата трябва да е поне 8 символа'
    errorAlert.style.display = 'block'
    return false
  }

  // Validate password match
  if (password !== confirmPassword) {
    errorMessage.textContent = '⚠️ Паролите не съвпадат'
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
    const accountType = document.querySelector('input[name="accountType"]:checked').value
    const email = emailInput.value.trim()
    const password = passwordInput.value

    let metadata = { account_type: accountType }

    if (accountType === 'business') {
      const businessName = document.getElementById('businessName').value.trim()
      const businessType = document.getElementById('businessType').value

      if (!businessName) {
        errorMessage.textContent = '⚠️ Моля, въведи име на бизнеса'
        errorAlert.style.display = 'block'
        submitBtn.disabled = false
        submitText.style.display = 'inline'
        loadingSpinner.style.display = 'none'
        return
      }

      if (!businessType) {
        errorMessage.textContent = '⚠️ Моля, избери тип бизнес'
        errorAlert.style.display = 'block'
        submitBtn.disabled = false
        submitText.style.display = 'inline'
        loadingSpinner.style.display = 'none'
        return
      }

      metadata = {
        ...metadata,
        business_name: businessName,
        business_type: businessType
      }
    } else {
      const fullName = document.getElementById('fullName').value.trim()
      const phone = document.getElementById('phone').value.trim()

      if (!fullName) {
        errorMessage.textContent = '⚠️ Моля, въведи своето име'
        errorAlert.style.display = 'block'
        submitBtn.disabled = false
        submitText.style.display = 'inline'
        loadingSpinner.style.display = 'none'
        return
      }

      metadata = {
        ...metadata,
        full_name: fullName,
        phone: phone || ''
      }
    }

    // Register user
    console.log('Стартиране на регистрация с:', { email, accountType: metadata.account_type })
    await registerUser(email, password, metadata)
    console.log('Регистрация успешна, автоматичен логин...')

    // Auto-login after registration
    const loginResult = await loginUser(email, password)
    console.log('Автоматичен логин успешен:', loginResult)

    // Redirect based on account type
    const redirectUrl = accountType === 'business' ? 'dashboard.html' : 'my-bookings.html'
    console.log('Редирект към:', redirectUrl)
    window.location.href = redirectUrl

  } catch (error) {
    // Log full error details
    console.error('РЕГИСТРАЦИЯ ГРЕШКА:', error)
    console.error('Error message:', error.message)
    console.error('Error code:', error.status)
    console.error('Full error:', error)
    
    // Show specific error messages
    let errorText = error.message || 'Регистрацията не успя. Моля, опитай отново.'
    
    if (error.message && error.message.includes('already registered')) {
      errorText = '⚠️ Този имейл вече е регистриран'
    } else if (error.message && error.message.includes('Invalid email')) {
      errorText = '⚠️ Невалиден имейл адрес'
    } else if (error.message && error.message.includes('password')) {
      errorText = '⚠️ Паролата не отговаря на изискванията'
    } else if (error.message && error.message.includes('User already exists')) {
      errorText = '⚠️ Този имейл вече е регистриран в системата'
    }

    console.error('Показване на грешка:', errorText)
    errorMessage.textContent = errorText
    errorAlert.style.display = 'block'

    // Reset button
    submitBtn.disabled = false
    submitText.style.display = 'inline'
    loadingSpinner.style.display = 'none'
  }
})


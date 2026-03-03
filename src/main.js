import './style.css'
import { getCurrentUser, logoutUser } from './modules/auth.js'

// SimpleBook SaaS - Multi-page Application
// Runs on index.html - updates navbar based on auth state

async function updateNavForAuth() {
  const user = await getCurrentUser()

  const navLoginLink = document.getElementById('navLoginLink')
  const navSignupLink = document.getElementById('navSignupLink')
  const navDashboardLink = document.getElementById('navDashboardLink')
  const navLogoutLink = document.getElementById('navLogoutLink')
  const navDashboardAnchor = document.getElementById('navDashboardAnchor')

  if (!navLoginLink) return // not on index.html

  if (user) {
    // Hide login/signup, show dashboard/logout
    navLoginLink.classList.add('d-none')
    navSignupLink.classList.add('d-none')
    navDashboardLink.classList.remove('d-none')
    navLogoutLink.classList.remove('d-none')

    // Adjust dashboard link based on account type
    const accountType = user.user_metadata?.account_type
    if (accountType === 'business') {
      navDashboardAnchor.href = 'dashboard.html'
      navDashboardAnchor.textContent = '📊 Dashboard'
    } else if (accountType === 'admin') {
      navDashboardAnchor.href = 'admin.html'
      navDashboardAnchor.textContent = '🔧 Admin'
    } else {
      navDashboardAnchor.href = 'my-bookings.html'
      navDashboardAnchor.textContent = '📅 My Bookings'
    }

    // Logout handler
    document.getElementById('navLogoutBtn').addEventListener('click', async (e) => {
      e.preventDefault()
      await logoutUser()
      window.location.reload()
    })
  }
}

updateNavForAuth()
console.log('SimpleBook SaaS - Ready!')

import { getCurrentUser, logoutUser } from '../modules/auth.js'
import { getServices, getAppointmentsWithDetails, getClients, getProfile, createService, updateAppointmentStatus, uploadProfilePicture, updateProfile } from '../services/supabase.js'

const logoutBtn = document.getElementById('logoutBtn')
const userEmail = document.getElementById('userEmail')

let currentUser = null
let currentProfile = null

// SIMPLE AUTH CHECK - NO LISTENERS
async function checkAuth() {
  try {
    console.log('📊 DASHBOARD: Checking auth...')
    currentUser = await getCurrentUser()

    if (!currentUser) {
      console.log('📊 DASHBOARD: No user, redirecting to login')
      window.location.href = 'login.html'
      return
    }

    const type = currentUser.user_metadata?.account_type
    console.log('📊 DASHBOARD: User type:', type)

    // Only business owners and admins can view this page
    if (type !== 'business' && type !== 'admin') {
      console.log('📊 DASHBOARD: Not business owner, redirecting to booking')
      window.location.href = 'booking.html'
      return
    }

    // Set email
    userEmail.textContent = currentUser.email

    // Load profile data if business owner
    if (type === 'business') {
      currentProfile = await getProfile(currentUser.id)
      console.log('📊 DASHBOARD: Profile loaded:', currentProfile?.business_name)

      // Update profile display
      if (document.getElementById('businessName')) {
        document.getElementById('businessName').textContent = currentProfile?.business_name || 'Not set'
      }

      // Load dashboard data
      await loadDashboardData()
    }

    console.log('📊 DASHBOARD: Auth OK - Page loaded')

  } catch (error) {
    console.error('📊 DASHBOARD: Auth error:', error)
    window.location.href = 'login.html'
  }
}

// Load dashboard statistics
async function loadDashboardData() {
  try {
    const services = await getServices(currentProfile.id)
    const clients = await getClients(currentProfile.id)
    const appointments = await getAppointmentsWithDetails(currentProfile.id)

    document.getElementById('totalServices').textContent = services?.length || 0
    document.getElementById('totalClients').textContent = clients?.length || 0
    document.getElementById('totalAppointments').textContent = appointments?.length || 0

    // This month's appointments
    const now = new Date()
    const thisMonth = appointments?.filter(a => {
      const d = new Date(a.scheduled_at)
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
    }) || []
    document.getElementById('thisMonthAppointments').textContent = thisMonth.length

  } catch (error) {
    console.error('📊 DASHBOARD: Failed to load data:', error)
  }
}

// Logout handler
logoutBtn.addEventListener('click', async () => {
  try {
    console.log('📊 DASHBOARD: Logging out...')
    await logoutUser()
    window.location.href = 'login.html'
  } catch (error) {
    console.error('📊 DASHBOARD: Logout error:', error)
  }
})

// Start auth check when page loads
console.log('📊 DASHBOARD: Page loaded, starting auth check...')
checkAuth()

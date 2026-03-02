import { getCurrentUser, logoutUser } from '../modules/auth.js'
import { supabase } from '../services/supabase.js'

const userEmail = document.getElementById('userEmail')
const logoutBtn = document.getElementById('logoutBtn')
const errorAlert = document.getElementById('errorAlert')
const errorMessage = document.getElementById('errorMessage')
const successAlert = document.getElementById('successAlert')
const successMessage = document.getElementById('successMessage')

let currentUser = null
let currentProfile = null

// Navigation tabs
document.querySelectorAll('[data-tab]').forEach(button => {
  button.addEventListener('click', (e) => {
    const tab = e.target.getAttribute('data-tab') || e.target.closest('[data-tab]').getAttribute('data-tab')
    switchTab(tab)
  })
})

function switchTab(tabName) {
  // Hide all tabs
  document.querySelectorAll('.tab-content').forEach(tab => {
    tab.classList.remove('active')
  })
  // Remove active from buttons
  document.querySelectorAll('[data-tab]').forEach(btn => {
    btn.classList.remove('active')
  })
  
  // Show selected tab
  document.getElementById(tabName).classList.add('active')
  document.querySelector(`[data-tab="${tabName}"]`).classList.add('active')
  
  // Load data for the tab
  if (tabName === 'businesses') {
    loadBusinesses()
  } else if (tabName === 'appointments') {
    loadAllAppointments()
  } else if (tabName === 'users') {
    loadAllUsers()
  } else if (tabName === 'settings') {
    loadSettings()
  }
}

// Check authentication - must be admin
async function checkAuth() {
  try {
    currentUser = await getCurrentUser()
    if (!currentUser) {
      window.location.href = 'login.html'
      return
    }

    // Check if user is admin
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', currentUser.id)
      .single()

    if (error || !profile || profile.account_type !== 'admin') {
      showError('You do not have admin access. Redirecting...')
      setTimeout(() => {
        // Redirect based on account type
        const accountType = profile?.account_type || 'client'
        window.location.href = accountType === 'business' ? 'dashboard.html' : 'booking.html'
      }, 2000)
      return
    }

    currentProfile = profile
    userEmail.textContent = currentUser.email
    
    // Load initial data
    await loadBusinesses()
  } catch (error) {
    console.error('Auth check failed:', error)
    if (!currentUser) {
      showError('Authentication failed. Please login again.')
      setTimeout(() => {
        window.location.href = 'login.html'
      }, 2000)
    }
  }
}

// Load all businesses
async function loadBusinesses() {
  try {
    const { data: businesses, error } = await supabase
      .from('profiles')
      .select('id, email, business_name, business_type, phone, created_at')
      .eq('account_type', 'business')
      .order('created_at', { ascending: false })

    if (error) throw error

    const businessesList = document.getElementById('businessesList')
    
    if (!businesses || businesses.length === 0) {
      businessesList.innerHTML = '<div class="col-12 text-center text-muted"><p>No businesses found</p></div>'
      return
    }

    businessesList.innerHTML = businesses.map(business => `
      <div class="col-md-6 col-lg-4 mb-3">
        <div class="card h-100">
          <div class="card-body">
            <h5 class="card-title">${business.business_name || 'N/A'}</h5>
            <p class="card-text text-muted small">${business.business_type || '-'}</p>
            <p class="mb-2"><small><strong>Email:</strong> ${business.email}</small></p>
            <p class="mb-2"><small><strong>Phone:</strong> ${business.phone || 'N/A'}</small></p>
            <p class="mb-3"><small><strong>Joined:</strong> ${new Date(business.created_at).toLocaleDateString()}</small></p>
            <div class="btn-group" role="group" style="width: 100%;">
              <button type="button" class="btn btn-sm btn-outline-primary" onclick="viewBusinessDetails('${business.id}')">
                <i class="bi bi-eye"></i> View
              </button>
              <button type="button" class="btn btn-sm btn-outline-danger" onclick="disableBusiness('${business.id}')">
                <i class="bi bi-lock"></i> Disable
              </button>
            </div>
          </div>
        </div>
      </div>
    `).join('')
  } catch (error) {
    console.error('Failed to load businesses:', error)
    showError('Failed to load businesses')
  }
}

// View business details
async function viewBusinessDetails(businessId) {
  try {
    const { data: business, error: businessError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', businessId)
      .single()

    if (businessError) throw businessError

    const { data: services, error: servicesError } = await supabase
      .from('services')
      .select('*')
      .eq('business_id', businessId)

    if (servicesError) throw servicesError

    const { data: appointments, error: appointmentsError } = await supabase
      .from('appointments')
      .select('*')
      .eq('business_id', businessId)

    if (appointmentsError) throw appointmentsError

    alert(`
Business: ${business.business_name}
Email: ${business.email}
Type: ${business.business_type}
Phone: ${business.phone}

Services: ${services?.length || 0}
Appointments: ${appointments?.length || 0}
    `)
  } catch (error) {
    console.error('Failed to view business details:', error)
    showError('Failed to load business details')
  }
}

// Disable business
async function disableBusiness(businessId) {
  if (!confirm('Are you sure? This will disable all services and prevent new bookings.')) {
    return
  }

  try {
    const { error } = await supabase
      .from('profiles')
      .update({ account_type: 'disabled' })
      .eq('id', businessId)

    if (error) throw error

    showSuccess('Business disabled successfully')
    loadBusinesses()
  } catch (error) {
    console.error('Failed to disable business:', error)
    showError('Failed to disable business')
  }
}

// Load all appointments
async function loadAllAppointments() {
  try {
    const { data: appointments, error } = await supabase
      .from('appointments')
      .select(`
        id,
        scheduled_at,
        status,
        business_id,
        service_id,
        client_id,
        profiles!business_id(business_name),
        services(name),
        clients(full_name)
      `)
      .order('scheduled_at', { ascending: false })
      .limit(100)

    if (error) throw error

    const tbody = document.querySelector('#appointmentsTable tbody')
    
    if (!appointments || appointments.length === 0) {
      tbody.innerHTML = '<tr class="text-center text-muted"><td colspan="6">No appointments found</td></tr>'
      return
    }

    tbody.innerHTML = appointments.map(apt => `
      <tr>
        <td>${apt.profiles?.business_name || 'N/A'}</td>
        <td>${apt.clients?.full_name || 'N/A'}</td>
        <td>${apt.services?.name || 'N/A'}</td>
        <td>${new Date(apt.scheduled_at).toLocaleString()}</td>
        <td><span class="badge bg-${getStatusColor(apt.status)}">${apt.status}</span></td>
        <td>
          <button class="btn btn-sm btn-outline-secondary" onclick="cancelAppointment('${apt.id}')">
            <i class="bi bi-x"></i>
          </button>
        </td>
      </tr>
    `).join('')
  } catch (error) {
    console.error('Failed to load appointments:', error)
    showError('Failed to load appointments')
  }
}

// Cancel appointment
async function cancelAppointment(appointmentId) {
  if (!confirm('Cancel this appointment?')) {
    return
  }

  try {
    const { error } = await supabase
      .from('appointments')
      .update({ status: 'cancelled' })
      .eq('id', appointmentId)

    if (error) throw error

    showSuccess('Appointment cancelled')
    loadAllAppointments()
  } catch (error) {
    console.error('Failed to cancel appointment:', error)
    showError('Failed to cancel appointment')
  }
}

// Load all users
async function loadAllUsers() {
  try {
    const { data: profiles, error } = await supabase
      .from('profiles')
      .select('id, email, account_type, created_at')
      .order('created_at', { ascending: false })
      .limit(100)

    if (error) throw error

    const tbody = document.querySelector('#usersTable tbody')
    
    if (!profiles || profiles.length === 0) {
      tbody.innerHTML = '<tr class="text-center text-muted"><td colspan="5">No users found</td></tr>'
      return
    }

    tbody.innerHTML = profiles.map(user => `
      <tr>
        <td>${user.email}</td>
        <td><span class="badge bg-${user.account_type === 'admin' ? 'danger' : user.account_type === 'business' ? 'primary' : 'secondary'}">${user.account_type}</span></td>
        <td>${new Date(user.created_at).toLocaleDateString()}</td>
        <td><span class="badge bg-success">Active</span></td>
        <td>
          <button class="btn btn-sm btn-outline-danger" onclick="lockUser('${user.id}')">
            <i class="bi bi-lock"></i>
          </button>
        </td>
      </tr>
    `).join('')
  } catch (error) {
    console.error('Failed to load users:', error)
    showError('Failed to load users')
  }
}

// Lock user
async function lockUser(userId) {
  if (!confirm('Lock this user? They will not be able to login.')) {
    return
  }

  try {
    const { error } = await supabase
      .from('profiles')
      .update({ account_type: 'locked' })
      .eq('id', userId)

    if (error) throw error

    showSuccess('User locked successfully')
    loadAllUsers()
  } catch (error) {
    console.error('Failed to lock user:', error)
    showError('Failed to lock user')
  }
}

// Load settings
async function loadSettings() {
  try {
    // Count businesses
    const { count: businessCount, error: businessError } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('account_type', 'business')

    // Count users
    const { count: userCount, error: userError } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })

    // Count appointments
    const { count: appointmentCount, error: appointmentError } = await supabase
      .from('appointments')
      .select('*', { count: 'exact', head: true })

    if (businessError || userError || appointmentError) {
      throw new Error('Failed to load statistics')
    }

    document.getElementById('adminEmail').textContent = currentUser?.email || '-'
    document.getElementById('totalBusinesses').textContent = businessCount || 0
    document.getElementById('totalUsers').textContent = userCount || 0
    document.getElementById('totalAppointments').textContent = appointmentCount || 0
  } catch (error) {
    console.error('Failed to load settings:', error)
    showError('Failed to load settings')
  }
}

// Helper functions
function getStatusColor(status) {
  switch (status) {
    case 'pending': return 'warning'
    case 'confirmed': return 'success'
    case 'cancelled': return 'danger'
    case 'completed': return 'info'
    default: return 'secondary'
  }
}

function showError(message) {
  errorMessage.textContent = message
  errorAlert.style.display = 'block'
  setTimeout(() => {
    errorAlert.style.display = 'none'
  }, 4000)
}

function showSuccess(message) {
  successMessage.textContent = message
  successAlert.style.display = 'block'
  setTimeout(() => {
    successAlert.style.display = 'none'
  }, 3000)
}

// Logout
logoutBtn.addEventListener('click', async () => {
  try {
    await logoutUser()
    window.location.href = 'login.html'
  } catch (error) {
    showError('Failed to logout')
  }
})

// Search businesses
document.getElementById('businessSearch')?.addEventListener('input', (e) => {
  const searchTerm = e.target.value.toLowerCase()
  document.querySelectorAll('#businessesList .card').forEach(card => {
    const text = card.textContent.toLowerCase()
    card.parentElement.style.display = text.includes(searchTerm) ? '' : 'none'
  })
})

// Initialize
checkAuth()

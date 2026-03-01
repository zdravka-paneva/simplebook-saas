import { getCurrentUser, logoutUser, onAuthStateChange } from '../modules/auth.js'
import { getServices, getAppointmentsWithDetails, getClients, getProfile, createService, updateAppointmentStatus } from '../services/supabase.js'

const logoutBtn = document.getElementById('logoutBtn')
const userEmail = document.getElementById('userEmail')
const overviewTab = document.getElementById('overviewTab')
const appointmentsTab = document.getElementById('appointmentsTab')
const servicesTab = document.getElementById('servicesTab')
const clientsTab = document.getElementById('clientsTab')

let currentUser = null
let currentProfile = null

// Auth state watcher
onAuthStateChange((session) => {
  if (!session) {
    window.location.href = 'login.html'
  }
})

// Check authentication on page load
async function checkAuth() {
  try {
    currentUser = await getCurrentUser()
    if (!currentUser) {
      window.location.href = 'login.html'
      return
    }

    // Check if user is a business owner
    const accountType = currentUser.user_metadata?.account_type
    if (accountType !== 'business') {
      // This is a client, redirect to booking page
      window.location.href = 'booking.html'
      return
    }

    // Get user profile
    currentProfile = await getProfile(currentUser.id)
    
    // Display user email and profile info
    userEmail.textContent = currentUser.email
    if (document.getElementById('profileEmail')) {
      document.getElementById('profileEmail').textContent = currentUser.email
    }
    if (document.getElementById('businessName')) {
      document.getElementById('businessName').textContent = currentProfile?.business_name || 'Not set'
    }

    // Set member since date
    const joinedDate = new Date(currentUser.created_at).toLocaleDateString()
    if (document.getElementById('memberSince')) {
      document.getElementById('memberSince').textContent = joinedDate
    }

    // Load dashboard data
    await loadDashboardData()
  } catch (error) {
    console.error('Auth check failed:', error)
    window.location.href = 'login.html'
  }
}

// Load dashboard data
async function loadDashboardData() {
  try {
    // Get services for this business
    const services = await getServices(currentProfile.id)
    document.getElementById('totalServices').textContent = services?.length || 0

    // Get clients for this business
    const clients = await getClients(currentProfile.id)
    document.getElementById('totalClients').textContent = clients?.length || 0

    // Get appointments
    const appointments = await getAppointmentsWithDetails(currentProfile.id)
    document.getElementById('totalAppointments').textContent = appointments?.length || 0

    // Count this month's appointments
    const now = new Date()
    const thisMonthAppts = appointments?.filter(appt => {
      const apptDate = new Date(appt.scheduled_at)
      return apptDate.getMonth() === now.getMonth() && apptDate.getFullYear() === now.getFullYear()
    }) || []
    document.getElementById('thisMonthAppointments').textContent = thisMonthAppts.length

    // Populate recent appointments
    populateAppointments(appointments?.slice(0, 5) || [])

    // Populate service dropdown in appointment modal
    const serviceSelect = document.getElementById('apptService')
    if (serviceSelect && services) {
      // Clear existing options
      serviceSelect.innerHTML = '<option value="">Select a service...</option>'
      services.forEach(service => {
        const option = document.createElement('option')
        option.value = service.id
        option.textContent = `${service.name} (${service.duration_minutes} min - $${service.price})`
        serviceSelect.appendChild(option)
      })
    }

    // Populate services list
    populateServices(services || [])

    // Populate clients list
    populateClients(clients || [])
  } catch (error) {
    console.error('Failed to load dashboard data:', error)
  }
}

// Populate appointments table
function populateAppointments(appointments) {
  const tableBody = document.getElementById('appointmentsTableBody')
  if (!tableBody) return

  if (appointments.length === 0) {
    tableBody.innerHTML = '<tr><td colspan="5" class="text-center text-muted py-4">No appointments yet.</td></tr>'
    return
  }

  tableBody.innerHTML = appointments.map(appt => {
    const apptDate = new Date(appt.scheduled_at)
    const dateStr = apptDate.toLocaleDateString()
    const timeStr = apptDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    const statusBadge = `<span class="badge bg-${appt.status === 'confirmed' ? 'success' : appt.status === 'pending' ? 'warning' : appt.status === 'completed' ? 'info' : 'danger'}">${appt.status}</span>`
    
    return `
      <tr>
        <td>${appt.clients?.full_name || 'Unknown'}</td>
        <td>${appt.services?.name || 'Unknown'}</td>
        <td>${dateStr} ${timeStr}</td>
        <td>${statusBadge}</td>
        <td>
          <button class="btn btn-sm btn-outline-primary" onclick="editAppointment('${appt.id}')">Edit</button>
        </td>
      </tr>
    `
  }).join('')
}

// Populate services list
function populateServices(services) {
  const servicesList = document.getElementById('servicesTableBody')
  if (!servicesList) return

  if (services.length === 0) {
    servicesList.innerHTML = '<tr><td colspan="6" class="text-center text-muted py-4">No services yet. Add one to get started.</td></tr>'
    return
  }

  servicesList.innerHTML = services.map(service => `
    <tr>
      <td>${service.name}</td>
      <td>${service.description || '-'}</td>
      <td>${service.duration_minutes} min</td>
      <td>$${service.price}</td>
      <td>
        <span class="badge bg-${service.is_active ? 'success' : 'secondary'}">${service.is_active ? 'Active' : 'Inactive'}</span>
      </td>
      <td>
        <button class="btn btn-sm btn-outline-primary" onclick="editService('${service.id}')">Edit</button>
        <button class="btn btn-sm btn-outline-danger" onclick="deleteService('${service.id}')">Delete</button>
      </td>
    </tr>
  `).join('')
}

// Populate clients list
function populateClients(clients) {
  const clientsList = document.getElementById('clientsTableBody')
  if (!clientsList) return

  if (clients.length === 0) {
    clientsList.innerHTML = '<tr><td colspan="5" class="text-center text-muted py-4">No clients yet.</td></tr>'
    return
  }

  clientsList.innerHTML = clients.map(client => {
    const joinedDate = new Date(client.created_at).toLocaleDateString()
    return `
      <tr>
        <td>${client.full_name}</td>
        <td>${client.email}</td>
        <td>${client.phone || '-'}</td>
        <td><span class="badge bg-info">0</span></td>
        <td>${joinedDate}</td>
      </tr>
    `
  }).join('')
}

// Tab switching
function showSection(sectionId) {
  // Hide all sections
  document.querySelectorAll('.content-section').forEach(section => {
    section.style.display = 'none'
  })

  // Remove active class from tabs
  document.querySelectorAll('.list-group-item').forEach(tab => {
    tab.classList.remove('active')
  })

  // Show selected section
  document.getElementById(sectionId).style.display = 'block'
}

// Tab event listeners
overviewTab.addEventListener('click', (e) => {
  e.preventDefault()
  showSection('overviewSection')
  overviewTab.classList.add('active')
})

appointmentsTab.addEventListener('click', (e) => {
  e.preventDefault()
  showSection('appointmentsSection')
  appointmentsTab.classList.add('active')
})

servicesTab.addEventListener('click', (e) => {
  e.preventDefault()
  showSection('servicesSection')
  servicesTab.classList.add('active')
})

clientsTab.addEventListener('click', (e) => {
  e.preventDefault()
  showSection('clientsSection')
  clientsTab.classList.add('active')
})

// Logout
logoutBtn.addEventListener('click', async (e) => {
  e.preventDefault()
  try {
    await logoutUser()
    window.location.href = 'index.html'
  } catch (error) {
    console.error('Logout failed:', error)
  }
})

// Add Service Form
const addServiceForm = document.getElementById('addServiceForm')
if (addServiceForm) {
  addServiceForm.addEventListener('submit', async (e) => {
    e.preventDefault()
    
    const serviceName = document.getElementById('serviceName')?.value
    const serviceDescription = document.getElementById('serviceDescription')?.value
    const servicePrice = document.getElementById('servicePrice')?.value
    const serviceDuration = document.getElementById('serviceDuration')?.value

    if (!serviceName || !servicePrice || !serviceDuration) {
      alert('Please fill in required fields')
      return
    }

    try {
      await createService({
        business_id: currentProfile.id,
        name: serviceName,
        description: serviceDescription,
        price: parseFloat(servicePrice),
        duration_minutes: parseInt(serviceDuration),
        is_active: true
      })

      // Reset form and reload
      addServiceForm.reset()
      await loadDashboardData()
      alert('Service added successfully!')
    } catch (error) {
      console.error('Failed to add service:', error)
      alert('Failed to add service: ' + error.message)
    }
  })
}

// Initialize on page load
checkAuth()

  })

  // Reset form
  addServiceForm.reset()

  // Close modal
  const modal = bootstrap.Modal.getInstance(document.getElementById('addServiceModal'))
  modal.hide()

  // Show success (mock)
  alert('Service added successfully!')
})

// Add Appointment Form
const addAppointmentForm = document.getElementById('addAppointmentForm')
addAppointmentForm.addEventListener('submit', async (e) => {
  e.preventDefault()

  const clientName = document.getElementById('apptClientName').value
  const serviceId = document.getElementById('apptService').value
  const appointmentTime = document.getElementById('apptDate').value
  const status = document.getElementById('apptStatus').value

  // Mock appointment creation
  console.log('Adding appointment:', {
    clientName,
    serviceId,
    appointmentTime,
    status
  })

  // Reset form
  addAppointmentForm.reset()

  // Close modal
  const modal = bootstrap.Modal.getInstance(document.getElementById('addAppointmentModal'))
  modal.hide()

  // Show success (mock)
  alert('Appointment created successfully!')
})

// Initialize on page load
checkAuth()

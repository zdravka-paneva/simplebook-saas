import { getCurrentUser, logoutUser, onAuthStateChange } from '../modules/auth.js'
import { getServices } from '../services/supabase.js'

const logoutBtn = document.getElementById('logoutBtn')
const userEmail = document.getElementById('userEmail')
const overviewTab = document.getElementById('overviewTab')
const appointmentsTab = document.getElementById('appointmentsTab')
const servicesTab = document.getElementById('servicesTab')
const clientsTab = document.getElementById('clientsTab')

let currentUser = null

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

    // Display user email
    userEmail.textContent = currentUser.email
    document.getElementById('profileEmail').textContent = currentUser.email

    // Set member since date
    const joinedDate = new Date(currentUser.created_at).toLocaleDateString()
    document.getElementById('memberSince').textContent = joinedDate

    // Load dashboard data
    loadDashboardData()
  } catch (error) {
    console.error('Auth check failed:', error)
    window.location.href = 'login.html'
  }
}

// Load dashboard data
async function loadDashboardData() {
  try {
    // Get services
    const services = await getServices(currentUser.id)
    document.getElementById('totalServices').textContent = services?.length || 0

    // Mock data for now
    document.getElementById('totalAppointments').textContent = '12'
    document.getElementById('totalClients').textContent = '8'
    document.getElementById('thisMonthAppointments').textContent = '5'

    // Populate service dropdown in appointment modal
    const serviceSelect = document.getElementById('apptService')
    if (services) {
      services.forEach(service => {
        const option = document.createElement('option')
        option.value = service.id
        option.textContent = service.name
        serviceSelect.appendChild(option)
      })
    }
  } catch (error) {
    console.error('Failed to load dashboard data:', error)
  }
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

  // Add active class to clicked tab
  event.target.classList.add('active')
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
addServiceForm.addEventListener('submit', async (e) => {
  e.preventDefault()
  
  const serviceName = document.getElementById('serviceName').value
  const serviceDescription = document.getElementById('serviceDescription').value
  const servicePrice = document.getElementById('servicePrice').value
  const serviceDuration = document.getElementById('serviceDuration').value

  // Mock service addition
  console.log('Adding service:', {
    name: serviceName,
    description: serviceDescription,
    price: servicePrice,
    duration: serviceDuration
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

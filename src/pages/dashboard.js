import { getCurrentUser, logoutUser } from '../modules/auth.js'
import { getServices, getAppointmentsWithDetails, getClients, getProfile, getOrCreateProfile, createService, updateAppointmentStatus, uploadProfilePicture, updateProfile, uploadBusinessPhoto } from '../services/supabase.js'

const logoutBtn = document.getElementById('logoutBtn')
const userEmail = document.getElementById('userEmail')
const overviewTab = document.getElementById('overviewTab')
const appointmentsTab = document.getElementById('appointmentsTab')
const servicesTab = document.getElementById('servicesTab')
const clientsTab = document.getElementById('clientsTab')
const businessProfileTab = document.getElementById('businessProfileTab')

let currentUser = null
let currentProfile = null
let allAppointmentsData = []  // full list cached for filter tabs
let currentApptFilter = 'pending' // default to pending

// SIMPLE: Just check auth and load data - NO LISTENERS
async function checkAuth() {
  try {
    console.log('📊 DASHBOARD: Checking auth...')
    currentUser = await getCurrentUser()
    
    if (!currentUser) {
      console.log('📊 DASHBOARD: No user, redirecting to login')
      window.location.href = 'login.html'
      return
    }

    const accountType = currentUser.user_metadata?.account_type
    console.log('📊 DASHBOARD: User type:', accountType)
    
    if (accountType !== 'business' && accountType !== 'admin') {
      console.log('📊 DASHBOARD: Not business owner, redirecting to booking')
      window.location.href = 'booking.html'
      return
    }

    console.log('📊 DASHBOARD: Auth OK!')

    // Get user profile, create it if missing
    currentProfile = await getProfile(currentUser.id)
    if (!currentProfile) {
      console.log('📊 DASHBOARD: No profile found, creating one...')
      currentProfile = await getOrCreateProfile(currentUser.id, {
        email: currentUser.email,
        account_type: currentUser.user_metadata?.account_type || 'business',
        business_name: currentUser.user_metadata?.business_name || '',
        business_type: currentUser.user_metadata?.business_type || '',
        full_name: currentUser.user_metadata?.full_name || ''
      })
    }
    console.log('📊 DASHBOARD: Profile loaded:', currentProfile?.business_name)
    
    // Display user email and profile info
    userEmail.textContent = currentUser.email
    if (document.getElementById('profileEmail')) {
      document.getElementById('profileEmail').textContent = currentUser.email
    }
    if (document.getElementById('profileEmailDisplay')) {
      document.getElementById('profileEmailDisplay').textContent = currentUser.email
    }
    if (document.getElementById('businessName')) {
      document.getElementById('businessName').textContent = currentProfile?.business_name || 'Not set'
    }

    // Display profile picture if exists
    if (currentProfile?.profile_image_url) {
      const profilePicImg = document.getElementById('profilePicture')
      const profileInitialsDiv = document.getElementById('profileInitials')
      if (profilePicImg && profileInitialsDiv) {
        profilePicImg.src = currentProfile.profile_image_url
        profilePicImg.style.display = 'block'
        profileInitialsDiv.style.display = 'none'
        document.getElementById('removePictureBtn').style.display = 'inline-block'
      }
    }

    // Set member since date
    const joinedDate = new Date(currentUser.created_at).toLocaleDateString()
    if (document.getElementById('memberSince')) {
      document.getElementById('memberSince').textContent = joinedDate
    }

    // Load dashboard data
    await loadDashboardData()

    // Show booking link in overview
    updateBookingLinkDisplay()

  } catch (error) {
    console.error('📊 DASHBOARD: Auth check failed:', error)
    // Only redirect on auth errors, not general data-loading errors
    if (!currentUser) {
      window.location.href = 'login.html'
    }
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
    allAppointmentsData = appointments || []
    document.getElementById('totalAppointments').textContent = allAppointmentsData.length

    // Count this month's appointments
    const now = new Date()
    const thisMonthAppts = allAppointmentsData.filter(appt => {
      const apptDate = new Date(appt.scheduled_at)
      return apptDate.getMonth() === now.getMonth() && apptDate.getFullYear() === now.getFullYear()
    })
    document.getElementById('thisMonthAppointments').textContent = thisMonthAppts.length

    // Pending count & banner
    const pendingAppts = allAppointmentsData.filter(a => a.status === 'pending')
    const banner = document.getElementById('pendingRequestsBanner')
    const pendingBadge = document.getElementById('pendingCountBadge')
    const apptAlert = document.getElementById('apptPendingAlert')
    const apptPendingCount = document.getElementById('apptPendingCount')
    if (banner && pendingBadge) {
      if (pendingAppts.length > 0) {
        pendingBadge.textContent = pendingAppts.length
        banner.classList.remove('d-none')
      } else {
        banner.classList.add('d-none')
      }
    }
    if (apptAlert && apptPendingCount) {
      if (pendingAppts.length > 0) {
        apptPendingCount.textContent = pendingAppts.length
        apptAlert.classList.remove('d-none')
      } else {
        apptAlert.classList.add('d-none')
      }
    }

    // Populate recent appointments (overview)
    populateAppointments(allAppointmentsData.slice(0, 5))

    // Populate full appointments tab
    populateAppointmentsTab()

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

// Populate appointments table (overview - last 5)
function populateAppointments(appointments) {
  const tableBody = document.getElementById('appointmentsTableBody')
  if (!tableBody) return

  if (appointments.length === 0) {
    tableBody.innerHTML = '<tr><td colspan="5" class="text-center text-muted py-4">No appointments yet. Create one or wait for client bookings.</td></tr>'
    return
  }

  tableBody.innerHTML = appointments.map(appt => {
    const apptDate = new Date(appt.scheduled_at)
    const dateStr = apptDate.toLocaleDateString()
    const timeStr = apptDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    const statusBadge = `<span class="badge bg-${appt.status === 'confirmed' ? 'success' : appt.status === 'pending' ? 'warning text-dark' : appt.status === 'completed' ? 'info' : 'danger'}">${appt.status}</span>`

    let actionBtn = ''
    if (appt.status === 'pending') {
      actionBtn = `<button class="btn btn-sm btn-success" onclick="confirmAppointment('${appt.id}')">Confirm</button>`
    }

    return `
      <tr>
        <td>${appt.clients?.full_name || 'Unknown'}</td>
        <td>${appt.services?.name || 'Unknown'}</td>
        <td>${dateStr} ${timeStr}</td>
        <td>${statusBadge}</td>
        <td>${actionBtn}</td>
      </tr>
    `
  }).join('')
}

// ─── Full Appointments Tab ────────────────────────────────────────────────────

function populateAppointmentsTab() {
  const tbody = document.getElementById('allAppointmentsTableBody')
  if (!tbody) return

  let filtered = allAppointmentsData
  if (currentApptFilter !== 'all') {
    filtered = allAppointmentsData.filter(a => a.status === currentApptFilter)
  }

  if (filtered.length === 0) {
    const labels = { pending: 'pending', confirmed: 'confirmed', completed: 'completed', cancelled: 'cancelled', all: '' }
    const label = currentApptFilter !== 'all' ? `No ${labels[currentApptFilter]} appointments.` : 'No appointments yet.'
    tbody.innerHTML = `<tr><td colspan="6" class="text-center text-muted py-4">${label}</td></tr>`
    return
  }

  tbody.innerHTML = filtered.map(appt => {
    const apptDate = new Date(appt.scheduled_at)
    const dateStr = apptDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
    const timeStr = apptDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })

    const statusColors = { confirmed: 'success', pending: 'warning', completed: 'info', cancelled: 'danger' }
    const statusBadge = `<span class="badge bg-${statusColors[appt.status] || 'secondary'}${appt.status === 'pending' ? ' text-dark' : ''}">${appt.status}</span>`

    let actions = ''
    if (appt.status === 'pending') {
      actions = `
        <button class="btn btn-success btn-sm me-1" onclick="confirmAppointment('${appt.id}')">✅ Confirm</button>
        <button class="btn btn-outline-danger btn-sm" onclick="cancelDashboardAppointment('${appt.id}')">✖ Cancel</button>
      `
    } else if (appt.status === 'confirmed') {
      actions = `
        <button class="btn btn-info btn-sm me-1 text-white" onclick="completeAppointment('${appt.id}')">✔ Complete</button>
        <button class="btn btn-outline-danger btn-sm" onclick="cancelDashboardAppointment('${appt.id}')">✖ Cancel</button>
      `
    } else {
      actions = '<span class="text-muted small">—</span>'
    }

    return `
      <tr>
        <td>
          <div class="fw-medium">${appt.clients?.full_name || 'Unknown'}</div>
          <div class="text-muted small">${appt.clients?.email || ''}</div>
        </td>
        <td>
          <div>${appt.services?.name || 'Unknown'}</div>
          <div class="text-muted small">${appt.services?.duration_minutes || 0} min · $${appt.services?.price || 0}</div>
        </td>
        <td>
          <div>${dateStr}</div>
          <div class="text-muted small">${timeStr}</div>
        </td>
        <td><span class="text-muted small">${appt.notes || '—'}</span></td>
        <td>${statusBadge}</td>
        <td class="text-nowrap">${actions}</td>
      </tr>
    `
  }).join('')
}

// ─── Appointment Actions (called from inline HTML onclick) ────────────────────

window.confirmAppointment = async function(id) {
  try {
    await updateAppointmentStatus(id, 'confirmed')
    await loadDashboardData()
    showDashboardToast('Appointment confirmed! The client will be notified.', 'success')
  } catch (err) {
    console.error('Confirm failed:', err)
    showDashboardToast('Failed to confirm: ' + err.message, 'danger')
  }
}

window.cancelDashboardAppointment = async function(id) {
  if (!confirm('Cancel this appointment?')) return
  try {
    await updateAppointmentStatus(id, 'cancelled')
    await loadDashboardData()
    showDashboardToast('Appointment cancelled.', 'warning')
  } catch (err) {
    console.error('Cancel failed:', err)
    showDashboardToast('Failed to cancel: ' + err.message, 'danger')
  }
}

window.completeAppointment = async function(id) {
  try {
    await updateAppointmentStatus(id, 'completed')
    await loadDashboardData()
    showDashboardToast('Appointment marked as completed!', 'success')
  } catch (err) {
    console.error('Complete failed:', err)
    showDashboardToast('Failed to update: ' + err.message, 'danger')
  }
}

window.editAppointment = function() {
  // Jump to appointments tab showing all appointments
  showSection('appointmentsSection')
  document.querySelectorAll('.list-group-item').forEach(t => t.classList.remove('active'))
  appointmentsTab.classList.add('active')
  currentApptFilter = 'all'
  syncFilterButtons()
  populateAppointmentsTab()
}

// Navigate to appointments tab and show pending filter
window.reviewPendingAppointments = function() {
  showSection('appointmentsSection')
  appointmentsTab.classList.add('active')
  document.querySelectorAll('.list-group-item').forEach(t => t.classList.remove('active'))
  appointmentsTab.classList.add('active')
  // Activate pending filter
  currentApptFilter = 'pending'
  syncFilterButtons()
  populateAppointmentsTab()
}

// ─── Toast helper for dashboard ───────────────────────────────────────────────

function showDashboardToast(message, type = 'success') {
  // Try existing toast element, or use alert fallback
  const toastEl = document.getElementById('dashboardToast')
  if (toastEl) {
    const toastBody = document.getElementById('dashboardToastBody')
    const colors = { success: 'bg-success', danger: 'bg-danger', warning: 'bg-warning text-dark', info: 'bg-info' }
    toastEl.className = `toast align-items-center text-white border-0 ${colors[type] || 'bg-success'}`
    if (type === 'warning') toastEl.classList.remove('text-white')
    if (toastBody) toastBody.textContent = message
    const bsToast = new bootstrap.Toast(toastEl, { delay: 4000 })
    bsToast.show()
  } else {
    // Fallback: brief banner
    const banner = document.createElement('div')
    const colors = { success: '#d1e7dd', danger: '#f8d7da', warning: '#fff3cd', info: '#cff4fc' }
    banner.style.cssText = `position:fixed;top:16px;right:16px;z-index:9999;padding:12px 20px;border-radius:8px;background:${colors[type]||colors.success};box-shadow:0 4px 12px rgba(0,0,0,.15);font-weight:500;max-width:350px;`
    banner.textContent = message
    document.body.appendChild(banner)
    setTimeout(() => banner.remove(), 4000)
  }
}

// Sync filter button visual state
function syncFilterButtons() {
  const outlineCls = { pending: 'btn-outline-warning', confirmed: 'btn-outline-success', all: 'btn-outline-secondary', completed: 'btn-outline-info', cancelled: 'btn-outline-danger' }
  const activeCls  = { pending: 'btn-warning',         confirmed: 'btn-success',         all: 'btn-secondary',         completed: 'btn-info',         cancelled: 'btn-danger' }
  document.querySelectorAll('.appt-filter-btn').forEach(btn => {
    const f = btn.dataset.filter
    btn.className = `btn btn-sm appt-filter-btn ${f === currentApptFilter ? activeCls[f] + ' fw-medium' : outlineCls[f]}`
  })
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
  document.querySelectorAll('.list-group-item').forEach(t => t.classList.remove('active'))
  appointmentsTab.classList.add('active')
  populateAppointmentsTab()
})

// Filter buttons inside the appointments section (delegated to document)
document.addEventListener('click', (e) => {
  const btn = e.target.closest('.appt-filter-btn')
  if (!btn) return
  currentApptFilter = btn.dataset.filter
  syncFilterButtons()
  populateAppointmentsTab()
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

businessProfileTab.addEventListener('click', (e) => {
  e.preventDefault()
  showSection('businessProfileSection')
  businessProfileTab.classList.add('active')
  loadBusinessProfileForm()
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

// ─── Business Profile ────────────────────────────────────────────────────────

// Build the public booking URL for this business
function getBookingUrl() {
  return `${window.location.origin}/booking.html?business=${currentProfile?.id}`
}

// Update the visible link in the overview banner
function updateBookingLinkDisplay() {
  if (!currentProfile?.id) return
  const url = getBookingUrl()
  const display = document.getElementById('bookingLinkDisplay')
  const openBtn = document.getElementById('openBookingLinkBtn')
  if (display) display.textContent = url
  if (openBtn) openBtn.href = url
}

// Copy button in overview banner
const copyOverviewBtn = document.getElementById('copyBookingLinkOverviewBtn')
if (copyOverviewBtn) {
  copyOverviewBtn.addEventListener('click', () => {
    navigator.clipboard.writeText(getBookingUrl()).then(() => {
      copyOverviewBtn.textContent = '✅ Copied!'
      setTimeout(() => { copyOverviewBtn.textContent = '📋 Copy Link' }, 2500)
    })
  })
}

// Populate the business profile form with current data
function loadBusinessProfileForm() {
  if (!currentProfile) return
  document.getElementById('bpBusinessName').value = currentProfile.business_name || ''
  document.getElementById('bpBusinessType').value = currentProfile.business_type || ''
  document.getElementById('bpCity').value         = currentProfile.city || ''
  document.getElementById('bpAddress').value      = currentProfile.address || ''
  document.getElementById('bpPhone').value        = currentProfile.phone || ''
  document.getElementById('bpDescription').value  = currentProfile.business_description || ''

  // Show business photo if exists
  const preview = document.getElementById('businessPhotoPreview')
  const placeholder = document.getElementById('businessPhotoPlaceholder')
  const removeBtn = document.getElementById('removeBusinessPhotoBtn')
  if (currentProfile.business_image_url) {
    preview.src = currentProfile.business_image_url
    preview.style.display = 'block'
    placeholder.style.display = 'none'
    removeBtn.style.display = 'block'
  }
}

// Save business profile form
const businessProfileForm = document.getElementById('businessProfileForm')
if (businessProfileForm) {
  businessProfileForm.addEventListener('submit', async (e) => {
    e.preventDefault()
    const saveBtn = document.getElementById('saveProfileBtn')
    const saveText = document.getElementById('saveProfileText')
    const saveSpinner = document.getElementById('saveProfileSpinner')
    const successAlert = document.getElementById('bpSuccessAlert')
    const errorAlert = document.getElementById('bpErrorAlert')
    const errorMsg = document.getElementById('bpErrorMessage')

    saveBtn.disabled = true
    saveText.classList.add('d-none')
    saveSpinner.classList.remove('d-none')
    successAlert.classList.add('d-none')
    errorAlert.classList.add('d-none')

    try {
      const updates = {
        business_name: document.getElementById('bpBusinessName').value.trim(),
        business_type: document.getElementById('bpBusinessType').value,
        city:          document.getElementById('bpCity').value.trim(),
        address:       document.getElementById('bpAddress').value.trim(),
        phone:         document.getElementById('bpPhone').value.trim(),
        business_description: document.getElementById('bpDescription').value.trim()
      }

      if (!updates.business_name || !updates.business_type) {
        throw new Error('Business name and type are required.')
      }

      await updateProfile(currentUser.id, updates)
      if (currentProfile) {
        Object.assign(currentProfile, updates)
      } else {
        currentProfile = { ...updates }
      }

      // Update navbar display
      document.getElementById('businessName').textContent = updates.business_name

      successAlert.classList.remove('d-none')
      setTimeout(() => successAlert.classList.add('d-none'), 4000)
    } catch (error) {
      errorMsg.textContent = error.message
      errorAlert.classList.remove('d-none')
    } finally {
      saveBtn.disabled = false
      saveText.classList.remove('d-none')
      saveSpinner.classList.add('d-none')
    }
  })
}

// Copy booking link (Business Profile section)
const copyBookingLinkBtn = document.getElementById('copyBookingLinkBtn')
if (copyBookingLinkBtn) {
  copyBookingLinkBtn.addEventListener('click', () => {
    navigator.clipboard.writeText(getBookingUrl()).then(() => {
      copyBookingLinkBtn.textContent = '✅ Copied!'
      setTimeout(() => { copyBookingLinkBtn.textContent = '🔗 Copy Booking Link' }, 2500)
    })
  })
}

// ─── Business Photo Upload ────────────────────────────────────────────────────

const businessPhotoInput = document.getElementById('businessPhotoInput')
const changeBusinessPhotoBtn = document.getElementById('changeBusinessPhotoBtn')
const removeBusinessPhotoBtn = document.getElementById('removeBusinessPhotoBtn')
const businessPhotoPreview = document.getElementById('businessPhotoPreview')
const businessPhotoPlaceholder = document.getElementById('businessPhotoPlaceholder')

changeBusinessPhotoBtn.addEventListener('click', () => businessPhotoInput.click())

businessPhotoInput.addEventListener('change', async (e) => {
  const file = e.target.files[0]
  if (!file) return
  if (!currentUser) { alert('Session expired. Please refresh the page.'); return }
  if (file.size > 5 * 1024 * 1024) {
    alert('File size must be less than 5MB')
    return
  }

  // Show preview immediately
  const reader = new FileReader()
  reader.onload = (ev) => {
    businessPhotoPreview.src = ev.target.result
    businessPhotoPreview.style.display = 'block'
    businessPhotoPlaceholder.style.display = 'none'
    removeBusinessPhotoBtn.style.display = 'block'
  }
  reader.readAsDataURL(file)

  try {
    changeBusinessPhotoBtn.disabled = true
    changeBusinessPhotoBtn.textContent = '⏳ Uploading...'
    console.log('📸 Uploading business photo for user:', currentUser.id)
    const publicUrl = await uploadBusinessPhoto(currentUser.id, file)
    console.log('📸 Photo uploaded, saving URL:', publicUrl)
    await updateProfile(currentUser.id, { business_image_url: publicUrl })
    if (currentProfile) currentProfile.business_image_url = publicUrl
    businessPhotoInput.value = ''
    changeBusinessPhotoBtn.textContent = '✅ Uploaded!'
    setTimeout(() => { changeBusinessPhotoBtn.textContent = '📷 Upload Photo' }, 2500)
  } catch (err) {
    console.error('📸 Upload error full:', err)
    alert('Failed to upload photo: ' + (err?.message || JSON.stringify(err)))
    changeBusinessPhotoBtn.textContent = '📷 Upload Photo'
  } finally {
    changeBusinessPhotoBtn.disabled = false
  }
})

removeBusinessPhotoBtn.addEventListener('click', async () => {
  businessPhotoPreview.src = ''
  businessPhotoPreview.style.display = 'none'
  businessPhotoPlaceholder.style.display = 'flex'
  removeBusinessPhotoBtn.style.display = 'none'
  businessPhotoInput.value = ''
  try {
    await updateProfile(currentUser.id, { business_image_url: null })
    currentProfile.business_image_url = null
  } catch (err) {
    console.error('Failed to remove business photo:', err)
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

// ─── Profile Picture Upload ───────────────────────────────────────────────────

// Profile Picture Upload Handlers
const profilePictureInput = document.getElementById('profilePictureInput')
const changePictureBtn = document.getElementById('changePictureBtn')
const uploadPictureBtn = document.getElementById('uploadPictureBtn')
const removePictureBtn = document.getElementById('removePictureBtn')
const profilePicture = document.getElementById('profilePicture')
const profileInitials = document.getElementById('profileInitials')

changePictureBtn.addEventListener('click', () => {
  profilePictureInput.click()
})

profilePictureInput.addEventListener('change', (e) => {
  const file = e.target.files[0]
  if (!file) return

  // Validate file size (5MB max)
  if (file.size > 5 * 1024 * 1024) {
    alert('File size must be less than 5MB')
    return
  }

  // Show preview
  const reader = new FileReader()
  reader.onload = (event) => {
    profilePicture.src = event.target.result
    profilePicture.style.display = 'block'
    profileInitials.style.display = 'none'
    uploadPictureBtn.style.display = 'inline-block'
    removePictureBtn.style.display = 'inline-block'
  }
  reader.readAsDataURL(file)
})

uploadPictureBtn.addEventListener('click', async () => {
  const file = profilePictureInput.files[0]
  if (!file) return

  try {
    uploadPictureBtn.disabled = true
    uploadPictureBtn.textContent = '⏳ Uploading...'

    // Upload picture
    const publicUrl = await uploadProfilePicture(currentUser.id, file)

    // Update profile with new image URL
    await updateProfile(currentUser.id, {
      profile_image_url: publicUrl
    })

    // Store in currentProfile
    currentProfile.profile_image_url = publicUrl

    // Reset inputs
    profilePictureInput.value = ''
    uploadPictureBtn.style.display = 'none'
    uploadPictureBtn.textContent = 'Upload Picture'

    alert('Profile picture updated successfully!')
  } catch (error) {
    console.error('Error uploading picture:', error)
    alert('Failed to upload picture: ' + error.message)
  } finally {
    uploadPictureBtn.disabled = false
  }
})

removePictureBtn.addEventListener('click', () => {
  profilePictureInput.value = ''
  profilePicture.src = ''
  profilePicture.style.display = 'none'
  profileInitials.style.display = 'flex'
  uploadPictureBtn.style.display = 'none'
  removePictureBtn.style.display = 'none'
})

